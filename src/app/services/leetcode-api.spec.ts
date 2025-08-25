import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LeetcodeApi } from './leetcode-api';

describe('LeetcodeApi', () => {
  let component: LeetcodeApi;
  let fixture: ComponentFixture<LeetcodeApi>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LeetcodeApi]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LeetcodeApi);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
