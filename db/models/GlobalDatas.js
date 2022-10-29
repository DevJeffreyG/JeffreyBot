const mongoose = require("mongoose");
const moment = require("moment");
const ms = require("ms")

const Schema = mongoose.Schema({
    info: Object
});

Schema.static("newTempRoleDeletion", async function(data) {
    if(
        await this.findOne({
            "info.type": "temproledeletion",
            "info.user_id": data.user_id,
            "info.role_id": data.role_id
        })
    ) return null
    else

    return new this({
        info: {
            type: "temproledeletion",
            user_id: data.user_id,
            role_id: data.role_id,
            until: moment().add(ms(data.duration), "ms").toDate(),
            boost: data.boost ?? null
        }
    }).save();
})

Schema.static("newGuildCommands", async function({route, dev = false}){
    if(
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

Schema.static("getGuildCommands", function(){
    return this.find({
        "info.type": "guildcommands"
    });
})

Schema.static("getTempGuildBans", function(guild, user){
    return this.findOne({
        "info.type": "temporalGuildBan",
        "info.guild_id": guild.id,
        "info.userID": user
    });
})

Schema.static("removeGuildCommands", function(route){
    return this.findOneAndDelete({
        "info.type": "guildcommands",
        "info.route": route
    }).then(query => {
        console.log("Se ha eliminado:", query)
    })
})

Schema.static("getTempRoleDeletions", function(user_id){
    return this.find({
        "info.type": "temproledeletion",
        "info.user_id": user_id
    });
})

Schema.static("newRouletteItem", function(data){

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

Schema.static("getRouletteItems", async function(){
    return await this.find({
        "info.type": "rouletteItem"
    });
})
module.exports = mongoose.model("GlobalDatas", Schema);
