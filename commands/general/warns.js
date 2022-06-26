const { Command, Embed } = require("../../src/utils")
const { Colores } = require("../../src/resources");

const command = new Command({
    name: "warns",
    desc: "Revisa toda la información de tus warns",
    category: "GENERAL"
})

command.addOption({
    type: "integer",
    name: "id",
    desc: "ID del Warn o Softwarn a revisar"
})

command.execute = async (interaction, models, params, client) => {

    await interaction.deferReply({ephemeral: true})
    
    const { id } = params;
    const { Users } = models;
    const member = interaction.member;

    let error = new Embed()
    .defColor(Colores.rojo)
    .defAuthor({text: `${member.user.tag}`, icon: member.user.displayAvatarURL()})
    .defDesc(`Este usuario no tiene warns de ningún tipo.`);
    
    const user = await Users.getOrCreate({user_id: member.id, guild_id: interaction.guild.id})
    
    const warns = user.warns;
    const softwarns = user.softwarns;

    if((!softwarns || softwarns.length === 0) && (!warns || warns.length === 0)){
        return interaction.editReply({embeds: [error], ephemeral: true})
    }

    let warnsE = new Embed()
    .defAuthor({text: `${member.user.tag}'s warns`, icon: member.user.displayAvatarURL()})
    .defDesc(`**Número de warns ** ❛ \`${warns.length}\` ❜`)
    .defColor(Colores.verde);

    let softwarnsE = new Embed()
    .defAuthor({text: `${member.user.tag}'s softwarns`, icon: member.user.displayAvatarURL()})
    .defDesc(`**Número de softwarns ** ❛ \`${softwarns.length}\` ❜`)
    .defColor(Colores.verde);

    if(id) warnsE.defAuthor({text: `Para la ID: ${id}`, title: true});

    // foreach
    warns.forEach(warn => {
        // sacar la regla
        let regla = reglas[warn.rule_id] ? reglas[warn.rule_id].regla : "Víctima de la DARKSHOP";

        if(id && warn.id != id) return;
        warnsE.defField(`— ${regla} : Regla N°${warn.rule_id}`, `**— [Pruebas](${warn.proof})\n— ID: ${warn.id}**`)
    });

    softwarns.forEach(softwarn => {
        // sacar la regla
        let regla = reglas[softwarn.rule_id].regla;

        if(id && softwarn.id != id) return;
        softwarnsE.defField(`— ${regla} : Regla N°${softwarn.rule_id}`, `**— [Pruebas](${softwarn.proof})\n— ID: ${softwarn.id}**`)
    });

    return interaction.editReply({embeds: [warnsE, softwarnsE], ephemeral: true});
}

module.exports = command;