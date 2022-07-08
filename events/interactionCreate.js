const moment = require("moment");
const Discord = require("discord.js");
const { time } = require('@discordjs/builders');
const ms = require("ms");

const models = require("mongoose").models;
const { ToggledCommands, Users, Guilds } = models

const { Ticket, ErrorEmbed, FindNewId, Confirmation, intervalGlobalDatas, } = require("../src/utils");
const { Config, Colores, Reglas } = require("../src/resources");
const { jeffreygID, mantenimiento } = Config;

const activeCreatingTicket = new Map();

const ticketCooldown = ms("1m");

module.exports = async (client, interaction) => {
  const author = interaction.user;
  const guild = interaction.guild;
  const customId = interaction.customId;

  const docGuild = await Guilds.findOne({guild_id: guild.id}) ?? await new Guilds({guild_id: guild.id}).save();
  const prefix = "/";
  const staff_role = guild.roles.cache.find(x => x.id === docGuild.roles.staffs[0]);

  const user = await Users.findOne({guild_id: guild.id, user_id: author.id}) ?? await new Users({guild_id: guild.id, user_id: author.id}).save();

  if(interaction.isCommand()){ // SLASH COMMANDS
    const commandName = interaction.commandName;
    const slashCommand = client.slash.get(commandName);

    if(mantenimiento && author.id != jeffreygID) return interaction.reply({content: "Todos las funciones de Jeffrey Bot se encuentran en mantenimiento, lo siento", ephemeral: true});

    let toggledQuery = await ToggledCommands.getToggle(commandName);

    if(toggledQuery /* && author.id != jeffreygID */){
      let since = time(toggledQuery.since);
      return interaction.reply({content: null, embeds: [new ErrorEmbed({type: "toggledCommand", data: {commandName, since, reason: toggledQuery.reason}})], ephemeral: true});
    }

    // params
    const params = {};

    slashCommand.data.options.forEach(o => {
      //console.log(interaction)
      let { name } = o;
      params[name] = interaction.options.get(name)

      // subcommands & groups
      if(!params[name] && o.options){
        params["subcommand"] = interaction.options.getSubcommand(false); // guarda el subcomando que se está ejecutando
        params["subgroup"] = interaction.options.getSubcommandGroup(false); // guarda el grupo de subcomandos

        params[name] = undefined;

        subcommandFix(o.options, (x => {
            params[name] = x
        }));

        function subcommandFix(options, callback){
            let x = {};

            options.forEach(option => {
                let n = option.name;
                x[n] = interaction.options.get(n);

                if(!x[n]) subcgroupFix(option, (y => {
                    x = y;
                }))
            })

            callback(x)
        }

        function subcgroupFix(options, callback) {
            if(options.options){
              subcommandFix(options.options, z => {
                callback(z)
              });
            }
        }
    }
    })

    await intervalGlobalDatas(client);
    executeSlash(interaction, models, params, client)
  
    async function executeSlash(interaction, models, params, client){
      try {
        //console.log(slashCommand)
        await slashCommand.execute(interaction, models, params, client);
      } catch (error) {
        console.error(error);
        let help = new ErrorEmbed({type: "badCommand", data: {commandName, error}});
        try {
          await interaction.reply({ content: null, embeds: [help], ephemeral: true });
        } catch(er) {
          await interaction.editReply({ content: null, embeds: [help], ephemeral: true });
        }
      }
    }
  } else if(interaction.isButton()){ // BOTONES
    //console.log(interaction);
    const {userId, type} = getTicketInfo(interaction.message);
    let channel, message, ticket, confirmation, actualEmbeds;

    if(customId.toUpperCase().includes("TICKET")) ticket = new Ticket(interaction, client);

    if(ticket){
      return ticket.handle();
    }
    switch(customId){
      case "deleteMessage":
        interaction.message.delete();
        break;

      case "acceptSuggestion": {
        if(!interaction.deferred) await interaction.deferReply({ephemeral: true});

        let suggestion = docGuild.data.suggestions.find(x => x.message_id === interaction.message.id);

        suggestion.accepted = true;
        docGuild.save();

        message = interaction.message;
        let newembed = message.embeds[0].setFooter({text: `Aceptada por ${interaction.user.tag}`, iconURL: Config.bienPng}).setTimestamp();
        message.edit({embeds: [newembed], components: []});

        let r = interaction.guild.id === Config.testingServer ? interaction.guild.roles.cache.find(x => x.id === "983832210966732840") : interaction.guild.roles.cache.find(x => x.id === Config.suggestorRole);
        
        let acceptedEmbed = new Discord.MessageEmbed()
        .setAuthor({name: "¡Se ha aceptado una sugerencia tuya!", iconURL: Config.bienPng})
        .setDescription(`**—** ¡Gracias por ayudarnos a mejorar!
**—** Se ha aceptado tu sugerencia:
\`\`\`
${suggestion.suggestion}
\`\`\`
**—** Nos tomamos la libertad de agregarte un role como forma de agradecimiento 😉`)
        .setColor(Colores.verde)
        .setFooter({text: interaction.guild.name, iconURL: interaction.guild.iconURL()})
        .setTimestamp();
        
        let suggestor = interaction.guild.members.cache.find(x => x.id === suggestion.user_id);

        try {
          suggestor.send({embeds: [acceptedEmbed]});
        } catch (e) {
          interaction.followUp("No se pueden enviar mensajes a este usuario...")
        }
        
        await suggestor.roles.add(r);

        interaction.editReply({content: "Se ha aceptado la sugerencia, se ha enviado un mensaje al usuario y se le ha dado el rol de colaborador."});

        break;
      }

      case "denySuggestion": {
        if(!interaction.deferred) await interaction.deferReply({ephemeral: true});

        let suggestion = docGuild.data.suggestions.find(x => x.message_id === interaction.message.id);
        
        suggestion.accepted = false;
        docGuild.save();

        message = interaction.message;
        let newembed = message.embeds[0]
        .setFooter({text: `Denegada por ${interaction.user.tag}`, iconURL: Config.errorPng})
        .setColor(Colores.rojo)
        .setTimestamp();

        message.edit({embeds: [newembed], components: []});

        let r = interaction.guild.id === Config.testingServer ? interaction.guild.roles.cache.find(x => x.id === "983832210966732840") : interaction.guild.roles.cache.find(x => x.id === Config.suggestorRole);
        
        let acceptedEmbed = new Discord.MessageEmbed()
        .setAuthor({name: "¡Gracias por el interés!", iconURL: Config.errorPng})
        .setDescription(`**—** Hemos denegado tu sugerencia:
\`\`\`
${suggestion.suggestion}
\`\`\`
**—** ¡Gracias por ayudarnos a mejorar, siempre te tendremos en cuenta!`)
        .setColor(Colores.rojo)
        .setFooter({text: interaction.guild.name, iconURL: interaction.guild.iconURL()})
        .setTimestamp();
        
        let suggestor = interaction.guild.members.cache.find(x => x.id === suggestion.user_id);

        try {
          suggestor.send({embeds: [acceptedEmbed]});
        } catch (e) {
          interaction.followUp("No se pueden enviar mensajes a este usuario...")
        }
        
        await suggestor.roles.add(r);

        interaction.editReply({content: "Se ha denegado la sugerencia, se ha enviado un mensaje al usuario informándole."});
        break;
      }

      case "invalidateSuggestion": {
        if(!interaction.deferred) await interaction.deferReply({ephemeral: true});

        let suggestion = docGuild.data.suggestions.find(x => x.message_id === interaction.message.id);
        
        suggestion.accepted = false;
        docGuild.save();

        message = interaction.message;
        let newembed = message.embeds[0]
        .setFooter({text: `Invalidada por ${interaction.user.tag}`, iconURL: Config.errorPng})
        .setColor(Colores.rojo)
        .setTimestamp();

        message.edit({embeds: [newembed], components: []});

        let r = interaction.guild.id === Config.testingServer ? interaction.guild.roles.cache.find(x => x.id === "983832210966732840") : interaction.guild.roles.cache.find(x => x.id === Config.suggestorRole);
        
        let acceptedEmbed = new Discord.MessageEmbed()
        .setAuthor({name: "¡Gracias por el interés!", iconURL: Config.errorPng})
        .setDescription(`**—** Hemos determinado que tu sugerencia es inválida:
\`\`\`
${suggestion.suggestion}
\`\`\`
**—** Puede que esta haya sido una sugerencia repetida, o una ya denegada anteriormente.
**—** ¡Gracias por ayudarnos a mejorar, siempre te tendremos en cuenta!`)
        .setColor(Colores.rojo)
        .setFooter({text: interaction.guild.name, iconURL: interaction.guild.iconURL()})
        .setTimestamp();
        
        let suggestor = interaction.guild.members.cache.find(x => x.id === suggestion.user_id);

        try {
          suggestor.send({embeds: [acceptedEmbed]});
        } catch (e) {
          interaction.followUp("No se pueden enviar mensajes a este usuario...")
        }
        
        await suggestor.roles.add(r);

        interaction.editReply({content: "Se ha denegado la sugerencia, se ha enviado un mensaje al usuario informándole."});
        break;
      }

      default:
        console.log("No hay acciones para el botón con customId", customId);
    }
  }

  function getTicketInfo(message){
    let split = message.channel.name.split("-");

    return {
      type: split[1],
      userId: split[2]
    }
  }

  function resetCooldown(timeout, map){
    map.set(interaction.user.id, new Date());
    clearTimeout(timeout);

    timeout = setTimeout(() => {
      map.delete(interaction.user.id)
    }, ticketCooldown)
  }
}