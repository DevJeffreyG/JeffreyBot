module.exports = (app) => {
    app.use(function (req, res, next) {
        res.status(404).render("./subpages/errors/404.ejs");
    })
}