const Config = require("../../base.json");
const Colores = require("../../resources/colores.json");
const Emojis = require("../../resources/emojis.json");
const Discord = require("discord.js");
const ms = require("ms");

const { Initialize, TutorialEmbed, CollectMessage, ValidateParam, Confirmation } = require("../../resources/functions.js");

/* ##### MONGOOSE ######## */

const Guild = require("../../modelos/Guild.model.js");

/* ##### MONGOOSE ######## */

const modulos = "prefix | adminrole | staffrole | userrole | botrole | generallogs | moderationlogs | stafflogs";

const commandInfo = {
    name: "setup",
    aliases: ["config"],
    info: "Configura al bot, designa los roles, habilita módulos, etc",
    params: [
        {
            name: "opciones", display: "wizard | modulos", type: "Options", options: ["wizard", "modulos"], optional: false
        },
        {
            name: "modulo", display: modulos, type: "String", active_on: {param: "opciones", is: "modulos"}, optional: false
        }
    ],
    userlevel: "ADMIN",
    category: "STAFF"
}

module.exports = {
    data: commandInfo,
    async execute(client, message, args){

        const { guild, prefix, author, executionInfo } = await Initialize(client, message);

        let response = await TutorialEmbed(commandInfo, executionInfo, args);

        if(response[0] === "ERROR") return console.log(response); // si hay algún error

        const action = response.find(x => x.param === "opciones").data;

        // Comando

        if(action === "wizard"){
            let msg = await message.reply("¿Cuál es el nuevo prefijo para los comandos?");
            let prefix = await CollectMessage(message, msg);
            if(!prefix) return;

            prefix = prefix.content;

            await msg.edit("¿Cuál es el nuevo role de ADMINS?");

            let adminRole;

            while(!adminRole){
                adminRole = await CollectMessage(message, msg);
                if(!adminRole) return;

                adminRole = await ValidateParam("Role", adminRole);
            }

            await msg.edit("¿Cuál es el nuevo role de miembros del STAFF?");

            let staffRole;

            while(!staffRole){
                staffRole = await CollectMessage(message, msg);
                if(!staffRole) return;

                staffRole = await ValidateParam("Role", staffRole);
            }

            await msg.edit("¿Cuál es el nuevo role de usuarios del server? Si no existe uno, puedes usar el role @everyone (usa la ID de tu server para no mencionarlos)");

            let userRole;

            while(!userRole){
                userRole = await CollectMessage(message, msg);
                if(!userRole) return;

                userRole = await ValidateParam("Role", userRole);
            }

            await msg.edit("¿Cuál es el nuevo role de bots del server? Si no existe uno, puedes usar el role @everyone (usa la ID de tu server para no mencionarlos)");

            let botsRole;

            while(!botsRole){
                botsRole = await CollectMessage(message, msg);
                if(!botsRole) return;

                botsRole = await ValidateParam("Role", botsRole);
            }

            // confirmacion

            let toConfirm = [
                `Nuevo prefix: \`${prefix}\`.`,
                `Role de Administradores: ${adminRole}.`,
                `Role de STAFF: ${staffRole}.`,
                `Role de Usuarios: ${userRole}.`,
                `Role de Bots: ${botsRole}.`
            ];

            let confirmation = await Confirmation("Nueva configuración", toConfirm, message);
            if(!confirmation) return;

            const docGuild = await Guild.findOne({guild_id: guild.id});

            if(!docGuild){
                await new Guild({
                    guild_id: guild.id,
                    settings: {
                        prefix: prefix
                    },
                    roles: {
                        admin: adminRole.id,
                        staff: staffRole.id,
                        users: userRole.id,
                        bots: botsRole.id
                    }
                }).save();
            } else {
                docGuild.settings.prefix = prefix;
                docGuild.roles.admin = adminRole.id;
                docGuild.roles.staff = staffRole.id;
                docGuild.roles.users = userRole.id;
                docGuild.roles.bots = botsRole.id;

                await docGuild.save()
            }

            confirmation.delete();
            msg.delete();

            return message.react("✅");
        } else {
            const docGuild = await Guild.findOne({guild_id: guild.id}) ?? await new Guild({guild_id: guild.id}).save();

            const modulo = response.find(x => x.param === "modulo").data;

            let error = false;

            switch(modulo.toLowerCase()){
                case "prefix": {
                    docGuild.settings.prefix = newValue;
                    break;
                }

                case "generallogs": {
                    let newValue = await getChannel("¿Cuál es el canal de logs generales?")
                    docGuild.channels.general_logs = newValue;
                    break;
                }
                
                case "moderationlogs": {
                    let newValue = await getChannel("¿Cuál es el canal de logs para acciones de moderación?")
                    docGuild.channels.moderation_logs = newValue;
                    break;
                }

                case "stafflogs": {
                    let newValue = await getChannel("¿Cuál es el canal de logs para comunicación entre STAFFs y usuarios?")
                    docGuild.channels.staff_logs = newValue;
                    break;
                }

                default:
                    error = true;
            }

            if(error) return message.reply(`No existe ese módulo.\n\`\`\`${prefix}setup modulos <${modulos}>\`\`\``);
            else

            await docGuild.save();
            return message.react("✅");
        }

        async function getChannel(question){
            let msg = await message.reply(question);

            let toReturn;

            while(!toReturn){
                toReturn = await CollectMessage(message, msg);
                if(!toReturn) return;

                toReturn = await ValidateParam("Channel", toReturn);
            }
            msg.delete();
            return toReturn.id;
        }

        async function getRole(question){
            let msg = await message.reply(question);

            let toReturn;

            while(!toReturn){
                toReturn = await CollectMessage(message, msg);
                if(!toReturn) return;

                toReturn = await ValidateParam("Role", toReturn);
            }
            return toReturn.id;
        }

    }
}