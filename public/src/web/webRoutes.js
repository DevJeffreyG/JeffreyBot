const { PermissionsBitField } = require("discord.js");
const Enums = require("../../../src/utils/Enums");
const { Guilds } = require("mongoose").models;

const { Locale, Session, Dashboard } = require("../utils");

const Express = require("express")();

const API_ENDPOINT = "https://discord.com/api/v10";
const REDIRECT_URI = "http://localhost:10000/api/discord-callback";

const inviteLink = `https://discord.com/api/oauth2/authorize?client_id=${process.env.CLIENT_ID}&permissions=8&scope=bot%20applications.commands`
const oauth2 = `https://discord.com/api/oauth2/authorize?client_id=${process.env.CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=code&scope=identify%20email%20guilds`;
const uptime = "https://stats.uptimerobot.com/oOR4JiDYNj";

/**
 * 
 * @param {Express} app 
 */
module.exports = (app) => {
    var session = app.Session; // Get Session
    const locale = new Locale(); // Create Locale
    const texts = locale.texts; // todo

    /* ===== EXTERNAL LINKS ===== */
    app.get("/invite", (req, res) => { res.redirect(inviteLink + `&guild_id=${req.query.guildId}`) });
    app.get("/login", (req, res) => { res.redirect(oauth2) });
    app.get("/status", (req, res) => { res.redirect(uptime) });

    /* ===== FOOTER LINKS ===== */
    app.get("/creator/", (req, res) => { prepare("./subpages/creator/", { req, res }) });
    app.get("/creator/jeffreyg", (req, res) => { prepare("./subpages/creator/jeffreyg", { req, res }) });
    app.get("/creator/projects", (req, res) => { prepare("./subpages/creator/projects", { req, res }) });

    app.get("/creator/projects", (req, res) => { prepare("./subpages/creator/projects", { req, res }) });

    /* ===== SOCIAL LINKS ===== */
    app.get("/creator/discord", (req, res) => { res.redirect("https://discord.gg/fJvVgkN") });
    app.get("/creator/youtube", (req, res) => { res.redirect("https://www.youtube.com/JeffreyG") });
    app.get("/creator/twitter", (req, res) => { res.redirect("https://www.twitter.com/fakeJeffreyG") });

    app.get("/support/github", (req, res) => { res.redirect("https://github.com/DevJeffreyG/JeffreyBot") });
    app.get("/support/discord", (req, res) => { res.redirect("https://discord.gg/wk8aP4n") });

    /* ===== GENERAL LINKS ===== */
    app.get("/app-health", (req, res) => { return res.sendStatus(200) });
    app.get("/", (req, res) => { prepare("home", { req, res }) });

    app.get("/dashboard", (req, res) => { prepare("./dashboard", { req, res }) });
    app.get("/dashboard/*/", (req, res) => { prepare("./dashboard", { req, res }) });
    app.get("/logout", (req, res) => {
        res.clearCookie("user");
        app.Session = new Session();
        session = app.Session;
        res.redirect("/")
    });

    /* ===== API CALLS ===== */
    app.get("/api/discord-callback", async (req, res) => {
        const code = req.query.code;

        if (!code) return res.status(400)
            .send({
                error: { message: "missing code" },
                status_code: 400
            });

        // conseguir token
        const params = new URLSearchParams();
        params.append('client_id', process.env.CLIENT_ID);
        params.append('client_secret', process.env.CLIENT_SECRET);
        params.append('grant_type', 'authorization_code');
        params.append('code', code);
        params.append('redirect_uri', REDIRECT_URI);

        const auth_query = await fetch(`${API_ENDPOINT}/oauth2/token`, {
            body: params,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            method: "POST"
        });
        const auth = await auth_query.json();
        if (auth.error) return res.status(400).send({
            error: { message: "couldn't get authorization credentials", response: auth }
        })
        const { access_token, token_type } = auth;

        const user_query = await fetch(`${API_ENDPOINT}/users/@me`, {
            headers: {
                authorization: `${auth.token_type} ${auth.access_token}`
            }
        });

        const user = await user_query.json();
        if (user.error) return res.status(400).send({
            error: { message: "couldn't get user", response: user }
        })

        session.setToken(token_type, access_token);
        session.setDiscordUser(user)

        await getUserGuilds();

        res.cookie("user", user)
        res.redirect("/dashboard/")
    });
    app.get("/api/get-dashboard/", async (req, res) => {
        let guildId = req.header("guildid")
        const dashboard = new Dashboard(guildId);

        session.setDashboard(dashboard);

        console.log("Cache is")
        console.log(session.dashboard.guildId);

        res.send(dashboard);
    })
    app.get("/api/get-guild", async (req, res) => {
        const guildId = req.header("guildid");

        if (!guildId) return res.status(400)
            .send({
                error: { message: "missing guildid" },
                status_code: 400
            });

        const query = await fetch(`${API_ENDPOINT}/guilds/${guildId}`, {
            headers: {
                authorization: `Bot ${process.env.TOKEN}`
            }
        })

        const guild = await query.json();
        if (guild.code === 50001) return res.status(400)
            .send({
                error: { message: "client not in guild", response: guild },
                status_code: 400
            })

        res.send(guild);
    })
    app.get("/api/db/get-guild", async (req, res) => {
        const guildId = req.header("guildid");

        if (!guildId) return res.status(400)
            .send({
                error: { message: "missing guildid" },
                status_code: 400
        });

        const query = await Guilds.getOrCreate(guildId);
        res.send(query)
    })

    /* ===== ERRORS ===== */
    //app.get("/404/", (req, res) => { prepare("./subpages/errors/404", { req, res } )});

    /**
     * Render page with req and res to prepare necessary vars
     * @param {String} toRender 
     * @param {{req, res}}
     * @returns 
     */
    function prepare(toRender, { req, res }) {
        session.setCookies(req);

        const base = {
            texts,
            session,
            Enums,
            req,
            res
        }

        for (const query in req.query) {
            base[query] = req.query[query]
        }

        return res.render(toRender, base)
    }

    /**
     * Get Guilds of User and set them to Session
     */
    async function getUserGuilds() {
        const query = await fetch(`${API_ENDPOINT}/users/@me/guilds`, {
            headers: {
                authorization: `${session.token_type} ${session.token}`
            }
        });
        const json = await query.json();

        const result = json?.filter(x => {
            const permissions = new PermissionsBitField(x.permissions)
            const checkAgainst = new PermissionsBitField(PermissionsBitField.Flags.ManageGuild)

            if (permissions.has(checkAgainst)) return x;
        })

        session.setGuilds(result)
    }
}