const { Client } = require("discord.js");
const { Bases } = require("./src/resources");

class EmojisManager {
    /**
     * 
     * @param {Client} client 
     */
    constructor(client) {
        this.client = client
        this.data = {};
    }

    async build() {
        console.log("=================== EMOJIS =======================")
        for await (const guildId of Bases.emojisguilds) {
            await this.client.guilds.fetch(guildId);
            const guild = this.client.guilds.cache.get(guildId);

            if (!guild.available) return console.error("No está disponible uno o más de los servidores de Emojis D:")

            const emojis = await guild.emojis.fetch();

            console.log("⚪ Recibiendo %s emojis de %s", emojis.size, guild.name)
            for (const emoji of emojis.toJSON()) {
                this.data[emoji.name] = {
                    id: emoji.id,
                    identifier: emoji.identifier,
                    mention: `<${emoji.animated ? "a" : ""}:${emoji.name}:${emoji.id}>`,
                    animated: emoji.animated,
                    url: emoji.url,
                }
            }
        }

        return this.data;
    }
}

module.exports = async (client) => {
    return await new EmojisManager(client).build();
}