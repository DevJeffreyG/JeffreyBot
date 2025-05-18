const jwt = require("jsonwebtoken");
const crypto = require("crypto");

let used = new Set();

module.exports = {
    /**
     * Verifica si el auth proporcionado es válido
     * @param {*} req 
     * @returns {Boolean}
     */
    Verify: (req) => {
        if (!req.header("auth")) return false;

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
                console.log(err);
                return null;
            }
        }

        const auth = Decrypt(req.header("auth"), process.env.APP_SECRET)

        try {
            let decoded = jwt.verify(auth, process.env.TOKEN, { maxAge: "30s" });

            if (used.has(decoded.m)) return false;

            used.add(decoded.m)
            setTimeout(() => {
                used.delete(decoded.m);
            }, 30000)
            return true;
        } catch (err) {
            console.log(err);
            return false;
        }
    }
}