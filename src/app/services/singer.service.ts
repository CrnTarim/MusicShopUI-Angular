import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';  // HttpClient import ediliyor
import { Observable } from 'rxjs';
import { Singer } from '../models/singer';

@Injectable({
  providedIn: 'root'
})
export class SingerService {

  private url = "https://localhost:7151/api/Singer";  // API endpoint'i

  constructor(private http: HttpClient) { }

  getSingers(): Observable<Singer[]> {
    return this.http.get<Singer[]>(this.url);
  }

  postSinger(singer:Singer):Observable<Singer>{
    return this.http.post<Singer>(this.url,singer)
  }

  getSingerbyId(singerId: string): Observable<Singer> {
    return this.http.get<Singer>(`${this.url}/getbyId/${singerId}`);
  }
  
  
}
