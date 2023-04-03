class Session {
    constructor() {
    }

    setToken(type, token) {
        this.token_type = type;
        this.token = token;

        return this;
    }

    setCookies(req) {
        this.cookies = req.cookies;
    }

    setDiscordUser(user) {
        this.discord_user = user
    }

    setGuilds(json) {
        this.guilds = json;
    }

    setDashboard(dashboard) {
        this.dashboard = dashboard;
    }

    addGuildInfo(guild, channels) {
        let existing = this.guilds.findIndex(x => x.id === guild.id);

        if (existing != -1) {
            this.guilds[existing] = guild;
            this.guilds[existing].channels = channels;
        } else {
            this.guilds.push({ guild, "guild.channels": channels });
        }
    }
}

module.exports = Session
