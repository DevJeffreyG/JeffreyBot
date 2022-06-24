const { SlashCommandBuilder } = require('@discordjs/builders');
const Embed = require("./Embed");
const Colores = require("../resources/colores.json");

class Command {
    constructor(data = {name: "foo", desc: "bar", helpdesc: null, category: "0"}){
        if(!(data.name && data.desc && data.category)) return console.error("No están todos los datos para crear un comando:", data)
        
        this.data = new SlashCommandBuilder()
            .setName(data.name.toLowerCase())
            .setDescription(data.desc)

        this.name = this.data.name;
        this.info = data.helpdesc ?? this.data.description;
        this.category = data.category;
        this.execute = async (interaction, params, client) => {
            await interaction.deferReply()
            interaction.editReply("Hola mundo!")
        };
        this.getHelp = async (interaction) => {
            let embed = this.#getHelpEmbed(interaction);

            return interaction.editReply({content: null, embeds: [embed]});
        }
    }

    async addOption(data = {type, name: "foo", desc: "bar", req: false}) {
        if(!(data.type && data.name && data.desc)) return console.error("No están todos los datos para crear una opción:", this.data, data)
        
        const x = option => this.#optionWork(option, data);
        switch(data.type) {
            case "string":
                this.data.addStringOption(x);
                break;

            case "integer":
                this.data.addIntegerOption(x)
                break;
            
            case "boolean":
                this.data.addBooleanOption(x);
                break;

            case "user":
                this.data.addUserOption(x);
                break;
            
            case "channel":
                this.data.addChannelOption(x);
                break;

            case "role":
                this.data.addRoleOption(x);
                break;
            
            case "mentionable":
                this.data.addMentionableOption(x);
                break;

            case "number":
                this.data.addNumberOption(x);
                break;

            case "attachment":
                this.data.addAttachmentOption(x);
                break;

            case "default":
                console.error("No se ha creado ninguna opción, 'type' incorrecto", data)
                break;
        }
    }

    #optionWork(option, data) {
        option
        .setName(data.name)
        .setDescription(data.desc)
        .setRequired(data.req ?? false)

        return option;
    }

    #getHelpEmbed(interaction) {
        let embed = new Embed()
        .defAuthor({text: `Ayuda: /${this.name}`, icon: interaction.guild.iconURL(), title: true})
        .defDesc(`▸ ${this.info}`)
        .setColor(Colores.verde)
        .defThumbnail(interaction.client.user.avatarURL())

        return embed;
    }
    
}

module.exports = Command;