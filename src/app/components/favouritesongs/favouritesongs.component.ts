import { Component, OnInit } from '@angular/core';
import { FavouritesongsService } from '../../services/favouritesongs.service';
import { SingleSong } from '../../models/singlesong';

@Component({
  selector: 'app-favouritesongs',
  templateUrl: './favouritesongs.component.html',
  styleUrl: './favouritesongs.component.css'
})
export class FavouritesongsComponent implements OnInit {
  
  constructor(private songservice:FavouritesongsService){}

  favouriteSongs: SingleSong[] = []; 

 

  ngOnInit(): void {
    // Kullanıcı ID'sini localStorage'dan al
    const userId = localStorage.getItem('userId');
  
    if (userId) { // Eğer ID varsa
      console.log('Logged User ID: ', userId);
  
      // Favori şarkıları getir
      this.songservice.getUsersFavouriteSongs(userId).subscribe({
        next: (songs) => {
          this.favouriteSongs = songs; 
          console.log('User favourite songs:', songs); 
        },
        error: (err) => {
          console.error('Error fetching favourite songs:', err);
        }
      });
    } else {
      console.error('User ID not found in localStorage');
    }
  }


}
