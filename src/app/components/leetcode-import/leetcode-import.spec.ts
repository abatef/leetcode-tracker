import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LeetcodeImport } from './leetcode-import';

describe('LeetcodeImport', () => {
  let component: LeetcodeImport;
  let fixture: ComponentFixture<LeetcodeImport>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LeetcodeImport]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LeetcodeImport);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
