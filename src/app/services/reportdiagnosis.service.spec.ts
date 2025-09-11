import { TestBed } from '@angular/core/testing';

import { ReportdiagnosisService } from './reportdiagnosis.service';

describe('ReportdiagnosisService', () => {
  let service: ReportdiagnosisService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ReportdiagnosisService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
