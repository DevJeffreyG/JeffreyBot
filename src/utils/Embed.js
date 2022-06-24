const Discord = require("discord.js");
const Colores = require("../resources/colores.json");

class Embed extends Discord.MessageEmbed {
    /**
     * En caso de que Discord.JS se ponga chistoso y cambie por decimocuarta vez la forma de hacer embeds.
     */
    constructor(options){
        super()

        if(options) this.#setup(options)
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

    defFooter({text, icon = null, timestamp = null}){
        this.setFooter({text, iconURL: icon})

        if (timestamp){
            if(timestamp instanceof Boolean) this.setTimestamp()
            else
            this.setTimestamp(timestamp)
        }
        return this
    }

    defThumbnail(url) {
        this.setThumbnail(url)
        return this
    }

    #setup(options) {
        const { type, data } = options

        switch(type) {
            case "didYouKnow":
                this.defAuthor({text: `¿Sabías que...`, title: true});
                this.defDesc(`...${data}?`)
                this.defColor(Colores.verdeclaro)
                break;
        }
    }
}

module.exports = Embed;