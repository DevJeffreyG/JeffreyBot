const { Command, Embed, isOnMobible } = require("../../src/utils");
const { Config, Colores } = require("../../src/resources");
const changes = Config.changes;

const Package = require("../../package.json");

const viewExtension = "ꜝ";

const added = "<:Plus:792966881350123540>";
const removed = "<:Minus:792966881530609736>";
const updated = "<:Update:792966881690648576>";

let addCounter = 0;
let removeCounter = 0;
let updateCounter = 0;

const command = new Command({
    name: "changelog",
    desc: "Las últimas modificaciones hechas en la versión actual del bot",
    category: "GENERAL"
})

command.addOption({type: "boolean", name: "extended", desc: "Mostrar los detalles más extendidos? (Para usuarios de móvil)"})

command.execute = async (interaction, models, params, client) => {
    const { extended } = params;
    const fetch = await interaction.channel.messages.fetch({ limit: 25})
    const message = await fetch.first();

    let userIsOnMobible = isOnMobible(interaction);

    if(extended || userIsOnMobible) return command.execExtended(interaction);

    let embed = new Embed()
    .defThumbnail(client.user.displayAvatarURL())
    .defDesc(`**Jeffrey Bot v\`${Package.version}\` — Últimos cambios hechos al bot.**\n`)
    .defFooter({text: `* Si estás en PC, poniendo el mouse sobre '!', podrás ver detalles extendidos de los cambios, el link no lleva a nada importante.\n— En móvil usa '/changelog extended: True'.`})
    .defColor(Colores.verde);

    for(let i = 0; i < changes.length; i++){
        let addToDesc;
        let hasExtended = true;

        // regex
        let str = changes[i].desc;
        let str2 = changes[i].extended ?? false;
        let extendedDetails;
        let desc = str.replace(
        new RegExp("{ PREFIX }", "g"),
        `/`
        );

        if(str2){
        extendedDetails = str2.replace(
            new RegExp("{ PREFIX }", "g"),
            `/`
        );
        } else {
        hasExtended = false;
        }

        switch(changes[i].type){
        case "added":
            if(addCounter == 0){
            addToDesc = hasExtended ? `\n**• Agregado •**\n${added} ${desc}. [${viewExtension}](${message.url} '${extendedDetails}')\n` : `\n**• Agregado •**\n${added} ${desc}.\n`;
            } else {
            addToDesc = hasExtended ? `${added} ${desc}. [${viewExtension}](${message.url} '${extendedDetails}')\n` : `${added} ${desc}.\n`;
            }
            embed.defDesc(embed.description + addToDesc)
            addCounter++;
            break;

        case "updated":
            if(updateCounter == 0){
            addToDesc = hasExtended ? `\n**• Actualizado •**\n${updated} ${desc}. [${viewExtension}](${message.url} '${extendedDetails}')\n` : `\n**• Actualizado •**\n${updated} ${desc}.\n`;
            } else {
            addToDesc = hasExtended ? `${updated} ${desc}. [${viewExtension}](${message.url} '${extendedDetails}')\n` : `${updated} ${desc}.\n`;
            }
            embed.defDesc(embed.description + addToDesc)
            updateCounter++;
            break;

        case "removed":
            if(removeCounter == 0){
            addToDesc = hasExtended ? `\n**• Eliminado •**\n${removed} ${desc}. [${viewExtension}](${message.url} '${extendedDetails}')\n` : `\n**• Eliminado •**\n${removed} ${desc}.\n`;
            } else {
            addToDesc = hasExtended ? `${removed} ${desc}. [${viewExtension}](${message.url} '${extendedDetails}')\n`: `${removed} ${desc}.\n`;
            }
            embed.defDesc(embed.description + addToDesc)
            removeCounter++;
            break;
        }
    }

    return interaction.reply({embeds: [embed]});
}

command.execExtended = async (interaction) => {
    let embed = new Embed()
    .defDesc(`**Jeffrey Bot v\`${Package.version}\` — Últimos cambios hechos al bot.\n(Versión Extendida)**\n`)
    .defColor(Colores.verde);

    for(let i = 0; i < changes.length; i++){
        let addToDesc;
        let hasExtended = true;

        // regex
        let str = changes[i].desc;
        let str2 = changes[i].extended ?? false;
        let extendedDetails;
        let desc = str.replace(
            new RegExp("{ PREFIX }", "g"),
            `/`
        );

        if(str2){
            extendedDetails = str2.replace(
            new RegExp("{ PREFIX }", "g"),
            `/`
            );
        } else {
            hasExtended = false;
        }

        switch(changes[i].type){
            case "added":
            if(addCounter == 0){
                addToDesc = hasExtended ? `\n**• Agregado •**\n${added} ${desc}.\n**⇢ Detalles ⇠**\n${extendedDetails}\n\n` : `\n**• Agregado •**\n${added} ${desc}.\n`;
            } else {
                addToDesc = hasExtended ? `${added} ${desc}.\n**⇢ Detalles ⇠**\n${extendedDetails}\n\n` : `${added} ${desc}.\n`;
            }
            embed.defDesc(embed.description + addToDesc)
            addCounter++;
            break;

            case "updated":
            if(updateCounter == 0){
                addToDesc = hasExtended ? `\n**• Actualizado •**\n${updated} ${desc}.\n**⇢ Detalles ⇠**\n${extendedDetails}\n\n` : `\n**• Actualizado •**\n${updated} ${desc}.\n`;
            } else {
                addToDesc = hasExtended ? `${updated} ${desc}.\n**⇢ Detalles ⇠**\n${extendedDetails}\n\n` : `${updated} ${desc}.\n`;
            }
            embed.defDesc(embed.description + addToDesc)
            updateCounter++;
            break;

            case "removed":
            if(removeCounter == 0){
                addToDesc = hasExtended ? `\n**• Eliminado •**\n${removed} ${desc}.\n**⇢ Detalles ⇠**\n${extendedDetails}\n\n` : `\n**• Eliminado •**\n${removed} ${desc}.\n`;
            } else {
                addToDesc = hasExtended ? `${removed} ${desc}.\n**⇢ Detalles ⇠**\n${extendedDetails}\n\n`: `${removed} ${desc}.\n`;
            }
            embed.defDesc(embed.description + addToDesc)
            removeCounter++;
            break;
        }
    }

    return interaction.reply({embeds: [embed], ephemeral: true});
}

module.exports = command;