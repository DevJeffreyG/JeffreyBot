const { CommandInteraction, Guild, GuildMember } = require("discord.js");

const { PetNotices } = require("./Enums");
const { Colores } = require("../resources");
const Embed = require("./Embed");

const { PetShops } = require("mongoose").models;

class Pet {
    #id;
    #doc;
    #shop;
    #user;
    #info;

    #changedHp;
    #changedHunger;

    /**
     * 
     * @param {CommandInteraction} interaction 
     * @param {Number} id 
     */
    constructor(interaction, id) {
        this.interaction = interaction;
        this.#id = id;
    }

    /**
     * @param {GuildMember} member 
     */
    setMember(member) {
        this.member = member;
        this.guild = member.guild;
        return this;
    }

    async build(doc, user) {
        this.#doc = doc;
        this.#user = user;
        this.#shop = await PetShops.getWork(this.guild?.id ?? this.interaction.guild.id);

        this.#info = this.#user.data.pets.find(x => x.id === this.#id);

        this.name = this.#info.name;
        this.shop_info = this.#shop.items.find(x => x.id === this.#info.shopId);

        this.wins = this.#info.wins;
        this.defeats = this.#info.defeats;
        this.hp = this.#info.stats.hp;
        this.hunger = this.#info.stats.hunger;
        this.stats = {
            attack: this.#info.stats.attack,
            defense: this.#info.stats.defense
        }
        this.attacks = this.#info.attacks
        this.notices = this.#info.notices;

        return this
    }

    /**
     * @param {Number} value 
     * @returns {this}
     */
    changeHunger(value) {
        this.#changedHunger = true;
        this.hunger += value;
        if (this.hunger > 100) this.hunger = 100;
        else if (this.hunger < 0) this.hunger = 0;
        return this
    }

    /**
     * @param {Number} value 
     * @returns {this}
     */
    changeHp(value) {
        this.#changedHp = true;
        this.hp += value;
        if (this.hp > this.shop_info.stats.hp) this.hp = this.shop_info.stats.hp;
        else if (this.hp < 0) this.hp = 0;
        return this
    }

    kill() {
        this.isDead = true;
        return this
    }

    /**
     * @return {Promise<void>}
     */
    async save() {
        let i = this.#user.data.pets.findIndex(x => x.id === this.#id);

        if (this.isDead) {
            this.#user.data.pets.splice(i, 1);
            return await this.#user.save();
        }

        if(this.#changedHp) {
            this.notices.halfhp = null;
            this.notices.lowhp = null;
        }

        if(this.#changedHunger) this.notices.hungry = null;

        this.#user.data.pets[i] = Object.assign(this.#user.data.pets[i], {
            name: this.name,
            wins: this.wins,
            defeats: this.defeats,
            stats: {
                hp: this.hp,
                hunger: this.hunger,
                attack: this.stats.attack,
                defense: this.stats.defense
            },
            notices: this.notices
        })

        await this.#user.save();
    }

    /**
     * @return {Promise<void>}
     */
    async notice(type) {
        switch (type) {
            case PetNotices.HalfHp:
                if (!this.notices.halfhp) {
                    await (this.member ?? this.interaction.member).send({
                        embeds: [
                            new Embed()
                                .defTitle(`⚠️ Tu mascota ${this.name} tiene la mitad de su vida`)
                                .defDesc(`Dale algo de comer para evitar que siga bajando`)
                                .defColor(Colores.nocolor)
                        ]
                    })
                    this.notices.halfhp = new Date();
                }
                break;
            case PetNotices.Dead:
                await (this.member ?? this.interaction.member).send({
                    embeds: [
                        new Embed()
                            .defDesc(`# ${this.name} ha muerto.`)
                            .defColor(Colores.rojooscuro)
                    ]
                })
                break;
            case PetNotices.LowHp:
                if (!this.notices.lowhp) {
                    await (this.member ?? this.interaction.member).send({
                        embeds: [
                            new Embed()
                                .defTitle(`⚠️ Tu mascota ${this.name} tiene muy poca vida`)
                                .defDesc(`¡Cúrala o dale de comer!`)
                                .defColor(Colores.rojo)
                        ]
                    })
                    this.notices.lowhp = new Date();
                }
                break;
            case PetNotices.Hungry:
                if(!this.notices.hungry) {
                    await (this.member ?? this.interaction.member).send({
                        embeds: [
                            new Embed()
                                .defTitle(`Tu mascota ${this.name} tiene hambre`)
                                .defDesc(`Dale de comer para evitar que llegue a 0 y **baje su vida**.`)
                                .defColor(Colores.nocolor)
                        ]
                    })
                    this.notices.hungry = new Date();
                }
                break;
        }
    }
}

module.exports = Pet;