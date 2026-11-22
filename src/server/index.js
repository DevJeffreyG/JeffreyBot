require("dotenv").config();
const WebSocket = require("ws");
const express = require("express");
const path = require("path");

const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');
const cors = require("cors");

// express
const app = express();
const server = require("http").createServer(app);

app.set("root", path.join(__dirname, "/"));
app.set("port", process.env.PORT || 5000);

app.set("view engine", "ejs");
app.set("views", app.get("root"));

app.use(cors({
  origin: process.env.DASHBOARD,
  credentials: true
}));

app.use(cookieParser());
app.use(express.static(app.get("root")));
app.use(express.static(path.join(__dirname, "/src")));
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json());

const { connection } = require("../database");
const { webRoutes, postHandler, dbHandler, discordHandler, errorHandler } = require("./src/web");
const { SessionManager } = require("./src/js/SessionManager");

const sessionManager = new SessionManager();
app.SessionManager = sessionManager;

connection.then(() => {
  const WSServer = new WebSocket.Server({ server });
  require("./websocket").handler(WSServer);
  app.WSServer = WSServer;

  webRoutes(app);
  postHandler(app);
  dbHandler(app);
  discordHandler(app);
  errorHandler(app);

  server.listen(app.get("port"), () => console.log("🟢 Using port", app.get("port")));
});