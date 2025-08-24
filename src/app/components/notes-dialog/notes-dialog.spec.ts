import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NotesDialog } from './notes-dialog';

describe('NotesDialog', () => {
  let component: NotesDialog;
  let fixture: ComponentFixture<NotesDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NotesDialog]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NotesDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
