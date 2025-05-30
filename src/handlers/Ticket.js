const { ButtonStyle, ActionRowBuilder, ButtonBuilder, PermissionsBitField, time, MessageComponentInteraction, StringSelectMenuBuilder, MessageFlags } = require("discord.js");

const Embed = require("../utils/Embed");

const { Confirmation, FindNewId, CreateInteractionFilter } = require("../utils/functions");

const Colores = require("../resources/colores.json");

const { Guilds } = require("mongoose").models;

const ms = require("ms");
const Log = require("../utils/Log");
const { ChannelModules, ModuleBans } = require("../utils/Enums");
const { DoesntExistsError, ModuleBannedError, ModuleDisabledError, PermissionError, BadSetupError } = require("../errors");
const { Collector } = require("../utils");

const ticketCooldown = ms("1m");

class Ticket {
    /**
     * @param {MessageComponentInteraction} interaction 
     */
    constructor(interaction) {
        let info = this.#getTicketInfo(interaction)
        this.interaction = interaction;
        this.client = this.interaction.client;
        this.customId = interaction.customId;
        this.author = interaction.user;
        this.guild = interaction.guild;
        this.userId = this.author.id;
        this.type = info.type;
        this.ticketCreator = info.userId;
        this.permissions = [
            {
                id: this.guild.roles.cache.find(x => x.name === "@everyone").id,
                deny: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages]
            },
            {
                id: this.userId,
                allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.EmbedLinks, PermissionsBitField.Flags.AttachFiles]
            }
        ];

        this.doesntExist = new DoesntExistsError(interaction, "Este ticket", "este servidor");

        this.#setStaffPerms();
        this.#setRows()
    }

    async handle(user, doc) {
        this.docGuild = doc;
        this.user = user;

        if (!this.docGuild.moduleIsActive("functions.tickets")) throw new ModuleDisabledError(this.interaction).setEphemeral(true);
        if (!this.interaction.deferred) await this.interaction.deferReply({ flags: [MessageFlags.Ephemeral] });

        switch (this.customId) {
            case "createTicket":
                await this.#createTicket();
                break;

            case "resolveTicket":
                await this.#resolveTicket();
                break;

            case "closeTicket":
                await this.#closeTicket();
                break;

            case "reopenTicket":
                await this.#reopenTicket();
                break;
        }
    }

    async #createTicket() {
        const doc = this.docGuild;

        // baneado de crear tickets
        if (this.user.isBannedFrom(ModuleBans.Tickets)) throw new ModuleBannedError(this.interaction);

        let selectMenuTopic = new StringSelectMenuBuilder()
            .setCustomId("selectTopic")
            .setPlaceholder("¿Qué necesitas hablar con el STAFF?")
            .addOptions(
                { label: "Tengo una duda / problema", value: "help" },
                { label: "Reportar a un usuario", value: "report" },
                { label: "Me dieron un Warn injusto", value: "warn" },
                //{label: "Me dieron un Softwarn injusto", value: "softwarn"},
                { label: "Hay un problema con Jeffrey Bot", value: "jeffreybot" }
            )
            .addOptions(
                { label: "Cancelar", value: "cancel", emoji: this.client.Emojis.Cross }
            );

        let selectingTopic = new ActionRowBuilder().addComponents([selectMenuTopic]);

        let topicMsg = await this.interaction.editReply({
            embeds: [
                new Embed()
                    .defTitle("¿Qué necesitas?")
                    .defColor(Colores.verde)
            ], components: [selectingTopic]
        });

        let topicCollector = await new Collector(this.interaction, {
            filter: CreateInteractionFilter(this.interaction, topicMsg),
            wait: true,
            time: ticketCooldown
        }, false, false).wait(() => this.interaction.editReply({ embeds: [new Embed({ type: "cancel" })], components: [] }));
        if (!topicCollector) return;

        await topicCollector.deferUpdate();

        const topic = topicCollector.values[0];
        if (topic === "cancel") return this.interaction.editReply({ embeds: [new Embed({ type: "cancel" })], components: [] });

        let toConfirm = [];
        let giveDetails = "Explícale al STAFF tu situación"; // lo que se envía junto al mensaje de creacion del ticket
        let newId = FindNewId(await Guilds.find(), "data.tickets", "id");

        const channelName = `ticket${newId}-${topic}-${this.userId}`;
        const category = this.guild.channels.cache.get(this.docGuild.getCategory("tickets"));
        const ticketType = topic.toUpperCase();

        if (!category) throw new BadSetupError(this.interaction, "La categoría de **Tickets** no está definida")

        let general = new Embed()
            .defFooter({ text: `ID del Ticket: ${newId}`, icon: this.guild.iconURL() })
            .defColor(Colores.verdeclaro);

        let timestatus = new Embed()
            .defFooter({ text: `El ticket se abrió` })
            .setTimestamp()
            .defColor(Colores.verde);

        if (topic === "help") {
            toConfirm = [
                "¿Estás segur@ de crear un nuevo ticket de ayuda?",
                "Las preguntas deben estar relacionadas con el servidor de Discord, nada fuera de él.",
                "El STAFF te responderá en cuanto pueda.",
                `Recuerda que en los canales <#${doc.getChannel("general.information")}> y <#${doc.getChannel("general.faq")}> se aclaran las dudas más comúnes, si no has revisado si tu duda está ahí, revísa primero antes de hacer un ticket.`
            ]

            general.defAuthor({ text: `Ayuda general.`, title: true });
            giveDetails = "Detalla ¿cuál es exactamente tu duda/problema?";
        } else if (topic === "report") {
            toConfirm = [
                "¿Estás segur@ de crear un nuevo ticket de reporte?",
                "Ten a la mano las pruebas de la razón por la que estás reportando al usuario.",
                `Reportar a un usuario si crees que incumple las reglas dentro y también **fuera del servidor** (O sea, en los mensajes directos)`,
                "El STAFF te atendrá en cuanto pueda."
            ]

            general.defAuthor({ text: `Reporte a un usuario.`, title: true });
            giveDetails = `Explica la situación, ¿a quién estás reportando? ¿cuáles son las pruebas y razones del reporte?\nEres libre de mencionarlos si crees que es urgente y pasa mucho tiempo.`
        } else if (topic === "warn") {
            // mostrar los WARNS
            let selectMenuWarn = new StringSelectMenuBuilder()
                .setCustomId("selectWarn")
                .setPlaceholder("Selecciona el WARN por el que quieres crear un ticket");

            for (let i = 0; i < this.user.warns.length; i++) {
                const warn = this.user.warns[i];
                const regla = doc.data.rules.find(x => x.id === warn.rule_id);

                if (!regla) continue;

                const label = `ID: ${warn.id} — Por: ${regla.name}`
                let desc = regla.desc ?? regla.expl;
                if (desc.length > 100) {
                    desc = desc.slice(0, 95) + "..."
                }

                if (!warn.madeTicket) selectMenuWarn.addOptions({ label, value: warn.id.toString(), description: desc });
            }
            selectMenuWarn.addOptions({ label: "Cancelar", value: "cancel", emoji: this.client.Emojis.Cross });

            let warnRow = new ActionRowBuilder().addComponents([selectMenuWarn]);

            let warnMsg = await topicCollector.editReply({
                embeds: [
                    new Embed()
                        .defTitle("¿Cuál es el warn por el cuál quieres hacer el ticket?")
                        .defColor(Colores.verde)
                ],
                components: [warnRow]
            });

            let warnCollector = await new Collector(this.interaction, {
                filter: CreateInteractionFilter(this.interaction, warnMsg),
                wait: true,
                time: ticketCooldown
            }, false, false).wait(() => this.interaction.editReply({ embeds: [new Embed({ type: "cancel" })], components: [] }));
            if (!warnCollector) return;

            await warnCollector.deferUpdate();
            if (warnCollector.values[0] === "cancel") return warnCollector.editReply({ embeds: [new Embed({ type: "cancel" })], components: [] });
            let selectedWarn = this.user.warns.find(x => x.id === Number(warnCollector.values[0]));

            if (!selectedWarn.proof) return warnCollector.editReply({ content: `⚠️ El **warn**" con ID: \`${selectedWarn.id}\`, lo tienes gracias a un item de las tiendas**, no podemos ayudarte.\n\n**Si crees que se trata de un error, contacta directamente al STAFF.**`, embeds: [], components: [] });

            toConfirm = [
                `Crear un nuevo ticket para el warn con id \`${selectedWarn.id}\`.`,
                `Regla N°${doc.data.rules.find(x => x.id === selectedWarn.rule_id).position} (${doc.data.rules.find(x => x.id === selectedWarn.rule_id).name}).`,
                `Las pruebas dadas por el STAFF las puedes ver usando ${this.client.mentionCommand("warns")}.`
            ];
            general.defAuthor({ text: `Apelar WARN.`, title: true });
            giveDetails = "Explica ¿por qué crees que la acción de moderación es injusta o debe quitarse?"

            selectedWarn.madeTicket = true;
        } else if (topic === "softwarn") {
            // mostrar los WARNS
            let selectMenuSoftWarn = new StringSelectMenuBuilder()
                .setCustomId("selectSoftWarn")
                .setPlaceholder("Selecciona el SOFTWARN por el que quieres crear un ticket");

            for (let i = 0; i < this.user.softwarns.length; i++) {
                const softwarn = this.user.softwarns[i];

                const label = `ID: ${softwarn.id} — Por: ${Reglas[softwarn.rule_id].regla}`

                if (!softwarn.madeTicket) selectMenuSoftWarn.addOptions({ label, value: softwarn.id.toString(), description: Reglas[softwarn.rule_id].description });
            }
            selectMenuSoftWarn.addOptions({ label: "Cancelar", value: "cancel", emoji: this.client.Emojis.Cross });

            let selectingWarn = new ActionRowBuilder().addComponents([selectMenuSoftWarn]);

            let softwarnMsg = await topicCollector.editReply({
                embeds: [
                    new Embed()
                        .defTitle("¿Cuál es el softwarn por el cuál quieres hacer el ticket?")
                        .defColor(Colores.verde)
                ],
                components: [selectingWarn]
            });

            let softwarnCollector = await new Collector(this.interaction, {
                filter: CreateInteractionFilter(this.interaction, softwarnMsg),
                wait: true,
                time: ticketCooldown
            }, false, false).wait(() => this.interaction.editReply({ embeds: [new Embed({ type: "cancel" })], components: [] }));
            if (!softwarnCollector) return;

            await softwarnCollector.deferUpdate();

            if (softwarnCollector.values[0] === "cancel") return softwarnCollector.editReply({ embeds: [new Embed({ type: "cancel" })], components: [] });

            let selectedSoftWarn = user.softwarns.find(x => x.id === Number(softwarnCollector.values[0]));

            //if(selectedSoftWarn.proof === "na") return softwarnCollector.editReply({content: `⚠️ El **softwarn**" con ID: \`${selectedSoftWarn.id}\`, lo tienes gracias a que **alguien te lo dio por la DarkShop**, no podemos ayudarte.\n\n**Si crees que se trata de un error, contacta directamente al Staff.**`, embeds: [], components: []});

            toConfirm = [
                `Crear un nuevo ticket para el softwarn con id \`${selectedSoftWarn.id}\`.`,
                `Regla N°${selectedSoftWarn.rule_id} (${Reglas[selectedSoftWarn.rule_id].regla}).`,
                `Las pruebas dadas por el STAFF las puedes ver usando ${client.mentionCommand("warns")}.`
            ];
            general.defAuthor({ text: `Apelar SOFTWARN.`, title: true });
            giveDetails = "Explica ¿por qué crees que la acción de moderación es injusta o debe quitarse?"

            selectedSoftWarn.madeTicket = true;
        } else if (topic === "jeffreybot") {
            toConfirm = [
                "¿Estás segur@ de crear un nuevo ticket de problemas con Jeffrey Bot?",
                "El STAFF te puede ayudar, sin embargo ten en cuenta que el que soluciona los bugs es Jeffrey."
            ]
            general.defAuthor({ text: `Problemas con Jeffrey Bot`, title: true });
            giveDetails = "Explica ¿cuál es exactamente tu problema con Jeffrey Bot?";
        }

        let confirmation = await Confirmation("Nuevo ticket", toConfirm, this.interaction);
        if (!confirmation) return;

        // CREAR CANAL  
        let channel = await category.children.create({
            name: channelName,
            topic: `**—** Ticket creado por **${this.interaction.member.displayName} (${this.interaction.user.username})** (${time()})`,
            permissionOverwrites: this.permissions
        });

        const toPin = await channel.send({ content: "El STAFF te ayudará en cuanto pueda.", embeds: [general, timestatus], components: [this.initial] })
        await toPin.pin();

        // GUARDARLO EN LA BASE DE DATOS
        this.docGuild.data.tickets.push({
            type: ticketType,
            created_by: this.interaction.user.id,
            channel_id: toPin.channel.id,
            message_id: toPin.id,
            creation_date: new Date(),
            id: newId
        });

        await this.docGuild.save();
        await this.user.save();

        await channel.send(`${this.author}, este será el canal donde el STAFF te podrá ayudar.\n${giveDetails}`)

        await new Log(this.interaction)
            .setTarget(ChannelModules.StaffLogs)
            .send({ content: `- **${this.interaction.user.username}** ha creado un nuevo ticket **(${ticketType})**: ${channel}` });

        return this.interaction.editReply({ content: `${this.client.Emojis.Check} Se ha creado el ticket: ${channel}`, embeds: [] });
    }

    async #closeTicket() {
        const interaction = this.interaction;
        if (!this.interaction.member.roles.cache.hasAny(...this.staffRoles)) return interaction.editReply({ content: "Sólo el STAFF puede forzar el cierre del ticket." });

        let confirmation = await Confirmation("Forzar cierre", [`El autor del ticket no lo ha marcado como resuelto`, `¿Estás segur@ de que quieres cerrar el ticket?`], interaction);
        if (!confirmation) return;

        //interaction.message.channel.delete();

        const ticket = this.docGuild.data.tickets.find(x => x.channel_id === interaction.channel.id);
        if (!ticket) throw this.doesntExist;

        const channel = interaction.channel;

        const message = await channel.messages.fetch(ticket.message_id);

        if (ticket.end_reason) return interaction.editReply({ content: `⚠️ Ya se ha marcado el final del ticket como ${ticket.end_reason}`, embeds: [], components: [] });

        let forcedEmbed = new Embed()
            .defFooter({ text: `El ticket fue cerrado` })
            .setTimestamp()
            .defColor(Colores.rojooscuro);

        let actualEmbeds = [];
        message.embeds.forEach(embed => {
            actualEmbeds.push(embed);
        });

        actualEmbeds.push(forcedEmbed)

        await message.edit({ embeds: actualEmbeds, components: [this.reopen] });

        ticket.end_date = new Date();
        ticket.end_reason = "FORCED";
        ticket.ended_by = interaction.user.id;

        await this.docGuild.save();
        //interaction.message.channel.delete();

        // eliminar al autor del ticket del canal
        await channel.permissionOverwrites.edit(ticket.created_by, {
            "ViewChannel": false,
            "SendMessages": false
        });

        await new Log(interaction)
            .setTarget(ChannelModules.StaffLogs)
            .send({ content: `- **${interaction.member.username}** ha forzado el cierre del ticket: ${channel}` });

        return await interaction.editReply({ content: `${this.client.Emojis.Check} Se cerró el Ticket.`, embeds: [], components: [] });
    }

    async #resolveTicket() {
        const interaction = this.interaction;

        if (this.ticketCreator != interaction.user.id) return interaction.editReply({ content: "Sólo el creador del ticket puede marcarlo como resuelto." });

        let confirmation = await Confirmation("Marcar como resuelto", [`¿Estás segur@ de que quieres cerrar el ticket?`, `Sólo podría ser abierto  devuelta por un miembro del STAFF`], interaction);
        if (!confirmation) return;

        const ticket = this.docGuild.data.tickets.find(x => x.channel_id === interaction.channel.id);
        if (!ticket) throw this.doesntExist;

        const channel = interaction.channel;

        const message = await channel.messages.fetch(ticket.message_id);

        if (ticket.end_reason) return interaction.editReply({ content: `⚠️ Ya se ha marcado el final del ticket como ${ticket.end_reason}`, embeds: [], components: [] });

        let closedEmbed = new Embed()
            .defFooter({ text: `El ticket se marcó como resuelto` })
            .setTimestamp()
            .defColor(Colores.rojo);

        let actualEmbeds = [];
        message.embeds.forEach(embed => {
            actualEmbeds.push(embed);
        });

        actualEmbeds.push(closedEmbed);

        await message.edit({ embeds: actualEmbeds, components: [this.reopen] });

        ticket.end_date = new Date();
        ticket.end_reason = "RESOLVED";
        ticket.ended_by = interaction.user.id;

        await this.docGuild.save();

        await interaction.editReply({ content: `${this.client.Emojis.Check} El Ticket se marcó como resuelto.`, embeds: [], components: [] });

        await new Log(interaction)
            .setTarget(ChannelModules.StaffLogs)
            .send({ content: `- **${interaction.user.username}** ha marcado como resuelto el ticket: ${channel}` });

        // eliminar al autor del ticket del canal
        return await channel.permissionOverwrites.edit(ticket.created_by, {
            "ViewChannel": false,
            "SendMessages": false
        });
    }

    async #reopenTicket() {
        const interaction = this.interaction;
        if (!this.docGuild.checkStaff(interaction.member))
            throw new PermissionError(interaction);

        let confirmation = await Confirmation("Abrir ticket", [`¿Estás segur@ de que quieres volver a abrir el ticket?`, `Se mencionará al creador original del ticket`], interaction);
        if (!confirmation) return;

        const ticket = this.docGuild.data.tickets.find(x => x.channel_id === interaction.channel.id);
        if (!ticket) throw this.doesntExist;

        const channel = interaction.channel;

        const message = await channel.messages.fetch(ticket.message_id);

        let reopenedEmbed = new Embed()
            .defFooter({ text: `El ticket se volvió a abrir` })
            .setTimestamp(new Date())
            .defColor(Colores.verdeclaro);

        let actualEmbeds = [];
        message.embeds.forEach(embed => {
            actualEmbeds.push(embed);
        });

        actualEmbeds.push(reopenedEmbed);

        await message.edit({ embeds: actualEmbeds, components: [this.initial] });

        ticket.end_reason = null;
        ticket.ended_by = null;
        ticket.end_date = null;

        await this.docGuild.save();

        // agregar al creador original al canal otra vez
        await channel.permissionOverwrites.edit(ticket.created_by, {
            "ViewChannel": true,
            "SendMessages": true
        });

        let originalCreator = this.guild.members.cache.find(x => x.id === ticket.created_by);

        await interaction.editReply({ content: `${this.client.Emojis.Check} Se reabrió el ticket.`, embeds: [], components: [] });

        await new Log(interaction)
            .setTarget(ChannelModules.StaffLogs)
            .send({ content: `- **${interaction.member.username}** ha reabierto el ticket: ${channel}` });

        // mencionar al creador original
        return channel.send(`¡${originalCreator}! El STAFF ha vuelto a abrir tu ticket.`);
    }

    #setRows() {
        this.reopen = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId("reopenTicket")
                    .setLabel("Volver a abrir el ticket")
                    .setStyle(ButtonStyle.Secondary)
            );

        this.initial = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId("resolveTicket")
                    .setLabel("Marcar como resuelto")
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId("closeTicket")
                    .setLabel("Cerrar ticket")
                    .setStyle(ButtonStyle.Danger)
            )
    }

    #setStaffPerms() {
        Guilds.getById(this.guild.id).then(g => {
            this.docGuild = g;
            this.staffRoles = g.getStaffs();

            this.staffRoles.forEach(id => {
                this.permissions.push({
                    id,
                    allow: [PermissionsBitField.All]
                })
            })
        });
    }

    #getTicketInfo(interaction) {
        let split = interaction.channel.name.split("-");

        return {
            type: split[1],
            userId: split[2]
        }
    }
}

module.exports = Ticket;