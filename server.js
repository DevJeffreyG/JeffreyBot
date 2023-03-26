require("dotenv").config();
const express = require("express");
const path = require("path");

const cookieParser = require('cookie-parser');
const bodyParser = require("body-parser");

// express
const app = express();
app.set("root", path.join(__dirname, "/public"));
app.set("port", process.env.PORT || 10000);

app.set("view engine", "ejs");
app.set("views", app.get("root"));

app.use(express.static(app.get("root")));
app.use(express.static(path.join(__dirname, "/public/src")));
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json());

const { connection } = require("./db");
const { webRoutes, postHandler, errorHandler } = require("./public/src/web");
const { Session } = require("./public/src/utils");

const session = new Session();
app.Session = session;

connection.then(() => {

  webRoutes(app);
  postHandler(app);
  errorHandler(app);

  app.listen(app.get("port"), () => console.log("🟢 Using port", app.get("port")));
});
