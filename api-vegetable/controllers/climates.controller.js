var config = require('config.json');
var express = require('express');
var router = express.Router(); 
var mail = require('model/mail');
var fs = require('fs');
var climateServices = require('model/climate.service');
var climateDataServices = require('model/climate.data');
var userServices = require('model/user.service');

// routes
router.get('/server_name/:server', getAll);
router.get('/current/:_id', getCurrent);
router.get('/servers', getAllServerName);
router.get('/push/:_data', update);
router.get('/data_charts/:server', getDataClimateChart);
router.post('/create', addServer);
router.delete('/:server', _delete);
router.put('/:server', updateServer);

module.exports = router;



function getAll(req, res) {
    climateServices.getAll(req.params.server)
        .then(function (climates) {
            res.send(climates);
        })
        .catch(function (err) {
            res.status(400).send(err);
        });
}

function getCurrent(req, res) {
    climateServices.getById(req.params._id)
        .then(function (climate) {
            if (climate) {
                res.send(climate);
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
    if (arr_data.length == 12){
        username = arr_data[arr_data.length-2];
        password = arr_data[arr_data.length-1];
        userServices.checkApi(username, password)
            .then(function(data){
                if (data.state){
                    var climateData = {
                        "server": arr_data[0],
                        "cli_view_temp" : arr_data[1],
                        "cli_view_humi" : arr_data[2],
                        "cli_view_light" : arr_data[3],
                        "cli_view_co2" : arr_data[4],
                        "cli_stt_fan" : getStringValue(arr_data[5]),
                        "cli_stt_cooling" : getStringValue(arr_data[6]),
                        "cli_stt_nozzle" : getStringValue(arr_data[7]),
                        "cli_stt_shadingNet" : getStringValue(arr_data[8]),
                        "cli_stt_ventDoor" : getStringValue(arr_data[9])
                    }
                    var is_error = false;
                    if(arr_data[5]=="error"||arr_data[6]=="error"||arr_data[7]=="error"||arr_data[8]=="error"||arr_data[9]=="error"){
                        var date = new Date();
                        var hours = date.getHours();
                        var minutes = date.getMinutes();
                        var seconds= date.getSeconds();
                        var ahtml = fs.readFileSync('model/climate_error.html').toString();
                        if(arr_data[5]=="error"){
                            ahtml = ahtml.replace(new RegExp('\{\{cli_stt_fan\}\}'),'ERROR');
                            is_error = true
                        }
                        else 
                            ahtml = ahtml.replace(new RegExp('\{\{cli_stt_fan\}\}'),'OK');

                        if(arr_data[6]=="error"){
                            ahtml = ahtml.replace(new RegExp('\{\{cli_stt_cooling\}\}'),'ERROR');
                            is_error = true
                        }
                        else
                            ahtml = ahtml.replace(new RegExp('\{\{cli_stt_cooling\}\}'),'OK');

                        if(arr_data[7]=="error"){
                            ahtml = ahtml.replace(new RegExp('\{\{cli_stt_nozzle\}\}'),'ERROR');
                            is_error = true
                        }
                        else 
                            ahtml = ahtml.replace(new RegExp('\{\{cli_stt_nozzle\}\}'),'OK');

                        if(arr_data[8]=="error"){
                            ahtml = ahtml.replace(new RegExp('\{\{cli_stt_shadingNet\}\}'),'ERROR');
                            is_error = true
                        }
                        else 
                            ahtml = ahtml.replace(new RegExp('\{\{cli_stt_shadingNet\}\}'),'OK');
                        
                        if(arr_data[9]=="error"){
                            ahtml = ahtml.replace(new RegExp('\{\{cli_stt_ventDoor\}\}'),'ERROR');
                            is_error = true
                        }
                        else 
                            ahtml = ahtml.replace(new RegExp('\{\{cli_stt_ventDoor\}\}'),'OK');
                        ahtml = ahtml.replace(new RegExp('\{\{code\}\}'),arr_data[0].toUpperCase());
                    }
                    climateServices.update(climateData)
                        .then(function (data) {
                            if (is_error){
                                
                                climateDataServices.getAllDataCSV(climateData.server).then(function(climates){
                                    var json2csv = require('json2csv');
                                    var fields = ['code', 'cli_view_temp', 'cli_view_humi','cli_view_light', 'cli_view_co2', 'cli_stt_fan','cli_stt_cooling', 'cli_stt_nozzle', 'cli_stt_shadingNet','cli_stt_ventDoor', 'date'];
                                    var fieldName = ['Code', 'Environment Temperature', 'Environment Huminity','Light Intensity', 'CO2 Injection', 'FAN','Cooling Pump', 'Nozzle Pump', 'Shading Net System','Ventilation Door', 'Date created'];
                                    var data_csv = json2csv({ data: climates, fields: fields, fieldNames: fieldName });

                                    ahtml = ahtml.replace(new RegExp('\{\{server\}\}'), data);
                                    var maildata = {
                                    from: '"SMARTGREEN IOT CONTROL SYSTEM"', // sender address
                                    subject: 'SYSTEM HAVE ERRORS IN CLIMATE ON '+arr_data[0].toUpperCase(), // Subject line
                                    html: ahtml, // plain text body
                                    attachments: [
                                        {   // utf-8 string as an attachment
                                            filename: 'climate.csv',
                                            content: data_csv
                                        },
                                    ]};
    
                                    mail.send(maildata)
                                    .then(function () {
                                    })
                                    .catch(function (err) {
                                    });
                                }).catch(function(err){
                                });
                                

                            }
                            res.sendStatus(200);
                        })
                        .catch(function (err) {
                            res.status(400).send(err);
                        }
                    );
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

function getAllServerName(req, res){
    climateServices.getAllServerName()
        .then(function(climates){
            res.send(climates)
        })
        .catch(function(err){
            res.status(400).send(err);
        });
}

function getDataClimateChart(req, res){
    climateDataServices.getAllData(req.params.server)
        .then(function(datas){
            res.send(datas)
        })
        .catch(function(err){
            res.status(400).send(err);
        });
}

function addServer(req, res) {
    climateServices.create(req.body)
        .then(function () {
            res.sendStatus(200);
        })
        .catch(function (err) {
            res.status(400).send(err);
        });
}

function _delete(req, res) {
    climateServices.delete(req.params.server)
        .then(function () {
            res.sendStatus(200);
        })
        .catch(function (err) {
            res.status(400).send(err);
        });
}

function updateServer(req, res) {
    climateServices.updateServer(req.params.server, req.body)
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