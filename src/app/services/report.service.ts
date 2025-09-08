import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ReportEager } from '../models/reporteager';

@Injectable({
  providedIn: 'root'
})
export class ReportService {

  private url = "https://localhost:7151/api/Report";  // API endpoint'i
      
        constructor(private http: HttpClient) { }
      
        getReport(): Observable<Report[]> {
          return this.http.get<Report[]>(this.url);
        }

         getReportEager(): Observable<ReportEager[]> {
          return this.http.get<ReportEager[]>(`${this.url}/eager`);
        }
      
        postReport(report:Report):Observable<Report>{
          return this.http.post<Report>(this.url,report)
        }
    
        getReportbyId(id: string): Observable<Report> {
          return this.http.get<Report>(`${this.url}/${id}`);
        }  
}
