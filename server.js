require("dotenv").config();
const WebSocket = require("ws");
const express = require("express");
const path = require("path");

const bodyParser = require("body-parser");

// express
const app = express();
const server = require("http").createServer(app);

const WSServer = new WebSocket.Server({ server });
require("./websocket").handler(WSServer);

app.set("root", path.join(__dirname, "/public"));
app.set("port", process.env.PORT || 5000);

app.set("view engine", "ejs");
app.set("views", app.get("root"));

app.use(express.static(app.get("root")));
app.use(express.static(path.join(__dirname, "/public/src")));
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json());
app.WSServer = WSServer;

const { connection } = require("./db");
const { webRoutes, postHandler, errorHandler } = require("./public/src/web");

connection.then(() => {

  webRoutes(app);
  postHandler(app);
  errorHandler(app);

  server.listen(app.get("port"), () => console.log("🟢 Using port", app.get("port")));
});