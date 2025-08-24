import { TestBed } from '@angular/core/testing';

import { Leetcode } from './leetcode';

describe('Leetcode', () => {
  let service: Leetcode;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Leetcode);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
