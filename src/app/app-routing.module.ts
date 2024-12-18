import { NgModule, Component } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SingerComponent } from './components/singer/singer.component';
import { SingerProfileComponent } from './components/singer-profile/singer-profile.component';
import { LoginComponent } from './components/login/login.component';
import { FavouritesongsComponent } from './components/favouritesongs/favouritesongs.component';
import { UserComponent } from './components/user/user.component';
import { AuthGuard } from './services/auth.guard';
import { PreventLoginGuardService } from './services/prevent-login.guard';
import { MessageComponent } from './components/message/message.component';

const routes: Routes = [
  {path:'singer-list',component:SingerComponent},
  {path:'singer-profile/:id',component:SingerProfileComponent},
  {
    path: 'login',
    component: LoginComponent,
    canActivate: [PreventLoginGuardService],
  },
  {path:'favourite-songs',component:FavouritesongsComponent},
  {path:'user-profile/:id', component: UserComponent, canActivate: [AuthGuard]},
  { path: 'message', component: MessageComponent, canActivate: [AuthGuard] },
  {path:'favsong',component:FavouritesongsComponent},
  

  
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
