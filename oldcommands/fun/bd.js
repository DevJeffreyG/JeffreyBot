const Colores = require("../../src/resources/colores.json");
const Discord = require("discord.js");
const ms = require("ms");

const { Initialize, TutorialEmbed, Confirmation } = require("../../src/utils/");
const { Users } = require("mongoose").models;

const commandInfo = {
    name: "bd",
    aliases: ["birth", "cumpleaños", "bday"],
    info: "Especificas tu fecha de cumpleaños dentro del servidor",
    params: [
        {
            name: "action", display: "lock | all | dia | mes", type: "Options", options: ["lock", "all", "dia", "mes"], optional: false
        },
        {
            name: "dia", active_on: {param: "action", is: "all"}, type: "Number", optional: false
        },
        {
            name: "mes", active_on: {param: "action", is: "all"}, type: "Number", optional: false
        },
        {
            name: "dia", active_on: {param: "action", is: "dia"}, type: "Number", optional: false
        },
        {
            name: "mes", active_on: {param: "action", is: "mes"}, type: "Number", optional: false
        }
    ],
    userlevel: "USER",
    category: "FUN"
}

module.exports = {
    data: commandInfo,
    async execute(client, message, args){

        const { guild, author, prefix, executionInfo } = await Initialize(client, message);

        let response = await TutorialEmbed(commandInfo, executionInfo, args);

        if(response[0] === "ERROR") return console.log(response); // si hay algún error

        // Comando

        const action = response.find(x => x.param === "action").data;
        let selectedDay, selectedMonth;
        if(action === "all"){
            selectedDay = response.find(x => x.param === "dia").data;
            selectedMonth = response.find(x => x.param === "mes").data;
        } else if(action === "dia"){
            selectedDay = response.find(x => x.param === "dia").data;
        } else if(action === "mes"){
            selectedMonth = response.find(x => x.param === "mes").data;
        }

        let day;
        let month;
        let dateString;


        const user = await Users.findOne({
            user_id: author.id,
            guild_id: guild.id
        }) ?? await new Users({
            user_id: author.id,
            guild_id: guild.id
        }).save();

        const userBD = user.data.birthday;

        // revisar si ya pasó el año desde el lock
        let now = new Date();
        let lockedSince = userBD.locked_since ? userBD.locked_since : now;
        let lockedDuration = ms("365d");
        
        if(now - lockedSince >= lockedDuration){
            message.reply("hmmm, si estás usando este comando, ¿será para cambiar algo? he quitado el bloqueo de tu fecha de cumpleaños, reactívala cuando gustes.");

            userBD.locked = false;
            userBD.locked_since = null;
            await user.save();
        }

        if(userBD.locked) return message.react("537804262600867860");

        switch(action){
            case "lock":
                // bd lock
                day = userBD.day;
                month = String(userBD.month);

                switch(month){
                case "1":
                    month = "Enero"
                    break;

                case "2":
                    month = "Febrero"
                    break;

                case "3":
                    month = "Marzo"
                    break;

                case "4":
                    month = "Abril"
                    break;

                case "5":
                    month = "Mayo"
                    break;

                case "6":
                    month = "Junio"
                    break;

                case "7":
                    month = "Julio"
                    break;

                case "8":
                    month = "Agosto"
                    break;

                case "9":
                    month = "Septiembre"
                    break;

                case "10":
                    month = "Octubre"
                    break;

                case "11":
                    month = "Noviembre"
                    break;

                case "12":
                    month = "Diciembre"
                    break;

                default:
                    month = null;
                    break;
                }

                console.log(day, month);
                let bdString = day != null && month != null ? `${day} de ${month}` : null;

                if(!bdString) return message.reply(`No tienes la fecha completamente configurada, por favor hazlo antes de bloquearla.`);

                let toConfirm = [
                    "Al bloquear tu fecha, no la podrás cambiar durante un año.",
                    "Tendrás acceso a los beneficios del role de cumpleaños el día estipulado.",
                    `${bdString}.`
                ];

                let confirmation = await Confirmation("Lock", toConfirm, message);
                if(!confirmation) return;

                let hoy = new Date();
                userBD.locked = true;
                userBD.locked_since = hoy;
                user.save();
                confirmation.delete();

                message.react("✅");
                break;
                
            case "all":
                // bd all DD MM
                
                userBD.day = selectedDay;
                userBD.month = selectedMonth;

                await user.save();
                return message.react("✅")

            case "dia":
                // bd dia DD
                userBD.day = selectedDay;
                
                await user.save();
                return message.react("✅")
            case "mes":
                // bd mes MM

                userBD.month = selectedMonth;
                
                await user.save();
                return message.react("✅")
            }

    }
}