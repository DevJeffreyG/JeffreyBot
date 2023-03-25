const Emojis = require("../../Emojis");

class Managers {
    constructor(client) {
        this.client = client
    }

    async prepare() {
        this.emojis = await Emojis(this.client);

        return this
    }

    async emojis_mentionable() {
        let returnable = {}

        for await (const prop of Object.keys(this.emojis)) {
            returnable[prop] = this.emojis[prop].mention
        }

        return returnable;
    }
}

module.exports = Managers;