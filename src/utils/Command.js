const { PermissionFlagsBits, SlashCommandBuilder, SlashCommandSubcommandGroupBuilder, SlashCommandSubcommandBuilder } = require('discord.js');

const Embed = require("./Embed");
const Colores = require("../resources/colores.json");
const { Categories } = require('./Enums');

class Command {
    #rawData;
    constructor(data = { name: "foo", desc: "bar", helpdesc: null, category: Categories.General }) {
        if (!(data.name && data.desc)) return console.error("No están todos los datos para crear un comando:", data)

        this.#rawData = data;

        this.data = new SlashCommandBuilder()
            .setName(data.name.toLowerCase());

        this.#prefixWork(data.category);

        this.name = this.data.name;
        this.info = data.helpdesc ?? data.desc;
        this.category = data.category;
        this.subcategory = null;

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

    setCategory(category) {
        this.#prefixWork(category);
        this.category = category;
        this.#setPerms();

        return this
    }

    setSubCategory(sub) {
        this.subcategory = sub;

        return this
    }

    #prefixWork(category) {
        let prefix = "";

        switch (category) {
            case Categories.General:
                prefix = "GENERAL";
                break;

            case Categories.Fun:
                prefix = "FUN";
                break;

            case Categories.Economy:
                prefix = "ECON";
                break;

            case Categories.DarkShop:
                prefix = "DS";
                break;

            case Categories.Staff:
                prefix = "STAFF";
                break;

            case Categories.Administration:
                prefix = "ADMIN";
                break;

            case Categories.Moderation:
                prefix = "MOD";
                break;

            case Categories.Developer:
                prefix = "DEV";
                break;

            case Categories.Music:
                prefix = "MUSIC";
                break;

            case Categories.DM:
                prefix = "DM";
                break;
        }

        this.data.setDescription(`[${prefix}] ${this.#rawData.desc}`)
        return this;
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

    addEach(data = { filter: null, type: "string", name: "foo", desc: "bar", req: false }) {
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

    addOption(data = { type: "string", name: "foo", desc: "bar", req: false, sub: null, choices: [] }) {
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

    addSubcommand(data = { name: "foo", desc: "bar", group: null }) {
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

    addSubcommandGroup(data = { name: "foo", desc: "bar" }) {
        this.#warning();
        if (!(data.name && data.desc)) return console.error("No están todos los datos para crear un subcommandgroup:", this.data, data)

        this.data.addSubcommandGroup(sub =>
            sub
                .setName(data.name)
                .setDescription(data.desc)
        )
    }

    /**
     * 
     * @param {Array<String>} paths Array de Strings que contienen la ubicación a la cual se agregarán las opciones
     * @param {Array} options 
     * @param {Boolean} insertFirst Agregar lo antes posible en las opciones?
     */
    addOptionsTo(paths, options, insertFirst = false) {
        for (const path of paths) {
            let arrayPath = path.split(" ")
            let subcommand = this.data.options;

            arrayPath.forEach(i => {
                subcommand = subcommand.find(x => x.name === i).options;
            })

            options.sort((a, b) => {
                if (a.required && !b.required) return -1
                if (!a.required && b.required) return 1
                else return 0;
            })

            let lastRequired = subcommand.findLastIndex(x => x.required);
            let lastNonRequired = subcommand.findLastIndex(x => !x.required);

            if (insertFirst) {
                // hay que agregar los requeridos antes que todo
                let requireds = options.filter(x => x.required);
                let nonrequireds = options.filter(x => !x.required);

                subcommand.splice(0, 0, ...requireds); // agregar las opciones requeridas antes de todo

                if (lastRequired != -1) // existe una opcion requerida, agregar las no requeridas después de esta
                    subcommand.splice(lastRequired + 1, 0, ...nonrequireds);
                else if (lastNonRequired != -1) // no existen opciones requeridas, pero sí hay no requeridas, agregar las no requeridas antes de todo
                    subcommand.slice(0, 0, ...nonrequireds);
                else // no existen opciones
                    subcommand.push(...nonrequireds);

            } else {
                if (lastRequired != -1) // existe una opcion requerida, agregar las opciones ordenadas después de esta
                    subcommand.splice(lastRequired + 1, 0, ...options);
                else if (lastNonRequired != -1) // no hay una opcion requerida, pero sí existen no requeridas, agregar las opciones ordenadas antes de estas
                    subcommand.slice(0, 0, ...options);
                else // no existen opciones
                    subcommand.push(...options);
            }

        }
    }

    #setPerms() {
        if (this.category === Categories.Administration) this.data.setDefaultMemberPermissions(PermissionFlagsBits.Administrator);
        if (this.category === Categories.Staff || this.category === Categories.Moderation) this.data.setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages);
        if (this.category === Categories.Developer) {
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
            if (data.min) option.setMinValue(data.min)
            if (data.max) option.setMaxValue(data.max)
        } else if (data.type === "string") {
            if (data.max) option.setMaxLength(data.max)
            if (data.min) option.setMinLength(data.min)
        }

        if (data.choices) {
            data.choices.forEach(choice => {
                option.addChoices({ name: choice.name ?? choice, value: choice.value ?? choice.toLowerCase() })
            });
        }

        return option;
    }

    #getHelpEmbed(interaction) {
        // TODO: Mostrar los parámetros, junto a subcomandos y subgrupos
        let embed = new Embed()
            .defAuthor({ text: `Ayuda: /${this.name}`, icon: interaction.guild.iconURL(), title: true })
            .defDesc(`▸ ${this.info}`)
            .setColor(Colores.verde)
            .defFooter({ text: "Esto será más completo en el futuro de Jeffrey Bot 🦊" })
            .defThumbnail(interaction.client.user.avatarURL())

        return embed;
    }

    #warning() {
        this.methodsCount++
        if (this.methodsCount > 5) return console.log(`⚠️ Hay muchos constructores custom (${this.methodsCount}), considera creando el slash command manualmente ➡️ ${this.name}`)
    }

}

module.exports = Command;