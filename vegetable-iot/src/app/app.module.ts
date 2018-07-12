import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';
import { AppRoutingModule } from './app.routes';
import { AppConfig } from './app.config';
import { AuthGuard } from './_guards/index';
import { AlertService, AuthenticationService, UserService } from './_services/index';

import { AppComponent } from './app.component';

import { ROUTES } from './app.routes';
import { LoginComponent } from './login/login.component';
import { AlertComponent } from './_directives/index';



@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    AlertComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    HttpModule,
    AppRoutingModule
  ],
  providers: [
    AppConfig,
    AuthGuard,
    AuthenticationService,
    UserService,
    AlertService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
