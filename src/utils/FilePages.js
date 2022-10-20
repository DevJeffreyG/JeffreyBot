const Discord = require("discord.js");
const { ButtonStyle } = require("discord-api-types/v10");
const ms = require("ms");

class FilePages {
    /**
     * Cheaper version of InteractivePages
     * @param {Discord.Attachment[]} files Array of files to use as pages
     */
    constructor(files) {
        this.files = files;
    }

    async init(interaction) {
        const client = interaction.client;

        const row = new Discord.ActionRowBuilder()
            .addComponents(
                new Discord.ButtonBuilder()
                    .setCustomId("back")
                    .setEmoji("⬅️")
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(true),
                new Discord.ButtonBuilder()
                    .setCustomId("next")
                    .setEmoji("➡️")
                    .setStyle(ButtonStyle.Primary),
            )

        if (this.files.length === 1) row.components.forEach(c => c.setDisabled()); // no tiene más de una pagina

        await interaction.editReply({ content: "", components: [row], files: [this.files[0]]});

        const filter = async i => {
            await i.deferUpdate();
            return i.user.id === interaction.user.id &&
                (i.customId === "back" || i.customId === "next");
        }


        const collector = interaction.channel.createMessageComponentCollector({ filter, time: ms("1m") });
        const active = client.activeCollectors.find(x => x.channelId === collector.channelId && x.interactionType === collector.interactionType);
        if (active) active.stop();

        client.activeCollectors.push(collector)

        let pagn = 0;
        collector.on("collect", async i => {
            if (i.customId === "back") pagn--;
            else pagn++;

            if (pagn === 0) row.components[0].setDisabled();
            else row.components[0].setDisabled(false);

            if (pagn === this.files.length - 1) row.components[1].setDisabled();
            else row.components[1].setDisabled(false);

            await interaction.editReply({ files: [this.files[pagn]], components: [row] });

        });

        collector.on("end", () => {
            row.components.forEach(c => c.setDisabled());
            interaction.editReply({ components: [row] });

            let index = client.activeCollectors.indexOf(collector);
            if (index > -1) client.activeCollectors.splice(index, 1);
        })
    }
}

module.exports = FilePages;