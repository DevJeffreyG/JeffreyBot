const { time, codeBlock } = require("discord.js");
const { Colores } = require("../resources");
const { ChannelModules, LogReasons, GenerateLog, Log, ErrorEmbed, FetchThisGuild } = require("../utils");

const { Guilds } = require("mongoose").models;

const moment = require("moment-timezone");

module.exports = async (client, oldMember, newMember) => {
    let guild = newMember.guild;
    if (!client.isThisFetched(guild.id)) await FetchThisGuild(client, guild);

    const doc = await Guilds.getWork(guild.id);

    const oldTimeout = oldMember.communicationDisabledUntil ?? new Date();
    const newTimeout = newMember.communicationDisabledUntil ?? new Date();

    // Member passed membership screening
    if (oldMember.pending && !newMember.pending) {
        let memberRolesDb = doc.getUsers();

        memberRolesDb.forEach(roleId => {
            let memberRole = guild.roles.cache.get(roleId)
            newMember.roles.add(memberRole)
                .catch(err => {
                    new Log()
                        .setGuild(guild)
                        .setReason(LogReasons.Error)
                        .setTarget(ChannelModules.StaffLogs)
                        .send({
                            embeds: [
                                new ErrorEmbed()
                                    .defDesc(`**No se pudo agregar el role (${roleId}) a ${newMember.user.username}**:\n${codeBlock("json", err)}`)
                            ]
                        });


                    console.log(`🔴 No se pudo agregar el role (${roleId})`);
                    console.error("🔴 %s", err);
                })
        })
    }

    if (!moment(newTimeout).isSame(moment(oldTimeout))) {
        if (moment(newTimeout).isAfter(moment())) { // timeout
            await GenerateLog(guild, {
                logType: ChannelModules.ModerationLogs,
                logReason: LogReasons.TimeOut,
                header: `Se ha muteado un usuario`,
                description: [
                    `**${newMember.user.username}** (\`${newMember.user.id}\`)`,
                    `Hasta ${time(newTimeout, "D")} ${time(newTimeout, "T")}.`
                ],
                color: Colores.verdejeffrey
            });
        } else { // se quito el timeout

            await GenerateLog(guild, {
                logType: ChannelModules.ModerationLogs,
                logReason: LogReasons.TimeOut,
                header: `Se ha desmuteado un usuario`,
                description: [
                    `**${newMember.user.username}** (\`${newMember.user.id}\`)`,
                ],
                color: Colores.verdejeffrey
            });
        }
    }

}