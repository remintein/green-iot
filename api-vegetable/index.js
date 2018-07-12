require('rootpath')();
var express = require('express');
var app = express();
var cors = require('cors');
var mail = require('model/mail');
var bodyParser = require('body-parser');
var expressJwt = require('express-jwt');
var fs = require('fs');
var config = require('config.json');
var http = require('http');
var irrigationServices = require('model/irrigation.log');
var climateServices = require('model/climate.log');
var climateDataServices = require('model/climate.data');
var irrigationDataServices = require('model/irrigation.data');
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
    //var temp_date = new Date();
    
    var date = moment().tz("Asia/Ho_Chi_Minh");
    //date = new Date(date);
    
    var hours = date.hour();
    var minutes = date.minutes();
    var seconds= date.seconds();
    if(hours == 0 && minutes == 0 && seconds == 0){
        var dataClimates = [];
        var dataIrrigations = [];
        climateServices.getAllData().then(function (climates) {
            dataClimates=climates;
            irrigationServices.getAllData().then(function (irrigations) {
                dataIrrigations=irrigations;
                var ghtml = fs.readFileSync('model/mail_template.html').toString();
                for(var i=0; i<dataClimates.length; i++){
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

                    ahtml = ahtml.replace(new RegExp('\{\{nutrition_a_min_day\}\}'),dataIrrigations[i].nutrition_a_min_day);
                    ahtml = ahtml.replace(new RegExp('\{\{nutrition_a_max_day\}\}'),dataIrrigations[i].nutrition_a_max_day);
                    ahtml = ahtml.replace(new RegExp('\{\{nutrition_b_min_day\}\}'),dataIrrigations[i].nutrition_b_min_day);
                    ahtml = ahtml.replace(new RegExp('\{\{nutrition_b_max_day\}\}'),dataIrrigations[i].nutrition_b_max_day);
                    ahtml = ahtml.replace(new RegExp('\{\{ph_level_min_day\}\}'),dataIrrigations[i].ph_level_min_day);
                    ahtml = ahtml.replace(new RegExp('\{\{ph_level_max_day\}\}'),dataIrrigations[i].ph_level_max_day);
                    ahtml = ahtml.replace(new RegExp('\{\{water_tank_level_min_day\}\}'),dataIrrigations[i].water_tank_level_min_day);
                    ahtml = ahtml.replace(new RegExp('\{\{water_tank_level_max_day\}\}'),dataIrrigations[i].water_tank_level_max_day);
                    ahtml = ahtml.replace(new RegExp('\{\{server\}\}'), dataClimates[i].server);

                    climateDataServices.getAllDataCSV(dataClimates[i].server).then(function(climates){
                        var json2csv = require('json2csv');
                        var fields = ['code', 'cli_view_temp', 'cli_view_humi','cli_view_light', 'cli_view_co2', 'cli_stt_fan','cli_stt_cooling', 'cli_stt_nozzle', 'cli_stt_shadingNet','cli_stt_ventDoor', 'date'];
                        var fieldName = ['Code', 'Environment Temperature', 'Environment Huminity','Light Intensity', 'CO2 Injection', 'FAN','Cooling Pump', 'Nozzle Pump', 'Shading Net System','Ventilation Door', 'Date created'];
                        var climate_csv = json2csv({ data: climates, fields: fields, fieldNames: fieldName });
                        irrigationDataServices.getAllDataCSV(climates[0].code).then(function(irrigations){
                            fields = ['code', 'irr_view_ph', 'irr_view_ec','irr_view_waterTemp', 'irr_view_OxygenConc', 'nutrition_a_level','nutrition_b_level', 'ph_level', 'water_tank_level','irr_stt_nutrition', 'irr_stt_cliller', 'date'];
                            fieldName = ['Code', 'PH', 'EC','Water Temperature', 'Oxygen Concentration In Water', 'Nutrition A Level','Nutrition B Level', 'PH Level', 'Water Tank Level','Nutrition Pump', 'Chiller Pump', 'Date created'];
                            var irrigation_csv = json2csv({ data: irrigations, fields: fields, fieldNames: fieldName });
                            var maildata = {
                                from: 'SMARTGREEN IOT CONTROL SYSTEM ' + irrigations[0].code, // sender address
                                subject: '(DAILY) SMARTGREEN IOT CONTROL SYSTEM', 
                                html: ahtml,
                                attachments: [{
                                        filename: 'climate.csv',
                                        content: climate_csv
                                    },
                                    {
                                        filename: 'irrigation.csv',
                                        content: irrigation_csv
                                    }
                                ],
                                server: irrigations[0].code
                            };

                            mail.send(maildata).then(function (data) {
                                climateDataServices.delete(data).then(function(){
                                }).catch(function(err){
                                });
                                irrigationDataServices.delete(data).then(function(){
                                }).catch(function(err){
                                });
                            }).catch(function (err) {
                            });

                        }).catch(function(err){
                        });
                    }).catch(function(err){
                    });

                    climateServices.deleteDataDay(dataClimates[i].server).then(function(){
                    }).catch(function(err){
                    });

                    irrigationServices.deleteDataDay(dataClimates[i].server).then(function(){
                    }).catch(function(err){
                    });

                    //delete month
                    if (date.month() != month){
                        climateServices.deleteDataMonth(dataClimates[i].server).then(function(){
                        }).catch(function(err){
                        });

                        irrigationServices.deleteDataMonth(dataClimates[i].server).then(function(){
                        }).catch(function(err){
                        });
                    }
                }
                month = date.month();
            }).catch(function(err){
                
            });
        }).catch(function(err){
            
        });
    }
}, 1000);
// routes
app.use('/users', require('./controllers/users.controller'));
app.use('/climates', require('./controllers/climates.controller'));
app.use('/irrigations', require('./controllers/irrigations.controller'));

// start server
var port = process.env.PORT || 4000

var server  = http.createServer(app);
require('./socket-io')(app, server);

server.listen(port, function () {
    console.log('Server listening on port: ' + port);
});