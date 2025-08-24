import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProblemForm } from './problem-form';

describe('ProblemForm', () => {
  let component: ProblemForm;
  let fixture: ComponentFixture<ProblemForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProblemForm]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProblemForm);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
