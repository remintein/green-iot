import { Component, OnInit }    from '@angular/core';
import { UserService, AlertService } from '../../_services/index';
import { ActivatedRoute } from '@angular/router';

@Component({
  templateUrl: 'user-edit.component.html'
})
export class UserEditComponent {
    public model: any = {};
    public loading: any;
    public pattern : any = new RegExp(/^[+a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/i);
    constructor(public userService : UserService, public alertService : AlertService, public route: ActivatedRoute){}

    ngOnInit(){
        this.route.params.subscribe(params => {
            this.userService.getById(params['id'])
                .subscribe(user => {
                    this.model = user;
            });
        })  
    }

    updateUser(){ 
        this.loading = false;
        var old_model = this.model;
        if (this.model.is_email)
            this.model.is_email = 1;
        else this.model.is_email = 0;
        if (!this.pattern.test(this.model.email)){
            this.alertService.error("Invali Email");
            return;
        }
        this.userService.update(this.model).subscribe(data=>{
            this.loading = false;
            this.model = old_model;
            this.alertService.success("Update user success!!");
            var users = JSON.parse(localStorage.getItem('currentUser'));
            if (users.username == this.model.username){
                setTimeout(function(){ 
                    window.location.href = "/#/login";
                }, 3000);
            }
        });
    }
}
