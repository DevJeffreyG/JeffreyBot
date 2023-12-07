const { MessageComponentInteraction, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } = require("discord.js");
const { Collector, CreateInteractionFilter } = require("../utils");

const ms = require("ms");

class ManagePreferences {
    /**
     * @param {MessageComponentInteraction} interaction 
     */
    constructor(interaction) {
        this.interaction = interaction;

        this.customId = this.interaction.customId;
        this.toManage = this.customId.split("-")[2];
    }

    async handle(preferences) {
        await this.interaction.deferReply({ ephemeral: true });
        this.preferences = preferences;

        await this.manage();
    }

    async manage() {
        let { options, allowed } = this.preferences.direct_messages;

        switch (this.toManage) {
            case "dm":
                let msg = await this.interaction.editReply({
                    components: [
                        new ActionRowBuilder()
                            .setComponents(
                                new ButtonBuilder()
                                    .setCustomId("options")
                                    .setLabel("Opciones para todas")
                                    .setStyle(ButtonStyle.Secondary),
                                new ButtonBuilder()
                                    .setCustomId("allowed")
                                    .setLabel("Habilitadas")
                                    .setStyle(ButtonStyle.Secondary),
                                new ButtonBuilder()
                                    .setCustomId("stop")
                                    .setEmoji("🛑")
                                    .setStyle(ButtonStyle.Danger)
                            )
                    ]
                })

                let collector = await new Collector(this.interaction, {
                    wait: true,
                    filter: CreateInteractionFilter(this.interaction, msg),
                    time: ms("1m")
                }).wait(() => {
                    this.interaction.deleteReply()
                })
                if (!collector) return;

                const dmOptions = [
                    new StringSelectMenuOptionBuilder()
                        .setLabel("Notificaciones silenciadas")
                        .setDescription("Te llegan mensajes, pero estas no harán ruido, ni llegarán a teléfonos móviles")
                        .setValue("supressed")
                        .setDefault(options.supressed),
                    new StringSelectMenuOptionBuilder()
                        .setLabel("Mensajes directos habilitados")
                        .setDescription("Deshabilitar esto hará que no recibas ningún mensaje de Jeffrey Bot, de ningún servidor.")
                        .setValue("allowed")
                        .setDefault(options.allowed)
                ]

                const dmAllowed = [
                    new StringSelectMenuOptionBuilder()
                        .setLabel("Moderación")
                        .setDescription("Warns, Bans, etc")
                        .setValue("moderation")
                        .setDefault(allowed.moderation),
                    new StringSelectMenuOptionBuilder()
                        .setLabel("Mascotas")
                        .setDescription("Salud baja, hambre, etc")
                        .setValue("pets")
                        .setDefault(allowed.pets),
                    new StringSelectMenuOptionBuilder()
                        .setLabel("Bienvenida")
                        .setDescription("Mensajes de bienvenidas a servidores")
                        .setValue("welcome")
                        .setDefault(allowed.welcome),
                    new StringSelectMenuOptionBuilder()
                        .setLabel("Pagos")
                        .setDescription("Pagos automáticos hechos en un servidor")
                        .setValue("payments")
                        .setDefault(allowed.payments),
                    new StringSelectMenuOptionBuilder()
                        .setLabel("Trofeos")
                        .setDescription("Desbloqueo de Trofeos en los servidores")
                        .setValue("trophies")
                        .setDefault(allowed.trophies),
                    new StringSelectMenuOptionBuilder()
                        .setLabel("STAFF")
                        .setDescription("Mensajes directos enviados por el STAFF a través del bot")
                        .setValue("staff")
                        .setDefault(allowed.staff),
                    new StringSelectMenuOptionBuilder()
                        .setLabel("Cumpleaños")
                        .setDescription("Recordatorios de cumpleaños que hayas querido recordar")
                        .setValue("birthdays")
                        .setDefault(allowed.birthdays),
                    new StringSelectMenuOptionBuilder()
                        .setLabel("Ingresos")
                        .setDescription("Dinero que haya sido se te haya adicionado en un servidor por algo externo")
                        .setValue("incomes")
                        .setDefault(allowed.incomes)
                ]

                switch (collector.customId) {
                    case "options": {
                        msg = await this.interaction.editReply({
                            components: [
                                new ActionRowBuilder()
                                    .setComponents(
                                        new StringSelectMenuBuilder()
                                            .setCustomId("selectOptions")
                                            .setPlaceholder("Cambia tus preferencias")
                                            .setMinValues(0)
                                            .setMaxValues(dmOptions.length)
                                            .setOptions(dmOptions)
                                    )
                            ]
                        })

                        collector = await new Collector(this.interaction, {
                            wait: true,
                            filter: CreateInteractionFilter(this.interaction, msg),
                            time: ms("5m")
                        }).wait(() => {
                            this.interaction.deleteReply()
                        })
                        if (!collector) return;

                        // Volver todas las opciones falsas temporalmente
                        Object.keys(this.preferences.direct_messages.options).forEach(
                            (prop) => this.preferences.direct_messages.options[prop] = false
                        );

                        // Poner las que el usuario quiere como verdaderas
                        collector.values.forEach(enabledOption => {
                            this.preferences.direct_messages.options[enabledOption] = true;
                        });

                        await this.preferences.save();
                        this.manage();
                        break;
                    }

                    case "allowed": {
                        msg = await this.interaction.editReply({
                            components: [
                                new ActionRowBuilder()
                                    .setComponents(
                                        new StringSelectMenuBuilder()
                                            .setCustomId("selectOptions")
                                            .setPlaceholder("Cambia tus preferencias")
                                            .setMinValues(0)
                                            .setMaxValues(dmAllowed.length)
                                            .setOptions(dmAllowed)
                                    )
                            ]
                        })

                        collector = await new Collector(this.interaction, {
                            wait: true,
                            filter: CreateInteractionFilter(this.interaction, msg),
                            time: ms("1m")
                        }).wait(() => {
                            this.interaction.deleteReply()
                        })
                        if (!collector) return;

                        // Volver todas las opciones falsas temporalmente
                        Object.keys(this.preferences.direct_messages.allowed).forEach(
                            (prop) => this.preferences.direct_messages.allowed[prop] = false
                        );

                        // Poner las que el usuario quiere como verdaderas
                        collector.values.forEach(enabledOption => {
                            this.preferences.direct_messages.allowed[enabledOption] = true;
                        });

                        await this.preferences.save();
                        this.manage();
                        break;
                    }

                    case "stop":
                        await this.interaction.deleteReply();
                        break
                }
                break;
        }
    }
}

module.exports = ManagePreferences;