import { Injectable } from '@angular/core';
import { Http, Headers, RequestOptions, Response } from '@angular/http';

import { AppConfig } from '../app.config';
import { Irrigation } from '../_models/index';

@Injectable()
export class IrrigationService {
    constructor(private http: Http, private config: AppConfig) { }

    getAll(server: string) {
        return this.http.get(this.config.apiUrl + '/irrigations/server_name/' + server, this.jwt()).map((response: Response) => response.json());
    }

    getById(_id: string) {
        return this.http.get(this.config.apiUrl + '/irrigations/current/' + _id, this.jwt()).map((response: Response) => response.json());
    }

    getDataIrrigatioChart(server: string) {
        return this.http.get(this.config.apiUrl + '/irrigations/data_charts/' + server, this.jwt()).map((response: Response) => response.json());
    }

    update(old_server: string, server: any) {
        return this.http.put(this.config.apiUrl + '/irrigations/' + old_server, server, this.jwt()).map((response: Response) => response.json());
    }

    create(server: any) {
        return this.http.post(this.config.apiUrl + '/irrigations/create', server, this.jwt());
    }

    delete(server: string) {
        return this.http.delete(this.config.apiUrl + '/irrigations/' + server, this.jwt());
    }

    // private helper methods

    private jwt() {
        // create authorization header with jwt token
        let currentUser = JSON.parse(localStorage.getItem('currentUser'));
        if (currentUser && currentUser.token) {
            let headers = new Headers({ 'Authorization': 'Bearer ' + currentUser.token });
            return new RequestOptions({ headers: headers });
        }
    }
}