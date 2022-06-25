require("dotenv").config();

const fs = require("fs");
const Discord = require("discord.js");
const CronJob = require("cron").CronJob;

const Commands = require("./Commands");
const Events = require("./Events");

const myIntents = new Discord.Intents()
myIntents.add(Discord.Intents.FLAGS.DIRECT_MESSAGES, Discord.Intents.FLAGS.DIRECT_MESSAGE_REACTIONS, Discord.Intents.FLAGS.DIRECT_MESSAGE_TYPING, Discord.Intents.FLAGS.GUILDS, Discord.Intents.FLAGS.GUILD_BANS, Discord.Intents.FLAGS.GUILD_EMOJIS_AND_STICKERS, Discord.Intents.FLAGS.GUILD_INTEGRATIONS, Discord.Intents.FLAGS.GUILD_INVITES, Discord.Intents.FLAGS.GUILD_MEMBERS, Discord.Intents.FLAGS.GUILD_MESSAGES, Discord.Intents.FLAGS.GUILD_MESSAGE_REACTIONS, Discord.Intents.FLAGS.GUILD_MESSAGE_TYPING, Discord.Intents.FLAGS.GUILD_PRESENCES, Discord.Intents.FLAGS.GUILD_VOICE_STATES, Discord.Intents.FLAGS.GUILD_WEBHOOKS); // QUE ASCO WN AYUDA
const client = new Discord.Client({ allowedMentions: { parse: ['users', 'roles'], repliedUser: true }, intents: [myIntents] });

const { connection } = require('./db')

connection.then(async () => {
  // events
  Events(client);

  // Handler commands (messageCreate old)
  client.baseCommands = [];
  const baseCommandsFolder = fs.readdirSync("./oldcommands").filter(file => !file.endsWith(".txt")); // quitar el layout LMAO

  for (const folder of baseCommandsFolder) {
    const baseCommandsFiles = fs.readdirSync(`./oldcommands/${folder}`).filter(file => file.endsWith(".js"));

    for (const file of baseCommandsFiles) {
        const command = require(`./oldcommands/${folder}/${file}`);
    
        // push name onto aliases
        const aliases = command.data.aliases || [];
        aliases.push(command.data.name);
        command.data.aliases = aliases;
        // set filename
        command.data.file = folder+"/"+file;
        client.baseCommands.push(command.data);
    }
  }

  new CronJob('0 0 31 11 *', async function(){ // reiniciar precios de la darkshop anualmente
    const users = await Users.find();

    users.forEach(user => {
      user.data.purchases.forEach(async (purchase, index) => {
        if(purchase.isDarkShop){
          user.data.purchases.splice(index, 1);
          user.markModified("data");
          await user.save();
        }
      })
    })
  }, null, true, 'America/Bogota');
  
  // slash commands
  Commands.prepare(client);
  client.login(process.env.TOKEN);
})