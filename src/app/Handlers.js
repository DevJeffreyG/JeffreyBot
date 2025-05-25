const { BaseInteraction, InteractionType, time, CommandInteraction, MessageComponentInteraction, ModalSubmitInteraction, ContextMenuCommandInteraction, MessageContextMenuCommandInteraction, UserContextMenuCommandInteraction, DiscordAPIError, ActionRowBuilder, codeBlock, TextInputStyle, ButtonBuilder, ButtonStyle, TimestampStyles, hyperlink, DiscordjsErrorCodes, MessageFlags } = require("discord.js");

const { Ticket, Suggestion, Button, ManagePreferences, AutoRole } = require("../handlers");
const { Bases, Colores } = require("../resources");
const { ErrorEmbed, Embed, Categories, ValidateDarkShop, Confirmation, HumanMs, Modal, CustomEmbed, CustomTrophy, Enum, ShopTypes, Shop, PrettyCurrency, MinMaxInt, PrettifyNumber, Collector, MultiplePercentages, ProgressBar, SendDirect, DirectMessageType, CreateInteractionFilter } = require("../utils");

const { CommandNotFoundError, ToggledCommandError, DiscordLimitationError, BadCommandError, SelfExec, ModuleDisabledError, ExecutionError, InsuficientSetupError, EconomyError, PermissionError } = require("../errors");

const JeffreyBotError = require("../errors/JeffreyBotError");

const ms = require("ms");
const moment = require("moment-timezone");
const { Error } = require("mongoose");

const slashCooldown = ms("5s");

const models = require("mongoose").models;
const { Users, Guilds, GlobalDatas, Preferences } = models;

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

        this.user = null;
        this.doc = null;

        if (init) return this.#startHandler();
    }

    async #startHandler() {
        this.params = {}

        if (this.interaction.client.isOnLockdown && !this.#isDev()) try {
            return await this.interaction.reply({ flags: [MessageFlags.Ephemeral], embeds: [new ErrorEmbed().defDesc(`Jeffrey Bot está bloqueado ahora mismo, lamentamos los inconvenientes.`)] });
        } catch (err) {
            console.error("🔴 %s", err);
        }

        if (this.interaction.customId?.toUpperCase().includes("TICKET")) this.ticket = new Ticket(this.interaction);
        if (this.interaction.customId?.toUpperCase().includes("SUGGESTION")) this.suggestion = new Suggestion(this.interaction);
        if (this.interaction.customId?.toUpperCase().includes("BUTTON")) this.button = new Button(this.interaction);
        if (this.interaction.customId?.toUpperCase().includes("PREFERENCES")) this.preferences = new ManagePreferences(this.interaction);
        if (this.interaction.customId?.toUpperCase().includes("AUTOROLE")) this.autorole = new AutoRole(this.interaction);
        if (this.interaction.customId?.toUpperCase().includes("KILL") && this.#isDev()) {
            try {
                const killInfo = this.interaction.customId.split("-");
                const timestamp = Number(killInfo[1]);
                const clientId = killInfo[2];
                if (this.client.readyTimestamp === timestamp && this.client.user.id === clientId) {
                    await this.interaction.deferReply({ flags: [MessageFlags.Ephemeral] }).catch(err => { });
                    console.log("DESTRUYENDO! %s", timestamp)
                    await this.interaction.editReply({ content: "Destruyendo cliente." })
                    this.client.destroy();
                    process.exit(0);
                }
            } catch (err) {
                console.error("🔴 %s", err);
            }

            return;
        }

        this.identifierCooldown = BigInt(this.interaction.user.id) + BigInt(this.interaction.commandId ?? 1);

        if (this.interaction.inGuild()) {
            this.user = await Users.getWork({ user_id: this.interaction.user.id, guild_id: this.interaction.guild.id })
            this.doc = await Guilds.getWork(this.interaction.guild.id);
        }
        this.user_preferences = await Preferences.getWork(this.interaction.user.id);

        this.params["mongoose_user_doc"] = this.user;
        this.params["mongoose_guild_doc"] = this.doc;
        this.params["mongoose_user_preferences"] = this.user_preferences;

        this.params["getDoc"] = () => { return this.params["mongoose_guild_doc"] }
        this.params["getUser"] = () => { return this.params["mongoose_user_doc"] }
        this.params["getPrefs"] = () => { return this.params["mongoose_user_preferences"] }

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

        // Se intenta ejecutar un comando antes de que el bot inicialice la información necesaria
        if (!this.executedCommand) {
            throw new ExecutionError(this.interaction, [
                `${this.client.user.displayName} aún se está iniciando y no puede procesar tu acción`,
                "Intentálo de nuevo."
            ])
        }

        let toggledQuery = this.interaction.client.toggles.commandToggled(commandName);

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
        await this.button?.handle();
        await this.preferences?.handle(this.user_preferences);
        await this.autorole?.handle(this.doc);

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

                return await this.interaction.reply({ embeds: [e], flags: [MessageFlags.Ephemeral] });
            }
            case "rememberBirthday": {
                if (!this.interaction.deferred) await this.interaction.deferReply({ flags: [MessageFlags.Ephemeral] })
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
                if (!poll) return this.interaction.reply({ flags: [MessageFlags.Ephemeral], content: "Esta encuesta ya terminó y no puedes seguir votando" })

                poll.pollYes(this.interaction.user.id)
                return this.interaction.reply({ flags: [MessageFlags.Ephemeral], embeds: [new Embed({ type: "success", data: { desc: "Se registró tu voto" } })] });
            }

            case "noPoll": {
                let poll = await GlobalDatas.getPoll(this.interaction.message.id);
                if (!poll) return this.interaction.reply({ flags: [MessageFlags.Ephemeral], content: "Esta encuesta ya terminó y no puedes seguir votando" })

                poll.pollNo(this.interaction.user.id)
                return this.interaction.reply({ flags: [MessageFlags.Ephemeral], embeds: [new Embed({ type: "success", data: { desc: "Se registró tu voto" } })] });
            }
            case "reqTotalTrophy": {
                if (!this.doc.checkStaff(this.interaction.member))
                    throw new PermissionError(this.interaction);

                const trophyId = splittedId[1];
                await new Modal(this.interaction)
                    .defId(this.interaction.customId)
                    .defTitle("Requerimentos totales: " + trophyId)
                    .addInput({ id: "warns", label: "Warns", placeholder: "Escribe un número entero", style: TextInputStyle.Short })
                    .addInput({ id: "currency", label: `${Currency.name} ganados`, placeholder: "Escribe un número entero", style: TextInputStyle.Short })
                    .addInput({ id: "darkcurrency", label: `${DarkCurrency.name} invertidos`, placeholder: "Escribe un número entero", style: TextInputStyle.Short })
                    .addInput({ id: "blackjack", label: "Blackjacks ganados", placeholder: "Escribe un número entero", style: TextInputStyle.Short })
                    .addInput({ id: "roulette", label: "Roulettes jugados", placeholder: "Escribe un número entero", style: TextInputStyle.Short })
                    .show();
                break;
            }

            case "reqTotalTrophy2": {
                if (!this.doc.checkStaff(this.interaction.member))
                    throw new PermissionError(this.interaction);

                const trophyId = splittedId[1];
                await new Modal(this.interaction)
                    .defId(this.interaction.customId)
                    .defTitle("Requerimentos totales: " + trophyId)
                    .addInput({ id: "subscriptions_currency", label: `${Currency.name} gastados en suscripciones`, placeholder: "Escribe un número entero positivo", style: TextInputStyle.Short })
                    .addInput({ id: "secured_currency", label: `${Currency.name} protegidos`, placeholder: "Escribe un número entero positivo", style: TextInputStyle.Short })
                    .show();
                break;
            }

            case "reqMomentTrophy": {
                if (!this.doc.checkStaff(this.interaction.member))
                    throw new PermissionError(this.interaction);

                const trophyId = splittedId[1];
                await new Modal(this.interaction)
                    .defId(this.interaction.customId)
                    .defTitle("Requerimentos del momento: " + trophyId)
                    .addInput({ id: "currency", label: Currency.name, placeholder: "Escribe un número entero", style: TextInputStyle.Short })
                    .addInput({ id: "darkcurrency", label: DarkCurrency.name, placeholder: "Escribe un número entero", style: TextInputStyle.Short })
                    .addInput({ id: "secured_currency", label: `${Currency.name} protegidos`, placeholder: "Escribe un número entero positivo", style: TextInputStyle.Short })
                    .addInput({ id: "level", label: `Nivel alcanzado`, placeholder: "Escribe un número entero positivo", style: TextInputStyle.Short })
                    .show();
                break;
            }

            case "givenMoneyTrophy": {
                if (!this.doc.checkStaff(this.interaction.member))
                    throw new PermissionError(this.interaction);

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
                if (!this.doc.checkStaff(this.interaction.member))
                    throw new PermissionError(this.interaction);

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
                if (!this.doc.checkStaff(this.interaction.member))
                    throw new PermissionError(this.interaction);

                const trophyId = splittedId[1];
                await new Modal(this.interaction)
                    .defId(this.interaction.customId)
                    .defTitle("Item de recompensa: " + trophyId)
                    .addInput({ id: "id", label: "ID del item", placeholder: "Escribe un número entero", style: TextInputStyle.Short })
                    .addInput({ id: "shopType", label: "Tienda", placeholder: `Tienda: 1 / DarkShop: 2 / Mascotas: 3 / Externa: 4`, style: TextInputStyle.Short })
                    .show();
                break;
            }

            case "itemInfo": {
                if (!this.doc.checkStaff(this.interaction.member))
                    throw new PermissionError(this.interaction);

                const itemId = splittedId[1];
                const shopType = Number(splittedId[2]);

                await new Modal(this.interaction)
                    .defId(this.interaction.customId)
                    .defTitle(`Editar item ${itemId} de (${new Enum(ShopTypes).translate(shopType)})`)
                    .addInput({ id: "name", label: "Nuevo nombre", style: TextInputStyle.Short, placeholder: "El nuevo nombre de este item", max: 25 })
                    .addInput({ id: "desc", label: "Nueva descripción", style: TextInputStyle.Paragraph, placeholder: "La nueva descripción de este item", max: 1000 })
                    .addInput({ id: "canHaveMany", label: "¿Puede tener más de uno en el inventario?", style: TextInputStyle.Short, placeholder: "Sí: 1 / No: 2" })
                    .show()
                break;
            }

            case "itemPrice": {
                if (!this.doc.checkStaff(this.interaction.member))
                    throw new PermissionError(this.interaction);

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

            case "betOption": {
                await this.interaction.deferReply({ flags: [MessageFlags.Ephemeral] });
                if (this.doc.checkStaff(this.interaction.member) && process.env.DEV != "TRUE")
                    throw new PermissionError(this.interaction);

                const index = Number(splittedId[1]);
                const bet = this.doc.data.bets.find(x => x.message_id === this.interaction.message.id);

                // Revisar en caso de que no se haya alcanzado a cerrar
                if (moment().isAfter(bet.closes_in))
                    return await this.interaction.editReply({
                        embeds: [
                            new ErrorEmbed()
                                .defDesc("Ya cerraron las apuestas.")
                        ]
                    })

                // Revisar que no esté en ninguna otra
                let filter = bet.options.filter(x => {
                    return x.betting.find(y => y.user_id === this.interaction.user.id)
                })[0];
                if (filter) {
                    let existingIndex = bet.options.findIndex(x => x._id === filter._id);

                    if (existingIndex != index)
                        throw new ExecutionError(this.interaction, ["Ya apostaste por otra opción, no puedes apostar a otra", "Sube tu apuesta con el botón con la misma opción"]);
                }

                const bettings = bet.options[index].betting;
                let userBetI = bettings.findIndex(x => x.user_id === this.interaction.user.id);
                let userBet = userBetI != -1 ? bettings[userBetI] : { user_id: this.interaction.user.id, quantity: 0 };

                if (userBetI === -1) userBetI = 0;

                const min = this.doc.settings.quantities.limits.bets.staff_bets.min;
                const max = this.doc.settings.quantities.limits.bets.staff_bets.max;

                let valid = MinMaxInt(min, max, { guild: this.interaction.guild, msg: "No se pudieron conseguir las apuestas predeterminadas" });
                if (valid === 0)
                    throw new InsuficientSetupError(this.interaction, "Mínimos y máximo de apuestas", ["Los mínimos y máximos deben ser menores y mayores los unos con los otros"])

                const middleNum = (max - min) / 5;
                let msg = await this.interaction.editReply({
                    embeds: [
                        new Embed()
                            .defTitle("Aumentar apuesta")
                            .defDesc(`Elige cuánto quieres subir tu apuesta actual (${PrettyCurrency(this.interaction.guild, userBet.quantity)})`)
                            .defColor(Colores.verde)
                    ],
                    components: [
                        new ActionRowBuilder()
                            .setComponents(
                                new ButtonBuilder()
                                    .setCustomId(PrettifyNumber(Math.round(min), 0, 3).toLocaleString("es-CO"))
                                    .setLabel(PrettifyNumber(Math.round(min), 0, 3).toLocaleString("es-CO"))
                                    .setEmoji("➕")
                                    .setStyle(ButtonStyle.Secondary),
                                new ButtonBuilder()
                                    .setCustomId(PrettifyNumber(Math.round(middleNum), 0, 3).toLocaleString("es-CO"))
                                    .setLabel(PrettifyNumber(Math.round(middleNum), 0, 3).toLocaleString("es-CO"))
                                    .setEmoji("➕")
                                    .setStyle(ButtonStyle.Secondary),
                                new ButtonBuilder()
                                    .setCustomId(PrettifyNumber(Math.round(middleNum * 2), 0, 3).toLocaleString("es-CO"))
                                    .setLabel(PrettifyNumber(Math.round(middleNum * 2), 0, 3).toLocaleString("es-CO"))
                                    .setEmoji("➕")
                                    .setStyle(ButtonStyle.Primary),
                                new ButtonBuilder()
                                    .setCustomId(PrettifyNumber(Math.round(middleNum * 3), 0, 3).toLocaleString("es-CO"))
                                    .setLabel(PrettifyNumber(Math.round(middleNum * 3), 0, 3).toLocaleString("es-CO"))
                                    .setEmoji("➕")
                                    .setStyle(ButtonStyle.Success),
                                new ButtonBuilder()
                                    .setCustomId("customPush")
                                    .setLabel("Custom")
                                    .setEmoji("🔧")
                                    .setStyle(ButtonStyle.Danger)
                            )
                    ]
                })

                const collector = await new Collector(this.interaction, {
                    filter: CreateInteractionFilter(this.interaction, msg),
                    time: ms("1m"),
                    wait: true
                }, true, false).handle().wait(() => {
                    this.interaction.deleteReply();
                })
                if (!collector) return;

                let customVal = null;
                if (collector.customId === "customPush") {
                    let m = await new Modal(collector)
                        .defUniqueId(collector.customId)
                        .defTitle("Aumentar apuesta")
                        .addInput({ id: "bet", label: "Apuesta", style: TextInputStyle.Short, req: true, min: 1, placeholder: "Número entero positivo" })
                        .show();

                    let c = await collector.awaitModalSubmit({
                        filter: (i) => i.customId === m.customId && i.user.id === this.interaction.user.id,
                        time: ms("1m")
                    }).catch(async err => {
                        if (err.code === DiscordjsErrorCodes.InteractionCollectorError) await interaction.deleteReply();
                        else throw err;
                    });
                    if (!c) return;
                    await c.deferUpdate();

                    customVal = Math.round(new Modal(c).read().bet.replaceAll(".", ""));
                    if (customVal < min)
                        throw new EconomyError(this.interaction, [`Debes apostar un valor mayor a ${PrettyCurrency(this.interaction.guild, min)}`], this.user.getCurrency());
                }
                //await collector.deferUpdate();
                const value = customVal ?? Number(collector.customId.replaceAll(".", ""));
                if (!this.user.affords(value))
                    throw new EconomyError(this.interaction, ["No tienes tanto dinero para apostar"], this.user.getCurrency())

                if (userBet.quantity + value > max)
                    throw new EconomyError(this.interaction, [
                        "No puedes apostar tanto dinero",
                        `Apostaste ya ${PrettyCurrency(this.interaction.guild, userBet.quantity)}`,
                        `El tope es ${PrettyCurrency(this.interaction.guild, max)}`,
                        `Puedes apostar ${PrettyCurrency(this.interaction.guild, (max - userBet.quantity))} para llegar al tope`
                    ], this.user.getCurrency())

                userBet.quantity += value;
                bettings[userBetI] = userBet;

                await this.user.removeCurrency(value);
                await this.user.save();
                await this.interaction.editReply({ embeds: [new Embed({ type: "success" })], components: [] });

                // Actualizar la barra de progreso
                let total = 0;
                let elements = [];
                let embed = new Embed(this.interaction.message.embeds[0])
                embed.data.fields = [];
                let optionsInfo = new Map();
                bet.options.forEach((option, i) => {
                    total += option.betting.length;

                    optionsInfo.set(i, {
                        square: option.square,
                        betting: option.betting,
                        emoji: option.emoji,
                        name: option.name,
                        usersCount: option.betting.length
                    })

                })

                optionsInfo.forEach((actualOption, i) => {
                    let elseBets = 0;
                    let thisBets = 0;

                    optionsInfo.forEach((option) => {
                        if (actualOption != option)
                            option.betting.forEach((bet) => elseBets += bet.quantity);
                        else
                            option.betting.forEach((bet) => thisBets += bet.quantity);
                    })

                    let ratio = Number(((elseBets + thisBets) * (1 / thisBets)).toFixed(3));
                    if (ratio === Infinity || ratio < 0) ratio = 0;
                    bet.options[i].ratio = ratio;

                    embed.defField(`${actualOption.emoji} ${actualOption.name} (1:${ratio.toLocaleString("es-CO")})`, `Usuarios: ${actualOption.usersCount} (${PrettyCurrency(this.interaction.guild, thisBets)})`);
                    elements.push({
                        percentage: actualOption.betting.length / total * 100,
                        square: actualOption.square
                    });
                })

                await this.doc.save();

                let progressbar = MultiplePercentages(elements, 10);
                embed.defDesc(`# ${bet.title}\n### Las apuestas se cierran ${time(bet.closes_in, TimestampStyles.RelativeTime)}\n## ${progressbar}`)

                await this.interaction.message.edit({ embeds: [embed] })
                break;
            }

            case "betWinner": {
                await this.interaction.deferReply({ flags: [MessageFlags.Ephemeral] });
                if (!this.doc.checkStaff(this.interaction.member))
                    throw new PermissionError(this.interaction);

                const index = Number(splittedId[1]);
                const filter = x => x.message_id === this.interaction.message.id;
                const bet = this.doc.data.bets.find(filter);
                const betIndex = this.doc.data.bets.findIndex(filter);
                const loserOptions = bet.options.slice();
                loserOptions.splice(index, 1);
                const winnerOption = bet.options[index];

                let confirmation = await Confirmation("Declarar ganador", [
                    `Los usuarios (\`${winnerOption.betting.length}\`) que hayan apostado por esta opción recibirán el dinero de las apuestas de las otras.`,
                    "Esta acción no se puede deshacer."
                ], this.interaction)
                if (!confirmation) return;

                const winnerTotal = winnerOption.betting.map(x => x.quantity).reduce((prev, cur) => prev + cur, 0)
                const loserTotal = loserOptions.flatMap(x => x.betting).map(x => x.quantity).reduce((prev, cur) => prev + cur, 0)

                // Devolver el dinero a los ganadores
                for await (const winner of winnerOption.betting) {
                    let u = await Users.getWork({ user_id: winner.user_id, guild_id: this.interaction.guildId });
                    const winningProportion = winner.quantity / winnerTotal;
                    const won = (winnerTotal + loserTotal) * (winningProportion);

                    console.log("%s ganó %s Currency", u.user_id, won);

                    await u.addCurrency(won);
                }

                this.doc.data.bets.splice(betIndex, 1);

                await this.interaction.message.edit({
                    components: [], embeds: [
                        new Embed(this.interaction.message.embeds[0])
                            .defDesc(`# ${bet.title}: ${winnerOption.name}\n## ${ProgressBar(100, { fullChr: winnerOption.square })}
### Se repartieron ${PrettyCurrency(this.interaction.guild, loserTotal)}.`)
                    ]
                })
                await this.interaction.editReply({ embeds: [new Embed({ type: "success" })] })
                await this.doc.save();
                break;
            }

            case "betCancel": {
                await this.interaction.deferReply({ flags: [MessageFlags.Ephemeral] })
                if (!this.doc.checkStaff(this.interaction.member))
                    throw new PermissionError(this.interaction);

                let confirmation = await Confirmation("Cancelar apuesta", [
                    `Se devolverán los ${Currency.name} a todos los usuarios que apostaron.`,
                    `Se les enviará un mensaje directo diciéndoles que se agregó dinero a su cuenta.`,
                    `No habrá ganador.`
                ], this.interaction);
                if (!confirmation) return;

                const filter = x => x.message_id === this.interaction.message.id;
                const bet = this.doc.data.bets.find(filter);
                const betIndex = this.doc.data.bets.findIndex(filter);

                for (const option of bet.options) {
                    for await (const user of option.betting) {
                        const member = this.interaction.guild.members.cache.get(user.user_id);
                        const userDoc = await Users.getWork({ user_id: user.user_id, guild_id: this.interaction.guildId });

                        try {
                            await userDoc.addCurrency(user.quantity);
                            await SendDirect(this.interaction, member, DirectMessageType.Incomes, {
                                embeds: [
                                    new Embed()
                                        .defColor(Colores.verde)
                                        .defDesc(`**—** Se agregaron ${PrettyCurrency(this.interaction.guild, user.quantity)}.
**—** El STAFF canceló una ${hyperlink("apuesta", this.interaction.message.url)} en la que participaste.`)
                                ]
                            })
                        } catch (err) {
                            if (err instanceof JeffreyBotError) console.error("🔴 %s", err.message());
                            else throw err;
                        }
                    }
                }

                await this.interaction.editReply({ embeds: [new Embed({ type: "success" })] });

                await this.interaction.message.edit({
                    embeds: [
                        new Embed(this.interaction.message.embeds[0])
                            .defDesc(`## ${bet.title}: El STAFF canceló esta apuesta\n### Todos los ${Currency.name} fueron reembolsados.`)
                            .defColor(Colores.rojo)
                    ],
                    components: []
                })

                this.doc.data.bets.splice(betIndex, 1);
                await this.doc.save();

                break;
            }

            case "betClose": {
                await this.interaction.deferReply({ flags: [MessageFlags.Ephemeral] })
                if (!this.doc.checkStaff(this.interaction.member))
                    throw new PermissionError(this.interaction);

                let confirmation = await Confirmation("Cerrar apuesta", [
                    `Los usuarios no podrán seguir apostando`,
                    `El mensaje se actualizará en unos segundos`
                ], this.interaction);
                if (!confirmation) return;

                const filter = x => x.message_id === this.interaction.message.id;
                const betIndex = this.doc.data.bets.findIndex(filter);

                this.doc.data.bets[betIndex].closes_in = new Date();
                await this.doc.save();
                await this.interaction.editReply({ embeds: [new Embed({ type: "success" })] });

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
                let identifier = splittedId[1]
                await this.interaction.deferReply({ flags: [MessageFlags.Ephemeral] })

                const newEmbed = new CustomEmbed(this.interaction).create(recieved, identifier)
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
                await this.interaction.deferReply({ flags: [MessageFlags.Ephemeral] });

                return await new CustomEmbed(this.interaction).create(recieved).replace(id)
            }

            case "reqTotalTrophy2":
            case "reqTotalTrophy": {
                const id = Number(splittedId[1]);
                await this.interaction.deferReply({ flags: [MessageFlags.Ephemeral] });

                return await new CustomTrophy(this.interaction).changeTotalReq(id, recieved);
            }

            case "reqMomentTrophy": {
                const id = Number(splittedId[1]);
                await this.interaction.deferReply({ flags: [MessageFlags.Ephemeral] });

                return await new CustomTrophy(this.interaction).changeMomentReq(id, recieved);
            }

            case "givenMoneyTrophy": {
                const id = Number(splittedId[1]);
                await this.interaction.deferReply({ flags: [MessageFlags.Ephemeral] });

                return await new CustomTrophy(this.interaction).changeMoneyGiven(id, recieved)
            }

            case "givenBoostTrophy": {
                const id = Number(splittedId[1]);
                await this.interaction.deferReply({ flags: [MessageFlags.Ephemeral] });

                return await new CustomTrophy(this.interaction).changeBoostGiven(id, recieved)
            }

            case "givenItemTrophy": {
                const id = Number(splittedId[1]);
                await this.interaction.deferReply({ flags: [MessageFlags.Ephemeral] });

                return await new CustomTrophy(this.interaction).changeItemGiven(id, recieved)
            }

            case "itemPrice":
            case "itemInfo": {
                const id = Number(splittedId[1]);
                const shopType = Number(splittedId[2]);
                await this.interaction.deferReply({ flags: [MessageFlags.Ephemeral] });

                const shop = await new Shop(this.interaction)
                    .setType(shopType)
                    .build(this.params.getDoc(), this.params.getUser());

                return await shop.editInfo(id, recieved);
            }
        }
    }

    async #executeCommand(interaction, models, params, client) {
        console.log(`-------- ${interaction.commandName} • por ${interaction.user.username} (${interaction.user.id}) • en ${interaction.guild?.name ?? "NO SERVER"} (${interaction.guild?.id ?? "NO SERVER"}) ----------`)

        if (!this.executedCommand) throw new CommandNotFoundError(interaction);
        if (!this.interaction.inGuild() && this.executedCommand.category != Categories.DM) return interaction.reply({ flags: [MessageFlags.Ephemeral], embeds: [new ErrorEmbed().defDesc("No puedes usar esto en mensajes directos.")] });
        else if (this.interaction.inGuild() && this.executedCommand.category === Categories.DM && !this.#isDev()) return interaction.reply({ flags: [MessageFlags.Ephemeral], embeds: [new ErrorEmbed().defDesc("Usa este comando en los mensajes directos con el bot.")] })

        if (this.executedCommand.category === Categories.DarkShop) {
            if (!this.doc.moduleIsActive("functions.darkshop"))
                throw new ModuleDisabledError(interaction);
            // filtro de nivel 5
            let validation = await ValidateDarkShop(this.user, interaction.user);
            if (!validation.valid) return interaction.reply({ embeds: [validation.embed] })
        }

        if (this.executedCommand.category === Categories.Developer && !this.#isDev())
            return interaction.reply({ flags: [MessageFlags.Ephemeral], content: "No puedes usar este comando porque no eres desarrollador de Jeffrey Bot" })

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
                flags: [MessageFlags.Ephemeral]
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

            if (error instanceof JeffreyBotError) {
                return await error.send();
            } else if (error instanceof DiscordAPIError) {
                return await new DiscordLimitationError(this.interaction, `${this.interaction.commandName ?? this.interaction.customId ?? "execute"}`, error.message).send();
            } else if (error instanceof Error.VersionError) {
                return await new JeffreyBotError(this.interaction, [
                    "Ocurrió un error intentando actualizar la base de datos",
                    "Puede que se hayan perdido datos..."
                ]).send();
            } else {
                console.error(error);
                return await new BadCommandError(this.interaction, error).send();
            }
        } catch (err) {
            console.log("⚠️ Un comando quiso ser usado y Discord no respondió:", this.client.lastInteraction)
            console.error("🔴 %s", err);
        }
    }

    #isDev() {
        return Bases.devIds.find(x => x === this.interaction.user.id);
    }
}

module.exports = Handlers;