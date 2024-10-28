const { Command, Embed, Confirmation, FindNewId, AfterInfraction, Log, LogReasons, ChannelModules, Collector } = require("../../utils")
const { Colores } = require("../../resources/");
const { StringSelectMenuBuilder, ActionRowBuilder, AttachmentBuilder, DiscordAPIError } = require("discord.js");
const { DMNotSentError, FetchError } = require("../../errors");

const command = new Command({
    name: "warn",
    desc: "Agregar una infracción a un usuario"
})

command.addOption({
    type: "user",
    name: "usuario",
    desc: "El usuario que infringió las reglas",
    req: true
})

command.addOption({
    type: "attachment",
    name: "pruebas",
    desc: "Las pruebas de que el usuario infringió las reglas",
    req: true
})

command.execute = async (interaction, models, params, client) => {
    await interaction.deferReply();
    const { Users } = models;
    const { usuario, pruebas } = params;

    // revisar que estén las reglas activadas
    const doc = params.getDoc();

    let selectMenu = new StringSelectMenuBuilder()
        .setCustomId("selectRule")
        .setPlaceholder("Selecciona la regla infringida");

    if (doc.data.rules?.length === 0)
        throw new FetchError(interaction, "reglas", ["No se encontraron reglas registradas", `Para agregar reglas usa ${client.mentionCommand("config reglas")}`])

    const prueba = new AttachmentBuilder()
        .setFile(pruebas.attachment)
        .setName("prueba")
        .setDescription("La prueba que el STAFF proporcionó para este warn");

    const pruebasEmbed = new Embed()
        .defImage(prueba.attachment.url)
        .defColor(Colores.verde);

    for (const regla of doc.data.rules) {
        let desc = regla.desc ?? regla.expl;
        if (desc.length > 100) {
            desc = desc.slice(0, 95) + "..."
        }
        selectMenu.addOptions(
            {
                label: regla.name,
                value: regla.id.toString(),
                description: desc
            }
        );
    }

    selectMenu.addOptions({ label: "Cancelar", value: "cancel", emoji: client.Emojis.Cross });

    let row = new ActionRowBuilder().addComponents([selectMenu]);

    await interaction.editReply({ content: "**¿Qué regla infringió?**", components: [row] })

    const filter = (inter) => inter.isStringSelectMenu() && inter.user.id === interaction.user.id;
    const collector = new Collector(interaction, { filter, max: 1 }).raw();

    collector.on("collect", async (collected) => {
        const rule = Number(collected.values[0]) ?? collected.values[0];
        const ruleNo = doc.data.rules.find(x => x.id === rule)?.position;
        const member = usuario.member;

        if (!rule) return interaction.deleteReply();

        const user = await Users.getWork({
            user_id: member.id,
            guild_id: member.guild.id
        });

        // Definir cuál es la regla "rule"
        let ruleTxt = doc.data.rules.find(x => x.id === rule).name;

        let toConfirm = [
            `¿Estás segur@ de warnear a **${member.displayName} (${member.user.username})**?`,
            `Razón: Infringir la regla N°${ruleNo} (${ruleTxt})`,
            `Pruebas:`,
            pruebasEmbed
        ];
        let confirmation = await Confirmation("Agregar warn", toConfirm, interaction);
        if (!confirmation) return await interaction.deleteReply();

        const softwarns = user.softwarns;
        const warns = user.warns;

        // como se confirmó, primero revisar si tiene el softwarn para después agregar el warn
        let hasSoft = false;
        let indexOfSoftwarn;
        softwarns.forEach((soft) => {
            if (soft.rule_id === rule) {
                hasSoft = true;
                indexOfSoftwarn = softwarns.indexOf(soft);
            }
        });

        if (!hasSoft) {
            let skipConfirmation = [
                `**${member.user.username}** __NO__ tiene el **softwarn** de la regla "${ruleTxt}"`,
                `¿Estás segur@ de warnear a **${member.displayName} (${member.user.username})**?`,
                `Razón: Infringir la regla N°${ruleNo} (${ruleTxt})`,
                pruebasEmbed
            ];
            confirmation = await Confirmation("Continuar", skipConfirmation, interaction);
            if (!confirmation) return await interaction.deleteReply();
        }

        // guardar el nuevo attachment para evitar que se pierda
        let msg = await interaction.followUp({ content: `⚠️ Este mensaje se usará para tener la imagen de las pruebas, si se elimina se perderá.`, files: [prueba.attachment] });

        // como sí tiene el soft, agregar warn
        let users = await Users.find();

        let newId = FindNewId(users, "warns", "id");

        const data = {
            member: member,
            rule: ruleTxt,
            proof: msg.attachments.first().url,
            interaction,
            id: newId
        }

        warns.push({ rule_id: rule, proof: msg.attachments.first().url, id: newId });
        if (hasSoft) softwarns.splice(indexOfSoftwarn, 1);

        user.addCount("warns", 1, false);
        await user.save();

        let after = await AfterInfraction(user, data); // enviar mensaje con la informacion del warn al usuario

        let log = new Embed({
            type: "success",
            data: {
                title: "Warn",
                desc: [
                    `Usuario: **${member.user.username}**`,
                    `Moderador: **${interaction.user.username}**`,
                    `Warns actuales: **${user.warns.length}**`,
                    `Por infringir la regla: **${ruleTxt}**`,
                    `ID de infracción: \`${newId}\``
                ]
            }
        })

        let proofE = new Embed()
            .defAuthor({ text: "Pruebas", title: true })
            .defDesc(msg.attachments.first().url)
            .defImage(msg.attachments.first().url)
            .defColor(Colores.nocolor);

        new Log(interaction)
            .setReason(LogReasons.Warn)
            .setTarget(ChannelModules.ModerationLogs)
            .send({ embeds: [log, proofE] })

        await interaction.followUp({ embeds: [new Embed({ type: "success" })], components: [] });
        if (after instanceof DiscordAPIError) await new DMNotSentError(interaction, member, after).send().catch(e => console.error(e));
    })
}

module.exports = command;