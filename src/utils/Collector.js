const { CommandInteraction } = require("discord.js");
const ms = require("ms");
const { EndReasons } = require("./Enums");
const Embed = require("./Embed");

/**
 * Un administrador de Component Collectors
 */
class Collector {
    /**
     * 
     * @param {CommandInteraction} interaction 
     * @param {{filter: Function, time: Number, max: Number, wait: Boolean}} options 
     * @param {Boolean} stopHandler 
     */
    constructor(interaction, options = { filter, time, max, wait }, stopHandler = false, defer = true) {
        this.interaction = interaction;
        this.client = this.interaction.client;
        this.filter = options.filter;
        this.time = options.time ?? ms("1m");
        this.wait = options.wait ?? false;
        this.defer = defer;

        this.collector = this.wait ? this.interaction.channel.awaitMessageComponent({ filter: this.filter, time: this.time, max: options.max }) : this.interaction.channel.createMessageComponentCollector({ filter: this.filter, time: this.time, max: options.max });

        if (!stopHandler) this.handle();
    }

    handle() {
        const active = this.client.activeCollectors.find(y => {
            let x = y.collector;
            return y.commandName === this.interaction.commandName && x.channelId === this.collector.channelId && x.interactionType === this.collector.interactionType && y.userid === this.interaction.user.id
        });
        if (active) {
            console.log(active);
            if (this.evalOnActive) this.evalOnActive();
            this.defaultOnActive(active);
        }

        if (!this.wait) {
            this.client.activeCollectors.push({ manager: this, collector: this.collector, userid: this.interaction.user.id, channelid: this.interaction.channel.id, commandName: this.interaction.commandName });
            this.collector.on("collect", async i => {
                try {
                    if (!i.deferred && this.defer) await i.deferUpdate();
                } catch (err) {
                    console.log("⚠️ %s", err)
                };
            });

            this.collector.on("end", async (collected, reason) => {
                let index = this.client.activeCollectors.findIndex(x => x.collector === this.collector && x.userid === this.interaction.user.id);
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
                    console.log("Error %s", err)
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
}

module.exports = Collector;