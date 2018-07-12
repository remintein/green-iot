var config = require('config.json');
var _ = require('lodash');
var jwt = require('jsonwebtoken');
var bcrypt = require('bcryptjs');
var Q = require('q');
var fs = require('fs');
var path = require('path');
var mongo = require('mongoskin');
var climateLogServices = require('./climate.log');
var climateDataServices = require('./climate.data');
var db = mongo.db(config.connectionString, { native_parser: true });
db.bind('climates');

var service = {};

service.getAll = getAll;
service.getById = getById;
service.getDataClimateChart = getDataClimateChart;
service.create = create;
service.update = update;
service.getAllServerName  = getAllServerName;
service.delete = _delete;
service.updateServer = updateServer;

module.exports = service;

function getAll(server) {
    var deferred = Q.defer();
    db.climates.find({"code" : server}).toArray(function (err, climates) {
        if (err) deferred.reject(err.name + ': ' + err.message);
        climateLogServices.getData(server).then(function(climatesLog) {
            var data = ({
                "climates": climates,
                "climatesLog": climatesLog
            });
            deferred.resolve(data);
        })
        .catch(function (err) {
            deferred.reject(err);
        });
    });

    return deferred.promise;
}

function getById(_id) {
    var deferred = Q.defer();

    db.climates.findById(_id, function (err, climate) {
        if (err) deferred.reject(err.name + ': ' + err.message);

        if (climate) {
            // return user (without hashed password)
            deferred.resolve(climate);
        } else {
            // user not found
            deferred.resolve();
        }
    });

    return deferred.promise;
}

function update(climateParam) {
    var deferred = Q.defer();
    // validation
    db.climates.findOne({ code: climateParam.server },function (err, climate) {
        if (err) deferred.reject(err.name + ': ' + err.message);

        if (climate) {
            climate.cli_view_temp = climateParam.cli_view_temp;
            climate.cli_view_humi = climateParam.cli_view_humi;
            climate.cli_view_light = climateParam.cli_view_light;
            climate.cli_view_co2 = climateParam.cli_view_co2;
            climate.cli_stt_fan = climateParam.cli_stt_fan;
            climate.cli_stt_cooling = climateParam.cli_stt_cooling;
            climate.cli_stt_nozzle = climateParam.cli_stt_nozzle;
            climate.cli_stt_shadingNet = climateParam.cli_stt_shadingNet;
            climate.cli_stt_ventDoor = climateParam.cli_stt_ventDoor;
            updateClimate(climate);
        } else {
            deferred.reject('Server name "' + climateParam.server + '" is not exist');
        }
    });

    function updateClimate(arrClimate) {
        // fields to update
        db.climates.update(
            { _id: mongo.helper.toObjectID(arrClimate._id) },
            { $set: arrClimate },
            function (err, doc) {
                if (err) deferred.reject(err.name + ': ' + err.message);

                var climate = {};
                for(var key in arrClimate) {
                    if (key != "server" && key != "_id")
                        climate[key] = arrClimate[key];
                }
                // txtClimate += date.toISOString() + "\n";
                // fs.appendFileSync('services/data/climate/'+ arrClimate.code +'.txt', txtClimate); 
                climate.date = new Date();;
                climateDataServices.create(climate).then(function(docs) {
                })
                .catch(function (err) {
                });


                var socketIO = global.socketIO;
                socketIO.sockets.emit('climate_update', arrClimate);

                climateLogServices.updateData(arrClimate).then(function(climatesLog) {
                    deferred.resolve(arrClimate.server);
                })
                .catch(function (err) {
                    deferred.reject(err);
                });
            }
        );
    }
    return deferred.promise;
}

function getAllServerName(){
     var deferred = Q.defer();
     db.climates.find({}, {server : 1, code: 1}).toArray(function (err, climates) {
         if (err) deferred.reject(err.name + ': ' + err.message);
         deferred.resolve(climates);
     });
     return deferred.promise;
 }

function getDataClimateChart(server){
    var deferred = Q.defer();
    fs.readFile(path.join(__dirname + '/data/climate/'+ server +'.txt'),'utf8', function(err, data) {
        if (err ) deferred.reject(err.name + ': ' + err.message);
        var chartData = [];
        var arr_data = data.split("\n");
        arr_data.forEach(function(element) {
            if (element.length > 0){
                var arr_element = element.split(",");
                chartData.push({
                    date: new Date(arr_element[11]),
                    temp: arr_element[2],
                    humi: arr_element[3],
                    light: arr_element[4],
                    co2: arr_element[5]
                });
            }
        }, this);
        deferred.resolve(chartData);
    });
    return deferred.promise;
}

function dataTemp(date, value){
    var data_temp = [];
    data_temp.push(parseFloat(date));
    data_temp.push(parseFloat(value));
    return data_temp;
}

function _delete(server) {
    var deferred = Q.defer();

    db.climates.remove(
        { code: server },
        function (err) {
            if (err) deferred.reject(err.name + ': ' + err.message);
            climateLogServices.delete(server).then(function(){
                deferred.resolve();
            }).catch(function (err) {
                deferred.reject(err);
            });
        });

    return deferred.promise;
}

function create(climateParam) {
    var deferred = Q.defer();
    // validation
    db.climates.findOne(
        { server: climateParam.server },
        function (err, climate) {
            if (err) deferred.reject(err.name + ': ' + err.message);

            if (climate) {
                deferred.reject('Server name "' + climateParam.server + '" is already taken');
            } else {
                createClimate();
            }
        });

    function createClimate() {
        var climate = {
            "server":climateParam.server,
            "code": "CTL" + climateParam.code
        }
        db.climates.insert(
            climate,
            function (err, doc) {
                if (err) deferred.reject(err.name + ': ' + err.message);
                // fs.writeFileSync('services/data/climate/'+ climate.code +'.txt'); 
                climateLogServices.create(climate).then(function(data) {
                    deferred.resolve();
                })
                .catch(function (err) {
                    deferred.reject(err);
                });
            });
    }
    return deferred.promise;
}

function updateServer(server, climateParam) {
    var deferred = Q.defer();
    db.climates.findOne({ server: climateParam.server },function (err, climate_check) {

        if (err) deferred.reject(err.name + ': ' + err.message);

        if (!climate_check) {

            // validation
            db.climates.findOne({ server: server },function (err, climate) {
                if (err) deferred.reject(err.name + ': ' + err.message);

                if (climate) {
                    climate.server = climateParam.server;
                    updateClimate(climate);
                } else {
                    deferred.reject('Server name "' + server + '" is not exist');
                }
            });

            function updateClimate(arrClimate) {
                // fields to update
                db.climates.update(
                    { _id: mongo.helper.toObjectID(arrClimate._id) },
                    { $set: arrClimate },
                    function (err, doc) {
                        if (err) deferred.reject(err.name + ': ' + err.message);
                        var data = {
                            "err": false
                        }
                        deferred.resolve(data);
                    }
                );
            }
        } else {
            var data = {
                "err": true,
                "mess": 'Server name "' + climateParam.server + '" is already exist'
            }
            deferred.resolve(data);
        }
    });
    return deferred.promise;
}