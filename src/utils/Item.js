const { GuildMember } = require("discord.js")
const Embed = require("./Embed");
const ErrorEmbed = require("./ErrorEmbed");
const ItemTypes = require("./enums/ItemTypes");

const { FindNewId, LimitedTime } = require("./functions");

const models = require("mongoose").models;
const { Shops, DarkShops, Users, Guilds } = models;

class Item {
    constructor(interaction, id, isDarkShop = false) {
        this.isDarkShop = isDarkShop;
        this.interaction = interaction;
        this.member = interaction.member;
        this.itemId = id;

        this.nowarns = new ErrorEmbed(interaction, {
            type: "errorFetch",
            data: {
                type: "warns",
                guide: "No existen warns vinculados a tu usuario",
            }
        })

        this.hasrole = new ErrorEmbed(interaction, {
            type: "alreadyExists",
            data: {
                action: "add role",
                existing: "El role que te da este item",
                context: "tu perfil"
            }
        })

        this.norole = new ErrorEmbed(interaction, {
            type: "doesntExist",
            data: {
                action: "remove role",
                existing: "El role que te quita este item",
                context: "tu perfil"
            }
        })
    }

    async build() {
        this.doc = await Guilds.getOrCreate(this.interaction.guild.id);

        if (this.isDarkShop) this.shop = await DarkShops.getOrCreate(this.interaction.guild.id)
        else this.shop = await Shops.getOrCreate(this.interaction.guild.id);

        this.item = this.shop.findItem(this.itemId, false);
        this.user = await Users.getOrCreate({ user_id: this.interaction.user.id, guild_id: this.interaction.guild.id });

        return this
    }

    /**
     * 
     * @param {Number} id The UseId of the item
     * @param {GuildMember} [victim = null] The member affected (darkshop)
     * @returns 
     */
    async use(id, victim = null) {
        if (!this.#verify("use")) return;

        console.log("🟢 %s está usando el item %s!", this.interaction.user.tag, this.item.name)

        const inventory = this.user.data.inventory;
        const inventoryFilter = x => x.use_id === id;

        const itemOnInventory = inventory.find(inventoryFilter);
        this.itemOnInventoryIndex = this.user.data.inventory.findIndex(inventoryFilter);

        // leer el uso y qué hace el item
        this.info = this.item.use_info;
        this.success = new Embed({ type: "success", data: { desc: this.item.reply } });

        const work = await this.#useWork(victim);

        if (work) {
            this.interaction.editReply({ embeds: [this.success] });
            console.log("🟩 Item usado con éxito.")
        }
        console.log("===========================")
    }

    async #removeItemFromInv(){
        console.log("🗑️ Eliminando %s del inventario", this.item.name)
        this.user.data.inventory.splice(this.itemOnInventoryIndex, 1);
        await this.user.save();
    }

    async #useWork(victim) {
        return new Promise(async (res) => {
            if (this.isDarkShop) {
                this.victim = await Users.getOrCreate({
                    guild_id: this.interaction.guild.id,
                    user_id: victim.id
                });
                this.memberVictim = victim;
            }

            const {
                isSub, isTemp, duration, boost_type, boost_objetive,
                boost_value, objetive, action, given
            } = this.info

            console.log("🗯️ Info del item: %s", this.info);

            this.given = given;
            this.isTemp = isTemp;
            this.duration = duration;

            let resolvable;

            switch (objetive) {
                case "warns":
                    this.given = Number(this.given);
                    if (action === "add") resolvable = this.#addWarns()
                    else resolvable = this.#removeWarns()
                    break;

                case "role":
                    if (action === "add") resolvable = this.#addRole()
                    else resolvable = this.#removeRole()
                    break;

                case "item":
                    if(action === "add") resolvable = this.#addItem()
                    else resolvable = this.#removeItem()
                    break;
            }

            res(await resolvable);
        })
    }

    // WARNS
    async #addWarns() { // solo darkshop
        console.log("🗨️ Agregando %s warn(s)", this.given);

        const warns = this.victim.warns;

        for (let i = 0; i < this.given; i++) {
            const id = await FindNewId(await Users.find(), "warns", "id");
            warns.push({ rule_id: 0, id });

            await this.victim.save()
        }

        this.#removeItemFromInv()
        return true
    }

    async #removeWarns() {
        console.log("🗨️ Eliminando %s warn(s)", this.given);
        
        const warns = this.user.warns;

        if (warns?.length === 0) {
            console.log("🔴 NO tiene warns por eliminar.")
            this.nowarns.send();
            return false;
        }

        // eliminar warn(s) random
        for (let i = 0; i < this.given; i++) {
            this.user.warns.splice(Math.floor(Math.random() * warns.length), 1); // eliminar un warn random
            await this.user.save()
        }

        this.#removeItemFromInv()
        return true;
    }

    // ROLES
    async #addRole(){
        const role = this.interaction.guild.roles.cache.find(x => x.id === this.given);
        console.log("🗨️ Agregando el role %s a %s", role.name, this.interaction.user.tag);

        if(this.member.roles.cache.find(x => x === role)){
            console.log("🔴 Ya tiene el role que da el item.")
            this.hasrole.send();
            return false;
        }

        if(this.isTemp) await LimitedTime(this.interaction.guild, this.given, this.member, this.user, this.duration);
        else this.member.roles.add(role);

        this.#removeItemFromInv()
        return true;
    }

    async #removeRole(){
        const role = this.interaction.guild.roles.cache.find(x => x.id === this.given);
        console.log("🗨️ Eliminando el role %s a %s", role.name, this.interaction.user.tag);

        if(this.member.roles.cache.find(x => x === role)){
            console.log("🔴 No tiene el role que te quita el item.")
            this.norole.send();
            return false;
        }

        else this.member.roles.remove(role);

        this.#removeItemFromInv()
        return true;
    }

    // ITEMS
    async #addItem() { // WIP (ds)
        console.log(ItemTypes.StackOverflow);
        const itemType = this.item.item_info?.type
        if(!itemType) {
            console.log("Item personalizado!")
            return false
        } else

        if(itemType === ItemTypes.StackOverflow){
            console.log("Stack overflow!")
        }
    }

    async #removeItem() {

    }

    #verify(commandName) {
        if (!this.item) {
            let bad = new ErrorEmbed(this.interaction, {
                type: "badCommand",
                data: {
                    commandName,
                    error: "ReferenceError: this.item is not defined"
                }
            })
            console.log("🟥 NO EXISTE ESE ITEM, VERIFICA LA ID");
            bad.send();
            return false;
        }

        return true;
    }
}

module.exports = Item