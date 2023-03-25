const { MessageComponentInteraction, ModalBuilder, TextInputBuilder, ActionRowBuilder, ModalSubmitInteraction } = require("discord.js");
const ErrorEmbed = require("./ErrorEmbed");

class Modal extends ModalBuilder {
    /**
     * 
     * @param {MessageComponentInteraction | ModalSubmitInteraction} interaction 
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

    addInput(options = { id, label, style, req, placeholder, min, max }) {
        const { id, label, style, req, placeholder, min, max } = options;
        if (!id || !label || !style) return new ErrorEmbed(this.interaction, {
            type: "badFunction",
            data: {
                error: "NO ESTA DEFINIDO ID LABEL STYLE: MODAL"
            }
        }).send({ followup: true, ephemeral: true });
        const input = new TextInputBuilder()
            .setCustomId(id)
            .setLabel(label)
            .setStyle(style)

            .setRequired(req ?? null)
            .setPlaceholder(placeholder ?? null);

        if (min) input.setMinLength(min)
        if (max) input.setMaxLength(max);

        this.addComponents(new ActionRowBuilder().addComponents(input));
        return this
    }

    async show() {
        return await this.interaction.showModal(this)
            .catch(err => {
                return new ErrorEmbed(this.interaction, {
                    type: "badFunction",
                    data: {
                        error: err
                    }
                }).send({ followup: true, ephemeral: true });
            });
    }

    read() {
        const fields = {};

        this.interaction.fields.fields.forEach(field => { // Collection
            fields[field.customId] = field.value
        })

        return fields;
    }
}

module.exports = Modal