const { Guilds, ChangeLogs } = require("mongoose").models;

module.exports = (app) => {
    app.get("/api/db/get-guild", async (req, res) => {
        try {
            const guildId = req.header("guildId");
            const query = await Guilds.getWork(guildId);
            res.send(query)
        } catch (err) {
            console.error("🌎", err);
        }
    })
    app.get("/api/db/get-changelogs", async (req, res) => {
        try {
            let query = await ChangeLogs.find();
            res.send(query);
        } catch (err) {
            console.error("🌎", err);
        }
    })
}