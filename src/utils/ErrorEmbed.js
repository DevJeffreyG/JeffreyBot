const Embed = require("./Embed");
const Colores = require("../resources/colores.json");
const { BaseInteraction, GuildChannel, codeBlock } = require("discord.js");

class ErrorEmbed extends Embed {
    /**
     * @param {BaseInteraction | GuildChannel} inter - La interacción principal dada
     * @param {Object} options La configuración de este ErrorEmbed {type, data}
     * @param {string} options.type ### El tipo de ErrorEmbed que va a ser
     * - commandNotFound
     * - toggledCommand
     * - badCommand
     * - badFunction
     * - selfRep
     * - insuficientSetup
     * - commandError
     * - notSent
     * - badParams
     * - alreadyExists
     * - doesntExist
     * - errorFetch
     * - discordLimitation
     * - economyError
     * - execError
     * - moduleBanned
     * - moduleDisabled
     * - notPerms
     * @param {string} options.data - La información que tiene este tipo
     * @description Creación de un ErrorEmbed
     */
    constructor(inter = null, options, ignorewarnings = false) {
        super()
        if (inter && inter instanceof BaseInteraction === false && !inter instanceof GuildChannel) {
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
        else this.client = require("../../index")

        if (!options) return this.#customError();

        const { type, data } = options;

        try {
            var { DarkCurrency, Currency } = this.client.getCustomEmojis(data?.guildId ?? this.interaction?.guild?.id) || this.client.Emojis
        } catch (err) {
            return console.log("🔴 No está el cliente... aún.");
        }

        switch (type) {
            case "commandNotFound":
                this.#errorName("No existe")
                this.#errorAuthor(1);
                this.#errorDesc("No se pudo encontrar el comando", `(\`/${data}\`)`)
                this.defFooter({ text: `Usa el comando /ayuda para ver todos los comandos del bot` })
                break;

            case "toggledCommand":
                this.#errorName("Comando deshabilitado")
                this.#errorAuthor(2);
                this.#errorDesc("Este comando está deshabilitado", `(\`/${data.commandName ?? this.interaction?.commandName}\`)`, [`**${data.reason}** desde ${data.since}`])
                break;

            case "badCommand":
                this.#errorName("Error en el codigo")
                this.#errorAuthor(3);
                this.#errorDesc("Jeffrey es tonto, y por eso hubo un error ejecutando este comando", `(\`/${data.commandName ?? this.interaction?.commandName}\`)`, ["Por favor, avísale de su grado de inservibilidad.", `**Y también dile que...**
${codeBlock("javascript", data.error)}`])
                break;

            case "selfRep":
                this.#errorName("Auto rep")
                this.#errorAuthor(4);
                this.#errorDesc("No puedes darte un punto de reputación a ti mismo", data)
                break;

            case "insuficientSetup":
                this.#errorName("No se ha configurado")
                this.#errorAuthor(5);
                this.#errorDesc("No se puede usar esta funcionalidad sin antes configurar el bot", `\`${data.needed.toUpperCase()}\``, [`Un administrador del servidor tiene que usar el comando \`/setup\` primero.`, `O el comando \`/config\` en su defecto.`])
                this.defFooter({ text: `Si aún no lo han hecho, muéstrales este mensaje.` });
                break;

            case "commandError":
                this.#errorName("Error de comando")
                this.#errorAuthor(6);
                this.#errorDesc("Podrías usar este comando, pero Jeffrey es tonto", `\`${data.id}\``, [`**▸ También dile que...**
${codeBlock("json", `{ FATAL ERROR, ID ${data.id}, UNKNOWN "${data.unknown}`)}`])
                break;

            case "notSent":
                this.#errorName("No se envió")
                this.#errorAuthor(7);
                this.#errorDesc("No pude enviar el mensaje al usuario por privado", data.tag, [data.error])
                break;

            case "badParams":
                this.#errorName("Mala ejecución")
                this.#errorAuthor(8)
                this.#errorDesc("No puedes ejecutar ese comando así", data.help)
                break;

            case "alreadyExists":
                this.#errorName("Ya existe")
                this.#errorAuthor(9)
                this.#errorDesc("No se pudo completar la acción", data.action, [`${data.existing} ya existe en ${data.context ?? "este medio"}.`])
                break;

            case "doesntExist":
                this.#errorName("No existe")
                this.#errorAuthor(10)
                this.#errorDesc("No se pudo completar la acción", data.action, [`${data.missing} no existe en ${data.context ?? "este medio"}.`])
                break;

            case "errorFetch":
                this.#errorName("No encontrado")
                this.#errorAuthor(11)
                this.#errorDesc("No se pudo obtener la información", data.type, [data.guide])
                break;

            case "discordLimitation":
                this.#errorName("Límite de Discord")
                this.#errorAuthor(12)
                this.#errorDesc("Discord no me deja hacer eso", data.action, [data.help])
                break;

            case "economyError":
                this.#errorName("Mala transacción")
                this.#errorAuthor(13)
                this.#errorDesc("Error en la transacción", data.action, [data.error, `Tienes: **${data.darkshop ? DarkCurrency : Currency}${data.money.toLocaleString('es-CO')}**`])
                break;

            case "execError":
                this.#errorAuthor(14)
                this.#errorDesc("Error al ejecutar el comando", data.command ?? this.interaction?.commandName, [data.guide])
                break;

            case "moduleBanned":
                this.#errorName("Baneado")
                this.#errorAuthor(15)
                this.#errorDesc("Has sido limitado por los administradores", "No puedes usar este comando/funcionalidad")
                break;

            case "moduleDisabled":
                this.#errorName("Deshabilitado")
                this.#errorAuthor(16)
                this.#errorDesc("No puedes usar eso", "los administradores han deshabilitado esta funcionalidad.")
                break;

            case "badFunction":
                this.#errorName("Error en el codigo")
                this.#errorAuthor(17);
                this.#errorDesc("Jeffrey es tonto, y por eso hubo un error ejecutando esta función", `(\`${this.interaction.type}\`)`, ["Por favor, avísale de su grado de inservibilidad.", `**Y también dile que...**
${codeBlock("javascript", data.error)}`])
                break;

            case "notPerms":
                this.#errorName("Denegado")
                this.#errorAuthor(18)
                this.#errorDesc("No puedes usar eso", "No tienes los permisos necesarios.")
                break;

            default:
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
        let d = this.description;

        more.forEach(data => {
            d += `\n▸ ${data}`
        })

        this.defDesc(d);
    }

    async send(options = { ephemeral: false, followup: false }) {
        const { ephemeral, followup } = options;

        if (this.interaction instanceof GuildChannel) return this.sendToChannel();
        if (!this.interaction) return console.error("🔴 NO EXISTE this.interaction !!")
        else

            if (ephemeral && !followup) {
                try {
                    return await this.interaction.reply({ content: null, embeds: [this], components: [], ephemeral: true })
                } catch (err) {
                    console.log("Oops!")
                    console.log(err)
                }
            } else if (followup) {
                try {
                    return await this.interaction.followUp({ content: null, embeds: [this], components: [], ephemeral: ephemeral })
                } catch (err) {
                    console.log("Oops!")
                    console.log(err)
                }
            }

        try {
            await this.interaction.editReply({ content: null, embeds: [this], components: [] });
        } catch (err) {
            try {
                await this.interaction.reply({ content: null, embeds: [this], components: [], ephemeral: true });
            } catch (replyerr) {
                console.log("🔴 NO se envió el ErrorEmbed!")
            }
            console.log(err);
        }
    }

    async sendToChannel() {
        this.interaction.send({ content: null, embeds: [this], components: [] });
    }
}

module.exports = ErrorEmbed