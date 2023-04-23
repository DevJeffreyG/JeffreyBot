const { BaseInteraction, InteractionType, time, CommandInteraction, MessageComponentInteraction, ModalSubmitInteraction, ContextMenuCommandInteraction, MessageContextMenuCommandInteraction, UserContextMenuCommandInteraction, DiscordAPIError, chatInputApplicationCommandMention } = require("discord.js");

const { Ticket, Suggestion } = require("./src/handlers/");
const { Bases, Colores } = require("./src/resources");
const { ErrorEmbed, Embed, Categories, ValidateDarkShop, Confirmation, HumanMs } = require("./src/utils");

const ms = require("ms");
const moment = require("moment-timezone");

const slashCooldown = ms("5s");

const models = require("mongoose").models;
const { ToggledCommands, Users, Guilds, GlobalDatas } = models;

class Handlers {
    /**
     * 
     * @param {BaseInteraction | CommandInteraction | MessageComponentInteraction | ModalSubmitInteraction | ContextMenuCommandInteraction | MessageContextMenuCommandInteraction | UserContextMenuCommandInteraction } interaction 
     * @param {Boolean} [init=true]
     */
    constructor(interaction, init = true) {
        this.interaction = interaction
        this.client = this.interaction.client;
        this.slashCooldowns = this.client.slashCooldowns;

        if (init) return this.#startHandler();
    }

    async #startHandler() {
        this.params = {}
        this.client.mentionCommand = (format) => {
            const args = format.split(" ");
            const name = args[0];
            const sub = args[1];
            const inside = args[2];

            let command = this.client.application.commands.cache.find(x => x.name === name) ?? this.interaction.guild.commands.cache.find(x => x.name === name);
            if (!command) return `\`/${name}\``;

            if (inside) return chatInputApplicationCommandMention(name, sub, inside, command.id)
            else if (sub) return chatInputApplicationCommandMention(name, sub, command.id)
            else return chatInputApplicationCommandMention(name, command.id)
        }

        if (!this.interaction.inGuild() && !this.#isDev()) return interaction.reply({ ephemeral: true, embeds: [new ErrorEmbed().defDesc("No puedes usar esto en mensajes directos.")] });
        if (this.interaction.client.isOnLockdown && !this.#isDev()) try {
            return await this.interaction.reply({ ephemeral: true, embeds: [new ErrorEmbed().defDesc(`Jeffrey Bot está en bloqueado ahora mismo, lamentamos los inconvenientes.`)] });
        } catch (err) {
            console.log(err)
        }

        if (this.interaction.customId?.toUpperCase().includes("TICKET")) this.ticket = new Ticket(this.interaction);
        if (this.interaction.customId?.toUpperCase().includes("SUGGESTION")) this.suggestion = new Suggestion(this.interaction);
        if (this.interaction.customId?.toUpperCase().includes("KILL") && this.#isDev()) {
            try {
                const killInfo = this.interaction.customId.split("-");
                const timestamp = Number(killInfo[1]);
                const clientId = killInfo[2];
                if (this.client.readyTimestamp === timestamp && this.client.user.id === clientId) {
                    await this.interaction.deferReply({ ephemeral: true }).catch(err => { });
                    console.log("DESTRUYENDO! %s", timestamp)
                    await this.interaction.editReply({ content: "Destruyendo cliente." })
                    this.client.destroy();
                    process.exit(0);
                }
            } catch (err) {
                console.log(err)
            }

            return;
        }

        this.user = await Users.getOrCreate({ user_id: this.interaction.user.id, guild_id: this.interaction.guild.id })
        this.doc = await Guilds.getOrCreate(this.interaction.guild.id);

        this.params["mongoose_user_doc"] = this.user;
        this.params["mongoose_guild_doc"] = this.doc;

        this.params["getDoc"] = () => { return this.params["mongoose_guild_doc"] }
        this.params["getUser"] = () => { return this.params["mongoose_user_doc"] }

        switch (this.interaction.type) {
            case InteractionType.ApplicationCommand:
                if (this.interaction.isChatInputCommand()) return this.slashHandler();
                if (this.interaction.isContextMenuCommand()) return this.contextMenuHandler();

            case InteractionType.MessageComponent:
                return this.componentHandler();

            case InteractionType.ModalSubmit:
                return this.modalHandler();
        }
    }

    async slashHandler() {
        const commandName = this.interaction.commandName;
        this.executedCommand = this.client.commands.get(commandName);
        this.identifierCooldown = BigInt(this.interaction.user.id) + BigInt(this.interaction.commandId);

        let toggledQuery = await ToggledCommands.getToggle(commandName);

        if (toggledQuery && !this.#isDev()) {
            let since = time(toggledQuery.since);
            return this.interaction.reply({ content: null, embeds: [new ErrorEmbed({ type: "toggledCommand", data: { commandName, since, reason: toggledQuery.reason } })], ephemeral: true });
        }

        // params
        const params = this.params;

        params["subcommand"] = this.interaction.options.getSubcommand(false); // guarda el subcomando que se está ejecutando
        params["subgroup"] = this.interaction.options.getSubcommandGroup(false); // guarda el grupo de subcomandos

        //console.log("Slash Command options:", slashCommand.data.options)

        //console.log("🟢 Params:", params)

        // empezar los params que sí serán usados
        const sub = params["subcommand"];
        const group = params["subgroup"];

        if (sub) params[sub] = {}
        if (group) {
            delete params[sub]
            params[group] = {}
        }

        const needFix = sub || group

        // opciones normales
        if (!needFix) {
            //console.log("🟢 Params ANTES de opciones normales:", params)
            for (const option of this.executedCommand.data.options) {
                //console.log(option)
                let { name } = option
                params[name] = this.interaction.options.get(name) // si no tiene opciones dentro (sería un subcommand)
            }

            //console.log("🟢 Params después de opciones normales:", params)
        } else { // opciones subcommands & groups
            let prop = sub; // donde se van a meter los params
            //console.log("🟢 Params ANTES de opciones subcommands:", params)

            // sacar el subcommand que se va a usar
            let using = this.executedCommand.data.options.find(x => x.name === sub);

            if (!using) { // está dentro de un subgroup
                let _group = this.executedCommand.data.options.find(x => x.name === group)
                using = _group.options.find(x => x.name === sub)

                prop = group // cambiar la prop donde se guardan los params
            }

            //console.log("Using:", using)
            for (const option of using.options) {
                //console.log("option:", option)
                params[prop][option.name] = this.interaction.options.get(option.name);
            }

            //console.log("🟢 Params DESPUES de opciones subcommands:", params)

        }

        for (const prop in params) {
            if (typeof params[prop] === 'undefined') params[prop] = {}
        }

        try {
            await this.#executeCommand(this.interaction, models, params, this.client)
        } catch (err) {
            console.log(err)
        }
    }

    async contextMenuHandler() {
        const commandName = this.interaction.commandName;
        this.executedCommand = this.client.commands.get(commandName);

        const params = this.params;

        params["user"] = this.interaction.targetUser;
        params["message"] = this.interaction.targetMessage;

        try {
            this.#executeCommand(this.interaction, models, params, this.client)
        } catch (err) {
            console.log(err)
        }
    }

    async componentHandler() {
        this.ticket?.handle(this.user, this.doc);
        this.suggestion?.handle(this.user, this.doc);

        switch (this.interaction.customId) {
            case "deleteMessage":
                this.interaction.message.delete();
                break;

            case "bjHelp": {
                const Emojis = this.interaction.client.Emojis;

                let e = new Embed()
                    .defAuthor({ text: "¿Cómo se juega Blackjack?", title: true })
                    .defColor(Colores.verdejeffrey)
                    .defDesc(`**Objetivo**: Consigue vencer a Jeffrey Bot consiguiendo un valor a **21** o lo más cercano a él **SIN PASARTE**.`)
                    .defField("Pedir y Plantarse", `**—** Pedir: Pides una carta a Jeffrey Bot\n**—** Plantarse: No puedes volver a pedir cartas. Es el turno de Jeffrey Bot para jugar.`)
                    .defField("Doblar", `**—** Duplicas tu apuesta actual, pides una carta más y luego te plantas.`)
                    .defField("Dividir", `**—** Sólo se puede usar cuando tus dos primeras cartas tienen el mismo número o letra: las separas en dos manos con la misma apuesta y se agrega una más a cada una.`)
                    .defField("Rendirse", `**—** Sólo te puedes rendir si has jugado menos de 2 veces por partida. Pierdes **lo que se pueda** de la mitad de tu apuesta.`)
                    .defField("Valores de las cartas", `**—** Los ases (${Emojis["1C"]}${Emojis["1H"]}${Emojis["1S"]}${Emojis["1D"]}) pueden valer **1** u **11** dependiendo si este hace que la mano se pase de **21**.
**—** Las cartas que tienen números tienen ese mismo valor.
**—** ${Emojis.JC}${Emojis.QC}${Emojis.KC} y demás valen **10**.`)
                    .defField("El turno de Jeffrey Bot", `**—** Cuando sea el momento de jugar de Jeffrey Bot tomará una carta hasta que llegue a 17 o más.`)
                    .defField("Resultados", `**—** Si las primeras cartas que te tocan dan como resultado **21** ganas automáticamente, sin excepciones.
**—** Si te pasas de **21** pierdes, sin excepciones.
**—** Si el valor de la mano de Jeffrey Bot es la misma que la tuya se termina el juego como empate y no pierdes nada de lo apostado.
**—** Si el valor de la mano de Jeffrey Bot es 21 o menor y mayor que la tuya, pierdes.`);

                try {
                    return await this.interaction.reply({ embeds: [e], ephemeral: true });
                } catch (err) {
                    console.log(err)
                }
            }
            case "rememberBirthday": {
                if (!this.interaction.deferred) await this.interaction.deferReply({ ephemeral: true }).catch(err => console.log(err));

                let msg = this.interaction.message;
                let embed = msg.embeds[0];

                const author_info = embed.data.author.name.split(" ");
                const tag = author_info.find(x => x.includes("#"));

                const member = this.interaction.guild.members.cache.find(x => x.user.tag === tag);

                if (member === this.interaction.member) {
                    return new ErrorEmbed(this.interaction, {
                        type: "execError",
                        data: {
                            command: "reminder",
                            guide: "No puedes recordarte tu mismo cumpleaños"
                        }
                    }).send();
                }

                if (!this.user.hasReminderFor(member.id)) {
                    let confirmation = await Confirmation("Recordar", [
                        `¿Deseas que te envíe un mensaje privado el día del cumpleaños de ${member}?`,
                        `Si no tienes los mensajes privados habilitados para entonces, no se te podrá recordar.`,
                        `Para eliminar el recordatorio sólo tienes que darle de nuevo al botón con mismo usuario.`,
                        `Siempre se te recordará hasta que lo elimines.`,
                        `No sabrán que tienes este recordatorio.`
                    ], this.interaction);
                    if (!confirmation) return;

                    this.user.data.birthday_reminders.push({ id: member.id })
                    await this.user.save();
                } else {
                    let confirmation = await Confirmation("Dejar de recordar", [
                        `¿Ya no quieres que te recuerde del cumpleaños de ${member}?`,
                        `No sabrán que lo hiciste.`
                    ], this.interaction);
                    if (!confirmation) return;

                    this.user.data.birthday_reminders.splice(this.user.getBirthdayReminders().findIndex(x => x.id === member.id), 1)
                    await this.user.save();
                }

                return this.interaction.editReply({ embeds: [new Embed({ type: "success" })] })
            }
            case "yesPoll": {
                let poll = await GlobalDatas.getPoll(this.interaction.message.id);
                if (!poll) return this.interaction.reply({ ephemeral: true, content: "Esta encuesta ya terminó y no puedes seguir votando" })

                poll.pollYes(this.interaction.user.id)
                return this.interaction.reply({ ephemeral: true, embeds: [new Embed({ type: "success", data: { desc: "Se registró tu voto" } })] });
            }

            case "noPoll": {
                let poll = await GlobalDatas.getPoll(this.interaction.message.id);
                if (!poll) return this.interaction.reply({ ephemeral: true, content: "Esta encuesta ya terminó y no puedes seguir votando" })

                poll.pollNo(this.interaction.user.id)
                return this.interaction.reply({ ephemeral: true, embeds: [new Embed({ type: "success", data: { desc: "Se registró tu voto" } })] });
            }

            default:
            //console.log("No hay acciones para el botón con customId", this.interaction.customId);
        }
    }

    async modalHandler() {
        this.suggestion?.handle(this.params.getUser(), this.params.getDoc());
    }

    async #executeCommand(interaction, models, params, client) {
        console.log(`-------- ${interaction.commandName} • por ${interaction.user.id} • en ${interaction.guild.name} (${interaction.guild.id}) ----------`)

        try {
            if (!this.executedCommand) throw new Error(`Se quiso ejecutar un comando pero no se encontró mappeado. ${interaction.commandName}`)
            if (this.executedCommand.category === Categories.DarkShop) {
                if (!this.doc.moduleIsActive("functions.darkshop")) return new ErrorEmbed(interaction, {
                    type: "moduleDisabled"
                }).send({ ephemeral: true });
                // filtro de nivel 5
                let validation = await ValidateDarkShop(this.user, interaction.user);
                if (!validation.valid) return interaction.reply({ embeds: [validation.embed] })
            }

            if (this.executedCommand.category === Categories.Developer) {
                if (!this.#isDev()) return interaction.reply({ ephemeral: true, content: "No puedes usar este comando porque no eres desarrollador de Jeffrey Bot" })
            }

            if (this.slashCooldowns.get(this.identifierCooldown)) {
                let until = moment(this.slashCooldowns.get(this.identifierCooldown)).add(slashCooldown, "ms")

                return interaction.reply({
                    embeds: [
                        new Embed({
                            type: "cooldown",
                            data: {
                                cool: {
                                    mention: time(until.toDate(), "R"),
                                    text: new HumanMs(until).left()
                                }
                            }
                        })
                    ]
                })
            }

            try {
                this.slashCooldowns.set(this.identifierCooldown, new Date())

                setTimeout(() => {
                    this.slashCooldowns.delete(this.identifierCooldown);
                }, slashCooldown)
                await this.executedCommand.execute(interaction, models, params, client);
            } catch (err) {
                console.log("🔴 No se pudo ejecutar el comando")
                console.log(err)

                try {
                    this.#sendErrorEmbed(err);
                } catch (err) { }
            }
        } catch (error) {
            console.error(error);
            try {
                this.#sendErrorEmbed(error);
            } catch (err) { }
        }
    }

    async #sendErrorEmbed(error) {
        let help = error instanceof DiscordAPIError ? new ErrorEmbed(this.interaction, {
            type: "discordLimitation",
            data: {
                action: `/${this.interaction.commandName}`,
                help: error
            }
        }) : new ErrorEmbed(this.interaction, { type: "badCommand", data: { commandName: this.interaction.commandName, error } });

        try {
            this.slashCooldowns.delete(this.identifierCooldown);
            return await help.send()
            //await interaction.reply({ content: null, embeds: [help], ephemeral: true });
        } catch (err) {
            console.log("⚠️ Un comando quiso ser usado y Discord no respondió:", this.client.lastInteraction)
            console.log(err);
        }
    }

    #isDev() {
        return Bases.devIds.find(x => x === this.interaction.user.id);
    }
}

module.exports = Handlers;