import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { City } from '../models/city';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class CityService {

    private url = "https://localhost:7151/api/City";  // API endpoint'i
  
    constructor(private http: HttpClient) { }
  
    getCity(): Observable<City[]> {
      return this.http.get<City[]>(this.url);
    }
  
    postCity(city:City):Observable<City>{
      return this.http.post<City>(this.url,city)
    }

    getCitybyId(id: string): Observable<City> {
      return this.http.get<City>(`${this.url}/${id}`);
    }  
    
}
