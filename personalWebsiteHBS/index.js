var express = require('express');
var http=require('http');
var exphbs  = require('express-handlebars');
var bodyParser = require('body-parser');

var app = express();
app.use(bodyParser.json());
var handlebars=exphbs.create({extname: '.html'});

app.engine('html', handlebars.engine);
app.set('view engine', 'html');

//app.use('/assets', express.static('semantic'));
app.use('/assets', express.static('assets'));
app.use('/assets', express.static('node_modules'));


app.get('/', function (req, res) {
    res.render('index');
});
app.get('/Projects', function (req, res) {
    res.send({projects:"wassup"});
});

app.post('/stock', function(req, res){
  var stock=req.body.stock;
  //console.log(stock);http://finance.yahoo.com/webservice/v1/symbols/'+stock+'/quote?format=json
  http.get('http://finance.google.com/finance/info?client=ig&q='+stock+'&callback=?', function(result){
    var data="";
    result.on("data", function(chunk) {

      data=data+chunk;
    });
    result.on('end', function() {
       res.send(data);//.list.meta.resources[0].resource.fields);
    });


    //res.send(result);
  });
});

app.listen(4000);
