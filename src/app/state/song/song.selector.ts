import { createSelector } from '@ngrx/store';
import { SingleSong } from '../../models/singlesong'; // SingleSong modelini import et

// State arayüzü
export interface SingleSongState {
  activeSingleSong: SingleSong | null; // Aktif şarkı bilgisi
}

// Feature Selector: Store'dan singleSong state'ini seç
export const selectSingleSongFeature = (state: any): SingleSongState => state.activeSingleSong;

// Selector: Aktif şarkıyı seç
export const selectActiveSingleSong = createSelector(
  selectSingleSongFeature,
  (state: SingleSongState) => state.activeSingleSong
);


/*
export const selectActiveSingleSong =(state:any)=>
  state.activeSingleSong?.activeSingleSong;

*/







