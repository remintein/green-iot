import { Component } from '@angular/core';
import { Router } from '@angular/router';

import { AlertService, UserService } from '../../_services/index';

@Component({
    templateUrl: 'register.component.html',
    styleUrls: ['./register.component.css']
})

export class RegisterComponent {
    model: any = {};
    loading = false;
    public pattern : any = new RegExp(/^[+a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/i);

    constructor(
        public router: Router,
        public userService: UserService,
        public alertService: AlertService) { }

    register() {
        this.loading = true;
        if (!this.pattern.test(this.model.email)){
            this.alertService.error("Invali Email");
            return;
        }
        this.userService.create(this.model)
            .subscribe(
                data => {
                    this.alertService.success('Registration successful', true);
                    this.loading = false;
                },
                error => {
                    this.alertService.error(error._body);
                    this.loading = false;
                });
    }
}
