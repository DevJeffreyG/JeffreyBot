const { Command, Embed, Confirmation, Log, LogReasons, ChannelModules, SendDirect, DirectMessageType } = require("../../utils")
const { Colores } = require("../../resources");
const { FetchError, DoesntExistsError } = require("../../errors");
const command = new Command({
    name: "pardon",
    desc: "Eliminar un softwarn o un warn por su id"
})

command.addSubcommand({
    name: "warn",
    desc: "Eliminar un warn por su ID"
})

command.addSubcommand({
    name: "softwarn",
    desc: "Eliminar un softwarn por su ID"
})

command.addOption({
    type: "integer",
    name: "id",
    desc: "El ID del warn a eliminar",
    sub: "warn",
    req: true
})

command.addOption({
    type: "integer",
    name: "id",
    desc: "El ID del softwarn a eliminar",
    sub: "softwarn",
    req: true
})

command.execute = async (interaction, models, params, client) => {
    await interaction.deferReply();
    const { Users } = models;
    const { subcommand } = params;
    const { id } = params[subcommand];

    const isSoftwarn = subcommand === "softwarn";
    const textInfraction = isSoftwarn ? "Softwarn" : "Warn";

    let idsNow = []; // ids en uso actualmente para el tipo de infraccion a quitar
    let users = await Users.find({ guild_id: interaction.guild.id });

    if (!isSoftwarn) { // buscar la id de los warns
        for (let i = 0; i < users.length; i++) {
            const document = users[i];

            let warns = document.warns;

            warns.forEach(warn => {
                idsNow.push({ id: warn.id, user_id: document.user_id, guild_id: document.guild_id }); // pushear cada id en uso
            });
        }
    } else { // bucsar la id de los SOFTWARNS
        for (let i = 0; i < users.length; i++) {
            const document = users[i];

            let softwarns = document.softwarns;

            softwarns.forEach(softwarn => {
                idsNow.push({ id: softwarn.id, user_id: document.user_id, guild_id: document.guild_id }); // pushear cada id en uso
            });
        }
    }

    let idFound = idsNow.find(x => x.id === id.value);

    if (!idFound)
        throw new DoesntExistsError(interaction, `NO existe el __**${textInfraction}**__ con id \`${id.value}\``);

    // si hay una id, proseguir
    let user = await Users.getWork({
        user_id: idFound.user_id,
        guild_id: interaction.guild.id
    });

    const member = interaction.guild.members.cache.get(user.user_id)
    if (!member)
        throw new FetchError(interaction, "usuario", ["El usuario con esta infracción ya no está en el servidor", "No se podrá eliminar hasta que vuelva"])

    let toConfirm = [
        `¿Estás segur@ de eliminar el ${textInfraction} al miembro ${member}?`,
        `Con ID: **${id.value}**.`
    ];

    let confirmation = await Confirmation(`Pardon ${textInfraction}`, toConfirm, interaction);
    if (!confirmation) return;

    const infractions = isSoftwarn ? user.softwarns : user.warns;

    const index = infractions.findIndex(x => x.id === id.value);

    infractions.splice(index, 1); // eliminar la infraccion
    await user.save();

    let pardon = new Embed({
        type: "success",
        data: {
            title: `Pardon ${textInfraction}`,
            desc: [
                `Miembro: **${member.user.username}**`,
                `Moderador: **${interaction.user.username}**`,
                `${textInfraction + "s"} actuales: **${infractions.length}**`
            ]
        }
    })

    let memberEmbed = new Embed()
        .defAuthor({ text: `Pardon`, icon: client.EmojisObject.Pardon.url })
        .defDesc(`**—** Se ha eliminado el ${textInfraction} con ID "**${id.value}**".
**—** ${textInfraction + "s"} actuales: **${infractions.length}**.`)
        .defColor(Colores.verde)
        .defFooter({ text: `Un abrazo, el STAFF.`, icon: interaction.guild.iconURL() });

    new Log(interaction)
        .setReason(LogReasons.Pardon)
        .setTarget(ChannelModules.ModerationLogs)
        .send({ embeds: [pardon] })

    await interaction.followUp({ embeds: [new Embed({ type: "success" })] });

    if (!isSoftwarn) await SendDirect(interaction, member, DirectMessageType.Moderation, { embeds: [memberEmbed] })
}

module.exports = command;