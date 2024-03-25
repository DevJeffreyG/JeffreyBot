const { Events } = require("discord.js");
const { Command } = require("../../src/utils");

const command = new Command({
    name: "emit",
    desc: "Emite un evento"
});

command.execute = async (interaction, models, params, client) => {
    await interaction.deferReply();
    await interaction.channel.fetch();

    await client.emit(Events.ChannelCreate, ...[interaction.channel]);

    await interaction.editReply({ content: "Done" });
}

module.exports = command;