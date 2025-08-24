import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';

@Component({
  selector: 'app-all-tags-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule, MatChipsModule],
  template: `
    <h2 mat-dialog-title>
      <mat-icon>local_offer</mat-icon>
      All Tags
    </h2>

    <mat-dialog-content>
      <div class="problem-info">
        <h3>{{ data.title }}</h3>
      </div>

      <div class="all-tags">
        <mat-chip *ngFor="let tag of data.tags" class="tag-chip">
          {{ tag }}
        </mat-chip>
      </div>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Close</button>
    </mat-dialog-actions>
  `,
  styles: [`
    h2[mat-dialog-title] {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0;
    }

    .problem-info {
      margin-bottom: 1.5rem;
      padding-bottom: 1rem;
      border-bottom: 1px solid rgba(0,0,0,0.1);
    }

    .problem-info h3 {
      margin: 0;
      color: var(--mdc-theme-primary);
      font-size: 1.1rem;
      font-weight: 500;
    }

    .all-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }

    .tag-chip {
      background: rgba(103, 80, 164, 0.1) !important;
      color: #5b21b6 !important;
      border: 1px solid rgba(103, 80, 164, 0.2) !important;
      font-weight: 500 !important;
    }

    :host-context(.dark-theme) .problem-info {
      border-bottom-color: rgba(255, 255, 255, 0.1);
    }

    :host-context(.dark-theme) .tag-chip {
      background: rgba(255, 255, 255, 0.1) !important;
      color: #c4b5fd !important;
      border: 1px solid rgba(255, 255, 255, 0.2) !important;
    }
  `]
})
export class AllTagsDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<AllTagsDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}
}
