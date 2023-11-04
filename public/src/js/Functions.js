module.exports = {
    Verify: (req) => {
        if (!req.header("auth")) return false;
        if (req.header("auth") !== process.env.TOKEN) return false;

        return true;
    }
}