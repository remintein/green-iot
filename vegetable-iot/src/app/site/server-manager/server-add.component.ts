import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { Config } from '../../_models/index';
import { AlertService, ClimateService, IrrigationService } from '../../_services/index';

@Component({
    templateUrl: 'server-add.component.html',
    styleUrls: ['./server-add.component.css']
})

export class ServerAddComponent {
    model: any = {};
    loading = false;

    constructor(
        public router: Router,
        public climateService: ClimateService,
        public irrigationService : IrrigationService,
        public alertService: AlertService) { }

    addNew() {
        this.loading = true;
        this.model.code = Config.num_server + 1;
        this.climateService.create(this.model)
            .subscribe(
                data => {
                    this.irrigationService.create(this.model)
                        .subscribe(
                            data => {
                                this.alertService.success('Create servers successful', true);
                                this.loading = false;
                                setTimeout(function(){ 
                                    window.location.href = "/";
                                }, 3000);
                            },
                            error => {
                                this.alertService.error(error._body);
                                this.loading = false;
                            }
                        );
                },
                error => {
                    this.alertService.error(error._body);
                    this.loading = false;
                }
            );
    }
}
