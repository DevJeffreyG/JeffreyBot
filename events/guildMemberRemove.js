const { Embed, FetchThisGuild } = require("../src/utils");
const { Users, Guilds } = require("mongoose").models;

module.exports = async (client, member) => {
    if (!client.isThisFetched(member.guild.id)) await FetchThisGuild(client, member.guild);

    const doc = await Guilds.getOrCreate(member.guild.id);
    let channel = member.guild.channels.cache.get(doc.getLogChannel("user_left"));
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
    if (member.pending) return;

    const fBye = despedidas[Math.floor(Math.random() * despedidas.length)];
    let embed = new Embed()
        .defDesc(fBye)
        .defColor("#66a0ff");

    // guardar los roles
    let user = await Users.getOrCreate({
        user_id: member.id,
        guild_id: member.guild.id
    });

    if (doc.moduleIsActive("functions.save_roles_onleft", doc.settings)) {
        member.roles.cache.forEach(role => {
            if (role.id != member.guild.id) user.data.backup_roles.push(role.id);
        })

        await user.save();
    }

    if (channel) channel.send({ embeds: [embed] }).then(msg => {
        msg.react(client.Emojis.PressF);
    });
}