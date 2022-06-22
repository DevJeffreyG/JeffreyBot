const Discord = require("discord.js");

class Embed extends Discord.MessageEmbed {
    /**
     * En caso de que Discord.JS se ponga chistoso y cambie por decimocuarta vez la forma de hacer embeds.
     */
    constructor(){
        super({})
    }

    defAuthor({text, icon = null, url = null, title = false}) {
        title ?
            this.setTitle(text) :
            this.setAuthor({name: text, iconURL: icon, url})
        
        return this
    }

    defDesc(desc = " ") {
        this.setDescription(desc)
        return this
    }

    defColor(color) {
        this.setColor(color);
        return this
    }

    defField(up, down, inline = false) {
        this.addField(up, down, inline);
        return this
    }
}

module.exports = Embed;