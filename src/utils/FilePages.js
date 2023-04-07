const { Attachment, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const Collector = require("./Collector");

class FilePages {
    /**
     * Cheaper version of InteractivePages
     * @param {Attachment[]} files Array of files to use as pages
     */
    constructor(files) {
        this.files = files;
    }

    async init(interaction) {
        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId("back")
                    .setEmoji("⬅️")
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(true),
                new ButtonBuilder()
                    .setCustomId("next")
                    .setEmoji("➡️")
                    .setStyle(ButtonStyle.Primary),
            )

        if (this.files.length === 1) row.components.forEach(c => c.setDisabled()); // no tiene más de una pagina

        let msg = await interaction.editReply({ content: "", components: [row], files: [this.files[0]], embeds: [] });

        const filter = async i => {
            return i.user.id === interaction.user.id &&
                (i.customId === "back" || i.customId === "next") &&
                i.message.id === msg.id;
        }


        const collector = new Collector(interaction, { filter }).onEnd(() => {
            row.components.forEach(c => c.setDisabled());
            interaction.editReply({ components: [row] });
        }).raw();

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
    }
}

module.exports = FilePages;