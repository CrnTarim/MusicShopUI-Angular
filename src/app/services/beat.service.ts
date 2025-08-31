import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Beat } from '../models/beat';

@Injectable({
  providedIn: 'root'
})
export class BeatService {

  private url="https://localhost:7151/api/Beat"
  
    constructor(private http:HttpClient) { }

    
     getBeats():Observable<Beat[]>{
        return this.http.get<Beat[]>(this.url);
     }
    
    postBeat(beat: Beat): Observable<any> {
      return this.http.post(this.url, beat); // <-- parametreyi gönder
    }

      
    deleteBeatg(id: string): Observable<void> {
        return this.http.delete<void>(`${this.url}/${id}`);
     }
}
