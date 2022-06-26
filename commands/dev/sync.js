const { Command, Embed } = require("../../src/utils")
const { Emojis } = require("../../src/resources")

const { Permissions } = require("discord.js");

const command = new Command({
    name: "sync",
    desc: "Comandos para sincronizar algo dentro del guild o la base de datos",
    category: "DEV"
});

command.addSubcommand({
    name: "mute",
    desc: "Sincronizar un role con permisos de muteado"
})

command.addSubcommand({
    name: "users",
    desc: "Sincronizar los usuarios viejos con la nueva forma de Jeffrey Bot 1.7.x"
})

command.addOption({
    type: "string",
    name: "id",
    desc: "Id del role a sincronizar",
    req: true,
    sub: "mute"
})

command.execute = async (interaction, models, params, client) => {
    await interaction.deferReply();
    const { subcommand } = params
    
    switch(subcommand){
        case "mute": {
            await interaction.editReply({content: `${Emojis.Loading} Sincronizando...`})
            const role = interaction.guild.roles.cache.find(x => x.id === params[subcommand].id.value);
            
            const perms = {
                [Permissions.FLAGS.VIEW_CHANNEL]: false,
                [Permissions.FLAGS.SEND_MESSAGES]: false,
                [Permissions.FLAGS.ADD_REACTIONS]: false
            }

            await interaction.editReply({content: `${Emojis.Loading} Obteniendo todos los canales...`})
            let fetched = await interaction.guild.channels.fetch();

            await interaction.editReply({content: `${Emojis.Loading} Sincronizando (${fetched.size} canales)...`})
            
            fetched.each(async channel => {
                let q = await channel.permissionOverwrites.edit(role, perms);
                console.log("🔄", q.name, "actualizado");
            })

            await interaction.editReply({content: `✅ ${role} Sincronizado.`, allowedMentions: { parse: [] }})
        }
    }
}

module.exports = command;