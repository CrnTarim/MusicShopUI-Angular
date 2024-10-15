import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'singerSearch'
})
export class SingerSearchPipe implements PipeTransform {

  transform(singers: any[], searchTerm: string): any[] {
    if (!singers || !searchTerm) {
      return singers;
    }
    return singers.filter(singer =>
      singer.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }
}
