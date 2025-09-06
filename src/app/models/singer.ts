import { SingleSongEager } from "./singlesong";

export class Singer{
    id?:string;
    name?:string;
}

export class SingerEager{

    id?:string;
    name?:string;
    singleSongs?: SingleSongEager[];
}