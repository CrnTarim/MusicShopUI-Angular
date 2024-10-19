import { Component } from '@angular/core';
import { SingleSong } from './models/singlesong';
import { Store } from '@ngrx/store';
import { selectActiveSingleSong } from './state/song/song.selector';
import { Observable } from 'rxjs';
import { Router } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'mushicshopUI';

  activeSingleSong$: Observable<SingleSong | null>; 
  isUserLoggedIn: boolean = false;

  constructor(private store: Store,private router: Router) {
    
    this.activeSingleSong$ = this.store.select(selectActiveSingleSong); 
  }
  ngOnInit(): void {
     
    const userId = localStorage.getItem('userId');
    this.isUserLoggedIn = !!userId; 
    this.activeSingleSong$ = this.store.select(selectActiveSingleSong);
  }

  goToProfile() {
    const userId = localStorage.getItem('userId');
    console.log('User ID from localStorage:', userId); 
    
    if (userId) {
      this.router.navigate(['/user-profile', userId]);
    } else {
      this.router.navigate(['/login']);
    }
  }
  
  
  
  
}
