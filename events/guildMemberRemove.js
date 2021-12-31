const Discord = require("discord.js");

const { Initialize } = require("../resources/functions.js");

const Config = require("../base.json");
const User = require("../modelos/User.model.js");

module.exports = async (client, member) => {
    const prefix = await Initialize(member.guild.id);

    let channel = client.user.id === Config.testingJBID ? member.guild.channels.cache.find(x => x.id === "797258710997139537") : member.guild.channels.cache.find(x => x.id === Config.mainChannel);
    let tag = member.user.tag;

    let despedidas = [
        `¡**${tag}** se ha ido a un lugar mejor...! A su casa.`,
        `**${tag}** se ha aburrido de tantos @everyones`,
        `Nos falta algo... ¿**${tag}**? ¿A dónde te has ido...?`,
        `Las rosas son rojas, las violetas azules, **${tag}** se ha llevado la pizza, que bueno que era de piña.`,
        `**${tag}** se ha llevado la pizza.`,
        `**${tag}** stay determined...!`,
        `¿**${tag}** es hater..?`,
        `**${tag}** no nos hagas un vídeo de 40 minutos...`,
        `A **${tag}** no le dieron Mod...`,
        `**${tag}** no seas malo`
    ];

    if (member.user.bot) return;

    const fBye = despedidas[Math.floor(Math.random() * despedidas.length)];
    let embed = new Discord.MessageEmbed()
    .setDescription(fBye)
    .setColor("#66a0ff");

    client.user.setActivity(`${prefix}ayuda - ${member.guild.memberCount} usuarios🔎`);

    // guardar los roles
    User.findOne({
        user_id: member.id,
        guild_id: member.guild.id
    }, (err, user) => {
        if(err) throw err;
        member.roles.cache.forEach(role => {
            if(role.id != member.guild.id) user.data.backup_roles.push(role.id);
        })

        user.save();
    });

    return channel.send({embeds: [embed]}).then(msg => {
        msg.react(client.user.id === Config.testingJBID ? "🤬" : member.guild.emojis.cache.get("524673704655847427"));
    });
}