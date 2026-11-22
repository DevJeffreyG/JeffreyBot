const { GetSession } = require("../js/Functions");
const { verifySession } = require("../js/middlewares");
const { Session } = require("../js/SessionManager");
const jwt = require("jsonwebtoken");

const { Guilds } = require("mongoose").models;

module.exports = (app) => {
    const { SessionManager } = app;

    app.get("/api/discord/available-guilds", verifySession, async (req, res, next) => {
        let session = GetSession(SessionManager, req);
        if (!session) {
            res.clearCookie("uuid");
            return res.status(403).send({ message: "Invalid session" });
        }

        try {
            // TODO: Fetch all guilds the bot is in and filter out the ones the user is in, then return that list.
            await session.fetchAvailableGuilds();
            session.updateCookies(res);

            return res.send(JSON.stringify({ guilds: session.guilds }));
        } catch (err) {
            return next(err);
        }
    })

    app.get("/api/discord/guild/:guildId", verifySession, async (req, res, next) => {
        let session = GetSession(SessionManager, req);
        if (!session) {
            res.clearCookie("uuid");
            return res.status(403).send({ message: "Invalid session" });
        }

        try {
            const guildId = req.params.guildId;
            console.log("trying to fetch guild", guildId);
            await session.fetchGuild(guildId);

            return res.send(JSON.stringify({ guild: session.getGuild(guildId) }));
        } catch (err) {
            if (err.message === "Missing access to guild") {
                return res.status(403).send({ message: "Missing access to guild" });
            }

            return next(err);
        }
    });

    app.get("/api/discord/guild/resume/:guildId", verifySession, async (req, res, next) => {
        let session = GetSession(SessionManager, req);
        if (!session) {
            res.clearCookie("uuid");
            return res.status(403).send({ message: "Invalid session" });
        }

        if (!req.params.guildId) return res.status(400).send({ message: "Missing guildId" });

        let guildDoc = await Guilds.getById(req.params.guildId);

        let discordGuild = session.getGuild(req.params.guildId);
        if (!discordGuild) {
            try {
                await session.fetchGuild(req.params.guildId);
                discordGuild = session.getGuild(req.params.guildId);
            }
            catch (err) {
                next(err);
            }
        };

        // db
        let staffRoles = guildDoc?.getStaffs() || [];
        let adminRoles = guildDoc?.getAdmins() || [];

        let staff = discordGuild.members?.filter(member => member.roles.some(id => staffRoles.includes(id))).length || 0;
        let admins = discordGuild.members?.filter(member => member.roles.some(id => adminRoles.includes(id))).length || 0;

        let currencyAverage = guildDoc?.data.average_currency || 0;
        let levelRoles = guildDoc?.roles.levels.length || 0;
        let chatRewards = guildDoc?.channels.chat_rewards.length || 0;

        let modules = guildDoc?.getTotalModules();
        let functions = guildDoc?.getTotalFunctions();

        const resume = JSON.stringify({
            id: discordGuild.id,
            channels: discordGuild.channels?.length || 0,
            roles: discordGuild.roles?.length || 0,
            staff,
            admins,
            members: discordGuild.members?.length || 0,
            activeModules: modules?.active || 0,
            totalModules: modules?.total || 0,
            activeFunctions: functions?.active || 0,
            totalFunctions: functions?.total || 0,
            levelRoles,
            chatRewards,
            currencyAverage,
            currencyName: "Jeffros" // TODO
        })

        res.cookie("guild_resume", resume, {
            maxAge: 60 * 1000 // 1m
        });
        res.send(resume);

    });

    app.post("/api/discord/auth", verifySession, async (req, res, next) => {
        const { code } = req.body;
        if (!code) return res.status(400).send({ message: "Missing code" });

        let session = GetSession(SessionManager, req);
        if (!session) {
            console.log("couldnt get session");
            res.clearCookie("uuid");
            return res.status(403).send({ message: "Invalid session" });
        }

        try {
            await session.fetchAuthToken(code);
            session.startRefreshInterval();
            await session.fetchDiscordUser();

            console.log("everything ok , updating cookies");

            session.updateCookies(res);

            return res.status(200).json(jwt.sign({ user: session.getDiscordUser() }, process.env.APP_SECRET));
        } catch (err) {
            return next(err);
        }
    })

    app.get("/api/discord/me", verifySession, (req, res) => {
        let session = GetSession(SessionManager, req);
        if (!session) {
            res.clearCookie("uuid");
            return res.status(403).send({ message: "Invalid session" });
        }

        const discordUser = session.getDiscordUser();

        if (!discordUser) {
            return res.status(204).json({ user: null });
        }

        res.json(jwt.sign({ user: discordUser }, process.env.APP_SECRET));
    });

    app.get("/api/discord/logout", async (req, res, next) => {
        let session = GetSession(SessionManager, req);
        if (!session) {
            res.clearCookie("uuid");
            return res.status(403).send({ message: "Invalid session" });
        }

        try {
            await session.logout();
        } catch (err) {
            console.error("Error during logout:", err);
            return next(err);
        }

        res.clearCookie("uuid");
        res.clearCookie("access_token");
        res.clearCookie("refresh_token");
        res.clearCookie("token_type");
        res.clearCookie("expires_in");
        res.clearCookie("discord_user");
        res.clearCookie("jb_session");

        return res.status(200).json({ message: "Logged out successfully" });
    });
}