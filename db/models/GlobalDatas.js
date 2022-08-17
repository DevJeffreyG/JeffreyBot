const mongoose = require("mongoose");

const Schema = mongoose.Schema({
    info: Object
});

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

module.exports = mongoose.model("GlobalDatas", Schema);
