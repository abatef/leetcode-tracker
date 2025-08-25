import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProblemDetailsDialog } from './problem-details-dialog';

describe('ProblemDetailsDialog', () => {
  let component: ProblemDetailsDialog;
  let fixture: ComponentFixture<ProblemDetailsDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProblemDetailsDialog]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProblemDetailsDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
