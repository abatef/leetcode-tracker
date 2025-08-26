import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

interface QuickEditData {
  title: string;
  field: string;
  value: any;
  type: 'text' | 'number' | 'select';
  options?: string[];
  min?: number;
  max?: number;
}

@Component({
  selector: 'app-quick-edit-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule
  ],
  template: `
    <h2 mat-dialog-title>{{ data.title }}</h2>

    <form [formGroup]="editForm" (ngSubmit)="onSave()">
      <mat-dialog-content>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>{{ data.title }}</mat-label>

          <input
            *ngIf="data.type === 'text'"
            matInput
            formControlName="value"
            type="text"
          />

          <input
            *ngIf="data.type === 'number'"
            matInput
            formControlName="value"
            type="number"
            [min]="data.min || 0"
            [max]="data.max || 9999"
          />

          <mat-select
            *ngIf="data.type === 'select'"
            formControlName="value"
          >
            <mat-option *ngFor="let option of data.options" [value]="option">
              {{ option }}
            </mat-option>
          </mat-select>

          <mat-error *ngIf="editForm.get('value')?.hasError('required')">
            This field is required
          </mat-error>
          <mat-error *ngIf="editForm.get('value')?.hasError('min')">
            Value must be at least {{ data.min || 0 }}
          </mat-error>
        </mat-form-field>
      </mat-dialog-content>

      <mat-dialog-actions align="end">
        <button mat-button type="button" (click)="onCancel()">Cancel</button>
        <button mat-raised-button color="primary" type="submit" [disabled]="editForm.invalid">
          Save
        </button>
      </mat-dialog-actions>
    </form>
  `,
  styles: [`
    .full-width {
      width: 100%;
      margin-bottom: 1rem;
    }

    mat-dialog-content {
      min-width: 250px;
      padding: 1rem 0;
    }
  `]
})
export class QuickEditDialogComponent {
  editForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<QuickEditDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: QuickEditData
  ) {
    this.editForm = this.fb.group({
      value: [data.value, [Validators.required]]
    });

    if (data.type === 'number' && data.min !== undefined) {
      this.editForm.get('value')?.addValidators(Validators.min(data.min));
    }
  }

  onSave(): void {
    if (this.editForm.valid) {
      this.dialogRef.close(this.editForm.get('value')?.value);
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
