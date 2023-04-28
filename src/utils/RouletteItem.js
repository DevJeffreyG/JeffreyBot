const { GuildMemberRoleManager, roleMention } = require("discord.js");
const ms = require("ms")

const { LimitedTime } = require("./functions");
const { ItemObjetives, ItemTypes, BoostObjetives } = require("./Enums");
const Embed = require("./Embed");
const ErrorEmbed = require("./ErrorEmbed");
const { AlreadyExistsError } = require("../errors");

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
                desc: `**${this.nonumbers}** ${this.frontend_numbers} ➡️ ${this.frontend_target}`,
                footer: `Había un ${this.item.prob}% de probabilidad de que esta fuera tu recompensa`
            }
        });
    }

    /**
     * Genera la información necesaria para empezar con el Item
     * @param {Users} user 
     * @returns {this}
     */
    build(user) {
        this.user = user;

        this.numbers = this.item.value.match(/[0-9\.]/g).join("");
        this.nonumbers = this.item.value.replace(/[0-9\.]/g, "");

        const { Currency } = this.interaction.client.getCustomEmojis(this.interaction.guild.id);

        switch (Number(this.item.target)) {
            case ItemObjetives.Currency:
                this.target = this.user.economy.global.currency;

                this.frontend_target = `**${Currency}${this.target.toLocaleString("es-CO")}**`;
                this.frontend_numbers = `**${Currency}${this.numbers.toLocaleString("es-CO")}**`;

                break;

            case ItemObjetives.Boost:
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

        this.user.addCount("roulette", 1, false);

        console.log("🟢 Números:", this.numbers)
        console.log("🟢 No-Números:", this.nonumbers)

        this.user.addCount("roulette", 1, false);

        switch (this.target.constructor) {
            case GuildMemberRoleManager:
                if (this.nonumbers === '-') this.target.remove(this.numbers)
                else if (this.nonumbers === '+') this.target.add(this.numbers)

                response = this.nonumbers === '-' ? this.removedRole : this.addedRole;
                break;

            case Array:
                let temproles = Number(this.item.target) === ItemObjetives.Boost;
                if (this.nonumbers === '-') {
                    response = temproles ? this.removedTemp : this.success;
                    let i = this.target.findIndex(x => x === this.numbers)
                    if (temproles) i = this.target.findIndex(x => x.role_id === this.numbers)

                    this.target.splice(i, 1);
                } else if (this.nonumbers === '+') {
                    if (temproles) {
                        response = this.addedTemp;
                        save = false

                        await LimitedTime(this.interaction.member, null, ms(this.item.extra.duration), this.item.extra.boosttype, this.item.extra.boostobj, this.item.extra.boostvalue);
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
                    this.user.addCurrency(this.numbers, false);
                }
                else if (this.nonumbers === "*") {
                    this.nonumbers = "Se multiplicó por"
                    this.user.economy.global.currency *= this.numbers;
                }
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
        return this;
    }

    /**
     * Saca la información del item User-Friendly
     * @returns
     */
    info() {
        const { Currency } = this.interaction.client.getCustomEmojis(this.interaction.guild.id);

        let translated = {
            action: null,
            quantity: this.numbers,
            likelihood: this.item.prob,
            text: null,
            boost: {
                value: null,
                objetive: null
            }
        };

        switch (this.nonumbers) {
            case "+":
                translated.action = "Agrega"
                break;
            case "-":
                translated.action = "Resta"
                break;
            case "*":
                translated.action = "Multiplica"
                break;
            case "%":
                translated.action = "Saca el"
                break;
        }

        switch (Number(this.item.target)) {
            case ItemObjetives.Currency:
                if (this.nonumbers === "%") {
                    translated.text = `${translated.action} **${translated.quantity.toLocaleString("es-CO")}%** a **${Currency}${this.target.toLocaleString("es-CO")}**`;
                } else if (this.nonumbers === "*") {
                    translated.text = `${translated.action} por **${translated.quantity.toLocaleString("es-CO")}** a **${Currency}${this.target.toLocaleString("es-CO")}**`;
                } else {
                    translated.text = `${translated.action} **${Currency}${translated.quantity.toLocaleString("es-CO")}** a **${Currency}${this.target.toLocaleString("es-CO")}**`;
                }
                break;
            case ItemObjetives.Boost:
                translated.boost = {
                    value: this.item.extra.boostvalue,
                    objetive: this.item.extra.boostobj === BoostObjetives.Currency ? Currency.name :
                        this.item.extra.boostobj === BoostObjetives.Exp ? "EXP" : "Todo"
                }
                translated.text = `${translated.action} **Un Boost de x${translated.boost.value.toLocaleString("es-CO")} para ${translated.boost.objetive}**`
                break;
        }

        return translated;
    }
}

module.exports = RouletteItem;