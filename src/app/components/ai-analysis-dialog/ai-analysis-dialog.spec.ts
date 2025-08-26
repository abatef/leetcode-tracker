import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AiAnalysisDialog } from './ai-analysis-dialog';

describe('AiAnalysisDialog', () => {
  let component: AiAnalysisDialog;
  let fixture: ComponentFixture<AiAnalysisDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AiAnalysisDialog]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AiAnalysisDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
