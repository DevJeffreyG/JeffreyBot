const { Command, Embed, ErrorEmbed, Confirmation, FindNewId, AfterInfraction } = require("../../src/utils")
const { Colores } = require("../../src/resources/");
const { SelectMenuBuilder, ActionRowBuilder } = require("discord.js")
const command = new Command({
    name: "warn",
    desc: "Agregar una infracción a un usuario",
    category: "MODERATION"
})

command.addOption({
    type: "user",
    name: "usuario",
    desc: "El usuario que infringió las reglas",
    req: true
})

command.addOption({
    type: "attachment",
    name: "prueba",
    desc: "La pruebas de que lo pasó es real",
    req: true
})

command.execute = async (interaction, models, params, client) => {
    await interaction.deferReply();
    const { Guilds, Users } = models;
    const { usuario, prueba } = params;

    // revisar que estén las reglas activadas
    const doc = await Guilds.getOrCreate(interaction.guild.id);

    let selectMenu = new SelectMenuBuilder()
    .setCustomId("selectRule")
    .setPlaceholder("Selecciona la regla infringida");

    let norules = new ErrorEmbed(interaction, {
        type: "errorFetch",
        data: {
            type: "reglas",
            guide: `NO se encontraron reglas agregadas a la base de datos, usa \`/config\` para ello.`
        }
    })

    if(doc.data.rules?.length === 0) return norules.send();

    for(const regla of doc.data.rules){
        let desc = regla.desc ?? regla.expl;
        if(desc.length > 100) {
            desc = desc.slice(0, 95) + "..."
        }
        selectMenu.addOptions(
            {
                label: regla.name,
                value: regla.position.toString(),
                description: desc
            }
        );
    }

    selectMenu.addOptions({label: "Cancelar", value: "cancel", emoji: "❌"});

    let row = new ActionRowBuilder().addComponents([selectMenu]);

    await interaction.editReply({content: "**¿Qué regla infringió?**", components: [row]})

    const filter = (inter) => inter.isSelectMenu() && inter.user.id === interaction.user.id;
    const collector = interaction.channel.createMessageComponentCollector({filter, max: "1"});

    collector.on("collect", async(collected) => {
        const rule = Number(collected.values[0]) ?? collected.values[0];
        const member = usuario.member;

        await collected.deferUpdate();

        if(!rule) return interaction.deleteReply();
    
        const user = await Users.getOrCreate({
            user_id: member.id,
            guild_id: member.guild.id
        });

        // Definir cuál es la regla "rule"
        let ruleTxt = doc.data.rules.find(x => x.position === rule).name;

        let toConfirm = [
            `¿Estás segur@ de warnear a **${member.user.tag}**?`,
            `Razón: Infringir la regla N°${rule} (${ruleTxt})`,
            `[Pruebas](${prueba.attachment.url})`
        ];
        let confirmation = await Confirmation("Agregar warn", toConfirm, interaction);
        if(!confirmation) return interaction.deleteReply();

        const softwarns = user.softwarns;
        const warns = user.warns;

        // como se confirmó, primero revisar si tiene el softwarn para después agregar el warn
        let hasSoft = false;
        let indexOfSoftwarn;
        softwarns.forEach((soft) => {
            if(soft.rule_id === rule){
                hasSoft = true;
                indexOfSoftwarn = softwarns.indexOf(soft);
            }
        });

        if(!hasSoft) {
            let skipConfirmation = [
                `**${member.user.tag}** __NO__ tiene el **softwarn** de la regla "${ruleTxt}"`,
                `¿Estás segur@ de warnear a **${member.user.tag}**?`,
                `Razón: Infringir la regla N°${rule} (${ruleTxt})`,
                `[Pruebas](${prueba.attachment.url})`
            ];
            confirmation = await Confirmation("Continuar", skipConfirmation, interaction);
            if(!confirmation) return interaction.deleteReply();
        }

        // como sí tiene el soft, agregar warn
        let users = await Users.find();
        
        let newId = await FindNewId(users, "warns", "id");

        warns.push({rule_id: rule, proof: prueba.attachment.url, id: newId});
        if(hasSoft) softwarns.splice(indexOfSoftwarn, 1);
        await user.save();

        const data = {
            member: member,
            rule: ruleTxt,
            proof: prueba.attachment,
            interaction,
            id: newId
        }
        
        let after = await AfterInfraction(user, data); // enviar mensaje con la informacion del warn al usuario

        let log = new Embed({
            type: "success",
            data: {
                title: "Warn",
                desc: [
                    `Usuario: **${member}**`,
                    `Warns actuales: **${user.warns.length}**`,
                    `Por infringir la regla: **${ruleTxt}**`,
                    `ID de infracción: \`${newId}\``
                ]
            }
        })

        let proofE = new Embed()
        .defAuthor({text: "Pruebas", title: true})
        .defDesc(prueba.attachment.url)
        .setImage(prueba.attachment.url)
        .defColor(Colores.nocolor);

        return after ? interaction.editReply({embeds: [log, proofE], components: []}) :
        interaction.followUp({embeds: [log, proofE], components: []});
    })
}

module.exports = command;