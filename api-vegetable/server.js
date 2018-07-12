require('rootpath')();
var express = require('express');
var app = express();
var cors = require('cors');
var mail = require('services/mail');
var bodyParser = require('body-parser');
var expressJwt = require('express-jwt');
var fs = require('fs');
var config = require('config.json');
var http = require('http');
var irrigationServices = require('services/irrigation.log');
var climateServices = require('services/climate.log');
var path = require('path');
var moment = require('moment-timezone');


app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// use JWT auth to secure the api
app.use(expressJwt({ secret: config.secret }).unless({ path: ['/users/authenticate', '/users/register', /^\/climates\/push\/.*/, /^\/irrigations\/push\/.*/] }));
//, /^\/climates\/server_name\/.*/ get unless params

var month = 0;
setInterval(function(){
    var temp_date = new Date();
    
	var date = moment(temp_date).tz("Asia/Ho_Chi_Minh").format();
    date = new Date(date);
	var hours = date.getHours();
    var minutes = date.getMinutes();
    var seconds= date.getSeconds();
    console.log(hours + " " + minutes + " " + seconds);
	if(hours==21&&minutes==29&&seconds==1){
        var fi = fs.readdirSync('services/data/climate/');
        var arr = [];

        var dataClimates = [];
        var dataIrrigations = [];
        climateServices.getAllData().then(function (climates) {
            dataClimates=climates;
            irrigationServices.getAllData().then(function (irrigations) {
                dataIrrigations=irrigations;
                
                var ghtml = fs.readFileSync('services/mail_template.html').toString();
                for(var i=0;i<dataClimates.length;i++){
                    var ahtml = ghtml;
                    ahtml = ahtml.replace(new RegExp('\{\{temp_min_day\}\}'),dataClimates[i].temp_min_day);
                    ahtml = ahtml.replace(new RegExp('\{\{temp_max_day\}\}'),dataClimates[i].temp_max_day);
                    ahtml = ahtml.replace(new RegExp('\{\{humi_min_day\}\}'),dataClimates[i].humi_min_day);
                    ahtml = ahtml.replace(new RegExp('\{\{humi_max_day\}\}'),dataClimates[i].humi_max_day);
                    ahtml = ahtml.replace(new RegExp('\{\{light_min_day\}\}'),dataClimates[i].light_min_day);
                    ahtml = ahtml.replace(new RegExp('\{\{light_max_day\}\}'),dataClimates[i].light_max_day);
                    ahtml = ahtml.replace(new RegExp('\{\{co2_min_day\}\}'),dataClimates[i].co2_min_day);
                    ahtml = ahtml.replace(new RegExp('\{\{co2_max_day\}\}'),dataClimates[i].co2_max_day);
                    ahtml = ahtml.replace(new RegExp('\{\{ph_min_day\}\}'),dataIrrigations[i].ph_min_day);
                    ahtml = ahtml.replace(new RegExp('\{\{ph_max_day\}\}'),dataIrrigations[i].ph_max_day);
                    ahtml = ahtml.replace(new RegExp('\{\{ec_min_day\}\}'),dataIrrigations[i].ec_min_day);
                    ahtml = ahtml.replace(new RegExp('\{\{ec_max_day\}\}'),dataIrrigations[i].ec_max_day);
                    ahtml = ahtml.replace(new RegExp('\{\{waterTemp_min_day\}\}'),dataIrrigations[i].waterTemp_min_day);
                    ahtml = ahtml.replace(new RegExp('\{\{waterTemp_max_day\}\}'),dataIrrigations[i].waterTemp_max_day);
                    ahtml = ahtml.replace(new RegExp('\{\{OxygenConc_min_day\}\}'),dataIrrigations[i].OxygenConc_min_day);
                    ahtml = ahtml.replace(new RegExp('\{\{OxygenConc_max_day\}\}'),dataIrrigations[i].OxygenConc_max_day);
                    ahtml = ahtml.replace(new RegExp('\{\{server\}\}'),dataClimates[i].server);
                    ahtml = ahtml.replace(new RegExp('\{\{send_time\}\}'),date.getDate()+'/'+Math.round(date.getMonth()+1)+'/'+date.getFullYear());
                    var a = [{
                                filename: 'climate.txt',
                                content: fs.createReadStream('services/data/climate/'+dataClimates[i].server+'.txt')
                            },
                            {
                                filename: 'irrigation.txt',
                                content: fs.createReadStream('services/data/irrigation/'+dataClimates[i].server+'.txt')
                            }];
                    
                    var maildata = {
                        from: 'SMARTGREEN IOT CONTROL SYSTEM '+ dataClimates[i].server, // sender address
                        subject: '(DAILY) SMARTGREEN IOT CONTROL SYSTEM', 
                        html: ahtml,
                        attachments: a,
                        server: dataClimates[i].server
                    };
                    mail.send(maildata)
                        .then(function (data) {
                            fs.writeFileSync(path.join(__dirname + '/services/data/climate/' +data+ '.txt'), '');
                            fs.writeFileSync(path.join(__dirname + '/services/data/irrigation/' +data+ '.txt'), '');
                        })
                        .catch(function (err) {
                        });

                     //delete day
                    climateServices.deleteDataDay(dataClimates[i].server).then(function(){
                    }).catch(function(err){
                    });

                    irrigationServices.deleteDataDay(dataClimates[i].server).then(function(){
                    }).catch(function(err){
                    });

                    //delete month
                    if (date.getMonth() != month){
                        climateServices.deleteDataMonth(dataClimates[i].server).then(function(){
                        }).catch(function(err){
                        });

                        irrigationServices.deleteDataMonth(dataClimates[i].server).then(function(){
                        }).catch(function(err){
                        });
                        month = date.getMonth();
                    }
                   
                }
            }).catch(function(err){
                
            });
        }).catch(function(err){
            
        });
	}
},1000);
// routes
app.use('/users', require('./controllers/users.controller'));
app.use('/climates', require('./controllers/climates.controller'));
app.use('/irrigations', require('./controllers/irrigations.controller'));

// start server
var port = process.env.NODE_ENV === 'production' ? 80 : 4000;

var server  = http.createServer(app);
require('./socket-io')(app, server);

server.listen(port, function () {
    console.log("Sfsdfsdfsdfasdfasdfasdf");
    console.log('Server listening on port: ' + port);
});