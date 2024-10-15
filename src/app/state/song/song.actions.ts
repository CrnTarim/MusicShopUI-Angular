import { createAction, props } from '@ngrx/store';
import { SingleSong } from '../../models/singlesong';

export const setActiveSingleSong = createAction(
  '[SingleSong] Set Active SingleSong',
  props<{activeSingleSong:SingleSong}>());