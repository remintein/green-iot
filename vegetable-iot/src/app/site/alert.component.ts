import { Component, OnInit } from '@angular/core';

import { AlertService } from '../_services/index';

@Component({
    selector: 'alert',
    templateUrl: 'alert.component.html'
})

export class SiteAlertComponent {
    message: any;

    constructor(public alertService: AlertService) { }

    ngOnInit() {
        this.alertService.getMessage().subscribe( (message : any) => { this.message = message; });
    }
}