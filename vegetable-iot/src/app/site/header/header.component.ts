import { Component, OnInit, ElementRef } from '@angular/core';

import { User, Config } from '../../_models/index';
import { UserService, ClimateService } from '../../_services/index';

@Component({
    selector: "app-header",
    templateUrl: 'header.component.html',
    styleUrls: ['./header.component.css'] 
    
})

export class HeaderComponent implements OnInit {
    public servers : any[];
    public username = "";
    constructor(public elementRef:ElementRef, public climateService:ClimateService){}

    ngOnInit() {
        let currentUser = JSON.parse(localStorage.getItem('currentUser'));
        this.username = currentUser.firstName + " " + currentUser.lastName;
        this.climateService.getAllServerName().subscribe((servers) => {
            this.servers = servers;
            Config.num_server = servers.length;
        });
    }

    ngAfterViewInit(){
        var s = document.createElement("script");
        s.type = "text/javascript";
        s.src = "assets/js/custom-scripts.js";
        this.elementRef.nativeElement.appendChild(s);
    }
}