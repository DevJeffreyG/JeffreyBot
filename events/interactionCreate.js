const Discord = require("discord.js");
const { time } = Discord;
const ms = require("ms");

const models = require("mongoose").models;
const { ToggledCommands, Users, Guilds } = models

const { Ticket, ErrorEmbed, intervalGlobalDatas, Categories, ValidateDarkShop, Embed } = require("../src/utils");
const { Config, Colores, Bases } = require("../src/resources");
const { InteractionType } = require("discord-api-types/v10");
const { jeffreygID, mantenimiento } = Config;

const ticketCooldown = ms("1m");

module.exports = async (client, interaction) => {
  if (!client.fetchedGuilds.find(x => x === interaction.guild.id)) {
    await client.guilds.fetch(interaction.guild.id);
    await interaction.guild.channels.fetch();
    await interaction.guild.roles.fetch();
    await interaction.guild.members.fetch();

    client.fetchedGuilds.push(interaction.guild.id)
    console.log("💚 %s fetched!", interaction.guild.name)
  }

  const author = interaction.user;
  const guild = interaction.guild;
  const customId = interaction.customId;

  const docGuild = await Guilds.findOne({ guild_id: guild.id }) ?? await new Guilds({ guild_id: guild.id }).save();

  const user = await Users.getOrCreate({ user_id: author.id, guild_id: guild.id });

  if (interaction.type === InteractionType.ApplicationCommand) { // SLASH COMMANDS
    const commandName = interaction.commandName;
    const slashCommand = client.slash.get(commandName);

    if (mantenimiento && author.id != jeffreygID) return interaction.reply({ content: "Todos las funciones de Jeffrey Bot se encuentran en mantenimiento, lo siento", ephemeral: true });

    let toggledQuery = await ToggledCommands.getToggle(commandName);

    if (toggledQuery /* && author.id != jeffreygID */) {
      let since = time(toggledQuery.since);
      return interaction.reply({ content: null, embeds: [new ErrorEmbed({ type: "toggledCommand", data: { commandName, since, reason: toggledQuery.reason } })], ephemeral: true });
    }

    // params
    const params = {};

    params["subcommand"] = interaction.options.getSubcommand(false); // guarda el subcomando que se está ejecutando
    params["subgroup"] = interaction.options.getSubcommandGroup(false); // guarda el grupo de subcomandos

    //console.log("Slash Command options:", slashCommand.data.options)

    //console.log("🟢 Params:", params)

    // empezar los params que sí serán usados
    const sub = params["subcommand"];
    const group = params["subgroup"];

    if (sub) params[sub] = {}
    if (group) {
      delete params[sub]
      params[group] = {}
    }

    const needFix = sub || group

    // opciones normales
    if (!needFix) {
      //console.log("🟢 Params ANTES de opciones normales:", params)
      for (const option of slashCommand.data.options) {
        //console.log(option)
        let { name } = option
        params[name] = interaction.options.get(name) // si no tiene opciones dentro (sería un subcommand)
      }

      //console.log("🟢 Params después de opciones normales:", params)
    } else { // opciones subcommands & groups
      let prop = sub; // donde se van a meter los params
      //console.log("🟢 Params ANTES de opciones subcommands:", params)

      // sacar el subcommand que se va a usar
      let using = slashCommand.data.options.find(x => x.name === sub);

      if (!using) { // está dentro de un subgroup
        let _group = slashCommand.data.options.find(x => x.name === group)
        using = _group.options.find(x => x.name === sub)

        prop = group // cambiar la prop donde se guardan los params
      }

      //console.log("Using:", using)
      for (const option of using.options) {
        //console.log("option:", option)
        params[prop][option.name] = interaction.options.get(option.name);
      }

      //console.log("🟢 Params DESPUES de opciones subcommands:", params)

    }

    for (const prop in params) {
      if (typeof params[prop] === 'undefined') params[prop] = {}
    }

    await intervalGlobalDatas(client);
    executeSlash(interaction, models, params, client)

    async function executeSlash(interaction, models, params, client) {
      console.log(`-------- /${commandName} • por ${interaction.user.id} • en ${interaction.guild.name} (${interaction.guild.id}) ----------`)
      try {
        if (slashCommand.category === Categories.DarkShop) {
          // filtro de nivel 5
          let validation = await ValidateDarkShop(user, interaction.user);
          if (!validation.valid) return interaction.reply({ embeds: [validation.embed] })
        }

        if(slashCommand.category === Categories.Developer){
          if(!Bases.devIds.find(x => x === interaction.user.id)) return interaction.reply({ephemeral: true, content: "No puedes usar este comando porque no eres desarrollador de Jeffrey Bot"})
        }
        await slashCommand.execute(interaction, models, params, client);
      } catch (error) {
        console.error(error);
        let help = new ErrorEmbed(interaction, { type: "badCommand", data: { commandName, error } });
        try {
          await interaction.reply({ content: null, embeds: [help], ephemeral: true });
        } catch (er) {
          await help.send();
        }
      }
    }
  } else if (interaction.type === InteractionType.MessageComponent) { // Componentes

    let message, ticket;

    if (customId.toUpperCase().includes("TICKET")) ticket = new Ticket(interaction, client);

    if (ticket) {
      return ticket.handle();
    }
    switch (customId) {
      case "deleteMessage":
        interaction.message.delete();
        break;

      case "acceptSuggestion": {
        if (!interaction.deferred) await interaction.deferReply({ ephemeral: true });

        let suggestion = docGuild.data.suggestions.find(x => x.message_id === interaction.message.id);

        suggestion.accepted = true;
        docGuild.save();

        message = interaction.message;
        let newembed = new Embed(message.embeds[0])
          .defFooter({ text: `Aceptada por ${interaction.user.tag}`, icon: interaction.client.EmojisObject.Check.url, timestamp: true })
        message.edit({ embeds: [newembed], components: [] });

        let r = interaction.guild.id === Config.testingServer ? interaction.guild.roles.cache.find(x => x.id === "983832210966732840") : interaction.guild.roles.cache.find(x => x.id === Config.suggestorRole);

        let acceptedEmbed = new Embed()
          .defAuthor({ text: "¡Se ha aceptado una sugerencia tuya!", icon: interaction.client.EmojisObject.Check.url })
          .setDescription(`**—** ¡Gracias por ayudarnos a mejorar!
**—** Se ha aceptado tu sugerencia:
\`\`\`
${suggestion.suggestion}
\`\`\`
**—** Nos tomamos la libertad de agregarte un role como forma de agradecimiento 😉`)
          .defColor(Colores.verde)
          .defFooter({ text: interaction.guild.name, icon: interaction.guild.iconURL(), timestamp: true });

        let suggestor = interaction.guild.members.cache.find(x => x.id === suggestion.user_id);

        try {
          suggestor.send({ embeds: [acceptedEmbed] });
        } catch (e) {
          interaction.followUp("No se pueden enviar mensajes a este usuario...")
        }

        await suggestor.roles.add(r);

        interaction.editReply({ content: "Se ha aceptado la sugerencia, se ha enviado un mensaje al usuario y se le ha dado el rol de colaborador." });

        break;
      }

      case "denySuggestion": {
        if (!interaction.deferred) await interaction.deferReply({ ephemeral: true });

        let suggestion = docGuild.data.suggestions.find(x => x.message_id === interaction.message.id);

        suggestion.accepted = false;
        docGuild.save();

        message = interaction.message;
        let newembed = new Embed(message.embeds[0])
          .defFooter({ text: `Denegada por ${interaction.user.tag}`, icon: interaction.client.EmojisObject.Error.url, timestamp: true })
          .defColor(Colores.rojo);

        message.edit({ embeds: [newembed], components: [] });

        let r = interaction.guild.id === Config.testingServer ? interaction.guild.roles.cache.find(x => x.id === "983832210966732840") : interaction.guild.roles.cache.find(x => x.id === Config.suggestorRole);

        let acceptedEmbed = new Embed()
          .defAuthor({ text: "¡Gracias por el interés!", icon: interaction.client.EmojisObject.Error.url })
          .defDesc(`**—** Hemos denegado tu sugerencia:
\`\`\`
${suggestion.suggestion}
\`\`\`
**—** ¡Gracias por ayudarnos a mejorar, siempre te tendremos en cuenta!`)
          .defColor(Colores.rojo)
          .defFooter({ text: interaction.guild.name, icon: interaction.guild.iconURL(), timestamp: true });

        let suggestor = interaction.guild.members.cache.find(x => x.id === suggestion.user_id);

        try {
          suggestor.send({ embeds: [acceptedEmbed] });
        } catch (e) {
          interaction.followUp("No se pueden enviar mensajes a este usuario...")
        }

        await suggestor.roles.add(r);

        interaction.editReply({ content: "Se ha denegado la sugerencia, se ha enviado un mensaje al usuario informándole." });
        break;
      }

      case "invalidateSuggestion": {
        if (!interaction.deferred) await interaction.deferReply({ ephemeral: true });

        let suggestion = docGuild.data.suggestions.find(x => x.message_id === interaction.message.id);

        suggestion.accepted = false;
        docGuild.save();

        message = interaction.message;
        let newembed = new Embed(message.embeds[0])
          .defFooter({ text: `Invalidada por ${interaction.user.tag}`, icon: interaction.client.EmojisObject.Error.url, timestamp: true })
          .defColor(Colores.rojo)

        message.edit({ embeds: [newembed], components: [] });

        let r = interaction.guild.id === Config.testingServer ? interaction.guild.roles.cache.find(x => x.id === "983832210966732840") : interaction.guild.roles.cache.find(x => x.id === Config.suggestorRole);

        let acceptedEmbed = new Embed()
          .defAuthor({ text: "¡Gracias por el interés!", icon: interaction.client.EmojisObject.Error.url })
          .defDesc(`**—** Hemos determinado que tu sugerencia es inválida:
\`\`\`
${suggestion.suggestion}
\`\`\`
**—** Puede que esta haya sido una sugerencia repetida, o una ya denegada anteriormente.
**—** ¡Gracias por ayudarnos a mejorar, siempre te tendremos en cuenta!`)
          .defColor(Colores.rojo)
          .defFooter({ text: interaction.guild.name, icon: interaction.guild.iconURL(), timestamp: true });

        let suggestor = interaction.guild.members.cache.find(x => x.id === suggestion.user_id);

        try {
          suggestor.send({ embeds: [acceptedEmbed] });
        } catch (e) {
          interaction.followUp("No se pueden enviar mensajes a este usuario...")
        }

        await suggestor.roles.add(r);

        interaction.editReply({ content: "Se ha denegado la sugerencia, se ha enviado un mensaje al usuario informándole." });
        break;
      }

      case "bjHelp": {
        let error = false;
        try {
          await interaction.deferReply({ ephemeral: true });
        } catch(err) {error = true}

        const Emojis = interaction.client.Emojis;

        let e = new Embed()
        .defAuthor({text: "¿Cómo se juega Blackjack?", title: true})
        .defColor(Colores.verdejeffrey)
        .defDesc(`**Objetivo**: Consigue vencer a Jeffrey Bot consiguiendo un valor a **21** o lo más cercano a él **SIN PASARTE**.`)
        .defField("Pedir y Plantarse", `**—** Pedir: Pides una carta a Jeffrey Bot\n**—** Plantarse: No puedes volver a pedir cartas. Es el turno de Jeffrey Bot para jugar.`)
        .defField("Doblar", `**—** Duplicas tu apuesta actual, pides una carta más y luego te plantas.`)
        .defField("Dividir", `**—** Sólo se puede usar cuando tus dos primeras cartas tienen el mismo número o letra: las separas en dos manos con la misma apuesta y se agrega una más a cada una.`)
        .defField("Rendirse", `**—** Sólo te puedes rendir si has jugado menos de 2 veces por partida. Pierdes **lo que se pueda** de la mitad de tu apuesta.`)
        .defField("Valores de las cartas", `**—** Los ases (${Emojis["1C"]}${Emojis["1H"]}${Emojis["1S"]}${Emojis["1D"]}) pueden valer **1** u **11** dependiendo si este hace que la mano se pase de **21**.
**—** Las cartas que tienen números tienen ese mismo valor.
**—** ${Emojis.JC}${Emojis.QC}${Emojis.KC} y demás valen **10**.`)
        .defField("El turno de Jeffrey Bot", `**—** Cuando sea el momento de jugar de Jeffrey Bot tomará una carta hasta que llegue a 17 o más.`)
        .defField("Resultados", `**—** Si las primeras cartas que te tocan dan como resultado **21** ganas automáticamente, sin excepciones.
**—** Si te pasas de **21** pierdes, sin excepciones.
**—** Si el valor de la mano de Jeffrey Bot es la misma que la tuya se termina el juego como empate y no pierdes nada de lo apostado.
**—** Si el valor de la mano de Jeffrey Bot es 21 o menor y mayor que la tuya, pierdes.`)
        .defFooter({text: "Gracias UnbelievaBoat#1046, te quiero mucho por favor no me denuncien."})

        return error ? interaction.followUp({embeds: [e], ephemeral: true}) : interaction.editReply({embeds: [e]})
      }

      default:
        console.log("No hay acciones para el botón con customId", customId);
    }
  }
}