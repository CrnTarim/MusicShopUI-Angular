import { TestBed } from '@angular/core/testing';

import { FavouritesongsService } from './favouritesongs.service';

describe('FavouritesongsService', () => {
  let service: FavouritesongsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FavouritesongsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
