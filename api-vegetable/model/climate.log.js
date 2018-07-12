var config = require('config.json');
var _ = require('lodash');
var Q = require('q');
var mongo = require('mongoskin');
var db = mongo.db(config.connectionString, { native_parser: true });
db.bind('logclimates');

var log = {};

log.getData = getData;
log.create = create;
log.delete = _delete;
log.updateData = updateData;
log.deleteDataDay = deleteDataDay;
log.deleteDataMonth = deleteDataMonth;
log.updateServer = updateServer;
log.getAllData = getAllData;

module.exports = log;

function _delete(server) {
    var deferred = Q.defer();
    db.logclimates.remove(
        { server: server },
        function (err) {
            if (err) deferred.reject(err.name + ': ' + err.message);
            deferred.resolve();
        });

    return deferred.promise;
}

function getAllData() {
    var deferred = Q.defer();
    db.logclimates.find().toArray(function (err, data) {
        if (err) deferred.reject(err.name + ': ' + err.message);
        deferred.resolve(data);
    });
    return deferred.promise;
}

function getData(server) {
    var deferred = Q.defer();
    db.logclimates.find({"server" : server}).toArray(function (err, data) {
        if (err) deferred.reject(err.name + ': ' + err.message);
        deferred.resolve(data);
    });

    return deferred.promise;
}

function updateData(climate) {
    var deferred = Q.defer();

    // validation
    db.logclimates.findOne({ server: climate.code },function (err, data) {
        if (err) deferred.reject(err.name + ': ' + err.message);

        if (data) {
            data.temp_min_day = (!parseInt(data.temp_min_day) || parseFloat(data.temp_min_day) > parseFloat(climate.cli_view_temp)) ? parseFloat(climate.cli_view_temp) : parseFloat(data.temp_min_day);
            data.temp_max_day = (!parseInt(data.temp_max_day) || parseFloat(data.temp_max_day) < parseFloat(climate.cli_view_temp)) ? parseFloat(climate.cli_view_temp) : parseFloat(data.temp_max_day);
            data.temp_min_month = (!parseInt(data.temp_min_month) || parseFloat(data.temp_min_month) > parseFloat(climate.cli_view_temp)) ? parseFloat(climate.cli_view_temp) : parseFloat(data.temp_min_month);
            data.temp_max_month =  (!parseInt(data.temp_max_month) || parseFloat(data.temp_max_month) < parseFloat(climate.cli_view_temp)) ? parseFloat(climate.cli_view_temp) : parseFloat(data.temp_max_month);
            
            data.humi_min_day = (!parseInt(data.humi_min_day) || parseFloat(data.humi_min_day) > parseFloat(climate.cli_view_humi)) ? parseFloat(climate.cli_view_humi) : parseFloat(data.humi_min_day);
            data.humi_max_day = (!parseInt(data.humi_max_day) || parseFloat(data.humi_max_day) < parseFloat(climate.cli_view_humi)) ? parseFloat(climate.cli_view_humi) : parseFloat(data.humi_max_day);
            data.humi_min_month = (!parseInt(data.humi_min_month) || parseFloat(data.humi_min_month) > parseFloat(climate.cli_view_humi)) ? parseFloat(climate.cli_view_humi) : parseFloat(data.humi_min_month);
            data.humi_max_month = (!parseInt(data.humi_max_month) || parseFloat(data.humi_max_month) < parseFloat(climate.cli_view_humi)) ? parseFloat(climate.cli_view_humi) : parseFloat(data.humi_max_month);
            
            data.light_min_day = (!parseInt(data.light_min_day) || parseFloat(data.light_min_day) > parseFloat(climate.cli_view_light)) ? parseFloat(climate.cli_view_light) : parseFloat(data.light_min_day);
            data.light_max_day = (!parseInt(data.light_max_day) || parseFloat(data.light_max_day) < parseFloat(climate.cli_view_light)) ? parseFloat(climate.cli_view_light) : parseFloat(data.light_max_day);
            data.light_min_month = (!parseInt(data.light_min_month) || parseFloat(data.light_min_month) > parseFloat(climate.cli_view_light)) ? parseFloat(climate.cli_view_light) : parseFloat(data.light_min_month);
            data.light_max_month = (!parseInt(data.light_max_month) || parseFloat(data.light_max_month) < parseFloat(climate.cli_view_light)) ? parseFloat(climate.cli_view_light) : parseFloat(data.light_max_month);
            
            data.co2_min_day = (!parseInt(data.co2_min_day) || parseFloat(data.co2_min_day) >  parseFloat(climate.cli_view_co2)) ? parseFloat(climate.cli_view_co2) : parseFloat(data.co2_min_day);
            data.co2_max_day = (!parseInt(data.co2_max_day) || parseFloat(data.co2_max_day) <  parseFloat(climate.cli_view_co2)) ? parseFloat(climate.cli_view_co2) : parseFloat(data.co2_max_day);
            data.co2_min_month = (!parseInt(data.co2_min_month) || parseFloat(data.co2_min_month) >  parseFloat(climate.cli_view_co2)) ? parseFloat(climate.cli_view_co2) : parseFloat(data.co2_min_month);
            data.co2_max_month = (!parseInt(data.co2_max_month) || parseFloat(data.co2_max_month) <  parseFloat(climate.cli_view_co2)) ? parseFloat(climate.cli_view_co2) : parseFloat(data.co2_max_month);

            updateLogClimate(data);
        } else {
            deferred.reject('Server name "' + climate.server + '" is not exist');
        }
    });

    function updateLogClimate(arrLogClimate) {
        // fields to update
        db.logclimates.update(
            { _id: mongo.helper.toObjectID(arrLogClimate._id) },
            { $set: arrLogClimate },
            function (err, doc) {
                if (err) deferred.reject(err.name + ': ' + err.message);
                var socketIO = global.socketIO;
                socketIO.sockets.emit('climate_update_log', arrLogClimate);
                deferred.resolve();
            }
        );
    }
    return deferred.promise;
}

function create( climate) {
    var deferred = Q.defer();

    // validation
    db.logclimates.findOne(
        { server:  climate.code },
        function (err, logclimate) {
            if (err) deferred.reject(err.name + ': ' + err.message);

            if (logclimate) {
                deferred.reject('Server name "' +  climate.server + '" is already taken');
            } else {
                createLogClimate();
            }
        });

    function createLogClimate() {
        var logclimate = {
            "server": climate.code
        }
        db.logclimates.insert(
            logclimate,
            function (err, doc) {
                if (err) deferred.reject(err.name + ': ' + err.message);
                deferred.resolve();
            });
    }
    return deferred.promise;
}

function deleteDataDay(server) {
    var deferred = Q.defer();
    // validation
    db.logclimates.findOne({ server: server },function (err, data) {
        if (err) deferred.reject(err.name + ': ' + err.message);

        if (data) {
            var set = {
                server: data.server,
                temp_min_day: 0,
                temp_max_day: 0,
                humi_min_day: 0,
                humi_max_day: 0,
                light_min_day: 0,
                light_max_day: 0,
                co2_min_day: 0,
                co2_max_day: 0,
            }
            updateLogClimate(set, data._id);
        } else {
            deferred.reject('Server name "' +  climate.server + '" is not exist');
        }
    });

    function updateLogClimate(arrLogClimate, id) {
        // fields to update
        db.logclimates.update(
            { _id: mongo.helper.toObjectID(id) },
            { $set: arrLogClimate },
            function (err, doc) {
                if (err) deferred.reject(err.name + ': ' + err.message);
                var socketIO = global.socketIO;
                socketIO.sockets.emit('climate_update_log', arrLogClimate);
                deferred.resolve();
            }
        );
    }
    return deferred.promise;
}

function deleteDataMonth(server) {
    var deferred = Q.defer();

    // validation
    db.logclimates.findOne({ server: server },function (err, data) {
        if (err) deferred.reject(err.name + ': ' + err.message);

        if (data) {
            var set = {
                server: data.server,
                temp_min_month: 0,
                temp_max_month: 0,
                humi_min_month: 0,
                humi_max_month: 0,
                light_min_month: 0,
                light_max_month: 0,
                co2_min_month: 0,
                co2_max_month: 0,
            }
            updateLogClimate(data._id, set);
        } else {
            deferred.reject('Server name "' +  climate.server + '" is not exist');
        }
    });

    function updateLogClimate(id, arrLogClimate) {
        // fields to update
        db.logclimates.update(
            { _id: mongo.helper.toObjectID(id) },
            { $set: arrLogClimate },
            function (err, doc) {
                if (err) deferred.reject(err.name + ': ' + err.message);
                var socketIO = global.socketIO;
                socketIO.sockets.emit('climate_update_log', arrLogClimate);
                deferred.resolve();
            }
        );
    }
    return deferred.promise;
}

function updateServer(server, climateParam) {
    var deferred = Q.defer();

    // validation
    db.logclimates.findOne({ server: server },function (err, climateLog) {
        if (err) deferred.reject(err.name + ': ' + err.message);

        if (climateLog) {
            climateLog.server = climateParam.server;
            updateLogClimate(climateLog);
        } else {
            deferred.reject('Server name "' + climateParam.server + '" is not exist');
        }
    });

    function updateLogClimate(arrClimateLog) {
        // fields to update
        db.logclimates.update(
            { _id: mongo.helper.toObjectID(arrClimateLog._id) },
            { $set: arrClimateLog },
            function (err, doc) {
                if (err) deferred.reject(err.name + ': ' + err.message);
                deferred.resolve();
        });
    }
    return deferred.promise;
}

