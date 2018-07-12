import { Component, OnInit }    from '@angular/core';
import { ClimateService, IrrigationService, AlertService } from '../../_services/index';
import { ActivatedRoute } from '@angular/router';

@Component({
  templateUrl: 'server-edit.component.html'
})
export class ServerEditComponent {
    public model: any = {};
    public old_server : string;
    public loading : any;
    constructor(
        public climateService : ClimateService,  
        public irrigationService : IrrigationService,
        public alertService : AlertService, 
        public route: ActivatedRoute
    ){}

    ngOnInit(){
        this.route.params.subscribe(params => {
            this.climateService.getById(params['id'])
                .subscribe(data => {
                    this.model = data;
                    this.old_server = data.server;
            });
        })  
    }

    updateServer(){ 
        if (this.old_server === this.model.server)
            this.alertService.error("Server enter same name");
        else {
            this.climateService.update(this.old_server, this.model).subscribe(doc1=>{
                this.irrigationService.update(this.old_server, this.model).subscribe(doc2=>{
                    if (!doc2.err){
                        this.alertService.success("Update user success!!");
                        setTimeout(function(){ 
                            window.location.href = "/";
                        }, 3000);
                    }
                    else
                        this.alertService.error(doc2.mess);
                    
                });
            });
        }
    }
}
