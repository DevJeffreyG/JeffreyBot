const { CustomElements } = require("mongoose").models;
const { ActionRowBuilder, MessageComponentInteraction } = require("discord.js");
const { CustomButton, CustomEmbed } = require("../utils");

class Button {
    /**
     * @param {MessageComponentInteraction} interaction 
     */
    constructor(interaction) {
        this.interaction = interaction;
        this.customid = Number(this.interaction.customId.split("-")[2])
    }

    async handle() {
        const elements = await CustomElements.getOrCreate(this.interaction.guild.id);

        const button = elements.getButton(this.customid);
        if (!button) await this.interaction.deferUpdate();

        let embeds = [];
        let components = [];

        for (const embedId of button.embedids) {
            const embed = elements.getEmbed(embedId)

            embeds.push(new CustomEmbed(embed))

            let row = new ActionRowBuilder();

            for (const buttonId of embed.buttonids) {
                const customId = `BUTTON-${this.interaction.guild.id}-${buttonId}`;
                if (components.find(x => x.components.find(x => x.data.custom_id === customId))) continue;

                const innerbutton = elements.getButton(buttonId)
                const buttonObj = new CustomButton(innerbutton, this.interaction)

                if (!buttonObj.data.url)
                    buttonObj.setCustomId(customId);

                row.addComponents(buttonObj);
            }

            if (row.components.length > 0 && components.length < 5) components.push(row);
        }

        await this.interaction.reply({ embeds, components, ephemeral: true });
    }
}

module.exports = Button;