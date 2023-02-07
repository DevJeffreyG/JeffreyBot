const mongoose = require("mongoose");
const moment = require("moment");

const Schema = mongoose.Schema({
    info: Object
});

Schema.static("getPoll", async function(message_id){
    return await this.findOne({
        type: "temporalPoll",
        "info.message_id": message_id
    });
})

Schema.method("pollYes", function(data){
    let voteInNoIndex = this.info.no.findIndex(x => x === data);
    
    // hay un voto en no con la misma informacion
    if(voteInNoIndex != -1) this.info.no.splice(voteInNoIndex, 1);

    // ya votó
    if(this.info.yes.find(x => x === data)) return;

    this.info.yes.push(data);
    this.markModified("info");

    this.save();
})

Schema.method("pollNo", function(data){
    let voteInYesIndex = this.info.yes.findIndex(x => x === data);
    
    // hay un voto en sí con la misma informacion
    if(voteInYesIndex != -1) this.info.yes.splice(voteInYesIndex, 1);

    // ya votó
    if(this.info.no.find(x => x === data)) return;

    this.info.no.push(data);
    this.markModified("info");

    this.save();
})

Schema.static("newTempRoleDeletion", async function (data) {
    if (
        await this.findOne({
            "info.type": "temproledeletion",
            "info.guild_id": data.guild_id,
            "info.user_id": data.user_id,
            "info.role_id": data.role_id
        })
    ) return null
    else

        return new this({
            info: {
                type: "temproledeletion",
                user_id: data.user_id,
                guild_id: data.guild_id,
                role_id: data.role_id,
                until: moment().add(data.duration, "ms").toDate(),
                boost: data.boost ?? null
            }
        }).save();
})

Schema.static("newGuildCommands", async function ({ route, dev = false }) {
    if (
        await this.findOne({
            "info.type": "guildcommands",
            "info.route": route,
            "info.dev": dev
        })
    ) return console.log("Ya existe el GuildCommand, continuando...");
    else

        console.log("Creando...!");
    return new this({
        info: {
            type: "guildcommands",
            route,
            dev
        }
    }).save();
})

Schema.static("getGuildCommands", async function () {
    return await this.find({
        "info.type": "guildcommands"
    });
})

Schema.static("getTempGuildBans", function (guild, user) {
    return this.findOne({
        "info.type": "temporalGuildBan",
        "info.guild_id": guild.id,
        "info.userID": user
    });
})

Schema.static("removeGuildCommand", async function (route) {
    return await this.findOneAndDelete({
        "info.type": "guildcommands",
        "info.route": route
    }).then(query => {
        console.log("Se ha eliminado:", query)
    })
})

Schema.static("getTempRoleDeletions", function (user_id, guild_id) {
    return this.find({
        "info.type": "temproledeletion",
        "info.user_id": user_id,
        "info.guild_id": guild_id
    });
})

Schema.static("newRouletteItem", function (data) {

    const { target, value, prob, extra } = data;

    return new this({
        info: {
            type: "rouletteItem",
            target,
            value,
            prob,
            extra
        }
    }).save();
})

Schema.static("getRouletteItems", async function () {
    return await this.find({
        "info.type": "rouletteItem"
    });
})

Schema.static("getActivities", async function () {
    return await this.findOne({
        "info.type": "clientActivities"
    }) ?? await new this({
        info: {
            type: "clientActivities",
            fixed: null,
            list: []
        }
    }).save();
})

module.exports = mongoose.model("GlobalDatas", Schema);
