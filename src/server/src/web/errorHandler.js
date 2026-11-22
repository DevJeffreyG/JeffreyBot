module.exports = (app) => {
    app.use(function (req, res, next) {
        if (req.path.startsWith("/api/")) {
            return res.status(404).json({ message: "Route not found" });
        }

        res.status(403);
        return res.render("./subpages/errors/403.ejs");
    });

    app.use(function (err, req, res, next) {
        console.error("🌎", err);

        if (res.headersSent) return next(err);

        const status = err.status ?? err.statusCode ?? err.response?.status ?? 500;
        const message = err.response?.body?.message
            ?? err.response?.body?.error
            ?? err.message
            ?? "Internal server error";

        if (req.path.startsWith("/api/")) {
            return res.status(status).json({ message });
        }

        return res.status(status).send(message);
    });
}