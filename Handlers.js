const { BaseInteraction, InteractionType, time, CommandInteraction, MessageComponentInteraction, ModalSubmitInteraction, ContextMenuCommandInteraction, MessageContextMenuCommandInteraction, UserContextMenuCommandInteraction, DiscordAPIError, chatInputApplicationCommandMention, ActionRowBuilder, codeBlock, TextInputStyle } = require("discord.js");

const { Ticket, Suggestion, Button } = require("./src/handlers/");
const { Bases, Colores } = require("./src/resources");
const { ErrorEmbed, Embed, Categories, ValidateDarkShop, Confirmation, HumanMs, Modal, CustomEmbed, CustomTrophy, Enum, ShopTypes, Shop } = require("./src/utils");

const { CommandNotFoundError, ToggledCommandError, DiscordLimitationError, BadCommandError, SelfExec, ModuleDisabledError } = require("./src/errors/");

const JeffreyBotError = require("./src/errors/JeffreyBotError");

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

        if (!this.interaction.inGuild() && !this.#isDev()) return interaction.reply({ ephemeral: true, embeds: [new ErrorEmbed().defDesc("No puedes usar esto en mensajes directos.")] });
        if (this.interaction.client.isOnLockdown && !this.#isDev()) try {
            return await this.interaction.reply({ ephemeral: true, embeds: [new ErrorEmbed().defDesc(`Jeffrey Bot está bloqueado ahora mismo, lamentamos los inconvenientes.`)] });
        } catch (err) {
            console.log(err)
        }

        if (this.interaction.customId?.toUpperCase().includes("TICKET")) this.ticket = new Ticket(this.interaction);
        if (this.interaction.customId?.toUpperCase().includes("SUGGESTION")) this.suggestion = new Suggestion(this.interaction);
        if (this.interaction.customId?.toUpperCase().includes("BUTTON")) this.button = new Button(this.interaction);
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

        this.identifierCooldown = BigInt(this.interaction.user.id) + BigInt(this.interaction.commandId ?? 1);

        this.user = await Users.getWork({ user_id: this.interaction.user.id, guild_id: this.interaction.guild.id })
        this.doc = await Guilds.getWork(this.interaction.guild.id);

        this.params["mongoose_user_doc"] = this.user;
        this.params["mongoose_guild_doc"] = this.doc;

        this.params["getDoc"] = () => { return this.params["mongoose_guild_doc"] }
        this.params["getUser"] = () => { return this.params["mongoose_user_doc"] }

        try {
            switch (this.interaction.type) {
                case InteractionType.ApplicationCommand:
                    if (this.interaction.isChatInputCommand()) return await this.slashHandler();
                    if (this.interaction.isContextMenuCommand()) return await this.contextMenuHandler();
                    break;
                case InteractionType.MessageComponent:
                    return await this.componentHandler();
                case InteractionType.ModalSubmit:
                    return await this.modalHandler();
            }
        } catch (err) {
            this.#handleError(err)
                .catch(e => console.error(e));
        }
    }

    /**
     * Handler de Slash Commands
     */
    async slashHandler() {
        const commandName = this.interaction.commandName;
        this.executedCommand = this.client.commands.get(commandName);

        let toggledQuery = await ToggledCommands.getToggle(commandName);

        if (toggledQuery && !this.#isDev()) throw new ToggledCommandError(this.interaction, toggledQuery);

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

        await this.#executeCommand(this.interaction, models, params, this.client)
    }

    /**
     * Handler de Context Menus
     */
    async contextMenuHandler() {
        const commandName = this.interaction.commandName;
        this.executedCommand = this.client.commands.get(commandName);

        const params = this.params;

        params["user"] = this.interaction.targetUser;
        params["message"] = this.interaction.targetMessage;

        await this.#executeCommand(this.interaction, models, params, this.client)

    }

    /**
     * Handler de componentes de mensajes (Botones)
     */
    async componentHandler() {
        await this.ticket?.handle(this.user, this.doc);
        await this.suggestion?.handle(this.user, this.doc);
        await this.button?.handle(this.doc);

        const splittedId = this.interaction.customId.split("-");
        const { Currency, DarkCurrency } = this.client.getCustomEmojis(this.interaction.guild.id);

        switch (splittedId[0]) {
            case "deleteMessage":
                await this.interaction.message.delete();
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

                return await this.interaction.reply({ embeds: [e], ephemeral: true });
            }
            case "rememberBirthday": {
                if (!this.interaction.deferred) await this.interaction.deferReply({ ephemeral: true })
                const member = this.interaction.guild.members.cache.get(splittedId[1]);

                if (member === this.interaction.member)
                    throw new SelfExec(this.interaction);

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
            case "reqTotalTrophy": {
                const trophyId = splittedId[1];
                await new Modal(this.interaction)
                    .defId(this.interaction.customId)
                    .defTitle("Requerimentos totales: " + trophyId)
                    .addInput({ id: "warns", label: "Warns", placeholder: "Escribe un número entero", style: TextInputStyle.Short })
                    .addInput({ id: "currency", label: Currency.name, placeholder: "Escribe un número entero", style: TextInputStyle.Short })
                    .addInput({ id: "darkcurrency", label: DarkCurrency.name, placeholder: "Escribe un número entero", style: TextInputStyle.Short })
                    .addInput({ id: "blackjack", label: "Blackjacks ganados", placeholder: "Escribe un número entero", style: TextInputStyle.Short })
                    .addInput({ id: "roulette", label: "Roulettes jugados", placeholder: "Escribe un número entero", style: TextInputStyle.Short })
                    .show();
                break;
            }

            case "reqMomentTrophy": {
                const trophyId = splittedId[1];
                await new Modal(this.interaction)
                    .defId(this.interaction.customId)
                    .defTitle("Requerimentos del momento: " + trophyId)
                    .addInput({ id: "currency", label: Currency.name, placeholder: "Escribe un número entero", style: TextInputStyle.Short })
                    .addInput({ id: "darkcurrency", label: DarkCurrency.name, placeholder: "Escribe un número entero", style: TextInputStyle.Short })
                    .show();
                break;
            }

            case "givenMoneyTrophy": {
                const trophyId = splittedId[1];
                await new Modal(this.interaction)
                    .defId(this.interaction.customId)
                    .defTitle("Recompensas de dinero: " + trophyId)
                    .addInput({ id: "currency", label: Currency.name, placeholder: "Escribe un número entero", style: TextInputStyle.Short })
                    .addInput({ id: "darkcurrency", label: DarkCurrency.name, placeholder: "Escribe un número entero", style: TextInputStyle.Short })
                    .show();
                break;
            }

            case "givenBoostTrophy": {
                const trophyId = splittedId[1];
                await new Modal(this.interaction)
                    .defId(this.interaction.customId)
                    .defTitle("Boost de recompensa: " + trophyId)
                    .addInput({ id: "type", label: "Tipo de Boost", placeholder: "Multiplicador: 1 / Probabilidad: 2", style: TextInputStyle.Short })
                    .addInput({ id: "objetive", label: "Objetivo del Boost", placeholder: `${Currency.name}: 1 / EXP: 2 / Todo: 3`, style: TextInputStyle.Short })
                    .addInput({ id: "value", label: "Valor del Boost", placeholder: `Escribe un número positivo`, style: TextInputStyle.Short })
                    .addInput({ id: "duration", label: "Duración del Boost", placeholder: `Ej: 1d, 30m, 60s`, style: TextInputStyle.Short })
                    .show();
                break;
            }

            case "givenItemTrophy": {
                const trophyId = splittedId[1];
                await new Modal(this.interaction)
                    .defId(this.interaction.customId)
                    .defTitle("Item de recompensa: " + trophyId)
                    .addInput({ id: "id", label: "ID del item", placeholder: "Escribe un número entero", style: TextInputStyle.Short })
                    .addInput({ id: "isDarkShop", label: "Es un item de la DarkShop?", placeholder: `Sí: 1 / No: 2`, style: TextInputStyle.Short })
                    .show();
                break;
            }

            case "itemInfo": {
                const itemId = splittedId[1];
                const shopType = Number(splittedId[2]);

                await new Modal(this.interaction)
                    .defId(this.interaction.customId)
                    .defTitle(`Editar item ${itemId} de (${new Enum(ShopTypes).translate(shopType)})`)
                    .addInput({ id: "name", label: "Nuevo nombre", style: TextInputStyle.Short, placeholder: "El nuevo nombre de este item", max: 25 })
                    .addInput({ id: "desc", label: "Nueva descripción", style: TextInputStyle.Paragraph, placeholder: "La nueva descripción de este item", max: 1000 })
                    .show()
                break;
            }

            case "itemPrice": {
                const itemId = splittedId[1];
                const shopType = Number(splittedId[2]);

                await new Modal(this.interaction)
                    .defId(this.interaction.customId)
                    .defTitle(`Editar item ${itemId} de (${new Enum(ShopTypes).translate(shopType)})`)
                    .addInput({ id: "price", label: "Nuevo precio", style: TextInputStyle.Short, placeholder: "El nuevo precio de este item", max: 100 })
                    .addInput({ id: "interest", label: "Nuevo interés", style: TextInputStyle.Short, placeholder: "Subida de precio por compra", max: 100 })
                    .show()
                break;
            }

            default:
            //console.log("No hay acciones para el botón con customId", this.interaction.customId);
        }
    }

    /**
     * Handler de Modals
     */
    async modalHandler() {
        await this.suggestion?.handle(this.params.getUser(), this.params.getDoc());

        const recieved = new Modal(this.interaction).read();
        const splittedId = this.interaction.customId.split("-");
        const customId = splittedId[0];

        switch (customId) {
            case "createCustomEmbed": {
                await this.interaction.deferReply({ ephemeral: true })

                const newEmbed = new CustomEmbed(this.interaction).create(recieved)
                let confirmation = await Confirmation("Nuevo Embed", [
                    "El Embed se verá así:",
                    newEmbed
                ], this.interaction).catch(err => {
                    if (err instanceof DiscordAPIError) {
                        throw new DiscordLimitationError(this.interaction, "Enviar Embed", [
                            "No se podría enviar tu Embed",
                            "Verifica que el Embed tenga sentido y pueda ser creado",
                            codeBlock("js", err)
                        ])
                    }
                })

                if (!confirmation) return;
                return await newEmbed.save();
            }

            case "editCustomEmbed": {
                const id = Number(splittedId[1]);
                await this.interaction.deferReply({ ephemeral: true });

                return await new CustomEmbed(this.interaction).create(recieved).replace(id)
            }

            case "reqTotalTrophy": {
                const id = Number(splittedId[1]);
                await this.interaction.deferReply({ ephemeral: true });

                return await new CustomTrophy(this.interaction).changeTotalReq(id, recieved);
            }

            case "reqMomentTrophy": {
                const id = Number(splittedId[1]);
                await this.interaction.deferReply({ ephemeral: true });

                return await new CustomTrophy(this.interaction).changeMomentReq(id, recieved);
            }

            case "givenMoneyTrophy": {
                const id = Number(splittedId[1]);
                await this.interaction.deferReply({ ephemeral: true });

                return await new CustomTrophy(this.interaction).changeMoneyGiven(id, recieved)
            }

            case "givenBoostTrophy": {
                const id = Number(splittedId[1]);
                await this.interaction.deferReply({ ephemeral: true });

                return await new CustomTrophy(this.interaction).changeBoostGiven(id, recieved)
            }

            case "givenItemTrophy": {
                const id = Number(splittedId[1]);
                await this.interaction.deferReply({ ephemeral: true });

                return await new CustomTrophy(this.interaction).changeItemGiven(id, recieved)
            }

            case "itemPrice":
            case "itemInfo": {
                const id = Number(splittedId[1]);
                const shopType = Number(splittedId[2]);
                await this.interaction.deferReply({ ephemeral: true });

                const shop = await new Shop(this.interaction)
                    .setType(shopType)
                    .build(this.params.getDoc(), this.params.getUser());

                return await shop.editInfo(id, recieved);
            }
        }
    }

    async #executeCommand(interaction, models, params, client) {
        console.log(`-------- ${interaction.commandName} • por ${interaction.user.username} (${interaction.user.id}) • en ${interaction.guild.name} (${interaction.guild.id}) ----------`)

        if (!this.executedCommand) throw new CommandNotFoundError(interaction);
        if (this.executedCommand.category === Categories.DarkShop) {
            if (!this.doc.moduleIsActive("functions.darkshop"))
                throw new ModuleDisabledError(interaction);
            // filtro de nivel 5
            let validation = await ValidateDarkShop(this.user, interaction.user);
            if (!validation.valid) return interaction.reply({ embeds: [validation.embed] })
        }

        if (this.executedCommand.category === Categories.Developer) {
            if (!this.#isDev()) return interaction.reply({ ephemeral: true, content: "No puedes usar este comando porque no eres desarrollador de Jeffrey Bot" })
        }

        if (this.slashCooldowns.get(this.identifierCooldown) && process.env.DEV === "FALSE") {
            let until = moment(this.slashCooldowns.get(this.identifierCooldown)).add(slashCooldown, "ms")
            let cooldownLeft = new HumanMs(until).left(true);
            let c_data = [];

            for (const prop in cooldownLeft) {
                c_data.push(cooldownLeft[prop])
            }

            if (c_data.at(-1) != 0 && c_data.at(-2) === 0) console.log("⚪ Con %sms de Cooldown", cooldownLeft.milisegundo);

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
                ],
                ephemeral: true
            })
        }

        this.slashCooldowns.set(this.identifierCooldown, new Date())

        setTimeout(() => {
            this.slashCooldowns.delete(this.identifierCooldown);
        }, slashCooldown)

        await this.executedCommand.execute(interaction, models, params, client);
    }

    /**
     * 
     * @param {JeffreyBotError | Error} error 
     * @returns 
     */
    async #handleError(error) {
        this.slashCooldowns.delete(this.identifierCooldown);

        try {
            console.log("🔴 No se pudo ejecutar el comando: %s", error.name)
            console.error(error);

            if (error instanceof JeffreyBotError) {
                return await error.send();
            } else if (error instanceof DiscordAPIError) {
                return await new DiscordLimitationError(this.interaction, `${this.interaction.commandName ?? this.interaction.customId ?? "execute"}`, error.message).send();
            } else {
                return await new BadCommandError(this.interaction, error).send();
            }
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