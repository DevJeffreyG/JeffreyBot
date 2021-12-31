const moment = require("moment");
const Discord = require("discord.js");
const ms = require("ms");

const Toggle = require("../modelos/Toggle.model.js");
const User = require("../modelos/User.model.js");
const Guild = require("../modelos/Guild.model.js");

let functions = require("../resources/functions.js");
const Colores = require("../resources/colores.json");
const Config = require("../base.json");
const { jeffreygID, mantenimiento } = Config;
const reglas = require("../resources/reglas.json");

const activeCreatingTicket = new Map();

const ticketCooldown = ms("1m");

module.exports = async (client, interaction) => {
  const author = interaction.user;
  const guild = interaction.guild;
  const customId = interaction.customId;

  const docGuild = await Guild.findOne({guild_id: guild.id}) ?? await new Guild({guild_id: guild.id}).save();
  const prefix = docGuild.settings.prefix;
  const staff_role = guild.roles.cache.find(x => x.id === docGuild.roles.staff);

  const user = await User.findOne({guild_id: guild.id, user_id: author.id}) ?? await new User({guild_id: guild.id, user_id: author.id}).save();

  if(interaction.isCommand()){ // SLASH COMMANDS
    const slashCommand = client.slash.get(interaction.commandName);
    const commandName = interaction.commandName;

    if(mantenimiento && author.id != jeffreygID) return interaction.reply({content: "Todos las funciones de Jeffrey Bot se encuentran en mantenimiento, lo siento", ephemeral: true});

    let toggledQuery = await Toggle.findOne({
      command: commandName
    });

    if(toggledQuery && author.id != jeffreygID){
      let since = moment(toggledQuery.since).format("DD/MM/YY")
      return interaction.reply({content: `Este comando está deshabilitado.\n${toggledQuery.reason} desde ${since}`, ephemeral: true});
    }

    await functions.intervalGlobalDatas(client);
    executeSlash(interaction, client)
  
    async function executeSlash(interaction, client){
      try {
        await slashCommand.execute(interaction, client);
      } catch (error) {
        console.error(error);
        await interaction.reply({ content: 'Jeffrey es tonto, hubo un error ejecutando este comando, por fa, avísale de su grado de inservibilidad. **(ni siquiera sé si esa palabra existe...)**', ephemeral: true });
      }
    }
  } else if(interaction.isButton()){ // BOTONES
    //console.log(interaction);
    const {userId} = getTicketInfo(interaction.message);
    let channel, message, ticket, confirmation, actualEmbeds;

    // boton para reabrir el ticket despues de cerrado
    const postTicketRow = new Discord.MessageActionRow()
      .addComponents(
          new Discord.MessageButton()
              .setCustomId("reopenTicket")
              .setLabel("Volver a abrir el ticket")
              .setStyle("SECONDARY")
      )

    // botones para cerrar el ticket
    const ticketRow = new Discord.MessageActionRow()
      .addComponents(
          new Discord.MessageButton()
              .setCustomId("resolveTicket")
              .setLabel("Marcar como resuelto")
              .setStyle("PRIMARY"),
          new Discord.MessageButton()
              .setCustomId("closeTicket")
              .setLabel("Cerrar ticket")
              .setStyle("DANGER")
      )
    
    // permisos para tickets
    const permissions = [
      {
          id: guild.roles.cache.find(x => x.name === "@everyone").id,
          deny: ["VIEW_CHANNEL", "SEND_MESSAGES"]
      },
      {
        id: staff_role.id,
        allow: [Discord.Permissions.ALL]
      },
      {
          id: author.id,
          allow: ["VIEW_CHANNEL", "SEND_MESSAGES", "EMBED_LINKS", "ATTACH_FILES"]
      }
    ];

    switch(customId){
      case "deleteMessage":
        interaction.message.delete();
        break;

      case "reopenTicket":
        if(!interaction.deferred) await interaction.deferReply({ephemeral: true});

        if(userId === interaction.user.id) return interaction.editReply({content: "Sólo el STAFF puede reabrir el ticket."});

        confirmation = await functions.Confirmation("Abrir ticket", [`¿Estás segur@ de que quieres volver a abrir el ticket?`, `Se mencionará al creador original del ticket`], interaction, true);
        if(!confirmation) return;

        ticket = docGuild.data.tickets.find(x => x.channel_id === interaction.channel.id);
        channel = interaction.channel;

        message = await channel.messages.fetch(ticket.message_id);

        let reopenedEmbed = new Discord.MessageEmbed()
        .setFooter(`El ticket se volvió a abrir`)
        .setTimestamp(new Date())
        .setColor(Colores.verdeclaro);

        actualEmbeds = [];
        message.embeds.forEach(embed => {
          actualEmbeds.push(embed);
        });

        actualEmbeds.push(reopenedEmbed);

        await message.edit({embeds: actualEmbeds, components: [ticketRow]});

        ticket.end_reason = null;
        ticket.ended_by = null;
        ticket.end_date = null;

        await docGuild.save();

        // agregar al creador original al canal otra vez
        await channel.permissionOverwrites.edit(ticket.created_by, {
          "VIEW_CHANNEL": true,
          "SEND_MESSAGES": true
        });

        let originalCreator = guild.members.cache.find(x => x.id === ticket.created_by);

        interaction.editReply({content: "✅ Se reabrió el Ticket.", embeds: [], components: []});

        // mencionar al creador original
        channel.send(`¡${originalCreator}! El STAFF ha vuelto a abrir tu ticket.`);
        break;

      case "resolveTicket":
        if(!interaction.deferred) await interaction.deferReply({ephemeral: true});

        if(userId != interaction.user.id) return interaction.editReply({content: "Sólo el creador del ticket puede marcarlo como resuelto."});
        
        confirmation = await functions.Confirmation("Marcar como resuelto", [`¿Estás segur@ de que quieres cerrar el ticket?`, `Sólo podría ser vuelto a abrir por un miembro del STAFF`], interaction, true);
        if(!confirmation) return;
          
        ticket = docGuild.data.tickets.find(x => x.channel_id === interaction.channel.id);
        channel = interaction.channel;

        message = await channel.messages.fetch(ticket.message_id);

        if(ticket.end_reason) return interaction.editReply({content: `⚠️ Ya se ha marcado el final del ticket como ${ticket.end_reason} el ${moment(ticket.end_date).tz("America/Bogota").format("DD [de] MMM [a las] hh[:]mm A")} (GMT-5).`, embeds: [], components: []});
        
        let closedEmbed = new Discord.MessageEmbed()
        .setFooter(`El ticket se marcó como resuelto`)
        .setTimestamp()
        .setColor(Colores.rojo);

        actualEmbeds = [];
        message.embeds.forEach(embed => {
          actualEmbeds.push(embed);
        });

        actualEmbeds.push(closedEmbed);

        await message.edit({embeds: actualEmbeds, components: [postTicketRow]});

        ticket.end_date = new Date();
        ticket.end_reason = "RESOLVED";
        ticket.ended_by = interaction.user.id;

        docGuild.save();

        interaction.editReply({content: "✅ El Ticket se marcó como resuelto.", embeds: [], components: []});

        // eliminar al autor del ticket del canal
        channel.permissionOverwrites.edit(ticket.created_by, {
          "VIEW_CHANNEL": false,
          "SEND_MESSAGES": false
        });
        break;

      case "closeTicket":
        if(!interaction.deferred) await interaction.deferReply({ephemeral: true});

        if(userId === interaction.user.id) return interaction.editReply({content: "Sólo el STAFF puede forzar el cierre del ticket."});
        else {
          confirmation = await functions.Confirmation("Forzar cierre", [`El autor del ticket no lo ha marcado como resuelto`, `¿Estás segur@ de que quieres cerrar el ticket?`], interaction, true);
          if(!confirmation) return;

          //interaction.message.channel.delete();

          ticket = docGuild.data.tickets.find(x => x.channel_id === interaction.channel.id);
          channel = interaction.channel;
  
          message = await channel.messages.fetch(ticket.message_id);

          if(ticket.end_reason) return interaction.editReply({content: `⚠️ Ya se ha marcado el final del ticket como ${ticket.end_reason} el ${moment(ticket.end_date).tz("America/Bogota").format("DD [de] MMM [a las] hh[:]mm A")} (GMT-5).`, embeds: [], components: []});
  
          let forcedEmbed = new Discord.MessageEmbed()
          .setFooter(`El ticket fue cerrado`)
          .setTimestamp()
          .setColor(Colores.rojooscuro);
  
          actualEmbeds = [];
          message.embeds.forEach(embed => {
            actualEmbeds.push(embed);
          });
  
          actualEmbeds.push(forcedEmbed)
  
          await message.edit({embeds: actualEmbeds, components: [postTicketRow]});
  
          ticket.end_date = new Date();
          ticket.end_reason = "FORCED";
          ticket.ended_by = interaction.user.id;
  
          docGuild.save();
          //interaction.message.channel.delete();
  
          // eliminar al autor del ticket del canal
          channel.permissionOverwrites.edit(ticket.created_by, {
            "VIEW_CHANNEL": false,
            "SEND_MESSAGES": false
          });

          interaction.editReply({content: "✅ Se cerró el Ticket.", embeds: [], components: []});

        }
        break;

      case "createTicket":
        if(!interaction.deferred) await interaction.deferReply({ephemeral: true});
        let ticketType, channelId, newId;

        // tiene cooldown
        if(activeCreatingTicket.has(interaction.user.id)) return interaction.editReply(`Ya estás creando un ticket, por favor espera ${ms((ticketCooldown) - (new Date().getTime() - activeCreatingTicket.get(interaction.user.id)))} antes de volver a darle al botón.`);

        activeCreatingTicket.set(interaction.user.id, new Date());
        let ticketTimeout = setTimeout(() => {
          activeCreatingTicket.delete(interaction.user.id)
        }, ticketCooldown)

        let selectMenuTopic = new Discord.MessageSelectMenu()
        .setCustomId("selectTopic")
        .setPlaceholder("¿Qué necesitas hablar con el STAFF?");
          
        selectMenuTopic.addOptions({label: "Tengo una duda / problema", value: "help"}, {label: "Reportar a un usuario", value: "report"}, {label: "Me dieron un Warn injusto", value: "warn"}, {label: "Me dieron un Softwarn injusto", value: "softwarn"}, {label: "Hay un problema con Jeffrey Bot", value: "jeffreybot"});

        selectMenuTopic.addOptions({label: "Cancelar", value: "cancel", emoji: "❌"});

        let selectingTopic = new Discord.MessageActionRow().addComponents([selectMenuTopic]);

        await interaction.editReply({content: "¿Qué necesitas?", components: [selectingTopic]});

        let filter = (i) => i.isSelectMenu() && i.customId === "selectTopic" && i.user.id === interaction.user.id;
        let topicCollector = await interaction.channel.awaitMessageComponent({filter, time: ticketCooldown}).catch(() => {});

        if(!topicCollector) {
          return interaction.editReply({content: "Cancelado.", components: []});
        }

        await topicCollector.deferUpdate();

        const topic = topicCollector.values[0];

        if(topic === "cancel"){
          return interaction.editReply({content: "Cancelado.", components: []});
        } else if(topic === "help") {
          ticketType = "HELP";

          // reiniciar el cooldown
          resetCooldown(ticketTimeout, activeCreatingTicket);

          let confirmation = await functions.Confirmation("Nuevo ticket", ["¿Estás segur@ de crear un nuevo ticket de ayuda?", "Las preguntas deben estar relacionadas con el servidor de Discord, nada fuera de él.", "El STAFF te responderá en cuanto pueda.", `Recuerda que en los canales <#${Config.infoChannel}> y <#${Config.faqChannel}> se aclaran las dudas más comúnes, si no has revisado si tu duda está ahí, revísa primero antes de hacer un ticket.`], interaction, true);
          if(!confirmation) return;

          newId = await functions.FindNewId(await Guild.find(), "data.tickets", "id"); // crear la nueva id para el ticket
          
          const channelName = `ticket${newId}-help-${author.id}`;
          const category = client.user.id === Config.testingJBID ? guild.channels.cache.find(x => x.id === "919009755857555496") : guild.channels.cache.find(x => x.id === Config.ticketsCategory);

          // CREAR CANAL
          channel = await category.createChannel(channelName, {topic: `**—** Ticket creado por **${author.tag}** (${moment().tz("America/Bogota").format("DD [de] MMM [a las] hh:mm:ss A")} GMT-5)`, permissionOverwrites: permissions});
          channelId = channel.id; // guardar la id del canal para después usarlo en la db

          await interaction.editReply({content: `✅ Se ha creado el ticket: ${channel}`, embeds: []});

          // enviar el embed primero
          let general = new Discord.MessageEmbed()
          .setTitle(`Ayuda general.`)
          .setFooter(`ID del Ticket: ${newId}`, guild.iconURL())
          .setColor(Colores.verdeclaro);
          
          let timestatus = new Discord.MessageEmbed()
          .setFooter(`El ticket se abrió`)
          .setTimestamp()
          .setColor(Colores.verde);

          let embeds = [general, timestatus];
          
          let toPin = await channel.send({content: "El STAFF te ayudará en cuanto pueda.", embeds, components: [ticketRow]})
          message = toPin;

          await toPin.pin();

          channel.send(`${author}, este será el canal donde el STAFF te podrá ayudar.\nDetalla ¿cuál es exactamente tu duda/problema?`)

        } else if(topic === "report"){
          ticketType = "REPORT";
          
          // reiniciar el cooldown
          resetCooldown(ticketTimeout, activeCreatingTicket);

          let reportConfirm = [
            "¿Estás segur@ de crear un nuevo ticket de reporte?",
            "Ten a la mano las pruebas de la razón por la que estás reportando al usuario.",
            `Reportar a un usuario si crees que incumple las reglas dentro y también **fuera del servidor** (O sea, en los mensajes directos)`,
            "El STAFF te atendrá en cuanto pueda."
          ]

          let confirmation = await functions.Confirmation("Nuevo ticket", reportConfirm, interaction, true);
          if(!confirmation) return;

          newId = await functions.FindNewId(await Guild.find(), "data.tickets", "id"); // crear la nueva id para el ticket

          const channelName = `ticket${newId}-report-${author.id}`;
          const category = client.user.id === Config.testingJBID ? guild.channels.cache.find(x => x.id === "919009755857555496") : guild.channels.cache.find(x => x.id === Config.ticketsCategory);

          // CREAR CANAL
          channel = await category.createChannel(channelName, {topic: `**—** Ticket creado por **${author.tag}** (${moment().tz("America/Bogota").format("DD [de] MMM [a las] hh:mm:ss A")} GMT-5)`, permissionOverwrites: permissions});
          channelId = channel.id; // guardar la id del canal para después usarlo en la db

          await interaction.editReply({content: `✅ Se ha creado el ticket: ${channel}`, embeds: []});

          // enviar el embed primero
          let general = new Discord.MessageEmbed()
          .setTitle(`Reporte a un usuario.`)
          .setFooter(`ID del Ticket: ${newId}`, guild.iconURL())
          .setColor(Colores.verdeclaro);
          
          let timestatus = new Discord.MessageEmbed()
          .setFooter(`El ticket se abrió`)
          .setTimestamp()
          .setColor(Colores.verde);

          let embeds = [general, timestatus];
          
          let toPin = await channel.send({content: "El STAFF te ayudará en cuanto pueda.", embeds, components: [ticketRow]})
          message = toPin;

          await toPin.pin();

          channel.send(`${author}, este será el canal donde el STAFF te podrá ayudar, eres libre de mencionarlos si crees que es urgente y pasa mucho tiempo.\nExplica la situación, ¿a quién estás reportando? ¿cuáles son las pruebas y razones del reporte?`);

        } else if(topic === "warn"){
          ticketType = "WARN";

          // reiniciar el cooldown
          resetCooldown(ticketTimeout, activeCreatingTicket);

          filter = (i) => i.isSelectMenu() && i.customId === "selectWarn" && i.user.id === interaction.user.id; // cambiar el filtro de la customId

          // mostrar los WARNS
          let selectMenuWarn = new Discord.MessageSelectMenu()
          .setCustomId("selectWarn")
          .setPlaceholder("Selecciona el WARN por el que quieres crear un ticket");

          for (let i = 0; i < user.warns.length; i++) {
            const warn = user.warns[i];
            
            const label = `ID: ${warn.id} — Por: ${reglas[warn.rule_id].regla}`
            
            selectMenuWarn.addOptions({label, value: warn.id.toString(), description: reglas[warn.rule_id].description});
          }
          
          selectMenuWarn.addOptions({label: "Cancelar", value: "cancel", emoji: "❌"});

          let selectingWarn = new Discord.MessageActionRow().addComponents([selectMenuWarn]);

          await topicCollector.editReply({content: "¿Cuál es el warn por el cuál quieres hacer el ticket?", components: [selectingWarn]});

          let warnCollector = await interaction.channel.awaitMessageComponent({filter, time: ticketCooldown}).catch(() => {});
          if(!warnCollector) return interaction.editReply({content: "Cancelado.", components: []});

          await warnCollector.deferUpdate();

          if(warnCollector.values[0] == "cancel") return warnCollector.editReply({content: "Cancelado.", components: []});

          let selectedWarn = user.warns.find(x => x.id === Number(warnCollector.values[0]));

          // si ya ha hecho el ticket
          if(user.warns.find(x => x.id === selectedWarn.id).madeTicket) return warnCollector.editReply({content: `⚠️ Ya has hecho un ticket con el **warn** con ID: \`${selectedWarn.id}\`, cancelando.`, components: []});

          if(selectedWarn.proof === "na") return warnCollector.editReply({content: `⚠️ El **warn**" con ID: \`${selectedWarn.id}\`, lo tienes gracias a que **alguien te lo dio por la DarkShop**, no podemos ayudarte.\n\n**Si crees que se trata de un error, contacta directamente al Staff.**`, embeds: [], components: []});

          let toConfirm = [
            `Crear un nuevo ticket para el warn con id \`${selectedWarn.id}\`.`,
            `Regla N°${selectedWarn.rule_id} (${reglas[selectedWarn.rule_id].regla}).`,
            `Las pruebas dadas por el STAFF las puedes ver usando \`${prefix}warns id: ${selectedWarn.id}\`.`
          ];

          let confirmation = await functions.Confirmation("Nuevo ticket", toConfirm, warnCollector, true);
          if(!confirmation) return;

          selectedWarn.madeTicket = true; // guardar que se ha hecho un ticket de este warn
          user.save();

          newId = await functions.FindNewId(await Guild.find(), "data.tickets", "id"); // crear la nueva id para el ticket
          
          const channelName = `ticket${newId}-warn-${author.id}`;
          const category = client.user.id === Config.testingJBID ? guild.channels.cache.find(x => x.id === "919009755857555496") : guild.channels.cache.find(x => x.id === Config.ticketsCategory);

          // CREAR CANAL
          channel = await category.createChannel(channelName, {topic: `**—** Ticket creado por **${author.tag}** (${moment().tz("America/Bogota").format("DD [de] MMM [a las] hh:mm:ss A")} GMT-5)`, permissionOverwrites: permissions});
          channelId = channel.id; // guardar la id del canal para después usarlo en la db

          await warnCollector.editReply({content: `✅ Se ha creado el ticket: ${channel}`, embeds: []});
          
          // enviar el embed primero
          let general = new Discord.MessageEmbed()
          .setTitle(`Warn, ID: ${selectedWarn.id}.`)
          .setDescription(`Regla N°${selectedWarn.rule_id}, "**${reglas[selectedWarn.rule_id].regla}**".`)
          .setFooter(`ID del Ticket: ${newId}`, guild.iconURL())
          .setColor(Colores.verdeclaro);

          let image = new Discord.MessageEmbed()
          .setTitle("Pruebas dadas por el STAFF:")
          .setImage(selectedWarn.proof)
          .setColor(Colores.verdejeffrey);
          
          let timestatus = new Discord.MessageEmbed()
          .setFooter(`El ticket se abrió`)
          .setTimestamp()
          .setColor(Colores.verde);

          let embeds = [general, image, timestatus];
          
          let toPin = await channel.send({content: "El STAFF te ayudará en cuanto pueda.", embeds, components: [ticketRow]})
          message = toPin;

          await toPin.pin();

          channel.send(`${author}, este será el canal donde el STAFF te podrá ayudar.\nExplica ¿por qué crees que la acción de moderación es injusta o debe quitarse?`)
        } else if(topic === "softwarn"){
          ticketType = "SOFTWARN";

          // reiniciar el cooldown
          resetCooldown(ticketTimeout, activeCreatingTicket);

          filter = (i) => i.isSelectMenu() && i.customId === "selectSoftWarn" && i.user.id === interaction.user.id; // cambiar el filtro de la customId

          // mostrar los WARNS
          let selectMenuSoftWarn = new Discord.MessageSelectMenu()
          .setCustomId("selectSoftWarn")
          .setPlaceholder("Selecciona el SOFTWARN por el que quieres crear un ticket");

          for (let i = 0; i < user.softwarns.length; i++) {
            const softwarn = user.softwarns[i];
            
            const label = `ID: ${softwarn.id} — Por: ${reglas[softwarn.rule_id].regla}`
            
            selectMenuSoftWarn.addOptions({label, value: softwarn.id.toString(), description: reglas[softwarn.rule_id].description});
          }
          
          selectMenuSoftWarn.addOptions({label: "Cancelar", value: "cancel", emoji: "❌"});

          let selectingWarn = new Discord.MessageActionRow().addComponents([selectMenuSoftWarn]);

          await topicCollector.editReply({content: "¿Cuál es el softwarn por el cuál quieres hacer el ticket?", components: [selectingWarn]});

          let softwarnCollector = await interaction.channel.awaitMessageComponent({filter, time: ticketCooldown}).catch(() => {});
          if(!softwarnCollector) return interaction.editReply({content: "Cancelado.", components: []});

          await softwarnCollector.deferUpdate();

          if(softwarnCollector.values[0] == "cancel") return softwarnCollector.editReply({content: "Cancelado.", components: []});

          let selectedSoftWarn = user.softwarns.find(x => x.id === Number(softwarnCollector.values[0]));

          // si ya ha hecho el ticket
          if(user.softwarns.find(x => x.id === selectedSoftWarn.id).madeTicket) return softwarnCollector.editReply({content: `⚠️ Ya has hecho un ticket con el **softwarn** con ID: \`${selectedSoftWarn.id}\`, cancelando.`, components: []});

          //if(selectedSoftWarn.proof === "na") return softwarnCollector.editReply({content: `⚠️ El **softwarn**" con ID: \`${selectedSoftWarn.id}\`, lo tienes gracias a que **alguien te lo dio por la DarkShop**, no podemos ayudarte.\n\n**Si crees que se trata de un error, contacta directamente al Staff.**`, embeds: [], components: []});

          let toConfirm = [
            `Crear un nuevo ticket para el softwarn con id \`${selectedSoftWarn.id}\`.`,
            `Regla N°${selectedSoftWarn.rule_id} (${reglas[selectedSoftWarn.rule_id].regla}).`,
            `Las pruebas dadas por el STAFF las puedes ver usando \`${prefix}warns id: ${selectedSoftWarn.id}\`.`
          ];

          let confirmation = await functions.Confirmation("Nuevo ticket", toConfirm, softwarnCollector, true);
          if(!confirmation) return;

          selectedSoftWarn.madeTicket = true; // guardar que se ha hecho un ticket de este warn
          user.save();

          newId = await functions.FindNewId(await Guild.find(), "data.tickets", "id"); // crear la nueva id para el ticket
          
          const channelName = `ticket${newId}-softwarn-${author.id}`;
          const category = client.user.id === Config.testingJBID ? guild.channels.cache.find(x => x.id === "919009755857555496") : guild.channels.cache.find(x => x.id === Config.ticketsCategory);

          // CREAR CANAL
          channel = await category.createChannel(channelName, {topic: `**—** Ticket creado por **${author.tag}** (${moment().tz("America/Bogota").format("DD [de] MMM [a las] hh:mm:ss A")} GMT-5)`, permissionOverwrites: permissions});
          channelId = channel.id; // guardar la id del canal para después usarlo en la db

          await softwarnCollector.editReply({content: `✅ Se ha creado el ticket: ${channel}`, embeds: []});
          
          // enviar el embed primero
          let general = new Discord.MessageEmbed()
          .setTitle(`Softwarn, ID: ${selectedSoftWarn.id}.`)
          .setDescription(`Regla N°${selectedSoftWarn.rule_id}, "**${reglas[selectedSoftWarn.rule_id].regla}**".`)
          .setFooter(`ID del Ticket: ${newId}`, guild.iconURL())
          .setColor(Colores.verdeclaro);

          let image = new Discord.MessageEmbed()
          .setTitle("Pruebas dadas por el STAFF:")
          .setImage(selectedSoftWarn.proof)
          .setColor(Colores.verdejeffrey);
          
          let timestatus = new Discord.MessageEmbed()
          .setFooter(`El ticket se abrió`)
          .setTimestamp()
          .setColor(Colores.verde);

          let embeds = [general, image, timestatus];
          
          let toPin = await channel.send({content: "El STAFF te ayudará en cuanto pueda.", embeds, components: [ticketRow]})
          message = toPin;

          await toPin.pin();

          channel.send(`${author}, este será el canal donde el STAFF te podrá ayudar.\nExplica ¿por qué crees que la acción de moderación es injusta o debe quitarse?`)
        } else if(topic === "jeffreybot"){
          ticketType = "JEFFREYBOT";

          // reiniciar el cooldown
          resetCooldown(ticketTimeout, activeCreatingTicket);

          let confirmation = await functions.Confirmation("Nuevo ticket", ["¿Estás segur@ de crear un nuevo ticket de problemas con Jeffrey Bot?", "El STAFF te puede ayudar, sin embargo ten en cuenta que: el que soluciona los bugs es Jeffrey."], interaction, true);
          if(!confirmation) return;

          newId = await functions.FindNewId(await Guild.find(), "data.tickets", "id"); // crear la nueva id para el ticket
          
          const channelName = `ticket${newId}-jb-${author.id}`;
          const category = client.user.id === Config.testingJBID ? guild.channels.cache.find(x => x.id === "919009755857555496") : guild.channels.cache.find(x => x.id === Config.ticketsCategory);

          // CREAR CANAL
          channel = await category.createChannel(channelName, {topic: `**—** Ticket creado por **${author.tag}** (${moment().tz("America/Bogota").format("DD [de] MMM [a las] hh:mm:ss A")} GMT-5)`, permissionOverwrites: permissions});
          channelId = channel.id; // guardar la id del canal para después usarlo en la db

          await interaction.editReply({content: `✅ Se ha creado el ticket: ${channel}`, embeds: []});

          // enviar el embed primero
          let general = new Discord.MessageEmbed()
          .setTitle(`Problemas con Jeffrey Bot.`)
          .setFooter(`ID del Ticket: ${newId}`, guild.iconURL())
          .setColor(Colores.verdeclaro);
          
          let timestatus = new Discord.MessageEmbed()
          .setFooter(`El ticket se abrió`)
          .setTimestamp()
          .setColor(Colores.verde);

          let embeds = [general, timestatus];
          
          let toPin = await channel.send({content: "El STAFF te ayudará en cuanto pueda.", embeds, components: [ticketRow]})
          message = toPin;

          await toPin.pin();

          channel.send(`${author}, este será el canal donde el STAFF te podrá ayudar.\nExplica ¿cuál es exactamente tu problema con Jeffrey Bot?`)
        }

        // GUARDARLO EN LA BASE DE DATOS
        docGuild.data.tickets.push({
          type: ticketType,
          created_by: interaction.user.id,
          channel_id: channelId,
          message_id: message.id,
          start_date: new Date(),
          id: newId
        });

        docGuild.save();
        break;

      case "acceptSuggestion":
        if(!interaction.deferred) await interaction.deferReply({ephemeral: true});
        break;

      case "denySuggestion":
        if(!interaction.deferred) await interaction.deferReply({ephemeral: true});
        break;

      case "invalidateSuggestion":
        if(!interaction.deferred) await interaction.deferReply({ephemeral: true});
        break;

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