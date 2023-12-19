const { CustomElements } = require("mongoose").models;
const { ActionRowBuilder, MessageComponentInteraction, ButtonStyle, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ButtonBuilder } = require("discord.js");
const { CustomButton, CustomEmbed, Log, LogReasons, ChannelModules, ErrorEmbed, Embed } = require("../utils");
const { InsuficientSetupError, DoesntExistsError } = require("../errors");

class Button {
    /**
     * @param {MessageComponentInteraction} interaction 
     */
    constructor(interaction) {
        this.interaction = interaction;
        this.customid = Number(this.interaction.customId.split("-")[1]);
    }

    async handle() {
        await this.interaction.deferReply({ ephemeral: true })
        const elements = await CustomElements.getWork(this.interaction.guild.id);

        const button = elements.getButton(this.customid);
        if (!button) await this.interaction.deferUpdate();

        let embeds = [];
        let components = [];

        for (const embedId of button.embedids) {
            const embed = elements.getEmbed(embedId)

            embeds.push(
                new CustomEmbed(this.interaction)
                    .create(embed)
            )

            let row = new ActionRowBuilder();
            let row_autoroles = new ActionRowBuilder();

            for (const linked of embed.linkedids) {
                const linkId = linked.id;
                const customId = `BUTTON-${linkId}-${linked.isAutoRole}`;
                if (components.find(x => x.components.find(x => x.data.custom_id === customId))) continue;

                let innerbutton = elements.getButton(linkId)

                // Si el elemento que está vinculado en este embed es un AutoRole
                if (linked.isAutoRole) {
                    row_autoroles.setComponents(
                        new ButtonBuilder()
                            .setCustomId(`AUTOROLE-${embedId}`)
                            .setLabel("Mostrar AutoRoles")
                            .setStyle(ButtonStyle.Secondary)
                    )
                    // Sino, significa que es un botón que muestra otro Embed
                } else if (innerbutton) {
                    const buttonObj = new CustomButton(this.interaction).create(innerbutton)

                    if (!buttonObj.data.url)
                        buttonObj.setCustomId(customId);

                    row.addComponents(buttonObj);
                }
            }

            if (row.components.length > 0 && components.length < 5) components.push(row);
            if (row_autoroles.components.length > 0 && components.length < 5) components.push(row_autoroles);
        }

        if (embeds.length === 0)
            throw new InsuficientSetupError(this.interaction, "No hay Embeds vinculados", [
                `Avísale a los Administradores que el Botón \`${this.customid}\` no tiene Embeds`
            ])

        await this.interaction.editReply({ embeds, components });

    }
}

module.exports = Button;