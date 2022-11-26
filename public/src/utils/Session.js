class Session {
    constructor(){
    }

    setToken(type, token) {
        this.token_type = type;
        this.token = token;

        return this;
    }

    setCookies(req){
        this.cookies = req.cookies;
    }

    setDiscordUser(user){
        this.discord_user = user
    }
}

module.exports = Session
