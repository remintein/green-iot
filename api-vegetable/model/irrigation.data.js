var config = require('config.json');
var _ = require('lodash');
var Q = require('q');
var mongo = require('mongoskin');
var db = mongo.db(config.connectionString, { native_parser: true });
db.bind('datairrigations');

var data = {};

data.create = create;
data.delete = _delete;
data.getAllData = getAllData;
data.getAllDataCSV = getAllDataCSV;

module.exports = data;

function _delete(server) {
    var deferred = Q.defer();
    db.datairrigations.remove(
        {},
        function (err) {
            if (err) deferred.reject(err.name + ': ' + err.message);
            deferred.resolve();
        });

    return deferred.promise;
}

function getAllDataCSV(code) {
    var deferred = Q.defer();
    db.datairrigations.find({code: code}).toArray(function (err, data) {
        if (err) deferred.reject(err.name + ': ' + err.message);
        if (!data.length){
            data.push({
                "code": code
            });
        }
        deferred.resolve(data);
    });
    return deferred.promise;
}

function getAllData(code) {
    var deferred = Q.defer();
    db.datairrigations.find({code: code}).toArray(function (err, data) {
        if (err) deferred.reject(err.name + ': ' + err.message);
        var chartData = [];
        var chartDataEx = [];
        data.forEach(function(element) {
            chartData.push({
                date: element.date,
                ph: element.irr_view_ph,
                ec: element.irr_view_ec,
                waterTemp: element.irr_view_waterTemp,
                OxygenConc: element.irr_view_OxygenConc,
            });
            chartDataEx.push({
                date: element.date,
                nutrition_a_level: element.nutrition_a_level,
                nutrition_b_level: element.nutrition_b_level,
                ph_level: element.ph_level,
                water_tank_level: element.water_tank_level,
            });
        }, this);
        var datas = {
            chartData: chartData,
            chartDataEx: chartDataEx
        }

        deferred.resolve(datas);
    });
    return deferred.promise;
}


function create(irrigation) {
    var deferred = Q.defer();
    db.datairrigations.insert(
        irrigation,
        function (err, doc) {
            if (err) deferred.reject(err.name + ': ' + err.message);
            deferred.resolve();
    });

    return deferred.promise;
}
