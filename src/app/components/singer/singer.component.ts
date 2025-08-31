import { Component, OnInit } from '@angular/core';
import { Singer } from '../../models/singer';
import { SingerService } from '../../services/singer.service';
import { SinglesongService } from '../../services/singlesong.service';
import { SingleSong } from '../../models/singlesong';

@Component({
  selector: 'app-singer',
  templateUrl: './singer.component.html',
  styleUrl: './singer.component.css'
})
export class SingerComponent implements OnInit {

  //change test main

  singers: Singer[] = [];  
  singleSongList:SingleSong[]=[];
  singleSong= new SingleSong();
  selectedSingerId: string | null = null; 
  searchTerm: string = ''; // Arama terimi için değişken
  showLegacyList = false;
  showList = false;

  

  constructor(private singerService: SingerService,private singlesongService:SinglesongService) { }

  ngOnInit(): void {
    this.getSingers();
    this.getSingleSong();
  }
  
  toggleCard(id: string): void {
    this.selectedSingerId = this.selectedSingerId === id ? null : id;
  }

  getSingers(): void {
    this.singerService.getSingers().subscribe((data: Singer[]) => {
      this.singers = data;
    }, error => {
      console.error('Şarkıcıları alırken bir hata oluştu:', error);
    });

    console.log("selam singer bu")
  }

    getSingleSong(){
    this.singlesongService.getSingles().subscribe(
      (data:SingleSong[])=>{
        this.singleSongList=data;
      }, error => {
      console.error('Şarkıcıları alırken bir hata oluştu:', error);
    });
  }


  postSingleSong(){
    this.singlesongService.postSingleSong(this.singleSong).subscribe(
      response => console.log('Post created successfully:',response),
      error => console.error('Error',error)
    )
  } 

}
