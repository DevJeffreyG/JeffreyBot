const moment = require("moment")
const ms = require("ms")

const { Command, ErrorEmbed, Embed, HumanMs, RandomCumplido } = require("../../src/utils")
const { Colores } = require("../../src/resources");

const command = new Command({
    name: "rep",
    desc: "Cada 24h puedes darle un punto de reputación a un usuario!",
    helpdesc: "Da un punto de reputación a un usuario cada 24 horas",
    category: "GENERAL"
})

command.addOption({
    type: "user",
    name: "usuario",
    desc: "A quién le vas a dar el punto de reputación",
    req: true
})

const repCooldown = ms("1d");

command.execute = async (interaction, models, params, client) => {
    const guild = client.guilds.cache.find(x => x.id === interaction.guildId);
    const author = guild.members.cache.find(x => x.id === interaction.user.id);

    const { usuario } = params;
    const { Users } = models;

    const member = usuario.member;

    if (member.id === author.id) return interaction.reply({content: null, embeds: [
        new ErrorEmbed({type: "selfRep", data: member})
    ], ephemeral: true});
    
    const user = await Users.getOrCreate({user_id: member.id, guild_id: guild.id});
    const user_author = await Users.getOrCreate({user_id: author.id, guild_id: guild.id});

    if (user_author.data.cooldowns.rep){
        let timer = user_author.data.cooldowns.rep;
        let toCheck = moment(timer).add(repCooldown, "ms");
        let left = new HumanMs(toCheck).left();
        if(moment().isAfter(toCheck)) user_author.data.cooldowns.rep = null;
        else
        return interaction.reply(`Usa este comando en ${left}, ${RandomCumplido()}.`);
    }

    user.economy.global.reputation += 1;
    user.save();

    user_author.data.cooldowns.rep = new Date();
    user_author.save();

    return interaction.reply({content: `${author} ➡️ ${member} ✨`, embeds: [
        new Embed()
        .defAuthor({text: "☄️ +Rep", title: true})
        .defDesc(`**¡${author} le ha dado un punto de reputación a ${member}!**
__✨ Deben de ser buenos ✨__`)
        .defColor(Colores.verde)
        .defThumbnail(member.displayAvatarURL())
    ]})
}

module.exports = command;