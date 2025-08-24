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
    <h2 mat-dialog-title>
      <mat-icon>description</mat-icon>
      Problem Notes
    </h2>

    <mat-dialog-content>
      <div class="problem-info">
        <h3>{{ data.title }}</h3>
        <span class="problem-id">#{{ data.leetcodeId }}</span>
      </div>

      <div class="notes-text" [innerHTML]="formatNotes(data.notes)" *ngIf="data.notes"></div>

      <div class="empty-notes" *ngIf="!data.notes">
        <mat-icon>note_add</mat-icon>
        <p>No notes available for this problem</p>
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
      font-size: 1.1rem;
      font-weight: 500;
    }

    .problem-id {
      background: rgba(103, 80, 164, 0.1);
      color: #5b21b6;
      padding: 0.25rem 0.75rem;
      border-radius: 12px;
      font-size: 0.8rem;
      font-weight: 500;
      border: 1px solid rgba(103, 80, 164, 0.2);
    }

    mat-dialog-content {
      min-width: 500px;
      max-width: 700px;
      max-height: 400px;
      overflow-y: auto;
    }

    .notes-text {
      line-height: 1.6;
      font-family: 'Google Sans', 'Roboto', sans-serif;
      font-size: 0.95rem;
      color: rgba(0, 0, 0, 0.87);
    }

    .notes-text strong {
      font-weight: 600;
      color: var(--mdc-theme-primary);
    }

    .notes-text em {
      font-style: italic;
      color: rgba(0, 0, 0, 0.7);
    }

    .notes-text code {
      background: rgba(0, 0, 0, 0.05);
      padding: 0.15rem 0.4rem;
      border-radius: 4px;
      font-family: 'Roboto Mono', monospace;
      font-size: 0.85rem;
      color: #d63384;
      border: 1px solid rgba(0, 0, 0, 0.1);
    }

    .empty-notes {
      text-align: center;
      padding: 3rem 2rem;
      color: rgba(0, 0, 0, 0.6);
    }

    .empty-notes mat-icon {
      font-size: 3rem;
      width: 3rem;
      height: 3rem;
      margin-bottom: 1rem;
      color: rgba(0, 0, 0, 0.3);
    }

    .empty-notes p {
      margin: 0;
      font-size: 1rem;
      line-height: 1.5;
    }

    // Dark theme styles
    :host-context(.dark-theme) .problem-info {
      border-bottom-color: rgba(255, 255, 255, 0.1);
    }

    :host-context(.dark-theme) .problem-id {
      background: rgba(255, 255, 255, 0.1);
      color: #c4b5fd;
      border-color: rgba(255, 255, 255, 0.2);
    }

    :host-context(.dark-theme) .notes-text {
      color: rgba(255, 255, 255, 0.87);
    }

    :host-context(.dark-theme) .notes-text em {
      color: rgba(255, 255, 255, 0.7);
    }

    :host-context(.dark-theme) .notes-text code {
      background: rgba(255, 255, 255, 0.1);
      color: #ff9ff3;
      border-color: rgba(255, 255, 255, 0.2);
    }

    :host-context(.dark-theme) .empty-notes {
      color: rgba(255, 255, 255, 0.6);
    }

    :host-context(.dark-theme) .empty-notes mat-icon {
      color: rgba(255, 255, 255, 0.3);
    }

    // Responsive design
    @media (max-width: 600px) {
      mat-dialog-content {
        min-width: 300px;
        max-width: 90vw;
      }

      .problem-info {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.5rem;
      }

      .empty-notes {
        padding: 2rem 1rem;
      }
    }

    // Enhanced scrollbar for notes content
    mat-dialog-content {
      scrollbar-width: thin;
      scrollbar-color: rgba(103, 80, 164, 0.3) rgba(0, 0, 0, 0.05);
    }

    mat-dialog-content::-webkit-scrollbar {
      width: 6px;
    }

    mat-dialog-content::-webkit-scrollbar-track {
      background: rgba(0, 0, 0, 0.03);
      border-radius: 3px;
    }

    mat-dialog-content::-webkit-scrollbar-thumb {
      background: rgba(103, 80, 164, 0.3);
      border-radius: 3px;
      transition: background-color 0.2s ease;
    }

    mat-dialog-content::-webkit-scrollbar-thumb:hover {
      background: rgba(103, 80, 164, 0.5);
    }

    :host-context(.dark-theme) mat-dialog-content {
      scrollbar-color: rgba(255, 255, 255, 0.2) rgba(255, 255, 255, 0.05);
    }

    :host-context(.dark-theme) mat-dialog-content::-webkit-scrollbar-track {
      background: rgba(255, 255, 255, 0.03);
    }

    :host-context(.dark-theme) mat-dialog-content::-webkit-scrollbar-thumb {
      background: rgba(255, 255, 255, 0.2);
    }

    :host-context(.dark-theme) mat-dialog-content::-webkit-scrollbar-thumb:hover {
      background: rgba(255, 255, 255, 0.3);
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
