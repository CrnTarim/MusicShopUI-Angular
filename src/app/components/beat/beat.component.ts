import { Component } from '@angular/core';
import { Beat } from '../../models/beat';
import { BeatService } from '../../services/beat.service';

@Component({
  selector: 'app-beat',
  templateUrl: './beat.component.html',
  styleUrl: './beat.component.css'
})
export class BeatComponent {

    beatList: Beat[] = [];
    beats: Beat[] = [];             // ← şarkıcı listesi
    form: Beat = new Beat();
    saving = false;
    showDelete=false;
    constructor(private beatService: BeatService) {}
  
    ngOnInit(): void {
      this.loadBeats();       
    }
    
    fillForm(e: any): void {
        // satıra tıklandığında o satırın datasını forma kopyala
        this.form = { ...e.data }; // e.data.id (GUID) burada olmalı
        this.showDelete=true;
      }

    loadBeats(){

      this.beatService.getBeats().subscribe({
      next: (data) => this.beatList = data,
      error: (err) => console.error('Şarkılar alınırken hata:', err)
    });
    }

    save(): void {
        if (!this.form.name) return; // temel doğrulama
        this.saving = true;
        this.beatService.postBeat(this.form).subscribe({
          next: () => {
            this.saving = false;
            this.form = new Beat(); // formu sıfırla
            this.loadBeats();             // listeyi tazele
          },
          error: (err) => {
            this.saving = false;
            console.error('Kaydetme hatası:', err);
          }
        });

        console.log(this.form)
      }


    }



