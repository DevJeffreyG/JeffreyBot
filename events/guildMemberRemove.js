const Discord = require("discord.js");

const Config = require("../base.json");

module.exports = async (client, member) => {
    if(client.user.id === Config.testingJBID){
        return;
    }
    
    let channel = member.guild.channels.cache.find(x => x.id === Config.mainChannel);
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
    return channel.send({embeds: [embed]}).then(msg => {
    msg.react(member.guild.emojis.cache.get("524673704655847427"));
    });
}