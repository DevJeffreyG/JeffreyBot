const { CustomElements, Guilds } = require("mongoose").models;
const { ActionRowBuilder, MessageComponentInteraction, ButtonStyle } = require("discord.js");
const { CustomButton, CustomEmbed, Log, LogReasons, ChannelModules, ErrorEmbed, Embed } = require("../utils");
const { InsuficientSetupError, DoesntExistsError } = require("../errors");

class Button {
    /**
     * @param {MessageComponentInteraction} interaction 
     */
    constructor(interaction) {
        this.interaction = interaction;
        this.customid = Number(this.interaction.customId.split("-")[1])
        this.isAutoRole = this.interaction.customId.split("-")[2] === "true";
    }

    async handle(doc) {
        await this.interaction.deferReply({ ephemeral: true })
        const elements = await CustomElements.getWork(this.interaction.guild.id);

        const button = elements.getButton(this.customid);
        if (!button && !this.isAutoRole) await this.interaction.deferUpdate();

        let embeds = [];
        let components = [];

        if (!this.isAutoRole) {
            for (const embedId of button.embedids) {
                const embed = elements.getEmbed(embedId)

                embeds.push(
                    new CustomEmbed(this.interaction)
                    .create(embed)
                )

                let row = new ActionRowBuilder();

                for (const linked of embed.buttonids) {
                    const buttonId = linked.id;
                    const customId = `BUTTON-${buttonId}-${linked.isAutoRole}`;
                    if (components.find(x => x.components.find(x => x.data.custom_id === customId))) continue;

                    let innerbutton = elements.getButton(buttonId)

                    if (linked.isAutoRole) {
                        let autorole = doc.getAutoRole(buttonId);
                        let emote = autorole.emote;
                        innerbutton = {
                            texto: autorole.name,
                            emote,
                            style: ButtonStyle.Primary,
                            autorole: true
                        }
                    }

                    const buttonObj = new CustomButton(this.interaction).create(innerbutton)

                    if (!buttonObj.data.url)
                        buttonObj.setCustomId(customId);

                    row.addComponents(buttonObj);
                }

                if (row.components.length > 0 && components.length < 5) components.push(row);
            }

            if (embeds.length === 0)
                throw new InsuficientSetupError(this.interaction, "No hay Embeds vinculados", [
                    `Avísale a los Administradores que el Botón \`${this.customid}\` no tiene Embeds`
                ])

            await this.interaction.editReply({ embeds, components });
        } else {
            const autorole = doc.getAutoRole(this.customid);
            if (!autorole)
                throw new DoesntExistsError(this.interaction, "Este AutoRole ya", "el servidor");

            const role = this.interaction.guild.roles.cache.get(autorole.role_id);
            if (!role)
                throw new DoesntExistsError(this.interaction, "El role que te da este AutoRole", "este servidor")

            try {
                if (this.interaction.member.roles.cache.get(role.id)) {
                    await this.interaction.member.roles.remove(role);
                    await this.interaction.editReply({
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
                    await this.interaction.editReply({
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
                        const autoroles = doc.data.autoroles;
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
                new Log(this.interaction)
                    .setReason(LogReasons.Error)
                    .setTarget(ChannelModules.StaffLogs)
                    .send({
                        embeds: [
                            new ErrorEmbed()
                                .defDesc(`Hubo un error usando un AutoRole (\`${this.customid}\`) por ${this.interaction.user.username}:${codeBlock("js", err)}`)
                        ]
                    });
            }
        }
    }
}

module.exports = Button;