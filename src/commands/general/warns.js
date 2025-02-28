const { Command, InteractivePages } = require("../../utils")
const { Colores } = require("../../resources");
const { MessageFlags } = require("discord.js");

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

    await interaction.deferReply({ flags: [MessageFlags.Ephemeral] })

    const { id } = params;

    const user = params.getUser();
    const doc = params.getDoc();

    const reglas = doc.data.rules;
    const warns = user.warns;

    let items = new Map();

    for (const warn of warns) {
        const regla = reglas.find(x => x.id === warn.rule_id)?.name ?? "Warn por un item";

        if (id && warn.id != id.value) continue;

        const itemWarn = warn.rule_id === 0 ? true : false;

        items.set(warn.id, {
            name: regla,
            number: itemWarn ? "" : ` : Regla N°${warn.rule_id}`,
            proof: itemWarn ? "" : `**— [Pruebas](${warn.proof})**`,
            id: warn.id,
            itemWarn
        })
    }

    const interactive = new InteractivePages({
        title: `Tus Warns (${warns.length})`,
        author_icon: interaction.member.displayAvatarURL(),
        footer_icon: interaction.guild.iconURL(),
        description: `**—** Tienes...`,
        color: Colores.verde,
        addon: `**— {name}{number}**
{proof}
**▸ ID**: {id}.\n\n`
    }, items, 5);

    return await interactive.init(interaction)
}

module.exports = command;