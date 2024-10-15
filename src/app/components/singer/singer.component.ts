import { Component, OnInit } from '@angular/core';
import { Singer } from '../../models/singer';
import { SingerService } from '../../services/singer.service';

@Component({
  selector: 'app-singer',
  templateUrl: './singer.component.html',
  styleUrl: './singer.component.css'
})
export class SingerComponent implements OnInit {

  //change test main

  singers: Singer[] = [];  
  selectedSingerId: string | null = null; 
  searchTerm: string = ''; // Arama terimi için değişken
  

  constructor(private singerService: SingerService) { }

  ngOnInit(): void {
    this.getSingers();
  }

  getSingers(): void {
    this.singerService.getSingers().subscribe((data: Singer[]) => {
      this.singers = data;
    }, error => {
      console.error('Şarkıcıları alırken bir hata oluştu:', error);
    });
  }

  toggleCard(id: string): void {
    this.selectedSingerId = this.selectedSingerId === id ? null : id;
  }

}

/*
Seçili Şarkıcıyı Gizleme Durumu:

selectedSingerId değeri "123" ve id değeri de "123" ise:
Koşul: true (eşitler)
Sonuç: null (şarkıcıyı gizle)
Yeni Bir Şarkıcıyı Seçme Durumu:

selectedSingerId değeri "123" ve id değeri "456" ise:
Koşul: false (eşit değiller)
Sonuç: "456" (yeni şarkıcıyı seç ve bilgilerini göster) */