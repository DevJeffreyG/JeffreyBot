const { StringSelectMenuInteraction, codeBlock, ButtonInteraction, ActionRowBuilder, StringSelectMenuOptionBuilder, StringSelectMenuBuilder, MessageFlags } = require("discord.js");
const { DoesntExistsError, PermissionError } = require("../errors");
const { Log, LogReasons, ChannelModules, ErrorEmbed, Embed } = require("../utils");
const { CustomElements } = require("mongoose").models;

class AutoRole {
    /**
     * @param {StringSelectMenuInteraction|ButtonInteraction} interaction 
     */
    constructor(interaction) {
        this.interaction = interaction;
    }

    setDoc(doc) {
        this.doc = doc;
        return this;
    }

    async handle(doc) {
        this.doc = doc;
        await this.interaction.deferReply({ flags: [MessageFlags.Ephemeral] });

        if (this.interaction instanceof ButtonInteraction) await this.#showAutoRoles();
        else if (this.interaction instanceof StringSelectMenuInteraction) await this.work();
    }

    async #showAutoRoles() {
        const elements = await CustomElements.getWork(this.interaction.guild.id);

        const embedId = Number(this.interaction.customId.split("-")[1]);
        const embed = elements.getEmbed(embedId);

        let components = [];

        let row_autoroles = new ActionRowBuilder();
        let row_toggles = new ActionRowBuilder();

        let autoroles = new StringSelectMenuBuilder().setCustomId(`AUTOROLE-0`).setPlaceholder("Selecciona lo que necesites");
        let toggles = new StringSelectMenuBuilder().setCustomId("AUTOROLE-1").setMaxValues(1).setPlaceholder("Selecciona uno solo");

        for (const linked of embed.linkedids) {
            if (!linked.isAutoRole) continue;
            const linkId = linked.id;

            let autorole = this.doc.getAutoRole(linkId);
            if (!autorole) continue;

            let emote = autorole.emote;

            (typeof autorole.toggle_group === "number" ? toggles : autoroles).addOptions(
                new StringSelectMenuOptionBuilder()
                    .setLabel(autorole.name)
                    .setValue(String(autorole.id))
                    .setEmoji(emote ?? this.interaction.client.Emojis.Badge)
            )
        }

        autoroles.setMaxValues(autoroles.options.length);

        const blank = new StringSelectMenuOptionBuilder()
            .setLabel("Deseleccionar")
            .setDescription("No agrega ni elimina nada")
            .setValue("0")
            .setEmoji("⚫");

        if (toggles.options.length === 1) toggles.addOptions(blank)
        if (autoroles.options.length === 1) autoroles.addOptions(blank)

        if (toggles.options.length > 0 && toggles.options.length < 25) row_toggles.setComponents(toggles);
        if (autoroles.options.length > 0 && autoroles.options.length < 25) row_autoroles.setComponents(autoroles);

        if (row_autoroles.components.length > 0 && components.length < 5) components.push(row_autoroles);
        if (row_toggles.components.length > 0 && components.length < 5) components.push(row_toggles);

        try {
            return await this.interaction.editReply({ content: null, embeds: [], components })
        } catch (err) {
            this.interaction.deleteReply().catch(err => {
                console.error("🔴 %s", err);
            });
            console.error("🔴 %s", err);
        }
    }

    /**
     * @param {String[]|null} IDS Las Ids de los AutoRoles a manejar
     */
    async work(IDS) {
        const values = IDS ?? this.interaction.values;
        let res = false; // Se envió una respuesta al usuario

        for (const autoroleId of values) {
            if (autoroleId === "0") continue;
            const autorole = this.doc.getAutoRole(Number(autoroleId));

            if (!autorole)
                throw new DoesntExistsError(this.interaction, "Este AutoRole ya", "el servidor");

            const role = this.interaction.guild.roles.cache.get(autorole.role_id);
            const reqRole = this.interaction.guild.roles.cache.get(autorole.req_id);

            if (!role)
                throw new DoesntExistsError(this.interaction, "El role que te da este AutoRole", "este servidor")

            if (reqRole && !this.interaction.member.roles.cache.has(reqRole.id))
                throw new PermissionError(this.interaction);

            try {
                if (this.interaction.member.roles.cache.get(role.id)) {
                    await this.interaction.member.roles.remove(role);
                    res = true;
                    await this.interaction.followUp({
                        flags: [MessageFlags.Ephemeral],
                        embeds: [
                            new Embed({
                                type: "success", data: {
                                    desc: `Se eliminó el rol ${role}`
                                }
                            })]
                    })

                    console.log(`💬 Se eliminó por AUTOROLES ${role.name} a ${this.interaction.user.username}`);
                } else {
                    await this.interaction.member.roles.add(role);
                    res = true;
                    await this.interaction.followUp({
                        flags: [MessageFlags.Ephemeral],
                        embeds: [
                            new Embed({
                                type: "success", data: {
                                    desc: `Se agregó el rol ${role}`
                                }
                            })]
                    })

                    console.log(`💬 Se agregó por AUTOROLES ${role.name} a ${this.interaction.user.username}`);

                    // buscar toggles
                    if (autorole.toggle_group) {
                        const autoroles = this.doc.data.autoroles;
                        const sameGroup = autoroles.filter(x => x.toggle_group === autorole.toggle_group);

                        if (sameGroup.length > 1) {
                            // para cada autorole con el mismo toggle, buscar los roles que dan y eliminarlos del usuario
                            for (const toggledAutorole of sameGroup) {
                                const oldRole = this.interaction.guild.roles.cache.get(toggledAutorole.role_id);

                                if (this.interaction.member.roles.cache.get(oldRole.id) && oldRole != role) {
                                    await this.interaction.member.roles.remove(oldRole);
                                }
                            }
                        }
                    }

                }
            } catch (err) {
                res = false;
                console.error(err);
                new Log(this.interaction)
                    .setReason(LogReasons.Error)
                    .setTarget(ChannelModules.StaffLogs)
                    .send({
                        embeds: [
                            new ErrorEmbed()
                                .defDesc(`Hubo un error usando un AutoRole (\`${autoroleId}\`) por ${this.interaction.user.username}:${codeBlock("js", err)}`)
                        ]
                    }).catch(err => {
                        console.error("🔴 %s", err);
                    });
            }
        }

        if (!res) await this.interaction.deleteReply();
    }
}

module.exports = AutoRole;