const { Guild, CommandInteraction, time } = require("discord.js");

const moment = require("moment-timezone");
const Chance = require("chance");

const { DarkShops, Users, Guilds } = require("mongoose").models;

const { Tendencies, Enum, ChannelModules, LogReasons } = require("./Enums");
const Embed = require("./Embed");
const { Colores } = require("../resources");
const Log = require("./Log");
const { InsuficientSetupError } = require("../errors");

class DarkShop {
    /**
     * Es una DarkShop en un servidor, con sus inflaciones, eventos y demás.
     * @param {Guild} guild 
     * @param {CommandInteraction} [interaction=null]
     */
    constructor(guild, interaction = null) {
        this.guild = guild
        this.client = guild.client
        this.interaction = interaction;
        this.now = moment();

        this.Emojis = this.client.getCustomEmojis(this.guild.id);
        this.darkshopDisabled = false;
    }

    async #sunday() {
        if (!this.now.isAfter(moment(this.since).add(6, "days"))) return;

        console.log("ES DOMINGOOOOOOOOOOO!")

        await this.#fetchInfo();

        // ELIMINAR DARKCURRENCY
        await this.removeDarkCurrency()

        // CREAR NUEVA TENDENCIA PARA LOS SIGUIENTES DÍAS
        await this.#createTendency();

        // ANUNCIARLO
        if (!this.guilddoc) await this.#getGuildDoc();

        const dsNewsRole = this.guild.roles.cache.get(this.guilddoc.getRole("announcements.darkshop")) ?? "";

        const messages = [
            "Se termina una semana, y empieza la búsqueda de beneficios.",
            "Me pregunto qué pasará esta semana...",
            "Veamos quiénes son l@s valientes.",
            "Una nueva semana está entre nosotros, veamos qué hacen.",
            "Finalmente, ¿te atreverás a hacer algo esta semana?",
            "La semana pasada fue interesante, seguro esta lo es más."
        ];

        try {
            return await new Log(this.interaction)
                .setGuild(this.guild)
                .setTarget(ChannelModules.DarkShopLogs)
                .setReason(LogReasons.DSSunday)
                .send({
                    content: dsNewsRole.toString(),
                    embeds: [
                        new Embed()
                            .defAuthor({ text: "Domingo", icon: this.client.EmojisObject.DarkShop.url })
                            .defDesc(`**—** ${new Chance().pickone(messages)}
**—** La inflación hoy estará en **${this.baseValue}%**. Ya veremos **qué pasa en la semana...**`)
                            .defColor(Colores.negro)
                    ]
                })
        } catch (err) {
            if (err instanceof InsuficientSetupError) {
                new Log()
                    .setGuild(this.guild)
                    .setTarget(ChannelModules.StaffLogs)
                    .setReason(LogReasons.Error)
                    .send({ embed: err.embed })
                    .catch(console.error);
            }
        }
    }

    async #weekWork() {
        await this.#fetchInfo()
    }

    async checkDisabled() {
        if (!this.guilddoc) await this.#getGuildDoc();
        this.darkshopDisabled = !this.guilddoc.moduleIsActive("functions.darkshop");
        return this.darkshopDisabled;
    }

    async #fetchInfo() {
        await this.checkDisabled();
        if (this.darkshopDisabled) return;
        
        const FetchThisGuild = this.#requireFetch();
        if (!this.client.isThisFetched(this.guild.id)) await FetchThisGuild(this.client, this.guild);

        if (!this.doc || !this.doc?.inflation.tendency_type) return this.#createTendency()

        this.values = this.doc.inflation.values;
        this.tendency = this.doc.inflation.tendency_type;
        this.baseValue = this.doc.inflation.initial_value;
        this.since = this.doc.inflation.since;

        return {
            values: this.values,
            tendency_type: this.tendency,
            initial_value: this.baseValue
        }
    }

    async #createTendency() {
        let oldValues = this.values;
        let type = this.#randomTendency();
        let inflations = this.#randomValues(type);

        if (!this.doc) {
            this.doc = await new DarkShops({
                guild_id: this.guild.id,
                inflation: {
                    values: inflations,
                    tendency_type: type,
                    initial_value: this.baseValue,
                    since: this.since
                }
            }).save()
        } else {
            this.doc.inflation.values = inflations;
            this.doc.inflation.tendency_type = type;
            this.doc.inflation.initial_value = this.baseValue;
            this.doc.inflation.last_value = oldValues[6][1];
            this.doc.inflation.since = this.since;

            await this.doc.save();
        }

        return {
            values: inflations,
            tendency_type: type,
            initial_value: this.baseValue
        }
    }

    #randomTendency() {
        let type = null;
        let check = [ // default si no hay una tendencia vieja registrada
            { item: Tendencies.Random, likelihood: 35 },
            { item: Tendencies.Decreasing, likelihood: 15 },
            { item: Tendencies.LargeSpike, likelihood: 25 },
            { item: Tendencies.SmallSpike, likelihood: 25 },
        ];

        // obtener la anterior
        let old = this.doc?.inflation.tendency_type; // aún no se ha guardado una nueva inflaciónn para este momento
        if (old) {
            switch (old) {
                case Tendencies.Random:
                    check = [
                        { item: Tendencies.Random, likelihood: 5 },
                        { item: Tendencies.Decreasing, likelihood: 15 },
                        { item: Tendencies.LargeSpike, likelihood: 30 },
                        { item: Tendencies.SmallSpike, likelihood: 35 },
                        { item: null, likelihood: 15 }
                    ]
                    break;

                case Tendencies.Decreasing:
                    check = [
                        { item: Tendencies.Random, likelihood: 25 },
                        { item: Tendencies.Decreasing, likelihood: 5 },
                        { item: Tendencies.LargeSpike, likelihood: 35 },
                        { item: Tendencies.SmallSpike, likelihood: 25 },
                        { item: null, likelihood: 10 }
                    ]
                    break;

                case Tendencies.LargeSpike:
                    check = [
                        { item: Tendencies.Random, likelihood: 40 },
                        { item: Tendencies.Decreasing, likelihood: 20 },
                        { item: Tendencies.LargeSpike, likelihood: 5 },
                        { item: Tendencies.SmallSpike, likelihood: 15 },
                        { item: null, likelihood: 20 }
                    ]
                    break;

                case Tendencies.SmallSpike:
                    check = [
                        { item: Tendencies.Random, likelihood: 30 },
                        { item: Tendencies.Decreasing, likelihood: 15 },
                        { item: Tendencies.LargeSpike, likelihood: 25 },
                        { item: Tendencies.SmallSpike, likelihood: 15 },
                        { item: null, likelihood: 15 }
                    ]
                    break;
            }
        }

        type = this.#chanceProbability(check);
        if (!type) { // custom tendencies
            let possible = [
                Tendencies.LastMinute,
                Tendencies.InitialSpike
            ]

            type = new Chance().pickone(possible)
        }

        console.log("🟢 Se va a crear una nueva tendencia tipo %s para %s", new Enum(Tendencies).translate(type), this.guild.name);

        return type;
    }

    #randomValues(tendency_type) {
        let values = {
            1: [],
            2: [],
            3: [],
            4: [],
            5: [],
            6: []
        };

        // tomar el valor del domingo como base
        this.baseValue = this.#newBaseValue();
        let baseVal = this.baseValue;

        console.log("⚪ Se tomó de inflación base %s%", this.baseValue)

        // https://docs.google.com/document/d/1bSVNpOnH_dKxkAGr718-iqh8s8Z0qQ54L-0mD-lbrXo/edit?usp=sharing 🤩
        switch (tendency_type) {
            // No se tendrán ganacias significativas, ni pérdidas significativas
            case Tendencies.Random: {
                // DURACIONES:
                // Siempre hay 2 Decreasing Phases y 3 Increasing Phases.
                let inc1 = new Chance().integer({ min: 0, max: 6 }); // min 0 y max 6 medios dias
                let dec1 = new Chance().pickone([2, 3]); // 2 medio dias o 3

                // increasing phase 2
                let temp = 7 - inc1
                let inc3 = new Chance().integer({ min: 0, max: temp - 1 })

                let inc2 = temp - inc3;

                let dec2 = 5 - dec1;

                // Random between 90% and 140% of your base price
                increase(inc1, {}, { min: 0.9, max: 1.4 });

                // Every half day this base rate drops by 4% to 10% for the length of this phase
                decrease(dec1, { minRemoval: 0.4, maxRemoval: 0.9 }, { min: 0.6, max: 0.8 });

                // Lo mismo que la primera
                increase(inc2, {}, { min: 0.9, max: 1.4 });

                // Lo mismo que la primera
                decrease(dec2, { minRemoval: 0.4, maxRemoval: 0.9 }, { min: 0.6, max: 0.8 });

                // Lo mismo que la primera
                increase(inc3, {}, { min: 0.9, max: 1.4 });
                break;
            }

            // Puedes hacer un buen profit si hay suerte
            case Tendencies.LargeSpike: {
                // DURACIONES
                let peak = new Chance().integer({ min: 2, max: 8 }); // a partir de cuando empieza a subir
                let dec1 = peak - 1;

                let dec2 = 2;

                let dec3 = 12 - dec1 - 5; // puede que no pase

                decrease(dec1, { minRemoval: 0.03, maxRemoval: 0.05 }, { min: 0.85, max: 0.9 });

                // INC SIEMPRE SERÁN 3 DIAS
                increase(1, {}, { min: 10, max: 30 });
                increase(1, {}, { min: 25, max: 40 });
                increase(1, {}, { min: 30, max: 80 });

                decrease(dec2, { minRemoval: 0.3, maxRemoval: 0.9 }, { min: 1, max: 1.4 });

                // apartir de aquí solo baja y baja, no hay profit
                decrease(dec3, { minRemoval: 5, maxRemoval: 10 }, { min: 0.4, max: 0.9 });
                break;
            }

            // Te tocó perder
            case Tendencies.Decreasing: {
                decrease(12, { minRemoval: 3, maxRemoval: 5 }, { min: 0.85, max: 0.9 });
                break;
            }

            // Posibilidad de profit pero no tan grande como en LargeSpike
            case Tendencies.SmallSpike: {
                // DURACIONES
                let dec1 = new Chance().integer({ min: 0, max: 7 });
                let inc = 5;
                let dec2 = 12 - dec1 - inc;

                decrease(dec1, { minRemoval: 0.03, maxRemoval: 0.05 }, { min: 0.4, max: 0.9 });

                // SIEMPRE SON 5 DIAS
                increase(2, {}, { min: 0.9, max: 1.4 })
                increase(1, {}, { min: 1.4, max: new Chance().floating({ min: 1.4, max: 2 }) })
                increase(1, {}, { min: 1.4, max: 2 })
                increase(1, {}, { min: 1.4, max: new Chance().floating({ min: 1.4, max: 2 }) })

                // lo mismo que la primera
                decrease(dec2, { minRemoval: 0.03, maxRemoval: 0.05 }, { min: 0.4, max: 0.9 });
                break;
            }

            // la inflación sube en los últimos días luego de bajar como en Decreasing
            case Tendencies.LastMinute: {
                let dec = new Chance().integer({ min: 9, max: 11 });
                let inc = 12 - dec; // dura de 1 a 3 medios días siendo el último el mayor profit

                decrease(dec, { minRemoval: 3, maxRemoval: 5 }, { min: 0.85, max: 0.9 });
                increase(inc, { minAdd: 5, maxAdd: 10 }, { min: 5, max: 40 });
                break;
            }

            // se consigue profit nada más iniciar la semana, después simplemente pierdes
            case Tendencies.InitialSpike: {
                let inc = new Chance().integer({ min: 1, max: 3 });
                let dec = 12 - inc;

                increase(inc, { minAdd: 1, maxAdd: 10 }, { min: 1.4, max: 5 });
                decrease(dec, { minRemoval: 3, maxRemoval: 5 }, { min: 0.4, max: 1.2 });
                break;
            }
        }

        /* console.log("🟢 Finalmente, tenemos:")
        console.log(values) */
        this.values = values;
        this.since = moment().day(0).startOf("day").toDate();

        console.log(this.values)

        return values

        function decrease(duration, removal = { minRemoval, maxRemoval }, initials = { min, max }) {
            let lastBase = null;
            let lastPush = null;
            let thr = false;

            const { minRemoval, maxRemoval } = removal;
            const { min, max } = initials;

            for (let i = 0; i < duration; i++) {
                let decVal;
                if (!minRemoval || !maxRemoval || minRemoval === 0 || maxRemoval === 0) thr = true;

                const removalThr = !thr ? new Chance().floating({ min: minRemoval, max: maxRemoval, fixed: 2 }) : null;

                decVal = lastBase && !thr ?
                    lastBase - removalThr :
                    new Chance().floating({ min, max, fixed: 2 });

                let toPush = decVal * baseVal;
                while ((lastPush && toPush > lastPush) || (!lastPush && toPush > baseVal)) {
                    toPush -= !thr ?
                        (removalThr + new Chance().floating({ min: minRemoval, max: maxRemoval, fixed: 2 })) :
                        new Chance().floating({ min, max, fixed: 2 });
                }

                pushWork(toPush);

                lastBase = decVal;
                lastPush = toPush;
            }
        }

        function increase(duration, add = { minAdd, maxAdd }, initials = { min, max }) {
            let lastBase = null;
            let lastPush = null;
            let thr = false;

            const { minAdd, maxAdd } = add;
            const { min, max } = initials;

            for (let i = 0; i < duration; i++) {
                let incVal;
                if (!minAdd || !maxAdd || minAdd === 0 || maxAdd === 0) thr = true;

                const addThr = !thr ? new Chance().floating({ min: minAdd, max: maxAdd, fixed: 2 }) : null;

                incVal = lastBase && !thr ?
                    lastBase + addThr :
                    new Chance().floating({ min, max, fixed: 2 });

                let toPush = incVal * baseVal;
                while ((lastPush && toPush < lastPush) || (!lastPush && toPush < baseVal)) {
                    toPush += !thr ?
                        (addThr + new Chance().floating({ min: minAdd, max: maxAdd, fixed: 2 })) :
                        new Chance().floating({ min, max, fixed: 2 });
                }

                pushWork(toPush);

                lastBase = incVal;
                lastPush = toPush;
            }
        }

        function pushWork(toPush) {
            toPush = Number(toPush.toFixed(2));
            if (toPush > 200) toPush = 200;
            if (toPush < -200) toPush = -200;
            if (toPush === -0) toPush = 0;

            //console.log("PUSHING", toPush)

            if (values["1"].length != 2) return values["1"].push(toPush)
            if (values["2"].length != 2) return values["2"].push(toPush)
            if (values["3"].length != 2) return values["3"].push(toPush)
            if (values["4"].length != 2) return values["4"].push(toPush)
            if (values["5"].length != 2) return values["5"].push(toPush)
            if (values["6"].length != 2) return values["6"].push(toPush)
        }
    }

    #newBaseValue() {
        return Number(new Chance().floating({ min: -5, max: 5, fixed: 2 }).toFixed(2));
    }

    async removeDarkCurrency() {
        const PrettyCurrency = this.#requirePretty();
        const users = await Users.find({
            guild_id: this.guild.id
        });

        const PublicLogger = new Log()
            .setGuild(this.guild)
            .setTarget(ChannelModules.DarkShopLogs)
            .setReason(LogReasons.AutomatedChange)

        const ErrorLogger = new Log(this.interaction)
            .setGuild(this.guild)
            .setTarget(ChannelModules.StaffLogs)
            .setReason(LogReasons.Error)

        const Logger = new Log()
            .setGuild(this.guild)
            .setTarget(ChannelModules.StaffLogs)
            .setReason(LogReasons.AutomatedChange)

        users.forEach(async user => {
            const darkdata = user.economy.dark;
            const until = moment(darkdata.until);
            if (moment().isBefore(until)) return;

            if (darkdata.currency != 0) {
                const had = PrettyCurrency(this.guild, darkdata.currency, { name: "DarkCurrency" });
                // enviar mensaje al usuario
                console.log(`🟥 ${user.user_id} se eliminarán sus DarkCurrency por haber pasado una semana.`)

                let memberDJ = this.guild.members.cache.find(x => x.id === user.user_id);

                let deleted = memberDJ?.displayName ?? `<AUSENTE> (${user.user_id})`

                let log = new Embed()
                    .defColor(Colores.verde)
                    .defDesc(`**—** Se han eliminado los ${this.Emojis.DarkCurrency.name} de **${deleted}**.
**—** Desde: ${time(moment(darkdata.until).subtract(1, "week").toDate())}.
**—** Tenía: ${had}`)
                    .defFooter({ text: "Mensaje enviado a la vez que al usuario", timestamp: true })

                let embed = new Embed()
                    .defAuthor({ text: `...`, icon: this.client.EmojisObject.DarkShop.url })
                    .defColor(Colores.negro)
                    .defDesc(`**—** Parece que no has recuperado todos tus ${this.Emojis.DarkCurrency.name}. Han sido eliminados de tu cuenta tras haber pasado una semana.
**—** Siempre ten un ojo en la **inflación** con \`/inflacion\` y **recupera tu inversión** con \`/dswith\` en el transcurso de la semana.`)
                    .defFooter("▸ Si crees que se trata de un error, contacta al STAFF.");

                // Enviar la información al usuario
                memberDJ?.send({ embeds: [embed] })
                    .catch(error => {
                        ErrorLogger.send({
                            embed: new DMNotSentError(this.interaction, memberDJ, error).embed
                        })
                    })

                // Enviar la información al STAFF
                await Logger.send({ embeds: [log] });

                // Enviar el evento publicamente;
                let messages = [
                    `Parece que **${deleted}** lo olvidó.`,
                    `Gracias a **${deleted}**, la economía se equilibra un poco más.`,
                    `**${deleted}** tomó decisiones financieras cuestionables.`,
                    `Complicado, ¿no, **${deleted}**?`,
                    `¿Intentamos esto otra vez, **${deleted}**?`,
                    `¡Piensa **${deleted}**, piensa!`
                ];

                await PublicLogger.send({
                    embed: new Embed()
                        .defAuthor({ text: "Evento", icon: this.client.EmojisObject.DarkShop.url })
                        .defDesc(`**—** ${new Chance().pickone(messages)}
**—** No recuperó sus ${had}.`)
                        .defColor(Colores.negro)
                })
            }

            darkdata.currency = 0;
            darkdata.until = null;

            await user.save();
        })
    }

    async #getDoc() {
        this.doc = await DarkShops.getWork(this.guild.id);
        return this;
    }

    async #getGuildDoc() {
        this.guilddoc = await Guilds.getWork(this.guild.id);
        return this
    }

    async inflationWork() {
        if (!this.doc) await this.#getDoc();
        await this.#fetchInfo();

        // revisar el dia de la semana

        let day = this.now.day();

        if (day === 0 || this.now.isAfter(moment(this.since).add(1, "week"))) // domingo
            return this.#sunday()

        await this.#weekWork();
    }

    /**
     * Recibe todos los valores que tomó y tomará la inflación en la semana
     * @returns {Promise<object>}
     */
    async getAllValues() {
        if (!this.doc) await this.#getDoc();

        await this.#fetchInfo();

        return this.values;
    }

    async getRealInflations() {
        if (!this.doc) await this.#getDoc();
        await this.#fetchInfo();

        let day = String(this.now.day());

        let inflation = 0;
        let oldinflation = 0;

        if (day === "0") { // si es domingo
            inflation = this.baseValue
            oldinflation = this.doc.inflation.last_value;
        } else {
            if (this.now.hour() >= 12) {
                inflation = this.values[day][1];
                oldinflation = this.values[day][0];
            }
            else {
                let beforeday = this.values[String(Number(day) - 1)];
                inflation = this.values[day][0];
                oldinflation = beforeday ? beforeday[1] : this.baseValue;
            }
        }

        if (!oldinflation) oldinflation = 0;

        return { inflation, oldinflation }
    }

    getShopTimezone() {
        let hour = this.now.hour();
        let now = this.now;

        return { hour, now }
    }

    /**
     * Recibe la inflación que está ahora mismo
     * @returns {Promise<Number>}
     */
    async getInflation() {
        let q = await this.getRealInflations()
        return q.inflation;
    }

    /**
     * El resultado de esto será lo que se multiplique con el precio Base de los DarkCurrency en el servidor
     * @param {Number} customInflation En porcentaje
     * @returns {Promise<Number>}
     */
    async getState(customInflation = null) {
        let inflation = customInflation ?? await this.getInflation();

        if (inflation < 0) {
            return (1 / ((Math.abs(inflation) + 100) / 100));
        } else if (inflation > 0) {
            return (inflation + 100) / 100;
        } else {
            return 1;
        }
    }

    /**
     * Obtiene el precio base de los DarkCurrency configurado en este servidor
     * @returns {Promise<Number>}
     */
    async getBasePrice() {
        if (!this.guilddoc) await this.#getGuildDoc();

        return this.guilddoc.settings.quantities.darkshop.baseprice;
    }

    /**
     * @param {Number} [inflacion = null]
     * @returns {Promise<Number>} Lo que vale 1 DarkJeffro con la inflación dada
     */
    async oneEquals(inflacion = null) {
        const base = await this.getBasePrice();
        const state = await this.getState(inflacion);

        return Number((state * base).toFixed(2));
    }

    /**
     * 
     * @param {Number} inflacion 
     * @param {Number} number 
     * @returns {Promise<Number>}
     */
    async equals(inflacion = null, number) {
        inflacion = inflacion ? Number(inflacion) : await this.getInflation();
        const one = await this.oneEquals(inflacion);
        return Number((one * number).toFixed(2));
    }

    /**
     * Recibir la inflación actual en la hora actual en un Embed (SE NECESITA INTERACTION)
     */
    async inflationEmbed() {
        const PrettyCurrency = this.#requirePretty();
        const { inflation, oldinflation } = await this.getRealInflations();
        const one = await this.oneEquals();
        const { EmojisObject } = this.client;

        let stonks = oldinflation <= inflation ? "📈" : "📉";
        let tz = this.getShopTimezone();

        let copyTz = tz.now.clone();
        let date = copyTz.day() != 0 ? (tz.hour >= 12 ? copyTz.add(1, "day").startOf("day") : copyTz.hour(12).startOf("hour")).toDate() :
            copyTz.add(1, "day").startOf("day").toDate();

        let stonksEmbed = new Embed()
            .defAuthor({ text: `DarkShop: Inflación`, icon: EmojisObject.DarkShop.url })
            .defDesc(`**${this.Emojis.DarkCurrency}1 =** ${PrettyCurrency(this.interaction.guild, one)}

${stonks} **—** La inflación actual de los ${this.Emojis.DarkCurrency.name} es de un \`${inflation}%\`.
${stonks} **—** Antes era de un \`${oldinflation}%\`: (**${this.Emojis.DarkCurrency}1 = ${PrettyCurrency(this.interaction.guild, await this.oneEquals(oldinflation))}).

${tz.now.day() != 0 ? `**—** La inflación inicial fue \`${this.baseValue}%\`.\n` : ""}**—** La inflación cambiará ${time(date, "R")}.`)
            .defColor(Colores.negro);

        await this.interaction.reply({ embeds: [stonksEmbed] });
    }

    /**
     * 
     * @param {Array<{item: Tendencies, likelihood: Number}>} array 
     * @returns {Tendencies}
     */
    #chanceProbability(array) {
        let float = new Chance().floating({ min: 0, max: 1 });

        const expanded = array.flatMap(i => Array(i.likelihood).fill(i));

        /* console.log("⚪ Using:")
        console.log(expanded)
        console.log("⚪ Lenght: %s", expanded.length);
      
        array.forEach(i => {
            console.log(expanded.filter(x => x.item === i.item).length)
        }) */

        return expanded[Math.floor(float * expanded.length)].item;
    }

    #requirePretty() {
        const { PrettyCurrency } = require("./functions");
        return PrettyCurrency;
    }

    #requireFetch() {
        const { FetchThisGuild } = require("./functions");
        return FetchThisGuild;
    }


}

module.exports = DarkShop