const { Command, Categories, Confirmation, FindNewId, ItemActions, ItemObjetives, BoostTypes, BoostObjetives, ItemTypes, ItemEffects, ManageDarkShops } = require("../../src/utils")

const { PermissionsBitField } = require("discord.js");

const command = new Command({
    name: "sync",
    desc: "Comandos para sincronizar algo dentro del guild o la base de datos",
    category: Categories.Developer
});

command.addSubcommand({
    name: "mute",
    desc: "Sincronizar un role con permisos de muteado"
})

command.addSubcommand({
    name: "users",
    desc: "Sincronizar los usuarios viejos con la nueva forma de Jeffrey Bot 2.x.x"
})

command.addSubcommand({
    name: "shops",
    desc: "Sincronizar las viejas tiendas (Normal & DarkShop) con la nueva forma de Jeffrey Bot 2.x.x"
})

command.addSubcommand({
    name: "autoroles",
    desc: "Sincroniza los AutoRoles viejos y re-agregar las reacciones en caso de que se necesite"
})

command.addSubcommand({
    name: "legacy",
    desc: "Reunión"
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

command.execute = async (interaction, models, params, client) => {
    await interaction.deferReply();
    const { subcommand } = params
    const { AutoRoles, Guilds, Legacy } = models;

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

            return interaction.editReply({ content: `${client.Emojis.Check} ${role} Sincronizado.`, allowedMentions: { parse: [] } })
        }

        case "autoroles": {
            let all = await AutoRoles.find();
            await interaction.editReply({ content: `${client.Emojis.Loading} Sincronizando los autoroles...` });

            for await (const arole of all) {
                const doc = await Guilds.getOrCreate(arole.serverID);
                const general = await Guilds.find();

                const newId = FindNewId(general, "data.autoroles", "id")

                if (doc.data.autoroles.find(x =>
                    x.channel_id === arole.channelID &&
                    x.message_id === arole.messageID &&
                    x.emote === arole.emoji &&
                    x.role_id === arole.roleID
                )) continue

                doc.data.autoroles.push({
                    channel_id: arole.channelID,
                    message_id: arole.messageID,
                    emote: arole.emoji,
                    role_id: arole.roleID,
                    toggle_group: arole.toggleGroup == "0" ? null : arole.toggleGroup,
                    id: newId
                })

                await doc.save();
            }

            let q = await Guilds.getOrCreate(interaction.guild.id)
            all = q.data.autoroles; // actualizar a lo nuevo que está en la db
            for (let i = 0; i < all.length; i++) {
                const autorole = all[i];

                let channel = await interaction.guild.channels.cache.find(x => x.id === autorole.channel_id);

                if (!channel) return console.log(`🔴 No se encontró canal para el autorole ${autorole}`);
                await channel.messages.fetch();
                let fetched = await channel.messages.cache.find(x => x.id === autorole.message_id);
                let emote = autorole.emote;

                await fetched.react(emote);
            }

            return interaction.editReply({ content: `${client.Emojis.Check} Sincronizados.` })
        }

        case "users": {
            let confirmation = await Confirmation("Continuar", [
                "Cuando se inicie el proceso se sobreescribirán los datos existentes.",
                "Este proceso no se puede cancelar ni deshacer, haz una copia de seguridad antes."
            ], interaction)
            if (!confirmation) return;

            command.execUsers(confirmation, models, params, client);
            break;
        }

        case "shops": {
            let confirmation = await Confirmation("Continuar", [
                "Cuando se inicie el proceso se sobreescribirán los datos existentes.",
                "Este proceso no se puede cancelar ni deshacer, haz una copia de seguridad antes."
            ], interaction)
            if (!confirmation) return;

            command.execShops(confirmation, models, params, client);
            break;
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
                if(member.user.bot) return;
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
    }
}

command.execUsers = async (interaction, models, params, client) => {
    await interaction.editReply({ embeds: [], content: `${client.Emojis.Loading} Sincronizando...` })

    const { Users, TotalPurchases, DarkStats, Exps, Jeffros, Purchases, WonCodes, GlobalDatas } = models;

    const guildToSearch = interaction.guild.id;

    await interaction.guild.members.fetch();
    let members = interaction.guild.members.cache;

    members.forEach(async (member) => {
        let user_id = member.user.id;

        let totalpurchases = await TotalPurchases.find({ userID: user_id }); // interés
        let darkstats = await DarkStats.findOne({ userID: user_id }); // estadisiticas de darkshop & items de darkshop
        let exp = await Exps.findOne({ userID: user_id, serverID: guildToSearch });
        let jeffros = await Jeffros.findOne({ userID: user_id, serverID: guildToSearch });
        let purchases = await Purchases.find({ userID: user_id }); // inventario de tienda normal
        let vaults = await WonCodes.find({ userID: user_id });

        await Users.findOneAndDelete({ guild_id: interaction.guild.id, user_id: user_id }).then(q => {
            if (q) console.log("Se ha eliminado:", q);
        });

        const newUser = new Users({
            guild_id: interaction.guild.id,
            user_id: user_id
        });

        newUser.save()
            .then(async finalQuery => {
                if (totalpurchases) { // interes
                    let toPush = [];
                    for (let i = 0; i < totalpurchases.length; i++) {
                        let isDarkShop = totalpurchases[i].isDarkShop;
                        let itemID = Number(totalpurchases[i].itemID);
                        let timespurchased = totalpurchases[i].quantity;

                        //console.log(newID)
                        toPush.push({
                            isDarkShop: isDarkShop,
                            item_id: itemID,
                            quantity: timespurchased
                        })
                    }

                    finalQuery.data.purchases = toPush;
                }

                if (purchases) { // inventario tienda normal
                    let toPush = [];

                    let usos = await Users.find();
                    let newUseId = FindNewId(usos, "data.inventory", "use_id");

                    for (let i = 0; i < purchases.length; i++) {
                        let itemID = Number(purchases[i].itemID);

                        //console.log(newID)
                        toPush.push({
                            isDarkShop: false,
                            use_id: newUseId,
                            item_id: itemID,
                            active: false
                        })
                    }

                    if (darkstats && darkstats.items) { // inventario darkshop
                        for (let i = 0; i < darkstats.items.length; i++) {
                            let darkitemID = darkstats.items[i].id;
                            let isActive = darkstats.items[i].active;

                            toPush.push({
                                isDarkShop: true,
                                use_id: newUseId,
                                item_id: darkitemID,
                                active: isActive,
                                active_since: new Date()
                            })
                        }
                    }

                    finalQuery.data.inventory = toPush;
                }

                if (vaults) { // vault
                    let toPush = [];
                    for (let i = 0; i < vaults.length; i++) {
                        let codeID = Number(vaults[i].codeID);

                        toPush.push(codeID)
                    }

                    finalQuery.data.unlockedVaults = toPush;
                }

                if (exp) {
                    finalQuery.economy.global.exp = exp.exp;
                    finalQuery.economy.global.level = exp.level;
                    finalQuery.economy.global.reputation = exp.reputacion;
                }

                if (jeffros) {
                    finalQuery.economy.global.currency = jeffros.jeffros;
                }

                if (darkstats) {
                    // perfil
                    finalQuery.economy.dark.currency = darkstats.djeffros;
                    finalQuery.economy.dark.accuracy = darkstats.accuracy;
                }

                // GLOBALDATAS
                // ultimos jeffros y exp
                let last = await GlobalDatas.findOne({
                    "info.type": "lastGained",
                    "info.userID": user_id
                });

                if (last) {
                    finalQuery.data.lastGained.exp = last.info.exp;
                    finalQuery.data.lastGained.currency = last.info.jeffros;
                }

                // cumpleaños
                let bd = await GlobalDatas.findOne({
                    "info.type": "birthdayData",
                    "info.userID": user_id
                });

                if (bd) {
                    finalQuery.data.birthday.day = bd.info.birthd;
                    finalQuery.data.birthday.month = bd.info.birthm;
                    finalQuery.data.birthday.locked = bd.info.isLocked;
                    finalQuery.data.birthday.locked_since = bd.info.lockedSince;
                }

                // duracion de dj
                let djDuration = await GlobalDatas.findOne({
                    "info.type": "dsDJDuration",
                    "info.userID": user_id
                });

                // roles
                let tempRoles = await GlobalDatas.find({
                    "info.type": "roleDuration",
                    "info.userID": user_id
                });

                if (tempRoles) {
                    let toPush = [];
                    for (let i = 0; i < tempRoles.length; i++) {
                        const temp_role = tempRoles[i];

                        let role_id = temp_role.info.roleID;
                        let active_since = temp_role.info.since;
                        let duration = temp_role.info.duration;
                        let sType = temp_role.info.special.type;
                        let sObjetive = temp_role.info.special.specialObjective;
                        let sValue = temp_role.info.special.specialValue;

                        toPush.push({
                            role_id: role_id,
                            active_since: active_since,
                            duration: duration,
                            special: {
                                type: sType,
                                objetive: sObjetive,
                                value: sValue
                            }
                        })
                    }

                    // subs
                    let subs = await GlobalDatas.find({
                        "info.type": "jeffrosSubscription",
                        "info.userID": user_id
                    });
                    if (subs) {
                        for (let i = 0; i < subs.length; i++) {
                            const sub = subs[i];

                            let role_id = sub.info.roleID;
                            let active_since = sub.info.since;
                            let duration = sub.info.interval;

                            let price = sub.info.price;
                            let name = sub.info.subName;
                            let cancelled = sub.info.isCancelled;

                            toPush.push({
                                role_id: role_id,
                                active_since: active_since,
                                duration: duration,
                                isSub: true,
                                sub_info: {
                                    price: price,
                                    name: name,
                                    isCancelled: cancelled
                                }
                            });
                        }
                    }

                    finalQuery.data.temp_roles = toPush;
                }

                // guardar todo
                await finalQuery.save()
                    .then((res) => console.log("Se ha guardado el nuevo documento para", interaction.guild.members.cache.find(x => x.id === res.user_id).user.tag))
                    .catch(err => console.log(err));
            })

    });

    return interaction.editReply({ content: `${client.Emojis.Check} Sincronizado.`, allowedMentions: { parse: [] } })
}

command.execShops = async (interaction, models, params, client) => {
    await interaction.editReply({ embeds: [], content: `${client.Emojis.Loading} Sincronizando...` })

    const { Shops, DarkShops, Items, DarkItems, Uses, DarkUses } = models

    const guildToSearch = interaction.guild.id

    const normalItems = await Items.find({ serverID: guildToSearch });
    const darkItems = await DarkItems.find();
    const normalUses = await Uses.find({ serverID: guildToSearch });
    const darkUses = await DarkUses.find();

    //console.log("normal items", normalItems, "dark items", darkItems, "normal uses", normalUses, "darkuses", darkUses)

    await Shops.findOneAndDelete({ guild_id: interaction.guild.id }).then(q => {
        if (q) console.log("🔴 Se ha eliminado:", q);
    });

    await DarkShops.findOneAndDelete({ guild_id: interaction.guild.id }).then(q => {
        if (q) console.log("🔴 Se ha eliminado:", q);
    });

    await ManageDarkShops(client);

    const shop = await Shops.getOrCreate(interaction.guild.id);
    const darkshop = await DarkShops.getOrNull(interaction.guild.id);

    // normal items
    console.log("========================")
    console.log("💚 NORMAL ITEMS")
    for (const item of normalItems) {
        const use = normalUses.find(x => x.itemID === item.id.toString());

        console.log("🌟 Item: %s", item)
        console.log("🌠 Use: %s", use)

        const objetive = use.thing === "warns" ? ItemObjetives.Warns :
            use.thing === "role" && use.special?.type ? ItemObjetives.Boost :
                use.thing === "role" ? ItemObjetives.Role : ItemObjetives.Item

        const item_info = {
            type: use.isSub ? ItemTypes.Subscription :
                objetive === ItemObjetives.Boost ? ItemTypes.Temporal :
                    null,
            duration: use.duration ?? null
        };
        const boost_info = {
            type: use.special?.type ?
                use.special?.type === "boostMultiplier" ? BoostTypes.Multiplier : BoostTypes.Probabilities :
                null,
            value: use.special?.type ? use.special?.specialValue : null,
            objetive: use.special?.type ?
                use.special?.specialObjective === "exp" ? BoostObjetives.Exp :
                    use.special?.specialObjective === "jeffros" ? BoostObjetives.Currency : BoostObjetives.All :
                null
        }
        shop.items.push({
            name: item.itemName,
            price: item.itemPrice,
            description: item.itemDescription,
            reply: item.replyMessage,
            req_role: item.roleRequired === "na" ? null : item.roleRequired,
            interest: item.ignoreInterest ? 0 : item.interest,
            use_info: {
                action: use.action === "delete" || use.action === "remove" ? ItemActions.Remove : ItemActions.Add,
                given: use.thingID === "na" ? "1" : use.thingID,
                objetive,
                item_info,
                boost_info
            },
            id: item.id
        })

        await shop.save();
    }

    interaction.editReply({ content: `${client.Emojis.Loading} Tienda normal sincronizada.`, allowedMentions: { parse: [] } })

    console.log("================")
    console.log("🖤 DARKSHOP ITEMS")
    for (const item of darkItems) {
        const use = darkUses.find(x => x.itemID === item.id.toString());

        console.log("🌟 Item: %s", item)
        console.log("🌠 Use: %s", use)

        const objetive = use.info.thing === "warns" ? ItemObjetives.Warns :
            use.info.thing === "role" ? ItemObjetives.Role :
                ItemObjetives.Item

        const effect = use.info.extra.effect === "negative" ?
            ItemEffects.Negative : ItemEffects.Positive

        darkshop.items.push({
            name: item.itemName,
            price: item.itemPrice,
            description: item.itemDescription,
            interest: item.ignoreInterest ? 0 : 5,
            use_info: {
                effect,
                action: use.info.action === "add" ? ItemActions.Add : ItemActions.Remove,
                given: use.info.thingID === "na" && use.info.extra.quantity != 0 ?
                    use.info.extra.quantity : use.info.thingID != "na" ?
                        use.info.thingID : "1",
                objetive,
                item_info: {
                    type: item.itemName === "Firewall" ? ItemTypes.Firewall :
                        item.itemName === "Stack Overflow" ? ItemTypes.StackOverflow :
                            item.itemName === "Reset" ? ItemTypes.ResetInterest :
                                use.info.extra.duration != "na" ? ItemTypes.Temporal :
                                    null,
                    duration: use.info.extra.duration === "na" ? null : use.info.extra.duration
                },
            },
            id: item.id
        })

        await darkshop.save();
    }

    console.log("✅ SINCRONIZADOS")
    console.log("========================")
    return interaction.editReply({ content: `${client.Emojis.Check} Sincronizado.`, allowedMentions: { parse: [] } })
}

module.exports = command;