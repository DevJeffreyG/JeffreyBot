const Embed = require("./Embed");
const Colores = require("../resources/colores.json");
const Config = require("../resources/base.json");
const Emojis = require("../resources/emojis.json");

const { CommandInteraction } = require("discord.js");

class ErrorEmbed extends Embed {
    /**
     * @param {CommandInteraction} inter - La interacción principal dada
     * @param {Object} options La configuración de este ErrorEmbed {type, data}
     * @param {string} options.type ### El tipo de ErrorEmbed que va a ser
     * - commandNotFound
     * - toggledCommand
     * - badCommands
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
     * @param {string} options.data - La información que tiene este tipo
     * @description Creación de un ErrorEmbed
     */
    constructor(inter = null, options) {
        super()
        if(inter && inter instanceof CommandInteraction === false) {
            options = inter;
            inter = null;
        }
        
        if(inter) this.interaction = inter;
        else console.log("❗ Considera usando ErrorEmbed.send()")

        this.options = options;
        this.#setup(options)
    }

    #setup(options){
        this.defColor(Colores.rojo)

        if(!options) return this.#customError();

        const { type, data } = options;

        switch(type){
            case "commandNotFound":
                this.#errorAuthor(1);
                this.#errorDesc("No se pudo encontrar el comando", `(\`/${data}\`)`)
                this.defFooter({text: `Usa el comando /ayuda para ver todos los comandos del bot`})
                break;

            case "toggledCommand":
                this.#errorAuthor(2);
                this.#errorDesc("Este comando está deshabilitado", `(\`/${data.commandName}\`)`, [`**${data.reason}** desde ${data.since}`])
                break;

            case "badCommand":
                this.#errorAuthor(3);
                this.#errorDesc("Jeffrey es tonto, y por eso hubo un error ejecutando este comando", `(\`/${data.commandName}\`)`, ["Por favor, avísale de su grado de inservibilidad.", `**Y también dile que...**
\`\`\`js
${data.error}
\`\`\``])
                break;

            case "selfRep":
                this.#errorAuthor(4);
                this.#errorDesc("No puedes darte un punto de reputación a ti mismo", data)
                break;

            case "insuficientSetup":
                this.#errorAuthor(5);
                this.#errorDesc("No se puede usar este comando sin antes configurar el bot", `\`${data.dataSearch.toUpperCase()}\``, [`Un administrador del servidor tiene que usar el comando \`/setup\` primero.`])
                this.defFooter({text: `Si aún no lo han hecho, muéstrales este mensaje.`});
                break;

            case "commandError":
                this.#errorAuthor(6);
                this.#errorDesc("Podrías usar este comando, pero Jeffrey es tonto", `\`${data.id}\``, [`**▸ También dile que...**
\`\`\`json
{ FATAL ERROR, ID ${data.id}, UNKNOWN "${data.unknown}" }
\`\`\``])
                break;

            case "notSent":
                this.#errorAuthor(7);
                this.#errorDesc("No pude enviar el mensaje al usuario por privado", data.tag, [data.error])
                break;
                
            case "badParams":
                this.#errorAuthor(8)
                this.#errorDesc("No puedes ejecutar ese comando así", data.help)
                break;
            
            case "alreadyExists":
                this.#errorAuthor(9)
                this.#errorDesc("No se pudo completar la acción", data.action, [`${data.existing} ya existe en ${data.context ?? "este medio"}.`])
                break;

            case "doesntExist":
                this.#errorAuthor(10)
                this.#errorDesc("No se pudo completar la acción", data.action, [`${data.missing} no existe en ${data.context ?? "este medio"}.`])
                break;

            case "errorFetch":
                this.#errorAuthor(11)
                this.#errorDesc("No se pudo obtener la información", data.type, [data.guide])
                break;

            case "discordLimitation":
                this.#errorAuthor(12)
                this.#errorDesc("Discord no me deja hacer eso", data.action, [data.help])
                break;

            case "economyError":
                this.#errorAuthor(13)
                this.#errorDesc("Error en la transacción", data.action, [data.error, `Tienes: **${data.darkshop ? Emojis.Dark : Emojis.Jeffros}${data.money.toLocaleString('es-CO')}**`])
                break;

            case "execError":
                this.#errorAuthor(14)
                this.#errorDesc("Error al ejecutar el comando", data.command, [data.guide])
                break;

            default:
                console.error("⚠️🔴 No existe %s como tipo de Error ❗❗", type);
        }
    }

    #customError(){
        this.defAuthor({text: "Error", icon: Config.errorPng});
    }

    #errorAuthor(errorNumber){
        this.defAuthor({text: `Error ${errorNumber} — ${this.options.type}`, icon: Config.errorPng})
        return this;
    }

    #errorDesc(desc, principal, more = []){
        this.defDesc(`**— ${desc} ▸ ${principal}**`);
        let d = this.description;

        more.forEach(data => {
            d += `\n▸ ${data}`
        })

        this.defDesc(d);
    }

    send(){
        if(!this.interaction) return console.error("🔴 NO EXISTE this.interaction !!")
        else
        try {
            return this.interaction.editReply({content: null, embeds: [this], components: []});
        } catch (err) {
            console.log("🔴 NO se envió el ErrorEmbed!")
            console.log(err);
        }
    }
}

module.exports = ErrorEmbed