import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Message } from '../models/message';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class MessagepostService {

  private url = "https://localhost:7151/api/Message";  // API endpoint'i

  constructor(private http: HttpClient) { }


  postMessage(message: Message): Observable<any> {
    return this.http.post<any>(`${this.url}/sendmessage`, message);
  }
}
