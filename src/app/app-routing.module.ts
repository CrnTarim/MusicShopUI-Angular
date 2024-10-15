import { NgModule, Component } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SingerComponent } from './components/singer/singer.component';
import { SingerProfileComponent } from './components/singer-profile/singer-profile.component';

const routes: Routes = [
  {path:'singer-list',component:SingerComponent},
  {path:'singer-profile/:id',component:SingerProfileComponent}
  
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
