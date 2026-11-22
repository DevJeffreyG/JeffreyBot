const webRoutes = require("./webRoutes");
const postHandler = require("./postHandler");
const dbHandler = require("./dbHandler");
const discordHandler = require("./discordHandler");
const errorHandler = require("./errorHandler");

module.exports = {
    webRoutes,
    postHandler,
    dbHandler,
    discordHandler,
    errorHandler,
}