require("dotenv").config();

// packages
const Discord = require("discord.js");
const fs = require("fs");
const CronJob = require("cron").CronJob;

const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');

//login
const myIntents = new Discord.Intents()

myIntents.add(Discord.Intents.FLAGS.DIRECT_MESSAGES, Discord.Intents.FLAGS.DIRECT_MESSAGE_REACTIONS, Discord.Intents.FLAGS.DIRECT_MESSAGE_TYPING, Discord.Intents.FLAGS.GUILDS, Discord.Intents.FLAGS.GUILD_BANS, Discord.Intents.FLAGS.GUILD_EMOJIS_AND_STICKERS, Discord.Intents.FLAGS.GUILD_INTEGRATIONS, Discord.Intents.FLAGS.GUILD_INVITES, Discord.Intents.FLAGS.GUILD_MEMBERS, Discord.Intents.FLAGS.GUILD_MESSAGES, Discord.Intents.FLAGS.GUILD_MESSAGE_REACTIONS, Discord.Intents.FLAGS.GUILD_MESSAGE_TYPING, Discord.Intents.FLAGS.GUILD_PRESENCES, Discord.Intents.FLAGS.GUILD_VOICE_STATES, Discord.Intents.FLAGS.GUILD_WEBHOOKS); // QUE ASCO WN AYUDA
const client = new Discord.Client({ allowedMentions: { parse: ['users', 'roles'], repliedUser: true }, intents: [myIntents] });

// config & consts
const jeffreyMentions = {
  real: ["jeff", "jeffrey", "jeffry", "jefry", "jefri", "jeffri", "yefri", "yeffri", "yefry", "yefrei", "yeffrig"],
  false: ["jeffros"]
};

const startLinks = [
  "https://", "http://", "www."
];

const commandsCooldown = new Set();
const jeffrosExpCooldown = new Set();

const active = new Map(); // musica

/* ##### MONGOOSE ######## */

const User = require("./modelos/User.model.js");

const mongoose = require("mongoose");
mongoose.connect(`${process.env.MONGOCONNECT}`, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

/* ##### MONGOOSE ######## */

// ########### ############# HANDLERS #################### ########
const baseCommands = [];
const baseCommandsFolder = fs.readdirSync("./commands").filter(file => !file.endsWith(".txt")); // quitar el layout LMAO

for (const folder of baseCommandsFolder) {
  const baseCommandsFiles = fs.readdirSync(`./commands/${folder}`).filter(file => file.endsWith(".js"));

  for (const file of baseCommandsFiles) {
      const command = require(`./commands/${folder}/${file}`);
  
      // push name onto aliases
      const aliases = command.data.aliases || [];
      aliases.push(command.data.name);
      command.data.aliases = aliases;
      // set filename
      command.data.file = folder+"/"+file;
      baseCommands.push(command.data);
  }
}

// slash commands
client.slash = new Discord.Collection();
const scommands = [];

const commandFiles = fs.readdirSync('./slashcommands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
	const command = require(`./slashcommands/${file}`);
	// set a new item in the Collection
	// with the key as the command name and the value as the exported module
	client.slash.set(command.data.name, command);
  scommands.push(command.data.toJSON());
}

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

// EVENTS
const eventFiles = fs.readdirSync('./events').filter(file => file.endsWith('.js'));
for(const file of eventFiles){
  exports.jeffrosExpCooldown = jeffrosExpCooldown;
  exports.jeffreyMentions = jeffreyMentions;
  exports.startLinks = startLinks;
  exports.commandsCooldown = commandsCooldown;
  exports.baseCommands = baseCommands;
  exports.active = active;
  
  const fileName = file.substring(0, file.length - 3); // sacar el ".js"

  let event = require(`./events/${file}`);

  client.on(fileName, event.bind(null, client));
}
// ########### ############# HANDLERS #################### ########

new CronJob('0 0 31 11 *', async function(){ // reiniciar precios de la darkshop anualmente
  const users = await User.find();

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

client.login(process.env.TOKEN);