const Config = require("../../src/resources/base.json");
const Colores = require("../../src/resources/colores.json");
const Emojis = require("../../src/resources/emojis.json");
const Discord = require("discord.js");
const ms = require("ms");

const { Initialize, TutorialEmbed, InteractivePages } = require("../../src/utils/");
const { Users, DarkShops } = require("mongoose").models;

const commandInfo = {
    name: "top",
    aliases: ["tops"],
    info: "Puedes ver los tops de Jeffros, EXP, y puntos de reputación actuales",
    params: [
        {
            name: "top", display: "jeffros | exp | rep", type: "Options", options: ["jeffros", "exp", "rep"], optional: false
        }
    ],
    userlevel: "USER",
    category: "ECONOMY"
}

module.exports = {
    data: commandInfo,
    async execute(client, message, args){

        const { guild, author, prefix, executionInfo } = await Initialize(client, message);

        let response = await TutorialEmbed(commandInfo, executionInfo, args);

        if(response[0] === "ERROR") return console.log(response); // si hay algún error

        const top = response.find(x => x.param === "top").data;

        // Comando
        let base = {
            title: `Top: ${top.toUpperCase()}`,
            icon: guild.iconURL(),
            footer: `Eres el {TOP} en el top - Página {ACTUAL} de {TOTAL}`,
            icon_footer: author.displayAvatarURL()
        }

        const pages = await generateTop(guild, top);

        let embed = new Discord.EmbedBuilder()
        .setAuthor(base.title, base.icon)
        .setColor(Colores.verde)
        .setDescription(`${pages[0].join(" ")}`)
        .setFooter(base.footer.replace(new RegExp("{ACTUAL}", "g"), `1`).replace(new RegExp("{TOTAL}", "g"), `${pages.length}`), base.icon_footer);
        
        let msg = await message.reply({embeds: [embed]});

        await InteractivePages(message, msg, pages, base);

        async function generateTop(guild, type){
            const itemsPerPage = 5;

            let pags = [];
            let actualpage = [];

            
            if(type === "jeffros"){
                const users = await Users.find({guild_id: guild.id});
                const _res = await getJeffrosAndDJ(guild, users);
                const res = _res[0];

                base.footer = base.footer.replace(new RegExp("{TOP}", "g"), `${_res[1]}`);

                let pag_actual = 1;

                let fin = itemsPerPage * pag_actual - 1; // el index del ultimo item a mostrar
                if(res.length <= fin){
                    fin = res.length - 1;
                }

                for (let i = 0; i < res.length; i++) {
                    const user = res[i];

                    const gettingRank = await getJeffrosAndDJ(guild, users, user.userID);
                    const rank = gettingRank[2];

                    const member = guild.members.cache.find(x => x.id === user.userID);

                    if(i > fin) {
                        pags.push(actualpage);
                  
                        actualpage = [];
                        pag_actual++;
                        fin = itemsPerPage * pag_actual - 1;
                  
                        if(res.length <= fin){
                          fin = res.length - 1;
                        }
                    }

                    let darkshopMoney = user.darkjeffros != 0 ? ` (${Emojis.Dark}${user.darkjeffros.toLocaleString('es-CO')}➟**${Emojis.Jeffros}${user.darkjeffrosValue.toLocaleString('es-CO')}**)` : "";

                    if (rank === 1) {
                        actualpage.push(`**🏆 ${member.user.username}**\n**—** ${Emojis.Jeffros}${user.total.toLocaleString('es-CO')}${darkshopMoney}\n\n`);
                    } else if (rank === 2) {
                        actualpage.push(`**🥈 ${member.user.username}**\n**—** ${Emojis.Jeffros}${user.total.toLocaleString('es-CO')}${darkshopMoney}\n\n`);
                    } else if (rank === 3) {
                        actualpage.push(`**🥉 ${member.user.username}**\n**—** ${Emojis.Jeffros}${user.total.toLocaleString('es-CO')}${darkshopMoney}\n\n`);
                    } else {
                        actualpage.push(`**${rank}. ${member.user.username}**\n**—** ${Emojis.Jeffros}${user.total.toLocaleString('es-CO')}${darkshopMoney}\n\n`);
                    }
                }

                pags.push(actualpage);
            }

            if(type === "exp"){
                const users = await Users.find({guild_id: guild.id}).sort([["economy.global.exp", "descending"]]);

                const yourRank = await getRank(users, author.id);

                base.footer = base.footer.replace(new RegExp("{TOP}", "g"), `${yourRank[0]}`);

                let pag_actual = 1;

                let fin = itemsPerPage * pag_actual - 1; // el index del ultimo item a mostrar
                if(users.length <= fin){
                    fin = users.length - 1;
                }

                for (let i = 0; i < users.length; i++) {
                    const user = users[i];

                    const gettingRank = await getRank(users, user.user_id);
                    const rank = gettingRank[1];

                    const member = guild.members.cache.find(x => x.id === user.user_id);

                    if(i > fin) {
                        pags.push(actualpage);
                  
                        actualpage = [];
                        pag_actual++;
                        fin = itemsPerPage * pag_actual - 1;
                  
                        if(users.length <= fin){
                          fin = users.length - 1;
                        }
                    }

                    if (rank === 1) {
                        actualpage.push(`**🏆 ${member.user.username}**\n**—** Nivel: \`${user.economy.global.level.toLocaleString("es-CO")}\`\n**—** EXP: \`${user.economy.global.exp.toLocaleString('es-CO')}\`\n\n`);
                    } else if (rank === 2) {
                        actualpage.push(`**🥈 ${member.user.username}**\n**—** Nivel: \`${user.economy.global.level.toLocaleString("es-CO")}\`\n**—** EXP: \`${user.economy.global.exp.toLocaleString('es-CO')}\`\n\n`);
                    } else if (rank === 3) {
                        actualpage.push(`**🥉 ${member.user.username}**\n**—** Nivel: \`${user.economy.global.level.toLocaleString("es-CO")}\`\n**—** EXP: \`${user.economy.global.exp.toLocaleString('es-CO')}\`\n\n`);
                    } else {
                        actualpage.push(`**${rank}. ${member.user.username}**\n**—** Nivel: \`${user.economy.global.level.toLocaleString("es-CO")}\`\n**—** EXP: \`${user.economy.global.exp.toLocaleString('es-CO')}\`\n\n`);
                    }
                }

                pags.push(actualpage);
            }

            if(type === "rep"){
                const users = await Users.find({guild_id: guild.id}).sort([["economy.global.reputation", "descending"]]);

                const yourRank = await getRank(users, author.id);

                base.footer = base.footer.replace(new RegExp("{TOP}", "g"), `${yourRank[0]}`);

                let pag_actual = 1;

                let fin = itemsPerPage * pag_actual - 1; // el index del ultimo item a mostrar
                if(users.length <= fin){
                    fin = users.length - 1;
                }

                for (let i = 0; i < users.length; i++) {
                    const user = users[i];

                    const gettingRank = await getRank(users, user.user_id);
                    const rank = gettingRank[1];

                    const member = guild.members.cache.find(x => x.id === user.user_id);

                    if(i > fin) {
                        pags.push(actualpage);
                  
                        actualpage = [];
                        pag_actual++;
                        fin = itemsPerPage * pag_actual - 1;
                  
                        if(users.length <= fin){
                          fin = users.length - 1;
                        }
                    }

                    if (rank === 1) {
                        actualpage.push(`**🏆 ${member.user.username}**\n**—** Puntos de reputación: \`${user.economy.global.reputation.toLocaleString("es-CO")}\`\n\n`);
                    } else if (rank === 2) {
                        actualpage.push(`**🥈 ${member.user.username}**\n**—** Puntos de reputación: \`${user.economy.global.reputation.toLocaleString("es-CO")}\`\n\n`);
                    } else if (rank === 3) {
                        actualpage.push(`**🥉 ${member.user.username}**\n**—** Puntos de reputación: \`${user.economy.global.reputation.toLocaleString("es-CO")}\`\n\n`);
                    } else {
                        actualpage.push(`**${rank}. ${member.user.username}**\n**—** Puntos de reputación: \`${user.economy.global.reputation.toLocaleString("es-CO")}\`\n\n`);
                    }
                }

                pags.push(actualpage);
            }


            return pags || null;
        }

        async function getJeffrosAndDJ(guild, users, id){
            id = id ?? author.id
            // DARKJEFFROS
            let globalq = await DarkShops.findOne({
                guild_id: guild.id
            });
      
              const inflation = globalq.inflation.value;
      
              let res = []; // array para los usuarios con jeffros & dj si es que tienen
              for (let i = 0; i < users.length; i++) {
                const member = message.guild.members.cache.get(users[i].user_id) || null;
                
                // agregar la cantidad de darkjeffros
                if(member){
      
                  let darkjeffros = users[i].economy.dark.darkjeffros ?? 0;
                  let darkjeffrosValue = users[i].economy.dark.darkjeffros ? Number(inflation*200*users[i].economy.dark.darkjeffros) : 0;
                  let finalQuantity = darkjeffrosValue != 0 ? (darkjeffrosValue) + users[i].economy.global.jeffros : users[i].economy.global.jeffros;
      
                  let toPush = { userID: member.user.id, darkjeffros: darkjeffros, darkjeffrosValue: darkjeffrosValue, total: finalQuantity }
      
                  res.push(toPush)
                }
              }
      
              res.sort(function(a, b){ // ordenar el array mayor a menor, por array.total
                if(a.total > b.total){
                  return -1;
                }
                if(a.total < b.total){
                  return 1;
                }
      
                return 0;
              })

            let yourRank = await getRank(res, id);

            return [res, yourRank[0], yourRank[1]];
        }

        async function getRank(query, id){

            let yourRank = query[0].userID ? query.findIndex(x => x.userID === id) + 1 : query.findIndex(x => x.user_id === id) + 1;
            let textRank;

            switch (yourRank) {
                case 1:
                    textRank = `🏆${yourRank}ro`;
                  break;
  
                case 2:
                    textRank = `🥈${yourRank}do`;
                  break;
  
                case 3:
                    textRank = `🥉${yourRank}ro`;
                  break;
  
                case 4:
                case 5:
                case 6:
                    textRank = `${yourRank}to`;
                  break;
  
                case 7:
                case 10:
                    textRank = `${yourRank}mo`;
                  break;
  
                case 9:
                    textRank = `${yourRank}no`;
                  break;
  
                default:
                    textRank = `${yourRank}vo`;
                  break;
            }

            return [textRank, yourRank]
        }
    }
}