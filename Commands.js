const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const { Collection } = require("discord.js");
const models = require("mongoose").models;

const fs = require("fs")

const rest = new REST({ version: '9'}).setToken(process.env.TOKEN);
const route = process.env.DEV == "TRUE"
    ? Routes.applicationGuildCommands(process.env.slashClientId, process.env.slashGuildId)
    : Routes.applicationCommands(process.env.slashClientId)

class Commands {
    constructor(path = "./commands/"){
        this.path = path;
        this.commands = [];
    }

    async prepare(client){
        client.slash = new Collection();
        
        this.#load(client)
        await this.#register()
    }

    async createPerms(client) {
        await client.guilds.fetch()
        client.guilds.cache.forEach(async guild => {
            await guild.commands.fetch();
            await client.application.commands.fetch();
            //await this.#addPerms(guild, client);
        })

        return;
    }

    

    #load(client) {
        const commandsFolder = fs.readdirSync(this.path).filter(file => !file.endsWith(".txt"));
      
        for (const folder of commandsFolder) {
          const commandFiles = fs.readdirSync(`${this.path}/${folder}`).filter(file => file.endsWith(".js"));
      
          for(const file of commandFiles) {
            const command = require(`${this.path}/${folder}/${file}`);
      
            client.slash.set(command.data.name, command);
            this.commands.push(command.data.toJSON())
          }
        }
    }

    async #register() {
        try {
            console.log("Actualizando los slash commands")
            await rest.put(route, {body: this.commands})
            return console.log("Se han actualizado los slash commands.")
        } catch (error) {
            console.log(error);
        }
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