const { Command, Categories, Embed, Cooldowns, Enum } = require("../../src/utils")
const ms = require("ms")

const command = new Command({
    name: "cooldown",
    desc: "Elimina o agrega un cooldown a un módulo",
    category: Categories.Developer
});

command.addOption({
    type: "user",
    name: "miembro",
    desc: "Miembro agregar el cooldown",
    req: true
})

command.addOption({
    type: "string",
    name: "modulo",
    desc: "Módulo a administrar",
    choices: new Enum(Cooldowns).complexArray(),
    req: true
})

command.addOption({
    type: "string",
    name: "cooldown",
    desc: "0 para eliminarlo",
    req: true
})

command.execute = async (interaction, models, params, client) => {
    await interaction.deferReply();
    const { miembro, modulo, cooldown } = params
    const { Users } = models

    const user = await Users.getWork({ user_id: miembro.value, guild_id: miembro.member.guild.id })
    if (cooldown.value != "0") await user.cooldown(modulo.value, { force_cooldown: ms(cooldown.value), save: true, check: false });
    else user.delCooldown(modulo.value);

    interaction.editReply({ content: null, embeds: [new Embed({ type: "success" })] });
}

module.exports = command;