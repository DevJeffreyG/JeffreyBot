const { ApiUpdate, ChannelModules, LogReasons } = require("../../../src/utils/Enums");
const { UpdateObj } = require("../../../src/utils/functions");
const Log = require("../../../src/utils/Log");

const Express = require("express")();
const { Guilds } = require("mongoose").models;

/**
 * 
 * @param {Express} app 
 */
module.exports = (app) => {
    app.post("/api/db/update", async (req, res) => {
        let response = true;
        const doc = await Guilds.getOrCreate(req.header("guildid"));
        const type = Number(req.header("updatetype"));

        const changes = req.body;

        for (const change in changes) {
            const prop = change.replace(/-/g, ".")
            const value = changes[change];

            let query;

            switch (type) {
                case ApiUpdate.ActiveModules:
                    query = "settings.active_modules";
                    break;

                case ApiUpdate.Minimum:
                    query = "settings.minimum";
                    break;

                case ApiUpdate.Functions:
                    query = "settings.functions";
                    break;

                case ApiUpdate.Roles:
                    query = "roles";
                    break;
            }

            query += `.${prop}`;

            UpdateObj(doc, query, value)
            await save()
        }

        res.send(response)

        async function save() {
            try {
                await doc.save()
            } catch (err) {
                response = false;
            }

            return response
        }
    })
}