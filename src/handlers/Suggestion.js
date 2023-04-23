const { MessageComponentInteraction, TextInputStyle, ModalSubmitInteraction, codeBlock, time, hyperlink } = require("discord.js");
const { Colores } = require("../resources");
const { ErrorEmbed, Modal, Log, Embed, ChannelModules, LogReasons } = require("../utils");
const { FetchError, ModuleDisabledError, PermissionError } = require("../errors");

class Suggestion {
    /**
     * @param {MessageComponentInteraction | ModalSubmitInteraction} interaction 
     */
    constructor(interaction) {
        this.interaction = interaction;
        this.client = this.interaction.client;

        this.modal = new Modal(this.interaction)
            .defId(this.interaction.customId);
    }

    async handle(user, doc) {
        this.user = user;
        this.doc = doc;

        let staffRoles = this.doc.getStaffs();

        if (!this.interaction.member.roles.cache.hasAny(...staffRoles)) throw new PermissionError(this.interaction);
        if (!this.doc.moduleIsActive("functions.suggestions")) throw new ModuleDisabledError(interaction);
        if (this.interaction instanceof ModalSubmitInteraction) return await this.#modalHandler();

        //if (!this.interaction.deferred) await this.interaction.deferReply({ ephemeral: true });

        switch (this.interaction.customId) {
            case "acceptSuggestion": {
                await this.modal
                    .defTitle("Aceptar sugerencia")
                    .addInput({
                        id: "reasonInput",
                        label: "Razón",
                        style: TextInputStyle.Paragraph,
                        req: true,
                        placeholder: "Escribe porqué fue aprobada esta sugerencia",
                        max: 1024
                    })
                    .show();
                break;
            }

            case "denySuggestion": {
                await this.modal
                    .defTitle("Denegar sugerencia")
                    .addInput({
                        id: "reasonInput",
                        label: "Razón",
                        style: TextInputStyle.Paragraph,
                        req: true,
                        placeholder: "Escribe porqué fue rechazada esta sugerencia",
                        max: 1024
                    })
                    .show();
                break;
            }

            case "invalidateSuggestion": {
                await this.modal
                    .defTitle("Invalidar sugerencia")
                    .addInput({
                        id: "reasonInput",
                        label: "Razón",
                        style: TextInputStyle.Paragraph,
                        req: true,
                        placeholder: "Escribe porqué fue invalidada esta sugerencia",
                        max: 1024
                    })
                    .show();
                break;
            }
        }
    }

    async #modalHandler() {
        const suggestionNotFound = new FetchError(this.interaction, "sugerencia", [
            "Eso no debió pasar...", "No encontré esa sugerencia en la base de datos"
        ])
        .setEphemeral(true);

        const suggestion = this.doc.data.suggestions.find(x => x.message_id === this.interaction.message.id);
        if (!suggestion) {
            await this.interaction.message.edit({ components: [] })
            throw suggestionNotFound;
        }

        const suggesterRole = await this.interaction.guild.roles.fetch(this.doc.getRoleByModule("suggester_role"));
        const suggester = await this.interaction.guild.members.fetch(suggestion.user_id);

        const recievedModal = new Modal(this.interaction).read();
        suggestion.reason = recievedModal.reasonInput;

        let embed = new Embed();

        switch (this.interaction.customId) {
            case "acceptSuggestion": {
                suggestion.accepted = true;

                let newembed = new Embed(this.interaction.message.embeds[0])
                    .defTitle(`Sugerencia aprobada el ${time(new Date(), "d")}`)
                    .defFields([{ up: `Aprobada por ${this.interaction.user.tag}`, down: recievedModal.reasonInput }])
                    .defFooter({ text: "Aprobada", icon: this.interaction.client.EmojisObject.Check.url, timestamp: true })
                    .defColor(Colores.verdeclaro);

                this.interaction.message.edit({ embeds: [newembed] });

                embed
                    .defAuthor({ text: "¡Se ha aprobado tu sugerencia!", icon: this.interaction.client.EmojisObject.Check.url })
                    .setDescription(`**—** ¡Gracias por ayudarnos a mejorar!
**—** Se ha aceptado tu ${hyperlink("sugerencia", this.interaction.message.url)}:
${codeBlock(suggestion.suggestion)}`)
                    .defColor(Colores.verde)
                    .defFooter({ text: this.interaction.guild.name, icon: this.interaction.guild.iconURL(), timestamp: true });

                if (!suggester.roles.cache.has(suggesterRole.id)) {
                    await suggester.roles.add(suggesterRole)
                        .catch(err => {
                            new Log(this.interaction)
                                .setTarget(ChannelModules.StaffLogs)
                                .setReason(LogReasons.Error)
                                .send({
                                    embeds: [
                                        new ErrorEmbed()
                                            .defDesc(`No se pudo agregar el role de agradecimiento a ${suggester} por sugerir:${codeBlock(suggestion.suggestion)}Error:${codeBlock("js", err)}`)
                                    ]
                                })
                        });

                    embed.defDesc(embed.data.description + `**—** Nos tomamos la libertad de agregarte un role como forma de agradecimiento 😉`);
                }
                this.interaction.reply({ ephemeral: true, content: "Se ha aceptado la sugerencia, se ha enviado un mensaje al usuario y se le ha dado el rol de colaborador." });
                break;
            }

            case "denySuggestion": {
                suggestion.accepted = false;

                let newembed = new Embed(this.interaction.message.embeds[0])
                    .defTitle(`Sugerencia rechazada el ${time(new Date(), "d")}`)
                    .defFields([{ up: `Rechazada por ${this.interaction.user.tag}`, down: recievedModal.reasonInput }])
                    .defFooter({ text: "Rechazada", icon: this.interaction.client.EmojisObject.Cross.url, timestamp: true })
                    .defColor(Colores.rojo);

                this.interaction.message.edit({ embeds: [newembed] });

                embed
                    .defAuthor({ text: "¡Gracias por el interés!", icon: this.interaction.client.EmojisObject.Cross.url })
                    .defDesc(`**—** Hemos rechazado tu ${hyperlink("sugerencia", this.interaction.message.url)}:
${codeBlock(suggestion.suggestion)}
**—** ¡Gracias por ayudarnos a mejorar, siempre te tendremos en cuenta!`)
                    .defColor(Colores.rojo)
                    .defFooter({ text: this.interaction.guild.name, icon: this.interaction.guild.iconURL({ dynamic: true }), timestamp: true });

                this.interaction.reply({ ephemeral: true, content: "Se ha rechazado la sugerencia, se ha enviado un mensaje al usuario informándole." });
                break;
            }

            case "invalidateSuggestion": {
                suggestion.accepted = false;

                let newembed = new Embed(this.interaction.message.embeds[0])
                    .defTitle(`Sugerencia invalidada el ${time(new Date(), "d")}`)
                    .defFields([{ up: `Invalidada por ${this.interaction.user.tag}`, down: recievedModal.reasonInput }])
                    .defFooter({ text: "Inválida", icon: this.interaction.client.EmojisObject.Error.url, timestamp: true })
                    .defColor(Colores.rojo)

                this.interaction.message.edit({ embeds: [newembed] });

                embed
                    .defAuthor({ text: "¡Gracias por el interés!", icon: this.interaction.client.EmojisObject.Error.url })
                    .defDesc(`**—** Hemos determinado que tu ${hyperlink("sugerencia", this.interaction.message.url)} es inválida:
${codeBlock(suggestion.suggestion)}
**—** Puede que esta haya sido una sugerencia repetida, o una ya denegada anteriormente.
**—** ¡Gracias por ayudarnos a mejorar, siempre te tendremos en cuenta!`)
                    .defColor(Colores.rojo)
                    .defFooter({ text: this.interaction.guild.name, icon: this.interaction.guild.iconURL({ dynamic: true }), timestamp: true });

                this.interaction.reply({ ephemeral: true, content: "Se ha invalidado la sugerencia, se ha enviado un mensaje al usuario informándole." });
                break;
            }
        }


        try {
            await suggester.send({ embeds: [embed] });
        } catch (e) {
            this.interaction.followUp({ ephemeral: true, content: "No se pueden enviar mensajes a este usuario..." })
        }

        this.doc.save();
    }
}

module.exports = Suggestion