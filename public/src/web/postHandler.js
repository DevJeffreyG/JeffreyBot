const { ApiUpdate } = require("../../../src/utils/Enums");
const { UpdateObj } = require("../../../src/utils/functions");
const { Verify } = require("../js/Functions");

const Express = require("express")();
const { Guilds, ChangeLogs } = require("mongoose").models;

/**
 * 
 * @param {Express} app 
 */
module.exports = (app) => {
    const { WSServer } = app;

    app.post("/api/db/update", async (req, res) => {
        if (!Verify(req)) return res.status(403).send({ message: "Not authorized" });
        try {
            let response = true;
            const doc = await Guilds.getWork(req.header("guildid"));
            const apitype = Number(req.header("apitype"));
            const querytype = req.header("querytype");

            const changes = req.body;

            let initial = [];
            let toPush = {};
            let query;

            switch (apitype) {
                case ApiUpdate.ActiveModules:
                    query = "settings.active_modules";
                    break;

                case ApiUpdate.Quantities:
                    query = "settings.quantities";
                    break;

                case ApiUpdate.Functions:
                    query = "settings.functions";
                    break;

                case ApiUpdate.Roles:
                    query = "roles";
                    break;

                case ApiUpdate.LevelRoles:
                    query = "roles.levels";
                    break;

                case ApiUpdate.Channels:
                    query = "channels";
                    break;

                case ApiUpdate.RewardChannels:
                    query = "channels.chat_rewards";
                    break;

                case ApiUpdate.Categories:
                    query = "categories";
                    break;
            }

            changesLoop:
            for (const change in changes) {
                const prop = change.replace(/-/g, ".")
                const value = changes[change];

                switch (querytype) {
                    case "save":
                        if (Array.isArray(changes)) {
                            UpdateObj(doc, query, changes)
                            await save()
                            break changesLoop;
                        } else {
                            UpdateObj(doc, query + `.${prop}`, value)
                        }
                        break;

                    case "add":
                        toPush[change] = value;
                        break;
                }

                await save()
            }

            switch (querytype) {
                case "add":
                    let temp = doc;
                    for (const prop of query.split(".")) {
                        temp = temp[prop]
                    }

                    if (temp.length > 0) initial.unshift(...temp);
                    initial.push(toPush)

                    UpdateObj(doc, query, initial)
                    await save();
                    break;

                case "save": {
                    if (changes.length === 0) {
                        UpdateObj(doc, query, changes)
                        await save()
                    }
                }
            }

            res.send(response)

            async function save() {
                try {
                    await doc.save()
                } catch (err) {
                    console.log(changes)
                    console.log(err)
                    response = false;
                }

                return response
            }
        } catch (err) {
            console.error("🌎", err);
        }
    })

    app.post("/api/db/add-changelog", async (req, res) => {
        if (!Verify(req)) return res.status(403).send({ message: "Not authorized" });
        try {
            const { info, changes } = req.body
            let query = await ChangeLogs.create(info, changes)

            res.send(query ? true : false);
        } catch (err) {
            console.error("🌎", err);
        }
    })

    app.post("/api/ws/item-use", async (req, res) => {
        if (!Verify(req)) return res.status(403).send({ message: "Not authorized" });

        try {
            const { item, guild } = req.body

            const Client = WSServer.Clients.get(guild.id);
            Client.send({ message: "Se usó un item desde el servidor configurado!" })
            Client.send({ message: JSON.stringify(item), json: true })

            res.send(true);
        } catch (err) {
            console.log(err);
            res.send(false);
        }
    })
}