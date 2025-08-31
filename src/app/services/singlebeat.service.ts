import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { SingleBeat } from '../models/singlebeat';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SinglebeatService {

  private url="https://localhost:7151/api/SingleBeat"
  
    constructor(private http:HttpClient) { }
  
    getSingleBeats():Observable<SingleBeat[]>{
      return this.http.get<SingleBeat[]>(this.url);
    }
  

  
    postSingleBeat(singlesong:SingleBeat):Observable<any>{
      return this.http.post(this.url,singlesong)
    }
  
}
