const Config = require("../../base.json");
const Colores = require("../../resources/colores.json");
const Emojis = require("../../resources/emojis.json");
const Discord = require("discord.js");
const ms = require("ms");

const { Initialize, TutorialEmbed } = require("../../resources/functions.js");

/* ##### MONGOOSE ######## */

const Key = require("../../modelos/keys.js");

/* ##### MONGOOSE ######## */

const commandInfo = {
    name: "generatekey",
    aliases: ["addredeem", "akey", "aredeem", "genkey", "genredeem", "addkey"],
    info: "Generar una nueva clave",
    params: [
        {
            name: "tipo", display: "jeffros | exp | role | boost", type: "Options", options: ["jeffros", "exp", "role", "boost"], optional: false
        },
        {
            name: "valor", display: "jeffros a dar", active_on: {param: "tipo", is: "jeffros"}, type: "NaturalNumber", optional: false
        },
        {
            name: "usos", display: "usos máximos", active_on: {param: "tipo", is: "jeffros"}, type: "NaturalNumber", optional: true
        },
        {
            name: "valor", display: "exp a dar", active_on: {param: "tipo", is: "exp"}, type: "NaturalNumber", optional: false
        },
        {
            name: "usos", display: "usos máximos", active_on: {param: "tipo", is: "exp"}, type: "NaturalNumber", optional: true
        },
        {
            name: "role", display: "id | @role", active_on: {param: "tipo", is: "role"}, type: "Role", optional: false
        },
        {
            name: "usos", display: "usos máximos", active_on: {param: "tipo", is: "role"}, type: "NaturalNumber", optional: true
        },
        {
            name: "tipo de boost", active_on: {param: "tipo", is: "boost"}, type: "Options", options: ["multiplier", "chanceMultiplier"], optional: false
        },
        {
            name: "cantidad", display: "numero a multiplicar", active_on: {param: "tipo", is: "boost"}, type: "Number", optional: false
        },
        {
            name: "tiempo", active_on: {param: "tipo", is: "boost"}, type: "Time", optional: false
        },
        {
            name: "usos", display: "usos máximos", active_on: {param: "tipo", is: "boost"}, type: "NaturalNumber", optional: true
        },
        {
            name: "usos", display: "usos máximos", type: "NaturalNumber", optional: true // estetica pa
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
        const tipo = response.find(x => x.param === "tipo").data;

        // Comando

        // generar nueva key
        let generatedID = 1;
        let keysq = await Key.find();

        // id
        for (let i = 0; i < keysq.length; i++) {
            const keys = keysq[i];
            
            if(keys.id == generatedID) generatedID++
        }

        // code
        let generatedCode = generateCode()
        while (await findKey(generatedCode)) {
            generatedCode = generateCode();
        }

        if(tipo === "jeffros" || tipo === "exp"){
            let value = response.find(x => x.param === "valor").data;
            let maxuses = response.find(x => x.param === "usos").data || Infinity;

            const newKey = new Key({
                guild_id: message.guild.id,
                config: {
                    maxuses: maxuses
                },
                reward: {
                    type: tipo,
                    value: value
                },
                code: generatedCode,
                id: generatedID
            })
    
            await newKey.save();

        } else {
            // tipo boost o role
        }

        let added = new Discord.MessageEmbed()
      .setAuthor("| Listo", Config.bienPng)
      .setDescription(`**—** Se ha generado una nueva llave.
**—** \`${generatedCode}\`.
**—** ID: \`${generatedID}\`.`)
      .setColor(Colores.verde)

        return message.channel.send({embeds: [added]});

        function generateCode(){
            // generar nueva key
            let chr = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
            let generatedCode = "";
    
            for (let i = 0; i < 19; i++) {
                // ABCD-EFGH-IJKL-MNOP
                // 0123 5678 9101112 14151617
                if(generatedCode.length == 4 || generatedCode.length == 9 || generatedCode.length == 14) generatedCode += "-"
                else {
                    generatedCode += chr.charAt(Math.floor(Math.random() * chr.length));
                }
            }
    
            return generatedCode;
        }
    
        async function findKey(key){
            let q = await Key.findOne({
                code: key
            });
    
            return q ? true : false;
        }
    }
}