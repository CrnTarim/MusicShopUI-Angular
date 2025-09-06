import { Component } from '@angular/core';
import { SinglesongService } from '../../services/singlesong.service';
import { Singer } from '../../models/singer';
import { SingleSong } from '../../models/singlesong';

@Component({
  selector: 'app-singlesongs',
  templateUrl: './singlesongs.component.html',
  styleUrl: './singlesongs.component.css'
})
export class SinglesongsComponent {

  singleSongList: SingleSong[] = [];
  singers: Singer[] = [];             // ← şarkıcı listesi
  form: SingleSong = new SingleSong();
  selectedSong :SingleSong = new SingleSong();
  saving = false;
  showDelete=false;
  constructor(private singlesongService: SinglesongService) {}
  deleting = false;

  ngOnInit(): void {
    this.loadSongs();
    this.loadSingers();               // ← şarkıcıları çek
  }

  loadSongs(): void {
    this.singlesongService.getSingles().subscribe({
      next: (data) => this.singleSongList = data,
      error: (err) => console.error('Şarkılar alınırken hata:', err)
    });
  }

  loadSingers(): void {

    this.singlesongService.getSingers().subscribe({
      next: (data) => this.singers = data,
      error: (err) => console.error('Şarkıcılar alınırken hata:', err)
    });
  }

 onSingerChange(e: any): void { 
    this.form.singerName = e?.selectedItem?.name || '';    
}

fillForm(e: any): void {

  this.form = e.data;
  this.selectedSong=e.data;
  this.showDelete=true;
}


deleteSelected(): void {
  if (!this.selectedSong?.id) return;                   // GUID yoksa çık

  this.deleting = true;
  this.singlesongService.deleteSingleSong(this.selectedSong.id).subscribe({
    next: () => {
      this.deleting = false;
      this.loadSongs();                          // listeyi yenile
      this.form = new SingleSong();              // formu sıfırla
    },
    error: (err) => {
      this.deleting = false;
      console.error('Silme hatası:', err);
    }
  });

  this.showDelete=false;
}


  save(): void {
    if (!this.form.name) return; // temel doğrulama
    this.saving = true;
    this.singlesongService.postSingleSong(this.form).subscribe({
      next: () => {
        this.saving = false;
        this.form = new SingleSong(); // formu sıfırla
        this.loadSongs();             // listeyi tazele
      },
      error: (err) => {
        this.saving = false;
        console.error('Kaydetme hatası:', err);
      }
    });

      console.log(this.form)
  }
}
