import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TagsDialog } from './tags-dialog';

describe('TagsDialog', () => {
  let component: TagsDialog;
  let fixture: ComponentFixture<TagsDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TagsDialog]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TagsDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
