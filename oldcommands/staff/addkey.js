const Config = require("../../src/resources/base.json");
const Colores = require("../../src/resources/colores.json");
const Emojis = require("../../src/resources/emojis.json");
const Discord = require("discord.js");
const ms = require("ms");

const { Initialize, TutorialEmbed, FindNewId } = require("../../src/utils/");

/* ##### MONGOOSE ######## */

const Key = require("../../modelos/Key.model.js");

/* ##### MONGOOSE ######## */

const commandInfo = {
    name: "addkey",
    aliases: ["addredeem", "akey", "aredeem", "genkey", "genredeem", "generatekey"],
    info: "Generar una nueva clave",
    params: [
        {
            name: "tipo", display: "jeffros | exp | role | boost", type: "Options", options: ["jeffros", "exp", "role", "boost"], optional: false
        },
        {
            name: "valor", display: "jeffros a dar", active_on: {param: "tipo", is: "jeffros"}, type: "NaturalNumberNotInfinity", optional: false
        },
        {
            name: "usos", display: "usos máximos", active_on: {param: "tipo", is: "jeffros"}, type: "NaturalNumber", optional: true
        },
        {
            name: "valor", display: "exp a dar", active_on: {param: "tipo", is: "exp"}, type: "NaturalNumberNotInfinity", optional: false
        },
        {
            name: "usos", display: "usos máximos", active_on: {param: "tipo", is: "exp"}, type: "NaturalNumber", optional: true
        },
        {
            name: "role", display: "id | @role", active_on: {param: "tipo", is: "role"}, type: "Role", optional: false
        },
        {
            name: "duración", active_on: {param: "tipo", is: "role"}, type: "Time", optional: false
        },
        {
            name: "usos", display: "usos máximos", active_on: {param: "tipo", is: "role"}, type: "NaturalNumber", optional: true
        },
        {
            name: "role", display: "id | @role dado", active_on: {param: "tipo", is: "boost"}, type: "Role", optional: false
        },
        {
            name: "tipo de boost", display: "boostMultiplier | boostProbabilities", active_on: {param: "tipo", is: "boost"}, type: "Options", options: ["boostMultiplier", "boostProbabilities"], optional: false
        },
        {
            name: "valor de boost", display: "numero a multiplicar", active_on: {param: "tipo", is: "boost"}, type: "NaturalNumberNotInfinity", optional: false
        },
        {
            name: "objetivo", display: "jeffros | exp | all", active_on: {param: "tipo", is: "boost"}, type: "Options", options: ["jeffros", "exp", "all"], optional: false
        },
        {
            name: "duración", active_on: {param: "tipo", is: "boost"}, type: "Time", optional: false
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
        let keysq = await Key.find();
        let generatedID = await FindNewId(keysq, "", "id");

        // code
        let generatedCode = generateCode()
        while (await findKey(generatedCode)) {
            generatedCode = generateCode();
        }

        if(tipo === "jeffros" || tipo === "exp"){
            let value = response.find(x => x.param === "valor").data;
            let maxuses = response.find(x => x.param === "usos").data || Infinity;

            await new Key({
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
            }).save();

        } else {
            let boost_type = null;
            let boost_value = null;
            let boost_objetive = null;

            if(tipo === "boost") boost_type = response.find(x => x.param === "tipo de boost").data;
            if(tipo === "boost") boost_value = response.find(x => x.param === "valor de boost").data;
            if(tipo === "boost") boost_objetive = response.find(x => x.param === "objetivo").data;
            
            let value = response.find(x => x.param === "role").data;
            let duration = response.find(x => x.param === "duración").data;
            let maxuses = response.find(x => x.param === "usos").data || Infinity;

            await new Key({
                guild_id: message.guild.id,
                config: {
                    maxuses: maxuses
                },
                reward: {
                    type: tipo,
                    boost_type: boost_type,
                    boost_value: boost_value,
                    boost_objetive: boost_objetive,
                    value: value.id,
                    duration: duration
                },
                code: generatedCode,
                id: generatedID
            }).save();
        }

        let added = new Discord.MessageEmbed()
      .setAuthor("Listo", Config.bienPng)
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