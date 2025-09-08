import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Hospital } from '../models/hospital';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class HospitalService {

   private url = "https://localhost:7151/api/Hospital";  // API endpoint'i
    
      constructor(private http: HttpClient) { }
    
      getHospital(): Observable<Hospital[]> {
        return this.http.get<Hospital[]>(this.url);
      }
    
      postHospital(city:Hospital):Observable<Hospital>{
        return this.http.post<Hospital>(this.url,city)
      }
  
      getHospitalbyId(id: string): Observable<Hospital> {
        return this.http.get<Hospital>(`${this.url}/${id}`);
      }  
}
