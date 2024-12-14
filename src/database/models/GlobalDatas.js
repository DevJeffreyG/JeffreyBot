const mongoose = require("mongoose");
const moment = require("moment-timezone");

const Schema = mongoose.Schema({
    type: { type: String, required: true },
    info: Object
});

Schema.static("getOne", async function (type) {
    return await this.findOne({ type });
})

Schema.static("getAll", async function (type) {
    return await this.find({ type });
})

Schema.static("getPoll", async function (message_id) {
    return await this.findOne({
        type: "temporalPoll",
        "info.message_id": message_id
    });
})

Schema.method("pollYes", function (data) {
    let voteInNoIndex = this.info.no.findIndex(x => x === data);

    // hay un voto en no con la misma informacion
    if (voteInNoIndex != -1) this.info.no.splice(voteInNoIndex, 1);

    // ya votó
    if (this.info.yes.find(x => x === data)) return;

    this.info.yes.push(data);
    this.markModified("info");

    this.save();
})

Schema.method("pollNo", function (data) {
    let voteInYesIndex = this.info.yes.findIndex(x => x === data);

    // hay un voto en sí con la misma informacion
    if (voteInYesIndex != -1) this.info.yes.splice(voteInYesIndex, 1);

    // ya votó
    if (this.info.no.find(x => x === data)) return;

    this.info.no.push(data);
    this.markModified("info");

    this.save();
})

Schema.static("newTempRoleDeletion", async function (data) {
    if (
        await this.findOne({
            type: "temproledeletion",
            "info.guild_id": data.guild_id,
            "info.user_id": data.user_id,
            "info.role_id": data.role_id
        })
    ) return null
    else

        return new this({
            type: "temproledeletion",
            info: {
                user_id: data.user_id,
                guild_id: data.guild_id,
                role_id: data.role_id ?? null,
                until: moment().add(data.duration, "ms").toDate(),
                boost: data.boost ?? null,
                tempRoleObjectId: data.tempRoleObjectId ?? null
            }
        }).save();
})

Schema.static("newGuildCommands", async function ({ route, dev = false }) {
    if (
        await this.findOne({
            type: "guildcommands",
            "info.route": route,
            "info.dev": dev
        })
    ) return console.log("Ya existe el GuildCommand, continuando...");
    else

        console.log("Creando...!");
    return new this({
        type: "guildcommands",
        info: {
            route,
            dev
        }
    }).save();
})

Schema.static("getGuildCommands", async function () {
    return await this.find({
        type: "guildcommands"
    });
})

Schema.static("getTempGuildBans", function (guild, user) {
    return this.findOne({
        type: "temporalGuildBan",
        "info.guild_id": guild.id,
        "info.user_id": user
    });
})

Schema.static("removeGuildCommand", async function (route) {
    return await this.findOneAndDelete({
        type: "guildcommands",
        "info.route": route
    }).then(query => {
        console.log("Se ha eliminado:", query)
    })
})

Schema.static("getTempRoleDeletions", function (user_id, guild_id) {
    return this.find({
        type: "temproledeletion",
        "info.user_id": user_id,
        "info.guild_id": guild_id
    });
})

Schema.static("getActivities", async function () {
    return await this.findOne({
        type: "clientActivities"
    }) ?? await new this({
        type: "clientActivities",
        info: {
            fixed: null,
            list: []
        }
    }).save();
})

Schema.static("getToggles", async function () {
    return await this.findOne({
        type: "toggles"
    }) ?? await new this({
        type: "toggles",
        info: {
            lockdown: process.env.INIT_LOCKDOWN === "FALSE" ? false : true,
            commands: [],
            functions: []
        }
    }).save();
})

Schema.method("functionDisabled", function(enumVal){
    return this.info.functions.find(x => x === enumVal) ? true : false;
})

Schema.method("commandToggled", function(name){
    return this.info.commands.find(x => x.name === name);
})

module.exports = mongoose.model("GlobalDatas", Schema);
