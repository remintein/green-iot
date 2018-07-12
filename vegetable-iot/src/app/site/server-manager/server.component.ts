import { Component, OnInit }    from '@angular/core';
import { ClimateService, IrrigationService, AlertService } from '../../_services/index';

declare var $ : any;
@Component({
  templateUrl: 'server.component.html',
  styleUrls: ['./server.component.css']
})
export class ServerComponent {

  public allServer : any[];
  constructor(public climateService : ClimateService, public irrigationService : IrrigationService,  public alertService : AlertService){}

  ngOnInit(){
      this.climateService.getAllServerName().subscribe( server => {
        this.allServer = server;
      });
  }
  
  deleteServer(server : any){
    if (confirm("Are you sure??")){
      this.climateService.delete(server).subscribe( (data) => {
        this.irrigationService.delete(server).subscribe( (data) => {
          for (var i = 0; i < this.allServer.length;i++){
              if (this.allServer[i].code == server){
                this.allServer.splice(i,1);
                setTimeout(function(){ 
                   window.location.href = "/";
                }, 3000);
              }
          }
        })
      })
    }
    
  }
}
