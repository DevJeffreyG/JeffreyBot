const Embed = require("./Embed");
const Colores = require("../resources/colores.json");
const { BaseInteraction, GuildChannel, codeBlock, Guild, MessageFlags } = require("discord.js");

class ErrorEmbed extends Embed {
    /**
     * ### Creación de un ErrorEmbed
     * @param {BaseInteraction | GuildChannel} inter - La interacción principal dada
     * @param {{type: string, data: string}} options La configuración de este ErrorEmbed
     */
    constructor(inter = null, options, ignorewarnings = false) {
        super()
        if (inter && !(inter instanceof BaseInteraction) && !(inter instanceof GuildChannel) && !(inter instanceof Guild)) {
            options = inter;
            inter = null;
        }

        if (inter) this.interaction = inter;
        else if (!ignorewarnings && options) console.log("❗ Considera usando ErrorEmbed.send()", options)

        this.options = options;
        this.#setup(options)
    }

    #setup(options) {
        this.defColor(Colores.rojo)

        if (this.interaction?.client) this.client = this.interaction.client;
        else this.client = require("../index")

        if (!options) return this.#customError();

        const { type, data } = options;

        try {
            var { DarkCurrency, Currency } = this.client.getCustomEmojis(data?.guildId ?? this.interaction?.guild?.id) || this.client.Emojis
        } catch (err) {
            return console.log("🔴 No está el cliente... aún.");
        }

        switch (type) {
            case "CommandNotFound":
                this.#errorName("No existe")
                this.#errorAuthor(1);
                this.#errorDesc("No se pudo encontrar el comando", `(\`/${data}\`)`)
                this.defFooter({ text: `Usa el comando /ayuda para ver todos los comandos del bot` })
                break;

            case "ToggledCommand":
                this.#errorName("Comando deshabilitado")
                this.#errorAuthor(2);
                this.#errorDesc("Este comando está deshabilitado", `(\`/${data.commandName ?? this.interaction?.commandName}\`)`, [`**${data.reason}** desde ${data.since}`])
                break;

            case "BadCommand":
                // TODO: ¿Hacer que se guarde en la base de datos, y con un dev command ver los últimos crasheos?
                this.#errorName("Error en el codigo")
                this.#errorAuthor(3);
                this.#errorDesc("Hubo un error inesperado ejecutando este comando", `(\`${data.commandName ?? this.interaction?.commandName}\`)`, ["Avísale a Jeffrey.", `**Y envíale esto:**
|| ${codeBlock("js", data.error.stack)} ||`])
                break;

            case "SelfExec":
                this.#errorName("Auto Command")
                this.#errorAuthor(4);
                this.#errorDesc("No puedes usar esto en ti mismo", this.interaction.member)
                break;

            case "InsuficientSetup":
                this.#errorName("No se ha configurado")
                this.#errorAuthor(5);
                this.#errorDesc("Hay que configurar el bot antes", `\`${data.needed.toUpperCase()}\``, data.guide ?? [`Un administrador del servidor tiene que usar el comando ${this.client.mentionCommand("setup")} primero.`, `O el comando ${this.client.mentionCommand("config")} en su defecto.`])
                if (!data.guide) this.defFooter({ text: `Si aún no lo han hecho, muéstrales este mensaje.` });
                break;

            case "DMNotSent":
                this.#errorName("No se envió")
                this.#errorAuthor(7);
                this.#errorDesc("No se pudo enviar el mensaje al usuario por privado", data.tag, data.error)
                break;

            case "BadParams":
                this.#errorName("Mala ejecución")
                this.#errorAuthor(8)
                this.#errorDesc("No puedes ejecutar ese comando así", data.commandName, data.help)
                break;

            case "AlreadyExists":
                this.#errorName("Ya existe")
                this.#errorAuthor(9)
                this.#errorDesc("No se pudo completar la acción", data.commandName, [`${data.existing} ya existe en ${data.context ?? "este medio"}.`])
                break;

            case "DoesntExists":
                this.#errorName("No existe")
                this.#errorAuthor(10)
                this.#errorDesc("No se pudo completar la acción", data.commandName, [`${data.missing} no existe en ${data.context ?? "este medio"}.`])
                break;

            case "FetchError":
                this.#errorName("No encontrado")
                this.#errorAuthor(11)
                this.#errorDesc("No se pudo obtener la información", data.type, data.guide)
                break;

            case "DiscordLimitation":
                this.#errorName("Límite de Discord")
                this.#errorAuthor(12)
                this.#errorDesc("Discord no me deja hacer eso", data.action, data.help)
                break;

            case "EconomyError":
                this.#errorName("Error económico")
                this.#errorAuthor(13)
                this.#errorDesc("Error en la transacción", data.commandName, [...data.error, `Tienes: **${data.darkshop ? DarkCurrency : Currency}${data.money.toLocaleString('es-CO')}**`])
                break;

            case "ExecutionError":
                this.#errorName("Error en ejecución")
                this.#errorAuthor(14)
                this.#errorDesc("Error al ejecutar el comando", data.command ?? this.interaction?.commandName, data.guide)
                break;

            case "ModuleBanned":
                this.#errorName("Baneado")
                this.#errorAuthor(15)
                this.#errorDesc("Has sido limitado por los administradores", "No puedes usar este comando/funcionalidad")
                break;

            case "ModuleDisabled":
                this.#errorName("Deshabilitado")
                this.#errorAuthor(16)
                this.#errorDesc("No puedes usar eso", "los administradores han deshabilitado esta funcionalidad.")
                break;

            case "PermissionError":
                this.#errorName("Denegado")
                this.#errorAuthor(18)
                this.#errorDesc("No puedes usar eso", "No tienes los permisos necesarios.")
                break;

            case "BadSetup":
                this.#errorName("Mala configuración")
                this.#errorAuthor(19)
                this.#errorDesc("Hay un error en la configuración del bot", "Avísa a los administradores", data.guide)
                break;

            case "AlreadyUsing":
                this.#errorName("En uso")
                this.#errorAuthor(20)
                this.#errorDesc("Ya está en progreso", data.guide)
                break;

            case "JeffreyBotError":
                this.#errorName("Error de Jeffrey Bot")
                this.#errorAuthor(21)
                this.#errorDesc(data.message, data.commandName ?? this.interaction?.commandName ?? "⚠️", data.guide)
                break;

            default:
                console.log(options)
                console.error("⚠️🔴 No existe %s como tipo de Error ❗❗", type);
        }
    }

    #customError() {
        this.defAuthor({ text: "Error", icon: this.client.EmojisObject.Error.url });
    }

    #errorName(name) {
        this.errorName = name;
        return this
    }

    #errorAuthor(errorNumber) {
        this.errorNumber = errorNumber
        this.defAuthor({ text: `Error ${errorNumber} — ${this.errorName ?? this.options.type}`, icon: this.client.EmojisObject.Error.url })
        return this;
    }

    #errorDesc(desc, principal, more = []) {
        this.defDesc(`**— ${desc} ▸ ${principal}**`);
        this.fillDesc(more);
    }

    async send(options = { ephemeral: false, followup: false }) {
        const { ephemeral, followup } = options;

        if (this.interaction instanceof GuildChannel) return this.sendToChannel();
        if (!this.interaction) return console.error("🔴 NO EXISTE this.interaction !!")
        if (this.interaction instanceof Guild) console.log("🔴 INTERACTION ES DE TIPO GUILD");
        else

            if (ephemeral && !followup) {
                try {
                    return await this.interaction.reply({ content: null, embeds: [this], components: [], flags: [MessageFlags.Ephemeral] })
                } catch (err) {
                    console.log("Oops!")
                    console.error("🔴 %s", err);
                }
            } else if (followup) {
                try {
                    return await this.interaction.followUp({ content: null, embeds: [this], components: [], flags: [...(ephemeral ? [MessageFlags.Ephemeral] : [])] })
                } catch (err) {
                    console.log("Oops!")
                    console.error("🔴 %s", err);
                }
            }

        try {
            await this.interaction.editReply({ content: null, embeds: [this], components: [] });
        } catch (err) {
            try {
                await this.interaction.reply({ content: null, embeds: [this], components: [], flags: [MessageFlags.Ephemeral] });
            } catch (replyerr) {
                try {
                    await this.interaction.followUp({ content: null, embeds: [this], components: [], flags: [MessageFlags.Ephemeral] })
                } catch (followuperr) {
                    console.log(followuperr);
                    console.log("🔴 NO se envió el ErrorEmbed!")
                }
            }
        }
    }

    async sendToChannel() {
        this.interaction.send({ content: null, embeds: [this], components: [] });
    }
}

module.exports = ErrorEmbed