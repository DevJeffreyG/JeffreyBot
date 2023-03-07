const fs = require("fs")

module.exports = (client) => {
  const eventFiles = fs.readdirSync('./events').filter(file => file.endsWith('.js'));
  for (const file of eventFiles) {
    const fileName = file.substring(0, file.length - 3); // sacar el ".js"

    let event = require(`./events/${file}`);

    client.on(fileName, event.bind(null, client));
  }
}