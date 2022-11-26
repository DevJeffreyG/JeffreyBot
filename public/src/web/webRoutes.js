const { PermissionsBitField } = require("discord.js");
const { Locale } = require("../utils");

const Express = require("express")();

const oauth2 = "https://discord.com/api/oauth2/authorize?client_id=514123686530383872&redirect_uri=http%3A%2F%2Flocalhost%3A10000%2Fapi%2Fdiscord-callback&response_type=code&scope=identify%20email%20guilds";
const API_ENDPOINT = "https://discord.com/api/v10";
const REDIRECT_URI = "http://localhost:10000/api/discord-callback";

/**
 * 
 * @param {Express} app 
 */
module.exports = (app) => {
    var session = app.Session;
    const locale = new Locale();

    const texts = locale.texts;

    app.get("/creator/", (req, res) => { prepare("./creator/", { req, res }) });
    app.get("/creator/discord", (req, res) => { res.redirect("https://discord.gg/fJvVgkN") });
    app.get("/creator/youtube", (req, res) => { res.redirect("https://www.youtube.com/JeffreyG") });
    app.get("/creator/twitter", (req, res) => { res.redirect("https://www.twitter.com/fakeJeffreyG") });

    app.get("/support/github", (req, res) => { res.redirect("https://github.com/DevJeffreyG/JeffreyBot") });
    app.get("/support/discord", (req, res) => { res.redirect("https://discord.gg/wk8aP4n") });

    app.get("/app-health", (req, res) => { return res.sendStatus(200) });
    app.get("/", (req, res) => { prepare("home", { req, res }) });

    app.get("/login", (req, res) => { res.redirect(oauth2) });
    app.get("/logout", (req, res) => {
        res.clearCookie("user");
        res.redirect("/")
    });

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

        console.log(user)

        session.setToken(token_type, access_token);
        session.setDiscordUser(user)

        res.cookie("user", user)
        res.redirect("/dashboard/")
    });
    app.get("/api/discord/get-guilds", async (req, res) => {
        const query = await fetch(`${API_ENDPOINT}/users/@me/guilds`, {
            headers: {
                authorization: `${session.token_type} ${session.token}`
            }
        });
        const json = await query.json();

        const result = json?.filter(x => {
            const permissions = new PermissionsBitField(x.permissions)
            const checkAgainst = new PermissionsBitField(PermissionsBitField.Flags.ManageGuild)

            if(permissions.has(checkAgainst)) return x;
        })

        res.send(result);
    })

    app.get("/dashboard", (req, res) => { prepare("./dashboard/", { req, res }) });

    //app.get("/tops/currency", (req, res) => { prepare("./tops/currency/", {req, res}) });

    function prepare(toRender, { req, res }) {
        session.setCookies(req);

        const base = {
            texts,
            session
        }

        for (const query in req.query) {
            base[query] = req.query[query]
        }

        return res.render(toRender, base)
    }
}