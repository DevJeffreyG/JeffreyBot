require("dotenv").config();

const fs = require("fs");
const { Client, GatewayIntentBits, Partials } = require("discord.js");
const CronJob = require("cron").CronJob;

const Events = require("./Events");
const client = new Client({ allowedMentions: { parse: ['users', 'roles'], repliedUser: true }, intents: [
  GatewayIntentBits.Guilds,
  GatewayIntentBits.GuildMembers,
  GatewayIntentBits.GuildBans,
  GatewayIntentBits.GuildMessages,
  GatewayIntentBits.GuildEmojisAndStickers,
  GatewayIntentBits.DirectMessages,
  GatewayIntentBits.GuildMessageReactions,
  GatewayIntentBits.GuildPresences,
  GatewayIntentBits.MessageContent
], partials: [
  Partials.Channel,
  Partials.User,
  Partials.GuildMember,
  Partials.Message,
  Partials.Reaction
]});

const { connection } = require('./db')

console.log("==============================================")
console.log(`🦊 INICIALIZANDO ${require("./package.json").name} v${require("./package.json").version} ...`)

connection.then(async (c) => {
  console.log(`🟢 Conectado a la base de datos ${c.connection.name} 🖥️`)
  const Commands = require("./Commands");

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
  await Commands.prepare(client, ["482989052136652800"]);
  client.login(process.env.TOKEN);
})