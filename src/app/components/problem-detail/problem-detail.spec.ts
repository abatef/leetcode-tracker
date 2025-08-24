import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProblemDetail } from './problem-detail';

describe('ProblemDetail', () => {
  let component: ProblemDetail;
  let fixture: ComponentFixture<ProblemDetail>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProblemDetail]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProblemDetail);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
