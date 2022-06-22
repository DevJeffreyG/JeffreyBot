const { SlashCommandBuilder } = require('@discordjs/builders');

class Command {
    constructor(data = {name: "foo", desc: "bar", helpdesc: null, category: "0"}){
        this.data = new SlashCommandBuilder()
            .setName(data.name.toLowerCase())
            .setDescription(data.desc)

        this.name = this.data.name;
        this.info = data.helpdesc ?? this.data.description;
        this.category = data.category;
        this.execute = null;
    }
}

module.exports = Command;