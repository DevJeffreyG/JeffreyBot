const { Collection, Routes, REST } = require("discord.js");

const { GlobalDatas } = require("mongoose").models;

const fs = require("fs")

class Commands {
    constructor(paths = ["./commands"]) {
        this.paths = paths;
        this.routes = [];
        this.commands = [];
        this.ids = [];

        this.route = process.env.DEV === "TRUE"
            ? Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.DEV_GUILD)
            : Routes.applicationCommands(process.env.CLIENT_ID)

        this.rest = new REST({ version: '10' }).setToken(process.env.TOKEN);
    }

    /**
     * @param {Client} client 
     * @returns {Client}
     */
    async map(client) {
        this.client = client;

        for await (const path of this.paths) {
            this.path = path;
            await this.#load();
        }

        this.client.mapped = true;
        return this.client;
    }

    async prepare(client, Ids = []) {
        this.client = client;
        this.ids = Ids;

        if (!this.client.mapped) for await (const path of this.paths) {
            this.path = path;
            await this.#load()
        }

        return new Promise(async (res, rej) => {
            if (this.commands.length < 1) this.commands = this.client.rawCommands;
            let response = await this.#register()

            if (response instanceof Error) rej(response)
            else {
                client.mapped = true;
                res(response)
            }
        })
    }

    async #load() {
        console.log("============ MAPPEANDO COMANDOS ============");
        //console.log("Path:", this.path);

        this.ids.forEach(guildId => {
            this.routes.push(Routes.applicationGuildCommands(process.env.CLIENT_ID, guildId));
        })

        // buscar los comandos por categorías
        const categories = this.#readDir(this.path);

        categories.directories.forEach(category => {
            // sacar la información de la categoría
            const info = require(`${this.path}/${category}`);

            console.log("============ ⬜ CATEGORÍA: %s ⬜ ============", info.Category)

            const categoryContent = this.#readDir(`${this.path}/${category}`);

            // leer los comandos en las subcategorías
            categoryContent.directories.forEach(subcat => {
                const subcatInfo = require(`${this.path}/${category}/${subcat}`);
                let commandsInSub = this.#readDir(`${this.path}/${category}/${subcat}`);

                console.log("--------- ◽SUBCATEGORÍA: %s◽ ---------", subcatInfo.SubCategory)

                commandsInSub.files.forEach(c => {
                    const command = require(c);

                    command
                        .setCategory(subcatInfo.Category ?? info.Category)
                        .setSubCategory(subcatInfo.SubCategory);

                    this.#saveToClient(command);
                })

                console.log("---------------------------------------------------------------")
            })

            categoryContent.files.forEach(c => {
                const command = require(c);
                command.setCategory(info.Category)

                this.#saveToClient(command);
            })
        })

        this.client.rawCommands = this.commands;
    }

    #saveToClient(command) {
        this.client.commands.set(command.data.name, command);
        console.log("▶️ Comando", command.data.name, "recibido, agregado a la lista")
        this.commands.push(command.data.toJSON())
    }

    #readDir(path) {
        const dirContent = fs.readdirSync(path).filter(x => !x.startsWith("index.js"));
        const read = {
            directories: dirContent.filter(x => !x.endsWith(".js")),
            files: dirContent.filter(x => x.endsWith(".js")).map(x => {
                return path + "/" + x
            })
        }

        return read;
    }

    async #register() {
        console.log("============ REGISTRANDO COMANDOS ============");
        try {
            console.log("⚪ Actualizando comandos para la ruta:", this.route)
            console.log("MODO DE INICIACIÓN EN DEVELOPER:", process.env.DEV);

            if (process.env.DEV === "TRUE") {
                console.log("🔄 Creando Dev Guild 🔄")
                await GlobalDatas.newGuildCommands({ route: this.route, dev: true })

                // eliminar cualquier comando global
                if (this.rest.get(Routes.applicationCommands(process.env.CLIENT_ID)))
                    this.rest.put(Routes.applicationCommands(process.env.CLIENT_ID), { body: [] })

                await this.removeGuildCommands(true)
            } else {
                await this.removeGuildCommands(false)
            }

            console.log("⚪ ACTUALIZANDO COMANDOS")
            await this.rest.put(this.route, { body: this.commands })
            console.log("🟢 APPLICATION COMMANDS ACTUALIZADOS")
            return this
        } catch (error) {
            return new Error(error)
        }
        return;
    }

    async removeGuildCommands(dev) {
        console.log("⚪ BUSCANDO POSIBLES GUILDCOMMANDS")
        let guild_commands = await GlobalDatas.getGuildCommands();

        guild_commands.forEach(async q => {
            let data = q.info;
            let getRequest = false;
            try {
                getRequest = await this.rest.get(data.route);
            } catch (err) {
                console.log(err)
            }

            if (!dev) {
                console.log("🔄 Eliminando Dev Guilds 🔄")

                if (!this.routes.find(x => x === data.route) && getRequest) {
                    this.rest.put(data.route, { body: [] })
                        .then(async () => {
                            await GlobalDatas.removeGuildCommand(data.route);
                        }).catch(err => console.log(err))
                }
            }

            if ((getRequest && data.dev != dev)) {
                console.log("🔄 Eliminando Guilds 🔄")
                this.rest.put(data.route, { body: [] })
                    .then(async () => {
                        await GlobalDatas.removeGuildCommand(data.route);
                    }).catch(err => console.log(err));
            }
        })

        console.log("🟢 POSIBLES GUILDCOMMANDS HANDLED")
        return;
    }
}

module.exports = Commands;