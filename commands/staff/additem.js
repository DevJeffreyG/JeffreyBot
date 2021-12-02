const Colores = require("../../resources/colores.json");
const Emojis = require("../../resources/emojis.json");
const Discord = require("discord.js");
const prettyMilliseconds = require('pretty-ms');

const { Initialize, TutorialEmbed, CollectMessage, Confirmation, ValidateParam, DarkShopWork, FindNewId } = require("../../resources/functions.js");

/* ##### MONGOOSE ######## */

const Shop = require("../../modelos/Shop.model.js");
const DarkShop = require("../../modelos/DarkShop.model.js");

/* ##### MONGOOSE ######## */

const commandInfo = {
    name: "additem",
    aliases: ["newitem"],
    info: "Creas un nuevo item para cualquiera de las dos tiendas",
    userlevel: "ADMIN",
    category: "STAFF"
}

module.exports = {
    data: commandInfo,
    async execute(client, message, args){

        const { guild, author, prefix, executionInfo } = await Initialize(client, message);

        let response = await TutorialEmbed(commandInfo, executionInfo, args);

        if(response[0] === "ERROR") return console.log(response); // si hay algún error

        // Comando
        let aclaration = await message.channel.send("Responde con 'cancel' en cualquier momento para cancelar, si no se edita el mensaje espera unos segundos.");

        let msg = await message.reply("¿Este nuevo item es para la **DARKSHOP**? <si | no>");
        let isDarkShop = await CollectMessage(message, msg, ["si", "no"]);
        if(!isDarkShop) return;

        isDarkShop = await ValidateParam("Boolean", isDarkShop);

        let effect_type = "na";
        if(isDarkShop){ // si sí es de la ds determinar si el efecto es positivo o negativo
            await msg.edit("¿El efecto es `positivo` o `negativo`?");
            effect_type = await CollectMessage(message, msg, ["positivo", "negativo"]);
            if(!effect_type) return;
            
            effect_type = effect_type.content;
        }

        await msg.edit("¿Cuál es el nombre de este nuevo item?");
        let nombre = await CollectMessage(message, msg);
        if(!nombre) return;

        nombre = nombre.content;

        await msg.edit("¿Cuál será la descripción de este item?");
        let desc = await CollectMessage(message, msg);
        if(!desc) return;

        desc = desc.content;

        await msg.edit("¿Qué se responderá después de activar el item?");
        let reply = await CollectMessage(message, msg);
        if(!reply) return;

        reply = reply.content;

        let precio, interest, role;

        while(!precio){
            await msg.edit("¿Cuál es el precio?");
            precio = await CollectMessage(message, msg);
            if(!precio) return;

            precio = await ValidateParam("NaturalNumberDiff0", precio);
        }

        while(!interest && interest != 0){
            await msg.edit("¿Cuánto subirá el precio por compra? (responde 0 si no sube)");
            interest = await CollectMessage(message, msg);
            if(!interest) return;
    
            interest = await ValidateParam("NaturalNumber", interest);
            console.log(interest);
        }

        while(!role){
            await msg.edit("¿id | @role requerido para poder comprar este item? (responde 0 si no se necesita ningún rol)");
            role = await CollectMessage(message, msg);
            if(!role) return;
    
            role = role.content != "0" ? await ValidateParam("Role", role) : "0";
        }
        
        // usos #######
        await msg.edit("¿Agrega o elimina *algo*? <add | remove>");
        let action = await CollectMessage(message, msg, ["add", "remove"]);
        if(!action) return;

        action = action.content;

        await msg.edit("¿Qué cosa agrega o elimina? <item | warns | role | boost>")
        let objetivo = await CollectMessage(message, msg, ["item", "warns", "role", "boost"]);
        if(!objetivo) return;

        let toConfirm = [
            `Nuevo item "${nombre}".`,
            `Con valor **${isDarkShop ? Emojis.Dark : Emojis.Jeffros}${precio.toLocaleString("es-CO")}**.`,
            `Descripción: '${desc}'.`,
            `Cambio de precio por compra: +${interest}`,
            `Role requerido: ${role != 0 ? role : "`Ninguno`"}.`,
            `Al usarlo ${action === "add" ? "agrega" : "elimina"} ${objetivo}.`
        ];

        let value, isSub, isTemp, duration, boost_type, boost_objetive, boost_value;

        switch(objetivo.content){
            case "item":
                const defaultitems = [
                    {
                        id: "1",
                        name: "Firewall"
                    },
                    {
                        id: "2",
                        name: "Stack Overflow"
                    },
                    {
                        id: "3",
                        name: "Reset precio"
                    }
                ];

                await msg.edit(`¿Qué item es (DARKSHOP ONLY)? \n**[1]** Firewall (evitar items negativos).\n**[2]** Stack Overflow (subir la precisión hasta 90%).\n**[3]** Reiniciar precio. (de un item de la tienda normal).`);
                value = await CollectMessage(message, msg, ["1", "2", "3"]);
                
                if(!value) return;

                value = defaultitems.find(x => x.id === value.content).name;

                toConfirm.push(`Es un Item "${value}" precreado.`);
                break;
            case "warns":
                await msg.edit("¿Cuántos Warns se van a eliminar o agregar?");
                value = await CollectMessage(message, msg);
                if(!value) return;

                value = await ValidateParam("NaturalNumberDiff0", value);
                if(!value) value = 1;

                toConfirm.push(`Cantidad a ${action === "add" ? "agregar" : "eliminar"}: \`${value}\`.`);
                break;

            case "role":
                await msg.edit("¿id | @role que se va a dar al usar el item?");

                while(!value){
                    value = await CollectMessage(message, msg);
                    if(!value) return;

                    value = await ValidateParam("Role", value);
                }

                await msg.edit("¿Es una suscripción? <si | no>");
                isSub = await CollectMessage(message, msg, ["si", "no"]);
                if(!isSub) return;

                isSub = await ValidateParam("Boolean", isSub);

                if(isSub){ // es una suscripción, preguntar el intervalo de los pagos
                    isTemp = false;
                    while(!duration){
                        await msg.edit("¿Cada cuánto se pagará el precio?");
                        duration = await CollectMessage(message, msg);
                        if(!duration) return;

                        duration = await ValidateParam("Time", duration);
                    }

                    toConfirm.push(`Es una **suscripción** de cada **${prettyMilliseconds(duration, {compact: true})}**.`);
                } else {
                    await msg.edit("¿Es un role temporal? <si | no>");
                    isTemp = await CollectMessage(message, msg, ["si", "no"]);
                    if(!isTemp) return;
    
                    isTemp = await ValidateParam("Boolean", isTemp);
                    if(isTemp){
                        while(!duration){
                            await msg.edit("¿Cuánto tiempo después será eliminado el role?");
                            duration = await CollectMessage(message, msg);
                            if(!duration) return;
    
                            duration = await ValidateParam("Time", duration);
                        }
                        
                        toConfirm.push(`Es un rol **temporal** que se quita al cabo de **${prettyMilliseconds(duration, {compact: true})}**.`);
                    }
                }

                toConfirm.push(`Se da el role "${value}".`)

                break;

            case "boost":
                const posibletypes = [
                    {
                        id: "1",
                        name: "boostMultiplier"
                    },
                    {
                        id: "2",
                        name: "boostProbabilities"
                    }
                ];

                while(!value){
                    await msg.edit("¿id | @role que se va a dar al usar el item?");
                    value = await CollectMessage(message, msg);
                    if(!value) return;
    
                    value = await ValidateParam("Role", value);
                }

                while(!duration){
                    await msg.edit("¿Al cabo de cuánto tiempo se terminará el boost?");
                    duration = await CollectMessage(message, msg);
                    if(!duration) return;
    
                    duration = await ValidateParam("Time", duration);
                }

                // determinar el tipo de boost
                await msg.edit(`¿Qué tipo de boost es? \n**[1]** Multiplicador: Lo que sea que boostea, es multiplicar lo que ganaría normalmente por el boost.\n**[2]** Probabilidad: Lo mismo que el anterior, sólo que multiplica el máximo obtenible.`);
                boost_type = await CollectMessage(message, msg, ["1", "2"]);
                if(!boost_type) return;

                boost_type = posibletypes.find(x => x.id === boost_type.content).name;

                // objetivo del boost
                await msg.edit(`¿Cuál es el objetivo de los boosts? <all | jeffros | exp>`);
                boost_objetive = await CollectMessage(message, msg, ["all", "jeffros", "exp"]);
                if(!boost_objetive) return;
                
                boost_objetive = boost_objetive.content;

                // valor del boost
                while(!boost_value){
                    await msg.edit(`¿Cuál es el valor del boost?`);
                    boost_value = await CollectMessage(message, msg);
                    if(!boost_value) return;
    
                    boost_value = await ValidateParam("Number", boost_value);
                }
                
                toConfirm.push(`Es un **Boost** que afecta a \`${boost_objetive}\`, con el valor "${boost_value}", y del tipo **${boost_type}**.`);

                break;
        }

        if(isDarkShop) toConfirm.unshift(`Es un item para la **DarkShop**, de efecto \`${effect_type}\`.`);
        
        aclaration.delete();
        msg.delete()

        let confirmation = await Confirmation("Agregar nuevo item", toConfirm, message);

        if(!confirmation) return;
        
        let tienda = isDarkShop ? await DarkShop.findOne({guild_id: guild.id}) : await Shop.findOne({guild_id: guild.id});
        if(!tienda) tienda = isDarkShop ? await DarkShopWork(client, guild.id) : await new Shop({guild_id: guild.id}).save();

        // id
        let tiendas = isDarkShop ? await DarkShop.find() : await Shop.find();
        let newId = await FindNewId(tiendas, "items", "id");

        tienda.items.push({
            name: nombre,
            price: precio,
            description: desc,
            reply: reply,
            req_role: role != 0 ? role.id : role,
            interest: interest,
            use_info: {
                effect: effect_type,
                action: action,
                objetive: objetivo, // warns, role, boost
                given: value.id ?? value, // puede ser un INT, un ROLE, o STRING (lo que se da)
                isSub: isSub, // es una sub?
                isTemp: isTemp, // es un temprole?
                duration: duration, // la duracion si es un sub, temprole o boost
                boost_type: boost_type,
                boost_value: boost_value,
                boost_objetive: boost_objetive
            },
            id: newId
        });

        await tienda.save();
        confirmation.delete();
        return message.react("✅");
    }
}