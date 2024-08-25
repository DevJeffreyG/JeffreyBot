const jwt = require("jsonwebtoken");

module.exports = {
    Verify: (req) => {
        if (!req.header("auth")) return false;

        try {
            jwt.verify(req.header("auth"), process.env.TOKEN);
            return true;
        } catch (err) {
            console.log(err);
            return false;
        }
    }
}