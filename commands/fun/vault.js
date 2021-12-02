const Config = require("../../base.json");
const Colores = require("../../resources/colores.json");
const Emojis = require("../../resources/emojis.json");
const Discord = require("discord.js");
const ms = require("ms");
const chance = require("chance");

const { Initialize, TutorialEmbed, VaultWork } = require("../../resources/functions.js");

/* ##### MONGOOSE ######## */

const User = require("../../modelos/User.model.js");
const Vault = require("../../modelos/Vault.model.js");

/* ##### MONGOOSE ######## */

const commandInfo = {
    name: "vault",
    aliases: ["cofre"],
    info: "Decifra unos acertijos y ganarás premios",
    params: [
        {
            name: "codigo", type: "JoinString", optional: true
        }
    ],
    userlevel: "USER",
    category: "FUN"
}

module.exports = {
    data: commandInfo,
    async execute(client, message, args){

        const { guild, author, prefix, executionInfo } = await Initialize(client, message);

        let response = await TutorialEmbed(commandInfo, executionInfo, args);

        if(response[0] === "ERROR") return console.log(response); // si hay algún error

        const code = response.find(x => x.param === "codigo").data || null;

        // Comando
        const vault = await Vault.findOne({guild_id: guild.id}) ?? await new Vault({guild_id: guild.id}).save();
        const user = await User.findOne({
            user_id: author.id,
            guild_id: guild.id
        }) ?? await new User({
            user_id: author.id,
            guild_id: guild.id
        }).save();

        if(!code){ // quiere buscar pistas
            const isACode = new chance().bool({likelihood: 80});

            let respRelleno = [
                "Jeffrey sube vídeo",
                "No seas malo",
                "Las rosas son rojas",
                "Los caballos comen manzanas",
                "¿Sabías que 10 de cada 10 vídeos subidos por Jeffrey, están en YouTube por más de una semana ocultos antes de ser públicos?",
                "No tengo plata. ¿me donan?",
                "Mindblowing",
                "En plan, sé que no se usa este comando mucho, pero en plan, adiós, ¿sabes?"
            ];

            let relleno = respRelleno[Math.floor(Math.random() * respRelleno.length)];

            let notCodeEmbed = new Discord.MessageEmbed()
            .setDescription(relleno)
            .setColor(Colores.blanco);

            if(!isACode) return message.channel.send({embeds: [notCodeEmbed]}).then(m => {
                setTimeout(() => {
                m.delete();
                message.delete();
                }, ms("10s"));
            });

            return VaultWork(vault, user, message, notCodeEmbed);
        }

        if(code.toLowerCase() === "yo", code.toLowerCase() === "me"){
            // ver cuantos codigos faltan
            let e = new Discord.MessageEmbed()
            .setAuthor(`${author.tag}`, author.displayAvatarURL())
            .setDescription(`▸ \`${user.data.unlockedVaults.length}\` / \`${vault.codes.length}\` descifrados.`)
            .setColor(Colores.verde);

            return message.reply({embeds: [e]});
        }

        await message.delete();

        let nope = [
            "Nope",
            "¿No tienes otra cosa que hacer?",
            "Ve a jugar un poco",
            "Stop",
            "¿{{ CODE }}? Ehhh, no.",
            "¡Las puertas se abrieron! Ahora sal de la bóveda.",
            "¿Por qué no mejor usas `/coins`?",
            "No sirve",
            "¿Estás determinado?",
            "No es tan díficil. ¿O sí?",
            "Sólo es una palabra vamos.",
            "¿Realmente necesitas el dinero?",
            "¿Ya estás suscrito a Jeffrey?",
            "Como que, tu código caducó o algo así...",
            "heh, no",
            "Pues no funcionó",
            "Deja de intentarlo",
            "Ve a dormir, anda",
            "¿Y este random?",
            "Hazte un favor y vete"
        ];
  
        let reply = nope[Math.floor(Math.random() * nope.length)];

        reply = new Discord.MessageEmbed()
        .setColor(Colores.negro)
        .setDescription(reply.replace(new RegExp("{{ CODE }}", "g"), code));

        let gg = [
            "Toma tus { JEFFROS } y vete de mi bóveda.",
            "¿{ JEFFROS }? Felicidades, ahora deja de intentar.",
            "{ JEFFROS }. ¿Ya puedes dejarme solo?",
            "¿QUÉ? ¿DÓNDE ESTÁN MIS { JEFFROS }?",
            "Tuviste suerte, pero la próxima no será tan fácil conseguir { JEFFROS }."
          ];

        let finale = gg[Math.floor(Math.random() * gg.length)];

        const f = x => x.code === code.toUpperCase();

        const codeInVault = vault.codes.find(f);
        if(!codeInVault) return message.channel.send({content: `${message.member}`, embeds: [reply]});
        
        // revisar que no tenga ya el code
        if(user.data.unlockedVaults.find(x => x === codeInVault.id)) return message.channel.send({content: `${message.member}`, embeds: [reply]}); // lo tiene

        // no lo tiene...
        user.economy.global.jeffros += codeInVault.reward;

        let ggEmbed = new Discord.MessageEmbed()
        .setAuthor(`Desencriptado.`, Config.bienPng)
        .setColor(Colores.verde)
        .setDescription(finale.replace(new RegExp("{ JEFFROS }", "g"), `**${Emojis.Jeffros}${codeInVault.reward.toLocaleString('es-CO')}**`));

        user.data.unlockedVaults.push(codeInVault.id);
        await user.save();

        return message.channel.send({content: `${message.member}`, embeds: [ggEmbed]});
    }
}