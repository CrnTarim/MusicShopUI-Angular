import { NgModule, Component } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';

import { UserComponent } from './components/user/user.component';
import { AuthGuard } from './services/auth.guard';
import { PreventLoginGuardService } from './services/prevent-login.guard';
import { MessageComponent } from './components/message/message.component';
import { PersonComponent } from './components/person/person.component';

import { ReportComponent } from './components/report/report.component';
import { ReportgridComponent } from './components/reportgrid/reportgrid.component';
import { LinechartComponent } from './components/linechart/linechart.component';

const routes: Routes = [


  {
    path: 'login',
    component: LoginComponent,
    canActivate: [PreventLoginGuardService],
  },

  {path:'user-profile/:id', component: UserComponent, canActivate: [AuthGuard]},
  {path:'message', component: MessageComponent, canActivate: [AuthGuard] },

  {path:'person',component:PersonComponent},
 
  {path:'report',component:ReportComponent},
  {path:'reportgrid',component:ReportgridComponent},
  {path:'statistic',component:LinechartComponent}
  
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
