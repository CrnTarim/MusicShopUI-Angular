import { createReducer, on } from '@ngrx/store';
import { SingleSong } from '../../models/singlesong';
import * as SingleSongActions from './song.actions';



export interface SingleSongState {
  activeSingleSong: SingleSong | null;
  
}

export const initialState: SingleSongState = {
  activeSingleSong: null
 
};

/*
export const initialState:{activeSingleSong:SingleSong| null} ={
  activeSingleSong:null
};
*/

export const singlesongReducer =createReducer(
  initialState,
  on(SingleSongActions.setActiveSingleSong,(state,{activeSingleSong})=>({
    ...state,
    activeSingleSong

  }))
)

