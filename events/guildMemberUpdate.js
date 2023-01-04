const { time } = require("discord.js");
const { Colores } = require("../src/resources");
const { ChannelModules, LogReasons, GenerateLog } = require("../src/utils");

const { Guilds } = require("mongoose").models;

const moment = require("moment");

module.exports = async (client, oldMember, newMember) => {
    let guild = newMember.guild;
    const doc = await Guilds.getOrCreate(guild.id);

    // Member passed membership screening
    if (oldMember.pending && !newMember.pending) {
        let memberRolesDb = doc.getUsers();
        
        memberRolesDb.forEach(roleId => {
            let memberRole = guild.roles.cache.get(roleId)
            newMember.roles.add(memberRole)
            .catch(err => {
                console.log(`🔴 No se pudo agregar el role ${memberRole} (${roleId} !)`);
                console.log(err);
            })
        })
    }
    
    if(moment(newMember.communicationDisabledUntil).isAfter(moment()) && oldMember.communicationDisabledUntil != newMember.communicationDisabledUntil)
    { // timeout
        GenerateLog(guild, {
            logType: ChannelModules.ModerationLogs,
            logReason: LogReasons.TimeOut,
            header: `Se ha muteado un usuario`,
            description: [
                `**${newMember.user.tag}** (\`${newMember.user.id}\`)`,
                `Hasta ${time(newMember.communicationDisabledUntil, "D")} ${time(newMember.communicationDisabledUntil, "T")}.`
            ],
            color: Colores.verdejeffrey
        });
    } else if(oldMember.communicationDisabledUntil != newMember.communicationDisabledUntil){ // se quito el timeout
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