const { Command, Categories, Embed, VaultWork } = require("../../src/utils");
const { Colores } = require("../../src/resources");
const chance = require("chance");

const command = new Command({
    name: "vault",
    desc: "Si logras abrir la bóveda con unos acertijos, ganarás premios",
    category: Categories.Fun
})

command.addOption({
    type: "string",
    name: "codigo",
    desc: "¿Crees tener la respuesta?",
    req: false
})

command.execute = async (interaction, models, params, client) => {
    await interaction.deferReply({ ephemeral: true });
    const { Guilds, Users } = models;
    const { EmojisObject } = client;
    const { Currency } = client.getCustomEmojis(interaction.guild.id);

    const code = params.codigo ? params.codigo.value : null;

    let doc = await Guilds.getOrCreate(interaction.guild.id)
    const vault = doc.data.vault_codes;
    const user = await Users.getOrCreate({
        user_id: interaction.user.id,
        guild_id: interaction.guild.id
    });

    if (!code) { // quiere pistas
        const isACode = true || new chance().bool({ likelihood: 80 });

        let respRelleno = [
            "Jeffrey sube vídeo",
            "No seas malo",
            "Las rosas son rojas",
            "Los caballos comen manzanas",
            "¿Sabías que 10 de cada 10 vídeos subidos por Jeffrey, están en YouTube por más de una semana ocultos antes de ser públicos?",
            "No tengo dinero. ¿Me donas?",
            "Mindblowing...",
            "En plan, sé que no se usa este comando mucho, pero en plan, adiós, ¿sabes?",
            "Y a día de hoy siguen los mismos códigos."
        ];

        let relleno = respRelleno[Math.floor(Math.random() * respRelleno.length)];

        let notCodeEmbed = new Embed()
            .defDesc(relleno)
            .defColor(Colores.blanco);

        if (!isACode) return interaction.editReply({ embeds: [notCodeEmbed] });
        return VaultWork(vault, user, interaction, notCodeEmbed);
    }

    let nope = [
        "Nope",
        "¿No tienes otra cosa que hacer?",
        "Ve a jugar un poco",
        "Stop",
        "¿{{ CODE }}? Ehhh, no.",
        "¡Las puertas se abrieron! Ahora sal de la bóveda.",
        `¿Por qué no mejor usas ${client.mentionCommand("coins")}?`,
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
        "Hazte un favor y vete",
        `Seguro que con ${client.mentionCommand("roulette")} te va mejor, anda`
    ];

    let reply = nope[Math.floor(Math.random() * nope.length)];

    reply = new Embed()
        .defColor(Colores.negro)
        .defDesc(reply.replace(new RegExp("{{ CODE }}", "g"), code));

    let gg = [
        "Toma tus { PRIZE } y vete de mi bóveda.",
        "¿{ PRIZE }? Felicidades, ahora deja de intentar.",
        "{ PRIZE }. ¿Ya puedes dejarme solo?",
        "¿QUÉ? ¿DÓNDE ESTÁN MIS { PRIZE }?",
        "Tuviste suerte, pero la próxima no será tan fácil conseguir { PRIZE }."
    ];

    let finale = gg[Math.floor(Math.random() * gg.length)];

    const f = x => x.code === code.toUpperCase();

    const codeInVault = vault.find(f);
    if (!codeInVault) return interaction.editReply({ embeds: [reply] });

    // revisar que no tenga ya el code
    if (user.data.unlockedVaults.find(x => x === codeInVault.id)) return interaction.editReply({ embeds: [reply] }); // lo tiene

    // no lo tiene...
    await user.addCurrency(codeInVault.reward);

    let ggEmbed = new Embed()
        .defAuthor({ text: `Desencriptado.`, icon: EmojisObject.Check.url })
        .defColor(Colores.verde)
        .defDesc(finale.replace(new RegExp("{ PRIZE }", "g"), `**${Currency}${codeInVault.reward.toLocaleString('es-CO')}**`));

    user.data.unlockedVaults.push(codeInVault.id);
    await user.save();

    return interaction.editReply({ embeds: [ggEmbed] });
}

module.exports = command;