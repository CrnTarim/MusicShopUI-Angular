import { SinglesongService } from './../../services/singlesong.service';
import { Component } from '@angular/core';
import { SinglebeatService } from '../../services/singlebeat.service';
import { SingleBeat } from '../../models/singlebeat';
import { SingerService } from '../../services/singer.service';
import { Singer } from '../../models/singer';
import { SingleSong } from '../../models/singlesong';

@Component({
  selector: 'app-singlebeat',
  templateUrl: './singlebeat.component.html',
  styleUrl: './singlebeat.component.css'
})
export class SinglebeatComponent {




  singlebeatList: SingleBeat[] = [];
  singerList: Singer[]=[];
  singlesongList: SingleSong []=[];
  
  singerModel= new Singer();
  singlesongModel= new SingleSong();
  form= new SingleBeat();


    constructor(private singlebeatService:SinglebeatService,
                private signerService:SingerService,
                private singlesongService:SinglesongService) {}

    ngOnInit(): void {
    this.loadSingers();
    this.loadSingleBeats(); 
    this.loadSingleSongs();              // ← şarkıcıları çek
  }

   loadSingleBeats(){
      this.singlebeatService.getSingleBeats().subscribe({
        next: (data) => this.singlebeatList = data,
        error: (err) => console.error('Şarkı beatleri alınırken hata:', err)
      })
      console.log(this.singlebeatList)
    }

    loadSingers(){
      this.signerService.getSingers().subscribe({

        next: (data) => this.singerList=data,
        error:(err) => console.error('Şarkılar alınırken hata:', err)
      })
    }

    loadSingleSongs(){
      this.singlesongService.getSingles().subscribe({

        next: (data) => this.singlesongList=data,
        error:(err) => console.error('Şarkılar alınırken hata:', err)
      })
    }

   

}
