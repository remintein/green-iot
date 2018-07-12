var config = require('config.json');
var _ = require('lodash');
var jwt = require('jsonwebtoken');
var bcrypt = require('bcryptjs');
var Q = require('q');
var fs = require('fs');
var path = require('path');
var irrigationLogServices = require('./irrigation.log');
var irrigationDataServices = require('./irrigation.data');
var mongo = require('mongoskin');
var db = mongo.db(config.connectionString, { native_parser: true });
db.bind('irrigations');

var service = {};

service.getAll = getAll;
service.getById = getById;
service.getDataIrrigationChart = getDataIrrigationChart;
service.create = create;
service.update = update;
service.delete = _delete;
service.updateServer = updateServer;

module.exports = service;

function getAll(server) {
    var deferred = Q.defer();
    db.irrigations.find({"code" : server}).toArray(function (err, irrigations) {
        if (err) deferred.reject(err.name + ': ' + err.message);
        irrigationLogServices.getData(server).then(function(irrigationsLog) {
            var data = ({
                "irrigations": irrigations,
                "irrigationsLog": irrigationsLog
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
    db.irrigations.findById(_id, function (err, irrigation) {
        if (err) deferred.reject(err.name + ': ' + err.message);

        if (user) {
            // return user (without hashed password)
            deferred.resolve(irrigation);
        } else {
            // user not found
            deferred.resolve();
        }
    });

    return deferred.promise;
}

function update(irrigationParam) {
    var deferred = Q.defer();

    // validation
    db.irrigations.findOne({ code: irrigationParam.server },function (err, irrigation) {
        if (err) deferred.reject(err.name + ': ' + err.message);

        if (irrigation) {
            irrigation.irr_view_ph = irrigationParam.irr_view_ph;
            irrigation.irr_view_ec = irrigationParam.irr_view_ec;
            irrigation.irr_view_waterTemp = irrigationParam.irr_view_waterTemp;
            irrigation.irr_view_OxygenConc = irrigationParam.irr_view_OxygenConc;
            irrigation.nutrition_a_level = irrigationParam.nutrition_a_level;
            irrigation.nutrition_b_level = irrigationParam.nutrition_b_level;
            irrigation.ph_level = irrigationParam.ph_level;
            irrigation.water_tank_level = irrigationParam.water_tank_level;
            irrigation.irr_stt_nutrition = irrigationParam.irr_stt_nutrition;
            irrigation.irr_stt_cliller = irrigationParam.irr_stt_cliller;
            updateIrrigation(irrigation);
        } else {
            deferred.reject('Server name "' + irrigationParam.server + '" is not exist');
        }
    });

    function updateIrrigation(arrIrrigation) {
        // fields to update
        db.irrigations.update(
            { _id: mongo.helper.toObjectID(arrIrrigation._id) },
            { $set: arrIrrigation },
            function (err, doc) {
                if (err) deferred.reject(err.name + ': ' + err.message);

                var irrigation = {};
                for(var key in arrIrrigation) {
                    if (key != "server" && key != "_id")
                        irrigation[key] = arrIrrigation[key];
                }
                // txtIrrigation += date.toISOString() + "\n";
                // fs.appendFileSync('services/data/irrigation/'+ arrIrrigation.code +'.txt', txtIrrigation); 

                irrigation.date = new Date();
                irrigationDataServices.create(irrigation).then(function(docs) {
                })
                .catch(function (err) {
                });

                var socketIO = global.socketIO;
			    socketIO.sockets.emit('irrigation_update', arrIrrigation);

                irrigationLogServices.updateData(arrIrrigation).then(function(irrigationsLog) {
                    deferred.resolve(arrIrrigation.server);
                })
                .catch(function (err) {
                    deferred.reject(err);
                });
        });
    }
    return deferred.promise;
}


function getDataIrrigationChart(server){
    var deferred = Q.defer();
    fs.readFile(path.join(__dirname + '/data/irrigation/'+ server +'.txt'),'utf8', function(err, data) {
        if (err) deferred.reject(err.name + ': ' + err.message);
        var arr_data = data.split("\n");
        var chartData = [];
        var chartDataEx = [];

        arr_data.forEach(function(element) {
            if (element.length > 0){
                var arr_element = element.split(",");
                chartData.push({
                    date: arr_element[12],
                    ph: arr_element[2],
                    ec: arr_element[3],
                    waterTemp: arr_element[4],
                    OxygenConc: arr_element[5],
                });
                chartDataEx.push({
                    date: arr_element[12],
                    nutrition_a_level: arr_element[6],
                    nutrition_b_level: arr_element[7],
                    ph_level: arr_element[8],
                    water_tank_level: arr_element[9],
                });
            }
        }, this);
        var data = {
            chartData: chartData,
            chartDataEx: chartDataEx
        }
        deferred.resolve(data);
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

    db.irrigations.remove(
        { code: server },
        function (err) {
            if (err) deferred.reject(err.name + ': ' + err.message);
            irrigationLogServices.delete(server).then(function(){
                deferred.resolve();
            }).catch(function (err) {
                deferred.reject(err);
            });
        });

    return deferred.promise;
}

function create(irrigationParam) {
    var deferred = Q.defer();

    // validation
    db.irrigations.findOne(
        { server: irrigationParam.server },
        function (err, irrigation) {
            if (err) deferred.reject(err.name + ': ' + err.message);

            if (irrigation) {
                deferred.reject('Server name "' + irrigationParam.server + '" is already taken');
            } else {
                createIrrigation();
            }
        });

    function createIrrigation() {
        var irrigation = {
            "server": irrigationParam.server,
            "code": "CTL" + irrigationParam.code
        }
        db.irrigations.insert(
            irrigation,
            function (err, doc) {
                if (err) deferred.reject(err.name + ': ' + err.message);
                // fs.writeFileSync('services/data/irrigation/'+ irrigation.code +'.txt'); 
                irrigationLogServices.create(irrigation).then(function(data) {
                    deferred.resolve();
                })
                .catch(function (err) {
                    deferred.reject(err);
                });
            });
    }

    return deferred.promise;
}

function updateServer(server, irrigationParam) {
    var deferred = Q.defer();

    db.irrigations.findOne({ server: irrigationParam.server },function (err, irrigation_check) {
        if (err) deferred.reject(err.name + ': ' + err.message);

        if (!irrigation_check) {
            // validation
            db.irrigations.findOne({ server: server },function (err, irrigation) {
                if (err) deferred.reject(err.name + ': ' + err.message);

                if (irrigation) {
                    irrigation.server = irrigationParam.server;
                    updateIrrigation(irrigation);
                } else {
                    deferred.reject('Server name "' + server + '" is not exist');
                }
            });

            function updateIrrigation(irrigationParam) {
                // fields to update
                db.irrigations.update(
                    { _id: mongo.helper.toObjectID(irrigationParam._id) },
                    { $set: irrigationParam },
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
                "mess": 'Server name "' + irrigationParam.server + '" is already exist'
            }
            deferred.resolve(data);
        }
    });

    
    return deferred.promise;
}
