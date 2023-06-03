const { Command, Categories, Embed } = require("../../src/utils")
const { Colores } = require("../../src/resources");

const command = new Command({
    name: "warns",
    desc: "Revisa toda la información de tus warns"
})

command.addOption({
    type: "integer",
    name: "id",
    desc: "ID del warn a revisar"
})

command.execute = async (interaction, models, params, client) => {

    await interaction.deferReply({ ephemeral: true })

    const { id } = params;
    const member = interaction.member;

    let error = new Embed()
        .defColor(Colores.rojo)
        .defAuthor({ text: `${member.user.tag}`, icon: member.displayAvatarURL() })
        .defDesc(`No tienes warns.`);

    const user = params.getUser();

    const warns = user.warns;
    const softwarns = user.softwarns;

    if (!warns || warns.length === 0) {
        return interaction.editReply({ embeds: [error], ephemeral: true })
    }

    let warnsE = new Embed()
        .defAuthor({ text: `${member.user.tag}'s warns`, icon: member.displayAvatarURL() })
        .defDesc(`**Número de warns ** ❛ \`${warns.length}\` ❜`)
        .defColor(Colores.verde);

    let softwarnsE = new Embed()
        .defAuthor({ text: `${member.user.tag}'s softwarns`, icon: member.displayAvatarURL() })
        .defDesc(`**Número de softwarns ** ❛ \`${softwarns.length}\` ❜`)
        .defColor(Colores.verde);

    if (id) warnsE.defAuthor({ text: `Para la ID: ${id.value}`, title: true });

    const doc = params.getDoc();
    const reglas = doc.data.rules;

    // foreach
    warns.forEach(warn => {
        // sacar la regla
        let regla = reglas.find(x => x.id === warn.rule_id)?.name ?? "Warn por la DarkShop";

        if (id && warn.id != id.value) return;
        if (warn.rule_id != 0) warnsE.defField(`— ${regla} : Regla N°${warn.rule_id}`, `**— [Pruebas](${warn.proof})\n— ID: ${warn.id}**`)
        else warnsE.defField(`— ${regla}`, `**— ID: ${warn.id}**`)
    });

    softwarns.forEach(softwarn => {
        // sacar la regla
        let regla = reglas.find(x => x.id === softwarn.rule_id).name;

        if (id && softwarn.id != id.value) return;
        softwarnsE.defField(`— ${regla} : Regla N°${softwarn.rule_id}`, `**— [Pruebas](${softwarn.proof})\n— ID: ${softwarn.id}**`)
    });

    return interaction.editReply({ embeds: [warnsE/* , softwarnsE */], ephemeral: true });
}

module.exports = command;