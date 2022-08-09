const { Command, Embed, ErrorEmbed, WillBenefit, LimitedTime, FindNewId, Confirmation } = require("../../src/utils")
const { Config, Colores } = require("../../src/resources")

const ms = require("ms");

const command = new Command({
    name: "admin",
    desc: "Comandos que administran diferentes secciones dentro de un servidor",
    category: "STAFF"
})

//demasiado complejo como para usar las funciones mias :sob:
command.data
    .addSubcommandGroup(temp =>
        temp
            .setName("temp")
            .setDescription("Role o boost temporales...?")
            .addSubcommand(sub => sub
                .setName("role")
                .setDescription("Agrega un role temporal a un usuario")
                .addUserOption(option => option
                    .setName("usuario")
                    .setDescription("El usuario al que se le agregará el rol")
                    .setRequired(true))
                .addRoleOption(option => option
                    .setName("role")
                    .setDescription("El role a agregar")
                    .setRequired(true))
                .addStringOption(option => option
                    .setName("tiempo")
                    .setDescription("El tiempo que tiene que pasar para eliminar el role: 1d, 20m, 10s, 1y...")
                    .setRequired(true))
            )
            .addSubcommand(sub => sub
                .setName("boost")
                .setDescription("Agrega un boost a un usuario")
                .addUserOption(option => option
                    .setName("usuario")
                    .setDescription("El usuario al que se le agregará el rol")
                    .setRequired(true))
                .addRoleOption(option => option
                    .setName("role")
                    .setDescription("El role a agregar con el boost")
                    .setRequired(true))
                .addStringOption(option => option
                    .setName("tipo")
                    .setDescription("El tipo de boost")
                    .addChoices(
                        { name: "Multiplicador", value: "boostMultiplier" },
                        { name: "Probabilidad Boost", value: "boostProbabilities" }
                    )
                    .setRequired(true)
                )
                .addStringOption(option => option
                    .setName("objetivo")
                    .setDescription("Lo que va a modificar")
                    .addChoices(
                        { name: "Jeffros", value: "jeffros" },
                        { name: "EXP", value: "exp" },
                        { name: "Todo", value: "all" },
                    )
                    .setRequired(true))
                .addNumberOption(option => option
                    .setName("valor")
                    .setDescription("Valor del boost")
                    .setMinValue(1.1)
                    .setRequired(true))
                .addStringOption(option => option
                    .setName("tiempo")
                    .setDescription("El tiempo que tiene que pasar para eliminar el boost: 1d, 20m, 10s, 1y...")
                    .setRequired(true))
            )
    )
    .addSubcommandGroup(add =>
        add
            .setName("add")
            .setDescription("Añadir...")
            .addSubcommand(sub => sub
                .setName("jeffroskey")
                .setDescription("Añadir una nueva llave para canjear con recompensas de Jeffros")
                .addIntegerOption(option => option
                    .setName("cantidad")
                    .setDescription("Cantidad de Jeffros a dar")
                    .setMinValue(1)
                    .setRequired(true))
            )
            .addSubcommand(sub => sub
                .setName("expkey")
                .setDescription("Añadir una nueva llave para canjear con recompensas de Jeffros")
                .addIntegerOption(option => option
                    .setName("cantidad")
                    .setDescription("Cantidad de EXP a dar")
                    .setMinValue(1)
                    .setRequired(true))
            )
            .addSubcommand(sub => sub
                .setName("rolekey")
                .setDescription("Añadir una nueva llave para canjear con recompensa de Role")
                .addRoleOption(option => option
                    .setName("role")
                    .setDescription("Role a dar")
                    .setRequired(true))
                .addStringOption(option => option
                    .setName("duracion")
                    .setDescription("Duración del role asignado: 1d, 20m, 10s, 1y"))
            )
            .addSubcommand(sub => sub
                .setName("boostkey")
                .setDescription("Añadir una nueva llave para canjear con recompensa de Boost")
                .addRoleOption(option => option
                    .setName("role")
                    .setDescription("Role a dar")
                    .setRequired(true))
                .addStringOption(option => option
                    .setName("tipo")
                    .setDescription("El tipo de boost que va a ser")
                    .addChoices(
                        { name: "Multiplicador", value: "boostMultiplier" },
                        { name: "Probabilidad Boost", value: "boostProbabilities" }
                    )
                    .setRequired(true))
                .addStringOption(option => option
                    .setName("objetivo")
                    .setDescription("Lo que va a modificar")
                    .addChoices(
                        { name: "Jeffros", value: "jeffros" },
                        { name: "EXP", value: "exp" },
                        { name: "Todo", value: "all" },
                    )
                    .setRequired(true))
                .addNumberOption(option => option
                    .setName("valor")
                    .setDescription("Valor del boost")
                    .setMinValue(1.1)
                    .setRequired(true))
                .addStringOption(option => option
                    .setName("duracion")
                    .setDescription("Duración del role asignado: 1d, 20m, 10s, 1y"))

            )
    )
    .addSubcommandGroup(user =>
        user
            .setName("user")
            .setDescription("Administración de tipo usuarios")
            .addSubcommand(sub => sub
                .setName("dm")
                .setDescription("Enviar un mensaje directo al usuario como STAFF")
                .addUserOption(option => option
                    .setName("usuario")
                    .setDescription("Usuario al que se le va a enviar el mensaje")
                    .setRequired(true))
                .addStringOption(option => option
                    .setName("mensaje")
                    .setDescription("Mensaje a enviar. Usa {yo} para poner tu nombre, {user} para poner el tag de 'usuario'")
                    .setRequired(true))
            )
    )
    .addSubcommandGroup(annouce =>
        annouce
            .setName("announce")
            .setDescription("Comandos para los anuncios")
            .addSubcommand(sub => sub
                .setName("jbnews")
                .setDescription("Se crea un anuncio mencionando al rol de JB News")
                .addStringOption(option => option
                    .setName("anuncio")
                    .setDescription("El anuncio a enviar"))
                .addAttachmentOption(option => option
                    .setName("imagen")
                    .setDescription("La imagen a poner en el embed"))
                .addStringOption(option => option
                    .setName("titulo")
                    .setDescription("El título que saldrá en el embed"))
            )
    )

command.addEach({ filter: "add", type: "integer", name: "usos", desc: "Los usos máximos permitidos en global para esta key", min: 1 });

command.execute = async (interaction, models, params, client) => {
    await interaction.deferReply();
    switch (params.subgroup) {
        case "temp":
            await command.tempExec(interaction, models, params);
            break;

        case "add":
            await command.addExec(interaction, models, params);
            break;

        case "user":
            await command.userExec(interaction, params);
            break;

        case "announce":
            await command.announceExec(interaction, params, client);
            break;
    }
}

command.tempExec = async (interaction, models, params) => {
    const { Users } = models;
    const { subcommand, temp } = params
    const { usuario, role, tiempo, tipo, objetivo, valor } = temp;

    const duration = ms(tiempo.value) || Infinity;

    let user = await Users.getOrCreate({ user_id: usuario.value, guild_id: interaction.guild.id });

    switch (subcommand) {
        case "role":
            // llamar la funcion para hacer globaldata
            await LimitedTime(interaction.guild, role.role.id, usuario.member, user, duration);
            return interaction.editReply({ content: `✅ Agregado el temp role a ${usuario.user.tag} por ${tiempo.value}` });

        case "boost":
            let btype = tipo.value;
            let bobj = objetivo.value;
            let multi = valor.value;

            let toConfirm = [
                `**${usuario.user.tag}** será BENEFICIADO AÚN MÁS si aplica este boost`,
                `¿Estás segur@ de proseguir aún así?`
            ];

            const willBenefit = await WillBenefit(usuario.member)
            let confirmation = true;

            if (willBenefit) {
                confirmation = await Confirmation("Continuar", toConfirm, interaction);
            }

            if (!confirmation) return;

            // llamar la funcion para hacer un globaldata y dar el role con boost
            await LimitedTime(interaction.guild, role.role.id, usuario.member, user, duration, btype, bobj, multi);
            return interaction.editReply({ content: `✅ Agregado el boost a ${usuario.user.tag} por ${tiempo.value}`, embeds: [] });
    }
}

command.addExec = async (interaction, models, params) => {
    const { Keys } = models;
    const { subcommand, add } = params;
    const { role, tipo, cantidad, objetivo, valor, duracion, usos } = add;

    // generar nueva key
    let keysq = await Keys.find();
    const generatedID = await FindNewId(keysq, "", "id");

    // code
    let generatedCode = generateCode()
    while (await findKey(generatedCode)) {
        generatedCode = generateCode();
    }

    switch (subcommand) {
        case "jeffroskey":
        case "expkey":
            if (subcommand === "jeffroskey") type = "jeffros";
            if (subcommand === "expkey") type = "exp";

            await new Keys({
                config: {
                    maxuses: usos ? usos.value : Infinity
                },
                reward: {
                    type,
                    value: cantidad.value
                },
                code: generatedCode,
                id: generatedID
            }).save();
            break;

        case "rolekey":
        case "boostkey":
            let boost_type = null;
            let boost_value = null;
            let boost_objetive = null;

            if (subcommand === "boostkey") {
                type = "boost";
                boost_type = tipo.value;
                boost_value = valor.value;
                boost_objetive = objetivo.value;
            } else {
                type = "role"
            }

            await new Keys({
                config: {
                    maxuses: usos ? usos.value : Infinity
                },
                reward: {
                    type,
                    boost_type,
                    boost_value,
                    boost_objetive,
                    value: role.value,
                    duration: duracion ? ms(duracion.value) : Infinity
                },
                code: generatedCode,
                id: generatedID
            }).save();

    }

    let added = new Embed()
        .defAuthor({ text: `Listo: ${subcommand}`, icon: Config.bienPng })
        .defDesc(`**—** Se ha generado una nueva llave.
**—** \`${generatedCode}\`.
**—** ID: \`${generatedID}\`.`)
        .setColor(Colores.verde)

    return interaction.editReply({ embeds: [added] });
}

command.userExec = async (interaction, params) => {
    const { subcommand, user } = params;
    const { usuario, mensaje } = user;

    switch (subcommand) {
        case "dm":
            if (usuario.user.bot) return interaction.editReply({ content: "No le voy a enviar un mensaje a un bot, perdona." })

            let yoStr = mensaje.value.replace(new RegExp('{yo}', "g"), `**${interaction.user.tag}**`);
            let final = yoStr.replace(new RegExp('{user}', "g"), `**${usuario.user.tag}**`)

            let embed = new Embed()
                .defAuthor({ text: "Hola:", icon: "https://i.pinimg.com/originals/85/7f/d7/857fd79dfd7bd025e4cbb2169cd46e03.png" })
                .defDesc(final)
                .defFooter({ text: "Este es un mensaje directamente del staff del servidor." })
                .defColor(Colores.verde);

            try {
                await usuario.member.send({ embeds: [embed] })
                interaction.editReply({
                    content: null, embeds: [
                        new Embed({
                            type: "success",
                            data: {
                                desc: `Se envió el mensaje por privado`
                            }
                        })
                    ]
                })
            } catch (e) {
                interaction.editReply({ embeds: [new ErrorEmbed({ type: "notSent", data: { tag: usuario.user.tag, error: e } })] })
            }
            break;
    }
}

command.announceExec = async (interaction, params, client) => {
    const { subcommand, announce } = params;
    const { titulo, anuncio, imagen } = announce;

    switch (subcommand) {
        case "jbnews":
            let jbNRole = client.user.id === Config.testingJBID ? interaction.guild.roles.cache.find(x => x.id === '790393911519870986') : guild.roles.cache.find(x => x.id === Config.jbnews);
            let ch = client.user.id === Config.testingJBID ? interaction.guild.channels.cache.find(x => x.id === "483007967239602196") : message.guild.channels.cache.find(x => x.id === Config.announceChannel);

            if (!anuncio && !imagen) return interaction.editReply({ embeds: [new ErrorEmbed({ type: "badParams", data: { help: "Si no hay 'anuncio' debe haber una imagen." } })] });
            if (titulo) title = titulo.value;
            else title = "¡Novedades de Jeffrey Bot!"

            let embed = new Embed()
                .defColor(Colores.verde)
                .defFooter({ text: `Noticia por ${interaction.user.tag}`, icon: client.user.displayAvatarURL(), timestamp: true })

            if (imagen) embed.setImage(imagen.attachment.url);
            if (anuncio) embed.defDesc(anuncio.value)
            else embed.defDesc(" ")

            if (!anuncio && embed.image) {
                embed.defAuthor({ text: title, icon: guild.iconURL() })
            } else if (anuncio && imagen) {
                embed.defAuthor({ text: title, title: true });
                embed.defThumbnail(client.user.displayAvatarURL());
            } else {
                embed.defAuthor({ text: title, title: true });
            }

            let toConfirm = [
                "El anuncio se verá como lo ves aquí:",
                embed
            ]
            let confirmation = await Confirmation("Enviar anuncio", toConfirm, interaction)
            if (!confirmation) return;

            ch.send({ content: `${jbNRole}`, embeds: [embed] });
            return confirmation.editReply({ content: `✅ Anuncio enviado a ${ch}!`, embeds: [] });
    }
}

function generateCode() {
    // generar nueva key
    let chr = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
    let generatedCode = "";

    for (let i = 0; i < 19; i++) {
        // ABCD-EFGH-IJKL-MNOP
        // 0123 5678 9101112 14151617
        if (generatedCode.length == 4 || generatedCode.length == 9 || generatedCode.length == 14) generatedCode += "-"
        else {
            generatedCode += chr.charAt(Math.floor(Math.random() * chr.length));
        }
    }

    return generatedCode;
}

async function findKey(key) {
    const { Keys } = require("mongoose").models;
    let q = await Keys.findOne({
        code: key
    });

    return q ? true : false;
}

module.exports = command;