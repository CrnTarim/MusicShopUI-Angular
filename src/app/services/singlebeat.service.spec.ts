import { TestBed } from '@angular/core/testing';

import { SinglebeatService } from './singlebeat.service';

describe('SinglebeatService', () => {
  let service: SinglebeatService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SinglebeatService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
