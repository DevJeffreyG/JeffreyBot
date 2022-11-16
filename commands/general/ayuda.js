const { Command, Categories, ErrorEmbed, Embed } = require("../../src/utils");
const { Config, Colores } = require("../../src/resources/");
const Chance = require("chance");

const command = new Command({
    name: "ayuda",
    desc: "Una lista de todos los comandos en el bot",
    helpdesc: "¡Este comando!",
    category: Categories.General
});

command.addOption({
    type: "string", name: "comando", desc: "Recibe ayuda de un comando específico"
});

command.execute = async (interaction, models, params, client) => {
    const { comando } = params;
    if (comando) return command.execGetHelp(interaction, comando, client);

    await interaction.deferReply({ ephemeral: true });
    const guild = client.guilds.cache.find(x => x.id === interaction.guildId);
    const member = guild.members.cache.find(x => x.id === interaction.user.id);
    const helpEmojiURL = client.EmojisObject.Faq.url

    // get all commands
    const commands = client.slash.map(slash => slash);

    commands.sort((a, b) => (a.name > b.name) ? 1 : ((b.name > a.name) ? -1 : 0)); // me lo robe y no entiendo como funciona :D

    // roles
    let jeffreyRole = guild.roles.cache.find(x => x.id === Config.jeffreyRole);
    let staffRole = guild.roles.cache.find(x => x.id === Config.staffRole);
    let adminRole = guild.roles.cache.find(x => x.id === Config.adminRole);

    if (client.user.id === Config.testingJBID) {
        jeffreyRole = guild.roles.cache.find(x => x.id === "482992290550382592");
        staffRole = guild.roles.cache.find(x => x.id === "535203102534402063");
        adminRole = guild.roles.cache.find(x => x.id === "483105079285776384");
    }

    // codigo

    let general = new Embed()
        .defAuthor({ text: `Comandos generales`, icon: helpEmojiURL })
        .defColor(Colores.verde);

    let fun = new Embed()
        .defAuthor({ text: `Comandos de diversión`, icon: helpEmojiURL })
        .defColor(Colores.verde);

    let music = new Embed()
        .defAuthor({ text: `Comandos de música ! MANTENIMIENTO !`, icon: helpEmojiURL })
        .defColor(Colores.verde);

    let economy = new Embed()
        .defAuthor({ text: `Comandos de economía`, icon: helpEmojiURL })
        .defColor(Colores.verde);

    let darkshop = new Embed()
        .defAuthor({ text: `Comandos de la DarkShop`, icon: helpEmojiURL })
        .defColor(Colores.negro);

    let moderation = new Embed()
        .defAuthor({ text: `Comandos de moderación`, icon: helpEmojiURL })
        .defColor(Colores.rojo);

    let staff = new Embed()
        .defAuthor({ text: `Comandos de STAFF`, icon: helpEmojiURL })
        .defColor(Colores.rojo);

    let admin = new Embed()
        .defAuthor({ text: `Comandos de Administrador`, icon: helpEmojiURL })
        .defColor(Colores.rojo);

    let dev = new Embed()
        .defAuthor({ text: `Comandos de desarrollador`, icon: helpEmojiURL })
        .defColor(Colores.nocolor);

    let [generalDesc, funDesc, musicDesc, economyDesc, darkshopDesc, moderationDesc, staffDesc, adminDesc, devDesc] = ["", "", "", "", "", "", "", "", ""];

    for (let i = 0; i < commands.length; i++) {
        const helpCommand = commands[i];

        const toAdd = `▸ \`/${helpCommand.name}\`: ${helpCommand.info}${helpCommand.info.endsWith("!") || helpCommand.info.endsWith("?") ? "" : "."}\n`;

        switch (helpCommand.category) {
            case Categories.General:
                generalDesc += toAdd;
                break;

            case Categories.Fun:
                funDesc += toAdd;
                break;

            case Categories.Music:
                musicDesc += toAdd;
                break;

            case Categories.Economy:
                economyDesc += toAdd;
                break;

            case Categories.DarkShop:
                darkshopDesc += toAdd;
                break;

            case Categories.Moderation:
                moderationDesc += toAdd;
                break;

            case Categories.Staff:
                staffDesc += toAdd;
                break;

            case Categories.Administration:
                adminDesc += toAdd;
                break;

            case Categories.Developer:
                devDesc += toAdd;
                break;

            default:
                console.error("HAY UN COMANDO CON CATEGORÍA INCORRECTA !!", helpCommand);
        }

    }

    general.defDesc(generalDesc);
    fun.defDesc(funDesc);
    music.defDesc(musicDesc);
    economy.defDesc(economyDesc);
    darkshop.defDesc(darkshopDesc);
    moderation.defDesc(moderationDesc);
    staff.defDesc(staffDesc);
    admin.defDesc(adminDesc);
    dev.defDesc(devDesc);

    let isStaff = member.roles.cache.find(x => x === staffRole) ? true : false;
    let isAdmin = member.roles.cache.find(x => x === adminRole) ? true : false;
    let isJeffrey = member.roles.cache.find(x => x === jeffreyRole) ? true : false;

    let arrayEmbeds = [];

    if (general.description) arrayEmbeds.push(general);
    if (fun.description) arrayEmbeds.push(fun);
    if (music.description) arrayEmbeds.push(music);
    if (economy.description) arrayEmbeds.push(economy);
    if (darkshop.description) arrayEmbeds.push(darkshop);

    if (isJeffrey) {
        if (moderation.description) arrayEmbeds.push(moderation);
        if (staff.description) arrayEmbeds.push(staff);
        if (admin.description) arrayEmbeds.push(admin);
        if (dev.description) arrayEmbeds.push(dev);
    } else if (isStaff) {
        if (moderation.description) arrayEmbeds.push(moderation);
        if (staff.description) arrayEmbeds.push(staff);
        if (isAdmin && admin.description) arrayEmbeds.push(admin);
    }

    let sug = new Embed({
        type: "didYouKnow",
        data: {
            text: `Puedes obtener ayuda de un comando específico usando este mismo comando:\n\`/ayuda comando:(nombre)\``,
            likelihood: 50
        }
    })

    console.log(sug)

    if (sug.likelihood) arrayEmbeds.push(sug);

    return interaction.editReply({ embeds: arrayEmbeds, ephemeral: true });
}

command.execGetHelp = async (interaction, commandHelp, client) => {
    await interaction.deferReply();
    let comando = client.slash.get(commandHelp.value)

    if (!comando) return interaction.editReply({
        embeds: [
            new ErrorEmbed({
                type: "commandNotFound",
                data: commandHelp.value,
            })
        ]
    })

    return comando.getHelp(interaction);
}

module.exports = command;