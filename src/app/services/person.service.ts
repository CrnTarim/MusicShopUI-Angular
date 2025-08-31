import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Person } from '../models/person';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PersonService {

    private url = "https://localhost:7151/api/person";  // API endpoint'i
  
    constructor(private http: HttpClient) { }
  
    getPersons(): Observable<Person[]> {
      return this.http.get<Person[]>(this.url);
    }
  
    postPerson(person:Person):Observable<Person>{
      return this.http.post<Person>(this.url,person)
    }

   updatePerson(dto: Person) {
  return this.http.put<Person>(`${this.url}/personupdate`, dto); // PUT api/Person/personupdate
}

    
}
