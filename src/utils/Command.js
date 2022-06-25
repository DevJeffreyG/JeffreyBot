const { SlashCommandBuilder } = require('@discordjs/builders');
const { PermissionFlagsBits } = require('discord-api-types/v10');

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
        this.#staffPerms();
        this.execute = async (interaction, models, params, client) => {
            await interaction.deferReply()
            interaction.editReply("Hola mundo!")
        };
        this.getHelp = async (interaction) => {
            let embed = this.#getHelpEmbed(interaction);

            return interaction.editReply({content: null, embeds: [embed]});
        }
    }

    async addOption(data = {type, name: "foo", desc: "bar", req: false, sub: null}) {
        if(!(data.type && data.name && data.desc)) return console.error("No están todos los datos para crear una opción:", this.data, data)
        
        const toAdd = data.sub ? this.data.options.find(x => x.name === data.sub) : this.data;

        const x = option => this.#optionWork(option, data);
        switch(data.type) {
            case "string":
                toAdd.addStringOption(x);
                break;

            case "integer":
                toAdd.addIntegerOption(x)
                break;
            
            case "boolean":
                toAdd.addBooleanOption(x);
                break;

            case "user":
                toAdd.addUserOption(x);
                break;
            
            case "channel":
                toAdd.addChannelOption(x);
                break;

            case "role":
                toAdd.addRoleOption(x);
                break;
            
            case "mentionable":
                toAdd.addMentionableOption(x);
                break;

            case "number":
                toAdd.addNumberOption(x);
                break;

            case "attachment":
                toAdd.addAttachmentOption(x);
                break;

            case "default":
                console.error("No se ha creado ninguna opción, 'type' incorrecto", data)
                break;
        }
    }

    async addSubcommand(data = {name: "foo", desc: "bar"}) {
        if(!(data.name && data.desc)) return console.error("No están todos los datos para crear un subcommand:", this.data, data)

        this.data.addSubcommand(sub => 
            sub
                .setName(data.name)
                .setDescription(data.desc)
        )
    }

    async #staffPerms() {
        if(this.category == "STAFF" || this.category == "MODERATION" || this.category == "ADMIN") this.data.setDefaultMemberPermissions(PermissionFlagsBits.Administrator | PermissionFlagsBits.ManageMessages);
        if(this.category == "DEV") this.data.setDefaultMemberPermissions(0)
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