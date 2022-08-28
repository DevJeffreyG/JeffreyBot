const { Command, Embed } = require("../../src/utils")
const { Config, Colores, Emojis } = require("../../src/resources");

const command = new Command({
    name: "stats",
    desc: "¡Revisa tu EXP, nivel y Jeffros actuales, o de otro usuario!",
    helpdesc: "Revisa tu EXP, nivel y Jeffros actuales, o de otro usuario",
    category: "ECONOMY"
})

command.addOption({
    type: "user",
    name: "usuario",
    desc: "El usuario a revisar sus estadísticas"
})

command.execute = async (interaction, models, params, client) => {
    await interaction.deferReply();
    const { Users } = models
    const { usuario } = params;
    
    const guild = client.guilds.cache.find(x => x.id === interaction.guildId);
    
    // codigo
    const member = usuario ? usuario.member : interaction.member;

    let user = await Users.getOrCreate({user_id: member.id, guild_id: guild.id});

    let actualJeffros = user ? user.economy.global.jeffros.toLocaleString('es-CO') : 0;
    let curExp = user ? user.economy.global.exp.toLocaleString('es-CO') : 0;
    let curLvl = user ? user.economy.global.level.toLocaleString('es-CO') : 0;
    let rep = user ? user.economy.global.reputation.toLocaleString('es-CO') : 0;
        
    let nxtLvlExp = (10 * (curLvl ** 2) + 50 * curLvl + 100).toLocaleString('es-CO'); // fórmula de MEE6. 5 * (level ^ 2) + 50 * level + 100

    let bdData = user.data.birthday;

    let dataExists = bdData ? true : false;
    let bdString = "";

    if(dataExists && bdData.locked){
        day = bdData.day;
        month = bdData.month;

        bdString = (day != null) && (month != null) ? `**— Cumpleaños**: ${day} de ${month}` : "";
    }

    let meEmbed = new Embed()
    .defAuthor({text: `Estadísticas de ${member.user.tag}`, icon: Config.jeffreyguildIcon})
    .defDesc(`**— Nivel**: ${curLvl}
**— EXP**: ${curExp} / ${nxtLvlExp}
**— Jeffros**: ${Emojis.Jeffros}${actualJeffros}
**— Puntos de reputación**: ${rep}
${bdString}`)
    .defThumbnail(member.displayAvatarURL())
    .defColor(member.displayHexColor);

    return interaction.editReply({embeds: [meEmbed]});
}

module.exports = command;