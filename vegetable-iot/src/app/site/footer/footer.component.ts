import { Component, OnInit } from '@angular/core';

import { User } from '../../_models/index';
import { UserService } from '../../_services/index';

@Component({
    selector: "app-footer",
    templateUrl: 'footer.component.html',
    styleUrls: ['./footer.component.css'] 
})

export class FooterComponent implements OnInit {
    ngOnInit() {
        
    }
}