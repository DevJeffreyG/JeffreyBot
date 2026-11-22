const superagent = require("superagent");
const DISCORD_API_ENDPOINT = "https://discord.com/api/v10";
const jwt = require("jsonwebtoken");
const { PermissionsBitField } = require("discord.js");
const { Bases } = require("../../../resources/");

const REDIRECT_URI = `${process.env.DASHBOARD}/api/discord-callback`;

class SessionManager {
    constructor() {
        this.sessions = new Map();
    }

    newSession() {
        let session = new Session();
        this.sessions.set(session.uuid, session);

        return session;
    }

    getSession(uuid) {
        return this.sessions.get(uuid);
    }
}

class Session {
    #tokenType; #token; #refreshToken; #expires;
    #refresh_interval; #keepDiscordAlive = true;

    constructor() {
        this.uuid = crypto.randomUUID();
        this.discordUser = null;
        this.guilds = [];
        // permisos del usuario por guild, separados de `guilds` porque fetchGuild()
        // reemplaza esos objetos con los datos obtenidos con el token del bot
        this.guildPermissions = new Map();
        this.lastGuildsFetch = null;

        this.#tokenType = null;
        this.#token = null;
        this.#refreshToken = null;
        this.#expires = null;
    }

    getDiscordUser() {
        return this.discordUser;
    }

    #setToken({ token_type, access_token, refresh_token, expires_in }) {
        this.#tokenType = token_type;
        this.#token = access_token;
        this.#refreshToken = refresh_token;
        this.#expires = expires_in ?? null;
    }

    forceUser(discordUser) {
        if (process.env.DEV != "TRUE") throw new Error("forceUser can't be used in production");
        this.discordUser = discordUser;
        return this;
    }

    forceToken(token_type, access_token, refresh_token, expires_in) {
        if (process.env.DEV != "TRUE") throw new Error("forceToken can't be used in production");
        this.#tokenType = token_type;
        this.#token = access_token;
        this.#refreshToken = refresh_token;
        this.#expires = expires_in ?? null;

        return this;
    }

    /**
     * @param {String} code Code provided via OAuth2
     */
    async fetchAuthToken(code) {
        if (!code) throw new Error("Missing code");

        const auth_query = await superagent.post(`${DISCORD_API_ENDPOINT}/oauth2/token`)
            .send({
                client_id: process.env.CLIENT_ID,
                client_secret: process.env.CLIENT_SECRET,
                grant_type: "authorization_code",
                code,
                redirect_uri: REDIRECT_URI
            })
            .type("application/x-www-form-urlencoded")
            .catch(console.error);

        if (!auth_query.ok) throw new Error("Failed to get auth token");

        const auth = auth_query.body;

        this.#setToken(auth);

        return this;
    }

    async fetchDiscordUser() {
        if (!this.#tokenType || !this.#token) throw new Error("Missing auth token");

        const user_query = await superagent.get(`${DISCORD_API_ENDPOINT}/users/@me`)
            .set("authorization", `${this.#tokenType} ${this.#token}`);

        if (!user_query.ok) throw new Error("Failed to get user");


        let user = user_query.body;
        console.log(user);

        if (Bases.devIds.find(x => x === user.id)) {
            user.dev = true;
        }

        console.log(user);

        this.discordUser = user;

        return this;
    }

    async fetchAvailableGuilds() {
        const query = await superagent.get(`${DISCORD_API_ENDPOINT}/users/@me/guilds`)
            .set("authorization", `${this.#tokenType} ${this.#token}`);

        if (!query.ok) throw new Error("Failed to get guilds");

        const json = query.body;

        const result = json?.filter(x => {
            const permissions = new PermissionsBitField(x.permissions)
            const checkAgainst = new PermissionsBitField(PermissionsBitField.Flags.ManageGuild)

            if (permissions.has(checkAgainst)) return x;
        })

        this.guilds = result ?? [];
        this.guildPermissions = new Map(
            this.guilds.map(guild => [guild.id, guild.permissions])
        );
        this.lastGuildsFetch = new Date();

        return this;
    }

    async fetchGuild(guildId) {
        if (!guildId) throw new Error("Missing guildId");

        const query_guilds = await superagent.get(`${DISCORD_API_ENDPOINT}/guilds/${guildId}`)
            .set("authorization", `Bot ${process.env.TOKEN}`);
        const query_channels = await superagent.get(`${DISCORD_API_ENDPOINT}/guilds/${guildId}/channels`)
            .set("authorization", `Bot ${process.env.TOKEN}`);

        const query_members = await superagent.get(`${DISCORD_API_ENDPOINT}/guilds/${guildId}/members`)
            .query({ limit: 1000 })
            .set("authorization", `Bot ${process.env.TOKEN}`);

        if (!query_guilds.ok) throw new Error("Failed to get guild");
        if (!query_guilds.ok) throw new Error("Failed to get channels");
        if (!query_members.ok) throw new Error("Failed to get members");

        const guild = query_guilds.body;
        const channels = query_channels.body;
        const members = query_members.body;

        if (guild.code === 50001) throw new Error("Missing access to guild");

        this.addGuildInfo(guild, { channels, members });

        return this;
    }

    addGuildInfo(guild, { channels, members }) {
        let existing = this.guilds.findIndex(x => x.id === guild.id);
        const permissions = existing != -1 ? this.guilds[existing].permissions : undefined;

        if (existing != -1) {
            this.guilds[existing] = guild;
            this.guilds[existing].channels = channels;
            this.guilds[existing].members = members;
            if (permissions !== undefined) this.guilds[existing].permissions = permissions;
        } else {
            guild['channels'] = channels;
            guild['members'] = members;
            if (permissions !== undefined) guild['permissions'] = permissions;
            this.guilds.push(guild);
        }

        return this
    }

    getGuild(guildId) {
        if (!guildId) throw new Error("Missing guildId");

        return this.guilds.find(x => x.id === guildId);
    }

    /** permisos del usuario en un guild, incluso después de fetchGuild() */
    getGuildPermissions(guildId) {
        if (!guildId) return null;

        return this.guildPermissions?.get(guildId)
            ?? this.guilds.find(x => x.id === guildId)?.permissions
            ?? null;
    }

    async logout() {
        if (this.#token || this.#refreshToken) {
            const query = await superagent.post(`${DISCORD_API_ENDPOINT}/oauth2/token/revoke`)
                .send({
                    client_id: process.env.CLIENT_ID,
                    client_secret: process.env.CLIENT_SECRET,
                    token: this.#token || this.#refreshToken
                })
                .type("application/x-www-form-urlencoded");
        }

        this.#killDiscord();

        return this;
    }

    updateCookies(res) {
        if (!res) throw new Error("Missing response object");

        if (process.env.DEV === "TRUE") {
            res.cookie("token_type", this.#tokenType, { maxAge: 24 * 60 * 60 * 1000 });
            res.cookie("access_token", this.#token, { maxAge: 24 * 60 * 60 * 1000 });
            res.cookie("refresh_token", this.#refreshToken, { maxAge: 24 * 60 * 60 * 1000 });
            res.cookie("expires_in", this.#expires, { maxAge: 24 * 60 * 60 * 1000 });
            res.cookie("discord_user", JSON.stringify(this.discordUser), { maxAge: 24 * 60 * 60 * 1000 });
        }


        res.cookie("uuid", jwt.sign({ uuid: this.uuid }, process.env.TOKEN, { expiresIn: 24 * 60 * 60 }));

        res.cookie("fetch_times", JSON.stringify({ lastGuildsFetch: this.lastGuildsFetch }), {
            secure: process.env.DEV === "TRUE" ? false : true,
            sameSite: 'lax',
            maxAge: 24 * 60 * 60 * 1000 // 24h
        });

        return this;
    }

    async refreshAuthToken() {
        if (!this.#keepDiscordAlive) return this;
        if (!this.#refreshToken) throw new Error("Missing refresh token");

        const refresh_query = await superagent.post(`${DISCORD_API_ENDPOINT}/oauth2/token`)
            .send({
                client_id: process.env.CLIENT_ID,
                client_secret: process.env.CLIENT_SECRET,
                grant_type: "refresh_token",
                refresh_token: this.#refreshToken
            })
            .type("application/x-www-form-urlencoded")
            .catch(console.error);

        if (!refresh_query.ok) return res.sendStatus(403);

        const auth = refresh_query.body;
        this.#setToken(auth);

        return this;
    }

    startRefreshInterval() {
        if (this.#refresh_interval) clearInterval(this.#refresh_interval);

        console.log("Starting interval", this.#expires);
        this.#refresh_interval = setInterval(async () => {
            console.log("Interval call!");
            try {
                await this.refreshAuthToken();
            } catch (err) {
                console.log("Killing Discord Session");
                this.#killDiscord();
            }
        }, this.#expires - 5000)

        return this;
    }

    #killDiscord() {
        this.#keepDiscordAlive = false;
        clearInterval(this.#refresh_interval);
        return this;
    }
}

module.exports = { SessionManager, Session }