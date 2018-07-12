var config = require('config.json');
var express = require('express');
var router = express.Router();
var mail = require('model/mail');
var fs = require('fs');
var irrigationServices = require('model/irrigation.service');
var irrigationDataServices = require('model/irrigation.data');
var userServices = require('model/user.service');

// routes
router.get('/server_name/:server', getAll);
router.get('/current/:_id', getCurrent);
router.get('/push/:_data', update);
router.get('/data_charts/:server', getDataIrrigationChart);
router.post('/create', addServer);
router.delete('/:server', _delete);
router.put('/:server', updateServer);

module.exports = router;



function getAll(req, res) {
    irrigationServices.getAll(req.params.server)
        .then(function (irrigations) {
            res.send(irrigations);
        })
        .catch(function (err) {
            res.status(400).send(err);
        });
}

function getCurrent(req, res) {
    irrigationServices.getById(req.params._id)
        .then(function (irrigation) {
            if (irrigation) {
                res.send(irrigation);
            } else {
                res.sendStatus(404);
            }
        })
        .catch(function (err) {
            res.status(400).send(err);
        });
}

function update(req, res) {
    var data = req.params._data;
    var arr_data = data.split("-");
    
    var username = '', password = '';
    if (arr_data.length == 13){
        username = arr_data[arr_data.length-2];
        password = arr_data[arr_data.length-1];
        userServices.checkApi(username, password)
            .then(function(data){
                if (data.state){
                    var irrigationData = {
                        "server": arr_data[0],
                        "irr_view_ph" : arr_data[1],
                        "irr_view_ec" : arr_data[2],
                        "irr_view_waterTemp" : arr_data[3],
                        "irr_view_OxygenConc" : arr_data[4],
                        "nutrition_a_level" : arr_data[5],
                        "nutrition_b_level" : arr_data[6],
                        "ph_level" : arr_data[7],
                        "water_tank_level" : arr_data[8],
                        "irr_stt_nutrition" : getStringValue(arr_data[9]),
                        "irr_stt_cliller" : getStringValue(arr_data[10]),
                    }
                    var is_error = false;
                    if(arr_data[9]=="error" || arr_data[10]=="error"){
                        var date = new Date();
                        var hours = date.getHours();
                        var minutes = date.getMinutes();
                        var seconds= date.getSeconds();
                        var ahtml = fs.readFileSync('model/irrigation_error.html').toString();
                        if(arr_data[9]=="error"){
                            ahtml = ahtml.replace(new RegExp('\{\{irr_stt_nutrition\}\}'),'ERROR');
                            is_error = true;
                        }
                        else 
                            ahtml = ahtml.replace(new RegExp('\{\{irr_stt_nutrition\}\}'),'OK');

                        if(arr_data[10]=="error"){
                            ahtml = ahtml.replace(new RegExp('\{\{irr_stt_cliller\}\}'),'ERROR');
                            is_error = true;
                        }
                        else 
                            ahtml = ahtml.replace(new RegExp('\{\{irr_stt_cliller\}\}'),'OK');
                        
                        ahtml = ahtml.replace(new RegExp('\{\{code\}\}'),arr_data[0].toUpperCase());
                    }
                    irrigationServices.update(irrigationData)
                        .then(function (data) {
                            if (is_error){

                                irrigationDataServices.getAllDataCSV(irrigationData.server).then(function(irrigations){
                                    var json2csv = require('json2csv');
                                    var fields = ['code', 'irr_view_ph', 'irr_view_ec','irr_view_waterTemp', 'irr_view_OxygenConc', 'nutrition_a_level','nutrition_b_level', 'ph_level', 'water_tank_level','irr_stt_nutrition', 'irr_stt_cliller', 'date'];
                                    var fieldName = ['Code', 'PH', 'EC','Water Temperature', 'Oxygen Concentration In Water', 'Nutrition A Level','Nutrition B Level', 'PH Level', 'Water Tank Level','Nutrition Pump', 'Chiller Pump', 'Date created'];
                                    var data_csv = json2csv({ data: irrigations, fields: fields, fieldNames: fieldName });

                                    ahtml = ahtml.replace(new RegExp('\{\{server\}\}'), data);
                                    var maildata = {
                                    from: '"SMARTGREEN IOT CONTROL SYSTEM"', // sender address
                                    subject: 'SYSTEM HAVE ERRORS IN IRRIGATION ON '+arr_data[0].toUpperCase(), // Subject line
                                    html: ahtml, // plain text body
                                    attachments: [
                                        {   // utf-8 string as an attachment
                                            filename: 'irrigation.csv',
                                            content: data_csv
                                        },
                                    ]};
                                    mail.send(maildata)
                                    .then(function () {
                                    })
                                    .catch(function (err) {
                                    });
                                    
                                }).catch(function(){
                                });

                            }
                            res.sendStatus(200);
                        })
                        .catch(function (err) {
                            res.status(400).send(err);
                        });
                } else{
                    res.status(400).send("Authentication fail.");
                }
            })
            .catch(function(err){
                res.status(400).send(err);
            }
        );
    }
    else {
        res.status(400).send("Miss account.");
    }
}

function getDataIrrigationChart(req, res){
    irrigationDataServices.getAllData(req.params.server)
        .then(function(datas){
            res.send(datas)
        })
        .catch(function(err){
            res.status(400).send(err);
        });
}

function addServer(req, res) {
    irrigationServices.create(req.body)
        .then(function () {
            res.sendStatus(200);
        })
        .catch(function (err) {
            res.status(400).send(err);
        });
}

function _delete(req, res) {
    irrigationServices.delete(req.params.server)
        .then(function () {
            res.sendStatus(200);
        })
        .catch(function (err) {
            res.status(400).send(err);
        });
}

function updateServer(req, res) {
    irrigationServices.updateServer(req.params.server, req.body)
        .then(function (data) {
            res.send(data);
        })
        .catch(function (err) {
            res.status(400).send(err);
        });
}

function getStringValue(value){
    return value.toUpperCase();
}