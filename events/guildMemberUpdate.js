const { time, codeBlock } = require("discord.js");
const { Colores } = require("../src/resources");
const { ChannelModules, LogReasons, GenerateLog, Log, ErrorEmbed } = require("../src/utils");

const { Guilds } = require("mongoose").models;

const moment = require("moment");

module.exports = async (client, oldMember, newMember) => {
    let guild = newMember.guild;
    const doc = await Guilds.getOrCreate(guild.id);

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
                                    .defDesc(`**No se pudo agregar el role (${roleId}) a ${newMember.user.tag}**:\n${codeBlock("json", err)}`)
                            ]
                        });


                    console.log(`🔴 No se pudo agregar el role (${roleId})`);
                    console.log(err);
                })
        })
    }

    if (!moment(newTimeout).isSame(moment(oldTimeout))) {
        if (moment(newTimeout).isAfter(moment())) { // timeout
            GenerateLog(guild, {
                logType: ChannelModules.ModerationLogs,
                logReason: LogReasons.TimeOut,
                header: `Se ha muteado un usuario`,
                description: [
                    `**${newMember.user.tag}** (\`${newMember.user.id}\`)`,
                    `Hasta ${time(newTimeout, "D")} ${time(newTimeout, "T")}.`
                ],
                color: Colores.verdejeffrey
            });
        } else { // se quito el timeout

            GenerateLog(guild, {
                logType: ChannelModules.ModerationLogs,
                logReason: LogReasons.TimeOut,
                header: `Se ha desmuteado un usuario`,
                description: [
                    `**${newMember.user.tag}** (\`${newMember.user.id}\`)`,
                ],
                color: Colores.verdejeffrey
            });
        }
    }

}