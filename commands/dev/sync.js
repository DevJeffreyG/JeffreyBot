const { Command, Confirmation, FindNewId } = require("../../src/utils")
const { Emojis } = require("../../src/resources")

const { PermissionsBitField } = require("discord.js");

const command = new Command({
    name: "sync",
    desc: "Comandos para sincronizar algo dentro del guild o la base de datos",
    category: "DEV"
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
    name: "autoroles",
    desc: "Sincroniza los AutoRoles viejos con la nueva forma de Jeffrey Bot 2.x.x"
})

command.addOption({
    type: "string",
    name: "id",
    desc: "Id del role a sincronizar",
    req: true,
    sub: "mute"
})

command.execute = async (interaction, models, params, client) => {
    await interaction.deferReply();
    const { subcommand } = params
    const { AutoRoles, Guilds } = models;

    switch (subcommand) {
        case "mute": {
            await interaction.editReply({ content: `${Emojis.Loading} Sincronizando...` })
            const role = interaction.guild.roles.cache.find(x => x.id === params[subcommand].id.value);

            const perms = {
                [PermissionsBitField.Flags.ViewChannel]: false,
                [PermissionsBitField.Flags.SendMessages]: false,
                [PermissionsBitField.Flags.AddReactions]: false
            }

            await interaction.editReply({ content: `${Emojis.Loading} Obteniendo todos los canales...` })
            let fetched = await interaction.guild.channels.fetch();

            await interaction.editReply({ content: `${Emojis.Loading} Sincronizando (${fetched.size} canales)...` })

            fetched.each(async channel => {
                let q = await channel.permissionOverwrites.edit(role, perms);
                console.log("🔄", q.name, "actualizado");
            })

            return interaction.editReply({ content: `✅ ${role} Sincronizado.`, allowedMentions: { parse: [] } })
        }

        case "autoroles": {
            let all = await AutoRoles.find();
            await interaction.editReply({content: `${Emojis.Loading} Sincronizando los autoroles...`});

            for await(const arole of all){
                const doc = await Guilds.getOrCreate(arole.serverID);
                const general = await Guilds.find();

                const newId = await FindNewId(general, "data.autoroles", "id")

                if(doc.data.autoroles.find(x => 
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

            return interaction.editReply({ content: `✅ Sincronizados.` })
        }

        case "users":
            let confirmation = await Confirmation("Continuar", [
                "Cuando se inicie el proceso se sobreescribirán los datos existentes.",
                "Este proceso no se puede cancelar ni deshacer, haz una copia de seguridad antes."
            ], interaction)
            if(!confirmation) return;
            
            command.execUsers(confirmation, models, params, client);
            break;
    }
}

command.execUsers = async (interaction, models, params, client) => {
    await interaction.editReply({ content: `${Emojis.Loading} Sincronizando...` })

    const { Users, TotalPurchases, DarkStats, Exps, Jeffros, Purchases, WonCodes, GlobalDatas } = models;

    const guildToSearch = "447797737216278528"; //message.guild.id;

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
                    let newUseId = await FindNewId(usos, "data.inventory", "use_id");

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
                    finalQuery.economy.global.jeffros = jeffros.jeffros;
                }

                if (darkstats) {
                    // perfil
                    finalQuery.economy.dark.darkjeffros = darkstats.djeffros;
                    finalQuery.economy.dark.accuracy = darkstats.accuracy;
                }

                // GLOBALDATAS
                // ultimos jeffros y exp
                let last = await GlobalDatas.findOne({
                    "info.type": "lastExpJeffros",
                    "info.userID": user_id
                });

                if (last) {
                    finalQuery.data.lastExpJeffros.exp = last.info.exp;
                    finalQuery.data.lastExpJeffros.jeffros = last.info.jeffros;
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

                if (djDuration) {
                    finalQuery.economy.dark.duration = djDuration.info.duration;
                    finalQuery.economy.dark.dj_since = djDuration.info.since;
                }

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

    return interaction.editReply({ content: `✅ Sincronizado.`, allowedMentions: { parse: [] } })
}

module.exports = command;