import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { User } from '../models/user';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  private url="https://localhost:7151/api/User"
  constructor(private http:HttpClient) { }

  userLogin(user: { username:string,email: string, password: string }): Observable<string> {
    return this.http.post<string>(`${this.url}/login`, user);
  }



}
