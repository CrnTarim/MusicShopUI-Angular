import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { SingerService } from '../../services/singer.service';
import { Singer } from '../../models/singer';
import { SinglesongService } from '../../services/singlesong.service';
import { SingleSong } from '../../models/singlesong';
import { Store } from '@ngrx/store';
import { setActiveSingleSong } from '../../state/song/song.actions';

@Component({
  selector: 'app-singer-profile',
  templateUrl: './singer-profile.component.html',
  styleUrl: './singer-profile.component.css'
})
export class SingerProfileComponent implements OnInit{
  
  
  singer: Singer | null = null; // Şarkıcı bilgilerini tutacak
  singles: SingleSong[] = [];   // Şarkıcının şarkılarını tutacak

  constructor(
    private route: ActivatedRoute,
    private singerService: SingerService,
    private singleService: SinglesongService,
    private store: Store 
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id'); // URL'den ID'yi al
    if (id) {
      this.getSingerDetails(id); // Şarkıcı detayları ve şarkıları al
    }
  }

  getSingerDetails(id: string): void {
    // İlk olarak şarkıcı bilgilerini al
    this.singerService.getSingerbyId(id).subscribe((data: Singer) => {
      this.singer = data; // Eğer şarkıcı bulunursa
      // Şarkıcı bilgileri alındıktan sonra şarkılarını al
      this.getSingerSongs(id);
    }, error => {
      console.error('Şarkıcı bilgilerini alırken hata:', error);
      // Eğer hata varsa, şarkıları getirme
    });
  }
  
  getSingerSongs(id: string): void {
    // Şarkıcıya ait şarkıları al
    this.singleService.getSinglebySingerId(id).subscribe((songs: SingleSong[]) => {
      this.singles = songs;
    }, error => {
      console.error('Şarkıcıya ait şarkılar alınırken hata:', error);
    });
  }

  setActiveSong(song: SingleSong): void {
    this.store.dispatch(setActiveSingleSong({ activeSingleSong: song })); // NgRx ile aktif şarkıyı ayarla
  }

}
