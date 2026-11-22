const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { Session } = require("./SessionManager");

let used = new Map();

const Encrypt = (text) => {
    const salt = crypto.randomBytes(16);
    const iv = crypto.randomBytes(12);
    const key = crypto.pbkdf2Sync(process.env.APP_SECRET, salt, 100000, 32, 'sha256');

    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();

    return Buffer.concat([salt, iv, tag, encrypted]).toString('base64');
}

const Decrypt = (encryptedBase64, key) => {
    try {
        const data = Buffer.from(encryptedBase64, 'base64');

        const salt = Buffer.from(data.subarray(0, 16));
        const iv = Buffer.from(data.subarray(16, 28));
        const tag = Buffer.from(data.subarray(28, 44));
        const encrypted = Buffer.from(data.subarray(44));

        const pass = crypto.pbkdf2Sync(key, salt, 100000, 32, 'sha256');

        const decipher = crypto.createDecipheriv('aes-256-gcm', pass, iv);
        decipher.setAuthTag(tag);
        const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);

        return decrypted.toString('utf8');
    } catch (err) {
        console.error("error decrypting:", err.message);
        return null;
    }
}

const GenerateHmac = (token) => {
    return crypto.createHmac('sha256', process.env.APP_SECRET).update(token).digest('hex');
}

/**
     * Gets the session if request is valid.
     * @param {*} SessionManager
     * @param {*} req 
     * @returns {Session|null} Session object if valid, null if invalid.
     */
function GetSession(SessionManager, req) {
    let session = null;
    if (!req.cookies.uuid) {
        session = SessionManager.newSession();

        if (req.cookies.access_token && req.cookies.refresh_token && process.env.DEV === "TRUE") {
            session.forceUser(JSON.parse(req.cookies.discord_user));
            session.forceToken(req.cookies.token_type, req.cookies.access_token, req.cookies.refresh_token, req.cookies.expires_in);
        }

        return session;
    }

    try {
        const decoded = jwt.verify(req.cookies.uuid, process.env.TOKEN);
        session = SessionManager.getSession(decoded.uuid);
    } catch (err) {
        if (err instanceof jwt.TokenExpiredError) {
            console.log("expired uuid token");
            session = SessionManager.newSession();
        } else {
            console.error("uuid token validation error", err.message);
            session = null;
        }
    }

    return session;
}

module.exports = {
    /**
     * Verifica si el auth proporcionado es válido
     * @deprecated
     * @param {*} req 
     * @returns {Boolean}
     */
    Verify: (req) => {
        if (!req.header("auth")) return false;

        const auth = Decrypt(req.header("auth"), process.env.APP_SECRET)

        try {
            let decoded = jwt.verify(auth, process.env.TOKEN, { maxAge: "30s" });
            let elementMap = used.get(decoded.m);

            if (!elementMap) {
                used.set(decoded.m, { uses: 1, maxUses: decoded.uses || 1 });
            } else {

                if (elementMap.uses >= elementMap.maxUses) return false;

                elementMap.uses++;

                used.set(decoded.m, elementMap);
            }

            setTimeout(() => {
                used.delete(decoded.m);
            }, 30000)
            return true;
        } catch (err) {
            console.log(err);
            return false;
        }
    },
    Encrypt,
    Decrypt,
    GenerateHmac,
    GetSession
}