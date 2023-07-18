const { CommandInteraction } = require("discord.js");
const { Colores } = require("../resources");
const DarkShop = require("./DarkShop");
const InteractivePages = require("./InteractivePages");

class Top {
    #res = [];

    /**
     * 
     * @param {*} users Mongoose Documents
     * @param {CommandInteraction} interaction 
     * @param {String} type 
     */
    constructor(users, interaction, type) {
        this.type = type;
        this.users = users;
        this.interaction = interaction;

        this.Emojis = this.interaction.client.Emojis;

        this.base = {
            author_icon: this.interaction.guild.iconURL({ dynamic: true }) ?? this.interaction.member.displayAvatarURL(),
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
        const interactive = new InteractivePages(this.base, this.top, 5);
        return interactive.init(this.interaction);
    }

    async #currencyTop() {
        const { Currency, DarkCurrency } = this.interaction.client.getCustomEmojis(this.interaction.guild.id);
        const darkshop = new DarkShop(this.interaction.guild);

        this.base.title = `Top de ${Currency.name}`;

        for await (const user of this.users) {
            const member = this.interaction.guild.members.cache.get(user.user_id) ?? null;

            // agregar la cantidad de darkcurrency
            if (member && !member.user.bot) {
                let darkcurrency = user.economy.dark?.currency ?? 0;
                let darkcurrencyValue = user.economy.dark?.currency ? await darkshop.equals(null, user.economy.dark.currency) : 0;
                let finalQuantity = darkcurrencyValue != 0 ? darkcurrencyValue + user.economy.global.currency : user.economy.global.currency;

                let toPush = {
                    user_id: member.user.id,
                    currency: darkcurrency, // numero de dj que tiene
                    currencyValue: Math.round(darkcurrencyValue), // lo que valen esos dcurrency en dinero ahora mismo
                    total: Math.round(finalQuantity), // la suma del valor de los dcurrency y el dinero
                    alltime: user.data.counts.normal_currency
                }

                if(toPush.total > 0) this.#res.push(toPush);
            }
        }

        // ordenar de mayor a menor
        this.#sort();

        const userRank = this.#getRank(this.#res, this.interaction.user.id);
        this.base.footer = `Eres el ${userRank.textRank} en el top • Página {ACTUAL} de {TOTAL}`

        // determinar el texto a agregar
        for await (const user of this.#res) {
            let darkshopMoney;
            if (user.currency != 0) darkshopMoney = ` (${DarkCurrency}${user.currency.toLocaleString('es-CO')}➟**${Currency}${user.currencyValue.toLocaleString('es-CO')}**)`
            else darkshopMoney = "";

            const txt = this.#getTxt(user, [`${Currency}**${user.total.toLocaleString('es-CO')}**${darkshopMoney}`, `|| Obtenido desde siempre: **${Currency}${user.alltime.toLocaleString("es-CO")}** ||`])

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

                if(toPush.total > 0) this.#res.push(toPush)
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
                    total: user.data.counts.warns
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
            txt = `# **🏆 ${member.user.username}**${toadd}`;
        } else if (rank === 2) {
            txt = `\n## **🥈 ${member.user.username}**${toadd}`;
        } else if (rank === 3) {
            txt = `\n### **🥉 ${member.user.username}**${toadd}\n\n`;
        } else {
            txt = `${rank}. **${member.user.username}**${toadd}\n\n`;
        }

        console.log(txt);

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