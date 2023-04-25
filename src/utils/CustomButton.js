const { CustomElements } = require("mongoose").models;
const { ButtonBuilder, CommandInteraction, ButtonStyle } = require("discord.js");
const { FindNewId, Confirmation } = require("./functions");
const Embed = require("./Embed");
const { BadParamsError, DiscordLimitationError, DoesntExistsError } = require("../errors");

class CustomButton extends ButtonBuilder {
    /**
     * 
     * @param {*} params 
     * @param {CommandInteraction | null} interaction 
     */
    constructor(params, interaction = null) {
        super();
        this.linked = null;
        this.interaction = interaction;
        if (params) this.#creation(params);
    }

    /**
     * Guarda el Botón a la base de datos del servidor
     * @returns {Promise<CommandInteraction>}
     */
    async save() {
        this.doc = await CustomElements.getOrCreate(this.interaction.guild.id);

        const id = FindNewId(await CustomElements.find(), "buttons", "id")

        this.doc.addButton(this.raw(), id, this.linked);
        await this.doc.save();

        return await this.interaction.editReply({
            embeds: [
                new Embed({
                    type: "success",
                    data: {
                        desc: [
                            `Se ha creado el Botón. Usa ${this.interaction.client.mentionCommand("elements buttons edit")} para hacerle cambios`,
                            `ID: ${id}`
                        ]
                    }
                })
            ]
        })
    }

    /**
     * Reemplaza este CustomButton con otro en la base de datos
     * @param {Integer} id La Id del Botón a editar
     * @returns {Promise<CommandInteraction>}
     */
    async replace(id) {
        this.doc = await CustomElements.getOrCreate(this.interaction.guild.id);
        let cstmButton = this.doc.getButton(id);
        let button = this.raw();

        if (button.label) cstmButton.texto = button.label;
        if (button.emoji) cstmButton.emoji = button.emoji.id ?? button.emoji.name;
        if (button.style) cstmButton.style = button.style;
        if (button.url) cstmButton.link = button.url;
        if (this.linked && cstmButton.style != ButtonStyle.Link) cstmButton.embedids = this.linked;

        await this.doc.save();

        return this.interaction.editReply({
            embeds: [
                new Embed({
                    type: "success",
                    data: {
                        desc: [
                            `Se ha editado el Botón. Usa ${this.interaction.client.mentionCommand("elements buttons link")} para vincularlo a un Embed`,
                            `ID: ${id}`
                        ]
                    }
                })
            ]
        })
    }

    /**
     * Elimina un Botón en la base de datos
     * @param {Integer} id La Id del Botón a eliminar
     * @param {CommandInteraction} interaction 
     * @returns {Promise<CommandInteraction>}
     */
    async delete(id, interaction) {
        this.doc = await CustomElements.getOrCreate(interaction.guild.id);

        try {
            this.doc.deleteButton(id);
            await this.doc.save();

            return interaction.editReply({
                embeds: [
                    new Embed({
                        type: "success",
                        data: {
                            desc: `Se ha eliminado el Botón`
                        }
                    })
                ]
            })
        } catch (err) {
            throw new DoesntExistsError(interaction, `El Botón con ID \`${id}\``, "este servidor");
        }
    }

    /**
     * 
     * @param {Integer} buttonId El Botón que se va a vincular
     * @param {Integer} embedId El Embed donde se va a vincular
     * @param {CommandInteraction} interaction 
     */
    async linkWork(buttonId, embedId, interaction) {
        this.doc = await CustomElements.getOrCreate(interaction.guild.id);

        const embed = this.doc.getEmbed(embedId);
        if (!embed)
            throw new DoesntExistsError(interaction, `El Embed con ID \`${embedId}\``, "este servidor");

        if (embed.buttonids?.find(x => x === buttonId)) {
            let confirmation = await Confirmation("Desvincular Botón", [
                "A partir de ahora, cuando se envíe este Embed no se incluirá el Botón"
            ], interaction)

            if (!confirmation) return;
            embed.splice(embed.buttonids.findIndex(x => x === buttonId), 1);
        } else {
            let confirmation = await Confirmation("Vincular Botón", [
                "Se pondrá este botón abajo del Embed al enviarse a partir de ahora"
            ], interaction)

            if (!confirmation);

            if (embed.buttonids.length === 5)
                throw new DiscordLimitationError(interaction, ">5 Botones", [
                    "No pueden haber más de 5 botones por mensaje",
                    "Para continuar, desvincula un botón antes (usando este mismo comando)"
                ])

            embed.buttonids.push(buttonId);
        }

        await this.doc.save();
        return await interaction.editReply({ embeds: [new Embed({ type: "success" })] })
    }

    raw() {
        console.log(this.data)
        return this.data;
    }

    #creation(params) {
        const { texto, emoji, style, link, embedids } = params;

        const text = texto?.value ?? texto;
        const emote = emoji?.value ?? emoji;
        const sty = style?.value ?? style;
        const url = link?.value ?? link;
        const linkEmbed = embedids?.value ?? embedids;

        if (text) this.setLabel(text)
        if (emote) this.setEmoji(emote)
        if (sty) this.setStyle(Number(sty))

        if (this.data.style === ButtonStyle.Link) {
            if (url) this.setURL(url)
            else {
                throw new BadParamsError(this.interaction, "Falta agregar una URL")
            }
        } else {
            if (url) {
                throw new BadParamsError(this.interaction, [
                    "No puedes usar una URL en un Botón que no sea de tipo Link"
                ])
            }
        }

        if (!url) {
            this.setCustomId("placeholder");

            if (linkEmbed) {
                this.linked = Array.isArray(linkEmbed) ? linkEmbed : linkEmbed.split(",").map(Number);

                if (this.data.style === ButtonStyle.Link && this.linked.length > 0)
                    throw new BadParamsError(this.interaction, [
                        "No puedes crear un Botón tipo Link y mostrar Embeds con él"
                    ])

                if (this.linked.length > 10)
                    throw new DiscordLimitationError(this.interaction, ">10 Embeds", [
                        "No puedes enviar un sólo mensaje con más de 10 Embeds",
                        "Baja la cantidad"
                    ])
            } else {
                throw new BadParamsError(this.interaction, "Debes vincular al menos un Embed para mostrar si no es de tipo Link")
            }
        }
    }
}

module.exports = CustomButton;