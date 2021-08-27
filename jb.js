require("dotenv").config();
//jsons
const Config = require("./base.json");
const Colores = require("./resources/colores.json");
const Emojis = require("./resources/emojis.json");
const Responses = require("./resources/coinsresponses.json");
const Cumplidos = require("./resources/cumplidos.json");

const Discord = require("discord.js");

const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const { SlashCommandBuilder } = require('@discordjs/builders');

const anyBase = require("any-base");
const prettyms = require("pretty-ms");
const myIntents = new Discord.Intents()

myIntents.add(Discord.Intents.FLAGS.DIRECT_MESSAGES, Discord.Intents.FLAGS.DIRECT_MESSAGE_REACTIONS, Discord.Intents.FLAGS.DIRECT_MESSAGE_TYPING, Discord.Intents.FLAGS.GUILDS, Discord.Intents.FLAGS.GUILD_BANS, Discord.Intents.FLAGS.GUILD_EMOJIS_AND_STICKERS, Discord.Intents.FLAGS.GUILD_INTEGRATIONS, Discord.Intents.FLAGS.GUILD_INVITES, Discord.Intents.FLAGS.GUILD_MEMBERS, Discord.Intents.FLAGS.GUILD_MESSAGES, Discord.Intents.FLAGS.GUILD_MESSAGE_REACTIONS, Discord.Intents.FLAGS.GUILD_MESSAGE_TYPING, Discord.Intents.FLAGS.GUILD_PRESENCES, Discord.Intents.FLAGS.GUILD_VOICE_STATES, Discord.Intents.FLAGS.GUILD_WEBHOOKS); // QUE ASCO WN AYUDA
const client = new Discord.Client({ allowedMentions: { parse: ['users', 'roles'], repliedUser: true }, intents: [myIntents] });

const fs = require("fs");
const ms = require("ms");
var Chance = require("chance");
var chance = new Chance();
const CronJob = require('cron').CronJob;

const moment = require('moment-timezone');
moment().tz("America/Bogota").format();

const prefix = Config.prefix;
const jeffreygID = Config.jeffreygID;
const jgServer = Config.jgServer;
const logChannel = Config.logChannel;
const offtopicChannel = Config.offtopicChannel;
const mainChannel = Config.mainChannel;
const mainVip = Config.mainVip;
const botsChannel = Config.botsChannel;
const botsVip = Config.botsVip;
const staffComandos = Config.staffComandos;
const staffChat = Config.staffChat;

const commandsCooldown = new Set();
const jeffrosExpCooldown = new Set();
const repCool = new Set();

const coolded = new Map();
const active = new Map();

const boostedExp = new Set();
const boostedJeffros = new Set();
const boostedGeneral = new Set(); // exp + jeffros boosteados

let functions;

// mantenimiento
const disableEXPs = false; // deshabilitar ganar exp o jeffros
const disableAwards = false; // deshabilitar awards.
const disableInterestPerMonth = false; // deshabilitar el interés que se cobra los días 28 de cada mes.

// WEAS PARA EVENTOS:

let multiplier = Config.multiplier; // multiplicador de jeffros & exp

var easterImg = [
  "https://i.kym-cdn.com/entries/icons/facebook/000/015/559/It_Was_Me__Dio!.jpg"
];

// ############################

/* ##### MONGOOSE ######## */

const mongoose = require("mongoose");
mongoose.connect(`${process.env.MONGOCONNECT}`, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const Jeffros = require("./modelos/jeffros.js");
const Exp = require("./modelos/exp.js");
const AutoRole = require("./modelos/autorole.js");
const ToggleGroup = require("./modelos/toggleGroup.js");
const Toggle = require("./modelos/toggle.js");

const GlobalData = require("./modelos/globalData.js");
const Stats = require("./modelos/darkstats.js");

/* ##### MONGOOSE ######## */

client.comandos = new Discord.Collection();
fs.readdir("./comandos/", (err, files) => {
  if (err) console.log(err);
  let jsfile = files.filter(f => f.split(".").pop() === "js");
  if (jsfile.length <= 0) {
    console.log("No hay comandos.");
    return;
  }
  jsfile.forEach((f, i) => {
    let props = require(`./comandos/${f}`);
    client.comandos.set(props.help.name, props);
    client.comandos.set(props.help.alias, props);
  });
});

client.slash = new Discord.Collection();
const scommands = [];

const commandFiles = fs.readdirSync('./slashcommands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
	const command = require(`./slashcommands/${file}`);
	// set a new item in the Collection
	// with the key as the command name and the value as the exported module
	client.slash.set(command.data.name, command);
}

for (const file of commandFiles) {
	const command = require(`./slashcommands/${file}`);
  scommands.push(command.data.toJSON());
}


// SLASH COMMANDS
const rest = new REST({ version: '9'}).setToken(process.env.TOKEN);

(async () => {
  try {
    console.log("Actualizando los slash commands")

    await rest.put(
      Routes.applicationGuildCommands(process.env.slashClientId, process.env.slashGuildId),
      { body: scommands }
    );

    console.log("Se han actualizado los slash commands.")
  } catch (error){
    console.log(error);
  }
})();

client.on("interactionCreate", async interaction => {
  if(!interaction.isCommand()) return;

  const author = interaction.user;
  const slashCommand = client.slash.get(interaction.commandName);
  const commandName = interaction.commandName;

  Toggle.findOne({ // buscar si está toggleado
    command: commandName
  }, async (err, cmdDisabled) => {
    if(err) throw err;
    if(!cmdDisabled && slashCommand){ // si no encuentra un toggle y existe el archivo ejectuar
      await functions.intervalGlobalDatas();
      executeSlash(interaction, client)
    } else if(author.id === jeffreygID || author.id === "460913577105293313") { // si es jeffrey
      await functions.intervalGlobalDatas();
      executeSlash(interaction, client)
    } else { // si encuentra el comando toggleado return nomas
      return interaction.reply({content: "Este comando se encuentra deshabilitado, intenta de nuevo más tarde.", ephemeral: true});
    }
  })

  async function executeSlash(interaction, client){
    try {
      await slashCommand.execute(interaction, client);
    } catch (error) {
      console.error(error);
      await interaction.reply({ content: 'Jeffrey es tonto, hubo un error ejecutando este comando, por fa, avísale de su grado de inservibilidad. **(ni siquiera sé si esa palabra existe...)**', ephemeral: true });
    }
  }
  
})

// #### PENDING WELCOME SCREEN
client.on('guildMemberUpdate', async (oldMember, newMember) => {
    let guild = newMember.guild;
    let memberRole = guild.roles.cache.find(x => x.id === Config.memberRole);

    if(client.user.id === Config.testingJBID){
      memberRole = guild.roles.cache.find(x => x.id === "575094139100594186");
    }

    // Member passed membership screening
    if (oldMember.pending && !newMember.pending) {
        if (memberRole) {
            await newMember.roles.add(memberRole);
        }
    }
});

client.on("guildMemberRemove", member => {
  if(client.user.id === Config.testingJBID){
    return;
  }

  let channel = member.guild.channels.cache.find(x => x.id === mainChannel);
  let logC = member.guild.channels.cache.find(x => x.id === logChannel);
  let tag = member.user.tag;
  let despedidas = [
    `¡**${tag}** se ha ido a un lugar mejor...! A su casa.`,
    `**${tag}** se ha aburrido de tantos @everyones`,
    `Nos falta algo... ¿**${tag}**? ¿A dónde te has ido...?`,
    `Las rosas son rojas, las violetas azules, **${tag}** se ha llevado la pizza, que bueno que era de piña.`,
    `**${tag}** se ha llevado la pizza.`,
    `**${tag}** stay determined...!`,
    `¿**${tag}** es hater..?`,
    `**${tag}** no nos hagas un vídeo de 40 minutos...`,
    `A **${tag}** no le dieron Mod...`,
    `**${tag}** no seas malo`
  ];

  if (member.user.bot) return;

  const fBye = despedidas[Math.floor(Math.random() * despedidas.length)];
  let embed = new Discord.MessageEmbed()
    .setDescription(fBye)
    .setColor("#66a0ff");

  client.user.setActivity(`${prefix}ayuda - ${member.guild.memberCount} usuarios🔎`);
  return channel.send({embeds: [embed]}).then(msg => {
    msg.react(member.guild.emojis.cache.get("524673704655847427"));
  });
});

client.on("guildMemberAdd", member => {
  
  let tag = member.user.tag;
  let guild = member.guild;
  let channel = guild.channels.cache.find(x => x.id === Config.mainChannel);
  let reglasC = guild.channels.cache.find(x => x.id === Config.rulesChannel);
  let infoC = guild.channels.cache.find(x => x.id === Config.infoChannel);
  let botRole = guild.roles.cache.find(x => x.id === Config.botRole);

  if(client.user.id === Config.testingJBID){
    channel = guild.channels.cache.find(x => x.id === "535500338015502357");
    reglasC = guild.channels.cache.find(x => x.id === "482993020472393741");
    infoC = guild.channels.cache.find(x => x.id === "483007894942515202");
    botRole = guild.roles.cache.find(x => x.id === "794646554690322432");
  }

  if (member.user.bot) {
    return member.roles.add(botRole);
  }

  let bienvenidas = [
    `Bienvenid@ a \`${guild.name}\`, **${tag}**. Pásate por ${reglasC} e ${infoC} para aclarar las dudas frecuentes! ¡Disfruta!`,
    `¡Hola, **${tag}**! Muchas gracias por unirte a \`${guild.name}\`, ve a los canales: ${reglasC} e ${infoC} para evitar inconvenientes, y ¡pásala bien!`,
    `¡Eyyy, **${tag}**! Bienvenid@ a \`${guild.name}\` 🎉 ¡Echa un vistazo a ${reglasC} e ${infoC} para que te guíes dentro del server! :D`,
    `¡Hey! Hola **${tag}**, gracias por unirte a \`${guild.name}\` 😄 ¡Pásate por ${reglasC} e ${infoC} para que te hagas una idea de como funciona el server!`
  ];

  let fBienv = bienvenidas[Math.floor(Math.random() * bienvenidas.length)];

  if (member.user.id === "373901344995803138") {
    // si el usuario es ares
    fBienv = `hola, **${tag}**. bienvenido, otra vez.`;
  }

  let embed = new Discord.MessageEmbed()
    .setDescription(fBienv)
    .setFooter(`* Para poder hablar en el chat debes aceptar las reglas`, guild.iconURL())
    .setColor(Colores.verde);

  member.send({embeds: [embed]}).catch(e => {
    channel.send({embeds: [embed]});
  });

  client.user.setActivity(`${prefix}ayuda - ${member.guild.memberCount} usuarios🔎`);
});

client.on("ready", async () => {
  // para cada guild fetchear(?
  let guilds = await client.guilds.fetch();
  let guild = client.guilds.cache.find(x => x.id === Config.jgServer);
  //console.log(guilds);

  let totalMembers = 0;
  for(const key of guilds.keys()){
    let actualGuild = client.guilds.cache.find(x => x.id === key);
    actualGuild.members.fetch();

    totalMembers += actualGuild.memberCount;
  }

  client.user.setActivity(`${prefix}ayuda - ${totalMembers} usuarios🔎`);

  
  console.log(`${client.user.username} ONLINE`);

  let channel = client.channels.cache.get(logChannel);
  let dsChannel = client.channels.cache.find(x => x.id === Config.dsChannel);
  let dsNews;

  if(client.user.id === Config.testingJBID){
    channel = client.channels.cache.get("483108734604804107");
    guild = client.guilds.cache.find(x => x.id === "482989052136652800");
    dsNews = guild.roles.cache.find(x => x.id === "790431614378704906");
    dsChannel = client.channels.cache.find(x => x.id === "790431676970041356");
  } else {
    dsNews = guild.roles.cache.find(x => x.id === Config.dsnews);
  }

  channel.send("Reviví.");

  /* Buscar usuarios nivel 5 sin role nivel 5 */
  await functions.findLvls5(guild)

  /* ############ GLOBAL DATAS ############ */
  console.log("Ciclo de Global Datas iniciado por primera vez")
  functions.intervalGlobalDatas();

  setInterval(function(){
    functions.intervalGlobalDatas();
  }, ms("1m"));

  // ################################################# PAGAR INTERESES LOS FINES DE MES
  // buscar gente con más de 20k
  let interestJob = new CronJob('0 12 28 * *', async function() { // los 28 de cada mes al medio día
    if(disableInterestPerMonth) return console.log("No se ha iniciado el CronJob, están deshabilitados los intereses por mes.");
    console.log('CronJob iniciado.');


    let jeffrosq = await Jeffros.find({
      serverID: guild.id
    });

    let globalq = await GlobalData.findOne({
      "info.type": "dsInflation"
    });

    const inflation = globalq.info.inflation;

    let res = []; // array para los usuarios con jeffros & dj si es que tienen
    for (let i = 0; i < jeffrosq.length; i++) {
      const member = guild.members.cache.get(jeffrosq[i].userID) || null;
      
      // agregar la cantidad de darkjeffros
      if(member){

        let djeffrosq = await Stats.findOne({
          userID: jeffrosq[i].userID
        });

        let darkjeffros = djeffrosq ? Number(djeffrosq.djeffros) : 0;
        let darkjeffrosValue = djeffrosq ? Number(inflation*200*djeffrosq.djeffros) : 0;
        let finalQuantity = darkjeffrosValue != 0 ? (darkjeffrosValue) + jeffrosq[i].jeffros: jeffrosq[i].jeffros;

        let toPush = { userID: member.user.id, darkjeffros: darkjeffros, darkjeffrosValue: darkjeffrosValue, total: finalQuantity }

        res.push(toPush)
      }
    }

    res.sort(function(a, b){ // ordenar el array mayor a menor, por array.total
      if(a.total > b.total){
        return -1;
      }
      if(a.total < b.total){
        return 1;
      }

      return 0;
    })

    res = res.filter(user => user.total >= 20000); // sacar de todos los resultados los que sean mayores a 20k

    console.log(res);

    let finalinterest;

    for (let i = 0; i < res.length; i++) {
      const quser = res[i];
      
      let member = guild.members.cache.get(quser.userID) || null;

      if(member){ // si el usuario está en el servidor, cobrar interés.
        let jeffros = quser.total;

        // definir el interés a pagar

        if(jeffros >= 90000){ // que el interés sea del 15%
          finalinterest = 0.15;
        } else if(jeffros >= 40000) { // que el interés sea del 10%
          finalinterest = 0.10;
        } else if(jeffros >= 25000) { // que el interés sea del 5%
          finalinterest = 0.05;
        } else if(jeffros >= 20000) { // que el interés sea del 1%
          finalinterest = 0.01;
        }

        let toReduce = Math.floor(jeffros*finalinterest);
        
        console.log("(J)"+jeffros, "de", member.user.tag, "pasa a:", jeffros - toReduce, "por el interés seleccionado:", finalinterest*100+"%");

        // eliminar los jeffros

        let newquery = await Jeffros.findOne({
          userID: quser.userID,
          serverID: guild.id
        });

        newquery.jeffros -= toReduce;
        await newquery.save();

        let log = new Discord.MessageEmbed()
        .setAuthor(`| Interés`, member.user.displayAvatarURL())
        .setDescription(`**—** Tenía: **${Emojis.Jeffros}${jeffros}**.
**—** Ahora tiene en Jeffros: **${Emojis.Jeffros}${newquery.jeffros}**.
**—** Y en total: **${Emojis.Jeffros}${quser.total-toReduce}**.
**—** Pagó: **${Emojis.Jeffros}${toReduce} (${finalinterest*100}%)**.`)
        .setColor(Colores.verde);

        let userLog = new Discord.MessageEmbed()
        .setAuthor(`| Interés`, member.user.displayAvatarURL())
        .setDescription(`**—** Tenías: **${Emojis.Jeffros}${jeffros}**.
**—** Ahora tienes en Jeffros: **${Emojis.Jeffros}${newquery.jeffros}**.
**—** Y en total: **${Emojis.Jeffros}${quser.total-toReduce}**.
**—** Pagaste: **${Emojis.Jeffros}${toReduce} (${finalinterest*100}%)**.`)
        .setColor(Colores.verde);

        channel.send({embeds: [log]}); // logchannel predefinido arriba

        // quitar los comentarios de esto tambien #########################################################
        try {
          member.send({embeds: [userLog]})
        } catch {
          // error al enviar mensaje al usuario
          channel.send("No se pudo enviar el mensaje al usuario.")
        }
      }
    }
  }, null, true, 'America/Bogota');

  interestJob.start(); // iniciar cron job de interés
});

client.on("messageDelete", async(message) => {
  let author = message.author;

  if (jeffrosExpCooldown.has(author.id)) {
    let q = await GlobalData.findOne({
      "info.type": "lastExpJeffros",
      "info.userID": author.id
    });

    if(!q) return;
    if(message.channel.id != Config.mainChannel) return;

    let j = await Jeffros.findOne({
      serverID: message.guild.id,
      userID: author.id
    });

    let e = await Exp.findOne({
      serverID: message.guild.id,
      userID: message.author.id
    });

    let nxtLvl = 10 * ((e.level-1) ** 2) + 50 * (e.level-1) + 100; // fórmula de MEE6.

    j.jeffros -= q.info.jeffros;
    

    if (e.exp - q.info.exp >= nxtLvl) console.log("Subió de nivel");
    else {
      e.exp -= q.info.exp;
    }


    await j.save();
    await e.save();

    console.log(j.jeffros, e.exp, author.username);
  }
})

//main
client.on("messageCreate", async message => {
  let messageArray = message.content.split(" ");
  let cmd = messageArray[0].toLowerCase();
  let args = messageArray.slice(1);
  let guild = message.guild;
  let author = message.author;

  const cmdCooldown = 5;
  let jexpCooldown = 60;
  const repCooldown = 86400;

  // Captcha.
  if (message.author.bot) return;
  if (message.channel.type == "DM") return;

  await functions.loadBoosts(); // verificar si existen BOOSTS.

  // joder
  let ahora = moment().tz("America/Bogota");
  let hour = ahora.hour();

  if(hour >= 22 || hour < 7){
    console.log("ESTAMOS EN EL BUCLE", ahora.hour());

    // revisar si tiene attachments
    let attachments = []
    let embbeded = true;
    for(const value of message.attachments.values()){
      embbeded = false;
      attachments.push(value.proxyURL)
    }

    if(attachments.length > 0 || message.content.includes("https://cdn.discordapp.com/attachments/") || message.content.includes("https://media.discordapp.net/attachments/") || (message.embeds[0] && message.embeds[0].url.includes("https://tenor.com/view/"))){
      let m = message.guild.members.cache.find(x => x.id === author.id);

      if(!m.roles.cache.find(x => x.id === Config.staffRole)){ // no es staff
        let secretChannelWhatWHAT = guild.id === "447797737216278528" ? guild.channels.cache.find(x => x.id === "821929080709578792") : guild.channels.cache.find(x => x.id === "537095712102416384");

        if(!embbeded){
          await secretChannelWhatWHAT.send({content: `Enviado por **${m.user.tag}** a las __${moment(ahora).format('HH[:]mm')}__ en ${message.channel}.`, files: attachments});
        } else {
          let content = message.embeds[0] ? message.embeds[0].url : message.content;
          await secretChannelWhatWHAT.send({content: `Enviado por **${m.user.tag}** a las __${moment(ahora).format('HH[:]mm')}__ en ${message.channel}.\n\n${content}`});
        }
        return message.delete();
      }
    }
  }

  if (message.content.startsWith(prefix)) {
    // Si el mensaje empieza por el prefijo, entonces...
    let jeffreyRole = guild.roles.cache.find(x => x.id === Config.jeffreyRole);
    let adminRole = guild.roles.cache.find(x => x.id === Config.adminRole);
    let modRole = guild.roles.cache.find(x => x.id === Config.modRole);
    let staffRole = guild.roles.cache.find(x => x.id === Config.staffRole);

    if(client.user.id === Config.testingJBID){
      jeffreyRole = guild.roles.cache.find(x => x.id === "482992290550382592");
      adminRole = guild.roles.cache.find(x => x.id === "483105079285776384");
      modRole = guild.roles.cache.find(x => x.id === "483105108607893533");
      staffRole = guild.roles.cache.find(x => x.id === "535203102534402063");
    }
    
    // COOLDOWN COMANDOS

    if (!message.content.startsWith(prefix)) return;

    let commandsEnabled = [
      botsChannel,
      staffComandos,
      botsVip
    ];

    if (!commandsEnabled.find(x => x === message.channel.id) && !(message.author.id === jeffreygID || message.author.id === "460913577105293313") && !message.member.roles.cache.find(x => x.id === staffRole.id)) return;
    

    // /rep @usuario
    if (message.content.toLowerCase().startsWith(`${prefix}rep`)) {
      // if(author.id != jeffreygID) return message.reply(`Este comando está en mantenimiento! Pronto estará disponible. Disculpa los inconvenientes.`);
      let jeffreyRole = guild.roles.cache.find(
        x => x.id === Config.jeffreyRole
      );
      let adminRole = guild.roles.cache.find(x => x.id === Config.adminRole);
      let modRole = guild.roles.cache.find(x => x.id === Config.modRole);
      let staffRole = guild.roles.cache.find(x => x.id === Config.staffRole);
      let uPrest = message.mentions.users.first() ? guild.members.cache.get(message.mentions.users.first().id) : guild.members.cache.get(args[0]);
      let logC = guild.channels.cache.find(x => x.id === logChannel);

      let embed = new Discord.MessageEmbed()
        .setTitle(`Ayuda: ${prefix}rep`)
        .setColor(Colores.nocolor)
        .setDescription(
          `▸ El uso correcto es: ${prefix}rep <@usuario>\n▸ Le das un punto de reputación a un usuario.`
        )
        .setFooter(`<> Obligatorio () Opcional`);

      if (!uPrest) return message.channel.send({embeds: [embed]});

      Exp.findOne(
        {
          serverID: guild.id,
          userID: uPrest.user.id
        },
        (err, pres) => {
          if (err) throw err;

          if (!pres) {
            return message.reply(
              `No pude encontrar a este usuario. O simplemente no ha hablado.`
            );
          } else {
            let corEmbed = new Discord.MessageEmbed()
              .setAuthor(`| Rep`, `${uPrest.user.displayAvatarURL()}`)
              .setDescription(
                `**—** Usuario: **${uPrest}**.
**—** Por: **${message.author.username}**.
**—** En: **${message.channel}**.
**—** Reputación actual: **${pres.reputacion + 1}**.`
              )
              .setColor(Colores.verde);

            if (uPrest.user.id === author.id) {
              return message.reply(
                `No puedes darte un punto de reputación a ti mismo.`
              );
            } else {
              if (repCool.has(message.author.id))
                return message.reply(
                  `Sólo puedes usar este comando cada 24 horas.`
                );

              pres.reputacion = pres.reputacion + 1;
              pres.save().catch(err => console.log(err));

              repCool.add(message.author.id);

              setTimeout(() => {
                repCool.delete(message.author.id);
              }, repCooldown * 1000);

              message
                .reply(
                  `¡Le has dado un punto de reputación a ${uPrest.user.tag}, deben de ser buenos! ^^`
                )
                .then(r => {
                  logC.send({embeds: [corEmbed]});
                });
            }
          }
        }
      );
    }

    let easter = chance.bool({ likelihood: 0.000001 });
    var randomCumplidos = Cumplidos.c[Math.floor(Math.random() * Cumplidos.c.length)];

    /* if (easter === true) { // BUSCAR IMGS QUE SI SIRVAN NMMS XD
      // (me cago en mi vida)
      randomCumplidos = `esta foto sale una vez en un millón (sin exagerar), momento istorco. ${
        easterImg[Math.floor(Math.random() * easterImg.length)]
      }`;
    } */

    setTimeout(() => {
      commandsCooldown.delete(author.id);
    }, cmdCooldown * 1000);

    // handler
    let commandFile = client.comandos.get(cmd.slice(prefix.length));

    Toggle.findOne({
      command: cmd.slice(prefix.length)
    }, async (err, cmdDisabled) => {
      if(err) throw err;
      if(!cmdDisabled && commandFile){ // si no encuentra un toggle busca el alias
        Toggle.findOne({
          alias: cmd.slice(prefix.length)
        }, async (err, aliasDisabled) => {
          if(err) throw err;

          if(!aliasDisabled && commandFile){ // si no encuentra tampoco el alias entonces correr comando
            await functions.intervalGlobalDatas();
            if (commandFile) {
              if (commandsCooldown.has(author.id)) { // revisar si tiene cooldown
                message.delete();
                return message.channel.send(`${author}, Relájate un poco con los comandos, ${randomCumplidos}.`);
              }

              await commandFile.run(client, message, args, active);

              // agregar el cooldown      
              if (!message.member.roles.cache.find(x => x.id === staffRole.id)) {
                commandsCooldown.add(author.id);
              }
            }
          } else if(!commandFile){ // si no existe el comando, return
            return;
          } else if(author.id === jeffreygID || author.id === "460913577105293313") { // si es jeffrey
            await functions.intervalGlobalDatas();
            if (commandFile) commandFile.run(client, message, args, active);
          } else { // si encuentra el comando toggleado return nomas
            return message.reply("este comando está deshabilitado.");
          }
        })
      } else if(!commandFile){ // si no existe el comando, return
        return;
      } else if(author.id === jeffreygID || author.id === "460913577105293313") { // si es jeffrey
        await functions.intervalGlobalDatas();
        if (commandFile) commandFile.run(client, message, args, active);
      } else { // si encuentra el comando toggleado return nomas
        return message.reply("este comando está deshabilitado.");
      }
    })
  } else {
    let main = guild.channels.cache.find(x => x.id === mainChannel);
    let vipmain = guild.channels.cache.find(x => x.id === mainVip);

    if (message.member.roles.cache.find(x => x.id === Config.lvl40)){
      jexpCooldown = jexpCooldown / 2;
    }

    let lessThan3 = false;
    let moreThan6 = false;

    if(messageArray.length < 3) lessThan3 = true;

    if(messageArray.length > 6) moreThan6 = true;

    let lastAuthor = false;

    if(message.channel === main || message.channel === vipmain){ // revisar si el ultimo usuario en hablar fue el mismo usuario
      let c = main || vipmain;
      let last = await c.messages.fetch({ limit: 2 });

      if(last.every(msg => msg.author.id === message.author.id)) lastAuthor = true;
    }

    // ################################# JEFFROS ################################
    
    if(author.id == jeffreygID || disableEXPs === false){
    
    let benefitMultiplier = 1; // si es uno no pasaría nada
    // VIP 200%
    if (message.member.roles.cache.find(x => x.id === "529275759521431553")) {
      benefitMultiplier += 1; // 2
    }

    // NIVEL 10 15% MÁS

    if (message.member.roles.cache.find(x => x.id === Config.lvl10)) {
      benefitMultiplier += 0.15; // 2.15
    }

    // NIVEL 50 50% MÁS

    if (message.member.roles.cache.find(x => x.id === Config.lvl50)) {
      benefitMultiplier += 0.5; // 2.65
    }

    let jeffrosToAdd;
    if(lessThan3){
      jeffrosToAdd = Math.ceil(Math.random() * (2 * benefitMultiplier));
    } else if(moreThan6){
      jeffrosToAdd = Math.ceil(Math.random() * (15 * benefitMultiplier));
    } else {
      jeffrosToAdd = Math.ceil(Math.random() * (5 * benefitMultiplier));
    }

    if (multiplier != 1) {
      jeffrosToAdd = jeffrosToAdd * multiplier;
    }

    // buscar la globaldata
    let query = await GlobalData.find({
      "info.type": "roleDuration",
      "info.userID": author.id,
      "info.special.type": "boostMultiplier"
    }, (err, boosts) => {
      if(err) throw err;
    });

    for (let i = 0; i < query.length; i++) {
      const q = query[i];
      
      let specialData = q.info.special;

      if(specialData.specialObjective === "jeffros" || specialData.specialObjective === "all"){ // si el boost de de jeffros
        jeffrosToAdd = jeffrosToAdd * Number(specialData.specialValue);
        console.log(author.tag, "Boost de JEFFROS.")
      }
    }

    Jeffros.findOne(
      {
        userID: author.id,
        serverID: message.guild.id
      },
      async (err, jeffros) => {
        if (err) console.log(err);

        if (jeffrosExpCooldown.has(author.id)) {
          return;
        }

        if (message.channel.id != mainChannel && message.channel.id != mainVip)
          return;
        console.log(jeffrosToAdd + " Jeffros");

        if (!jeffros) {
          // Si el usuario no tiene Jeffros
          const newJeffros = new Jeffros({
            userID: author.id,
            serverID: message.guild.id,
            jeffros: jeffrosToAdd
          });

          newJeffros.save().catch(err => console.log(err));
        } else { // Si el usuario ya tiene Jeffros
          // Verificar si el ultimo mensaje fue del mismo usuario cancelar
          if(!lastAuthor){
            jeffros.jeffros = jeffros.jeffros + jeffrosToAdd;
            jeffros.save().catch(err => console.log(err));
          } else {
            console.log(`${author.tag} fue el ultimo en hablar, no se da recompensas de JEFFROS. ${message.url}`)
          }
        }

        // ################################# E X P ################################

        let expToAdd;
        if(lessThan3){
          expToAdd = Math.ceil(Math.random() * (3 * benefitMultiplier));
        } else if(moreThan6){
          expToAdd = Math.ceil(Math.random() * (35 * benefitMultiplier));
        } else {
          expToAdd = Math.ceil(Math.random() * (15 * benefitMultiplier));
        }

        if (multiplier != 1) {
          expToAdd = expToAdd * multiplier;
        }

        // buscar la globaldata
        let query2 = await GlobalData.find({
          "info.type": "roleDuration",
          "info.userID": author.id,
          "info.special.type": "boostMultiplier"
        }, (err, boosts) => {
          if(err) throw err;
        });

        for (let i = 0; i < query2.length; i++) {
          const q = query2[i];
          
          let specialData = q.info.special;

          if(specialData.specialObjective === "exp" || specialData.specialObjective === "all"){ // si el boost es de exp  
            expToAdd = expToAdd * Number(specialData.specialValue);
            console.log(author.tag, "Boost de EXP.")
          }
        }

        Exp.findOne(
          {
            userID: author.id,
            serverID: message.guild.id
          },
          async (err, uExp) => {
            if (err) throw err;

            if (jeffrosExpCooldown.has(author.id))
              return;

            if (message.channel.id != mainChannel && message.channel.id != mainVip)
              return;
            console.log(expToAdd + " experiencia");

            if (!uExp) {
              // Si el usuario no tiene Experiencia

              Exp.countDocuments({}, function(err, count) {
                const newExp = new Exp({
                  userID: author.id,
                  username: author.username,
                  serverID: guild.id,
                  exp: expToAdd,
                  level: 0,
                  reputacion: 1
                });

                newExp.save().catch(err => console.log(err));
              });
            } else {
              // Si el usuario ya tiene Experiencia

              // Verificar si el ultimo mensaje fue del mismo usuario cancelar
              if(!lastAuthor){

                let curLvl = uExp.level;
                let nxtLvl = 10 * (uExp.level ** 2) + 50 * uExp.level + 100; // fórmula de MEE6.
                let curExp = uExp.exp;

                uExp.exp = uExp.exp + expToAdd;

                if (uExp.exp >= nxtLvl) {
                  uExp.level = uExp.level + 1;

                  console.log(`${author.username} sube de nivel! (${curLvl + 1})`);

                  if (uExp.level === 1) {
                    message.channel.send(`**${author} empieza a mostrarse, ¿será el inicio de algo grande?.\n— ¡SUBE A NIVEL 1!**`)
                    message.member.roles.add(Config.lvl1);
                  } else if (uExp.level === 10) {
                    message.channel.send(`**${author} no piensa rendirse.\n— ¡SUBE A NIVEL 10!**`)
                    message.member.roles.add(Config.lvl10);
                  } else if (uExp.level === 20) {
                    message.channel.send(`**${author} ¿estás determinado?.\n— ¡SUBE A NIVEL 20!**`)
                    message.member.roles.add(Config.lvl20);
                  } else if (uExp.level === 30) {
                    message.channel.send(`**${author} parece no detenerse.\n— ¡SUBE A NIVEL 30!**`)
                    message.member.roles.add(Config.lvl30);

                    // BONO DE 2000 POR LLEGAR AL LVL 30
                    Jeffros.findOne(
                      {
                        serverID: guild.id,
                        userID: author.id
                      },
                      (err, j) => {
                        j.jeffros = j.jeffros + 2000;

                        j.save();
                      }
                    );
                  } else if (uExp.level === 40) {
                    message.channel.send(`**${author} casi logra llegar al punto medio.\n— ¡SUBE A NIVEL 40!**`)
                    message.member.roles.add(Config.lvl40);
                  } else if (uExp.level === 50) {
                    message.channel.send(`**${author} literalmente está... ¿determinadx?...\n— ¡SUBE A NIVEL 50!**`)
                    message.member.roles.add(Config.lvl50);
                  } else if (uExp.level === 60) {
                    message.channel.send(`**${author} no se rinde.\n— ¡SUBE A NIVEL 60!**`)
                    message.member.roles.add(Config.lvl60);
                  } else if (uExp.level === 70) {
                    message.channel.send(`**${author} no va a parar.\n— ¡SUBE A NIVEL 70!**`)
                    message.member.roles.add(Config.lvl70);
                  } else if (uExp.level === 80) {
                    message.channel.send(`**${author} no para de sorprendernos.\n— ¡SUBE A NIVEL 80!**`)
                    message.member.roles.add(Config.lvl80);
                  } else if (uExp.level === 90) {
                    message.channel.send(`**${author} está en la recta final.\n— ¡SUBE A NIVEL 90!**`)
                    message.member.roles.add(Config.lvl90);
                  } else if (uExp.level === 99) {
                    message.channel.send(`**${author} está a punto de logralo.\n— ¡SUBE A NIVEL 99!**`)
                    message.member.roles.add(Config.lvl99);
                    message.member.roles.add(Config.vipRole);
                  } else if (uExp.level === 100) {
                    message.channel.send(`**${author} está determinadx.\n— ¡SUBE A NIVEL 100!**`)
                    message.member.roles.add(Config.lvl100);
                  } else if (uExp.level === 200) {
                    message.channel.send(`**${author} literal mente vive AQUÍ.\n— ¡SUBE A NIVEL 200!**`)
                  }
                }

                uExp.save().catch(err => console.log(err));

              jeffrosExpCooldown.add(author.id);

              let gdQuery = await GlobalData.findOne({
                "info.type": "lastExpJeffros",
                "info.userID": author.id
              });

              if(!gdQuery){
                const newLEJ = GlobalData({
                  info: {
                    type: "lastExpJeffros",
                    userID: author.id,
                    exp: expToAdd,
                    jeffros: jeffrosToAdd
                  }
                });

                await newLEJ.save();
              } else {
                gdQuery.info.exp = expToAdd;
                gdQuery.info.jeffros = jeffrosToAdd;

                await gdQuery.save()
              }

              setTimeout(() => {
                console.log(author.id + " ya puede ganar exp y jeffros")
                jeffrosExpCooldown.delete(author.id);
              }, jexpCooldown * 1000);
            } else {
              console.log(`${author.tag} fue el ultimo en hablar, no se da recompensas de EXP. ${message.url}`)
            }
          }
          });
      }
    );
    } else {
      return console.log("EXP y JEFFROS están deshabilitados, no es Jeffrey, no se han dado ni EXP ni JEFFROS.");
    }
  }
});

//Relleno y anti-antisistemas
/* ########### AUTOROLE ###################### */

const events = {
  MESSAGE_REACTION_ADD: "messageReactionAdd",
  MESSAGE_REACTION_REMOVE: "messageReactionRemove"
};

client.on("raw", async event => {
  if (!events.hasOwnProperty(event.t)) return;

  const { d: data } = event;
  const user = client.users.cache.get(data.user_id);
  const channel =
    client.channels.cache.get(data.channel_id) || (await user.createDM());

  if (channel.messages.cache.has(data.message_id)) return;

  const message = await channel.messages.fetch(data.message_id);
  const emojiKey = data.emoji.id
    ? `${data.emoji.name}:${data.emoji.id}`
    : data.emoji.name;
  let reaction = message.reactions.cache.get(emojiKey);

  if (!reaction) {
    reaction = message.reactions.cache.get(data.emoji.id);
  }

  client.emit(events[event.t], reaction, user);
});

client.on("messageReactionAdd", async (reaction, user) => {
  if (user.bot) return; // Si es un bot

  let guild = reaction.message.guild;
  let channel = reaction.message.channel;
  let message = reaction.message;
  let member = guild.members.cache.get(user.id);
  let role;

  AutoRole.findOne(
    {
      serverID: guild.id,
      channelID: channel.id,
      messageID: message.id,
      emoji: reaction.emoji.id || reaction.emoji.name
    },
    async (err, msg) => {
      if (err) throw err;

      if (!msg) {
        return;
      } else {
        let isCorrect = (msg.custom === 1 && reaction.emoji.id === msg.emoji) || (msg.custom === 0 && reaction.emoji.name === msg.emoji) ? true : false;

        if(isCorrect){
          if(msg.toggleGroup != 0){ // es toggleable D:
            let sameGroup = await AutoRole.find(
              {
                toggleGroup: msg.toggleGroup
              }
            );
            let roleToAdd = guild.roles.cache.find(x => x.id === msg.roleID);
            
            if(sameGroup.length > 1){
                // hay varios toggles.
                // revisar si ha reaccionado con algún otro autorole con ese toggle.
  
                oldReaction:
                for (let k = 0; k < sameGroup.length; k++) {
                    const toggledAutorole = sameGroup[k];
  
                    let shouldNotHave = guild.roles.cache.find(x => x.id === toggledAutorole.roleID);
                    let oldReaction = toggledAutorole.emoji;
  
                    if(member.roles.cache.find(x => x.id === shouldNotHave.id)) {
                        await member.roles.remove(shouldNotHave); // eliminar el role
                        let oldC = guild.channels.cache.find(x => x.id === toggledAutorole.channelID);
                        let oldM = await oldC.messages.fetch(toggledAutorole.messageID);
  
                        let reactions = toggledAutorole.custom === 1 ? await oldM.reactions.cache.find(x => x.emoji.id === oldReaction) : await oldM.reactions.cache.find(x => x.emoji.name === oldReaction);
                        await reactions.users.remove(user.id);
  
                        break oldReaction;
                    }
                }
  
                await member.roles.add(roleToAdd);
            } else {
                await member.roles.add(roleToAdd);
            }
          } else {
              let role = guild.roles.cache.find(x => x.id === msg.roleID);
              await member.roles.add(role);
          }
        }
        /* if (msg.custom === 1) {
          if (reaction.emoji.id === msg.emoji) {
            role = guild.roles.cache.find(x => x.id === msg.roleID);
            member.roles.add(role);
          } else {
            return;
          }
        } else {
          if (reaction.emoji.name === msg.emoji) {
            role = guild.roles.cache.find(x => x.id === msg.roleID);
            member.roles.add(role);
          } else {
            return;
          }
        } */
      }
    }
  );
});

client.on("messageReactionRemove", (reaction, user) => {
  if (user.bot) return; // Si es un bot
  if(!reaction) return; // wtf?

  let guild = reaction.message.guild;
  let channel = reaction.message.channel;
  let message = reaction.message;
  let member = guild.members.cache.get(user.id);
  let role;

  AutoRole.findOne(
    {
      serverID: guild.id,
      channelID: channel.id,
      messageID: message.id,
      emoji: reaction.emoji.id || reaction.emoji.name
    },
    (err, msg) => {
      if (err) throw err;

      if (!msg) {
        return;
      } else {
        if (msg.custom === 1) {
          if (reaction.emoji.id === msg.emoji) {
            role = guild.roles.cache.find(x => x.id === msg.roleID);
            member.roles.remove(role);
          } else {
            return;
          }
        } else {
          if (reaction.emoji.name === msg.emoji) {
            role = guild.roles.cache.find(x => x.id === msg.roleID);
            member.roles.remove(role);
          } else {
            return;
          }
        }
      }
    }
  );
});

// ####################### AWARDS

client.on("messageReactionAdd", (reaction, user) => {
  if (user.bot) return; // Si es un bot

  let guild = reaction.message.guild;
  let channel = reaction.message.channel;
  let message = reaction.message;
  let member = guild.members.cache.get(user.id);
  let role;

  let silver = Config.silverAward;
  let gold = Config.goldAward;
  let platinium = Config.platiniumAward;
  let hallChannel = guild.channels.cache.find(x => x.id === Config.hallChannel);

  let bots = guild.channels.cache.find(x => x.id === Config.botsChannel);

  let award;
  let price;
  let gift;
  let contenido;
  let embed = new Discord.MessageEmbed();

  if (message.attachments.size !== 0) {
    // Attachments are present.
    const firstAttachment = message.attachments.first();

    embed.setAuthor(message.author.tag, message.author.displayAvatarURL());
    embed.setImage(firstAttachment.url);
    embed.setDescription(`[★](${message.url}) ${message.content}`);
  } else if (message.embeds.length != 0) {
    let firstEmbed = message.embeds[0];
    let msgEmbed;
    if(!firstEmbed.video && firstEmbed.url){ // es una imagen
      embed.setImage(firstEmbed.url)
      msgEmbed = firstEmbed.url;
    } else if(firstEmbed.video && !firstEmbed.thumbnail){ // es un link, que general un video reproducible
      msgEmbed = firstEmbed.url +"\n(vídeo)";
    } else if(firstEmbed.video && firstEmbed.thumbnail){ // es un gif
      embed.setImage(firstEmbed.thumbnail.url)
      msgEmbed = firstEmbed.url;
    } else { // cualquier otra cosa
    let incaseofField = ""
    firstEmbed.fields.forEach(function(field){
      incaseofField += `\n${field.name} ${field.value}`
    })
      msgEmbed = firstEmbed.description ? firstEmbed.description : incaseofField;
    }

    embed.setAuthor(message.author.tag, message.author.displayAvatarURL());
    embed.setDescription(`[★](${message.url}) ${msgEmbed}`);
  } else {
    embed.setAuthor(message.author.tag, message.author.displayAvatarURL());
    embed.setDescription(`[★](${message.url}) ${message.content}`);
  }

  let paid = new Discord.MessageEmbed()
    .setDescription("Pagado.")
    .setColor(Colores.nocolor);

  switch (reaction.emoji.id) {
    case silver: // ################### PLATA ###########################
      award = "plata";
      price = 100;
      embed.setColor("#8f8f8f");
      embed.setFooter(`▸ Premio de plata por ${user.tag}`);
      embed.setTimestamp();
      break;

    case gold:
      award = "oro";
      price = 500;
      gift = 100;
      embed.setColor("#FFD700");
      embed.setFooter(`▸ Premio de oro por ${user.tag}`);
      embed.setTimestamp();
      break;

    case platinium:
      award = "platino";
      price = 1800;
      gift = 700;
      embed.setColor("#21ffe5");
      embed.setFooter(`▸ Premio de platino por ${user.tag}`);
      embed.setTimestamp();
      break;

    default:
      return;
  }

  if(disableAwards === true && user.id != jeffreygID) {
    message.channel.messages.fetch(message.id).then(m => {
      let react = m.reactions.cache.get(
        reaction.emoji.name + ":" + reaction.emoji.id
      );

      react.remove(user.id);
    });

    return bots.send("los awards actualmente están en mantenimiento, por favor intenta más tarde. :D");
  }

  let confirmation = new Discord.MessageEmbed()
    .setAuthor(`| Confirmación`, Config.jeffreyguildIcon)
    .setDescription(
      `**—** ${user.tag}, ¿Estás seguro de darle a este usuario el premio de **__${award}__**?
**—**( **${Emojis.Jeffros}${price}** )

*— Para más información de las recompensas de los premios [mira esto](https://discordapp.com/channels/447797737216278528/485191307346837507/668568017042538507).*`
    )
    .setColor(Colores.rojo);

    bots.send({content: `${user}`, embeds: [confirmation]}).then(msg => {
      msg.react(":allow:558084462232076312").then(r => {
        msg.react(":denegar:558084461686947891");
      });

      let cancelEmbed = new Discord.MessageEmbed()
        .setDescription(`Cancelado.`)
        .setColor(Colores.nocolor);

      const yesFilter = (reaction, userr) => reaction.emoji.id === "558084462232076312" && userr.id === user.id;
      const noFilter = (reaction, userr) => reaction.emoji.id === "558084461686947891" && userr.id === user.id;
      const collectorFilter = (reaction, userr) => (reaction.emoji.id === "558084461686947891" || reaction.emoji.id === "558084462232076312") && userr.id === user.id;

      const yes = msg.createReactionCollector({ filter:yesFilter, time: 60000 });
      const no = msg.createReactionCollector({ filter:noFilter, time: 60000 });
      const collectorAwards = msg.createReactionCollector({ filter:collectorFilter, time: 60000 });

      collectorAwards.on("collect", r => {
        collectorAwards.stop();
      });
      
      collectorAwards.on("end", r => {
        if(r.size > 0 && (r.size === 1 && r.first().me)) return;
        if (msg.reactions.cache.size > 0) {
          message.channel.messages.fetch(message.id).then(m => {
            let react = m.reactions.cache.get(reaction.emoji.id);
            
            react.users.remove(user.id);
          });

          msg.reactions.removeAll();
          return msg.edit({content: null, embeds: [cancelEmbed]}).then(e => {
            setTimeout(() => {
              e.delete()
            }, ms("10s"));
          });
        } else {
          return;
        }
      });

      yes.on("collect", r => {
        msg.reactions.removeAll();
        Jeffros.findOne(
          {
            serverID: guild.id,
            userID: user.id
          },
          (err, author) => {
            if (err) throw err;

            if (!author || author.jeffros < price) {
              return msg.edit({content: `No tienes **${Emojis.Jeffros}${price}**.`, embeds: null});
            }

            if (award === "oro" || award === "platino") {
              Jeffros.findOne(
                {
                  serverID: guild.id,
                  userID: message.author.id
                },
                (err, reciever) => {
                  if (err) throw err;

                  if (reciever === author) {
                    reciever.jeffros -= price - gift;

                    msg.edit({content: null, embeds: [paid]}).then(m => {
                      setTimeout(() => {
                        m.delete()
                      }, ms("4s"));
                    });
                    return hallChannel.send({embeds: [embed]});
                  }

                  if (!reciever) {
                    const newJeffros = new Jeffros({
                      userID: message.author.id,
                      serverID: guild.id,
                      jeffros: gift
                    });

                    newJeffros.save();
                    author.jeffros -= price;
                    author.save();

                    // despues del pago

                    msg.edit({content: null, embeds: [paid]}).then(m => {
                      setTimeout(() => {
                        m.delete()
                      }, ms("4s"));
                    });
                    return hallChannel.send({embeds: [embed]});
                  } else {
                    author.jeffros -= price;
                    author.save();
                    reciever.jeffros += gift;
                    reciever.save();

                    // despues del pago

                    msg.edit({content: null, embeds: [paid]}).then(m => {
                      setTimeout(() => {
                        m.delete()
                      }, ms("4s"));
                    });
                    return hallChannel.send({embeds: [embed]});
                  }
                }
              );
            } else {
              // SI EL PREMIO ES SILVER ENTONCES
              author.jeffros -= price;

              author.save();

              msg.edit({content: null, embeds: [paid]}).then(m => {
                msg.reactions.removeAll();

                setTimeout(() => {
                  m.delete();
                }, ms("4s"));
              });
              return hallChannel.send({embeds: [embed]});
            }
          }
        );
      });

      no.on("collect", r => {
        message.channel.messages.fetch(message.id).then(m => {
          let react = m.reactions.cache.get(reaction.emoji.id);

          react.users.remove(user.id);
        });

        return msg.edit({content: null, embeds: [cancelEmbed]}).then(a => {
          msg.reactions.removeAll();
          setTimeout(() => {
            a.delete();
          }, ms("10s"));
        });
      });
    });
});

client.on("messageCreate", async msg => {
  // Si mencionan a Jeffrey, mención en #log
  if (msg.author.bot) return;
  if (msg.channel.type == "DM") return;
  let contentMsg = msg.content.toLowerCase();
  let logC = msg.guild.channels.cache.find(x => x.id === logChannel);

  let adminRole = msg.guild.roles.cache.find(x => x.id === Config.adminRole);
  let modRole = msg.guild.roles.cache.find(x => x.id === Config.modRole);
  let staffRole = msg.guild.roles.cache.find(x => x.id === Config.staffRole);

  if(client.user.id === Config.testingJBID){
    adminRole = msg.guild.roles.cache.find(x => x.id === "483105079285776384");
    modRole = msg.guild.roles.cache.find(x => x.id === "483105108607893533");
    staffRole = msg.guild.roles.cache.find(x => x.id === "535203102534402063");
  }

  let embed = new Discord.MessageEmbed()
    .setAuthor(`${msg.author.tag}`, msg.author.displayAvatarURL())
    .setDescription(
      `**__${msg.author.username}__** dice: "\`${msg.content}\`".`
    )
    .setFooter(`Mencionaron a Jeffrey.`, msg.guild.iconURL())
    .setColor(Colores.verde);

  if (
    contentMsg.includes("jeff") ||
    contentMsg.includes("jeffrey") ||
    contentMsg.includes("jeffry") ||
    contentMsg.includes("jefry") ||
    contentMsg.includes("jefri") ||
    contentMsg.includes("jeffri")
  ) {
    if (msg.author.bot) return;
    if (msg.author.id === jeffreygID) return;
    if (msg.content.startsWith(prefix)) return;
    if (msg.channel.id === Config.offtopicChannel) return;
    if (msg.channel.id === "829153564353101854") return; // evento de coins 2
    if (msg.channel.id === Config.spamChannel) return;
    if (msg.member.roles.cache.find(x => x.id === staffRole.id)) {
      return logC
        .send(`Un **STAFF** ha mencionado a Jeffrey en ${msg.channel}.`)
        .then(m => logC.send({embeds: [embed]}));
    }
    return logC
      .send(`Han mencionado a <@!${jeffreygID}> en ${msg.channel}.`)
      .then(m => logC.send({embeds: [embed]}));
  }
});

client.on("messageCreate", message => {
  let channel = message.channel;
  let author = message.author;

  if (author.bot) return;
  if (!message.member) return;

  if (message.member.permissions.has("EMBED_LINKS") || channel.id === Config.offtopicChannel || channel.id === Config.spamChannel || channel.id === Config.gdpsSupportChannel) {
    return;
  }

  if (message.content.includes("https://")) {
    message.delete();
    message.author.send(`No envíes links, **${author.tag}**.`).catch(e => {
      message.channel
        .send(`No envíes links, **${author.tag}**.`)
        .then(m => m.delete(ms("10s")));
    });
  }
  if (message.content.includes("http://")) {
    message.delete();
    message.author.send(`No envíes links, **${author.tag}**.`).catch(e => {
      message.channel
        .send(`No envíes links, **${author.tag}**.`)
        .then(m => m.delete(ms("10s")));
    });
  }
  if (message.content.includes("www.")) {
    message.delete();
    message.author.send(`No envíes links, **${author.tag}**.`).catch(e => {
      message.channel
        .send(`No envíes links, **${author.tag}**.`)
        .then(m => m.delete(ms("10s")));
    });
  }
});

client.on("messageUpdate", (oldmessage, message) => {
  let channel = message.channel;
  let author = message.author;

  if (author.bot) return;
  if (message.channel.type === "DM") return;

  if (message.member.permissions.has("EMBED_LINKS") || channel.id === Config.offtopicChannel || channel.id === Config.spamChannel || channel.id === Config.gdpsSupportChannel) {
    return;
  }

  if (message.content.includes("https://")) {
    message.delete();
    message.author.send(`No envíes links, **${author.tag}**.`).catch(e => {
      message.channel
        .send(`No envíes links, **${author.tag}**.`)
        .then(m => m.delete(ms("10s")));
    });
  }
  if (message.content.includes("http://")) {
    message.delete();
    message.author.send(`No envíes links, **${author.tag}**.`).catch(e => {
      message.channel
        .send(`No envíes links, **${author.tag}**.`)
        .then(m => m.delete(ms("10s")));
    });
  }
  if (message.content.includes("www.")) {
    message.delete();
    message.author.send(`No envíes links, **${author.tag}**.`).catch(e => {
      message.channel
        .send(`No envíes links, **${author.tag}**.`)
        .then(m => m.delete(ms("10s")));
    });
  }
});

if (process.env.mantenimiento != 1) {
  client.login(process.env.TOKEN);

  module.exports = {
    client: client
  }

  functions = require("./resources/functions.js");
  
} else {
  console.log("########## BOT EN MANTENIMIENTO, NO LOGEADO #############");
}