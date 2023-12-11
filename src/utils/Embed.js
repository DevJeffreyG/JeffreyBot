const Discord = require("discord.js");
const { time } = Discord;

const moment = require("moment-timezone");
const Chance = require("chance");

const Colores = require("../resources/colores.json");
const { inlineCode } = require("discord.js");

class Embed extends Discord.EmbedBuilder {
    /**
     * En caso de que Discord.JS se ponga chistoso y cambie por decimocuarta vez la forma de hacer embeds.
     */
    constructor(options) {
        if (options instanceof Discord.Embed) return super(options.data)
        else if (options instanceof Embed) return super(options.raw());
        else super()
        if (options) this.#setup(options)
    }

    defAuthor({ text, icon = null, url = null, title = false }) {
        title ?
            this.defTitle(text) :
            this.setAuthor({ name: text, iconURL: icon, url })

        return this
    }

    defTitle(text) {
        this.setTitle(text)

        return this
    }

    /**
     * @returns {this}
     */
    defDesc(desc = " ") {
        if (desc < 1 && desc) return console.error("🔴 NO SE CAMBIÓ LA DESCRIPCIÓN, ESTÁ VACÍA")
        this.setDescription(desc)
        this.description = desc;
        return this
    }

    defColor(color) {
        this.setColor(color);
        return this
    }

    defField(up, down, inline = false) {
        this.addFields([
            { name: up, value: down, inline }
        ]);
        return this
    }

    defFields(fields = [{ up, down, inline }]) {
        if (fields.length === 0) return console.error("⚠️ BAD ARRAY OF FIELDS");
        this.data.fields = [];

        fields.forEach(field => {
            this.defField(field.up, field.down, field.inline);
        });

        return this
    }

    defFooter({ text, icon = null, timestamp = null }) {
        if (timestamp) {
            try {
                this.setTimestamp(timestamp)
            } catch (e) {
                //console.log(`⚠️ El timestamp %s no fue válido`, timestamp)
                this.setTimestamp()
            }
        }

        if (text) {
            this.setFooter({ text, iconURL: icon })
        } else {
            console.log("⚠️ EMBED no tiene TEXT. Icon: %s, Timestamp: %s", icon, timestamp);
            //console.log(this)
        }
        return this
    }

    defThumbnail(url) {
        this.setThumbnail(url)
        return this
    }

    defURL(url) {
        this.setURL(url)
        return this
    }

    defImage(url) {
        this.setImage(url)
        return this
    }

    raw() {
        return this.data;
    }

    #setup(options) {
        const client = require("../../index");
        const { RandomCumplido, ProgressBar, PrettyCurrency } = require("./functions");
        const { type, data } = options

        switch (type) {
            case "didYouKnow":
                this.defAuthor({ text: `¿Sabías que...`, title: true });
                this.defDesc(`...${data.text}?`)
                this.defColor(Colores.verdeclaro)

                if (new Chance().bool({ likelihood: data.likelihood })) this.likelihood = true;
                else this.likelihood = false;
                break;

            case "success":
                this.defAuthor({ text: `${data?.title ?? "¡Listo!"}`, icon: client.EmojisObject.Check.url });
                this.defColor(Colores.verdejeffrey)

                if (data?.desc) {
                    const sep = data?.separator ?? "▸"
                    const desc = data.desc;

                    this.fillDesc(desc, sep);
                }

                if (data?.footer) this.defFooter({ text: data.footer, icon: data.footer_icon, timestamp: data.timestamp })
                break;

            case "cooldown":
                this.defAuthor({ text: `Usa este comando ${data.cool.mention}, ${RandomCumplido()}.`, title: true })
                this.defColor(Colores.rojooscuro)
                this.defFooter({ text: `Eso es en ${data.cool.text}`, timestamp: data.cool.timestamp });
                break;

            case "statistics":
                const user = data.user_doc;
                const member = data.member;
                const { Currency } = client.getCustomEmojis(data.member.guild.id);

                const actualCurrency = user?.getCurrency() ?? 0;
                const curExp = user?.economy.global.exp.toLocaleString('es-CO') ?? 0;
                const curLvl = user?.economy.global.level.toLocaleString('es-CO') ?? 0;
                const rep = user?.economy.global.reputation.toLocaleString('es-CO') ?? 0;

                const nxtLvlExp = (user.getNextLevelExp()).toLocaleString('es-CO'); // fórmula de MEE6. 5 * (level ^ 2) + 50 * level + 100

                let bdData = user?.data.birthday;
                let bdString = "";

                if (bdData?.locked) {
                    let day = bdData.day;
                    let month = bdData.month;

                    const timestamp = moment()
                        .month(month)
                        .date(day)
                        .startOf("day")

                    bdString = (day != null) && (month != null) ? `**— Cumpleaños**: ${time(timestamp.toDate(), "D")}. (${time(timestamp.toDate(), "R")})` : "";
                }

                let expDiff = user.getNextLevelExp() - user.getNextLevelExp(user.economy.global.level - 1);
                const expToGet = expDiff === 0 ? user.getNextLevelExp() : expDiff; // la exp que hay que ganar en este nivel
                const expSoFar = expDiff === 0 ? user.economy.global.exp : user.economy.global.exp - user.getNextLevelExp(user.economy.global.level - 1); // la exp que se lleva hasta ahora

                this.defAuthor({ text: `Estadísticas de ${member.user.username}`, icon: member.guild.iconURL({ dynamic: true }) })
                    .defDesc(`**— Nivel**: ${curLvl}
**— EXP**: ${ProgressBar(expSoFar / expToGet * 100, { blocks: 5 })} ${inlineCode(`${curExp} / ${nxtLvlExp}`)}
**— ${Currency.name}**: ${PrettyCurrency(data.member.guild, actualCurrency)}
**— Puntos de reputación**: ${rep}
${bdString}`)
                    .defThumbnail(member.displayAvatarURL())
                    .defColor(member.displayHexColor);

                if (user.isBirthday()) this.defAuthor({ text: `Hoy es el cumpleaños de ${member.user.username} 🎉`, icon: member.guild.iconURL({ dynamic: true }) })

                break;

            case "cancel":
                this.defDesc(`## Cancelado.`);
                this.defColor(Colores.rojooscuro)

                if (data?.desc) {
                    const sep = data?.separator ?? "▸"
                    const desc = data.desc;

                    this.fillDesc(desc, sep);
                }

                if (data?.footer) this.defFooter({ text: data.footer, icon: data.footer_icon, timestamp: data.timestamp })
                break;
            default:
                console.log("🔴 UNKOWN TYPE %s EMBED", type)
        }

        if (this.data) {
            this.description = this.data.description;
        }
    }

    /**
     * @param {String | String[]} data 
     * @returns {this}
     */
    fillDesc(data, separator = "▸") {
        let d = this.description ?? this.data.description ?? "";
        let isArray = Array.isArray(data);

        if (!isArray) data = [data];

        data.forEach(line => {
            d += `\n${separator} ${line}`
            if (!line.endsWith(".") && !(line.endsWith(":") || line.endsWith("!") || line.endsWith("```") || line.endsWith("?"))) d += `.`;
        })

        this.defDesc(d);
        return this
    }
}

module.exports = Embed;