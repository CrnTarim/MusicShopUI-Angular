import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { SingleSong } from '../models/singlesong';

@Injectable({
  providedIn: 'root'
})
export class SinglesongService {

  private url="https://localhost:7151/api/SingleSong"

  constructor(private http:HttpClient) { }

  getSingles():Observable<SingleSong[]>{
    return this.http.get<SingleSong[]>(this.url);
  }

  getSinglebySingerId(singerId: string): Observable<SingleSong[]> {
    return this.http.get<SingleSong[]>(`${this.url}/singer/${singerId}/singles`);
  }
}
