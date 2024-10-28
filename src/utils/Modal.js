const { MessageComponentInteraction, ModalBuilder, TextInputBuilder, ActionRowBuilder, ModalSubmitInteraction, CommandInteraction, TextInputStyle } = require("discord.js");
const { BadCommandError } = require("../errors");
const JeffreyBotError = require("../errors/JeffreyBotError");

class Modal extends ModalBuilder {
    /**
     * 
     * @param {CommandInteraction | MessageComponentInteraction | ModalSubmitInteraction} interaction 
     */
    constructor(interaction) {
        super()

        this.interaction = interaction;
    }

    defId(id) {
        this.setCustomId(id)
        return this
    }

    defTitle(title) {
        this.setTitle(title)
        return this
    }

    /**
     * 
     * @param {{id: string, value: string, label: string, style: TextInputStyle, req: boolean, placeholder: string, min: Number, max: Number}} options 
     * @returns {this}
     */
    addInput(options = { id: string, value: string, label: string, style: TextInputStyle, req: Boolean, placeholder: string, min: 0, max: Infinity }) {
        if (this.data.components?.length > 5) return console.error("🔴 No puedes agregar más Inputs")
        const { id, value, label, style, req, placeholder, min, max } = options;
        if (!id || !label || !style)
            throw new BadCommandError(this.interaction, "No están definidos: id, label, style en el Modal")
                .setEphemeral(true)
                .setFollowUp(true);
        const input = new TextInputBuilder()
            .setCustomId(id)
            .setLabel(label)
            .setStyle(style)

            .setRequired(req ?? false)
            .setPlaceholder(placeholder ?? "");

        if (value) input.setValue(value);
        if (min) input.setMinLength(min);
        if (max) input.setMaxLength(max);

        this.addComponents(new ActionRowBuilder().addComponents(input));
        return this
    }

    /**
     * @returns {Promise<void>} 
     */
    async show() {
        if (!this.data.custom_id || !this.data.title)
            throw new BadCommandError(this.interaction, new JeffreyBotError(null, "Falta CustomId o título en el Modal"))
        return await this.interaction.showModal(this)
    }

    read() {
        const fields = {};

        this.interaction.fields.fields.forEach(field => { // Collection
            if (field.value.length > 0) fields[field.customId] = field.value
        })

        return fields;
    }
}

module.exports = Modal