const { CommandInteraction, User, TextChannel, ThreadChannel } = require("discord.js");
const ms = require("ms");
const { EndReasons } = require("./Enums");
const Embed = require("./Embed");
const JeffreyBotError = require("../errors/JeffreyBotError");

/**
 * Un administrador de Component Collectors
 */
class Collector {
    /**
     * 
     * @param {CommandInteraction} interaction 
     * @param {{filter: Function, time: Number, max: Number, wait: Boolean, user: User, channel: TextChannel|ThreadChannel}} options 
     * @param {Boolean} stopHandler 
     */
    constructor(interaction, options = { filter, time, max, wait, catcher, user, channel }, stopHandler = false, defer = true) {
        this.interaction = interaction;
        this.client = this.interaction.client;
        this.filter = options.filter;
        this.time = options.time ?? ms("1m");
        this.hasToWait = options.wait ?? false;
        this.defer = defer;
        this.user = options.user ?? this.interaction.user;
        this.channel = options.channel ?? this.interaction.channel;

        this.collector = this.channel.createMessageComponentCollector({ filter: this.filter, time: this.time, max: this.hasToWait ? 1 : options.max });

        if (!stopHandler) this.handle();
    }

    handle() {
        const active = this.client.activeCollectors.find(y => {
            let x = y.collector;
            return y.commandName === this.interaction.commandName && x.channelId === this.collector.channelId && x.interactionType === this.collector.interactionType && y.userid === this.user.id
        });

        if (active) {
            console.log("Ya hay activo un Collector de este tipo", this.client.activeCollectors);
            if (this.evalOnActive) this.evalOnActive();
            this.defaultOnActive(active);
        }

        this.client.activeCollectors.push({
            manager: this,
            collector: this.collector,
            userid: this.user.id,
            channelid: this.interaction.channel.id,
            commandName: this.interaction.commandName
        });

        if (!this.hasToWait) {
            this.collector.on("collect", async i => {
                try {
                    if (!i.deferred && this.defer) await i.deferUpdate();
                } catch (err) {
                    console.log("⚠️ %s", err)
                };
            });

            this.collector.on("end", async (collected, reason) => {
                let index = this.client.activeCollectors.findIndex(x => x.collector === this.collector && x.userid === this.user.id);
                if (index != -1) {
                    this.client.activeCollectors.splice(index, 1);
                } else {
                    console.log(`🟥 NO SE ELIMINÓ DE LOS ACTIVECOLLECTORS !!`)
                    console.log(this.raw());
                }

                try {
                    if (reason === EndReasons.OldCollector || reason === EndReasons.StoppedByUser) return await this.interaction.deleteReply();
                    if (reason === EndReasons.Done) return await this.interaction.editReply({ embeds: [new Embed({ type: "success" })], components: [], content: null });
                    if (reason === EndReasons.Deleted) return;
                    if (this.evalOnEnd) this.evalOnEnd(collected, reason);
                } catch (err) {
                    console.error("🔴 %s", err)
                }
            })
        }

        return this
    }

    defaultOnActive(active) {
        if (active.collector) active.collector.stop(EndReasons.OldCollector);
    }

    /**
     * 
     * @param {Function} fn 
     * @returns 
     */
    onActive(fn) {
        this.evalOnActive = fn;

        return this
    }

    onEnd(fn) {
        this.evalOnEnd = fn;

        return this
    }

    raw() {
        return this.collector;
    }

    /**
     * @param {Function} catcher Función a ejecutar cuando se acaba el tiempo, y no se recibió nada
     */
    async wait(catcher) {
        if (!this.hasToWait) throw new JeffreyBotError(this.interaction);

        return new Promise(async (res, rej) => {
            this.collector.on("collect", async i => {
                try {
                    if (!i.deferred && this.defer) await i.deferUpdate();
                } catch (err) {
                    console.error("⚠️ %s", err)
                };

                this.collector.stop(EndReasons.Done);
                res(i);
            })

            this.collector.on("end", async (collected, reason) => {
                let index = this.client.activeCollectors.findIndex(x => x.collector === this.collector && x.userid === this.user.id);
                if (this.evalOnEnd) this.evalOnEnd(collected, reason);

                if (index != -1) {
                    this.client.activeCollectors.splice(index, 1);
                } else {
                    console.log(`🟥 NO SE ELIMINÓ DE LOS ACTIVECOLLECTORS !!`)
                    console.log(this.raw());
                }

                if (reason === EndReasons.OldCollector || reason === EndReasons.StoppedByUser) {
                    try {
                        await this.interaction.deleteReply();
                    } catch (err) {
                        console.error("🔴 %s", err);
                    }
                    res(null);
                } else if (reason != EndReasons.Done && reason != "limit") {
                    if (catcher) {
                        try {
                            catcher();
                        } catch (err) {
                            console.error("🔴 %s", err);
                        }
                        res(null);
                    } else {
                        rej(EndReasons.TimeOut);
                    }
                }

            })
        })
    }
}

module.exports = Collector;