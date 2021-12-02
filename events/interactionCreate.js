const moment = require('moment-timezone');

const Toggle = require("../modelos/Toggle.model.js");

let functions = require("../resources/functions.js");
const { jeffreygID } = require("../base.json");

module.exports = async (client, interaction) => {
    if(!interaction.isCommand()) return;

    const author = interaction.user;
    const slashCommand = client.slash.get(interaction.commandName);
    const commandName = interaction.commandName;

    let toggledQuery = await Toggle.findOne({
      command: commandName
    });

    if(toggledQuery && author.id != jeffreygID){
      let since = moment(toggledQuery.since).format("DD/MM/YY")
      return interaction.reply({content: `Este comando está deshabilitado.\n${toggledQuery.reason} desde ${since}`, ephemeral: true});
    }

    await functions.intervalGlobalDatas(client);
    executeSlash(interaction, client)
  
    async function executeSlash(interaction, client){
      try {
        await slashCommand.execute(interaction, client);
      } catch (error) {
        console.error(error);
        await interaction.reply({ content: 'Jeffrey es tonto, hubo un error ejecutando este comando, por fa, avísale de su grado de inservibilidad. **(ni siquiera sé si esa palabra existe...)**', ephemeral: true });
      }
    }
}