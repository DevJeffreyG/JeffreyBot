const ms = require("ms");
const moment = require("moment");

const { Command, HumanMs, Embed } = require("../../src/utils");

const { Config, Emojis, Responses, Cumplidos } = require("../../src/resources/");
const { multiplier } = Config;

const User = require("../../modelos/User.model.js");

const command = new Command({
    name: "coins",
    desc: "Gana Jeffros extras en un intervalo de 10 minutos (o menos)",
    category: "ECONOMY"
});

command.execute = async (interaction, params, client) => {
    let coinsCooldown = ms("10m");

    await interaction.deferReply();
    var randomCumplidos = Cumplidos.c[Math.floor(Math.random() * Cumplidos.c.length)];

    const guild = client.guilds.cache.find(x => x.id === interaction.guildId);
    const author = client.users.cache.find(x => x.id === interaction.user.id);
    const member = guild.members.cache.find(x => x.id === interaction.user.id);

    if(client.user.id === Config.testingJBID){
        if (member.roles.cache.find(x => x.id === "887151110861779035")) coinsCooldown /= 2; //5m
        if (member.roles.cache.find(x => x.id === "887151260086702081")) coinsCooldown /= 2; //2.5m
    } else {
        if (member.roles.cache.find(x => x.id === Config.lvl60)) coinsCooldown /= 2;
        if (member.roles.cache.find(x => x.id === Config.lvl99)) coinsCooldown /= 2;
    }

    let money = Math.ceil(Math.random() * 20);
    let tmoney = `**${Emojis.Jeffros}${money.toLocaleString('es-CO')}**`;
    let randommember = guild.members.cache.random();

    while (randommember.user.id === author.id) { // el randommember NO puede ser el mismo usuario
        console.log("'/coins', Es el mismo usuario, buscar otro random")
        randommember = guild.members.cache.random()
    }

    randommember = `**${randommember.displayName}**`;

    let fakemoney = `${Math.ceil(Math.random() * 1000) + 999} Jeffros`;

    if (multiplier != 1) {
        money = money * multiplier;
        tmoney = `**${Emojis.Jeffros}${money.toLocaleString('es-CO')}**`;
    }

    // buscar usuario
    const user = await User.findOne({
        user_id: author.id,
        guild_id: guild.id
    }) ?? await new User({
        user_id: author.id,
        guild_id: guild.id
    }).save();
    
    // buscar si tiene boost
    for (let i = 0; i < user.data.temp_roles.length; i++) {
        const temprole = user.data.temp_roles[i];
        const specialInfo = temprole.special;
        
        if(specialInfo.type === "boostMultiplier"){
            if(specialInfo.objetive === "jeffros" || specialInfo.objetive === "all"){
                money = money * Number(specialInfo.value);
                tmoney = `**${Emojis.Jeffros}${money.toLocaleString('es-CO')}📈**`;
                console.log(author.tag, "Boost de JEFFROS.")
            }
        }
    }

    let index = Responses.r[Math.floor(Math.random() * Responses.r.length)];
    let textString = index.text;
    let text = textString.replace(
        new RegExp("{ MONEY }", "g"),
        `${tmoney}`
    ).replace(
        new RegExp("{ MEMBER }", "g"),
        `${randommember}`
    ).replace(
        new RegExp("{ FAKE MONEY }", "g"),
        `${fakemoney}`
    ).replace(new RegExp("{ COOLDOWN }", "g"), `${coinsCooldown/60000}`);

    let memberColor = member.displayHexColor;

    let embed = new Embed()
    .defColor(memberColor)
    .defDesc(`${text}.`);

    if(index.author.toUpperCase() === "NONE"){
        
    } else {
        let rAuthor = guild.members.cache.find(x => x.id === index.author);
        let suggestor = rAuthor ? rAuthor.user.tag : "un usuario";
        let img = rAuthor ? rAuthor.user.displayAvatarURL() : guild.iconURL();
        embed.defFooter({text: `• Respuesta sugerida por ${suggestor}`, icon: img})
    }

    if (user.data.cooldowns.coins){
        let timer = user.data.cooldowns.coins;
        let toCheck = moment(timer).add(coinsCooldown, "ms");

        let left = new HumanMs(moment(toCheck)).left();

        if(moment().isAfter(toCheck)) user.data.cooldowns.coins = null;
        else
        return interaction.editReply(`Usa este comando en ${left}, ${randomCumplidos}`);
    }

    user.data.cooldowns.coins = new Date();
    user.economy.global.jeffros += money;
    await user.save();
    
    return interaction.editReply({embeds: [embed]});
}

module.exports = command;