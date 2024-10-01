const { CommandInteraction, time } = require("discord.js");
const { Colores } = require("../resources");
const DarkShop = require("./DarkShop");
const InteractivePages = require("./InteractivePages");
const { PrettyCurrency } = require("./functions");
const moment = require("moment-timezone");

class Top {
    #res = [];

    /**
     * 
     * @param {*} users Mongoose Documents
     * @param {CommandInteraction} interaction 
     * @param {any} params 
     */
    constructor(users, interaction, params) {
        this.doc = params.getDoc();
        this.type = params.subcommand;
        this.users = users;
        this.interaction = interaction;
        this.items = 5;

        this.Emojis = this.interaction.client.Emojis;

        this.base = {
            author_icon: this.interaction.guild.iconURL() ?? this.interaction.member.displayAvatarURL(),
            color: Colores.verdejeffrey,
            description: ``,
            addon: `{txt}`,
            footer: `Página {ACTUAL} de {TOTAL}`,
            icon_footer: this.interaction.guild.iconURL()
        }

        this.top = new Map();
    }

    async init() {
        // generate top
        switch (this.type) {
            case "dinero":
                await this.#currencyTop();
                break;

            case "patrimonios":
                await this.#allCurrencyTop();
                break;

            case "protegido":
                await this.#securedTop();
                break;

            case "exp":
                await this.#expTop();
                break;

            case "rep":
                await this.#repTop();
                break;

            case "warns":
                await this.#warnsTop();
                break;
        }

        //interactive pages
        const interactive = new InteractivePages(this.base, this.top, this.items);
        return interactive.init(this.interaction);
    }

    async #currencyTop() {
        const { Currency } = this.interaction.client.getCustomEmojis(this.interaction.guild.id);

        this.base.title = `Top de ${Currency.name}`;

        this.users.forEach(user => {
            const member = this.interaction.guild.members.cache.get(user.user_id) ?? null;

            if (member && !member.user.bot) {
                let toPush = {
                    user_id: member.user.id,
                    total: user.getCurrency()
                }

                if (toPush.total > 0) this.#res.push(toPush);
            }
        })

        // ordenar de mayor a menor
        this.#sort();

        const userRank = this.#getRank(this.#res, this.interaction.user.id);
        this.base.footer = `Eres el ${userRank.textRank} en el top • Página {ACTUAL} de {TOTAL}`

        for await (const user of this.#res) {
            const txt = this.#getTxt(user, [
                `${PrettyCurrency(this.interaction.guild, user.total)}`
            ])

            this.top.set(user.user_id, {
                txt
            })
        }
    }

    async #allCurrencyTop() {
        this.items = 3
        const { Currency } = this.interaction.client.getCustomEmojis(this.interaction.guild.id);
        const darkshop = new DarkShop(this.interaction.guild);
        const dsDisabled = await darkshop.checkDisabled();

        this.base.title = `Top de los patrimonios (en ${Currency.name})`;

        for await (const user of this.users) {
            const member = this.interaction.guild.members.cache.get(user.user_id) ?? null;

            if (member && !member.user.bot) {
                let darkcurrency = user.economy.dark?.currency ?? 0;
                let darkcurrencyValue = 0;
                if (!dsDisabled) darkcurrencyValue = await darkshop.equals(null, user.getDarkCurrency()) ?? 0;

                // sumar todos los capitales
                let finalQuantity = darkcurrencyValue + user.getCurrency() + user.getSecured();

                let toPush = {
                    user_id: member.user.id,
                    dark_currency: darkcurrency, // numero de dj que tiene
                    dark_value: Math.round(darkcurrencyValue), // lo que valen esos dcurrency en dinero ahora mismo
                    secured: user.getSecured(), // dinero protegido
                    currency: user.getCurrency(), // dinero desprotegido
                    total: Math.round(finalQuantity), // la suma del valor de todo
                    alltime: user.getCount("normal_currency")
                }

                if (toPush.total > 0) this.#res.push(toPush);
            }
        }

        // ordenar de mayor a menor
        this.#sort();

        const userRank = this.#getRank(this.#res, this.interaction.user.id);
        this.base.footer = `Eres el ${userRank.textRank} en el top • Página {ACTUAL} de {TOTAL}`

        // determinar el texto a agregar
        for await (const user of this.#res) {
            let darkshopMoney;
            if (user.currency != 0) darkshopMoney = ` (`
            else darkshopMoney = "";

            const txt = this.#getTxt(user, [
                `💰 Patrimonio: ${PrettyCurrency(this.interaction.guild, user.total)}`,
                `💵 Usable: ${PrettyCurrency(this.interaction.guild, user.currency)}`,
                `🔒 Protegido: ${PrettyCurrency(this.interaction.guild, user.secured)}`,
                `💹 Invertido: ${PrettyCurrency(this.interaction.guild, user.dark_currency, { name: "DarkCurrency" })}➟${PrettyCurrency(this.interaction.guild, user.dark_value)}`,
                `|| Obtenido desde siempre: ${PrettyCurrency(this.interaction.guild, user.alltime)} ||`])

            this.top.set(user.user_id, {
                txt
            })
        }
    }

    async #securedTop() {
        const { Currency } = this.interaction.client.getCustomEmojis(this.interaction.guild.id);

        this.base.title = `Top de ${Currency.name} protegidos`;

        this.users.forEach(user => {
            const member = this.interaction.guild.members.cache.get(user.user_id) ?? null;

            if (member && !member.user.bot) {
                let toPush = {
                    user_id: member.user.id,
                    interests: Math.round(user.getSecured() * this.doc.settings.quantities.percentages.interests.secured / 100),
                    payDate: moment(this.doc.data.last_interests.secured).add(this.doc.settings.quantities.interest_days.secured, "days").toDate(),
                    total: user.getSecured()
                }

                if (toPush.total > 0) this.#res.push(toPush)
            }
        });

        // ordenar de mayor a menor
        this.#sort();

        const userRank = this.#getRank(this.#res, this.interaction.user.id);
        this.base.footer = `Eres el ${userRank.textRank} en el top • Página {ACTUAL} de {TOTAL}`

        // determinar el texto a agregar
        for await (const user of this.#res) {
            const txt = this.#getTxt(user, [
                `Protegido: 🔒${PrettyCurrency(this.interaction.guild, user.total)}`,
                `Estará pagando ${PrettyCurrency(this.interaction.guild, user.interests)}`,
                time(user.payDate, "R")
            ])

            this.top.set(user.user_id, {
                txt
            })
        }
    }

    async #expTop() {
        this.base.title = "Top de EXP"

        this.users.forEach(user => {
            const member = this.interaction.guild.members.cache.get(user.user_id) ?? null;

            if (member && !member.user.bot) {
                let toPush = {
                    user_id: member.user.id,
                    level: user.economy.global.level,
                    total: user.economy.global.exp
                }

                if (toPush.total > 0) this.#res.push(toPush)
            }
        });

        // ordenar de mayor a menor
        this.#sort();

        const userRank = this.#getRank(this.#res, this.interaction.user.id);
        this.base.footer = `Eres el ${userRank.textRank} en el top • Página {ACTUAL} de {TOTAL}`

        // determinar el texto a agregar
        for await (const user of this.#res) {
            const txt = this.#getTxt(user, [
                `Nivel: \`${user.level.toLocaleString("es-CO")}\``,
                `EXP: \`${user.total.toLocaleString('es-CO')}\``
            ])

            this.top.set(user.user_id, {
                txt
            })
        }
    }

    async #repTop() {
        this.base.title = "Top de Reputaciones"

        this.users.forEach(user => {
            const member = this.interaction.guild.members.cache.get(user.user_id) ?? null;

            if (member && !member.user.bot) {
                let toPush = {
                    user_id: member.user.id,
                    total: user.economy.global.reputation
                }

                if (toPush.total != 0) this.#res.push(toPush)
            }
        });

        // ordenar de mayor a menor
        this.#sort();

        const userRank = this.#getRank(this.#res, this.interaction.user.id);
        this.base.footer = `Eres el ${userRank.textRank} en el top • Página {ACTUAL} de {TOTAL}`

        // determinar el texto a agregar
        for await (const user of this.#res) {
            const txt = this.#getTxt(user, [
                `Reputaciones: \`${user.total.toLocaleString("es-CO")}\``
            ])

            this.top.set(user.user_id, {
                txt
            })
        }
    }

    async #warnsTop() {
        this.base.title = "Top de Warns"

        this.users.forEach(user => {
            const member = this.interaction.guild.members.cache.get(user.user_id) ?? null;

            if (member && !member.user.bot) {
                let toPush = {
                    user_id: member.user.id,
                    total: user.getCount("warns")
                }

                if (toPush.total != 0) this.#res.push(toPush)
            }
        });

        // ordenar de mayor a menor
        this.#sort();

        const userRank = this.#getRank(this.#res, this.interaction.user.id);
        this.base.footer = `Eres el ${userRank.textRank} en el top • Página {ACTUAL} de {TOTAL}`

        // determinar el texto a agregar
        for await (const user of this.#res) {
            const txt = this.#getTxt(user, [
                `Warns totales: \`${user.total.toLocaleString("es-CO")}\``
            ])

            this.top.set(user.user_id, {
                txt
            })
        }
    }

    #getRank(query, id) {

        let number = query.findIndex(x => x.user_id === id) + 1;
        let textRank;

        switch (number) {
            case 0:
                textRank = `último`;
                break;
            case 1:
                textRank = `🏆${number}ro`;
                break;

            case 2:
                textRank = `🥈${number}do`;
                break;

            case 3:
                textRank = `🥉${number}ro`;
                break;

            case 4:
            case 5:
            case 6:
                textRank = `${number}to`;
                break;

            case 7:
            case 10:
                textRank = `${number}mo`;
                break;

            case 9:
                textRank = `${number}no`;
                break;

            default:
                textRank = `${number}vo`;
                break;
        }

        return { textRank, number }
    }

    #getTxt(user, reps = []) {
        let txt, toadd = "";
        const rank = this.#getRank(this.#res, user.user_id).number
        const member = this.interaction.guild.members.cache.find(x => x.id === user.user_id);

        reps.forEach(rep => {
            toadd += `\n**—** ${rep}`
        });

        if (rank === 1) {
            txt = `# **🏆 ${member.displayName}**${toadd}`;
        } else if (rank === 2) {
            txt = `\n## **🥈 ${member.displayName}**${toadd}`;
        } else if (rank === 3) {
            txt = `\n### **🥉 ${member.displayName}**${toadd}\n\n`;
        } else {
            txt = `${rank}. **${member.displayName}**${toadd}\n\n`;
        }

        return txt;
    }

    #sort() {
        this.#res.sort(function (a, b) {
            if (a.total > b.total) {
                return -1;
            }
            if (a.total < b.total) {
                return 1;
            }

            return 0;
        })
    }
}

module.exports = Top