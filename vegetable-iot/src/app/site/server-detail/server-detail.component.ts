import { Component, OnInit, ElementRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Climate, Irrigation } from '../../_models/index';

import * as io from 'socket.io-client';

import { AlertService, ClimateService, IrrigationService } from '../../_services/index';

declare var AmCharts:any;
@Component({
    templateUrl: 'server-detail.component.html',
    styleUrls: ['./server-detail.component.css'],
    
})

export class ServerDetailComponent implements OnInit {
    // public url = 'http://localhost:4000';
    public url = 'https://api-vegetable.herokuapp.com';
    public socket : any;
    public arrClimate : Climate;
    public arrIrrigation : Irrigation;
    public arrClimateLog : any;
    public arrIrrigationLog : any;
    public server : any;
    public chartDataClimate : any = {};
    public chartDataIrrigation : any = {};
    public chartDataIrrigationEx : any = {};
    public chartClimate : any;
    public chartIrrigation : any;
    public chartIrrigationEx : any;

    constructor(
        public elementRef:ElementRef,
        public router: Router,
        public alertService: AlertService,
        public climateService: ClimateService,
        public irrigationService: IrrigationService,
        public route: ActivatedRoute) { }

    ngOnInit() {
        this.route.params.subscribe(params => {
            var server = params['server'];
            this.server = server;
            //get data climate
            this.climateService.getAll(server).subscribe(data =>{
                this.arrClimate = data.climates[0];
                this.arrClimateLog = data.climatesLog[0];
            });

            //get data irrigation
            this.irrigationService.getAll(server).subscribe(data =>{
                this.arrIrrigation = data.irrigations[0];
                this.arrIrrigationLog = data.irrigationsLog[0];
            });

            this.climateService.getDataClimateChart(this.server).subscribe(data_chart=>{
                this.chartDataClimate = data_chart;
                this.buildChartClimate();
            });

            this.irrigationService.getDataIrrigatioChart(this.server).subscribe(data_chart=>{
                this.chartDataIrrigation = data_chart.chartData;
                this.chartDataIrrigationEx = data_chart.chartDataEx;
                this.buildChartIrrigation();
                this.buildChartIrrigationEx();
            });
        })

        this.socket = io.connect(this.url);
        this.socket.on('climate_update', (data:any) => {
            if (this.arrClimate.code === data.code){
                this.arrClimate = data;
                this.chartDataClimate.push({
                    "date": new Date(),
                    "temp": data.cli_view_temp,
                    "humi": data.cli_view_humi,
                    "light": data.cli_view_light,
                    "co2": data.cli_view_co2
                })
                this.buildChartClimate();
            }
        });
        this.socket.on('climate_update_log', (data:any) => {
            if (this.arrClimate.code === data.server){
                this.arrClimateLog = data;
            }
        });

        this.socket.on('irrigation_update', (data:any) => {
            if (this.arrIrrigation.server === data.server){
                this.arrIrrigation = data;
                this.chartDataIrrigation.push({
                    "date": new Date(),
                    "ph": data.irr_view_ph,
                    "ec": data.irr_view_ec,
                    "waterTemp": data.irr_view_waterTemp,
                    "OxygenConc": data.irr_view_OxygenConc,
                });
                this.chartDataIrrigationEx.push({
                    "date": new Date(),
                    "nutrition_a_level": data.nutrition_a_level,
                    "nutrition_b_level": data.nutrition_b_level,
                    "ph_level": data.ph_level,
                    "water_tank_level": data.water_tank_level,
                });
                this.buildChartIrrigation();
                this.buildChartIrrigationEx();
            }
        });
        this.socket.on('irrigation_update_log', (data:any) => {
            if (this.arrIrrigation.code === data.server){
                this.arrIrrigationLog = data;
               
            }
        });
    }

    convertDate(date:any) : string{
        return new Date(date).toLocaleString();
    }

    buildChartClimate(){
        this.chartClimate = AmCharts.makeChart("chartdivClimate", {
            "type": "serial",
            "theme": "light",
            "legend": {
                "useGraphSettings": true
            },
            "dataProvider": this.chartDataClimate,
            "synchronizeGrid":true,
            "valueAxes": [{
                "id":"v1",
                "axisColor": "#FF6600",
                "axisThickness": 2,
                "axisAlpha": 1,
                "position": "left"
            }, {
                "id":"v2",
                "axisColor": "#FCD202",
                "axisThickness": 2,
                "axisAlpha": 1,
                "position": "right"
            }, {
                "id":"v3",
                "axisColor": "#B0DE09",
                "axisThickness": 2,
                "gridAlpha": 0,
                "offset": 50,
                "axisAlpha": 1,
                "position": "left"
            },
            {
                "id":"v4",
                "axisColor": "#33CC33",
                "axisThickness": 2,
                "gridAlpha": 0,
                "offset": 50,
                "axisAlpha": 1,
                "position": "right"
            }],
            "graphs": [{
                "valueAxis": "v1",
                "lineColor": "#FF6600",
                "bullet": "round",
                "bulletBorderThickness": 1,
                "hideBulletsCount": 30,
                "title": "Temperature: (℃)",
                "valueField": "temp",
                "fillAlphas": 0
            }, {
                "valueAxis": "v2",
                "lineColor": "#FCD202",
                "bullet": "square",
                "bulletBorderThickness": 1,
                "hideBulletsCount": 30,
                "title": "Huminity (%): ",
                "valueField": "humi",
                "fillAlphas": 0
            }, {
                "valueAxis": "v3",
                "lineColor": "#B0DE09",
                "bullet": "triangleUp",
                "bulletBorderThickness": 1,
                "hideBulletsCount": 30,
                "title": "Light Intensity (Cd): ",
                "valueField": "light",
                "fillAlphas": 0
            }, {
                "valueAxis": "v4",
                "lineColor": "#33CC33",
                "bullet": "square",
                "bulletBorderThickness": 1,
                "hideBulletsCount": 30,
                "title": "CO2 Injection: (ppm)",
                "valueField": "co2",
                "fillAlphas": 0
            }],
            "chartScrollbar": {},
            "chartCursor": {
                "categoryBalloonDateFormat": "MMM DD JJ:NN:SS",
                "cursorPosition": "mouse",
                "showNextAvailable": true
            },
            "categoryField": "date",
            "categoryAxis": {
                "parseDates": true,
                "axisColor": "#DADADA",
                "minorGridEnabled": true,
                "minPeriod": "ss",
            }
        });

        this.chartClimate.addListener("dataUpdated", this.zoomChartClimate);
        this.zoomChartClimate();
    }
    zoomChartClimate(){
        //this.chart.zoomToIndexes(this.chart.dataProvider.length - 20, this.chart.dataProvider.length - 1);
    }

    buildChartIrrigation(){
        this.chartIrrigation = AmCharts.makeChart("chartdivIrrigation", {
            "type": "serial",
            "theme": "light",
            "legend": {
                "useGraphSettings": true
            },
            "dataProvider": this.chartDataIrrigation,
            "synchronizeGrid":true,
            "valueAxes": [{
                "id":"v1",
                "axisColor": "#FF6600",
                "axisThickness": 2,
                "axisAlpha": 1,
                "position": "left"
            }, {
                "id":"v2",
                "axisColor": "#FCD202",
                "axisThickness": 2,
                "axisAlpha": 1,
                "position": "right"
            }, {
                "id":"v3",
                "axisColor": "#B0DE09",
                "axisThickness": 2,
                "gridAlpha": 0,
                "offset": 50,
                "axisAlpha": 1,
                "position": "left"
            },
            {
                "id":"v4",
                "axisColor": "#33CC33",
                "axisThickness": 2,
                "gridAlpha": 0,
                "offset": 50,
                "axisAlpha": 1,
                "position": "right"
            }],
            "graphs": [{
                "valueAxis": "v1",
                "lineColor": "#FF6600",
                "bullet": "round",
                "bulletBorderThickness": 1,
                "hideBulletsCount": 30,
                "title": "PH: ",
                "valueField": "ph",
                "fillAlphas": 0
            }, {
                "valueAxis": "v2",
                "lineColor": "#FCD202",
                "bullet": "square",
                "bulletBorderThickness": 1,
                "hideBulletsCount": 30,
                "title": "EC : ",
                "valueField": "ec",
                "fillAlphas": 0
            }, {
                "valueAxis": "v3",
                "lineColor": "#B0DE09",
                "bullet": "triangleUp",
                "bulletBorderThickness": 1,
                "hideBulletsCount": 30,
                "title": "Water Temperature (℃): ",
                "valueField": "waterTemp",
                "fillAlphas": 0
            }, {
                "valueAxis": "v4",
                "lineColor": "#33CC33",
                "bullet": "square",
                "bulletBorderThickness": 1,
                "hideBulletsCount": 30,
                "title": "Oxygen Concentration: (ppm)",
                "valueField": "OxygenConc",
                "fillAlphas": 0
            }],
            "chartScrollbar": {},
            "chartCursor": {
                "categoryBalloonDateFormat": "MMM DD JJ:NN:SS",
                "cursorPosition": "mouse",
                "showNextAvailable": true
            },
            "categoryField": "date",
            "categoryAxis": {
                "parseDates": true,
                "axisColor": "#DADADA",
                "minorGridEnabled": true,
                "minPeriod": "ss",
            }
        });

        this.chartIrrigation.addListener("dataUpdated", this.zoomChartIrrigation);
        this.zoomChartIrrigation();
    }

    zoomChartIrrigation(){
    }

    buildChartIrrigationEx(){
        this.chartIrrigationEx = AmCharts.makeChart("chartdivIrrigationEx", {
            "type": "serial",
            "theme": "light",
            "legend": {
                "useGraphSettings": true
            },
            "dataProvider": this.chartDataIrrigationEx,
            "synchronizeGrid":true,
            "valueAxes": [{
                "id":"v1",
                "axisColor": "#FF6600",
                "axisThickness": 2,
                "axisAlpha": 1,
                "position": "left"
            }, {
                "id":"v2",
                "axisColor": "#FCD202",
                "axisThickness": 2,
                "axisAlpha": 1,
                "position": "right"
            }, {
                "id":"v3",
                "axisColor": "#B0DE09",
                "axisThickness": 2,
                "gridAlpha": 0,
                "offset": 50,
                "axisAlpha": 1,
                "position": "left"
            },
            {
                "id":"v4",
                "axisColor": "#33CC33",
                "axisThickness": 2,
                "gridAlpha": 0,
                "offset": 50,
                "axisAlpha": 1,
                "position": "right"
            }],
            "graphs": [{
                "valueAxis": "v1",
                "lineColor": "#FF6600",
                "bullet": "round",
                "bulletBorderThickness": 1,
                "hideBulletsCount": 30,
                "title": "Nutrition A Level: ",
                "valueField": "nutrition_a_level",
                "fillAlphas": 0
            }, {
                "valueAxis": "v2",
                "lineColor": "#FCD202",
                "bullet": "square",
                "bulletBorderThickness": 1,
                "hideBulletsCount": 30,
                "title": "Nutrition B Level: ",
                "valueField": "nutrition_b_level",
                "fillAlphas": 0
            }, {
                "valueAxis": "v3",
                "lineColor": "#B0DE09",
                "bullet": "triangleUp",
                "bulletBorderThickness": 1,
                "hideBulletsCount": 30,
                "title": "PH Level: ",
                "valueField": "ph_level",
                "fillAlphas": 0
            }, {
                "valueAxis": "v4",
                "lineColor": "#33CC33",
                "bullet": "square",
                "bulletBorderThickness": 1,
                "hideBulletsCount": 30,
                "title": "Water Tank Level: ",
                "valueField": "water_tank_level",
                "fillAlphas": 0
            }],
            "chartScrollbar": {},
            "chartCursor": {
                "categoryBalloonDateFormat": "MMM DD JJ:NN:SS",
                "cursorPosition": "mouse",
                "showNextAvailable": true
            },
            "categoryField": "date",
            "categoryAxis": {
                "parseDates": true,
                "axisColor": "#DADADA",
                "minorGridEnabled": true,
                "minPeriod": "ss",
            }
        });

        this.chartIrrigation.addListener("dataUpdated", this.zoomChartIrrigation);
        this.zoomChartIrrigationEx();
    }

    zoomChartIrrigationEx(){
    }

    ngAfterViewInit(){
        
    }

    generateChartData() {
        var chartData = [];
        var firstDate = new Date();
        firstDate.setDate(firstDate.getDate() - 100);

        for (var i = 0; i < 100; i++) {
            // we create date objects here. In your data, you can have date strings
            // and then set format of your dates using chart.dataDateFormat property,
            // however when possible, use date objects, as this will speed up chart rendering.
            var newDate = new Date(firstDate);
            newDate.setDate(newDate.getDate() + i);

            var visits = Math.round(Math.sin(i * 5) * i);
            var hits = Math.round(Math.random() * 80) + 500 + i * 3;
            var views = Math.round(Math.random() * 6000) + i * 4;
            var test = Math.round(Math.random() * 200) + i * 2;

            chartData.push({
                date: newDate,
                visits: visits,
                hits: hits,
                views: views,
                test: test
            });
        }
        return chartData;
    }


}
