const { BaseInteraction, InteractionType, time, CommandInteraction, MessageComponentInteraction, ModalSubmitInteraction, ContextMenuCommandInteraction, MessageContextMenuCommandInteraction, UserContextMenuCommandInteraction } = require("discord.js");

const { Ticket, Suggestion } = require("./src/handlers/");
const { Bases } = require("./src/resources");
const { ErrorEmbed, Embed, Categories, ValidateDarkShop } = require("./src/utils");

const models = require("mongoose").models;
const { ToggledCommands, Users, Guilds } = models;

class Handlers {
    /**
     * 
     * @param {BaseInteraction | CommandInteraction | MessageComponentInteraction | ModalSubmitInteraction | ContextMenuCommandInteraction | MessageContextMenuCommandInteraction | UserContextMenuCommandInteraction } interaction 
     * @param {Boolean} [init=true]
     */
    constructor(interaction, init = true) {
        this.interaction = interaction
        this.client = this.interaction.client;

        if (init) return this.#startHandler();
    }

    async #startHandler() {
        this.doc = await Guilds.getOrCreate(this.interaction.guild.id);
        this.user = await Users.getOrCreate({ user_id: this.interaction.user.id, guild_id: this.interaction.guild.id })

        if (this.interaction.customId?.toUpperCase().includes("TICKET")) this.ticket = new Ticket(this.interaction);
        if (this.interaction.customId?.toUpperCase().includes("SUGGESTION")) this.suggestion = new Suggestion(this.interaction);

        switch (this.interaction.type) {
            case InteractionType.ApplicationCommand:
                if(this.interaction.isChatInputCommand()) return this.slashHandler();
                if(this.interaction.isContextMenuCommand()) return this.contextMenuHandler();

            case InteractionType.MessageComponent:
                return this.componentHandler();

            case InteractionType.ModalSubmit:
                return this.modalHandler();
        }
    }

    async slashHandler() {
        const commandName = this.interaction.commandName;
        this.executedCommand = this.client.commands.get(commandName);

        let toggledQuery = await ToggledCommands.getToggle(commandName);

        if (toggledQuery /* && author.id != jeffreygID */) {
            let since = time(toggledQuery.since);
            return this.interaction.reply({ content: null, embeds: [new ErrorEmbed({ type: "toggledCommand", data: { commandName, since, reason: toggledQuery.reason } })], ephemeral: true });
        }

        // params
        const params = {};

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
            this.#executeCommand(this.interaction, models, params, this.client)
        } catch (err) {
            console.log(err)
        }
    }

    async contextMenuHandler() {
        const commandName = this.interaction.commandName;
        this.executedCommand = this.client.commands.get(commandName);

        const params = {
            user: this.interaction.targetUser,
            message: this.interaction.targetMessage
        }

        try {
            this.#executeCommand(this.interaction, models, params, this.client)
        } catch (err) {
            console.log(err)
        }
    }

    async componentHandler() {
        this.ticket?.handle();
        this.suggestion?.handle();

        switch (this.interaction.customId) {
            case "deleteMessage":
                interaction.message.delete();
                break;

            case "bjHelp": {
                let error = false;
                try {
                    await interaction.deferReply({ ephemeral: true });
                } catch (err) { error = true }

                const Emojis = interaction.client.Emojis;

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
    **—** Si el valor de la mano de Jeffrey Bot es 21 o menor y mayor que la tuya, pierdes.`)
                    .defFooter({ text: "Gracias UnbelievaBoat#1046, te quiero mucho por favor no me denuncien." })

                return error ? interaction.followUp({ embeds: [e], ephemeral: true }) : interaction.editReply({ embeds: [e] })
            }
            case "rememberBirthday": {
                if (!interaction.deferred) await interaction.deferReply({ ephemeral: true }).catch(err => console.log(err));

                let msg = await interaction.message.fetch();
                let embed = msg.embeds[0];

                const author_info = embed.data.author.name.split(" ");
                const tag = author_info.find(x => x.includes("#"));

                await interaction.guild.members.fetch()

                const member = interaction.guild.members.cache.find(x => x.user.tag === tag);

                if (!user.hasReminderFor(member.id)) {
                    let confirmation = await Confirmation("Recordar", [
                        `¿Deseas que te envíe un mensaje privado el día del cumpleaños de ${member}?`,
                        `Si no tienes los mensajes privados habilitados para entonces, no se te podrá recordar.`,
                        `Para eliminar el recordatorio sólo tienes que darle de nuevo al botón con mismo usuario.`,
                        `Siempre se te recordará hasta que lo elimines.`,
                        `No sabrán que tienes este recordatorio.`
                    ], interaction);
                    if (!confirmation) return;

                    user.data.birthday_reminders.push({ id: member.id })
                    await user.save();
                } else {
                    let confirmation = await Confirmation("Dejar de recordar", [
                        `¿Ya no quieres que te recuerde del cumpleaños de ${member}?`,
                        `No sabrán que lo hiciste.`
                    ], interaction);
                    if (!confirmation) return;

                    user.data.birthday_reminders.splice(user.getBirthdayReminders().findIndex(x => x.id === member.id), 1)
                    await user.save();
                }

                return interaction.editReply({ embeds: [new Embed({ type: "success" })] })
            }

            default:
                //console.log("No hay acciones para el botón con customId", this.interaction.customId);
        }
    }

    async modalHandler() {
        this.suggestion?.handle();
    }

    async #executeCommand(interaction, models, params, client) {
        console.log(`-------- ${interaction.commandName} • por ${interaction.user.id} • en ${interaction.guild.name} (${interaction.guild.id}) ----------`)

        try {
            if(!this.executedCommand) throw new Error(`Se quiso ejecutar un comando pero no se encontró mappeado. ${interaction.commandName}`)
            if (this.executedCommand.category === Categories.DarkShop) {
                if (!this.doc.moduleIsActive("functions.darkshop")) return new ErrorEmbed(interaction, {
                    type: "moduleDisabled"
                }).send({ ephemeral: true });
                // filtro de nivel 5
                let validation = await ValidateDarkShop(this.user, interaction.user);
                if (!validation.valid) return interaction.reply({ embeds: [validation.embed] })
            }

            if (this.executedCommand.category === Categories.Developer) {
                if (!Bases.devIds.find(x => x === interaction.user.id)) return interaction.reply({ ephemeral: true, content: "No puedes usar este comando porque no eres desarrollador de Jeffrey Bot" })
            }
            try {
                await this.executedCommand.execute(interaction, models, params, client);
            } catch(err) {
                console.log("🔴 No se pudo ejecutar el comando")
                console.log(err)
            }
        } catch (error) {
            console.error(error);
            let help = new ErrorEmbed(interaction, { type: "badCommand", data: { commandName: this.interaction.commandName, error } });
            try {
                await help.send()
                //await interaction.reply({ content: null, embeds: [help], ephemeral: true });
            } catch (err) {
                console.log("⚠️ Un comando quiso ser usado y Discord no respondió:", this.client.lastInteraction)
                console.log(err);
            }
        }
    }
}

module.exports = Handlers;