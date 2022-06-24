//packages
const Discord = require("discord.js");
const ms = require("ms");
const moment = require('moment-timezone');

const Config = require("../src/resources/base.json");
const { deleteLateMedia, disableEXPs, jeffreygID, multiplier, mantenimiento } = Config;
const { active, baseCommands, jeffreyMentions, startLinks } = require("../index.js");

const { intervalGlobalDatas, GenerateLog } = require("../src/utils/");

const Cumplidos = require("../src/resources/cumplidos.json");
const Colores = require("../src/resources/colores.json");

const User = require("../modelos/User.model.js");
const Guild = require("../modelos/Guild.model.js");
const Toggle = require("../modelos/Toggle.model.js");

const cmdCooldown = ms("2s");

module.exports = async (client, message) => {
    // Captcha.
    if (message.author.bot) return;
    if (message.channel.type == "DM") return;
    
    const docGuild = await Guild.findOne({guild_id: message.guild.id}) ?? await new Guild({guild_id: message.guild.id}).save();
    const prefix = docGuild.settings.prefix;
    const messageArray = message.content.split(" ");
    const cmd = messageArray[0].toLowerCase();
    const args = messageArray.slice(1);
    const guild = message.guild;
    const author = message.author;
    const channel = message.channel;

    if(mantenimiento && author.id != jeffreygID) return console.log("MANTENIMIENTO");
  
    await intervalGlobalDatas(client, true); // verificar si existen BOOSTS.

    // buscar usuario
    const user = await User.findOne({
      user_id: author.id,
      guild_id: guild.id
    }) ?? await new User({
      user_id: author.id,
      guild_id: guild.id
    }).save();

    // eliminar multimedia en las noches
    let ahora = moment().tz("America/Bogota");
    let hour = ahora.hour();
  
    if(deleteLateMedia && (hour >= 22 || hour < 7)){
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

    const jeffreyRole = client.user.id === Config.testingJBID ? guild.roles.cache.find(x => x.id === "482992290550382592") : guild.roles.cache.find(x => x.id === Config.jeffreyRole);
    const adminRole = guild.roles.cache.find(x => x.id === docGuild.roles.admin);
    const staffRole = guild.roles.cache.find(x => x.id === docGuild.roles.staff);
    const logC = client.user.id === Config.testingJBID ? guild.channels.cache.find(x => x.id === "483108734604804107") : guild.channels.cache.find(x => x.id === Config.logChannel);
    const gdpsSupportChannel = client.user.id === Config.testingJBID ? message.guild.channels.cache.find(x => x.id === "537095712102416384") : message.guild.channels.cache.find(x => x.id === Config.gdpsSupportChannel);
    const spamChannel = client.user.id === Config.testingJBID ? message.guild.channels.cache.find(x => x.id === "537095712102416384") : message.guild.channels.cache.find(x => x.id === Config.spamChannel);
    const offtopicChannel = client.user.id === Config.testingJBID ? message.guild.channels.cache.find(x => x.id === "537095712102416384") : message.guild.channels.cache.find(x => x.id === Config.offtopicChannel);

    if (message.content.startsWith(prefix)) { // empieza con el prefix
      // COOLDOWN COMANDOS
      let commandsEnabled = [
        client.user.id === Config.testingJBID ? "836337226652319815" : Config.botsChannel,
        client.user.id === Config.testingJBID ? "537095712102416384" : Config.staffComandos,
        client.user.id === Config.testingJBID ? "537095712102416384" : Config.botsVip
      ];
  
      if (!commandsEnabled.find(x => x === message.channel.id) && !message.member.roles.cache.find(x => x === jeffreyRole) && !message.member.roles.cache.find(x => x === staffRole)) return;

      var randomCumplidos = Cumplidos.c[Math.floor(Math.random() * Cumplidos.c.length)];
  
      // handler
      let commandFile = await findCommand(cmd);

      if(commandFile){
        if(user.data.cooldowns.jeffros_exp){
          let timer = user.data.cooldowns.jeffros_exp;
          let toCheck = (cmdCooldown) - (new Date().getTime() - timer);
          let left = ms(toCheck);
          if(toCheck < 0) user.data.cooldowns.jeffros_exp = null;
          else
          return message.reply(`Usa este comando en ${left}, ${randomCumplidos}`);
        }

        for (let i = 0; i < commandFile.data.aliases.length; i++) {
          const alias = commandFile.data.aliases[i];
          
          let toggledQuery = await Toggle.findOne({
            command: alias
          });

          if(toggledQuery && author.id != jeffreygID){
            let since = moment(toggledQuery.since).format("DD/MM/YY")
            return message.reply(`Este comando está deshabilitado.\n${toggledQuery.reason} desde ${since}`);
          }
        }
        
        await intervalGlobalDatas(client);
        await commandFile.execute(client, message, args, active);

        //agregar cooldown
        user.data.cooldowns.jeffros_exp = new Date();
        user.save();
      }
    } else { // no es un comando
      // mencionan a Jeffrey
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

          const doNotSend = (fake || message.channel === offtopicChannel || message.channel === spamChannel) ?? false;
    
          if (!doNotSend && message.member.roles.cache.find(x => x.id === staffRole.id)) return logC.send({content: `Un **STAFF** ha mencionado a Jeffrey en ${message.channel}.`, embeds: [embed]});
          else if(!doNotSend) return logC.send({content: `Han mencionado a <@${jeffreygID}> en ${message.channel}.`, embeds: [embed]});
        }
      }
    
      // links
      for (let i = 0; i < startLinks.length; i++) {
        const start = startLinks[i];
        
        if(contentMsg.includes(start) && !(message.member.permissions.has("EMBED_LINKS") || channel === offtopicChannel || channel === spamChannel || channel === gdpsSupportChannel)){
          await message.delete();
          return message.channel.send({content: `No envíes links, **${author.tag}**`, ephemeral: true});
        }
      }

      // jeffros & exp
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
  
      let jexpCooldown = ms("1m");

      if(client.user.id === Config.testingJBID){
        main = guild.channels.cache.find(x => x.id === "797258710997139537");
        vipmain = guild.channels.cache.find(x => x.id === "537095712102416384");
        
        if (message.member.roles.cache.find(x => x.id === "887145636187754566")) jexpCooldown /= 2; //30s
        if (message.member.roles.cache.find(x => x.id === "887151235852038175")) jexpCooldown /= 2; //15s
        if (message.member.roles.cache.find(x => x.id === "887151257360412723")) jexpCooldown /= 2; //7.5s

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
        
        if (message.member.roles.cache.find(x => x.id === Config.lvl40)) jexpCooldown /= 2;
        if (message.member.roles.cache.find(x => x.id === Config.lvl70)) jexpCooldown /= 2;
        if (message.member.roles.cache.find(x => x.id === Config.lvl90)) jexpCooldown /= 2;
      }

      if (user.data.cooldowns.jeffros_exp){
        let timer = user.data.cooldowns.jeffros_exp;
        let toCheck = (jexpCooldown) - (new Date().getTime() - timer);
        if(toCheck < 0) user.data.cooldowns.jeffros_exp = null;
        else
        return;
      }
  
      let lessThan3 = messageArray.length < 3 ? true : false;
      let moreThan6 = messageArray.length > 6 ? true : false;
  
      let lastAuthor = false;
  
      if(message.channel === main || message.channel === vipmain){ // revisar si el ultimo usuario en hablar fue el mismo usuario
        let last = await message.channel.messages.fetch({ limit: 2 });
  
        if(last.every(msg => msg.author.id === message.author.id)) lastAuthor = true;
      }
  
      // ################################ EXP & JEFFROS
      
      if(author.id == jeffreygID || !disableEXPs){
      
        let benefitMultiplier = 1; // si es uno no pasaría nada
        // VIP 200%
        if (message.member.roles.cache.find(x => x.id === rewards.roles.vip)) benefitMultiplier += 1; // 2
  
        // NIVEL 10 15% MÁS
        if (message.member.roles.cache.find(x => x.id === rewards.roles[10])) benefitMultiplier += 0.15; // 2.15}
  
        // NIVEL 50 50% MÁS
        if (message.member.roles.cache.find(x => x.id === rewards.roles[50])) benefitMultiplier += 0.5; // 2.65

        // NIVEL 70 70% MÁS
        if (message.member.roles.cache.find(x => x.id === rewards.roles[70])) benefitMultiplier += 0.7; // 3.35
  
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

              user.economy.global.jeffros += 5000;
              await user.save();
            } else if (curLvl === 70) {
              message.channel.send(`**${author} no va a parar.\n— ¡SUBE A NIVEL 70!**`)
              message.member.roles.add(rewards.roles[70]);
            } else if (curLvl === 80) {
              message.channel.send(`**${author} no para de sorprendernos.\n— ¡SUBE A NIVEL 80!**`)
              message.member.roles.add(rewards.roles[80]);

              user.economy.global.jeffros += 6000;
              await user.save();
            } else if (curLvl === 90) {
              message.channel.send(`**${author} está en la recta final.\n— ¡SUBE A NIVEL 90!**`)
              message.member.roles.add(rewards.roles[90]);

              user.economy.global.jeffros += 10000;
              await user.save();
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
  
          user.data.cooldowns.jeffros_exp = new Date();
          user.save();
        } else {
          console.log(`${author.tag} fue el ultimo en hablar, no se da recompensas de JEFFROS ni EXP. ${message.url}`)
        }
      } else {
        return console.log("EXP y JEFFROS están deshabilitados, no es Jeffrey, no se han dado ni EXP ni JEFFROS.");
      }
    }

    async function findCommand(cmd){
      let file;
      baseCommands.forEach(async command => {
        let foundAlias = command.aliases.find(x => x === cmd.slice(prefix.length)) ? true : false;
    
        if(foundAlias) {
            file = require("../oldcommands/" + command.file);
        }
      });
    
      return file;
    }
}