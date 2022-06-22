const Config = require("../../src/resources/base.json");
const Colores = require("../../src/resources/colores.json");
const Emojis = require("../../src/resources/emojis.json");
const Discord = require("discord.js");
const ms = require("ms");

const { Initialize, TutorialEmbed, FindNewId, Confirmation } = require("../../src/utils/");

/* ##### MONGOOSE ######## */

const User = require("../../modelos/User.model.js");
const Vault = require("../../modelos/Vault.model.js");

/* ##### MONGOOSE ######## */

const commandInfo = {
    name: "adminvault",
    aliases: ["addcodes", "addhints", "addvault", "avault"],
    info: "Comando usado para la creación de nuevos acertijos y pistas",
    params: [
        {
            name: "action", display: "add | remove", type: "String", options: ["add", "remove"], optional: false
        },
        {
            name: "toadmin", display: "hint | code | reward", type: "Options", options: ["hint", "code", "reward"], optional: false
        },
        {
            name: "code id", display: "id de code", type: "Number", active_on: {param: "toadmin", is: "hint"}, optional: false
        },
        {
            name: "nueva pista", type: "JoinString", active_on: {param: "toadmin", is: "hint"}, optional: false
        },
        {
            name: "codigo final", type: "JoinString", active_on: {param: "toadmin", is: "code"}, optional: false
        },
        {
            name: "code id", type: "Number", active_on: {param: "toadmin", is: "reward"}, optional: false
        },
        {
            name: "recompensa", type: "NaturalNumber", active_on: {param: "toadmin", is: "reward"}, optional: false
        }
    ],
    userlevel: "ADMIN",
    category: "STAFF"
}

module.exports = {
    data: commandInfo,
    async execute(client, message, args){

        const { guild, author, prefix, executionInfo } = await Initialize(client, message);

        let response = await TutorialEmbed(commandInfo, executionInfo, args);

        if(response[0] === "ERROR") return console.log(response); // si hay algún error

        const action = response.find(x => x.param === "action").data;
        // Comando
        const vault = await Vault.findOne({guild_id: guild.id}) ?? await new Vault({guild_id: guild.id}).save();

        if(action === "add"){
            const toadmin = response.find(x => x.param === "toadmin").data;

            if(toadmin === "hint"){
                const codeId = response.find(x => x.param === "code id").data;
                const newHint = response.find(x => x.param === "nueva pista").data;

                const code = vault.codes.find(x => x.id === codeId);

                let toConfirm = [
                    `¿Deseas agregar la pista N°${code.hints.length+1}?`,
                    `\`${newHint}\`.`,
                    `Para el código "${code.code}" con ID \`${code.id}\``
                ]

                let confirmation = await Confirmation("Nueva pista", toConfirm, message);
                if(!confirmation) return;

                confirmation.delete();

                code.hints.push(newHint);
                await vault.save();

                return message.react("✅");
            } else if(toadmin === "code") {
                const newCode = response.find(x => x.param === "codigo final").data.toUpperCase();
                const newId = await FindNewId(await Vault.find(), "codes", "id");

                if(vault.codes.find(x => x.code === newCode)) return message.reply("Ya existe un código igual en este vault.");

                vault.codes.push({code: newCode, id: newId});
                await vault.save()

                let e = new Discord.MessageEmbed()
                .setAuthor(`Nuevos textos`, Config.bienPng)
                .setDescription(`**—** Código: \`${newCode}\`
    **—** Recompensa: **${Emojis.Jeffros}100**
    **—** ID de Código: \`${vault.codes[vault.codes.length-1].id}\`.`
                )
                .setColor(Colores.verde);

                return message.reply({embeds: [e]});
            } else { // reward
                const codeId = response.find(x => x.param === "code id").data;
                const newReward = response.find(x => x.param === "recompensa").data;

                const code = vault.codes.find(x => x.id === codeId);

                code.reward = newReward;

                await vault.save();

                return message.react("✅");
            }
        } else if(action === "remove"){

        } else {
            return message.reply("¿Qué quieres hacer...?");
        }
    }
}