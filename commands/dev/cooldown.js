const { Command, Categories, Embed } = require("../../src/utils")
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

    console.log(params)

    const user = await Users.getOrCreate({user_id: miembro.value, guild_id: miembro.member.guild.id})
    if(cooldown.value != "0") user.cooldown(modulo.value, {cooldown: ms(cooldown.value), save: true, check: false});
    else user.delCooldown(modulo.value);

    interaction.editReply({content: null, embeds: [new Embed({type: "success"})]});
}

module.exports = command;