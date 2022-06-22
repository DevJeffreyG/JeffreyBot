const Config = require("../../src/resources/base.json");
const Colores = require("../../src/resources/colores.json");
const Emojis = require("../../src/resources/emojis.json");
const Discord = require("discord.js");
const ms = require("ms");
var Chance = require("chance");
var chance = new Chance();

const reglas = require("../../src/resources/reglas.json");

const { Initialize, TutorialEmbed, FindNewId, LimitedTime, WillBenefit } = require("../../src/utils/");

/* ##### MONGOOSE ######## */

const User = require("../../modelos/User.model.js");
const Shop = require("../../modelos/Shop.model.js");
const DarkShop = require("../../modelos/DarkShop.model.js");

/* ##### MONGOOSE ######## */

const commandInfo = {
    name: "use",
    aliases: ["usar"],
    info: "Usa un item con su id de uso",
    params: [
        {
            name: "id", type: "NaturalNumber", optional: false
        },
        {
            name: "miembro", display: "miembro [darkshop] | yo", type: "Member", optional: true
        }
    ],
    userlevel: "USER",
    category: "ECONOMY"
}

module.exports = {
    data: commandInfo,
    async execute(client, message, args){

        const { guild, author, prefix, executionInfo, jeffrey_role } = await Initialize(client, message);

        let response = await TutorialEmbed(commandInfo, executionInfo, args);

        if(response[0] === "ERROR") return console.log(response); // si hay algún error

        const id = response.find(x => x.param === "id").data;
        let member = response.find(x => x.param === "miembro").data || message.member;

        // Comando
        const dsChannel = client.user.id === Config.testingJBID ? client.channels.cache.find(x => x.id === "790431676970041356") : client.channels.cache.find(x => x.id === Config.dsChannel);

        let user = await User.findOne({
            user_id: author.id,
            guild_id: guild.id
        });

        let victim = await User.findOne({
            user_id: member.id,
            guild_id: guild.id
        });

        let noId = new Discord.MessageEmbed()
        .setAuthor(`Error`, Config.errorPng)
        .setDescription(`**—** No encontré un item con id de uso \`${id}\` en tu inventario.`)
        .setColor(Colores.rojo);

        let inventory = user.data.inventory;

        const inventoryFilter = x => x.use_id === id;

        let itemOnInventory = inventory.find(inventoryFilter);

        if(!itemOnInventory) return message.channel.send({embeds: [noId]});

        const isDarkShop = itemOnInventory.isDarkShop;

        const itemOnInventoryIndex = user.data.inventory.findIndex(inventoryFilter);

        // leer el uso y qué hace el item
        const shop = isDarkShop ? await DarkShop.findOne({guild_id: guild.id}) : await Shop.findOne({guild_id: guild.id});
        const item = shop.items.find(x => x.id === itemOnInventory.item_id);

        if(member === message.member && isDarkShop && item.use_info.effect === "negativo"){
            return message.reply(`Primero menciona con quien quieres interactuar con este item. \`${prefix}use ${id} <miembro>\`.`)
        }

        const info = item.use_info;

        const isSub = info.isSub;
        const isTemp = info.isTemp;
        const duration = info.duration;

        const boost_type = info.boost_type;
        const boost_objetive = info.boost_objetive;
        const boost_value = info.boost_value;

        const objetive = info.objetive;
        const action = info.action;
        const given = info.given;

        let responseEmbed = new Discord.MessageEmbed()
        .setAuthor("Listo", Config.bienPng)
        .setColor(isDarkShop ? Colores.negro : Colores.verde)
        .setDescription(`\`▸\` ${item.reply}`)
        .setTimestamp();

        const interaction = await successDarkShopInteraction(item, user, victim);

        if(objetive === "warns"){ // modifica los warns
            let warns = victim.warns;

            if(action === "add"){ // agrega warns
                const users = await User.find();
                let newId = await FindNewId(users, "warns", "id");

                for (let i = 0; i < Number(given); i++) {
                    let rule = Math.floor(Math.random() * Object.keys(reglas).length);

                    if(rule === 0) rule++;
                    
                    warns.push({rule_id: rule, id: newId});
                }

                if(interaction[0]) await victim.save();
                else return dsChannel.send({embeds: [interaction[1]]});
                
            } else { // los elimina
                if(!warns || warns.length === 0) return message.reply("No puedes usar este item porque no tienes Warns.");

                for(let i = 0; i < Number(given); i++){
                    victim.warns.splice(Math.floor(Math.random() * warns.length), 1); // eliminar un warn random
                }
                
                if(interaction[0]) await victim.save();
                else return dsChannel.send({embeds: [interaction[1]]});
            }

            responseEmbed.setFooter(`Ahora ${member.id === author.id ? "tienes" : `${member.user.tag} tiene`} ${victim.warns.length} ${victim.warns.length > 1 ? "warns" : "warn"}`, member.user.displayAvatarURL());

            //eliminar item del autor
            user.data.inventory.splice(itemOnInventoryIndex, 1);
            await user.save();
            
        } else if(objetive === "role"){
            const role = guild.roles.cache.find(x => x.id === given);
            
            if(action === "add"){
                if(interaction[0]){
                    if(member.roles.cache.find(x => x.id === role.id)) return message.reply(`No puedes usar este item porque ya ${member.id === author.id ? "tienes" : `${member.user.tag} tiene`} el role que se da.`);
                    if(isTemp) await LimitedTime(guild, given, member, victim, duration);
                    else member.roles.add(role);
                } else return dsChannel.send({embeds: [interaction[1]]});
            } else {
                if(interaction[0]){
                    if(!member.roles.cache.find(x => x.id === role.id)) return message.reply(`No puedes usar este item porque ya ${member.id === author.id ? "no tienes" : `${member.user.tag} no tiene`} el role que se quita.`);
                    member.roles.remove(role)
                } else return dsChannel.send({embeds: [interaction[1]]});
            }

            //eliminar item del autor
            user.data.inventory.splice(itemOnInventoryIndex, 1);
            await user.save();

        } else if(objetive === "boost"){
            const role = guild.roles.cache.find(x => x.id === given);
            
            if(action === "add"){
                const willBenefit = await WillBenefit(message.member, [boost_objetive, "any"]);
                if(willBenefit) return message.reply(`Lo siento, pero si usas este item, te estarías beneficiandote aún más, espera a que tu Boost actual termine para poder usar \`${item.name}\`.`)

                if(interaction[0]) await LimitedTime(guild, given, member, victim, duration, boost_type, boost_objetive, boost_value);
                else return dsChannel.send({embeds: [interaction[1]]});
            } else {
                if(!member.roles.cache.find(x => x.id === role.id)) return message.reply(`No puedes usar este item porque ${member.id === author.id ? "no tienes" : `${member.user.tag} no tiene`} el boost que se quita boost.`);
                
                let temprole = victim.data.temp_roles.findIndex(x => x.special.type === boost_type && x.special.objetive === boost_objetive);
                victim.data.temp_roles.splice(temprole, 1);

                member.roles.remove(role);

                if(interaction[0]) await victim.save();
                else return dsChannel.send({embeds: [interaction[1]]});
            }

            //eliminar item del autor
            user.data.inventory.splice(itemOnInventoryIndex, 1);
            await user.save();

        } else if(objetive === "item"){
            member = message.member;
            let deleteItem = false;

            if(isDarkShop && item.id === 4){ // stackoverflow
                deleteItem = true;
                let randomPercentage = Number(Number(Math.random() * 5).toFixed(1));
                let finalAc = Number(Number(victim.economy.dark.accuracy += randomPercentage).toFixed(1));

                victim.economy.dark.accuracy = finalAc;
                if(finalAc > 90) stats.accuracy = 90;

                await victim.save();
                await user.save();
            } else if(isDarkShop && item.id === 5){
                deleteItem = true;
                args[1] = "yo";

                console.log(args);
                
                if(!args[2] || isNaN(args[2])) return message.reply(`⚠️ [\`${prefix}use ${id} yo <ID>\`] Escribe la ID de un item de la tienda **NORMAL** a la que quieras reiniciar TU precio de compra. \`(${prefix}shop)\``);

                const purchaseFilter = x => x.item_id === Number(args[2]);
                
                let purchase = user.data.purchases.find(purchaseFilter); // buscar la info del item en la cuenta del usuario y si ya ha comprado este, y efectivamente tiene interés.
                let purchaseIndex = user.data.purchases.findIndex(purchaseFilter);

                if(!purchase) return message.reply(`No encontré compras de un item con la ID \`${args[2]}\` en tu cuenta. Revisa que sea la ID correcta y que no tengas el precio base.`);

                user.data.purchases.splice(purchaseIndex, 1);
                await user.save();
            } else if(itemOnInventory.active === false && action === "add"){
                // buscarlo
                victim.data.inventory[itemOnInventoryIndex].active = true;
                victim.data.inventory[itemOnInventoryIndex].active_since = new Date();
                await victim.save()
            } else {
                return message.reply("Este item ya está activo en tu cuenta.")
            }

            //eliminar item del autor
            if(deleteItem){
                user.data.inventory.splice(itemOnInventoryIndex, 1);
                await user.save();
            }
        } else {
            return message.channel.send(`¡${jeffrey_role}, ayuda por aquí!\n\n${message.member} espera un momento que Jeffrey es un poco lento en las computadoras y tiene que revisar algo para que todo funcione bien.\n\`\`\`json\n{ FATAL ERROR, in ${id}, UKNOWN OBJETIVE "${objetive}" }\`\`\``);
        }

        // enviar la respuesta.
        message.reply({embeds: [responseEmbed]});

        // enviar el embed ds en caso de ser necesario
        if(isDarkShop && member != message.member) return dsChannel.send({embeds: [interaction[1]]});

        async function successDarkShopInteraction(item, user, victimStats){ // para determinar si una interacción es exitosa o no
            const index = user.data.inventory.findIndex(x => x.item_id === item.id);

            if(item.use_info.effect === "na")return [-1]; // no es de la ds

            const author = guild.members.cache.find(x => x.id === user.user_id);
            const victim = guild.members.cache.find(x => x.id === victimStats.user_id);

            let skipped = new Discord.MessageEmbed()
            .setAuthor(`Interacción`, Config.darkLogoPng)
            .setDescription(`**—** ¡**${author.user.tag}** se ha volado la Firewall \`(${user.economy.dark.accuracy}%)\` y ha usado el item \`${item.name}\` en **${victim.user.tag}**!`)
            .setColor(Colores.negro)
            .setFooter(`${item.name} para ${victim.user.tag}`)
            .setTimestamp();

            let success = new Discord.MessageEmbed()
            .setAuthor(`Interacción`, Config.darkLogoPng)
            .setDescription(`**—** ¡**${author.user.tag}** ha usado el item \`${item.name}\` en **${victim.user.tag}**!`)
            .setColor(Colores.negro)
            .setFooter(`${item.name} para ${victim.user.tag}`)
            .setTimestamp();

            let fail = new Discord.MessageEmbed()
            .setAuthor(`Amenaza`, Config.darkLogoPng)
            .setDescription(`**—** ¡**${author.user.tag}** ha querido usar el item \`${item.name}\` en **${victim.user.tag}** pero NO HA FUNCIONADO!`)
            .setColor(Colores.negro)
            .setFooter(`${item.name} para ${victim.user.tag}`)
            .setTimestamp();

            if(item.use_info.effect === "negativo"){ // el item es negativo para el usuario al que se le aplica
                // revisar si tiene firewall ACTIVA
                const f = x => x.isDarkShop && x.item_id === 1 && x.active; // filtro
                const firewall = victimStats.data.inventory.find(f);
                const firewallIndex = firewall ? victimStats.data.inventory.findIndex(f) : null;

                if(firewall){ // tiene una firewall activa
                    // ¿se la salta?
                    let skip = chance.bool({likelihood: user.economy.dark.accuracy});

                    //eliminar item del autor
                    user.data.inventory.splice(index, 1);
                    await user.save();

                    if(!skip){ // borrar la firewall, no se la salta
                        // eliminar firewall
                        victimStats.data.inventory.splice(firewallIndex, 1);
                        await victimStats.save();
                        return [skip, fail];
                    } else return [skip, skipped];
                } else {
                    if(victimStats.economy.global.level >= 5){
                        //eliminar item del autor
                        user.data.inventory.splice(index, 1);
                        await user.save();

                        return [true, success];
                    }
                    else return [false, fail];
                } 
            } else {
                return [true, success];
            }
        }
    }
}