const { SlashCommandBuilder, SlashCommandSubcommandGroupBuilder, SlashCommandSubcommandBuilder } = require('@discordjs/builders');
const { PermissionFlagsBits } = require('discord-api-types/v10');

const Embed = require("./Embed");
const Colores = require("../resources/colores.json");
const { Categories } = require('./Enums');

class Command {
    constructor(data = { name: "foo", desc: "bar", helpdesc: null, category: "0" }) {
        if (!(data.name && data.desc && data.category)) return console.error("No están todos los datos para crear un comando:", data)

        this.data = new SlashCommandBuilder()
            .setName(data.name.toLowerCase())
            .setDescription(data.desc)

        this.name = this.data.name;
        this.info = data.helpdesc ?? this.data.description;
        this.category = data.category;
        this.#setPerms();
        this.execute = async (interaction, models, params, client) => {
            await interaction.deferReply()
            interaction.editReply("Hola mundo!")
        };
        this.getHelp = async (interaction) => {
            let embed = this.#getHelpEmbed(interaction);

            return interaction.editReply({ content: null, embeds: [embed] });
        }
        this.methodsCount = 0;
    }

    #toAddWorker(data) {
        let tofind = data.sub ? data.sub.split(".") : null;

        if (!tofind) return this.data;

        let returnable = this.data.options;

        tofind.forEach(find => {
            const f = x => x.name === find;

            if (!returnable || returnable instanceof SlashCommandSubcommandGroupBuilder) console.error("⚠️ Hay algo mal con las opciones actuales del comando, ten cuidado con los Subcommands y sus grupos", this.data, returnable);
            returnable = returnable.find(f).options.length != 0
                && returnable.find(f).options[0] instanceof SlashCommandSubcommandBuilder
                ? returnable.find(f).options
                : returnable.find(f);
        })

        return returnable;
    }

    async addEach(data = { filter: null, type: "string", name: "foo", desc: "bar", req: false }) {
        const options = data.filter ? this.data.options.filter(x => x.name === data.filter && x instanceof SlashCommandSubcommandGroupBuilder) : this.data.options;
        options.forEach(option => {
            if (option instanceof SlashCommandSubcommandGroupBuilder) {
                option.options.forEach(subcommand => {
                    data.sub = `${option.name}.${subcommand.name}`;
                    this.addOption(data)
                })
            } else {
                this.addOption(data);
            }
        })
    }

    async addOption(data = { type: "string", name: "foo", desc: "bar", req: false, sub: null, choices: [] }) {
        this.#warning();
        if (!(data.type && data.name && data.desc)) return console.error("No están todos los datos para crear una opción:", this.data, data)

        let toAdd = this.#toAddWorker(data)

        const x = option => this.#optionWork(option, data);
        switch (data.type) {
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

    async addSubcommand(data = { name: "foo", desc: "bar", group: null }) {
        this.#warning();
        if (!(data.name && data.desc)) return console.error("No están todos los datos para crear un subcommand:", this.data, data)

        if (data.group) {
            let sub = this.data.options.find(x => x.name === data.group);

            sub.addSubcommand(sub =>
                sub
                    .setName(data.name)
                    .setDescription(data.desc)
            )
        } else

            this.data.addSubcommand(sub =>
                sub
                    .setName(data.name)
                    .setDescription(data.desc)
            )
    }

    async addSubcommandGroup(data = { name: "foo", desc: "bar" }) {
        this.#warning();
        if (!(data.name && data.desc)) return console.error("No están todos los datos para crear un subcommandgroup:", this.data, data)

        this.data.addSubcommandGroup(sub =>
            sub
                .setName(data.name)
                .setDescription(data.desc)
        )
    }

    #setPerms() {
        if (this.category == Categories.Administration) this.data.setDefaultMemberPermissions(PermissionFlagsBits.Administrator);
        if (this.category == Categories.Staff || this.category == Categories.Moderation) this.data.setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages);
        if (this.category == Categories.Developer) {
            this.data.setDefaultMemberPermissions(PermissionFlagsBits.Administrator);
            this.dev = true;
        }
    }

    #optionWork(option, data) {
        option
            .setName(data.name)
            .setDescription(data.desc)
            .setRequired(data.req ?? false)

        if ((data.type === "integer" || data.type === "number")) {
            if(data.min) option.setMinValue(data.min)
            if(data.max) option.setMaxValue(data.max)
        }

        if (data.choices) {
            data.choices.forEach(choice => {
                option.addChoices({ name: choice.name ?? choice, value: choice.value ?? choice.toLowerCase() })
            });
        }

        return option;
    }

    #getHelpEmbed(interaction) {
        let embed = new Embed()
            .defAuthor({ text: `Ayuda: /${this.name}`, icon: interaction.guild.iconURL(), title: true })
            .defDesc(`▸ ${this.info}`)
            .setColor(Colores.verde)
            .defThumbnail(interaction.client.user.avatarURL())

        return embed;
    }

    #warning(){
        this.methodsCount++
        if(this.methodsCount > 5) return console.log(`⚠️ Hay muchos constructores custom (${this.methodsCount}), considera creando el slash command manualmente ➡️ ${this.name}`)
    }

}

module.exports = Command;