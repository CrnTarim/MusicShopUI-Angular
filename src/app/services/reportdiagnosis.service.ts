import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ReportDiagnosis } from '../models/reportdiagnosis';
import { ReportDiagnosisEager } from '../models/reportdiagnosiseager';

@Injectable({
  providedIn: 'root'
})
export class ReportdiagnosisService {

  private url = "https://localhost:7151/api/Report";  // API endpoint'i
        
          constructor(private http: HttpClient) { }
        
          getReport(): Observable<Report[]> {
            return this.http.get<Report[]>(this.url);
          }
  
          getReportEager(): Observable<ReportDiagnosisEager[]> {
            return this.http.get<ReportDiagnosisEager[]>(`${this.url}/eager`);
          }
        
          postReport(report:ReportDiagnosis):Observable<ReportDiagnosis>{
            return this.http.post<ReportDiagnosis>(this.url,report)
          }
      
          getReportbyId(id: string): Observable<Report> {
            return this.http.get<Report>(`${this.url}/${id}`);
          }  
}
