import { Routes, RouterModule } from '@angular/router';
import { AuthGuard } from './_guards/index';
import { LoginComponent } from './login/index';
import { NgModule }             from '@angular/core';

import { SelectivePreloadingStrategy } from './selective-preloading-strategy';


export const ROUTES: Routes = [
  {
      path: 'site',
      loadChildren: 'app/site/site.module#SiteModule',
      canLoad: [AuthGuard]
  },
  { path: '',   redirectTo: '/site', pathMatch: 'full' },
  { path: 'login', component: LoginComponent},
  { path: '**', redirectTo: '' }
];

@NgModule({
    imports: [
        RouterModule.forRoot(ROUTES, 
            {useHash: true, preloadingStrategy: SelectivePreloadingStrategy})
    ],
    exports: [RouterModule],
    providers:[
        SelectivePreloadingStrategy
    ]
})

export class AppRoutingModule {}