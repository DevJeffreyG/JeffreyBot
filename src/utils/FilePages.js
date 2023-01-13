const { Attachment, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const ms = require("ms");
const { EndReasons } = require("./Enums");

class FilePages {
    /**
     * Cheaper version of InteractivePages
     * @param {Attachment[]} files Array of files to use as pages
     */
    constructor(files) {
        this.files = files;
    }

    async init(interaction) {
        const client = interaction.client;

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

        let msg = await interaction.editReply({ content: "", components: [row], files: [this.files[0]] });

        const filter = async i => {
            try {
                if (!i.deferred) await i.deferUpdate()
            } catch (err) {
                //console.log("⚠️ %s", err)
            };

            return i.user.id === interaction.user.id &&
                (i.customId === "back" || i.customId === "next") &&
                i.message.id === msg.id;
        }


        const collector = interaction.channel.createMessageComponentCollector({ filter, time: ms("1m") });
        const active = client.activeCollectors.find(y => {
            let x = y.collector;
            return x.channelId === collector.channelId && x.interactionType === collector.interactionType && y.userid === interaction.user.id
        });
        if (active) active.collector.stop(EndReasons.OldCollector);

        client.activeCollectors.push({ collector, userid: interaction.user.id })

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

        collector.on("end", (i, r) => {
            row.components.forEach(c => c.setDisabled());
            interaction.editReply({ components: [row] });

            let index = client.activeCollectors.findIndex(x => x.collector === collector && x.userid === interaction.user.id);
            if (!isNaN(index)) {
                client.activeCollectors.splice(index, 1);
            } else console.log(`🟥 NO SE ELIMINÓ DE LOS ACTIVECOLLECTORS !! {FILE PAGES}`)

            if (r === EndReasons.OldCollector) return interaction.deleteReply()
        })
    }
}

module.exports = FilePages;