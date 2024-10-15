import { TestBed } from '@angular/core/testing';

import { SinglesongService } from './singlesong.service';

describe('SinglesongService', () => {
  let service: SinglesongService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SinglesongService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
