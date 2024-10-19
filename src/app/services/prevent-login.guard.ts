import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class PreventLoginGuardService implements CanActivate {
  constructor(private router: Router) {
    
  }
  canActivate(): boolean {
   
    const loggedIn = localStorage.getItem('userId'); 

    if (loggedIn) {
      this.router.navigate(['/']); 
      return false; 
    }
    
    return true; 
  }
}