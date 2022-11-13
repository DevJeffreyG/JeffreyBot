const { Guild, CommandInteraction, time } = require("discord.js");

const moment = require("moment");
const Chance = require("chance");

const { DarkShops, Users } = require("mongoose").models;

const { Tendencies, Enum } = require("./Enums");
const Embed = require("./Embed");
const { Colores } = require("../resources");

class DarkShop {
    /**
     * Es una DarkShop en un servidor, con sus inflaciones, eventos y demás.
     * @param {Guild} guild 
     * @param {CommandInteraction} interaction 
     */
    constructor(guild, interaction = null) {
        this.guild = guild
        this.client = guild.client
        this.interaction = interaction;
        this.now = moment();
    }

    async #sunday() {
        if (!this.now.isAfter(moment(this.since).add(6, "days"))) return;

        console.log("ES DOMINGOOOOOOOOOOO!")

        // ELIMINAR DARKJEFFROS
        await this.#removeDarkJeffros()

        // CREAR NUEVA TENDENCIA PARA LOS SIGUIENTES DÍAS
        await this.#createTendency();
    }

    async #weekWork() {
        await this.#fetchInfo()
    }

    async #fetchInfo() {
        if (!this.doc || !this.doc?.inflation.tendency_type) return this.#createTendency()

        this.values = this.doc.inflation.values;
        this.tendency = this.doc.inflation.tendency_type;
        this.baseValue = this.doc.inflation.initial_value;
        this.lastValue = this.doc.inflation.last_value;
        this.oldtendency = this.doc.inflation.old_tendency;
        this.since = this.doc.inflation.since;

        return {
            values: this.values,
            tendency_type: this.tendency,
            initial_value: this.baseValue,
            last_value: this.lastValue,
            old_tendency: this.oldtendency
        }
    }

    async #createTendency() {
        let type = this.#randomTendency();
        let inflations = this.#randomValues(type);

        if (!this.doc) {
            this.doc = await new DarkShops({
                guild_id: this.guild.id,
                inflation: {
                    values: inflations,
                    tendency_type: type,
                    initial_value: this.baseValue,
                    last_value: this.lastValue,
                    since: this.since
                }
            }).save()
        } else {
            this.doc.inflation.values = inflations;
            this.doc.inflation.tendency_type = type;
            this.doc.inflation.initial_value = this.baseValue;
            this.doc.inflation.last_value = this.lastValue;
            this.doc.inflation.old_tendency = this.oldtendency;
            this.doc.inflation.since = this.since;

            await this.doc.save();
        }

        return {
            values: inflations,
            tendency_type: type,
            initial_value: this.baseValue,
            old_tendency: this.oldtendency
        }
    }

    #randomTendency() {
        let old = null;
        let type = null;
        let check = [ // default si no hay una tendencia vieja registrada
            { item: Tendencies.Random, likelihood: 35 },
            { item: Tendencies.Decreasing, likelihood: 15 },
            { item: Tendencies.LargeSpike, likelihood: 25 },
            { item: Tendencies.SmallSpike, likelihood: 25 },
        ];

        // obtener la anterior
        old = this.doc?.inflation.old_tendency;
        if (old) {
            this.oldtendency = old;

            switch (old) {
                case Tendencies.Random:
                    check = [
                        { item: Tendencies.Random, likelihood: 20 },
                        { item: Tendencies.Decreasing, likelihood: 15 },
                        { item: Tendencies.LargeSpike, likelihood: 30 },
                        { item: Tendencies.SmallSpike, likelihood: 35 },
                    ]
                    break;

                case Tendencies.Decreasing:
                    check = [
                        { item: Tendencies.Random, likelihood: 25 },
                        { item: Tendencies.Decreasing, likelihood: 5 },
                        { item: Tendencies.LargeSpike, likelihood: 45 },
                        { item: Tendencies.SmallSpike, likelihood: 25 },
                    ]
                    break;

                case Tendencies.LargeSpike:
                    check = [
                        { item: Tendencies.Random, likelihood: 50 },
                        { item: Tendencies.Decreasing, likelihood: 20 },
                        { item: Tendencies.LargeSpike, likelihood: 5 },
                        { item: Tendencies.SmallSpike, likelihood: 15 },
                    ]
                    break;

                case Tendencies.SmallSpike:
                    check = [
                        { item: Tendencies.Random, likelihood: 45 },
                        { item: Tendencies.Decreasing, likelihood: 15 },
                        { item: Tendencies.LargeSpike, likelihood: 25 },
                        { item: Tendencies.SmallSpike, likelihood: 15 },
                    ]
                    break;

            }
        }

        type = new Chance().prob(check);
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

        switch (tendency_type) {
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

                incrRandomWork(inc1);
                decrRandomWork(dec1)

                incrRandomWork(inc2);
                decrRandomWork(dec2)

                incrRandomWork(inc3);
                break;
            }

            case Tendencies.LargeSpike: {
                // DURACIONES
                let peak = new Chance().integer({ min: 2, max: 8 }); // a partir de cuando empieza a subir
                let dec1 = peak - 1;

                let inc1 = 3;
                let dec2 = 2;

                let dec3 = 12 - dec1 - 5; // puede que no pase

                decrLargeWork(dec1)
                incrLargeWork(inc1)

                decrAfterincrLargeWork(dec2)
                decrRandomWork(dec3, 0.09, 0.2)
                break;
            }

            case Tendencies.Decreasing: {
                decrWork(12)
                break;
            }

            case Tendencies.SmallSpike: {
                // DURACIONES
                let dec1 = new Chance().integer({ min: 0, max: 7 });
                let inc = 5;
                let dec2 = 12 - dec1 - inc;

                decrWork(dec1)
                incrSmallWork(inc)
                decrWork(dec2)
                break;
            }
        }

        /* console.log("🟢 Finalmente, tenemos:")
        console.log(values) */
        this.values = values;
        this.lastValue = values["6"][1];
        this.since = new Date();

        return values

        function decrWork(duration) {
            let lastBase = null;

            for (let i = 0; i < duration; i++) {

                let decreasingVal = lastBase ?
                    lastBase - new Chance().floating({ min: 0.03, max: 0.05, fixed: 2 }) :
                    new Chance().floating({ min: 0.85, max: 0.9, fixed: 2 });

                let val = decreasingVal * baseVal;

                pushWork(val);
                lastBase = decreasingVal
            }
        }

        function incrSmallWork(duration) {
            let maxIncr = new Chance().floating({ min: 1.4, max: 2, fixed: 2 });

            for (let i = 0; i < duration; i++) {
                let half = i + 1;
                let increasingVal;

                if (half === 3) increasingVal = new Chance().floating({ min: 1.4, max: maxIncr, fixed: 2 }) - 1
                else if (half === 4) increasingVal = maxIncr
                else if (half === 5) increasingVal = new Chance().floating({ min: 1.4, max: maxIncr, fixed: 2 }) - 1
                else increasingVal = new Chance().floating({ min: 0.9, max: 1.4, fixed: 2 })

                let val = increasingVal * baseVal

                pushWork(val);
            }
        }

        function incrLargeWork(duration) {
            let lastBase = null;

            for (let i = 0; i < duration; i++) {

                let increasingVal = lastBase ?
                    lastBase + new Chance().floating({ min: 1, max: 10.72, fixed: 2 }) :
                    new Chance().floating({ min: 0.9, max: 1.2, fixed: 2 });

                let val = increasingVal * baseVal;

                pushWork(val);
                lastBase = increasingVal
            }
        }

        function decrAfterincrLargeWork(duration) {
            let lastBase = null;

            for (let i = 0; i < duration; i++) {

                let decreasingVal = lastBase ?
                    lastBase - new Chance().floating({ min: 0.1, max: 0.5, fixed: 2 }) :
                    new Chance().floating({ min: 1.4, max: 2, fixed: 2 });

                let val = decreasingVal * baseVal;

                pushWork(val);

                lastBase = decreasingVal
            }
        }

        function decrLargeWork(duration) {
            let lastBase = null;

            for (let i = 0; i < duration; i++) {

                let decreasingVal = lastBase ?
                    lastBase - new Chance().floating({ min: 0.03, max: 0.05, fixed: 2 }) :
                    new Chance().floating({ min: 0.85, max: 0.9, fixed: 2 });

                let val = decreasingVal * baseVal

                pushWork(val);

                lastBase = decreasingVal
            }
        }

        function incrRandomWork(duration) {
            for (let i = 0; i < duration; i++) {
                let val = new Chance().floating({ min: 0.9, max: 1.4, fixed: 1 }) * baseVal;
                pushWork(val);
            }
        }

        function decrRandomWork(duration, removeMin = 0.04, removeMax = 0.1) {
            let lastBase = null;

            for (let i = 0; i < duration; i++) {

                let decreasingVal = lastBase ?
                    lastBase - new Chance().floating({ min: removeMin, max: removeMax, fixed: 2 }) :
                    new Chance().floating({ min: 0.6, max: 0.8, fixed: 2 });

                let val = decreasingVal * baseVal;

                pushWork(val);

                lastBase = decreasingVal
            }
        }

        function pushWork(toPush) {
            toPush = Number(toPush.toFixed(2));
            if (toPush > 100) toPush = 100;
            if (toPush <= 0) toPush = Math.abs(toPush);

            if (values["1"].length != 2) return values["1"].push(toPush)
            if (values["2"].length != 2) return values["2"].push(toPush)
            if (values["3"].length != 2) return values["3"].push(toPush)
            if (values["4"].length != 2) return values["4"].push(toPush)
            if (values["5"].length != 2) return values["5"].push(toPush)
            if (values["6"].length != 2) return values["6"].push(toPush)
        }
    }

    #newBaseValue() {
        return Number(new Chance().floating({ min: 0.3, max: 3, fixed: 2 }).toFixed(2));
    }

    async #removeDarkJeffros() {
        const users = await Users.find({
            guild_id: this.guild.id
        });

        users.forEach(async user => {
            const darkdata = user.economy.dark;

            if (darkdata.darkjeffros != 0) {
                // enviar mensaje al usuario

                let memberDJ = this.guild.members.cache.find(x => x.id === user.user_id);

                let deletedTag = memberDJ?.user.tag ?? `<AUSENTE> (${user.user_id})`

                let log = new Embed()
                    .defColor(Colores.verde)
                    .defDesc(`**—** Se han eliminado los DarkJeffros de **${deletedTag}**.
**—** Desde: ${time(darkdata.dj_since)}.
**—** Tenía: **${this.client.Emojis.DarkJeffros}${darkdata.darkjeffros.toLocaleString("es-CO")}**`)
                    .defFooter({ text: "Mensaje enviado a la vez que al usuario", timestamp: true })

                let embed = new Embed()
                    .defAuthor({ text: `...`, icon: this.client.EmojisObject.Dark.url })
                    .defColor(Colores.negro)
                    .defDesc(`**—** Parece que no has vendido todos tus DarkJeffros. Han sido eliminados de tu cuenta tras haber pasado una semana.`)
                    .defFooter("▸ Si crees que se trata de un error, contacta al Staff.");

                memberDJ?.send({ embeds: [embed] })
                    .catch(e => { }) // FALTAN LOGS
            }

            darkdata.darkjeffros = 0;
            darkdata.dj_since = null;

            await user.save();
        })
    }

    async inflationWork() {
        this.doc = await DarkShops.getOrNull(this.guild.id);
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
        this.doc = await DarkShops.getOrNull(this.guild.id);
        await this.#fetchInfo();

        return this.values;
    }

    async getRealInflations() {
        this.doc = await DarkShops.getOrNull(this.guild.id);
        await this.#fetchInfo();

        let day = String(this.now.day());

        let inflation = 0;
        let oldinflation = 0;

        if (day === "0") { // si es domingo
            inflation = this.baseValue
            oldinflation = this.lastValue
        } else {
            if (this.now.hour() >= 12) {
                inflation = this.values[day][1];
                oldinflation = this.values[day][0];
            }
            else {
                inflation = this.values[day][0];
                oldinflation = this.values[String(Number(day) - 1)][1] ?? this.baseValue;
            }
        }

        return { inflation, oldinflation }
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
     * Recibir la inflación actual en la hora actual en un Embed (SE NECESITA INTERACTION)
     */
    async inflationEmbed() {
        let { inflation, oldinflation } = await this.getRealInflations();
        const { Emojis, EmojisObject } = this.client;

        let stonks = oldinflation <= inflation ? "📈" : "📉";

        let stonksEmbed = new Embed()
            .defAuthor({ text: `DarkShop: Inflación`, icon: EmojisObject.Dark.url })
            .defDesc(`${stonks} **—** La inflación actual de los DarkJeffros es de un **${inflation}%**.
**— ${Emojis.DarkJeffros}1 = ${Emojis.Jeffros}${Math.floor(200 * inflation).toLocaleString('es-CO')}**.
**—** Antes era de un \`${oldinflation}%\`.`)
            .defColor(Colores.negro);

        this.interaction.reply({ embeds: [stonksEmbed] });
    }


}

module.exports = DarkShop