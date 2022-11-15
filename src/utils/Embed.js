const Discord = require("discord.js");
const Colores = require("../resources/colores.json");

const client = require("../../index");

class Embed extends Discord.EmbedBuilder {
    /**
     * En caso de que Discord.JS se ponga chistoso y cambie por decimocuarta vez la forma de hacer embeds.
     */
    constructor(options){
        if(options instanceof Discord.Embed) super(options.data)
        else super()
        if(options) this.#setup(options)
    }

    defAuthor({text, icon = null, url = null, title = false}) {
        title ?
            this.setTitle(text) :
            this.setAuthor({name: text, iconURL: icon, url})
        
        return this
    }

    defDesc(desc = " ") {
        if(!desc >= 1) return console.error("🔴 NO SE CAMBIÓ LA DESCRIPCIÓN, ESTÁ VACÍA")
        this.setDescription(desc)
        this.description = desc;
        return this
    }

    defColor(color) {
        this.setColor(color);
        return this
    }

    defField(up, down, inline = false) {
        this.addFields([
            {name: up, value: down, inline}
        ]);
        return this
    }

    defFields(fields = [up, down, inline]){
        if(fields.length == 0) return console.error("⚠️ BAD ARRAY OF FIELDS");
        
        fields.forEach(field => {
            this.defField(field.up, field.down, field.inline);
        });
    }

    defFooter({text, icon = null, timestamp = null}){
        if (timestamp){
            try {
                this.setTimestamp(timestamp)
            } catch(e) {
                //console.log(`⚠️ El timestamp %s no fue válido`, timestamp)
                this.setTimestamp()
            }
        }
        
        if(text){
            this.setFooter({text, iconURL: icon})
        } else {
            console.log("⚠️ EMBED no tiene TEXT. Icon: %s, Timestamp: %s", this, icon, timestamp);
            console.log(this)
        }
        return this
    }

    defThumbnail(url) {
        this.setThumbnail(url)
        return this
    }

    #setup(options) {
        const {RandomCumplido} = require("./functions");
        const { type, data } = options

        switch(type) {
            case "didYouKnow":
                this.defAuthor({text: `¿Sabías que...`, title: true});
                this.defDesc(`...${data}?`)
                this.defColor(Colores.verdeclaro)
                break;

            case "success":
                this.defAuthor({text: `${data?.title ?? "¡Listo!"}`, icon: client.EmojisObject.Check.url});
                this.defColor(Colores.verdejeffrey)

                if(data?.desc) {
                    const sep = data?.separator ?? "▸"
                    const desc = data.desc;

                    if(typeof desc == "string") this.defDesc(`${sep} ${desc}.`)
                    else {
                        let t = ""
                        desc.forEach(item => {
                            t += `${sep} ${item}.\n`
                        })

                        this.defDesc(t);
                    }
                }

                if(data?.footer) this.defFooter({text: data.footer, icon: data.footer_icon, timestamp: data.timestamp})
                break;

            case "cooldown":
                this.defAuthor({text: `Usa este comando ${data.cool.mention}, ${RandomCumplido()}.`, title: true})
                this.defColor(Colores.rojooscuro)
                this.defFooter({text: `Eso es en ${data.cool.text}`, timestamp: data.cool.timestamp});
                break;
        }

        if(this.data){
            this.description = this.data.description;
        }
    }
}

module.exports = Embed;