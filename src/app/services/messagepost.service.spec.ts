import { TestBed } from '@angular/core/testing';

import { MessagepostService } from './messagepost.service';

describe('MessagepostService', () => {
  let service: MessagepostService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MessagepostService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
