const { Guild } = require("discord.js");
const { Guilds } = require("mongoose").models;

class CustomEmojis {

    /**
     * Casi lo mismo que el Manager de emojis, pero para servidores
     * @param {Guild} guild 
     */
    constructor(guild) {
        this.guild = guild;
        this.client = this.guild.client;
    }

    async build() {
        this.doc = await Guilds.getWork(this.guild.id);

        const Currency = this.#resolve(this.doc.getEmoji("economy.currency")) ?? this.#resolve(this.client.EmojisObject.Jeffros.id);
        const DarkCurrency = this.#resolve(this.doc.getEmoji("economy.dark_currency")) ?? this.#resolve(this.client.EmojisObject.DarkJeffros.id);

        this.emojis = {
            Currency,
            DarkCurrency
        }

        return this
    }

    #resolve(resolvable) {
        return this.client.emojis.resolve(resolvable);
    }
}

module.exports = CustomEmojis;