const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const { Collection } = require("discord.js");

const { GlobalDatas } = require("mongoose").models;

const fs = require("fs")

const rest = new REST({ version: '9'}).setToken(process.env.TOKEN);
const route = process.env.DEV == "TRUE"
    ? Routes.applicationGuildCommands(process.env.slashClientId, process.env.slashGuildId)
    : Routes.applicationCommands(process.env.slashClientId)

class Commands {
    constructor(path = "./commands/"){
        this.path = path;
        this.routes = [];
        this.commands = [];
        this.guildcommands = [];
        this.ids = null;
    }

    async prepare(client, Ids = []){
        this.client = client;
        client.slash = new Collection();
        
        await this.#load(client, Ids)
        await this.#register()
        this.ids = Ids;
        return this
    }

    async #load(client, Ids) {
        console.log("============ CARGANDO COMANDOS ============");
        const commandsFolder = fs.readdirSync(this.path).filter(file => !file.endsWith(".txt"));
      
        for (const folder of commandsFolder) {
          const commandFiles = fs.readdirSync(`${this.path}/${folder}`).filter(file => file.endsWith(".js"));
      
          for(const file of commandFiles) {
            const command = require(`${this.path}/${folder}/${file}`);

            if(command.dev && Ids.lenght === 0) continue;

            if(command.dev && process.env.DEV != "TRUE"){
                Ids.forEach(guildId => {
                    console.log("GuildCommand for", guildId + "!:", command.data.name);
                    this.guildcommands = [];
                    this.routes.push(Routes.applicationGuildCommands(process.env.slashClientId, guildId));

                    client.slash.set(command.data.name, command)
                    this.guildcommands.push(command.data.toJSON())
                });
            } else {
                client.slash.set(command.data.name, command);
                console.log("▶️ Comando", command.data.name, "recibido, agregado a la lista")
                this.commands.push(command.data.toJSON())
            }

          }
        }
    }

    async #register() {
        console.log("============ REGISTRANDO COMANDOS ============");
        try {
            console.log("⚪ Actualizando los slash commands para la ruta:", route)
            console.log("MODO DE INICIACIÓN EN DEVELOPER:", process.env.DEV);

            if(process.env.DEV == "TRUE"){
                console.log("🔄 Creando Dev Guild 🔄")
                await GlobalDatas.newGuildCommands({route: route, dev: true})

                // eliminar cualquier comando global
                if(rest.get(Routes.applicationCommands(process.env.slashClientId)))
                    rest.put(Routes.applicationCommands(process.env.slashClientId), {body: []})

                this.#removeGuildCommands(true)
            } else {
                this.#removeGuildCommands(false)
            }

            await rest.put(route, {body: this.commands})

            if(this.guildcommands.length != 0) {
                this.routes.forEach(async groute => {
                    //console.log("GuildCommands", groute, this.guildcommands)
                    rest.put(groute, {body: this.guildcommands})

                    console.log("🔄 Creando GuildCommands 🔄")
                    await GlobalDatas.newGuildCommands({route: groute, dev: false})
                })
            }
        } catch (error) {
            console.log(error);
        }

        console.log("🟢 Se han actualizado los slash commands")
        console.log("============================================================");
        
        return;
    }

    async #removeGuildCommands(dev){
        console.log("============ BUSCANDO POSIBLES GUILDCOMMANDS ============");
        let guild_commands = await GlobalDatas.GetGuildCommands();

        guild_commands.forEach(async q => {
            let data = q.info;

            if(!dev){
                console.log("🔄 Eliminando Dev Guilds 🔄")

                if(!this.routes.find(x => x === data.route)){
                    console.log(data.route)
                    GlobalDatas.RemoveGuildCommands(data.route);
                    await rest.put(data.route, { body: [] })
                }
            }

            if((rest.get(data.route) && data.dev != dev)){
                console.log("🔄 Eliminando Guilds 🔄")
                await rest.put(data.route, { body: [] })

                // eliminar globaldata
                GlobalDatas.RemoveGuildCommands(data.route);
            }
        })

        console.log("🟢 PROCESO TERMINADO")
        return;
    }

    /* async #addPerms(guild, client) {
        const { Guilds } = models
        let actualPermissions;
        const commandList = process.env.DEV == "TRUE" ? guild.commands.cache : client.application.commands.cache
        
        commandList.forEach(async comm => {
            //console.log(comm)
            let permissions = [];
            const doc = await Guilds.getById(guild.id);

            const cmd = client.slash.get(comm.name)
            actualPermissions = cmd.permissions;

            if(!(actualPermissions instanceof Array) && actualPermissions !== null) return console.error("BAD PERMISSIONS, NOT ARRAY!", cmd)

            let query = [];
            if(!actualPermissions) return;
            actualPermissions.forEach(p => {
                switch(p){
                    case "OWNER":
                        permissions.push({
                            id: guild.ownerId,
                            type: "USER",
                            permission: true
                        });
                        break;
                    case "ADMIN":
                        doc.roles.admins.forEach(a => query.push(a));
                        break;
                    case "STAFF":
                        doc.roles.staffs.forEach(a => query.push(a));
                        break;
                }
            })

            await guild.roles.fetch();

            if(query.length == 0){ // buscar roles con "Admin", si no hay, owner.
                let adminroles = guild.roles.cache.filter(x => x.permissions.has("ADMINISTRATOR") && !x.tags).toJSON();

                if(adminroles.length === 0) permissions.push({ // no hay roles con Admin
                    id: guild.ownerId,
                    type: "USER",
                    permission: true
                });

                adminroles.forEach(perm => {
                    permissions.push({
                        id: perm.id,
                        type: "ROLE",
                        permission: true
                    })
                })
            } else {
                query.forEach(perm => {
                    permissions.push({
                        id: perm,
                        type: "ROLE",
                        permission: true
                    })
                })
            }

            console.log("fiumba", comm)
            await comm.setDefaultMemberPermissions({ permissions });
        })
    } */
}

module.exports = new Commands("./commands/");