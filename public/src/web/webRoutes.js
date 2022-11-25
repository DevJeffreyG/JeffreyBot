const Express = require("express")();
const oauth2 = "https://discord.com/api/oauth2/authorize?client_id=514123686530383872&redirect_uri=http%3A%2F%2Flocalhost%3A10000%2Fauth%2Fdiscord&response_type=code&scope=identify%20email%20guilds";

/**
 * 
 * @param {Express} app 
 */
module.exports = (app) => {
    app.get("/social/discord", (req, res) => { res.redirect("https://discord.gg/fJvVgkN") });
    app.get("/social/youtube", (req, res) => { res.redirect("https://www.youtube.com/JeffreyG") });
    app.get("/social/twitter", (req, res) => { res.redirect("https://www.twitter.com/fakeJeffreyG") });

    app.get("/support/github", (req, res) => { res.redirect("https://github.com/DevJeffreyG/JeffreyBot") });
    app.get("/support/discord", (req, res) => { res.redirect("https://discord.gg/wk8aP4n") });

    app.get("/app-health", (req, res) => { return res.sendStatus(200)});
    app.get("/", (req, res) => { res.render("home") });
    app.get("/login", (req, res) => { res.redirect(oauth2) });
    app.get("/auth/discord", (req, res) => { res.render("./auth/discord") });
    
    app.get("/tops/currency", (req, res) => { res.render("./tops/currency") });
}