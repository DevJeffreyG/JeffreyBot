const { CommandInteraction, Client } = require("discord.js");
const { Command, InteractivePages, Pet, Enum, PetAttacksType } = require("../../../src/utils");
const { Colores } = require("../../../src/resources");

const command = new Command({
    name: "pets",
    desc: "Tus mascotas y sus estadísticas"
})

/**
 * @param {CommandInteraction} interaction 
 * @param {*} models 
 * @param {*} params 
 * @param {Client} client 
 */
command.execute = async (interaction, models, params, client) => {
    await interaction.deferReply();

    const user = params.getUser();
    const items = new Map();

    for await (const p of user.data.pets) {
        const pet = await new Pet(interaction, p.id).build(params.getDoc(), user)
        items.set(p.id, {
            name: pet.name,
            hp: pet.hp,
            storename: pet.shop_info.name,
            storedesc: pet.shop_info.description,
            hunger: pet.hunger,
            wins: pet.wins,
            defeats: pet.defeats,
            attack: pet.stats.attack,
            defense: pet.stats.defense,
            "ulti-name": pet.attacks[3].name,
            "ulti-cost": pet.attacks[3].cost,
        })
    }

    const interactive = new InteractivePages({
        title: "Mascotas",
        author_icon: interaction.member.displayAvatarURL({ dynamic: true }),
        color: Colores.verde,
        addon: `# **{storename} — {name}**
> {storedesc}
## Estadísticas
❤️ — **{hp}**
🍗 — **{hunger}**
🗡️ — **{attack}**
🛡️ — **{defense}**

▸ Victorias: **{wins}**
▸ Derrotas: **{defeats}**
### Ataque ${new Enum(PetAttacksType).translate(PetAttacksType.Ultimate)}
▸ {ulti-name}
▸ Coste: \`{ulti-cost}\`\n\n`
    }, items, 1)

    return await interactive.init(interaction);
}

module.exports = command;