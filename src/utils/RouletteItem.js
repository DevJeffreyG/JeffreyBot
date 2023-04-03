const { GuildMemberRoleManager, roleMention } = require("discord.js");
const ms = require("ms")

const { LimitedTime } = require("./functions");
const { ItemObjetives, ItemTypes } = require("./Enums");
const Embed = require("./Embed");
const ErrorEmbed = require("./ErrorEmbed");

const { Users } = require("mongoose").models;

class RouletteItem {
    constructor(interaction, globalinfo) {
        console.log(globalinfo)
        this.interaction = interaction;
        this.item = globalinfo;

    }

    #embeds() {
        this.addedRole = new Embed({
            type: "success", data: {
                title: "Canjeado",
                desc: `Se agregó el role ${roleMention(this.numbers)}`,
                footer: `Había un ${this.item.prob}% de probabilidad de que esta fuera tu recompensa`
            }
        })
        this.removedRole = new Embed({
            type: "success", data: {
                title: "Canjeado",
                desc: `Se eliminó el role ${roleMention(this.numbers)}`,
                footer: `Había un ${this.item.prob}% de probabilidad de que esta fuera tu recompensa`
            }
        })
        this.addedTemp = new Embed({
            type: "success", data: {
                title: "Canjeado",
                desc: `Se agregó un Boost`,
                footer: `Había un ${this.item.prob}% de probabilidad de que esta fuera tu recompensa`
            }
        })
        this.removedTemp = new Embed({
            type: "success", data: {
                title: "Canjeado",
                desc: `Se eliminó un Boost`,
                footer: `Había un ${this.item.prob}% de probabilidad de que esta fuera tu recompensa`
            }
        })
        this.success = new Embed({
            type: "success", data: {
                title: "Canjeado",
                desc: `**${this.nonumbers}** ${this.frontend_numbers} a ${this.frontend_target}`,
                footer: `Había un ${this.item.prob}% de probabilidad de que esta fuera tu recompensa`
            }
        });
        this.hasRole = new ErrorEmbed(this.interaction, {
            type: "alreadyExists",
            data: {
                action: "add role",
                existing: roleMention(this.numbers),
                context: "este usuario"
            }
        })
    }

    async build() {
        let interaction = this.interaction;
        this.user = await Users.getOrCreate({
            user_id: interaction.user.id,
            guild_id: interaction.guild.id
        });

        this.numbers = this.item.value.match(/[0-9\.]/g).join("");
        this.nonumbers = this.item.value.replace(/[0-9\.]/g, "");

        const { Currency } = this.interaction.client.getCustomEmojis(this.interaction.guild.id);

        switch (Number(this.item.target)) {
            case ItemObjetives.Currency:
                this.target = this.user.economy.global.currency;

                this.frontend_target = `**${Currency}${this.target.toLocaleString("es-CO")}**`;
                this.frontend_numbers = `**${Currency}${this.numbers.toLocaleString("es-CO")}**`;

                break;

            case ItemObjetives.Role:
                this.target = interaction.member.roles;
                break;

            case ItemObjetives.TempRole:
                this.target = this.user.data.temp_roles;
                break;

            default:
                this.target = null;
        }

        console.log("💚 Creando item %s", this.item);

        this.#embeds();

        return this
    }

    async use() {
        let save = true;
        let response = null;
        //let value = this.#valueWork();

        console.log("🟢 Números:", this.numbers)
        console.log("🟢 No-Números:", this.nonumbers)

        switch (this.target.constructor) {
            case GuildMemberRoleManager:
                if (this.nonumbers === '-') this.target.remove(this.numbers)
                else if (this.nonumbers === '+') this.target.add(this.numbers)

                response = this.nonumbers === '-' ? this.removedRole : this.addedRole;
                break;

            case Array:
                let temproles = Number(this.item.target) === ItemObjetives.TempRole;
                if (this.nonumbers === '-') {
                    response = temproles ? this.removedTemp : this.success;
                    let i = this.target.findIndex(x => x === this.numbers)
                    if (temproles) i = this.target.findIndex(x => x.role_id === this.numbers)

                    this.target.splice(i, 1);
                } else if (this.nonumbers === '+') {
                    if (temproles) {
                        if (this.interaction.member.roles.cache.find(x => x.id === this.numbers)) return this.hasRole.send();
                        response = this.addedTemp;
                        save = false

                        if (this.item.extra.special === ItemObjetives.Boost)
                            await LimitedTime(this.interaction.member, null, ms(this.item.extra.duration), this.item.extra.boosttype, this.item.extra.boostobj, this.item.extra.boostvalue);
                        /* else if(this.item.extra.special === ItemTypes.Subscription)
                            await Subscription(this.interaction.member, this.numbers, ms(this.item.extra.duration), this.item.extra.subprice, this.item.extra.subname);
                         */
                        else
                            await LimitedTime(this.interaction.member, null, ms(this.item.extra.duration))
                    } else
                        this.target.push(this.numbers)
                }
                break;

            case Number:
                this.numbers = Number(this.numbers);

                if (this.nonumbers === "-") {
                    this.nonumbers = "Se descontaron";
                    this.user.economy.global.currency -= this.numbers;
                }
                else if (this.nonumbers === "+") {
                    this.nonumbers = "Se agregaron";
                    this.user.addCurrency(this.numbers);
                    save = false;
                }
                else if (this.nonumbers === "*") this.user.economy.global.currency *= this.numbers;
                else if (this.nonumbers === "%") {
                    this.nonumbers = "Se sacó el";
                    this.frontend_numbers = `**${this.numbers.toLocaleString("es-CO")}%**`;

                    this.user.economy.global.currency *= this.numbers / 100
                }

                this.#embeds();

                response = this.success;
                break;
        }

        if (!response) response = this.success;
        if (save) await this.user.save().catch(e => console.log(e));

        await this.interaction.editReply({ embeds: [response] })
        await this.user.addCount("roulette");

        return this;
    }
}

module.exports = RouletteItem;