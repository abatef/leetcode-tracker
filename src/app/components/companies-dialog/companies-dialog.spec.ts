import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CompaniesDialog } from './companies-dialog';

describe('CompaniesDialog', () => {
  let component: CompaniesDialog;
  let fixture: ComponentFixture<CompaniesDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CompaniesDialog]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CompaniesDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
