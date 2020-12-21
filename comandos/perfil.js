const Config = require("./../base.json");
const Colores = require("./../colores.json");
const Discord = require("discord.js");
const prefix = Config.prefix;
const jeffreygID = Config.jeffreygID;
const mainChannel = Config.mainChannel;

/* ##### MONGOOSE ######## */

const Cuenta = require("../modelos/cuenta.js");

/* ##### MONGOOSE ######## */

module.exports.run = async (bot, message, args) => {

  if(!message.content.startsWith(prefix))return;

  // Variables
  let author = message.author;
  const guild = message.guild;

  let member;
  if(!args[0]){ // Mostrar perfil.
    Cuenta.findOne({
        userID: author.id
      }, (err, account) => {
        if(err) throw err;
        
        if(!account){
          let errorEmbed = new Discord.MessageEmbed()
          .setAuthor(`| Error 404`, "https://cdn.discordapp.com/emojis/537023544136040452.png")
          .setDescription(`**—** No puedes ver tu perfil si no tienes uno. Habla en el <#${mainChannel}> para crearlo automáticamente.`)
          .setColor(Colores.rojo);
        
          return message.channel.send(errorEmbed).then(r => r.delete(20000));
        } else {
          
          let userName = account.username;
          let accBio = account.bio;
          let accAge = account.age;
          let accSex = account.sex;
          let accBd = account.birthd;
          let accHex = account.hex;
          let accSeen = account.seenBy;
          
          if(account.username === "N/A"){
            userName = "No especificado";              
          }
          
          if(account.bio === "N/A"){
            accBio = "Sin biografía"
          }
          
          if(account.age === "N/A"){
            accAge = "Sin especificar"
          }
          
          if(account.sex === "0"){
            accSex = "Masculino";
          } else if(account.sex === "1"){
            accSex = "Femenino";
          } else {
            accSex = "Sin especificar";
          }
          
          if(account.birthd === "N/A"){
            accBd = "Sin especificar";
          }
          
          if(account.hex === "N/A"){
            accHex = "#36393e"
          }
          
          if(account.seenBy === 0){
            accSeen = "0 veces";
          } else if(account.seenBy === 1){
            accSeen = "1 vez";
          } else {
            accSeen = `${account.seenBy} veces`;
          }
          
          let embed = new Discord.MessageEmbed()
          .setAuthor(`| Perfil`, author.avatarURL())
          .setDescription(`**— Nombre de usuario**: ${userName}
**— Edad**: ${accAge}.
**— Sexo**: ${accSex}.
**— Cumpleaños**: ${accBd}.
**— Biografía**: ${accBio}`)
          .setFooter(`Visto: ${accSeen}.`)
          .setColor(accHex);
          
          return message.channel.send(embed);
          
        }
      })
  } else if(args[0].toLowerCase() === "config"){
    let configEmbed = new Discord.MessageEmbed()
    .setAuthor(`| Perfil - Configuraciones`, "https://cdn.discordapp.com/emojis/537023544136040452.png")
    .setDescription(`**—** \`bio\`: Una vez registrado, puedes cambiar aspectos de tu **PERFIL**, uno de estos es tu biografía, AKA: la información que le quieres dar a los demás.

**—** \`user\`: Cambias tu nombre de usuario, también conocido como Username.

**—** \`bd\`: Determina tu fecha de cumpleaños con el formato DD MM AAAA. Si escribes en el <#${mainChannel}> el día de tu cumpleaños se te dará un rol por 24 horas.

**—** \`gen\`: Determina tu género / sexo. Masculino o femenino.

**—** \`hex\`: Determinas el color con el que aparecerá tu perfil. Tipo HEX. Ejemplo: \`#00ff00\`. Debe tener el **#** para evitar problemas.`)
    .setColor(Colores.verde);

    if(!args[1]) return message.channel.send(configEmbed);
    let config = args[1].toLowerCase();
    if(config === "bio"){
      Cuenta.findOne({
        userID: author.id
      }, (err, account) => {
        if(err) throw err;
        
        if(!account){
          let errorEmbed = new Discord.MessageEmbed()
          .setAuthor(`| Error 404`, "https://cdn.discordapp.com/emojis/537023544136040452.png")
          .setDescription(`**—** Para poder cambiar tu biografía primero debes tener un perfil para cambiarla / definirla. Habla en el <#${mainChannel}> para crearlo automáticamente.`)
          .setColor(Colores.rojo);
        
          return message.channel.send(errorEmbed).then(r => r.delete(20000));
        } else {
          let newBio = args.join(" ").slice(args[0].length + args[1].length + 2);
          
          if(!newBio){
            return message.reply(`Por favor, determina tu biografía.`).then(r => r.delete(10000));                                                                              
          }
          
          if(newBio.length > 100) return message.reply(`No puedes tener una biografía con más de 100 caracteres.`);
          
          account.bio = newBio;
          account.save().catch(e => console.log(e));

          let corEmbed = new Discord.MessageEmbed()
          .setAuthor(`| Perfil - Biografía`, "https://cdn.discordapp.com/emojis/537023544136040452.png")
          .setDescription(`**—** Se ha cambiado tu biografía.`)
          .setColor(Colores.verde);

          return message.channel.send(corEmbed);
          
        }
      })
    }

    if(config === "user"){
      Cuenta.findOne({
        userID: author.id
      }, (err, account) =>{
        if(err) throw err;
        
        if(!account){
          let errorEmbed = new Discord.MessageEmbed()
          .setAuthor(`| Error 404`, "https://cdn.discordapp.com/emojis/537023544136040452.png")
          .setDescription(`**—** Para poder cambiar tu nombre de usuario primero debes tener un perfil. Habla en el <#${mainChannel}> para crearlo automáticamente.`)
          .setColor(Colores.rojo);

          return message.channel.send(errorEmbed).then(r => r.delete(20000))
        } else {
          if(!args[2]){
            return message.reply(`Determina tu nuevo nombre de usuario.`);
          }
          
          let userNameNew = args.join(" ").slice(args[0].length + args[1].length + 2);
          
          account.username = userNameNew;
          account.save()
          .catch(e => console.log(e));
          
          let corEmbed = new Discord.MessageEmbed()
          .setAuthor(`| Perfil - Username`, "https://cdn.discordapp.com/emojis/537023544136040452.png")
          .setDescription(`**—** Se ha cambiado tu nombre de usuario.`)
          .setColor(Colores.verde);

          return message.channel.send(corEmbed);

        }
      })
    }

    if(config === "gen"){
      Cuenta.findOne({
        userID: author.id
      }, (err, account) => {
        if(err) throw err;
        
        if(!account){
          let errorEmbed = new Discord.MessageEmbed()
          .setAuthor(`| Error 404`, "https://cdn.discordapp.com/emojis/537023544136040452.png")
          .setDescription(`**—** Para poder cambiar tu género primero debes tener un perfil para cambiarlo / definirlo. Habla en el <#${mainChannel}> para crearlo automáticamente.`)
          .setFooter(`Puedes responder con: M, F, Masculino, Femenino, Hombre, Mujer, Male, Female.`)
          .setColor(Colores.rojo);
        
          return message.channel.send(errorEmbed).then(r => r.delete(20000));          
        } else {
          if(!args[2]){
            return message.reply(`Determina tu género.`).then(r => r.delete(20000));
          }
          let selSex = args[2].toLowerCase();
          
          if(selSex === "m" || selSex === "masculino" || selSex === "hombre" || selSex === "male" || selSex === "h"){
            selSex = 0;
          } else 
          if(selSex === "f" || selSex === "femenino" || selSex === "mujer" || selSex === "female" || selSex === "m"){
            selSex = 1;
          } else {
            return message.reply(`Por favor selecciona tu género con: \`M\`, \`F\`, \`H\`, \`M\`, \`Masculino\`, \`Femenino\`, \`Hombre\`, \`Mujer\`, \`Male\`, \`Female\`.`);
          }
          
          account.sex = selSex;
          account.save()
          .catch(e => console.log(e));
          
          let corEmbed = new Discord.MessageEmbed()
          .setAuthor(`| Perfil - Género`, "https://cdn.discordapp.com/emojis/537023544136040452.png")
          .setDescription(`**—** Se ha cambiado tu género.`)
          .setColor(Colores.verde);

          return message.channel.send(corEmbed);
        }
      })
    }

    if(config === "hex"){
      Cuenta.findOne({
        userID: author.id
      }, (err, account) => {
        if(err) throw err;
        
        if(!account){
            let errorEmbed = new Discord.MessageEmbed()
           .setAuthor(`| Error 404`, "https://cdn.discordapp.com/emojis/537023544136040452.png")
           .setDescription(`**—** Para poder cambiar tu color, primero debes tener un perfil al cual cambiárselo. Habla en el <#${mainChannel}> para crearlo automáticamente.`)
           .setColor(Colores.rojo);

           return message.channel.send(errorEmbed).then(r => r.delete(20000)); 
        } else {
          if(!args[2]){
            return message.reply(`Debes definir tu color. __Recuerda que debe ser tipo HEX **y** empezar por un **#**___.`);
          }
          
          account.hex = args[2];
          account.save()
          .catch(e => console.log(e));
          
         let corEmbed = new Discord.MessageEmbed()
         .setAuthor(`| Perfil - Color`, "https://cdn.discordapp.com/emojis/537023544136040452.png")
         .setDescription(`**—** Se ha cambiado tu color de perfil.`)
         .setColor(Colores.verde);

         return message.channel.send(corEmbed);
          
        }
      })
    }

    if(config === "bd"){
      let userBD; // Usuario al que se le va a cambiar la fecha.
      if(message.author.id === jeffreygID && args[5]){
        userBD = args[5];
      } else {
        userBD = message.author.id;
      }
      Cuenta.findOne({
        userID: userBD
      }, (err, account) => {
        if(err) throw err;
        
        if(!account){
          let errorEmbed = new Discord.MessageEmbed()
          .setAuthor(`| Error 404`, "https://cdn.discordapp.com/emojis/537023544136040452.png")
          .setDescription(`**—** Para poder cambiar tu fecha de nacimiento primero debes tener un perfil. Habla en el <#${mainChannel}> para crearlo automáticamente.`)
          .setFooter(`Responder con el siguiente formato: DD MM AAAA. Ejemplo: ${prefix}net bd 7 11 2000`)
          .setColor(Colores.rojo);
        
          return message.channel.send(errorEmbed).then(r => r.delete(20000));  
        } else {
          if(!args[2]){
            return message.reply(`Responde con el siguiente formato: \`DD MM AAAA\`.\nEjemplo: \`${prefix}perfil config bd 07 06 2000\`, que sería igual a 7 de Junio del 2000.`);
          } else if(!args[3]){
            return message.reply(`Responde con el siguiente formato: \`DD MM AAAA\`.\nEjemplo: \`${prefix}perfil config bd 07 06 2000\`, que sería igual a 7 de Junio del 2000.`);              
          } else if(!args[4]){
            return message.reply(`Responde con el siguiente formato: \`DD MM AAAA\`.\nEjemplo: \`${prefix}perfil config bd 07 06 2000\`, que sería igual a 7 de Junio del 2000.`);              
          }

          let bdDay = args[2];
          let bdMonth = args[3];
          let bdYear = args[4];
          let dateString = `${bdYear}-${bdMonth}-${bdDay}`;
          console.log(`############# DATESTRING: "${dateString}" #########################`)
          var hoy = new Date();
          var userBD = new Date(dateString);
          var edad = hoy.getFullYear() - userBD.getFullYear();
          console.log(`############### CUMPLEAÑOS: "${userBD}" ##############`);
          var m = hoy.getMonth() - userBD.getMonth();

          if (m < 0 || (m === 0 && hoy.getDate() < userBD.getDate())) {
              edad--;
          }

          if(isNaN(bdDay)) return message.reply(`no he podido determinar tu edad, por favor, verifica tu fecha de cumpleaños.\nEjemplo: \`${prefix}perfil config bd 07 06 2000\`, que sería igual a 7 de Junio del 2000.`)
          if(isNaN(bdMonth)) return message.reply(`no he podido determinar tu edad, por favor, verifica tu fecha de cumpleaños.\nEjemplo: \`${prefix}perfil config bd 07 06 2000\`, que sería igual a 7 de Junio del 2000.`)
          if(isNaN(bdYear)) return message.reply(`no he podido determinar tu edad, por favor, verifica tu fecha de cumpleaños.\nEjemplo: \`${prefix}perfil config bd 07 06 2000\`, que sería igual a 7 de Junio del 2000.`)

          if(isNaN(edad)) return message.reply(`no he podido determinar tu edad, por favor, verifica tu fecha de cumpleaños.`)
          if(edad === 0) return message.reply(`¿Naciste este año y ya sabes usar las letras? Increíble.`);
          if(edad < 0) return message.reply(`una fecha real, por favor.`);
          if(edad > 60) return message.reply(`¿Tienes más de ඹﾘ años? lo dudo.`);
          if(edad < 10) return message.reply(`Si tienes menos de 10 años no deberías estar discord. *Bueno realmente, si tienes menos de **13 años** no deberías estar aquí.*`);
          
          console.log(`############### EDAD: "${edad}" ##############`);
          
          account.bdMonthString = `${bdMonth}`; // Se hace antes para evitar el cambio de número a palabras.
          
          if(bdMonth - 1 === 0){
            bdMonth = "Enero";
          } else if(bdMonth - 1 === 1){
            bdMonth = "Febrero";
          } else if(bdMonth - 1 === 2){
            bdMonth = "Marzo";
          } else if(bdMonth - 1 === 3){
            bdMonth = "Abril";
          } else if(bdMonth - 1 === 4){
            bdMonth = "Mayo";
          } else if(bdMonth - 1 === 5){
            bdMonth = "Junio";
          } else if(bdMonth - 1 === 6){
            bdMonth = "Julio";
          } else if(bdMonth - 1 === 7){
            bdMonth = "Agosto";
          } else if(bdMonth - 1 === 8){
            bdMonth = "Septiembre";
          } else if(bdMonth - 1 === 9){
            bdMonth = "Octubre";
          } else if(bdMonth - 1 === 10){
            bdMonth = "Noviembre";
          } else if(bdMonth - 1 === 11){
            bdMonth = "Diciembre";
          }
          
          account.birthd = `${bdDay} de ${bdMonth}`;
          account.age = edad;
          account.birthy = `${bdYear}`;
          account.bdString = `${dateString}`;
          account.bdDayString = `${bdDay}`
          account.save()
          .catch(e => console.log(e));            
          
          let corEmbed = new Discord.MessageEmbed()
          .setAuthor(`| Perfil - Cumpleaños`, "https://cdn.discordapp.com/emojis/537023544136040452.png")
          .setColor(Colores.verde);
          
          if(args[5] === message.author.id && message.author.id === jeffreygID) {
            corEmbed.setDescription(`**—** Se ha actualizado la fecha de nacimiento de **${guild.member(guild.members.cache.get(args[5]))}**, también su edad.`);
          } else {
            corEmbed.setDescription(`**—** Se ha cambiado tu fecha de nacimiento, también tu edad.`);
          }

          return message.channel.send(corEmbed);
          
        }
      })
    }
  } else {
    member = message.guild.member(message.mentions.users.first() || message.guild.members.cache.get(args[0]));
    Cuenta.findOne({
        userID: member.id
      }, (err, account) => {
        if(err) throw err;
        

        if(!account){
          return message.reply(`No existe nadie con esa ID aún...`)
        } else {
          
          let member = guild.members.cache.get(account.userID);
          
          if(!member) return message.reply(`Se fueron muy pronto...`);
          
          let userName = account.username;
          let accBio = account.bio;
          let accAge = account.age;
          let accSex = account.sex;
          let accBd = account.birthd;
          let accHex = account.hex;
          let accSeen = account.seenBy;
          
          if(account.username === "N/A"){
            userName = "No especificado";              
          }
          
          if(account.bio === "N/A"){
            accBio = "Sin biografía"
          }
          
          if(account.age === "N/A"){
            accAge = "Sin especificar"
          }
          
          if(account.sex === "0"){
            accSex = "Masculino";
          } else if(account.sex === "1"){
            accSex = "Femenino";
          } else {
            accSex = "Sin especificar";
          }
          
          if(account.birthd === "N/A"){
            accBd = "Sin especificar";
          }
          
          if(account.hex === "N/A"){
            accHex = "#36393e"
          }
          
          if(author.id != account.userID){
            if(account.seenBy === 0){
              accSeen = "0 veces";
            } else if(account.seenBy === 1){
              accSeen = "1 vez";
            } else {
              accSeen = `${account.seenBy+1} veces`;
            }
            
            account.seenBy = account.seenBy + 1;            
            account.save()
            .catch(e => console.log(e));
          } else {
            
            if(account.seenBy === 0){
              accSeen = "0 veces";
            } else if(account.seenBy === 1){
              accSeen = "1 vez";
            }
          }
            
            let embed = new Discord.MessageEmbed()
            .setAuthor(`| Perfil`, member.user.avatarURL())
            .setDescription(`**— Nombre de usuario**: ${userName}
**— Edad**: ${accAge}.
**— Sexo**: ${accSex}.
**— Cumpleaños**: ${accBd}.
**— Biografía**: ${accBio}`)
            .setFooter(`Visto: ${accSeen}.`)
            .setColor(accHex);

            return message.channel.send(embed);
        }
    })
}
}

module.exports.help = {
    name: "perfil",
    alias: "profile"
}
