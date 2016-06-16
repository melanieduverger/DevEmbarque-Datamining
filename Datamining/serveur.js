
var express = require('express');
var app = express(),
    server = require('http').createServer(app)


app.use(express.static(__dirname));
app.set('view engine', 'ejs');
app.engine('html', require('ejs').renderFile);


// Chargement de la page index.html
app.get('*', function (req, res) {
  res.render('pages/index');
});

server.listen(8080);