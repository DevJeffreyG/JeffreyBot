const { Command, Categories, Embed, ErrorEmbed, Confirmation, FindNewId } = require("../../src/utils")
const { Colores } = require("../../src/resources/");
const { SelectMenuBuilder, ActionRowBuilder } = require("discord.js")
const command = new Command({
    name: "softwarn",
    desc: "Controla las advertencias hechas a un usuario",
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
        const ruleNo = doc.data.rules.find(x => x.id === rule).position;
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
            `¿Estás segur@ de softwarnear a **${member.user.tag}**?`,
            `Llamado de atención: Incumplimiento de la regla N°${ruleNo} (${ruleTxt})`,
            `[Pruebas](${prueba.attachment.url})`
        ];
        let confirmation = await Confirmation("Agregar softwarn", toConfirm, interaction);
        if(!confirmation) return interaction.deleteReply();

        const softwarns = user.softwarns;

        // como se confirmó, primero revisar si tiene el softwarn para después agregar el warn
        let hasSoft = false;
        let indexOfSoftwarn;
        softwarns.forEach((soft) => {
            if(soft.rule_id === rule){
                hasSoft = true;
                indexOfSoftwarn = softwarns.indexOf(soft);
            }
        });

        let alreadyWarned = new ErrorEmbed(interaction, {
            type: "alreadyExists",
            data: {
                action: "add softwarn",
                existing: `El softwarn para la regla N°${ruleNo}`,
                context: "los softwarns del usuario, **procede con `/warn`**"
            }
        })
        
        if(hasSoft) return alreadyWarned.send();

        // como no tiene el soft, agregarlo
        let users = await Users.find();
        let newId = await FindNewId(users, "softwarns", "id");

        softwarns.push({rule_id: rule, proof: prueba.attachment.url, id: newId});
        if(hasSoft) softwarns.splice(indexOfSoftwarn, 1);
        await user.save();

        const data = {
            member: member,
            rule: ruleTxt,
            proof: prueba.attachment,
            interaction,
            id: newId
        }
        
        //await AfterInfraction(user, data, true); // enviar mensaje con la informacion del warn al usuario

        let log = new Embed({
            type: "success",
            data: {
                title: "Softwarn",
                desc: [
                    `Usuario: **${member}**`,
                    `Softwarns actuales: **${user.softwarns.length}**`,
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

        return interaction.editReply({embeds: [log, proofE], components: []});
    })
}

module.exports = command;