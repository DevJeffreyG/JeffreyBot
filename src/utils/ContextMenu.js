const { ContextMenuCommandBuilder, ContextMenuCommandInteraction, Client, PermissionFlagsBits } = require("discord.js");
const { Categories } = require("./Enums");

class ContextMenu {
    /**
     * @param {{name, type, category}} data
     */
    constructor(data = { name: "foo", type: 2, category: Categories.General }) {
        this.data = new ContextMenuCommandBuilder()
            .setName(data.name)
            .setType(data.type)

        this.name = this.data.name;
        this.type = this.data.type;

        this.category = data.category;
        this.subcategory = null;

        this.#setPerms();

        /**
         * 
         * @param {ContextMenuCommandInteraction} interaction 
         * @param {Object} models 
         * @param {Object} params
         * @param {Client} client 
         */
        this.execute = async (interaction, models, params, client) => {
            await interaction.deferReply({ ephemeral: true });
            interaction.editReply({ content: "Hola mundo!" });
        }
    }

    setCategory(category) {
        this.category = category;
        this.#setPerms();

        return this;
    }

    setSubCategory(sub) {
        this.subcategory = sub;

        return this
    }

    #setPerms() {
        if (this.category === Categories.Administration) this.data.setDefaultMemberPermissions(PermissionFlagsBits.Administrator);
        if (this.category === Categories.Staff || this.category === Categories.Moderation) this.data.setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages);
        if (this.category === Categories.Developer) {
            this.data.setDefaultMemberPermissions(PermissionFlagsBits.Administrator);
            this.dev = true;
        }
    }
}

module.exports = ContextMenu;