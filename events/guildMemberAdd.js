const Discord = require("discord.js");

const Config = require("../base.json");

const User = require("../modelos/User.model.js");

module.exports = async (client, member) => {
    let tag = member.user.tag;
    const guild = member.guild;
    let channel = guild.channels.cache.find(x => x.id === Config.mainChannel);
    let reglasC = guild.channels.cache.find(x => x.id === Config.rulesChannel);
    let infoC = guild.channels.cache.find(x => x.id === Config.infoChannel);
    let botRole = guild.roles.cache.find(x => x.id === Config.botRole);
  
    if(client.user.id === Config.testingJBID){
      channel = guild.channels.cache.find(x => x.id === "535500338015502357");
      reglasC = guild.channels.cache.find(x => x.id === "482993020472393741");
      infoC = guild.channels.cache.find(x => x.id === "483007894942515202");
      botRole = guild.roles.cache.find(x => x.id === "794646554690322432");
    }
  
    if (member.user.bot) {
      return member.roles.add(botRole);
    }
  
    let bienvenidas = [
      `Bienvenid@ a \`${guild.name}\`, **${tag}**. Pásate por ${reglasC} e ${infoC} para aclarar las dudas frecuentes! ¡Disfruta!`,
      `¡Hola, **${tag}**! Muchas gracias por unirte a \`${guild.name}\`, ve a los canales: ${reglasC} e ${infoC} para evitar inconvenientes, y ¡pásala bien!`,
      `¡Eyyy, **${tag}**! Bienvenid@ a \`${guild.name}\` 🎉 ¡Echa un vistazo a ${reglasC} e ${infoC} para que te guíes dentro del server! :D`,
      `¡Hey! Hola **${tag}**, gracias por unirte a \`${guild.name}\` 😄 ¡Pásate por ${reglasC} e ${infoC} para que te hagas una idea de como funciona el server!`
    ];
  
    let fBienv = bienvenidas[Math.floor(Math.random() * bienvenidas.length)];
  
    if (member.user.id === "373901344995803138") {
      // si el usuario es ares
      fBienv = `Hola **${tag}**. Bienvenido, otra vez.`;
    }
  
    let embed = new Discord.MessageEmbed()
      .setDescription(fBienv)
      .setFooter(`* Para poder hablar en el chat debes aceptar las reglas`, guild.iconURL())
      .setColor(Colores.verde);
  
    member.send({embeds: [embed]}).catch(e => {
      channel.send({embeds: [embed]});
    });
  
    // crear usuario nuevo
    let query = await User.findOne({
      user_id: member.id,
      guild_id: member.guild.id
    });
  
    if(!query){
      const newUser = new User({
        user_id: member.id,
        guild_id: guild.id
      });
  
      newUser.save();
    }
  
    client.user.setActivity(`${prefix}ayuda - ${member.guild.memberCount} usuarios🔎`);
}