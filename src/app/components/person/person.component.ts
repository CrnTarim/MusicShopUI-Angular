import { Component, OnInit, ViewChild } from '@angular/core';
import { Person } from '../../models/person';
import { PersonService } from '../../services/person.service';
import { NgForm } from '@angular/forms';

@Component({
  selector: 'app-person',
  templateUrl: './person.component.html',
  styleUrl: './person.component.css'
})
export class PersonComponent implements OnInit {
  @ViewChild('f') formRef!: NgForm;

  viewModel: Person = new Person();     // formda kullanılan tek konteyner
  personList: Person[] = [];            // grid verisi
  selectedPerson: Person | null = null; // gridde seçilen satır
  hasChanges = false;                   // değişiklik oldu mu?
  isEditingTc = false;

  constructor(private personService: PersonService) {}

  ngOnInit() {
    this.getPersonList();
    console.log(this.personList)
  }

  getPersonList() {
   this.personService.getPersons().subscribe((data: Person[]) => {
    this.personList = data;
    });
    
  }


maskIdentity(tc?: string | null): string {
  if (!tc) return '';
  return '#'.repeat(tc.length); // istersen: return tc.slice(0,2) + '#'.repeat(tc.length-2);
}


  save() {
    if (!this.formRef || this.formRef.invalid || !this.hasChanges) return;

    const payload: Person = { ...this.viewModel };

    const req$ = this.selectedPerson?.id
      ? this.personService.updatePerson(payload)
      : this.personService.postPerson(payload);

    req$.subscribe(_ => {
      this.getPersonList();
      this.hasChanges = false;
      this.formRef.form.markAsPristine();
      if (!this.selectedPerson) this.viewModel = new Person(); // yeni kayıttan sonra temizle
    });
  }

  // grid satırı seçildiğinde (örnek)
select(p: Person) {
  this.selectedPerson = { ...p };
  this.viewModel = { ...p };
  this.isEditingTc = false; // seçim sonrası maskeli göster
}

// yeni kayıt (örnek)
new() {
  this.selectedPerson = null;
  this.viewModel = {} as Person;
  this.isEditingTc = true; // yeni kayıtta TC yazılabilir olsun (istersen false bırak)
}

}