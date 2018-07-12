var config = require('config.json');
var _ = require('lodash');
var Q = require('q');
var mongo = require('mongoskin');
var db = mongo.db(config.connectionString, { native_parser: true });
db.bind('logirrigations');

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
    db.logirrigations.remove(
        { server: server },
        function (err) {
            if (err) deferred.reject(err.name + ': ' + err.message);

            deferred.resolve();
        });

    return deferred.promise;
}

function getAllData() {
    var deferred = Q.defer();
    db.logirrigations.find().toArray(function (err, data) {
        if (err) deferred.reject(err.name + ': ' + err.message);
        deferred.resolve(data);
    });

    return deferred.promise;
}

function getData(server) {
    var deferred = Q.defer();
    db.logirrigations.find({"server" : server}).toArray(function (err, data) {
        if (err) deferred.reject(err.name + ': ' + err.message);
        deferred.resolve(data);
    });

    return deferred.promise;
}

function updateData(irrigation) {
    var deferred = Q.defer();

    // validation
    db.logirrigations.findOne({ server: irrigation.code },function (err, data) {
        if (err) deferred.reject(err.name + ': ' + err.message);

        if (data) {
            data.ph_min_day = (!parseInt(data.ph_min_day) || parseFloat(data.ph_min_day) > parseFloat(irrigation.irr_view_ph)) ? parseFloat(irrigation.irr_view_ph) : parseFloat(data.ph_min_day);
            data.ph_max_day = (!parseInt(data.ph_max_day) || parseFloat(data.ph_max_day) < parseFloat(irrigation.irr_view_ph)) ? parseFloat(irrigation.irr_view_ph) : parseFloat(data.ph_max_day);
            data.ph_min_month = (!parseInt(data.ph_min_month) || parseFloat(data.ph_min_month) > parseFloat(irrigation.irr_view_ph)) ? parseFloat(irrigation.irr_view_ph) : parseFloat(data.ph_min_month);
            data.ph_max_month =  (!parseInt(data.ph_max_month) || parseFloat(data.ph_max_month) < parseFloat(irrigation.irr_view_ph)) ? parseFloat(irrigation.irr_view_ph) : parseFloat(data.ph_max_month);
            
            data.ec_min_day = (!parseInt(data.ec_min_day) || parseFloat(data.ec_min_day) > parseFloat(irrigation.irr_view_ec)) ? parseFloat(irrigation.irr_view_ec) : parseFloat(data.ec_min_day);
            data.ec_max_day = (!parseInt(data.ec_max_day) || parseFloat(data.ec_max_day) < parseFloat(irrigation.irr_view_ec)) ? parseFloat(irrigation.irr_view_ec) : parseFloat(data.ec_max_day);
            data.ec_min_month = (!parseInt(data.ec_min_month) || parseFloat(data.ec_min_month) > parseFloat(irrigation.irr_view_ec)) ? parseFloat(irrigation.irr_view_ec) : parseFloat(data.ec_min_month);
            data.ec_max_month = (!parseInt(data.ec_max_month) || parseFloat(data.ec_max_month) < parseFloat(irrigation.irr_view_ec)) ? parseFloat(irrigation.irr_view_ec) : parseFloat(data.ec_max_month);
            
            data.waterTemp_min_day = (!parseInt(data.waterTemp_min_day) || parseFloat(data.waterTemp_min_day) > parseFloat(irrigation.irr_view_waterTemp)) ? parseFloat(irrigation.irr_view_waterTemp) : parseFloat(data.waterTemp_min_day);
            data.waterTemp_max_day = (!parseInt(data.waterTemp_max_day) || parseFloat(data.waterTemp_max_day) < parseFloat(irrigation.irr_view_waterTemp)) ? parseFloat(irrigation.irr_view_waterTemp) : parseFloat(data.waterTemp_max_day);
            data.waterTemp_min_month = (!parseInt(data.waterTemp_min_month) || parseFloat(data.waterTemp_min_month) > parseFloat(irrigation.irr_view_waterTemp))? parseFloat(irrigation.irr_view_waterTemp) : parseFloat(data.waterTemp_min_month);
            data.waterTemp_max_month = (!parseInt(data.waterTemp_max_month) || parseFloat(data.waterTemp_max_month) < parseFloat(irrigation.irr_view_waterTemp)) ? parseFloat(irrigation.irr_view_waterTemp) : parseFloat(data.waterTemp_max_month);
            
            data.OxygenConc_min_day = (!parseInt(data.OxygenConc_min_day) || parseFloat(data.OxygenConc_min_day) >  parseFloat(irrigation.irr_view_OxygenConc)) ? parseFloat(irrigation.irr_view_OxygenConc) : parseFloat(data.OxygenConc_min_day);
            data.OxygenConc_max_day = (!parseInt(data.OxygenConc_max_day) || parseFloat(data.OxygenConc_max_day) <  parseFloat(irrigation.irr_view_OxygenConc)) ? parseFloat(irrigation.irr_view_OxygenConc) : parseFloat(data.OxygenConc_max_day);
            data.OxygenConc_min_month = (!parseInt(data.OxygenConc_min_month) || parseFloat(data.OxygenConc_min_month) >  parseFloat(irrigation.irr_view_OxygenConc)) ? parseFloat(irrigation.irr_view_OxygenConc) : parseFloat(data.OxygenConc_min_month);
            data.OxygenConc_max_month = (!parseInt(data.OxygenConc_max_month) || parseFloat(data.OxygenConc_max_month) <  parseFloat(irrigation.irr_view_OxygenConc)) ? parseFloat(irrigation.irr_view_OxygenConc) : parseFloat(data.OxygenConc_max_month);

            data.nutrition_a_min_day = (!parseInt(data.nutrition_a_min_day) || parseFloat(data.nutrition_a_min_day) >  parseFloat(irrigation.nutrition_a_level)) ? parseFloat(irrigation.nutrition_a_level) : parseFloat(data.nutrition_a_min_day);
            data.nutrition_a_max_day = (!parseInt(data.nutrition_a_max_day) || parseFloat(data.nutrition_a_max_day) <  parseFloat(irrigation.nutrition_a_level)) ? parseFloat(irrigation.nutrition_a_level) : parseFloat(data.nutrition_a_max_day);
            data.nutrition_a_min_month = (!parseInt(data.nutrition_a_min_month) || parseFloat(data.nutrition_a_min_month) >  parseFloat(irrigation.nutrition_a_level)) ? parseFloat(irrigation.nutrition_a_level) : parseFloat(data.nutrition_a_min_month);
            data.nutrition_a_max_month = (!parseInt(data.nutrition_a_max_month) || parseFloat(data.nutrition_a_max_month) <  parseFloat(irrigation.nutrition_a_level)) ? parseFloat(irrigation.nutrition_a_level) : parseFloat(data.nutrition_a_max_month);

            data.nutrition_b_min_day = (!parseInt(data.nutrition_b_min_day) || parseFloat(data.nutrition_b_min_day) >  parseFloat(irrigation.nutrition_b_level)) ? parseFloat(irrigation.nutrition_b_level) : parseFloat(data.nutrition_b_min_day);
            data.nutrition_b_max_day = (!parseInt(data.nutrition_b_max_day) || parseFloat(data.nutrition_b_max_day) <  parseFloat(irrigation.nutrition_b_level)) ? parseFloat(irrigation.nutrition_b_level) : parseFloat(data.nutrition_b_max_day);
            data.nutrition_b_min_month = (!parseInt(data.nutrition_b_min_month) || parseFloat(data.nutrition_b_min_month) >  parseFloat(irrigation.nutrition_b_level)) ? parseFloat(irrigation.nutrition_b_level) : parseFloat(data.nutrition_b_min_month);
            data.nutrition_b_max_month = (!parseInt(data.nutrition_b_max_month) || parseFloat(data.nutrition_b_max_month) <  parseFloat(irrigation.nutrition_b_level)) ? parseFloat(irrigation.nutrition_b_level) : parseFloat(data.nutrition_b_max_month);

            data.ph_level_min_day = (!parseInt(data.ph_level_min_day) || parseFloat(data.ph_level_min_day) >  parseFloat(irrigation.ph_level)) ? parseFloat(irrigation.ph_level) : parseFloat(data.ph_level_min_day);
            data.ph_level_max_day = (!parseInt(data.ph_level_max_day) || parseFloat(data.ph_level_max_day) <  parseFloat(irrigation.ph_level)) ? parseFloat(irrigation.ph_level) : parseFloat(data.ph_level_max_day);
            data.ph_level_min_month = (!parseInt(data.ph_level_min_month) || parseFloat(data.ph_level_min_month) >  parseFloat(irrigation.ph_level)) ? parseFloat(irrigation.ph_level) : parseFloat(data.ph_level_min_month);
            data.ph_level_max_month = (!parseInt(data.ph_level_max_month) || parseFloat(data.ph_level_max_month) <  parseFloat(irrigation.ph_level)) ? parseFloat(irrigation.ph_level) : parseFloat(data.ph_level_max_month);

            data.water_tank_level_min_day = (!parseInt(data.water_tank_level_min_day) || parseFloat(data.water_tank_level_min_day) >  parseFloat(irrigation.water_tank_level)) ? parseFloat(irrigation.water_tank_level) : parseFloat(data.water_tank_level_min_day);
            data.water_tank_level_max_day = (!parseInt(data.water_tank_level_max_day) || parseFloat(data.water_tank_level_max_day) <  parseFloat(irrigation.water_tank_level)) ? parseFloat(irrigation.water_tank_level) : parseFloat(data.water_tank_level_max_day);
            data.water_tank_level_min_month = (!parseInt(data.water_tank_level_min_month) || parseFloat(data.water_tank_level_min_month) >  parseFloat(irrigation.water_tank_level)) ? parseFloat(irrigation.water_tank_level) : parseFloat(data.water_tank_level_min_month);
            data.water_tank_level_max_month = (!parseInt(data.water_tank_level_max_month) || parseFloat(data.water_tank_level_max_month) <  parseFloat(irrigation.water_tank_level)) ? parseFloat(irrigation.water_tank_level) : parseFloat(data.water_tank_level_max_month);

            updateLogIrrigation(data);
        } else {
            deferred.reject('Server name "' + irrigation.server + '" is not exist');
        }
    });

    function updateLogIrrigation(arrLogIrrigation) {
        // fields to update
        db.logirrigations.update(
            { _id: mongo.helper.toObjectID(arrLogIrrigation._id) },
            { $set: arrLogIrrigation },
            function (err, doc) {
                if (err) deferred.reject(err.name + ': ' + err.message);
                var socketIO = global.socketIO;
                socketIO.sockets.emit('irrigation_update_log', arrLogIrrigation);
                deferred.resolve();
            }
        );
    }
    return deferred.promise;
}

function create( irrigation) {
    var deferred = Q.defer();

    // validation
    db.logirrigations.findOne(
        { server:  irrigation.code },
        function (err, logirrigation) {
            if (err) deferred.reject(err.name + ': ' + err.message);

            if (logirrigation) {
                deferred.reject('Server name "' +  irrigation.server + '" is already taken');
            } else {
                createLogIrrigation();
            }
        });

    function createLogIrrigation() {
        var logirrigation = {
            "server": irrigation.code
        }
        db.logirrigations.insert(
            logirrigation,
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
    db.logirrigations.findOne({ server: server },function (err, data) {
        if (err) deferred.reject(err.name + ': ' + err.message);
        
        if (data) {
            var set = {
                server: data.server,
                ph_min_day: 0,
                ph_max_day: 0,
                ec_min_day: 0,
                ec_max_day: 0,
                waterTemp_min_day: 0,
                waterTemp_max_day: 0,
                OxygenConc_min_day: 0,
                OxygenConc_max_day: 0,

                nutrition_a_min_day: 0,
                nutrition_a_max_day: 0,
                nutrition_b_min_day: 0,
                nutrition_b_max_day: 0,
                ph_level_min_day: 0,
                ph_level_max_day: 0,
                water_tank_level_min_day: 0,
                water_tank_level_max_day: 0,
            }
            updateLogIrrigation(data._id, set);
        } else {
            deferred.reject('Server name "' +  irrigation.server + '" is not exist');
        }
    });

    function updateLogIrrigation(id, arrLogIrrigation) {
        // fields to update
        db.logirrigations.update(
            { _id: mongo.helper.toObjectID(id) },
            { $set: arrLogIrrigation },
            function (err, doc) {
                if (err) deferred.reject(err.name + ': ' + err.message);
                var socketIO = global.socketIO;
                socketIO.sockets.emit('irrigation_update_log', arrLogIrrigation);
                deferred.resolve();
            }
        );
    }
    return deferred.promise;
}

function deleteDataMonth(server) {
    var deferred = Q.defer();

    // validation
    db.logirrigations.findOne({ server: server },function (err, data) {
        if (err) deferred.reject(err.name + ': ' + err.message);

        if (data) {
            var set = {
                server: data.server,
                ph_min_month: 0,
                ph_max_month: 0,
                ec_min_month: 0,
                ec_max_month: 0,
                waterTemp_min_month: 0,
                waterTemp_max_month: 0,
                OxygenConc_min_month: 0,
                OxygenConc_max_month: 0,

                nutrition_a_min_month: 0,
                nutrition_a_max_month: 0,
                nutrition_b_min_month: 0,
                nutrition_b_max_month: 0,
                ph_level_min_month: 0,
                ph_level_max_month: 0,
                water_tank_level_min_month: 0,
                water_tank_level_max_month: 0,
            }
            updateLogIrrigation(data._id, set);
        } else {
            deferred.reject('Server name "' +  irrigation.server + '" is not exist');
        }
    });

    function updateLogIrrigation(id, arrLogIrrigation) {
        // fields to update
        db.logirrigations.update(
            { _id: mongo.helper.toObjectID(id) },
            { $set: arrLogIrrigation },
            function (err, doc) {
                if (err) deferred.reject(err.name + ': ' + err.message);
                var socketIO = global.socketIO;
                socketIO.sockets.emit('irrigation_update_log', arrLogIrrigation);
                deferred.resolve();
            }
        );
    }
    return deferred.promise;
}

function updateServer(server, irrigationParam) {
    var deferred = Q.defer();

    // validation
    db.logirrigations.findOne({ server: server },function (err, irrigationLog) {
        if (err) deferred.reject(err.name + ': ' + err.message);

        if (irrigationLog) {
            irrigationLog.server = irrigationParam.server;
            updateLogIrrigation(irrigationLog);
        } else {
            deferred.reject('Server name "' + irrigationParam.server + '" is not exist');
        }
    });

    function updateLogIrrigation(arrIrrigationLog) {
        // fields to update
        db.logirrigations.update(
            { _id: mongo.helper.toObjectID(arrIrrigationLog._id) },
            { $set: arrIrrigationLog },
            function (err, doc) {
                if (err) deferred.reject(err.name + ': ' + err.message);
                deferred.resolve();
        });
    }
    return deferred.promise;
}

