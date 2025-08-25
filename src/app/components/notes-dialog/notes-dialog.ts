import { Component, Inject, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { LeetcodeService } from '../../services/leetcode';

@Component({
  selector: 'app-notes-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSnackBarModule,
    MatTooltipModule,
    MatDividerModule
  ],
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

      <!-- View Mode -->
      <div *ngIf="!isEditing" class="view-mode">
        <div class="notes-text" [innerHTML]="formatNotes(data.notes)" *ngIf="data.notes"></div>

        <div class="empty-notes" *ngIf="!data.notes">
          <mat-icon>note_add</mat-icon>
          <p>No notes available for this problem</p>
          <p class="empty-hint">Click "Edit Notes" to add your thoughts, solution approach, or key insights.</p>
        </div>
      </div>

      <!-- Edit Mode -->
      <div *ngIf="isEditing" class="edit-mode">
        <!-- Formatting Toolbar -->
        <div class="formatting-toolbar">
          <div class="toolbar-group">
            <button
              mat-icon-button
              (click)="applyFormatting('bold')"
              matTooltip="Bold (Ctrl+B)"
              class="format-btn">
              <mat-icon>format_bold</mat-icon>
            </button>
            <button
              mat-icon-button
              (click)="applyFormatting('italic')"
              matTooltip="Italic (Ctrl+I)"
              class="format-btn">
              <mat-icon>format_italic</mat-icon>
            </button>
            <button
              mat-icon-button
              (click)="applyFormatting('code')"
              matTooltip="Inline Code (Ctrl+K)"
              class="format-btn">
              <mat-icon>code</mat-icon>
            </button>
          </div>

          <mat-divider [vertical]="true"></mat-divider>

          <div class="toolbar-group">
            <button
              mat-icon-button
              (click)="insertText('## ')"
              matTooltip="Heading"
              class="format-btn">
              <mat-icon>title</mat-icon>
            </button>
            <button
              mat-icon-button
              (click)="insertText('- ')"
              matTooltip="Bullet Point"
              class="format-btn">
              <mat-icon>format_list_bulleted</mat-icon>
            </button>
            <button
              mat-icon-button
              (click)="insertText('1. ')"
              matTooltip="Numbered List"
              class="format-btn">
              <mat-icon>format_list_numbered</mat-icon>
            </button>
          </div>

          <mat-divider [vertical]="true"></mat-divider>

          <div class="toolbar-group">
            <button
              mat-icon-button
              (click)="insertText('\\n\\n')"
              matTooltip="Code Block"
              class="format-btn">
              <mat-icon>code_blocks</mat-icon>
            </button>
            <button
              mat-icon-button
              (click)="insertText('> ')"
              matTooltip="Quote"
              class="format-btn">
              <mat-icon>format_quote</mat-icon>
            </button>
            <button
              mat-icon-button
              (click)="insertText('---\n')"
              matTooltip="Horizontal Line"
              class="format-btn">
              <mat-icon>horizontal_rule</mat-icon>
            </button>
          </div>

          <mat-divider [vertical]="true"></mat-divider>

          <div class="toolbar-group">
            <button
              mat-icon-button
              (click)="undoEdit()"
              matTooltip="Undo (Ctrl+Z)"
              [disabled]="undoStack.length === 0"
              class="format-btn">
              <mat-icon>undo</mat-icon>
            </button>
            <button
              mat-icon-button
              (click)="redoEdit()"
              matTooltip="Redo (Ctrl+Y)"
              [disabled]="redoStack.length === 0"
              class="format-btn">
              <mat-icon>redo</mat-icon>
            </button>
          </div>
        </div>

        <mat-form-field appearance="outline" class="full-width textarea-field">
          <mat-label>Notes</mat-label>
          <textarea
            #notesTextarea
            matInput
            [(ngModel)]="editedNotes"
            (ngModelChange)="onTextChange()"
            (keydown)="onKeyDown($event)"
            placeholder="Enter your notes here... Use the toolbar above for formatting."
            rows="12"
            spellcheck="true">
          </textarea>
          <mat-hint>
            Use the toolbar above for formatting or keyboard shortcuts. Press Ctrl+Enter to save.
          </mat-hint>
        </mat-form-field>

        <!-- Quick Templates -->
        <div class="quick-templates">
          <h4>Quick Templates:</h4>
          <div class="template-buttons">
            <button mat-stroked-button (click)="insertTemplate('approach')" class="template-btn">
              <mat-icon>lightbulb</mat-icon>
              Approach
            </button>
            <button mat-stroked-button (click)="insertTemplate('complexity')" class="template-btn">
              <mat-icon>speed</mat-icon>
              Complexity
            </button>
            <button mat-stroked-button (click)="insertTemplate('solution')" class="template-btn">
              <mat-icon>build</mat-icon>
              Solution
            </button>
            <button mat-stroked-button (click)="insertTemplate('mistakes')" class="template-btn">
              <mat-icon>error_outline</mat-icon>
              Mistakes
            </button>
          </div>
        </div>

        <!-- Live Preview -->
        <div class="preview-section" *ngIf="editedNotes">
          <h4>Preview:</h4>
          <div class="notes-preview" [innerHTML]="formatNotes(editedNotes)"></div>
        </div>
      </div>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <!-- View Mode Actions -->
      <ng-container *ngIf="!isEditing">
        <button mat-button mat-dialog-close>Close</button>
        <button mat-raised-button color="primary" (click)="startEditing()">
          <mat-icon>edit</mat-icon>
          Edit Notes
        </button>
      </ng-container>

      <!-- Edit Mode Actions -->
      <ng-container *ngIf="isEditing">
        <button mat-button (click)="cancelEditing()" [disabled]="saving">
          Cancel
        </button>
        <button mat-button (click)="clearNotes()" [disabled]="saving" class="clear-btn">
          <mat-icon>clear</mat-icon>
          Clear
        </button>
        <button mat-raised-button color="primary" (click)="saveNotes()" [disabled]="saving">
          <mat-icon *ngIf="!saving">save</mat-icon>
          <mat-icon *ngIf="saving" class="spinning">sync</mat-icon>
          {{ saving ? 'Saving...' : 'Save Notes' }}
        </button>
      </ng-container>
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
      flex: 1;
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .problem-id {
      background: rgba(103, 80, 164, 0.1);
      color: #5b21b6;
      padding: 0.25rem 0.75rem;
      border-radius: 12px;
      font-size: 0.8rem;
      font-weight: 500;
      border: 1px solid rgba(103, 80, 164, 0.2);
      flex-shrink: 0;
    }

    mat-dialog-content {
      min-width: 280px;
      max-width: min(90vw, 800px);
      width: 100%;
      max-height: 80vh;
      overflow-y: auto;
      padding: 1.5rem;
      box-sizing: border-box;
    }

    .view-mode,
    .edit-mode {
      min-height: 200px;
      width: 100%;
    }

    /* Formatting Toolbar Styles */
    .formatting-toolbar {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem;
      background: rgba(0, 0, 0, 0.02);
      border: 1px solid rgba(0, 0, 0, 0.1);
      border-radius: 8px 8px 0 0;
      margin-bottom: -1px;
      flex-wrap: wrap;
      width: 100%;
      box-sizing: border-box;
      overflow-x: auto;
    }

    .toolbar-group {
      display: flex;
      align-items: center;
      gap: 0.25rem;
      flex-shrink: 0;
    }

    .format-btn {
      width: 36px;
      height: 36px;
      border-radius: 6px;
      transition: all 0.2s ease;
      flex-shrink: 0;
    }

    .format-btn:hover {
      background: rgba(103, 80, 164, 0.1);
      color: #6750a4;
    }

    .format-btn:disabled {
      opacity: 0.4;
    }

    .format-btn mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    mat-divider[vertical="true"] {
      height: 24px;
      margin: 0 0.25rem;
      flex-shrink: 0;
    }

    /* Quick Templates */
    .quick-templates {
      margin: 1rem 0;
      padding: 1rem;
      background: rgba(76, 175, 80, 0.05);
      border-radius: 8px;
      border: 1px solid rgba(76, 175, 80, 0.1);
      width: 100%;
      box-sizing: border-box;
    }

    .quick-templates h4 {
      margin: 0 0 0.75rem 0;
      font-size: 0.9rem;
      color: #4caf50;
      font-weight: 500;
    }

    .template-buttons {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
      width: 100%;
    }

    .template-btn {
      display: flex;
      align-items: center;
      gap: 0.25rem;
      font-size: 0.8rem;
      padding: 0.4rem 0.8rem;
      border-color: rgba(76, 175, 80, 0.3);
      color: #4caf50;
      flex: 1;
      min-width: 0;
      justify-content: center;
    }

    .template-btn mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
    }

    .template-btn:hover {
      background: rgba(76, 175, 80, 0.1);
      border-color: #4caf50;
    }

    /* Textarea Field */
    .full-width {
      width: 100%;
      box-sizing: border-box;
    }

    .textarea-field {
      width: 100%;

      .mat-mdc-text-field-wrapper {
        min-height: 250px;
        border-top: none;
        border-radius: 0 0 8px 8px;
        width: 100%;
      }

      textarea {
        min-height: 200px;
        resize: vertical;
        font-family: 'Roboto', sans-serif;
        line-height: 1.6;
        font-size: 0.95rem;
        width: 100%;
        box-sizing: border-box;
      }
    }

    /* Notes Display */
    .notes-text {
      line-height: 1.6;
      font-family: 'Google Sans', 'Roboto', sans-serif;
      font-size: 0.95rem;
      color: rgba(0, 0, 0, 0.87);
      padding: 1rem;
      background: rgba(0, 0, 0, 0.02);
      border-radius: 8px;
      border: 1px solid rgba(0, 0, 0, 0.1);
      width: 100%;
      box-sizing: border-box;
      word-wrap: break-word;
      overflow-wrap: break-word;
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
      word-break: break-all;
    }

    .notes-text h2 {
      margin: 1.5rem 0 1rem 0;
      font-size: 1.3rem;
      font-weight: 600;
      color: var(--mdc-theme-primary);
      border-bottom: 2px solid rgba(103, 80, 164, 0.2);
      padding-bottom: 0.5rem;
      word-wrap: break-word;
    }

    .notes-text ul,
    .notes-text ol {
      margin: 1rem 0;
      padding-left: 1.5rem;
    }

    .notes-text li {
      margin: 0.5rem 0;
      word-wrap: break-word;
    }

    .notes-text blockquote {
      margin: 1rem 0;
      padding: 0.75rem 1rem;
      border-left: 4px solid var(--mdc-theme-primary);
      background: rgba(103, 80, 164, 0.05);
      font-style: italic;
      word-wrap: break-word;
    }

    .notes-text pre {
      background: rgba(0, 0, 0, 0.05);
      padding: 1rem;
      border-radius: 6px;
      overflow-x: auto;
      margin: 1rem 0;
      border: 1px solid rgba(0, 0, 0, 0.1);
    }

    .notes-text pre code {
      background: none;
      padding: 0;
      border: none;
      font-family: 'Roboto Mono', monospace;
      color: rgba(0, 0, 0, 0.87);
      word-break: normal;
    }

    .notes-text hr {
      margin: 2rem 0;
      border: none;
      height: 2px;
      background: linear-gradient(to right, transparent, rgba(103, 80, 164, 0.3), transparent);
    }

    .empty-notes {
      text-align: center;
      padding: 3rem 2rem;
      color: rgba(0, 0, 0, 0.6);
      width: 100%;
      box-sizing: border-box;
    }

    .empty-notes mat-icon {
      font-size: 3rem;
      width: 3rem;
      height: 3rem;
      margin-bottom: 1rem;
      color: rgba(0, 0, 0, 0.3);
    }

    .empty-notes p {
      margin: 0 0 0.5rem 0;
      font-size: 1rem;
      line-height: 1.5;
    }

    .empty-hint {
      font-size: 0.85rem;
      color: rgba(0, 0, 0, 0.5);
      font-style: italic;
    }

    /* Preview Section */
    .preview-section {
      margin-top: 1.5rem;
      padding-top: 1.5rem;
      border-top: 1px solid rgba(0, 0, 0, 0.1);
      width: 100%;
      box-sizing: border-box;
    }

    .preview-section h4 {
      margin: 0 0 1rem 0;
      font-size: 0.95rem;
      color: rgba(0, 0, 0, 0.7);
      font-weight: 500;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .preview-section h4::before {
      content: '';
      width: 8px;
      height: 8px;
      background: #4caf50;
      border-radius: 50%;
      flex-shrink: 0;
    }

    .notes-preview {
      line-height: 1.6;
      font-family: 'Google Sans', 'Roboto', sans-serif;
      font-size: 0.95rem;
      color: rgba(0, 0, 0, 0.87);
      padding: 1rem;
      background: rgba(0, 0, 0, 0.02);
      border-radius: 8px;
      border: 1px solid rgba(0, 0, 0, 0.1);
      min-height: 60px;
      width: 100%;
      box-sizing: border-box;
      word-wrap: break-word;
      overflow-wrap: break-word;
    }

    .notes-preview strong {
      font-weight: 600;
      color: var(--mdc-theme-primary);
    }

    .notes-preview em {
      font-style: italic;
      color: rgba(0, 0, 0, 0.7);
    }

    .notes-preview code {
      background: rgba(0, 0, 0, 0.05);
      padding: 0.15rem 0.4rem;
      border-radius: 4px;
      font-family: 'Roboto Mono', monospace;
      font-size: 0.85rem;
      color: #d63384;
      border: 1px solid rgba(0, 0, 0, 0.1);
      word-break: break-all;
    }

    .notes-preview h2 {
      margin: 1.5rem 0 1rem 0;
      font-size: 1.3rem;
      font-weight: 600;
      color: var(--mdc-theme-primary);
      border-bottom: 2px solid rgba(103, 80, 164, 0.2);
      padding-bottom: 0.5rem;
      word-wrap: break-word;
    }

    .notes-preview ul,
    .notes-preview ol {
      margin: 1rem 0;
      padding-left: 1.5rem;
    }

    .notes-preview li {
      margin: 0.5rem 0;
      word-wrap: break-word;
    }

    .notes-preview blockquote {
      margin: 1rem 0;
      padding: 0.75rem 1rem;
      border-left: 4px solid var(--mdc-theme-primary);
      background: rgba(103, 80, 164, 0.05);
      font-style: italic;
      word-wrap: break-word;
    }

    .notes-preview pre {
      background: rgba(0, 0, 0, 0.05);
      padding: 1rem;
      border-radius: 6px;
      overflow-x: auto;
      margin: 1rem 0;
      border: 1px solid rgba(0, 0, 0, 0.1);
    }

    .notes-preview pre code {
      background: none;
      padding: 0;
      border: none;
      font-family: 'Roboto Mono', monospace;
      color: rgba(0, 0, 0, 0.87);
      word-break: normal;
    }

    .notes-preview hr {
      margin: 2rem 0;
      border: none;
      height: 2px;
      background: linear-gradient(to right, transparent, rgba(103, 80, 164, 0.3), transparent);
    }

    .clear-btn {
      color: #f44336;
    }

    .spinning {
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
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

    :host-context(.dark-theme) .formatting-toolbar {
      background: rgba(255, 255, 255, 0.02);
      border-color: rgba(255, 255, 255, 0.1);
    }

    :host-context(.dark-theme) .format-btn:hover {
      background: rgba(255, 255, 255, 0.1);
      color: #c4b5fd;
    }

    :host-context(.dark-theme) .quick-templates {
      background: rgba(76, 175, 80, 0.1);
      border-color: rgba(76, 175, 80, 0.2);
    }

    :host-context(.dark-theme) .quick-templates h4 {
      color: #81c784;
    }

    :host-context(.dark-theme) .template-btn {
      border-color: rgba(76, 175, 80, 0.3);
      color: #81c784;
    }

    :host-context(.dark-theme) .template-btn:hover {
      background: rgba(76, 175, 80, 0.1);
      border-color: #81c784;
    }

    :host-context(.dark-theme) .notes-text,
    :host-context(.dark-theme) .notes-preview {
      color: rgba(255, 255, 255, 0.87);
      background: rgba(255, 255, 255, 0.02);
      border-color: rgba(255, 255, 255, 0.1);
    }

    :host-context(.dark-theme) .notes-text em,
    :host-context(.dark-theme) .notes-preview em {
      color: rgba(255, 255, 255, 0.7);
    }

    :host-context(.dark-theme) .notes-text code,
    :host-context(.dark-theme) .notes-preview code {
      background: rgba(255, 255, 255, 0.1);
      color: #ff9ff3;
      border-color: rgba(255, 255, 255, 0.2);
    }

    :host-context(.dark-theme) .notes-text h2,
    :host-context(.dark-theme) .notes-preview h2 {
      color: #c4b5fd;
      border-bottom-color: rgba(255, 255, 255, 0.2);
    }

    :host-context(.dark-theme) .notes-text blockquote,
    :host-context(.dark-theme) .notes-preview blockquote {
      background: rgba(196, 181, 253, 0.1);
      border-left-color: #c4b5fd;
    }

    :host-context(.dark-theme) .notes-text pre,
    :host-context(.dark-theme) .notes-preview pre {
      background: rgba(255, 255, 255, 0.05);
      border-color: rgba(255, 255, 255, 0.1);
    }

    :host-context(.dark-theme) .notes-text pre code,
    :host-context(.dark-theme) .notes-preview pre code {
      color: rgba(255, 255, 255, 0.87);
    }

    :host-context(.dark-theme) .empty-notes {
      color: rgba(255, 255, 255, 0.6);
    }

    :host-context(.dark-theme) .empty-notes mat-icon {
      color: rgba(255, 255, 255, 0.3);
    }

    :host-context(.dark-theme) .empty-hint {
      color: rgba(255, 255, 255, 0.5);
    }

    :host-context(.dark-theme) .preview-section {
      border-top-color: rgba(255, 255, 255, 0.1);
    }

    :host-context(.dark-theme) .preview-section h4 {
      color: rgba(255, 255, 255, 0.7);
    }

    // Responsive design
    @media (max-width: 768px) {
      mat-dialog-content {
        min-width: 280px;
        max-width: 95vw;
        padding: 1rem;
      }

      .problem-info {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.5rem;
      }

      .problem-info h3 {
        white-space: normal;
        word-wrap: break-word;
      }

      .formatting-toolbar {
        gap: 0.25rem;
        padding: 0.5rem;
        justify-content: center;
      }

      .toolbar-group {
        gap: 0.125rem;
      }

      .format-btn {
        width: 32px;
        height: 32px;
      }

      .template-buttons {
        gap: 0.25rem;
        flex-direction: column;
      }

      .template-btn {
        font-size: 0.75rem;
        padding: 0.3rem 0.6rem;
        flex: none;
        width: 100%;
      }

      .empty-notes {
        padding: 2rem 1rem;
      }
    }

    @media (max-width: 480px) {
      mat-dialog-content {
        min-width: 260px;
        max-width: 100vw;
        padding: 0.75rem;
      }

      .formatting-toolbar {
        padding: 0.5rem;
        gap: 0.125rem;
      }

      .format-btn {
        width: 28px;
        height: 28px;
      }

      .format-btn mat-icon {
        font-size: 16px;
        width: 16px;
        height: 16px;
      }

      mat-divider[vertical="true"] {
        margin: 0 0.125rem;
      }

      .template-btn {
        font-size: 0.7rem;
        padding: 0.25rem 0.5rem;
      }

      .template-btn mat-icon {
        font-size: 14px;
        width: 14px;
        height: 14px;
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
  @ViewChild('notesTextarea') notesTextarea!: ElementRef<HTMLTextAreaElement>;

  isEditing = false;
  editedNotes = '';
  saving = false;

  // Undo/Redo functionality
  undoStack: string[] = [];
  redoStack: string[] = [];
  lastChange = '';

  constructor(
    public dialogRef: MatDialogRef<NotesDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private leetcodeService: LeetcodeService,
    private snackBar: MatSnackBar
  ) {
    // Set up keyboard shortcuts
    this.setupKeyboardShortcuts();
  }

  private setupKeyboardShortcuts(): void {
    document.addEventListener('keydown', (event) => {
      if (!this.isEditing) return;

      if (event.ctrlKey || event.metaKey) {
        switch (event.key.toLowerCase()) {
          case 'enter':
            event.preventDefault();
            this.saveNotes();
            break;
          case 'b':
            event.preventDefault();
            this.applyFormatting('bold');
            break;
          case 'i':
            event.preventDefault();
            this.applyFormatting('italic');
            break;
          case 'k':
            event.preventDefault();
            this.applyFormatting('code');
            break;
          case 'z':
            if (event.shiftKey) {
              event.preventDefault();
              this.redoEdit();
            } else {
              event.preventDefault();
              this.undoEdit();
            }
            break;
          case 'y':
            event.preventDefault();
            this.redoEdit();
            break;
        }
      } else if (event.key === 'Escape') {
        event.preventDefault();
        this.cancelEditing();
      }
    });
  }

  formatNotes(notes: string): string {
    if (!notes) return '';

    return notes
      // Headers
      .replace(/^## (.*$)/gm, '<h2>$1</h2>')
      // Bold
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      // Italic
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      // Inline code
      .replace(/`(.*?)`/g, '<code>$1</code>')
      // Code blocks
      .replace(/```\n([\s\S]*?)\n```/g, '<pre><code>$1</code></pre>')
      // Quotes
      .replace(/^> (.*$)/gm, '<blockquote>$1</blockquote>')
      // Unordered lists
      .replace(/^- (.*$)/gm, '<li>$1</li>')
      .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')
      // Ordered lists
      .replace(/^\d+\. (.*$)/gm, '<li>$1</li>')
      .replace(/(<li>.*<\/li>)/s, '<ol>$1</ol>')
      // Horizontal rules
      .replace(/^---$/gm, '<hr>')
      // Line breaks
      .replace(/\n/g, '<br>');
  }

  startEditing(): void {
    this.isEditing = true;
    this.editedNotes = this.data.notes || '';
    this.initializeUndoStack();

    // Focus the textarea after the view updates
    setTimeout(() => {
      if (this.notesTextarea) {
        this.notesTextarea.nativeElement.focus();
        const textarea = this.notesTextarea.nativeElement;
        textarea.setSelectionRange(textarea.value.length, textarea.value.length);
      }
    }, 100);
  }

  onKeyDown(event: KeyboardEvent): void {
    // Handle tab key for indentation
    if (event.key === 'Tab') {
      event.preventDefault();
      this.insertText('  ');
    }
  }

  onTextChange(): void {
    if (this.editedNotes !== this.lastChange) {
      this.pushToUndoStack();
      this.lastChange = this.editedNotes;
    }
  }

  applyFormatting(type: 'bold' | 'italic' | 'code'): void {
    const textarea = this.notesTextarea.nativeElement;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);

    let formattedText = '';
    let cursorOffset = 0;

    switch (type) {
      case 'bold':
        if (selectedText) {
          formattedText = `**${selectedText}**`;
          cursorOffset = 2;
        } else {
          formattedText = '**bold text**';
          cursorOffset = 2;
        }
        break;
      case 'italic':
        if (selectedText) {
          formattedText = `*${selectedText}*`;
          cursorOffset = 1;
        } else {
          formattedText = '*italic text*';
          cursorOffset = 1;
        }
        break;
      case 'code':
        if (selectedText) {
          formattedText = `\`${selectedText}\``;
          cursorOffset = 1;
        } else {
          formattedText = '`code text`';
          cursorOffset = 1;
        }
        break;
    }

    this.insertTextAtCursor(formattedText, !selectedText ? cursorOffset : formattedText.length - cursorOffset);
  }

  insertText(text: string): void {
    this.insertTextAtCursor(text.replace(/\\n/g, '\n'));
  }

  insertTemplate(type: 'approach' | 'complexity' | 'solution' | 'mistakes'): void {
    let template = '';

    switch (type) {
      case 'approach':
        template = `## Approach
- **Intuition**:
- **Key Insight**:
- **Steps**:
  1.
  2.
  3.

`;
        break;
      case 'complexity':
        template = `## Complexity Analysis
- **Time Complexity**: O()
- **Space Complexity**: O()
- **Explanation**:

`;
        break;
      case 'solution':
        template = `## Solution
\`\`\`
// Your code here

\`\`\`

**Explanation**:
-

`;
        break;
      case 'mistakes':
        template = `## Common Mistakes & Learnings
- **Mistake**:
  - **Fix**:
- **Key Learning**:
- **Edge Cases**:

`;
        break;
    }

    this.insertTextAtCursor(template);
  }

  private insertTextAtCursor(text: string, cursorOffset?: number): void {
    const textarea = this.notesTextarea.nativeElement;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;

    this.pushToUndoStack();

    const before = this.editedNotes.substring(0, start);
    const after = this.editedNotes.substring(end);

    this.editedNotes = before + text + after;

    setTimeout(() => {
      const newCursorPos = start + (cursorOffset !== undefined ? cursorOffset : text.length);
      textarea.setSelectionRange(newCursorPos, newCursorPos);
      textarea.focus();
    });
  }

  private initializeUndoStack(): void {
    this.undoStack = [this.editedNotes];
    this.redoStack = [];
    this.lastChange = this.editedNotes;
  }

  private pushToUndoStack(): void {
    if (this.undoStack[this.undoStack.length - 1] !== this.editedNotes) {
      this.undoStack.push(this.editedNotes);
      this.redoStack = []; // Clear redo stack when new action is performed

      // Limit undo stack size
      if (this.undoStack.length > 50) {
        this.undoStack = this.undoStack.slice(-50);
      }
    }
  }

  undoEdit(): void {
    if (this.undoStack.length > 1) {
      this.redoStack.push(this.undoStack.pop()!);
      this.editedNotes = this.undoStack[this.undoStack.length - 1];
      this.lastChange = this.editedNotes;
    }
  }

  redoEdit(): void {
    if (this.redoStack.length > 0) {
      const redoState = this.redoStack.pop()!;
      this.undoStack.push(redoState);
      this.editedNotes = redoState;
      this.lastChange = this.editedNotes;
    }
  }

  cancelEditing(): void {
    if (this.editedNotes !== (this.data.notes || '') && this.editedNotes.trim()) {
      if (confirm('You have unsaved changes. Are you sure you want to cancel?')) {
        this.isEditing = false;
        this.editedNotes = '';
        this.clearUndoStacks();
      }
    } else {
      this.isEditing = false;
      this.editedNotes = '';
      this.clearUndoStacks();
    }
  }

  clearNotes(): void {
    if (confirm('Are you sure you want to clear all notes? This action cannot be undone.')) {
      this.pushToUndoStack();
      this.editedNotes = '';
    }
  }

  private clearUndoStacks(): void {
    this.undoStack = [];
    this.redoStack = [];
    this.lastChange = '';
  }

  async saveNotes(): Promise<void> {
    if (!this.data.id) {
      this.snackBar.open('Error: Problem ID not found', 'Close', { duration: 3000 });
      return;
    }

    this.saving = true;

    try {
      const trimmedNotes = this.editedNotes.trim();

      await this.leetcodeService.updateProblem(this.data.id, {
        notes: trimmedNotes
      });

      // Update the local data
      this.data.notes = trimmedNotes;

      this.isEditing = false;
      this.editedNotes = '';
      this.clearUndoStacks();

      this.snackBar.open(
        trimmedNotes ? 'Notes saved successfully!' : 'Notes cleared successfully!',
        'Close',
        { duration: 3000 }
      );

      // Return the updated notes to the parent component
      this.dialogRef.close(trimmedNotes);

    } catch (error) {
      console.error('Error saving notes:', error);
      this.snackBar.open('Error saving notes. Please try again.', 'Close', { duration: 5000 });
    } finally {
      this.saving = false;
    }
  }
}
