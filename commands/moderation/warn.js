const { Command, Categories, Embed, ErrorEmbed, Confirmation, FindNewId, AfterInfraction, Log, LogReasons, ChannelModules } = require("../../src/utils")
const { Colores } = require("../../src/resources/");
const { StringSelectMenuBuilder, ActionRowBuilder, AttachmentBuilder } = require("discord.js")

const command = new Command({
    name: "warn",
    desc: "Agregar una infracción a un usuario",
    category: Categories.Moderation
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
    const { Guilds, Users } = models;
    const { usuario, pruebas } = params;

    // revisar que estén las reglas activadas
    const doc = await Guilds.getOrCreate(interaction.guild.id);

    let selectMenu = new StringSelectMenuBuilder()
        .setCustomId("selectRule")
        .setPlaceholder("Selecciona la regla infringida");

    let norules = new ErrorEmbed(interaction, {
        type: "errorFetch",
        data: {
            type: "reglas",
            guide: `NO se encontraron reglas agregadas a la base de datos, usa \`/config\` para ello.`
        }
    })

    if (doc.data.rules?.length === 0) return norules.send();

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

        try {
            await collected.deferUpdate();
        } catch(err) {
            console.log(err);
        }

        if (!rule) return interaction.deleteReply();

        const user = await Users.getOrCreate({
            user_id: member.id,
            guild_id: member.guild.id
        });

        // Definir cuál es la regla "rule"
        let ruleTxt = doc.data.rules.find(x => x.id === rule).name;

        let toConfirm = [
            `¿Estás segur@ de warnear a **${member.user.tag}**?`,
            `Razón: Infringir la regla N°${ruleNo} (${ruleTxt})`,
            `Pruebas:`,
            pruebasEmbed
        ];
        let confirmation = await Confirmation("Agregar warn", toConfirm, interaction);
        if (!confirmation) return interaction.deleteReply();

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
                `**${member.user.tag}** __NO__ tiene el **softwarn** de la regla "${ruleTxt}"`,
                `¿Estás segur@ de warnear a **${member.user.tag}**?`,
                `Razón: Infringir la regla N°${ruleNo} (${ruleTxt})`,
                pruebasEmbed
            ];
            confirmation = await Confirmation("Continuar", skipConfirmation, interaction);
            if (!confirmation) return interaction.deleteReply();
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

        user.data.counts.warns += 1;
        await user.save();

        let after = await AfterInfraction(user, data); // enviar mensaje con la informacion del warn al usuario

        let log = new Embed({
            type: "success",
            data: {
                title: "Warn",
                desc: [
                    `Usuario: **${member.user.tag}**`,
                    `Moderador: **${interaction.user.tag}**`,
                    `Warns actuales: **${user.warns.length}**`,
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

        new Log(interaction)
            .setReason(LogReasons.Warn)
            .setTarget(ChannelModules.ModerationLogs)
            .send({ embeds: [log, proofE] })

        return after ?
            interaction.editReply({ embeds: [new Embed({ type: "success" })], components: [] }) :
            interaction.followUp({ embeds: [new Embed({ type: "success" })], components: [] });
    })
}

module.exports = command;