const Config = require("./../base.json");
const Colores = require("./../colores.json");
const Emojis = require("./../emojis.json");
const Discord = require("discord.js");
const bot = new Discord.Client();
const fs = require("fs");
const ms = require("ms");
const prefix = Config.prefix;
const jeffreygID = Config.jeffreygID;
const jgServer = Config.jgServer;
const offtopicChannel = Config.offtopicChannel;
const mainChannel = Config.mainChannel;
const botsChannel = Config.botsChannel;
const version = Config.version;

/* ##### MONGOOSE ######## */

const Jeffros = require("../modelos/jeffros.js");
const Reporte = require("../modelos/reporte.js");
const Exp = require("../modelos/exp.js");
const Warn = require("../modelos/warn.js");
const Banned = require("../modelos/banned.js");
const Cuenta = require("../modelos/cuenta.js");
/* ##### MONGOOSE ######## */

module.exports.run = async (bot, message, args) => {

  if(!message.content.startsWith(prefix))return;
  if(message.author.id != jeffreygID) return message.reply(`este comando está siendo actualizado, vuelve más tarde.`);

  // Variables
  let author = message.author;
  let guild = message.guild;
    
  let embed = new Discord.MessageEmbed()
  .setTitle(`Ayuda: ${prefix}net`)
  .setColor(Colores.nocolor)
  .setDescription(`▸ El uso correcto es: ${prefix}net\n▸ Main de la Jeffrey Net.`)
  .setFooter(`<> Obligatorio () Opcional┊Alias: ${prefix}jeffreynet`);
  
  if(!args[0]){
    let netEmbed = new Discord.MessageEmbed()
    .setAuthor(`| JeffreyNet - Main`, "https://cdn.discordapp.com/emojis/537023544136040452.png")
    .setDescription(`**—** ¡Bienvenido a la Jeffrey Net!
    **—** Ahora mismo estás en la main del Jeffrey Net, puedes visitar otras partes de ella haciendo otro tipo de comandos. Para verlos todos sólo has el comando \`${prefix}net sitios\`.
    **—** Jeffrey Net, es una especie de web parecida a __Facebook__ o tiene esa misma idea.`)
    .setColor(Colores.nocolor);
    
    message.channel.send(netEmbed);
  } else {
      let site = args[0].toLowerCase();
    
      if(site === "sitios"){
      let helpEmbed = new Discord.MessageEmbed()
      .setAuthor(`| JeffreyNet - Sitios`, "https://cdn.discordapp.com/emojis/537023544136040452.png")
      .setDescription(`**—** \`${prefix}net register\`: Te registras en la Jeffrey Net.

**—** \`${prefix}net pass\`: Contraseña de seguridad. Con ella evitas que cualquier persona elimine tu cuenta.

**—** \`${prefix}net bio\`: Una vez registrado, puedes cambiar aspectos de tu **PERFIL**, uno de estos es tu biografía, AKA: la información que le quieres dar a los demás.

**—** \`${prefix}net user\`: Cambias tu nombre de usuario, también conocido como Username.

**—** \`${prefix}net bd\`: Determina tu fecha de cumpleaños con el formato DD MM   AAAA. Si escribes en el <#${mainChannel}> el día de tu cumpleaños se te dará un rol por 24 horas.

**—** \`${prefix}net gen\`: Determina tu género / sexo. Masculino o femenino.

**—** \`${prefix}net hex\`: Determinas el color con el que aparecerá tu perfil. Tipo HEX. Ejemplo: \`#00ff00\`. Debe tener el **#** para evitar problemas.

**—** \`${prefix}net perfil\`: Simplemente visualizas tu perfil actual.

**—** \`${prefix}net id\`: En tu cuenta / perfil, hay algo que se reconoce como tu ID, este número ayuda a los demás usuarios para poder ver tu perfil, este número se genera de acuerdo a tu número de cuenta; esto quiere decir también, que este número será único y nadie más lo tendrá y por lo tanto no puede ser cambiado. Con este comando, puedes saber fácilmente cuál es el ID de algún otro usuario.

**—** \`${prefix}net <ID de perfil>\`: Haciendo esta combinación, puedes ver el perfil de otro usuario por su ID.

**—** \`${prefix}net delete\`: Eliminas tu perfil de la existencia, sólo tú puedes usar este comando. SE DEBE INTRODUCIR LA CONTRASEÑA DE SEGURIDAD.`)
      .setColor(Colores.verde);

      message.channel.send(helpEmbed);
    } else
      
      if(site === "register" || site === "registrar"){
      Cuenta.findOne({
        userID: author.id
      }, (err, account) => {
        if(err) throw err;
        
        if(!account){
          Cuenta.countDocuments({}, function(err, c){
            const newAccount = new Cuenta({
              userID: author.id,
              discordname: author.username,
              username: "N/A",
              realname: author.username,
              pass: "N/A",
              bio: "N/A",
              age: "N/A",
              sex: "N/A",
              hex: "N/A",
              birthd: "N/A",
              birthy: "N/A",
              seenBy: 0,
              id: c + 1
            })
            
            newAccount.save()
            .catch(e => console.log(e));
            
            let newAcEmbed = new Discord.MessageEmbed()
            .setAuthor(`| JeffreyNet - Register`, "https://cdn.discordapp.com/emojis/537023544136040452.png")
            .setDescription(`**—** Tu cuenta ha sido creada. Por favor selecciona una contraseña (\`${prefix}net pass\`) lo antes posible. **__(HAZLO DESDE MENSAJES PRIVADOS)__**.

**—** Username: N/A
**—** Nombre real: ${author.username}
**—** Biografía: N/A
**—** Edad: N/A
**—** Género: N/A
**—** Cumpleaños: N/A
**—** ID: ${newAccount.id}`)
            .setColor(Colores.nocolor);
            
            return message.channel.send(newAcEmbed);
          })
        } else {
          let errorEmbed = new Discord.MessageEmbed()
          .setAuthor(`| JeffreyNet - ERROR`, "https://cdn.discordapp.com/emojis/537023544136040452.png")
          .setDescription(`**—** Ya estás registrado en Jeffrey Net. Si quieres cambiar alguna información de tu cuenta, usa su respectivo comando. (\`${prefix}net sitios\`).`)
          .setColor(Colores.rojo);
          
          return message.channel.send(errorEmbed).then(r => r.delete(10000));
        }
      })
    } else
      
      if(site === "pass" || site === "code"){
      if(message.channel.type != "dm"){
        return message.reply("¡USA ESTE COMANDO EN MENSAJES PRIVADOS!");
      }
      Cuenta.findOne({
        userID: author.id
      }, (err, account) => {
        if(err) throw err;
        
        if(!account){
          let errorEmbed = new Discord.MessageEmbed()
          .setAuthor(`| JeffreyNet - 404`, "https://cdn.discordapp.com/emojis/537023544136040452.png")
          .setDescription(`**—** Para poder cambiar una contraseña primero debes tener una cuenta para cambiarla / definirla. \`${prefix}net register\``)
          .setColor(Colores.rojo);
          
          return message.channel.send(errorEmbed).then(r => r.delete(20000))
        } else {
          if(!args[1]){
            return message.reply(`Usa el comando de esta manera: \`${prefix}net pass [CONTRASEÑA VIEJA] [NUEVA CONTRASEÑA]\`. Si es la primera vez que usas este comando, tu contraseña actual es \`N/A\`.`).then(r => r.delete(20000))
          }
          
          if(!args[2]){
            return message.reply(`Usa el comando de esta manera: \`${prefix}net pass [CONTRASEÑA VIEJA] [NUEVA CONTRASEÑA]\`. Si es la primera vez que usas este comando, tu contraseña actual es \`N/A\`.`).then(r => r.delete(20000))
          }
          
          if(args[1] != account.pass){
            return message.reply(`Contraseña incorrecta.`).then(r => r.delete(5000));
          }
          
          if(args[1] === args[2]){
            return message.reply(`Es la misma contraseña.`).then(r => r.delete(5000));
          }
          
          account.pass = args[2];
          account.save()
          .catch(e => console.log(e));
          
          let corEmbed = new Discord.MessageEmbed()
          .setAuthor(`| JeffreyNet - Contraseña`, "https://cdn.discordapp.com/emojis/537023544136040452.png")
          .setDescription(`**—** Se ha cambiado tu contraseña.`)
          .setColor(Colores.verde);
          
          return message.channel.send(corEmbed).then(r => r.delete(10000));
          
        }
      })
    } else
      
      if(site === "user" || site === "username"){
        Cuenta.findOne({
          userID: author.id
        }, (err, account) =>{
          if(err) throw err;
          
          if(!account){
            let errorEmbed = new Discord.MessageEmbed()
            .setAuthor(`| JeffreyNet - 404`, "https://cdn.discordapp.com/emojis/537023544136040452.png")
            .setDescription(`**—** Para poder cambiar tu nombre de usuario primero debes tener una cuenta. \`${prefix}net register\``)
            .setColor(Colores.rojo);

            return message.channel.send(errorEmbed).then(r => r.delete(20000))
          } else {
            if(!args[1]){
              return message.reply(`Determina tu nuevo nombre de usuario.`);
            }
            
            let userNameNew = args.join(" ").slice(args[0].length + 1);
            
            account.username = userNameNew;
            account.save()
            .catch(e => console.log(e));
            
            let corEmbed = new Discord.MessageEmbed()
            .setAuthor(`| JeffreyNet - Username`, "https://cdn.discordapp.com/emojis/537023544136040452.png")
            .setDescription(`**—** Se ha cambiado tu nombre de usuario.`)
            .setColor(Colores.verde);

            return message.channel.send(corEmbed).then(r => r.delete(10000));

          }
        })
      } else
      
      if(site === "biografia" || site === "bio" || site === "biografía"){
        Cuenta.findOne({
          userID: author.id
        }, (err, account) => {
          if(err) throw err;
          
          if(!account){
            let errorEmbed = new Discord.MessageEmbed()
            .setAuthor(`| JeffreyNet - 404`, "https://cdn.discordapp.com/emojis/537023544136040452.png")
            .setDescription(`**—** Para poder cambiar tu biografía primero debes tener una cuenta para cambiarla / definirla. \`${prefix}net register\``)
            .setColor(Colores.rojo);
          
            return message.channel.send(errorEmbed).then(r => r.delete(20000));
          } else {
            let newBio = args.join(" ").slice(args[0].length + 1);
            
            if(!newBio){
              return message.reply(`Por favor, determina tu biografía.`).then(r => r.delete(10000));                                                                              
            }
            
            account.bio = newBio;
            account.save().catch(e => console.log(e));

            let corEmbed = new Discord.MessageEmbed()
            .setAuthor(`| JeffreyNet - Biografía`, "https://cdn.discordapp.com/emojis/537023544136040452.png")
            .setDescription(`**—** Se ha cambiado tu biografía.`)
            .setColor(Colores.verde);

            return message.channel.send(corEmbed).then(r => r.delete(10000));
            
          }
        })
      } else
        
      if(site === "bd" || site === "birthday" || site === "cumple" || site === "cumpleaños"){
        Cuenta.findOne({
          userID: author.id
        }, (err, account) => {
          if(err) throw err;
          
          if(!account){
            let errorEmbed = new Discord.MessageEmbed()
            .setAuthor(`| JeffreyNet - 404`, "https://cdn.discordapp.com/emojis/537023544136040452.png")
            .setDescription(`**—** Para poder cambiar tu fecha de nacimiento primero debes tener una cuenta. \`${prefix}net register\``)
            .setFooter(`Responder con el siguiente formato: DD MM AAAA. Ejemplo: ${prefix}net bd 7 11 2000`)
            .setColor(Colores.rojo);
          
            return message.channel.send(errorEmbed).then(r => r.delete(20000));  
          } else {
            if(!args[1]){
              return message.reply(`Responde con el siguiente formato: \`DD MM AAAA\`.\nEjemplo: \`${prefix}net bd 07 06 2000\`, que sería igual a 7 de Junio del 2000.`);
            } else if(!args[2]){
              return message.reply(`Responde con el siguiente formato: \`DD MM AAAA\`.\nEjemplo: \`${prefix}net bd 07 06 2000\`, que sería igual a 7 de Junio del 2000.`);              
            } else if(!args[3]){
              return message.reply(`Responde con el siguiente formato: \`DD MM AAAA\`.\nEjemplo: \`${prefix}net bd 07 06 2000\`, que sería igual a 7 de Junio del 2000.`);              
            }

            let bdDay = args[1];
            let bdMonth = args[2];
            let bdYear = args[3];
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
            .setAuthor(`| JeffreyNet - Cumpleaños`, "https://cdn.discordapp.com/emojis/537023544136040452.png")
            .setDescription(`**—** Se ha cambiado tu fecha de nacimiento, también tu edad.`)
            .setColor(Colores.verde);

            return message.channel.send(corEmbed).then(r => r.delete(10000));
            
          }
        })
      } else
        
      if(site === "sex" || site === "genero" || site === "gender" || site === "gen"){
        Cuenta.findOne({
          userID: author.id
        }, (err, account) => {
          if(err) throw err;
          
          if(!account){
            let errorEmbed = new Discord.MessageEmbed()
            .setAuthor(`| JeffreyNet - 404`, "https://cdn.discordapp.com/emojis/537023544136040452.png")
            .setDescription(`**—** Para poder cambiar tu género primero debes tener una cuenta para cambiarlo / definirlo. \`${prefix}net register\``)
            .setFooter(`Puedes responder con: M, F, Masculino, Femenino, Hombre, Mujer, Male, Female.`)
            .setColor(Colores.rojo);
          
            return message.channel.send(errorEmbed).then(r => r.delete(20000));          
          } else {
            if(!args[1]){
              return message.reply(`Determina tu género.`).then(r => r.delete(20000));
            }
            let selSex = args[1].toLowerCase();
            
            if(selSex === "m" || selSex === "masculino" || selSex === "hombre" || selSex === "male" || selSex === "h"){
              selSex = 0;
            } else 
            if(selSex === "f" || selSex === "femenino" || selSex === "mujer" || selSex === "female" || selSex === "m"){
              selSex = 1;
            } else {
              return message.reply(`Por favor selecciona tu género con: \`M\`, \`F\`, \`H\`, \`M\`, \`Masculino\`, \`Femenino\`, \`Hombre\`, \`Mujer\`, \`Male\`, \`Female\`.`).then(r => r.delete(10000));
            }
            
            account.sex = selSex;
            account.save()
            .catch(e => console.log(e));
            
            let corEmbed = new Discord.MessageEmbed()
            .setAuthor(`| JeffreyNet - Género`, "https://cdn.discordapp.com/emojis/537023544136040452.png")
            .setDescription(`**—** Se ha cambiado tu género.`)
            .setColor(Colores.verde);

            return message.channel.send(corEmbed).then(r => r.delete(10000));
          }
        })
      } else 
        
      if(site === "hex" || site === "color"){
         Cuenta.findOne({
           userID: author.id
         }, (err, account) => {
           if(err) throw err;
           
           if(!account){
               let errorEmbed = new Discord.MessageEmbed()
              .setAuthor(`| JeffreyNet - 404`, "https://cdn.discordapp.com/emojis/537023544136040452.png")
              .setDescription(`**—** Para poder cambiar tu color, primero debes tener una cuenta a la cual cambiárselo. \`${prefix}net register\``)
              .setColor(Colores.rojo);

              return message.channel.send(errorEmbed).then(r => r.delete(20000)); 
           } else {
             if(!args[1]){
               return message.reply(`Debes definir tu color. __Recuerda que debe ser tipo HEX **y** empezar por un **#**___.`);
             }
             
             account.hex = args[1];
             account.save()
             .catch(e => console.log(e));
             
            let corEmbed = new Discord.MessageEmbed()
            .setAuthor(`| JeffreyNet - Color`, "https://cdn.discordapp.com/emojis/537023544136040452.png")
            .setDescription(`**—** Se ha cambiado tu color de perfil.`)
            .setColor(Colores.verde);

            return message.channel.send(corEmbed).then(r => r.delete(10000));
             
           }
         })
      } else
      
      if(site === "perfil" || site === "profile"){
        Cuenta.findOne({
          userID: author.id
        }, (err, account) => {
          if(err) throw err;
          
          if(!account){
            let errorEmbed = new Discord.MessageEmbed()
            .setAuthor(`| JeffreyNet - 404`, "https://cdn.discordapp.com/emojis/537023544136040452.png")
            .setDescription(`**—** No puedes ver tu perfil si no tienes una cuenta. \`${prefix}net register\``)
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
            .setAuthor(`| JeffreyNet - Perfil`, author.displayAvatarURL())
            .setDescription(`**— Nombre de usuario**: ${userName}
**— Edad**: ${accAge}.
**— Sexo**: ${accSex}.
**— Cumpleaños**: ${accBd}.
**— Biografía**: ${accBio}`)
            .setFooter(`— ID de cuenta: ${account.id}┊Visto: ${accSeen}.`)
            .setColor(accHex);
            
            return message.channel.send(embed);
            
          }
        })
      } else
        
      if(site === "id"){
        // net id @jeffy
        
        let member = guild.member(message.mentions.users.first()) || guild.members.cache.get(args[1]);
        if(!member){
          return message.reply(`No pude encontrar a ese usaurio... @Menciona o usa la ID del usuario de quien quieres saber la ID en la Jeffrey Net.`).then(r => r.delete(20000));
        }
        
        Cuenta.findOne({
          userID: member.user.id
        }, (err, account) => {
          if(err) throw err;
          
          if(!account){
            return message.reply(`No pude encontrar a ese usaurio... @Menciona o usa la ID del usuario de quien quieres saber la ID en la Jeffrey Net. O tal vez no esté registrado en Jeffrey Net... :(`).then(r => r.delete(20000));
          }
            
            let userName = account.username;
            let accHex = account.hex;
            
            if(account.hex === "N/A"){
              accHex = "#36393e"
            }
          
            if(account.username === "N/A"){
              userName = "No especificado";              
            }
          
            let embed = new Discord.MessageEmbed()
            .setAuthor(`| JeffreyNet - ID`, member.user.displayAvatarURL())
            .setDescription(`**— Nombre de usuario**: ${userName}
            **— ID de cuenta**: ${account.id}`)
            .setColor(accHex);
            
            return message.channel.send(embed);
          
            /*let userName = account.username;
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
            .setAuthor(`| JeffreyNet - Perfil`, author.displayAvatarURL())
            .setDescription(`**— Nombre de usuario**: ${userName}
            **— Edad**: ${accAge}.
            **— Sexo**: ${accSex}.
            **— Cumpleaños**: ${accBd}.
            **— Biografía**: ${accBio}`)
            .setFooter(`— ID de cuenta: ${account.id}┊Visto: ${accSeen}.`)
            .setColor(accHex);
            
            return message.channel.send(embed);*/
          
        })
      } else { // net ID
        if(!args[0]){
          return message.reply(`Especifíca la ID de la cuenta que quieres visitar.`);
        }
        
        if(args[0].isNaN) return;
        
        Cuenta.findOne({
          id: args[0]
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
              .setAuthor(`| JeffreyNet - Perfil`, member.user.displayAvatarURL())
              .setDescription(`**— Nombre de usuario**: ${userName}
**— Edad**: ${accAge}.
**— Sexo**: ${accSex}.
**— Cumpleaños**: ${accBd}.
**— Biografía**: ${accBio}`)
              .setFooter(`— ID de cuenta: ${account.id}┊Visto: ${accSeen}.`)
              .setColor(accHex);

              return message.channel.send(embed);
          }
        })
      }
  }

}

module.exports.help = {
    name: "net",
    alias: "jeffreynet"
}
