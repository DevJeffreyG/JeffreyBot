const { CommandInteraction } = require("discord.js");

const { PetShops } = require("mongoose").models;

class Pet {
    #id;
    #doc;
    #shop;
    #user;

    /**
     * 
     * @param {CommandInteraction} interaction 
     * @param {Number} id 
     */
    constructor(interaction, id) {
        this.interaction = interaction;
        this.#id = id;
    }

    async build(doc, user) {
        this.#doc = doc;
        this.#user = user;
        this.#shop = await PetShops.getWork(this.interaction.guild.id);

        let info = this.#user.data.pets.find(x => x.id === this.#id);

        this.name = info.name;
        this.shop_info = this.#shop.items.find(x => x.id === info.shopId);

        this.wins = info.wins;
        this.defeats = info.defeats;
        this.hp = info.stats.hp;
        this.hunger = info.stats.hunger;
        this.stats = {
            attack: info.stats.attack,
            defense: info.stats.defense
        }
        this.attacks = info.attacks

        return this
    }
}

module.exports = Pet;