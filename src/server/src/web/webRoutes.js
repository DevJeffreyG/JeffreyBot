const { Guilds, ChangeLogs, GlobalDatas } = require("mongoose").models;
const { GenerateHmac } = require("../js/Functions");
const { InitLimiter, verifySession } = require("../js/middlewares");

const crypto = require("crypto");

module.exports = (app) => {
    app.get("/", (req, res) => res.redirect(process.env.DASHBOARD));
    app.get("/health", (req, res) => res.sendStatus(200));
    app.get("/api/db/get-guild", verifySession, async (req, res) => {
        try {
            const guildId = req.header("guildId");
            const query = await Guilds.getWork(guildId);

            //delete query.data.
            res.send(query)
        } catch (err) {
            console.error("🌎", err);
        }
    });

    app.get("/api/db/get-changelogs", verifySession, async (req, res) => {
        try {
            let query = await ChangeLogs.find().sort({ timestamp: -1 });
            res.send(query);
        } catch (err) {
            console.error("🌎", err);
        }
    });

    app.get("/api/db/get-changelog/:version", verifySession, async (req, res) => {
        try {
            let query = await ChangeLogs.findOne({ version: req.params.version });
            res.send(query);
        } catch (err) {
            console.error("🌎", err);
        }
    });

    app.get("/api/db/get-tos", verifySession, async (req, res) => {
        try {
            let query = await GlobalDatas.findOne({ type: "tos" });
            res.send(query);
        } catch (err) {
            console.error("🌎", err);
        }
    });

    app.get('/api/session/init', InitLimiter, (req, res) => {
        const sessionToken = crypto.randomBytes(32).toString('hex');
        const csrfToken = GenerateHmac(sessionToken);

        res.cookie('jb_session', sessionToken, {
            httpOnly: true,
            secure: process.env.DEV === "TRUE" ? false : true,
            sameSite: 'lax',
            maxAge: 24 * 60 * 60 * 1000 // 24h
        });

        res.json({ csrfToken });
    });
}