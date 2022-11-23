//packages
const ms = require("ms");
const moment = require('moment-timezone');

const { Config, Colores } = require("../src/resources/");
const { Embed, Log, ChannelModules, LogReasons } = require("../src/utils");
const { deleteLateMedia, disableEXPs, jeffreygID, multiplier, mantenimiento } = Config;

const jeffreyMentions = {
  real: ["jeff", "jeffrey", "jeffry", "jefry", "jefri", "jeffri", "yefri", "yeffri", "yefry", "yefrei", "yeffrig"],
  false: ["jeffros"]
};

const links = [
  "https", "http", "www.", "discord.gg", "discord.gift"
];

const { GlobalDatasWork } = require("../src/utils/");
const { ChannelType, PermissionsBitField, codeBlock } = require("discord.js");

const { Users, Guilds } = require("mongoose").models;

module.exports = async (client, message) => {
  // Captcha.
  if (message.author.bot) return;
  if (message.channel.type === ChannelType.DM) return;

  const doc = await Guilds.getOrCreate(message.guild.id);
  const messageArray = message.content.split(" ");
  const guild = message.guild;
  const author = message.author;
  const member = message.member;
  const channel = message.channel;

  if (mantenimiento && author.id != jeffreygID) return console.log("MANTENIMIENTO");

  await GlobalDatasWork(guild, true); // verificar si existen BOOSTS.

  // buscar usuario
  const user = await Users.getOrCreate({
    user_id: author.id,
    guild_id: guild.id
  });

  // links
  const link = links.some(x => message.content.includes(x));

  if (doc.moduleIsActive("automoderation.remove_links") && !member.permissions.missing(PermissionsBitField.Flags.EmbedLinks).length > 0) {
    if (link) deleteLink(message)
    else if (message.embeds.length > 0) deleteLink(message)

    function deleteLink(message) {
      message.delete();
      message.author.send({
        embeds: [
          new Embed()
            .defAuthor({ text: `No envíes links`, title: true })
            .defDesc(`Detecté que incluiste un link en tu mensaje:
${codeBlock(message.content)}`)
            .defFooter({ text: `Discúlpame si fue un error :)`, icon: guild.iconURL({ dynamic: true }) })
            .defColor(Colores.rojo)
        ]
      })
        .catch(async err => {
          let msg = await message.channel.send(`No envíes links, **${author.tag}**.`)

          setTimeout(() => {
            msg.delete();
          })
        });

      new Log(message)
      .setTarget(ChannelModules.ModerationLogs)
      .setReason(LogReasons.AutoMod)
      .send({embeds: [
        new Embed()
        .defAuthor({text: `Se eliminó un mensaje de ${author.tag}`, icon: member.displayAvatarURL({dynamic: true})})
        .defDesc(`${codeBlock(message.content)}`)
        .defColor(Colores.verde)
        .defFooter({text: "NO se aplicaron sanciones", timestamp: true})
      ]})
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

  if (client.user.id === Config.testingJBID) {
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

  let cool = user.cooldown("jeffros_exp", { cooldown: jexpCooldown, save: false });
  if (cool) return;

  let lessThan3 = messageArray.length < 3 ? true : false;
  let moreThan6 = messageArray.length > 6 ? true : false;

  let lastAuthor = false;

  if (message.channel === main || message.channel === vipmain) { // revisar si el ultimo usuario en hablar fue el mismo usuario
    let last = await message.channel.messages.fetch({ limit: 2 });

    if (last.every(msg => msg.author.id === message.author.id)) lastAuthor = true;
  }

  // ################################ EXP & JEFFROS REWORK NEEDED

  if (author.id == jeffreygID || !disableEXPs) {
    return
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

    if (lessThan3) {
      jeffrosToAdd = Math.ceil(Math.random() * (rewards.jeffros["<3"] * benefitMultiplier));
      expToAdd = Math.ceil(Math.random() * (rewards.exp["<3"] * benefitMultiplier));
    } else if (moreThan6) {
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

      if (specialInfo.type === "boostMultiplier") {
        if (specialInfo.objetive === "jeffros" || specialInfo.objetive === "all") {
          jeffrosToAdd = jeffrosToAdd * Number(specialInfo.value);
          console.log(author.tag, "Boost de JEFFROS.")
        }

        if (specialInfo.objetive === "exp" || specialInfo.objetive === "all") { // si el boost es de exp  
          expToAdd = expToAdd * Number(specialInfo.value);
          console.log(author.tag, "Boost de EXP.")
        }
      }
    }

    if (message.channel != main && message.channel != vipmain) return;

    // agregar jeffros y exp
    if (!lastAuthor) {
      await user.addCurrency(jeffrosToAdd)
      user.economy.global.exp += expToAdd;

      user.data.lastGained.jeffros = jeffrosToAdd;
      user.data.lastGained.exp = expToAdd;
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

          user.economy.global.currency += 2000;

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

          user.economy.global.currency += 5000;
          await user.save();
        } else if (curLvl === 70) {
          message.channel.send(`**${author} no va a parar.\n— ¡SUBE A NIVEL 70!**`)
          message.member.roles.add(rewards.roles[70]);
        } else if (curLvl === 80) {
          message.channel.send(`**${author} no para de sorprendernos.\n— ¡SUBE A NIVEL 80!**`)
          message.member.roles.add(rewards.roles[80]);

          user.economy.global.currency += 6000;
          await user.save();
        } else if (curLvl === 90) {
          message.channel.send(`**${author} está en la recta final.\n— ¡SUBE A NIVEL 90!**`)
          message.member.roles.add(rewards.roles[90]);

          user.economy.global.currency += 10000;
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