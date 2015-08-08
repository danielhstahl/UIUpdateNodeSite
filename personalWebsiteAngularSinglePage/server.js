"use strict";
var express=require('express');
var app=express();

var server  = require('http').createServer(app); //required fro socket.io
var io= require('socket.io').listen(server);
var mongoUtils=require('mongoUtils');

var myDatabase=new mongoUtils({url:"mongodb://localhost:27017/myTestDB", collections:"AppSite"}); //default options work here...
app.set('view engine', 'ejs');

//index...redirect a "blank" to index
app.get('/', function(req, res){
     res.redirect("index");
});



//consider moving this to the client side since "pages" may be moved and it make sense to keep everything together
var waysToConnect=[
    {"label":"GooglePlus", "color":"#777", "src":"assets/icons/googleplus.svg", "url":"https://plus.google.com/u/0/+DanielStahl1138/about"},
    {"label":"GitHub", "color":"#777", "src":"assets/icons/github.svg", "url":"https://github.com/phillyfan1138/"},
    {"label":"LinkedIn", "color":"#777", "src":"assets/icons/linkedin.svg", "url":"https://www.linkedin.com/pub/daniel-stahl/2a/5a5/668"},
    {"label":"Email", "color":"#777", "src":"assets/icons/email.svg", "url":"mailto:danstahl1138@gmail.com target='_top'"}
];

//consider moving this to the client side...easier to do with angular (and possibly better practice?)
var pages=[
    {
        "label":"Home", 
        "url":"#home", 
        "subPages":[{"Title":"Productivity", "templateUrl":"/Productivity.html", "id":"Productivity"}, {"Title":"Data Management", "templateUrl":"/DataManagement.html", "id":"DataManagement"}, {"Title":"Mathematical Modeling", "templateUrl":"/Modeling.html", "id":"Modeling"}]
    },
    {
        "label":"Projects",  
        "url":"#projects",
        "subPages":[{"Title":"Credit Risk Distribution"}, {"Title":"First Hitting Time Project"}]
    },
    {
        "label":"Research", 
        "url":"#research",
        "subPages":[{"Title":"Economic Capital"}, {"Title":"First Hitting Time"}]
    },
    {
        "label":"About", 
        "url":"#about",
        "subPages":[{"Title":"Summary"}, {"Title":"Skill"}, {"Title":"Analytics"}, {"Title":"Model Risk"}]
    },
    {"label":"Blog", "url":"#blog"},
];

renderPage("index", "", "", "");
renderPage("index1", waysToConnect, pages, "");
//renderPage("index2", waysToConnect, pages, "");
//helper function for rendering the page
function renderPage(file, waysToConnect, pages, menuName){
     app.get('/'+file, function(req, res){
        var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.socket.remoteAddress || req.connection.socket.remoteAddress; //get user ip address
        console.log("at renderpage: "+ip);
        res.render(file, {connections:waysToConnect, pagelinks:pages});
        
        myDatabase.insertData({page:file, dateEntered:new Date(), dateLeft:null, ip:ip});
    });
}


app.get('/SiteStatistics', function(req, res){
    res.render('SiteStatistics');
});


app.get('/testRoutes', function(req, res){
    res.render('testRoutes');
});

io.on('connection', function(socket){
    console.log('a user connected');
    var ip = socket.handshake.address; //get ip address
    console.log("at io: "+ip)
    myDatabase.retrieveData({page:{$ne:null}}, "sum", 1, "page", function(data){
        return io.emit('totalViews', data); //open question...will this start becoming computationally expensive with many users hitting this?  this emits to all viewers
    });
    myDatabase.retrieveData({dateLeft:{$ne:null}}, "avg", {$subtract:["$dateLeft", "$dateEntered"]}, "page", function(data){return io.emit('averageView', data);});
    socket.on('disconnect', function(){ //when page is left
        myDatabase.updateData({ip:ip, dateLeft:{$eq:null}}, "dateLeft", new Date()); //should work since all dateLefts should be not null
        console.log('user disconnected');
    });
    socket.on("creditPressed", function(msg){
        var fork = require('child_process').fork; //asynced child process
        var child=fork('node_modules/main.js');
        child.send(msg);
        child.on('message', function(data){
            var key=Object.keys(data)[0];
            //console.log(data[key]);
            io.emit(key, data[key]);
        });
    });
    socket.on('error', function(err){
        console.log("error "+err);
    });
});
app.use(express.static(__dirname+'/views'));//location of static files (html, css, js, etc)
server.listen(500);//socket to listen on

