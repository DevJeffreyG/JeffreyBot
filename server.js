const http = require("http");
const express = require("express");
const app = express();

var port = process.env.PORT || 8080

app.use(express.static(__dirname + "/public"));

app.get("/", function(req, res) {
  res.redirect("..");
})

app.listen(port, function(){
  console.log("me prendi"); 
})