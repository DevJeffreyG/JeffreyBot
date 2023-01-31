const { ApiUpdate, ChannelModules, LogReasons } = require("../../../src/utils/Enums");
const { UpdateObj } = require("../../../src/utils/functions");
const Log = require("../../../src/utils/Log");

const Express = require("express")();
const { Guilds, ChangeLogs } = require("mongoose").models;

/**
 * 
 * @param {Express} app 
 */
module.exports = (app) => {
    app.post("/api/db/update", async (req, res) => {
        let response = true;
        const doc = await Guilds.getOrCreate(req.header("guildid"));
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
    })

    app.post("/api/db/add-changelog", async (req, res) => {
        const { version, changes } = req.body
        let query = await ChangeLogs.create(version, changes)

        res.send(query ? true : false);
    })
}