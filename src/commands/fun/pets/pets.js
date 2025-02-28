const { CommandInteraction, Client, ActionRowBuilder, ButtonBuilder, ButtonStyle, TextInputStyle, DiscordjsErrorCodes, MessageFlags } = require("discord.js");
const { Command, InteractivePages, Pet, Enum, PetAttacksType, ProgressBar, Embed, Collector, CreateInteractionFilter, Modal, Confirmation } = require("../../../utils");
const { Colores } = require("../../../resources");
const { DoesntExistsError } = require("../../../errors");

const ms = require("ms");

const command = new Command({
    name: "pets",
    desc: "Tus mascotas y sus estadísticas"
})

command.addOption({
    type: "integer",
    name: "admin",
    desc: "La ID de la mascota a administrar"
})

/**
 * @param {CommandInteraction} interaction 
 * @param {*} models 
 * @param {*} params 
 * @param {Client} client 
 */
command.execute = async (interaction, models, params, client) => {
    await interaction.deferReply();

    if (params.admin) return await command.admin(interaction, models, params, client);

    const user = params.getUser();
    const items = new Map();

    for await (const p of user.data.pets) {
        const pet = await new Pet(interaction, p.id).build(params.getDoc(), user)

        let hpbar = ProgressBar((pet.hp / pet.shop_info.stats.hp) * 100, { blocks: 6 });
        let hungerbar = ProgressBar(pet.hunger, { blocks: 6 });

        items.set(p.id, {
            name: pet.name,
            hpbar,
            hp: pet.hp,
            storename: pet.shop_info.name,
            storedesc: pet.shop_info.description,
            hunger: pet.hunger,
            hungerbar,
            wins: pet.wins,
            defeats: pet.defeats,
            attack: pet.stats.attack,
            defense: pet.stats.defense,
            "ulti-name": pet.attacks[3].name,
            "ulti-cost": pet.attacks[3].cost,
            id: p.id
        })
    }

    const interactive = new InteractivePages({
        title: "Mascotas",
        author_icon: interaction.member.displayAvatarURL(),
        color: Colores.verde,
        addon: `# **{storename} — {name}**
> {storedesc}
## Estadísticas
❤️ — {hpbar} (**{hp}**)
🍗 — {hungerbar} (**{hunger}**)
🗡️ — **{attack}**
🛡️ — **{defense}**

▸ Victorias: **{wins}**
▸ Derrotas: **{defeats}**
|| ▸ ID: \`{id}\` ||
### Ataque ${new Enum(PetAttacksType).translate(PetAttacksType.Ultimate)}
▸ {ulti-name}
▸ Coste: \`{ulti-cost}\`\n\n`
    }, items, 1)

    return await interactive.init(interaction);
}

command.admin = async (interaction, models, params, client) => {
    const user = params.getUser();
    const petId = params.admin.value;
    if (!user.data.pets.find(x => x.id === petId))
        throw new DoesntExistsError(interaction, `La mascota con ID \`${petId}\``, "tu inventario");

    const pet = await new Pet(interaction, petId).build(params.getDoc(), user)

    let msg = await interaction.editReply({
        embeds: [
            new Embed()
                .defDesc("### Usa los botones según lo que desees.")
                .fillDesc([`Administrando a **${pet.name}**`, `**❤️${pet.hp} 🍗${pet.hunger} 🗡️${pet.stats.attack} 🛡️${pet.stats.defense}**`])
                .defColor(Colores.nocolor)
        ],
        components: [
            new ActionRowBuilder()
                .setComponents(
                    new ButtonBuilder()
                        .setCustomId(`changeName`)
                        .setLabel("Cambiar nombre")
                        .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                        .setCustomId(`deletePet`)
                        .setLabel("Regresar mascota")
                        .setStyle(ButtonStyle.Danger),

                )
        ]
    })

    const collector = await new Collector(interaction, {
        filter: CreateInteractionFilter(interaction, msg, interaction.user),
        wait: true,
        time: ms("1m")
    }, false, false).onEnd(() => {
        interaction.deleteReply().catch(err => {
            console.error("🔴 %s", err);
        });
    }).wait();
    if (!collector) return;
    switch (collector.customId) {
        case "changeName":
            let m = await new Modal(collector)
                .defUniqueId("modalPetName")
                .defTitle("Cambio de nombre")
                .addInput({ id: "name", label: "Nuevo nombre", style: TextInputStyle.Short, req: true, min: 1, max: 25 })
                .show()

            let r = await interaction.awaitModalSubmit({
                filter: (i) => i.customId === m.customId && i.userId === interaction.userId,
                time: ms("5m")
            }).catch(async err => {
                if (err.code === DiscordjsErrorCodes.InteractionCollectorError) await interaction.deleteReply();
                else throw err;
            });
            if (!r) return;

            await r.deferReply({ flags: [MessageFlags.Ephemeral] });

            const { name } = new Modal(r).read();
            pet.name = name;
            await pet.save();

            await r.editReply({
                embeds: [
                    new Embed({ type: "success" })
                ]
            })
            break;

        case "deletePet":
            await collector.deferReply({ flags: [MessageFlags.Ephemeral] });
            let confirmation = await Confirmation("Regresar mascota", [
                `Se eliminará a **${pet.name}** de tus mascotas.`,
                `**❤️${pet.hp} 🍗${pet.hunger} 🗡️${pet.stats.attack} 🛡️${pet.stats.defense}**.`,
                "Esta acción no se puede deshacer."
            ], collector);
            if (!confirmation) return;

            pet.kill();
            await pet.save();

            await collector.editReply({
                embeds: [
                    new Embed({ type: "success" })
                ]
            });
            break;
    }
}

module.exports = command;