const { Command, Categories, Embed, MemberHasAnyRole, isDeveloper, ContextMenu, Collector, CreateInteractionFilter, InteractivePages, Enum, FinalPeriod } = require("../../utils");
const { Colores } = require("../../resources/");
const { CommandNotFoundError, PermissionError } = require("../../errors/");
const { ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } = require("discord.js");
const ms = require("ms");

const command = new Command({
    name: "ayuda",
    desc: "Una lista de todos los comandos en el bot",
    helpdesc: "¡Este comando!"
});

command.addOption({
    type: "string", name: "comando", desc: "Recibe ayuda de un comando específico"
});
command.addOption({
    type: "string", name: "categoria", desc: "Recibe los comandos de una categoría",
    choices: new Enum(Categories).complexArray()
});

command.execute = async (interaction, models, params, client) => {
    const { comando, categoria } = params;
    if (comando) return await command.execGetHelp(interaction, comando, client);

    await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });
    const member = interaction.member;
    const doc = params.getDoc();

    const adminRoles = doc.getAdmins();
    const staffRoles = doc.getStaffs();

    const isStaff = MemberHasAnyRole(member, staffRoles);
    const isAdmin = MemberHasAnyRole(member, adminRoles);
    const isDev = isDeveloper(member)

    if (!categoria?.value) {
        const { Currency, DarkCurrency } = client.getCustomEmojis(interaction.guild.id);

        let Buttons = [
            new ButtonBuilder()
                .setCustomId(Categories.General)
                .setLabel("Generales")
                .setEmoji(client.Emojis.Check)
                .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
                .setCustomId(Categories.Fun)
                .setLabel("Diversión")
                .setEmoji("😂")
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId(Categories.Economy)
                .setLabel("Economía")
                .setEmoji(Currency.id)
                .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
                .setCustomId(Categories.DarkShop)
                .setLabel("DarkShop")
                .setEmoji(DarkCurrency.id)
                .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
                .setCustomId(Categories.DM)
                .setLabel("Mensajes Directos")
                .setEmoji("📥")
                .setStyle(ButtonStyle.Secondary),
        ];

        let SpecialButtons = []

        if (isStaff) SpecialButtons.push(
            new ButtonBuilder()
                .setCustomId(Categories.Staff)
                .setLabel("STAFF")
                .setEmoji("👥")
                .setStyle(ButtonStyle.Danger),
            new ButtonBuilder()
                .setCustomId(Categories.Moderation)
                .setLabel("Moderación")
                .setEmoji("🛡️")
                .setStyle(ButtonStyle.Danger)
        )

        if (isAdmin) SpecialButtons.push(
            new ButtonBuilder()
                .setCustomId(Categories.Administration)
                .setLabel("Administración")
                .setEmoji("🛠️")
                .setStyle(ButtonStyle.Danger)
        )

        if (isDev) SpecialButtons.push(
            new ButtonBuilder()
                .setCustomId(Categories.Developer)
                .setLabel("DEV")
                .setEmoji(client.Emojis.JeffreyBot)
                .setStyle(ButtonStyle.Danger)
        )

        let components = [
                new ActionRowBuilder()
                    .setComponents(Buttons)
            ]

        if(SpecialButtons.length > 0) components.push(
            new ActionRowBuilder()
                .setComponents(SpecialButtons)
        )

        let msg = await interaction.editReply({
            embeds: [
                new Embed()
                    .defTitle("Ayuda con Jeffrey Bot")
                    .fillDesc([
                        "Puedes ver los comandos separados por sus categorías usando los botones a continuación",
                        `Usa el parámetro \`comando\` con ${client.mentionCommand("ayuda")} para obtener ayuda específica de un comando`,
                        `Usa el parámetro \`categoria\` para evitar seleccionarla con los botones`
                    ])
                    .defColor(Colores.cake)
                    .defThumbnail(client.user.displayAvatarURL())
            ],
            components
        })

        const collector = await new Collector(interaction, {
            filter: CreateInteractionFilter(interaction, msg, interaction.user),
            wait: true,
            time: ms("1m")
        }).wait(() => {
            interaction.deleteReply();
        })
        if (!collector) return;
        return await showHelp(collector.customId);
    } else {
        const category = categoria.value;
        if ((category === Categories.STAFF || category === Categories.Moderation) && !isStaff)
            throw new PermissionError(interaction);

        if ((category === Categories.Administration) && !isAdmin)
            throw new PermissionError(interaction);

        if ((category === Categories.DEV) && !isDev)
            throw new PermissionError(interaction);

        return await showHelp(category);
    }

    async function showHelp(categoryToShow) {
        let createFilter = (category) => (s => s.category === category && !(s instanceof ContextMenu));

        let title, color;

        const commands = client.commands.filter(createFilter(categoryToShow)).map(c => c);
        commands.sort((a, b) => (a.name > b.name) ? 1 : ((b.name > a.name) ? -1 : 0));

        let items = new Map();
        for (const [i, command] of commands.entries()) {
            items.set(i, {
                command: client.mentionCommand(command.name),
                info: FinalPeriod(command.info)
            })
        }

        switch (categoryToShow) {
            case Categories.General:
                title = "Comandos generales";
                color = Colores.verdejeffrey;
                break;
            case Categories.Fun:
                title = "Comandos de diversión";
                color = Colores.verdeclaro;
                break;
            case Categories.Economy:
                title = "Comandos de economía";
                color = Colores.verde;
                break;
            case Categories.DarkShop:
                title = "Comandos de DarkShop";
                color = Colores.negro;
                break;
            case Categories.Staff:
                title = "Comandos de STAFF";
                color = Colores.rojo;
                break;
            case Categories.Administration:
                title = "Comandos de ADMIN";
                color = Colores.rojooscuro;
                break;
            case Categories.Moderation:
                title = "Comandos de Moderación";
                color = Colores.rojo;
                break;
            case Categories.Developer:
                title = "Comandos de DEV";
                color = Colores.verdejeffrey;
                break;
            case Categories.DM:
                title = "Comandos de MDs";
                color = Colores.nocolor;
                break;
            default:
                title = "Comandos";
                color = Colores.nocolor;
        }

        const interactive = new InteractivePages({
            title,
            author_icon: interaction.guild.iconURL(),
            footer: `Página {ACTUAL} de {TOTAL}`,
            color,
            thumbnail: interaction.client.user.displayAvatarURL(),
            description: ``,
            addon: `### {command}
    > ℹ️ {info}\n\n`
        }, items, 5);

        return await interactive.init(interaction);
    }
}

command.execGetHelp = async (interaction, commandHelp, client) => {
    await interaction.deferReply();
    let comando = client.commands.get(commandHelp.value)

    if (!comando) throw new CommandNotFoundError(interaction, commandHelp.value);

    return await comando.getHelp(interaction);
}

module.exports = command;