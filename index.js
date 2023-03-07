require("dotenv").config();
require("./server");

const { Client, GatewayIntentBits, Partials } = require("discord.js");
const CronJob = require("cron").CronJob;

const moment = require("moment-timezone")
moment.tz.setDefault("America/Bogota")

const Events = require("./Events");
const Errors = require("./Errors");

const client = new Client({
  allowedMentions: { parse: ['users', 'roles'], repliedUser: true }, intents: [
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
  ]
});

const { connection } = require('./db');
const pckVersion = require("./package.json").version;

console.log("==============================================")
console.log(`🦊 INICIALIZANDO ${require("./package.json").name} v${pckVersion} ...`)

connection.then(async (c) => {
  console.log(`🟢 Conectado a la base de datos ${c.connection.name} 🖥️`)

  client.version = pckVersion;
  //client.on("debug", console.log)

  new CronJob('0 0 31 11 *', async function () { // reiniciar precios de la darkshop anualmente
    const users = await require("mongoose").models.Users.find();

    users.forEach(user => {
      user.data.purchases.forEach(async (purchase, index) => {
        if (purchase.isDarkShop) {
          console.log("🟢 Se eliminó la compra: ")
          console.log(purchase)
          console.log("🟢 De: %s en %s", user.user_id, user.guild_id)

          user.data.purchases.splice(index, 1);
          user.markModified("data");
          await user.save();
        }
      })
    })
  }, null, true, 'America/Bogota');
  try {
    await client.login(process.env.TOKEN)
    // events
    Events(client);

    // error handling
    Errors(client);

  } catch (err) {
    console.log("🔴 Hubo un error iniciando el cliente y sus handlers")
    console.log(err)
  }
})
  .catch(err => {
    console.log("🔴 Hubo un error conectandose a la base de datos")
    console.log(err);
  })

module.exports = client;