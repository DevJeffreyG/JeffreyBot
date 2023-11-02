module.exports = (app) => {
    app.use(function (req, res, next) {
        res.status(403);
        res.render("./subpages/errors/403.ejs");
    })
}