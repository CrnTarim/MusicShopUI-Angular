import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Favouritesongs } from '../models/favouritesongs';
import { SingleSong } from '../models/singlesong';

@Injectable({
  providedIn: 'root'
})
export class FavouritesongsService {

  private url = "https://localhost:7151/api/UserFavouriteSong"; 
  constructor(private http:HttpClient) { }

  getUsersFavouriteSongs(userId: string): Observable<SingleSong[]> {
    return this.http.get<SingleSong[]>(`${this.url}/FavouriteSongs/${userId}`);
  }
  
}
