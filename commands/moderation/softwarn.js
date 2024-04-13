const { Command, Embed, Confirmation, FindNewId, Log, LogReasons, ChannelModules } = require("../../src/utils")
const { Colores } = require("../../src/resources/");
const { ActionRowBuilder, AttachmentBuilder, StringSelectMenuBuilder } = require("discord.js");
const { AlreadyExistsError, FetchError } = require("../../src/errors");
const command = new Command({
    name: "softwarn",
    desc: "Controla las advertencias hechas a un usuario"
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
        .setImage(prueba.attachment.url)
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
    const collector = interaction.channel.createMessageComponentCollector({ filter, max: "1" });

    collector.on("collect", async (collected) => {
        const rule = Number(collected.values[0]) ?? collected.values[0];
        const ruleNo = doc.data.rules.find(x => x.id === rule)?.position;
        const member = usuario.member;

        await collected.deferUpdate();

        if (!rule) return await interaction.deleteReply();

        const user = await Users.getWork({
            user_id: member.id,
            guild_id: member.guild.id
        });

        // Definir cuál es la regla "rule"
        let ruleTxt = doc.data.rules.find(x => x.position === rule).name;

        let toConfirm = [
            `¿Estás segur@ de softwarnear a **${member.user.username}**?`,
            `Llamado de atención: Incumplimiento de la regla N°${ruleNo} (${ruleTxt})`,
            `Pruebas:`,
            pruebasEmbed
        ];
        let confirmation = await Confirmation("Agregar softwarn", toConfirm, interaction);
        if (!confirmation) return await interaction.deleteReply();

        const softwarns = user.softwarns;

        // como se confirmó, primero revisar si tiene el softwarn para después agregar el warn
        let hasSoft = false;
        let indexOfSoftwarn;
        softwarns.forEach((soft) => {
            if (soft.rule_id === rule) {
                hasSoft = true;
                indexOfSoftwarn = softwarns.indexOf(soft);
            }
        });

        if (hasSoft)
            throw new AlreadyExistsError(interaction, `El softwarn para la regla N°${ruleNo}`, `los softwarns del usuario, **procede con ${client.mentionCommand("warn")}**`).send().catch(e => console.error(e));

        // guardar el nuevo attachment para evitar que se pierda
        let msg = await interaction.followUp({ content: `⚠️ Este mensaje se usará para tener la imagen de las pruebas, si se elimina se perderá.`, files: [prueba.attachment] });

        // como no tiene el soft, agregarlo
        let users = await Users.find();
        let newId = FindNewId(users, "softwarns", "id");

        softwarns.push({ rule_id: rule, proof: msg.attachments.first().url, id: newId });
        if (hasSoft) softwarns.splice(indexOfSoftwarn, 1);
        await user.save();

        let log = new Embed({
            type: "success",
            data: {
                title: "Softwarn",
                desc: [
                    `Usuario: **${member.user.username}**`,
                    `Moderador: **${interaction.user.username}**`,
                    `Softwarns actuales: **${user.softwarns.length}**`,
                    `Por infringir la regla: **${ruleTxt}**`,
                    `ID de infracción: \`${newId}\``
                ]
            }
        })

        let proofE = new Embed()
            .defAuthor({ text: "Pruebas", title: true })
            .defDesc(msg.attachments.first().url)
            .setImage(msg.attachments.first().url)
            .defColor(Colores.nocolor);

        await new Log(interaction)
            .setReason(LogReasons.Pardon)
            .setTarget(ChannelModules.ModerationLogs)
            .send({ embeds: [log, proofE] })
            .catch(err => {
                console.error("🔴 %s", err);
            });

        return await interaction.editReply({ embeds: [new Embed({ type: "success" })], components: [] });
    })
}

module.exports = command;