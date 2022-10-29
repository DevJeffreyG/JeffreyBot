const { GuildMemberRoleManager, roleMention } = require("discord.js");
const ms = require("ms")

const { LimitedTime, Subscription } = require("./functions");
const { ItemObjetives, ItemTypes } = require("./Enums");
const Embed = require("./Embed");
const ErrorEmbed = require("./ErrorEmbed");

const { Users } = require("mongoose").models;

class RouletteItem {
    constructor(interaction, globalinfo){
        this.interaction = interaction;
        this.item = globalinfo;

    }

    #embeds(){
        this.addedRole = new Embed({type: "success", data: {
            desc: `Se agregó el role ${roleMention(this.numbers)}`
        }})
        this.removedRole = new Embed({type: "success", data: {
            desc: `Se eliminó el role ${roleMention(this.numbers)}`
        }})
        this.addedTemp = new Embed({type: "success", data: {
            desc: `Se agregó el TempRole + ${roleMention(this.numbers)}`
        }})
        this.removedTemp = new Embed({type: "success", data: {
            desc: `Se eliminó el TempRole - ${roleMention(this.numbers)}`
        }})
        this.success = new Embed({type: "success", data: {
            desc: `**(${this.nonumbers})** ${this.numbers} a '\`${this.target}\`'`
        }});
        this.hasRole = new ErrorEmbed(this.interaction, {
            data: {
                type: "alreadyExists",
                action: "add role",
                existing: roleMention(this.numbers),
                context: "este usuario"
            }
        })
    }

    async build() {
        let interaction = this.interaction;
        this.user = await Users.getOrCreate({
            user_id: interaction.user.id,
            guild_id: interaction.guild.id
        });

        this.numbers = this.item.value.match(/[0-9\.]/g).join("");
        this.nonumbers = this.item.value.replace(/[0-9\.]/g, "");

        switch(Number(this.item.target)){
            case ItemObjetives.Jeffros:
                this.target = this.user.economy.global.jeffros;
                break;
    
            case ItemObjetives.Role:
                this.target = interaction.member.roles;
                break;
    
            case ItemObjetives.TempRole:
                this.target = this.user.data.temp_roles;
                break;
    
            default:
                this.target = null;
        }

        console.log("💚 Creando item %s", this.item);

        this.#embeds();

        return this
    }

    async use(){
        let target = this.target;
        let save = true;
        let response = null;
        //let value = this.#valueWork();
        
        switch(target.constructor){
            case GuildMemberRoleManager:
                if(this.nonumbers === '-') target.remove(this.numbers)
                else if(this.nonumbers === '+') target.add(this.numbers)
                
                response = this.nonumbers === '-' ? this.removedRole : this.addedRole;
                break;
            
            case Array:
                let temproles = Number(this.item.target) === ItemObjetives.TempRole;
                if(this.nonumbers === '-'){
                    response = temproles ? this.removedTemp : this.success;
                    let i = target.findIndex(x => x === this.numbers)
                    if(temproles) i = target.findIndex(x => x.role_id === this.numbers)

                    target.splice(i, 1);
                } else if(this.nonumbers === '+') {
                    if(temproles) {
                        if(this.interaction.member.roles.cache.find(x => x.id === this.numbers)) return this.hasRole.send();
                        response = this.addedTemp;
                        save = false

                        if(this.item.extra.special === ItemObjetives.Boost)
                            await LimitedTime(this.interaction.member, this.numbers, ms(this.item.extra.duration), this.item.extra.boosttype, this.item.extra.boostobj, this.item.extra.boostvalue);
                        else if(this.item.extra.special === ItemTypes.Subscription)
                            await Subscription(this.interaction.member, this.numbers, ms(this.item.extra.duration), this.item.extra.subprice, this.item.extra.subname);
                        else await LimitedTime(this.interaction.member, this.numbers, ms(this.item.extra.duration))
                    } else
                    target.push(this.numbers)
                }
                break;

            case Number:
                if(this.nonumbers === "-") target -= this.numbers;
                else if(this.nonumbers === "+") target += this.numbers;
                else if(this.nonumbers === "*") target *= this.numbers;
                else if(this.nonumbers === "%") {
                    target *= this.numbers/100
                }
                response = this.success;
                break;
        }

        if(!response) response = this.success;
        if(save) await this.user.save();

        await this.interaction.editReply({embeds: [response]})

        return this;
    }
}

module.exports = RouletteItem;