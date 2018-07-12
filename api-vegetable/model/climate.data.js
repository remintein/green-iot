var config = require('config.json');
var _ = require('lodash');
var Q = require('q');
var mongo = require('mongoskin');
var db = mongo.db(config.connectionString, { native_parser: true });
db.bind('dataclimates');

var data = {};

data.create = create;
data.delete = _delete;
data.getAllData = getAllData;
data.getAllDataCSV = getAllDataCSV;

module.exports = data;

function _delete(server) {
    var deferred = Q.defer();
    db.dataclimates.remove(
        {},
        function (err) {
            if (err) deferred.reject(err.name + ': ' + err.message);
            deferred.resolve();
        });

    return deferred.promise;
}

function getAllDataCSV(code) {
    var deferred = Q.defer();
    db.dataclimates.find({code: code}).toArray(function (err, data) {
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
    db.dataclimates.find({code: code}).toArray(function (err, data) {
        var chartData = [];
        data.forEach(function(element) {
            chartData.push({
                date: new Date(element.date),
                temp: element.cli_view_temp,
                humi: element.cli_view_humi,
                light: element.cli_view_light,
                co2: element.cli_view_co2
            });
        }, this);
        if (err) deferred.reject(err.name + ': ' + err.message);
        deferred.resolve(chartData);
    });
    return deferred.promise;
}


function create(climate) {
    var deferred = Q.defer();
    db.dataclimates.insert(
        climate,
        function (err, doc) {
            if (err) deferred.reject(err.name + ': ' + err.message);
            deferred.resolve();
    });

    return deferred.promise;
}
