const { ContextMenuCommandBuilder, ContextMenuCommandInteraction, Client } = require("discord.js");
const { Categories } = require("./Enums");

class ContextMenu {
    /**
     * @param {{name}} data
     */
    constructor(data = {name: "foo", type: 2, category: Categories.General}) {
        this.data = new ContextMenuCommandBuilder()
            .setName(data.name)
            .setType(data.type)

        this.name = this.data.name;
        this.type = this.data.type;
        this.category = this.data.category;

        /**
         * 
         * @param {ContextMenuCommandInteraction} interaction 
         * @param {Object} models 
         * @param {Object} params
         * @param {Client} client 
         */
        this.execute = async (interaction, models, params, client) => {
            await interaction.deferReply({ephemeral: true});
            interaction.editReply({content: "Hola mundo!"});
        }
    }
}

module.exports = ContextMenu;