const { Guilds, ChangeLogs, GlobalDatas } = require("mongoose").models;
const { Verify } = require("../js/Functions");

module.exports = (app) => {
    app.get("/health", (req, res) => res.sendStatus(200));
    app.get("/api/db/get-guild", async (req, res) => {
        if (!Verify(req)) res.status(403).send({ message: "Not authorized" });
        try {
            const guildId = req.header("guildId");
            const query = await Guilds.getWork(guildId);
            res.send(query)
        } catch (err) {
            console.error("🌎", err);
        }
    });

    app.get("/api/db/get-changelogs", async (req, res) => {
        if (!Verify(req)) res.status(403).send({ message: "Not authorized" });
        try {
            let query = await ChangeLogs.find();
            res.send(query);
        } catch (err) {
            console.error("🌎", err);
        }
    });

    app.get("/api/db/get-tos", async (req, res) => {
        if (!Verify(req)) res.status(403).send({ message: "Not authorized" });
        try {
            let query = await GlobalDatas.findOne({ type: "tos" });
            res.send(query);
        } catch (err) {
            console.error("🌎", err);
        }
    });
}