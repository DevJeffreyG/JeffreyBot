const { Command, Categories, Confirmation, Embed, FindNewId, ItemObjetives, ShopTypes } = require("../../src/utils")

const { PermissionsBitField } = require("discord.js");
const moment = require("moment-timezone");

const command = new Command({
    name: "sync",
    desc: "Comandos para sincronizar algo dentro del guild o la base de datos"
});

command.addSubcommand({
    name: "mute",
    desc: "Sincronizar un role con permisos de muteado"
})

command.addSubcommand({
    name: "legacy",
    desc: "Reunión"
})

command.addSubcommand({
    name: "globaldatas",
    desc: "Sincronizar los viejos globaldatas con los nuevos"
})

command.addOption({
    type: "role",
    name: "role",
    desc: "Role a sincronizar con los permisos default de un mute",
    req: true,
    sub: "mute"
})

command.addOption({
    type: "role",
    name: "role",
    desc: "LegacyRole",
    req: true,
    sub: "legacy"
})

command.addSubcommand({
    name: "inventarios",
    desc: "Sincroniza los inventarios para cambiar los tipos de tienda"
})

command.execute = async (interaction, models, params, client) => {
    await interaction.deferReply();
    const { subcommand } = params
    const { Legacy, GlobalDatas, RouletteItems, Users } = models;

    switch (subcommand) {
        case "mute": {
            await interaction.editReply({ content: `${client.Emojis.Loading} Sincronizando...` })
            const role = params[subcommand].role.role;

            const perms = {
                [PermissionsBitField.Flags.SendMessages]: false,
                [PermissionsBitField.Flags.AddReactions]: false
            }

            await interaction.editReply({ content: `${client.Emojis.Loading} Obteniendo todos los canales...` })
            let fetched = await interaction.guild.channels.fetch();

            await interaction.editReply({ content: `${client.Emojis.Loading} Sincronizando (${fetched.size} canales)...` })

            fetched.each(async channel => {
                let q = await channel.permissionOverwrites.edit(role, perms);
                console.log("🔄", q.name, "actualizado");
            })

            return await interaction.editReply({ content: `${client.Emojis.Check} ${role} Sincronizado.`, allowedMentions: { parse: [] } })
        }

        case "legacy": {
            // Variables
            const guild = interaction.guild;
            const legacyrole = params[subcommand].role.role;

            let report = await interaction.editReply(`${client.Emojis.Loading} Reuniendo todos los miembros...`);

            await guild.members.fetch();

            const members = guild.members.cache;

            await report.edit(`${client.Emojis.Loading} Actualizando la base de datos...`);

            let q = await Legacy.findOne({
                guild_id: guild.id
            });

            if (!q) q = await new Legacy({
                guild_id: guild.id
            }).save();

            let userList = [];

            members.forEach(member => {
                if (member.user.bot) return;
                if (legacyrole) member.roles.add(legacyrole);

                let roles = [];

                member.roles.cache.forEach(r => {
                    roles.push(r.name);
                })

                userList.push({
                    user_id: member.id,
                    roles,
                    member_since: member.joinedAt
                })
            });

            q.user_list = userList;
            q.lastupdate = new Date();

            await report.edit(`${client.Emojis.Loading} Guardando base de datos...`);

            await q.save();

            return report.edit(`${client.Emojis.Check} Se ha actualizado la Legacy List.`);
        }

        case "globaldatas": {
            let old = GlobalDatas.find({ "info.type": { $exists: true } });

            let confirmation = await Confirmation("Eliminar viejos", ["Sí o no"], interaction);

            for await (actual of old) {
                let type = actual.info.type;
                let info = actual.info;

                delete info.type;
                let newInfo = info;

                if (type != "lastExpJeffros" && type != "rouletteItem") {
                    if (!(await GlobalDatas.findOne({ info: newInfo }))) new GlobalDatas({
                        type,
                        info: newInfo
                    }).save();
                } else if (type === "lastExpJeffros") {
                    actual.deleteOne();
                } else if (type === "rouletteItem") {
                    if (newInfo.target === ItemObjetives.TempRole) newInfo.target = ItemObjetives.Boost;
                    if (!(await RouletteItems.findOne(newInfo)))
                        await RouletteItems.new(newInfo, FindNewId(await RouletteItems.getAll(), "", "id"));
                }

                if (confirmation) actual.deleteOne();
            }

            return interaction.editReply({ embeds: [new Embed({ type: "success" })] });
        }

        case "inventarios": {
            await interaction.editReply({ content: `${client.Emojis.Loading} Sincronizando...` })

            const users = await Users.find();
            for await (const user of users) {
                await user.data.purchases.forEach((p, i) => {
                    if (p.toObject().hasOwnProperty("isDarkShop")) {
                        let obj = user.data.purchases[i].toObject();
                        obj.shopType = obj.isDarkShop ? ShopTypes.DarkShop : ShopTypes.Shop;

                        delete obj.isDarkShop;

                        user.data.purchases[i] = obj;
                        user.markModified("data.purchases")
                    }
                })

                await user.data.inventory.forEach((item, i) => {
                    if (item.toObject().hasOwnProperty("isDarkShop")) {
                        let obj = user.data.inventory[i].toObject();
                        obj.shopType = obj.isDarkShop ? ShopTypes.DarkShop : ShopTypes.Shop;

                        delete obj.isDarkShop;

                        user.data.inventory[i] = obj;
                        user.markModified("data.inventory")
                    }
                })
            }

            return await interaction.editReply({ content: `${client.Emojis.Check} Sincronizados.` })
        }
    }
}

module.exports = command;