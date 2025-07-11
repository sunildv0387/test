import { TestBed } from '@angular/core/testing';

import { AllapiService } from './allapi.service';

describe('AllapiService', () => {
  let service: AllapiService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AllapiService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
