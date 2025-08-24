import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-notes-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <div class="notes-dialog">
      <div class="dialog-header">
        <h2 mat-dialog-title>
          <mat-icon>description</mat-icon>
          Problem Notes
        </h2>
        <button mat-icon-button mat-dialog-close>
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <mat-dialog-content class="notes-content">
        <div class="problem-info">
          <h3>{{ data.title }}</h3>
          <span class="problem-id">#{{ data.leetcodeId }}</span>
        </div>

        <div class="notes-text" [innerHTML]="formatNotes(data.notes)"></div>

        <div class="empty-notes" *ngIf="!data.notes">
          <mat-icon>note_add</mat-icon>
          <p>No notes available for this problem</p>
        </div>
      </mat-dialog-content>

      <mat-dialog-actions align="end">
        <button mat-button mat-dialog-close>Close</button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .notes-dialog {
      min-width: 500px;
      max-width: 700px;
    }

    .dialog-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }

    .dialog-header h2 {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin: 0;
    }

    .problem-info {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-bottom: 1.5rem;
      padding-bottom: 1rem;
      border-bottom: 1px solid rgba(0,0,0,0.1);
    }

    .problem-info h3 {
      margin: 0;
      color: var(--mdc-theme-primary);
    }

    .problem-id {
      background: rgba(0,0,0,0.1);
      padding: 0.25rem 0.5rem;
      border-radius: 12px;
      font-size: 0.8rem;
    }

    .notes-content {
      max-height: 400px;
      overflow-y: auto;
    }

    .notes-text {
      line-height: 1.6;
      font-family: 'Roboto', sans-serif;
    }

    .empty-notes {
      text-align: center;
      padding: 2rem;
      color: rgba(0,0,0,0.6);
    }

    .empty-notes mat-icon {
      font-size: 3rem;
      width: 3rem;
      height: 3rem;
      margin-bottom: 1rem;
    }

    @media (max-width: 600px) {
      .notes-dialog {
        min-width: 300px;
      }
    }
  `]
})
export class NotesDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<NotesDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  formatNotes(notes: string): string {
    if (!notes) return '';

    return notes
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code>$1</code>')
      .replace(/\n/g, '<br>');
  }
}
