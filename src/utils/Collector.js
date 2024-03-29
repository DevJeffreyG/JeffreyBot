const { CommandInteraction } = require("discord.js");
const ms = require("ms");
const { EndReasons } = require("./Enums");

/**
 * Un administrador de Component Collectors
 */
class Collector {
    /**
     * 
     * @param {CommandInteraction} interaction 
     * @param {{filter: Function, time: Number, max: Number}} options 
     * @param {Boolean} stopHandler 
     */
    constructor(interaction, options = { filter, time, max }, stopHandler = false) {
        this.interaction = interaction;
        this.client = this.interaction.client;
        this.filter = options.filter;
        this.time = options.time ?? ms("1m");

        this.collector = this.interaction.channel.createMessageComponentCollector({ filter: this.filter, time: this.time, max: options.max });

        if (!stopHandler) this.handle();
    }

    handle() {
        const active = this.client.activeCollectors.find(y => {
            let x = y.collector;
            return y.commandName === this.interaction.commandName && x.channelId === this.collector.channelId && x.interactionType === this.collector.interactionType && y.userid === this.interaction.user.id
        });
        if (active) {
            if (this.evalOnActive) this.evalOnActive();
            this.defaultOnActive(active);
        }

        this.client.activeCollectors.push({ manager: this, collector: this.collector, userid: this.interaction.user.id, channelid: this.interaction.channel.id, commandName: this.interaction.commandName });

        this.collector.on("collect", async i => {
            try {
                if (!i.deferred) await i.deferUpdate();
            } catch (err) {
                console.log("⚠️ %s", err)
            };
        });

        this.collector.on("end", async (collected, reason) => {
            console.log("ENDED")
            let index = this.client.activeCollectors.findIndex(x => x.collector === this.collector && x.userid === this.interaction.user.id);
            if (index != -1) {
                this.client.activeCollectors.splice(index, 1);
            } else {
                console.log(`🟥 NO SE ELIMINÓ DE LOS ACTIVECOLLECTORS !!`)
                console.log(this.raw());
            }

            try {
                if (reason === EndReasons.OldCollector) return this.interaction.deleteReply();
                if (reason === EndReasons.Deleted) return;
                if (this.evalOnEnd) this.evalOnEnd(collected, reason);
            } catch (err) {
                console.log("Error %s", err)
            }

        })

        return this
    }

    defaultOnActive(active) {
        active.collector.stop(EndReasons.OldCollector);
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