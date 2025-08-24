import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TimestampsDialogComponent } from './timestamps-dialog';

describe('TimestampsDialog', () => {
  let component: TimestampsDialogComponent;
  let fixture: ComponentFixture<TimestampsDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TimestampsDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TimestampsDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
