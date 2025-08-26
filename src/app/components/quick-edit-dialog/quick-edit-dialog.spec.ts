import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QuickEditDialog } from './quick-edit-dialog';

describe('QuickEditDialog', () => {
  let component: QuickEditDialog;
  let fixture: ComponentFixture<QuickEditDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QuickEditDialog]
    })
    .compileComponents();

    fixture = TestBed.createComponent(QuickEditDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
