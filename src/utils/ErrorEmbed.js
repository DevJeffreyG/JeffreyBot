const Embed = require("./Embed");
const Colores = require("../resources/colores.json");
const Config = require("../resources/base.json");

class ErrorEmbed extends Embed {
    /**
     * 
     * @param {Object} options La configuración de este ErrorEmbed {type, data}
     */
    constructor(options) {
        super()
        this.options = options;
        this.#setup(options)
    }

    #setup(options){
        this.defColor(Colores.rojo)

        const { type, data } = options;

        switch(type){
            case "commandNotFound":
                this.#errorAuthor(1);
                this.defDesc(`**▸ No se pudo encontrar el comando** ▸ (\`/${data}\`)`)
                this.defFooter({text: `Usa el comando /ayuda para ver todos los comandos del bot`})
                break;

            case "toggledCommand":
                this.#errorAuthor(2);
                this.defDesc(`**▸ Este comando está deshabilitado** ▸ (\`/${data.commandName}\`)\n**${data.reason}** desde ${data.since}`)
                break;

            case "badCommand":
                this.#errorAuthor(3);
                this.defDesc(`**▸ Jeffrey es tonto, y por eso hubo un error ejecutando este comando** ▸ (\`/${data.commandName}\`)\nPor fa, avísale de su grado de inservibilidad. **(ni siquiera sé si esa palabra existe...)**
**▸ También dile que...**
\`\`\`js
${data.error}
\`\`\``)
                break;

            case "selfRep":
                this.#errorAuthor(4);
                this.defDesc(`**▸ No puedes darte un punto de reputación a ti mismo** ▸ ${data}`)
                break;

            case "insuficientSetup":
                this.#errorAuthor(5);
                this.defDesc(`**▸ No se puede usar este comando sin antes configurar el bot** ▸ \`${data.dataSearch.toUpperCase()}\`.\nUn administrador del servidor tiene que usar el comando \`/setup\` primero.`)
                this.defFooter({text: `Si aún no lo han hecho, muéstrales este mensaje.`});
                break;

            case "commandError":
                this.#errorAuthor(6);
                this.defDesc(`**▸ Podrías usar este comando, pero Jeffrey es tonto** ▸ \`${data.key.id}\`.
**▸ También dile que...**
\`\`\`json
{ FATAL ERROR, KEY ${key.id}, UKNOWN REWARD TYPE "${reward.type}" }
\`\`\``)
        }
    }

    #errorAuthor(errorNumber){
        this.defAuthor({text: `Error ${errorNumber} — ${this.options.type}`, icon: Config.errorPng})
        return this;
    }
}

module.exports = ErrorEmbed