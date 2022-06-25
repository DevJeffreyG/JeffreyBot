const Config = require("../../src/resources/base.json");
const Colores = require("../../src/resources/colores.json");
const Emojis = require("../../src/resources/emojis.json");
const Discord = require("discord.js");

const { HumanMs } = require("../../src/utils/");

const { Initialize, TutorialEmbed, LimitedTime, WillBenefit } = require("../../src/utils/");
const { Users, Keys } = require("mongoose").models;

const commandInfo = {
    name: "canjear",
    aliases: ["redeem", "canj"],
    info: "Canjeas alguna clave para recompensas dentro del servidor",
    params: [
        {
            name: "llave", type: "String", optional: false
        }
    ],
    userlevel: "USER",
    category: "FUN"
}

module.exports = {
    data: commandInfo,
    async execute(client, message, args){

        const { guild, author, prefix, executionInfo, jeffrey_role } = await Initialize(client, message);

        let response = await TutorialEmbed(commandInfo, executionInfo, args);

        if(response[0] === "ERROR") return console.log(response); // si hay algún error

        const _key = response.find(x => x.param === "llave").data;

        // Comando
        // validar key

        Keys.findOne({
            code: _key
        }, async (err, key) => {
            if(err) throw err;
            
            if(key){
                const user = await Users.findOne({
                    user_id: author.id,
                    guild_id: guild.id
                }) ?? await new Users({
                    user_id: author.id,
                    guild_id: guild.id
                });

                // revisar que no lo haya usado antes
                if(key.config.usedBy.find(x => x === author.id)) {
                    await message.delete()
                    return message.channel.send(`${author}, ya has usado esta key, no puedes volverla a usar :(`);
                }

                const reward = key.reward;
                let reply;

                switch(reward.type){
                    case "jeffros":
                        user.economy.global.jeffros += Number(reward.value);
                        reply = `Se han agregado ${Emojis.Jeffros}${Number(reward.value).toLocaleString("es-CO")} a tu cuenta.`
                        break;

                    case "exp":
                        user.economy.global.exp += Number(reward.value);
                        reply = `Se han agregado ${Number(reward.value).toLocaleString("es-CO")} puntos de EXP a tu cuenta.`
                        break;

                    case "role":
                        const isTemp = (reward.duration > 0 && reward.duration != Infinity) ?? false;
                        const role = guild.roles.cache.find(x => x.id === reward.value);

                        if(message.member.roles.cache.find(x => x === role)){
                            await message.delete();
                            return message.channel.send(`${author}, no puedes usar esta key porque ya tienes el rol que da :(`)
                        }

                        if(isTemp) await LimitedTime(guild, reward.value, message.member, user, reward.duration);
                        else message.member.roles.add(role);

                        reply = `Se ha agregado el role \`${role.name}\` ${isTemp ? `por ${new HumanMs(reward.duration).human}` : "permanentemente"}.`
                        break;

                    case "boost":
                        const brole = guild.roles.cache.find(x => x.id === reward.value);
                        const willBenefit = await WillBenefit(message.member);
                        
                        if(message.member.roles.cache.find(x => x === brole)){
                            await message.delete();
                            return message.channel.send(`${author}, no puedes usar esta key porque ya tienes el rol que da :(`)
                        }

                        if(willBenefit){
                            await message.delete();
                            return message.channel.send(`${author}, no puedes usar esta key te beneficiaría aún más con el boost que tienes :(`);
                        }

                        // llamar la funcion para hacer un globaldata y dar el role con boost
                        await LimitedTime(guild, brole.id, message.member, user, reward.duration, reward.boost_type, reward.boost_objetive, reward.boost_value);
                        
                        reply = `Se ha activado el boost ${reward.boost_type === "boostMultiplier" ? "multiplicador" : "de probabilidad"} x${reward.boost_value} por ${new HumanMs(reward.duration).human}.`
                        break;

                    default:
                        await message.delete();
                        return message.channel.send(`¡${jeffrey_role}, ayuda por aquí!\n\n${message.member} espera un momento que Jeffrey es un poco lento en las computadoras y tiene que revisar algo para que todo funcione bien.\n\`\`\`json\n{ FATAL ERROR, KEY ${key.id}, UKNOWN REWARD TYPE "${reward.type}" }\`\`\``);
                }

                // loggear que fue usado porque aún existe (lol)
                key.config.usedBy.push(author.id);
                key.config.used += 1;
                await key.save()

                await user.save();

                // si llega al punto máximo de usos borrar
                if(key.config.maxuses === key.config.used) await key.remove();

                return message.reply(reply)
            }
        });
        
        
    }
}