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

const commandsCooldown = new Set();
const jeffrosExpCooldown = new Set();
const repCool = new Set();

const active = new Map();

let functions = require("./resources/functions.js");

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

const User = require("./modelos/User.model.js");

const AutoRole = require("./modelos/autorole.js");
const Toggle = require("./modelos/toggle.js");

const GlobalData = require("./modelos/globalData.js");

/* ##### MONGOOSE ######## */


// ### HANDLERS
// comandos normales
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

// new
const baseCommands = [];
const baseCommandsFolder = fs.readdirSync("./aa").filter(file => !file.endsWith(".txt")); // quitar el layout LMAO

for (const folder of baseCommandsFolder) {
  const baseCommandsFiles = fs.readdirSync(`./aa/${folder}`).filter(file => file.endsWith(".js"));

  for (const file of baseCommandsFiles) {
      const command = require(`./aa/${folder}/${file}`);
  
      // push name onto aliases
      const aliases = command.data.aliases || [];
      aliases.push(command.data.name);
      command.data.aliases = aliases;
      // set filename
      command.data.file = folder+"/"+file;
      baseCommands.push(command.data);
  }
}


/* const baseCommands = []; ESTO ES LO QUE SERVIA XDDDDD
const baseCommandsFiles = fs.readdirSync("./aa").filter(file => file.endsWith(".js"));

for (const file of baseCommandsFiles) {
    const command = require(`./aa/${file}`);

    // push name onto aliases
    const aliases = command.data.aliases || [];
    aliases.push(command.data.name);
    command.data.aliases = aliases;
    // set filename
    command.data.file = file;
    baseCommands.push(command.data);
} */


// slash commands
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
      await functions.intervalGlobalDatas(client);
      executeSlash(interaction, client)
    } else if(author.id === jeffreygID || author.id === "460913577105293313") { // si es jeffrey
      await functions.intervalGlobalDatas(client);
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
});

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

  let channel = member.guild.channels.cache.find(x => x.id === Config.mainChannel);
  let logC = member.guild.channels.cache.find(x => x.id === Config.logChannel);
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

client.on("guildMemberAdd", async member => {
  
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

  // crear usuario nuevo
  let query = await User.findOne({
    user_id: member.id,
    guild_id: member.guild.id
  });

  if(!query){
    const newUser = new User({
      user_id: member.id,
      guild_id: guild.id
    });

    newUser.save();
  }

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

  let channel = client.channels.cache.get(Config.logChannel);
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
  await functions.findLvls5(client, guild)

  /* ############ GLOBAL DATAS ############ */
  console.log("Ciclo de Global Datas iniciado por primera vez")
  functions.intervalGlobalDatas(client);

  setInterval(function(){
    functions.intervalGlobalDatas(client);
  }, ms("1m"));

  /* YOUTUBE NOTIFACTIONS */

  functions.handleUploads(client);
});

client.on("messageDelete", async(message) => {
  let author = message.author;

  if (jeffrosExpCooldown.has(author.id)) {
    let q = await User.findOne({
      user_id: author.id,
      guild_id: message.guild.id
    });

    if(!q) return;
    if(message.channel.id != Config.mainChannel) return;

    let global = q.economy.global

    let nxtLvl = 10 * ((global.level-1) ** 2) + 50 * (global.level-1) + 100; // fórmula de MEE6.

    global.jeffros -= q.data.lastExpJeffros.jeffros;
    

    if (global.exp - q.data.lastExpJeffros.exp >= nxtLvl) console.log("Subió de nivel");
    else {
      global.exp -= q.data.lastExpJeffros.exp;
    }


    await q.save();

    console.log(global.jeffros, global.exp, author.username);
  }
})

//main
client.on("messageCreate", async message => {
  let messageArray = message.content.split(" ");
  let cmd = messageArray[0].toLowerCase();
  let args = messageArray.slice(1);
  let guild = message.guild;
  let author = message.author;

  const cmdCooldown = ms("2s");
  let jexpCooldown = ms("1m");
  const repCooldown = ms("1d");

  // Captcha.
  if (message.author.bot) return;
  if (message.channel.type == "DM") return;

  await functions.intervalGlobalDatas(client, true); // verificar si existen BOOSTS.
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

  let authorExists = await User.findOne({
    user_id: author.id,
    guild_id: guild.id
  });

  if(!authorExists){
    await new User({
      user_id: author.id,
      guild_id: guild.id
    }).save()
  }

  if (message.content.startsWith(prefix)) {
    // Si el mensaje empieza por el prefijo, entonces...

    let jeffreyRole = guild.roles.cache.find(x => x.id === Config.jeffreyRole);
    let adminRole = guild.roles.cache.find(x => x.id === Config.adminRole);
    let modRole = guild.roles.cache.find(x => x.id === Config.modRole);
    let staffRole = guild.roles.cache.find(x => x.id === Config.staffRole);
    let logC = guild.channels.cache.find(x => x.id === Config.logChannel);

    if(client.user.id === Config.testingJBID){
      jeffreyRole = guild.roles.cache.find(x => x.id === "482992290550382592");
      adminRole = guild.roles.cache.find(x => x.id === "483105079285776384");
      modRole = guild.roles.cache.find(x => x.id === "483105108607893533");
      staffRole = guild.roles.cache.find(x => x.id === "535203102534402063");
      logC = guild.channels.cache.find(x => x.id === "483108734604804107");
    }
    
    // COOLDOWN COMANDOS

    if (!message.content.startsWith(prefix)) return;

    let commandsEnabled = [
      Config.botsChannel,
      Config.staffComandos,
      Config.botsVip
    ];

    if (!commandsEnabled.find(x => x === message.channel.id) && !(message.author.id === jeffreygID || message.author.id === "460913577105293313") && !message.member.roles.cache.find(x => x.id === staffRole.id)) return;
    

    // /rep @usuario
    if (message.content.toLowerCase().startsWith(`${prefix}rep`)) {
      // if(author.id != jeffreygID) return message.reply(`Este comando está en mantenimiento! Pronto estará disponible. Disculpa los inconvenientes.`);
      let jeffreyRole = guild.roles.cache.find(
        x => x.id === Config.jeffreyRole
      );
      let uPrest = message.mentions.users.first() ? guild.members.cache.get(message.mentions.users.first().id) : guild.members.cache.get(args[0]);

      let embed = new Discord.MessageEmbed()
        .setTitle(`Ayuda: ${prefix}rep`)
        .setColor(Colores.nocolor)
        .setDescription(
          `▸ El uso correcto es: ${prefix}rep <@usuario>\n▸ Le das un punto de reputación a un usuario.`
        )
        .setFooter(`<> Obligatorio () Opcional`);

      if (!uPrest) return message.channel.send({embeds: [embed]});

      User.findOne(
        {
          guild_id: guild.id,
          user_id: uPrest.user.id
        },
        (err, pres) => {
          if (err) throw err;

          if (!pres) {
            return message.reply(
              `No pude encontrar a este usuario. O simplemente no ha hablado.`
            );
          } else {
            let corEmbed = new Discord.MessageEmbed()
              .setAuthor(`Rep`, `${uPrest.user.displayAvatarURL()}`)
              .setDescription(
                `**—** Usuario: **${uPrest}**.
**—** Por: **${message.author.username}**.
**—** En: **${message.channel}**.
**—** Reputación actual: **${pres.economy.global.reputation + 1}**.`
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

              pres.economy.global.reputation += 1;
              pres.save().catch(err => console.log(err));

              repCool.add(message.author.id);

              setTimeout(() => {
                repCool.delete(message.author.id);
              }, repCooldown);

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
    }, cmdCooldown);

    // handler
    let commandFile = await findCommand(cmd);
    let oldCommandFile = client.comandos.get(cmd.slice(prefix.length));

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
            await functions.intervalGlobalDatas(client); // correr el interval por cosas como la duracion de inflacion
            if (commandFile) {
              if (commandsCooldown.has(author.id)) { // revisar si tiene cooldown
                message.delete();
                return message.channel.send(`${author}, Relájate un poco con los comandos, ${randomCumplidos}.`);
              }

              await commandFile.execute(client, message, args, active);

              // agregar el cooldown      
              if (!message.member.roles.cache.find(x => x.id === staffRole.id)) {
                commandsCooldown.add(author.id);
              }
            } else

            if(oldCommandFile){
              if (commandsCooldown.has(author.id)) { // revisar si tiene cooldown
                message.delete();
                return message.channel.send(`${author}, Relájate un poco con los comandos, ${randomCumplidos}.`);
              }

              await oldCommandFile.run(client, message, args, active);

              // agregar el cooldown      
              if (!message.member.roles.cache.find(x => x.id === staffRole.id)) {
                commandsCooldown.add(author.id);
              }
            }
          } else if(!commandFile && !oldCommandFile){ // si no existe el comando, return
            return;
          } else if(author.id === jeffreygID || author.id === "460913577105293313") { // si es jeffrey
            await functions.intervalGlobalDatas(client);
            if (commandFile) commandFile.execute(client, message, args, active);
            else 

            if(oldCommandFile) oldCommandFile.run(client, message, args, active);
          } else { // si encuentra el comando toggleado return nomas
            return message.reply("este comando está deshabilitado.");
          }
        })
      } else if(!commandFile && !oldCommandFile){ // si no existe el comando, return
        return;
      } else if(author.id === jeffreygID || author.id === "460913577105293313") { // si es jeffrey
        await functions.intervalGlobalDatas(client);
        if (commandFile) commandFile.execute(client, message, args, active);
        else 
        
        if(oldCommandFile) oldCommandFile.run(client, message, args, active);
      } else { // si encuentra el comando toggleado return nomas
        return message.reply("este comando está deshabilitado.");
      }
    })
  } else { // no es un comando
    let main;
    let vipmain;

    const rewards = {
      jeffros: {
        "<3": 2,
        ">6": 15,
        "standard": 5
      },
      exp: {
        "<3": 3,
        ">6": 35,
        "standard": 15
      },
      roles: {
        "1": Config.lvl1,
        "10": Config.lvl10,
        "20": Config.lvl20,
        "30": Config.lvl30,
        "40": Config.lvl40,
        "50": Config.lvl50,
        "60": Config.lvl60,
        "70": Config.lvl70,
        "80": Config.lvl80,
        "90": Config.lvl90,
        "99": Config.lvl99,
        "vip": Config.vipRole,
        "100": Config.lvl100,
      }
    }

    if(client.user.id === Config.testingJBID){
      main = guild.channels.cache.find(x => x.id === "797258710997139537");
      vipmain = guild.channels.cache.find(x => x.id === "537095712102416384");
      
      if (message.member.roles.cache.find(x => x.id === "887145636187754566")) jexpCooldown = jexpCooldown / 2;
      rewards.roles = {
        "1": "887151103240699904",
        "10": "887151087897968640",
        "20": "871389918662897674",
        "30": "887151144097447946",
        "40": "887145636187754566",
        "50": "887151197520289823",
        "60": "887151110861779035",
        "70": "887151235852038175",
        "80": "887151247721922570",
        "90": "887151257360412723",
        "99": "887151260086702081",
        "vip": "797500275266027611",
        "100": "887151285009281044",
      }
    } else {
      main = guild.channels.cache.find(x => x.id === Config.mainChannel);
      vipmain = guild.channels.cache.find(x => x.id === Config.mainVip);
      
      if (message.member.roles.cache.find(x => x.id === Config.lvl40)) jexpCooldown = jexpCooldown / 2;
    }

    let lessThan3 = messageArray.length < 3 ? true : false;
    let moreThan6 = messageArray.length > 6 ? true : false;

    let lastAuthor = false;

    if(message.channel === main || message.channel === vipmain){ // revisar si el ultimo usuario en hablar fue el mismo usuario
      let last = await message.channel.messages.fetch({ limit: 2 });

      if(last.every(msg => msg.author.id === message.author.id)) lastAuthor = true;
    }

    // ################################ EXP & JEFFROS
    
    if(author.id == jeffreygID || disableEXPs === false){
    
      let benefitMultiplier = 1; // si es uno no pasaría nada
      // VIP 200%
      if (message.member.roles.cache.find(x => x.id === rewards.roles.vip)) {
        benefitMultiplier += 1; // 2
      }

      // NIVEL 10 15% MÁS

      if (message.member.roles.cache.find(x => x.id === rewards.roles[10])) {
        benefitMultiplier += 0.15; // 2.15
      }

      // NIVEL 50 50% MÁS

      if (message.member.roles.cache.find(x => x.id === rewards.roles[50])) {
        benefitMultiplier += 0.5; // 2.65
      }

      let jeffrosToAdd;
      let expToAdd;

      if(lessThan3){
        jeffrosToAdd = Math.ceil(Math.random() * (rewards.jeffros["<3"] * benefitMultiplier));
        expToAdd = Math.ceil(Math.random() * (rewards.exp["<3"] * benefitMultiplier));
      } else if(moreThan6){
        jeffrosToAdd = Math.ceil(Math.random() * (rewards.jeffros[">6"] * benefitMultiplier));
        expToAdd = Math.ceil(Math.random() * (rewards.exp[">6"] * benefitMultiplier));
      } else {
        jeffrosToAdd = Math.ceil(Math.random() * (rewards.jeffros["standard"] * benefitMultiplier));
        expToAdd = Math.ceil(Math.random() * (rewards.exp["standard"] * benefitMultiplier));
      }

      if (multiplier != 1) {
        jeffrosToAdd = jeffrosToAdd * multiplier;
        expToAdd = expToAdd * multiplier;
      }

      // buscar usuario
      let user = await User.findOne({
        user_id: author.id,
        guild_id: guild.id
      });

      if(!user){
        user = await new User({
          user_id: author.id,
          guild_id: guild.id
        }).save();
      }

      // buscar si tiene boost
      for (let i = 0; i < user.data.temp_roles.length; i++) {
        const temprole = user.data.temp_roles[i];
        const specialInfo = temprole.special;
        
        if(specialInfo.type === "boostMultiplier"){
          if(specialInfo.objetive === "jeffros" || specialInfo.objetive === "all"){
            jeffrosToAdd = jeffrosToAdd * Number(specialInfo.value);
            console.log(author.tag, "Boost de JEFFROS.")
          }

          if(specialInfo.objetive === "exp" || specialInfo.objetive === "all"){ // si el boost es de exp  
            expToAdd = expToAdd * Number(specialInfo.value);
            console.log(author.tag, "Boost de EXP.")
          }
        }
      }

      if (jeffrosExpCooldown.has(author.id)) return;

      if (message.channel != main && message.channel != vipmain) return;

      // agregar jeffros y exp
      if(!lastAuthor){
        user.economy.global.jeffros += jeffrosToAdd;
        user.economy.global.exp += expToAdd;

        user.data.lastExpJeffros.jeffros = jeffrosToAdd;
        user.data.lastExpJeffros.exp = expToAdd;
        await user.save();

        let curLvl = user.economy.global.level;
        let nxtLvl = 10 * (curLvl ** 2) + 50 * curLvl + 100; // fórmula de MEE6.
        let curExp = user.economy.global.exp;
        
        // si sube de nivel
        if (curExp + expToAdd >= nxtLvl) {
          user.economy.global.level += 1;
          await user.save();

          curLvl = user.economy.global.level;
          console.log(`${author.username} sube de nivel! (${curLvl})`);

          if (curLvl === 1) {
            message.channel.send(`**${author} empieza a mostrarse, ¿será el inicio de algo grande?.\n— ¡SUBE A NIVEL 1!**`)
            message.member.roles.add(rewards.roles[1]);
          } else if (curLvl === 10) {
            message.channel.send(`**${author} no piensa rendirse.\n— ¡SUBE A NIVEL 10!**`)
            message.member.roles.add(rewards.roles[10]);
          } else if (curLvl === 20) {
            message.channel.send(`**${author} ¿estás determinado?.\n— ¡SUBE A NIVEL 20!**`)
            message.member.roles.add(rewards.roles[20]);
          } else if (curLvl === 30) {
            message.channel.send(`**${author} parece no detenerse.\n— ¡SUBE A NIVEL 30!**`)
            message.member.roles.add(rewards.roles[30]);

            user.economy.global.jeffros += 2000;

            await user.save();
          } else if (curLvl === 40) {
            message.channel.send(`**${author} casi logra llegar al punto medio.\n— ¡SUBE A NIVEL 40!**`)
            message.member.roles.add(rewards.roles[40]);
          } else if (curLvl === 50) {
            message.channel.send(`**${author} literalmente está... ¿determinadx?...\n— ¡SUBE A NIVEL 50!**`)
            message.member.roles.add(rewards.roles[50]);
          } else if (curLvl === 60) {
            message.channel.send(`**${author} no se rinde.\n— ¡SUBE A NIVEL 60!**`)
            message.member.roles.add(rewards.roles[60]);
          } else if (curLvl === 70) {
            message.channel.send(`**${author} no va a parar.\n— ¡SUBE A NIVEL 70!**`)
            message.member.roles.add(rewards.roles[70]);
          } else if (curLvl === 80) {
            message.channel.send(`**${author} no para de sorprendernos.\n— ¡SUBE A NIVEL 80!**`)
            message.member.roles.add(rewards.roles[80]);
          } else if (curLvl === 90) {
            message.channel.send(`**${author} está en la recta final.\n— ¡SUBE A NIVEL 90!**`)
            message.member.roles.add(rewards.roles[90]);
          } else if (curLvl === 99) {
            message.channel.send(`**${author} está a punto de logralo.\n— ¡SUBE A NIVEL 99!**`)
            message.member.roles.add(rewards.roles[99]);
            message.member.roles.add(rewards.roles.vip);
          } else if (curLvl === 100) {
            message.channel.send(`**${author} está determinadx.\n— ¡SUBE A NIVEL 100!**`)
            message.member.roles.add(rewards.roles[100]);
          } else if (curLvl === 200) {
            message.channel.send(`**${author} literal mente vive AQUÍ.\n— ¡SUBE A NIVEL 200!**`)
          }
        }

        jeffrosExpCooldown.add(author.id);

        setTimeout(() => {
          console.log(author.id + " ya puede ganar exp y jeffros")
          jeffrosExpCooldown.delete(author.id);
        }, jexpCooldown);
      } else {
        console.log(`${author.tag} fue el ultimo en hablar, no se da recompensas de JEFFROS ni EXP. ${message.url}`)
      }
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
    embed.setDescription(`[★](${message.url}) ${message.content} [(archivo)](${firstAttachment.url})`);
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
      msgEmbed = firstEmbed.description ?? incaseofField;
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
    .setAuthor(`Confirmación`, Config.jeffreyguildIcon)
    .setDescription(
      `**—** ${user.tag}, ¿Estás seguro de darle a este usuario el premio de **__${award}__**?
**—**( **${Emojis.Jeffros}${price.toLocaleString('es-CO')}** )

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

      yes.on("collect", async r => {
        msg.reactions.removeAll();

        let user_author = await User.findOne({ // buscar al que paga el premio
          user_id: user.id,
          guild: guild.id
        });

        let user_reciever = await User.findOne({ // buscar el que recibe el premio
          user_id: user.id,
          guild_id: guild.id
        });

        if (!user_author || user_author.economy.global.jeffros < price) { // si no existe un documento con jeffros o son insuficientes
          return msg.edit({content: `No tienes **${Emojis.Jeffros}${price.toLocaleString('es-CO')}**.`, embeds: null});
        }

        if (award === "oro" || award === "platino") { // si el award es de oro o platino
          if (user_reciever === user_author) { // si es el mismo usuario
            user_reciever.economy.global.jeffros -= price - gift;

            msg.edit({content: null, embeds: [paid]}).then(m => {
              setTimeout(() => {
                m.delete()
              }, ms("4s"));
            });
            return hallChannel.send({embeds: [embed]});
          }

          if (!user_reciever) {
            const newUser = new User({
              user_id: message.author.id,
              guild: guild.id,
              economy: {
                global: {
                  jeffros: gift
                }
              }
            });

            user_author.economy.global.jeffros -= price;
            await newUser.save();
            await user_author.save();

            // despues del pago

            msg.edit({content: null, embeds: [paid]}).then(m => {
              setTimeout(() => {
                m.delete()
              }, ms("4s"));
            });
            return hallChannel.send({embeds: [embed]});
          } else {
            user_author.economy.global.jeffros -= price;
            user_reciever.economy.global.jeffros += gift;

            await user_reciever.save();
            await user_author.save();

            // despues del pago

            msg.edit({content: null, embeds: [paid]}).then(m => {
              setTimeout(() => {
                m.delete()
              }, ms("4s"));
            });
            return hallChannel.send({embeds: [embed]});
          }
        } else {
          // SI EL PREMIO ES SILVER ENTONCES
          user_author.economy.global.jeffros -= price;

          await user_author.save();

          msg.edit({content: null, embeds: [paid]}).then(m => {
            msg.reactions.removeAll();

            setTimeout(() => {
              m.delete();
            }, ms("4s"));
          });
          return hallChannel.send({embeds: [embed]});
        }
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

/* ########## WATCHER #########*/

let jeffreyMentions = {
  real: ["jeff", "jeffrey", "jeffry", "jefry", "jefri", "jeffri", "yefri", "yeffri", "yefry", "yefrei", "yeffrig"],
  false: ["jeffros"]
};

let startLinks = [
  "https://", "http://", "www."
];

client.on("messageCreate", async message => {
  let channel = message.channel;
  let author = message.author;

  if (author.bot) return;
  if (message.channel.type == "DM") return;
  if (author.bot) return;
  if (author.id === jeffreygID) return;
  if (message.content.startsWith(prefix)) return;
  
  let log = message.guild.channels.cache.find(x => x.id === Config.logChannel);

  let adminRole = message.guild.roles.cache.find(x => x.id === Config.adminRole);
  let modRole = message.guild.roles.cache.find(x => x.id === Config.modRole);
  let staffRole = message.guild.roles.cache.find(x => x.id === Config.staffRole);
  let offtopicChannel = message.guild.channels.cache.find(x => x.id === Config.offtopicChannel);
  let spamChannel = message.guild.channels.cache.find(x => x.id === Config.spamChannel);
  let gdpsSupportChannel = message.guild.channels.cache.find(x => x.id === Config.gdpsSupportChannel);

  if(client.user.id === Config.testingJBID){
    adminRole = message.guild.roles.cache.find(x => x.id === "483105079285776384");
    modRole = message.guild.roles.cache.find(x => x.id === "483105108607893533");
    staffRole = message.guild.roles.cache.find(x => x.id === "535203102534402063");
    log = message.guild.channels.cache.find(x => x.id === "537095712102416384");
    offtopicChannel = message.guild.channels.cache.find(x => x.id === "537095712102416384");
    spamChannel = message.guild.channels.cache.find(x => x.id === "537095712102416384");
    gdpsSupportChannel = message.guild.channels.cache.find(x => x.id === "537095712102416384");
  }

  // Si mencionan a Jeffrey, mención en #log
  
  let contentMsg = message.content.toLowerCase();

  let embed = new Discord.MessageEmbed()
  .setAuthor(`${author.tag}`, author.displayAvatarURL())
  .setDescription(`**__${author.username}__** dice: "\`${message.content}\`".`)
  .setFooter(`Mencionaron a Jeffrey.`, message.guild.iconURL())
  .setColor(Colores.verde)
  .setTimestamp();


  for (let i = 0; i < jeffreyMentions.real.length; i++) {
    const mention = jeffreyMentions.real[i];
    
    if(contentMsg.includes(mention)){
      // falsos positivos JAJA
      let fake = false;
      
      falso:
      for (let i = 0; i < jeffreyMentions.false.length; i++) {
        const falso = jeffreyMentions.false[i];
        
        if(contentMsg.includes(falso)) {
          fake = true;
          break falso;
        }
      }

      if(fake) return;
      if (message.channel.id === Config.offtopicChannel) return;
      if (message.channel.id === "829153564353101854") return; // evento de coins 2
      if (message.channel.id === Config.spamChannel) return;

      if (message.member.roles.cache.find(x => x.id === staffRole.id)) return log.send({content: `Un **STAFF** ha mencionado a Jeffrey en ${message.channel}.`, embeds: [embed]});
      else return log.send({content: `Han mencionado a <@${jeffreygID}> en ${message.channel}.`, embeds: [embed]});
    }
  }

  // links
  if (message.member.permissions.has("EMBED_LINKS") || channel === offtopicChannel || channel === spamChannel || channel === gdpsSupportChannel) return;

  for (let i = 0; i < startLinks.length; i++) {
    const start = startLinks[i];
    
    if(contentMsg.includes(start)){
      await message.delete();
      return message.channel.send({content: `No envíes links, **${author.tag}**`, ephemeral: true});
    }
  }
});

client.on("messageUpdate", async (old, message) => {
  let channel = message.channel;
  let author = message.author;

  if (author.bot) return;
  if (message.channel.type == "DM") return;
  if (author.bot) return;
  if (author.id === jeffreygID) return;
  if (message.content.startsWith(prefix)) return;
  
  let log = message.guild.channels.cache.find(x => x.id === Config.logChannel);

  let adminRole = message.guild.roles.cache.find(x => x.id === Config.adminRole);
  let modRole = message.guild.roles.cache.find(x => x.id === Config.modRole);
  let staffRole = message.guild.roles.cache.find(x => x.id === Config.staffRole);
  let offtopicChannel = message.guild.channels.cache.find(x => x.id === Config.offtopicChannel);
  let spamChannel = message.guild.channels.cache.find(x => x.id === Config.spamChannel);
  let gdpsSupportChannel = message.guild.channels.cache.find(x => x.id === Config.gdpsSupportChannel);

  if(client.user.id === Config.testingJBID){
    adminRole = message.guild.roles.cache.find(x => x.id === "483105079285776384");
    modRole = message.guild.roles.cache.find(x => x.id === "483105108607893533");
    staffRole = message.guild.roles.cache.find(x => x.id === "535203102534402063");
    log = message.guild.channels.cache.find(x => x.id === "483108734604804107");
    offtopicChannel = message.guild.channels.cache.find(x => x.id === "537095712102416384");
    spamChannel = message.guild.channels.cache.find(x => x.id === "537095712102416384");
    gdpsSupportChannel = message.guild.channels.cache.find(x => x.id === "537095712102416384");
  }

  // Si mencionan a Jeffrey, mención en #log
  
  let contentMsg = message.content.toLowerCase();

  let embed = new Discord.MessageEmbed()
  .setAuthor(`${author.tag}`, author.displayAvatarURL())
  .setDescription(`**__${author.username}__** dice: "\`${message.content}\`".`)
  .setFooter(`Mencionaron a Jeffrey.`, message.guild.iconURL())
  .setColor(Colores.verde)
  .setTimestamp();


  for (let i = 0; i < jeffreyMentions.real.length; i++) {
    const mention = jeffreyMentions.real[i];
    
    if(contentMsg.includes(mention)){
      // falsos positivos JAJA
      let fake = false;

      falso:
      for (let i = 0; i < jeffreyMentions.false.length; i++) {
        const falso = jeffreyMentions.false[i];
        
        if(contentMsg.includes(falso)) {
          fake = true;
          break falso;
        }
      }

      if(fake) return;
      if (message.channel.id === Config.offtopicChannel) return;
      if (message.channel.id === "829153564353101854") return; // evento de coins 2
      if (message.channel.id === Config.spamChannel) return;

      if (message.member.roles.cache.find(x => x.id === staffRole.id)) return log.send({content: `Un **STAFF** ha mencionado a Jeffrey en ${message.channel}.`, embeds: [embed]});
      else return log.send({content: `Han mencionado a <@${jeffreygID}> en ${message.channel}.`, embeds: [embed]});
    }
  }

  // links
  if (message.member.permissions.has("EMBED_LINKS") || channel === offtopicChannel || channel === spamChannel || channel === gdpsSupportChannel) return;

  for (let i = 0; i < startLinks.length; i++) {
    const start = startLinks[i];
    
    if(contentMsg.includes(start)){
      await message.delete();
      return message.channel.send({content: `No envíes links, **${author.tag}**`, ephemeral: true});
    }
  }
});

async function findCommand(cmd){
  let file;
  baseCommands.forEach(async command => {
    let foundAlias = command.aliases.find(x => x === cmd.slice(prefix.length)) ? true : false;

    if(foundAlias) {
        file = require("./aa/" + command.file);
    }
  });

  return file;
}

if (process.env.mantenimiento != 1) {
  client.login(process.env.TOKEN);
} else {
  console.log("########## BOT EN MANTENIMIENTO, NO LOGEADO #############");
}