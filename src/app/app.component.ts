import { Component } from '@angular/core';
import { SingleSong } from './models/singlesong';
import { Store } from '@ngrx/store';
import { selectActiveSingleSong } from './state/song/song.selector';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'mushicshopUI';

  activeSingleSong$: Observable<SingleSong | null>; // Observable olarak tanımlandı

  constructor(private store: Store) {
    this.activeSingleSong$ = this.store.select(selectActiveSingleSong); // Store'dan alındı
  }
  ngOnInit(): void {
    this.activeSingleSong$ = this.store.select(selectActiveSingleSong);
  }
}
