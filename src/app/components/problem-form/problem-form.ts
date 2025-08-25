import { Component, OnInit, ViewChild, ElementRef, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { Observable, startWith, map } from 'rxjs';
import { LeetcodeService } from '../../services/leetcode';
import { Problem } from '../../models/problem';
import { LeetcodeImportComponent } from '../leetcode-import/leetcode-import';

// Common LeetCode problem tags for autocomplete
const COMMON_TAGS = [
  'Array', 'String', 'Hash Table', 'Dynamic Programming', 'Math', 'Sorting',
  'Greedy', 'Depth-First Search', 'Binary Search', 'Database', 'Breadth-First Search',
  'Tree', 'Matrix', 'Two Pointers', 'Bit Manipulation', 'Heap (Priority Queue)',
  'Stack', 'Graph', 'Design', 'Prefix Sum', 'Simulation', 'Counting', 'Backtracking',
  'Sliding Window', 'Union Find', 'Linked List', 'Ordered Set', 'Monotonic Stack',
  'Trie', 'Number Theory', 'Topological Sort', 'Binary Indexed Tree', 'Segment Tree',
  'Binary Search Tree', 'Geometry', 'Memoization', 'Queue', 'Recursion'
];

@Component({
  selector: 'app-problem-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatChipsModule,
    MatAutocompleteModule
  ],
  template: `
    <div class="form-container">
      <div class="form-header">
        <h2 mat-dialog-title>{{ isEdit ? 'Edit Problem' : 'Add New Problem' }}</h2>
        <button mat-icon-button
                type="button"
                (click)="openImportDialog()"
                *ngIf="!isEdit"
                class="import-btn"
                matTooltip="Import from LeetCode">
          <mat-icon>cloud_download</mat-icon>
        </button>
      </div>

      <form [formGroup]="problemForm" (ngSubmit)="onSubmit()">
        <mat-dialog-content>
          <div class="form-content">
            <!-- Import Button - Moved to top with better styling -->
            <div class="import-section" *ngIf="!isEdit">
              <button mat-raised-button
                      color="primary"
                      type="button"
                      (click)="openImportDialog()"
                      class="import-from-leetcode-btn">
                <mat-icon>cloud_download</mat-icon>
                Import from LeetCode
              </button>
              <p class="import-hint">Or add a problem manually below</p>
            </div>

            <!-- LeetCode ID -->
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>LeetCode Problem ID</mat-label>
              <input matInput
                     type="number"
                     formControlName="leetcodeId"
                     placeholder="e.g., 1">
              <mat-hint>The numerical ID from LeetCode</mat-hint>
              <mat-error *ngIf="problemForm.get('leetcodeId')?.hasError('required')">
                Problem ID is required
              </mat-error>
              <mat-error *ngIf="problemForm.get('leetcodeId')?.hasError('min')">
                Problem ID must be a positive number
              </mat-error>
            </mat-form-field>

            <!-- Title -->
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Problem Title</mat-label>
              <input matInput
                     formControlName="title"
                     placeholder="e.g., Two Sum">
              <mat-error *ngIf="problemForm.get('title')?.hasError('required')">
                Title is required
              </mat-error>
            </mat-form-field>

            <!-- URL -->
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>LeetCode URL</mat-label>
              <input matInput
                     formControlName="url"
                     placeholder="https://leetcode.com/problems/two-sum/">
              <mat-error *ngIf="problemForm.get('url')?.hasError('required')">
                URL is required
              </mat-error>
              <mat-error *ngIf="problemForm.get('url')?.hasError('pattern')">
                Please enter a valid URL
              </mat-error>
            </mat-form-field>

            <!-- Difficulty and Status Row -->
            <div class="form-row">
              <mat-form-field appearance="outline">
                <mat-label>Difficulty</mat-label>
                <mat-select formControlName="difficulty">
                  <mat-option value="Easy">Easy</mat-option>
                  <mat-option value="Medium">Medium</mat-option>
                  <mat-option value="Hard">Hard</mat-option>
                </mat-select>
                <mat-error *ngIf="problemForm.get('difficulty')?.hasError('required')">
                  Difficulty is required
                </mat-error>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Status</mat-label>
                <mat-select formControlName="status">
                  <mat-option value="Not Attempted">Not Attempted</mat-option>
                  <mat-option value="Attempted">Attempted</mat-option>
                  <mat-option value="Solved">Solved</mat-option>
                  <mat-option value="Reviewed">Reviewed</mat-option>
                </mat-select>
                <mat-error *ngIf="problemForm.get('status')?.hasError('required')">
                  Status is required
                </mat-error>
              </mat-form-field>
            </div>

            <!-- Attempts and Time Spent Row -->
            <div class="form-row">
              <mat-form-field appearance="outline">
                <mat-label>Attempts</mat-label>
                <input matInput
                       type="number"
                       formControlName="attempts"
                       min="0"
                       placeholder="0">
                <mat-hint>Number of times attempted</mat-hint>
                <mat-error *ngIf="problemForm.get('attempts')?.hasError('min')">
                  Attempts must be 0 or greater
                </mat-error>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Time Spent (minutes)</mat-label>
                <input matInput
                       type="number"
                       formControlName="timeSpent"
                       min="0"
                       placeholder="0">
                <mat-hint>Total time spent in minutes</mat-hint>
                <mat-error *ngIf="problemForm.get('timeSpent')?.hasError('min')">
                  Time must be 0 or greater
                </mat-error>
              </mat-form-field>
            </div>

            <!-- Tags -->
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Tags</mat-label>
              <mat-chip-grid #chipGrid>
                <mat-chip-row
                  *ngFor="let tag of selectedTags"
                  (removed)="removeTag(tag)">
                  {{ tag }}
                  <button matChipRemove>
                    <mat-icon>cancel</mat-icon>
                  </button>
                </mat-chip-row>
              </mat-chip-grid>
              <input matInput
                     #tagInput
                     formControlName="tagInput"
                     [matAutocomplete]="auto"
                     [matChipInputFor]="chipGrid"
                     (matChipInputTokenEnd)="addTag($event)"
                     placeholder="Add tags...">
              <mat-autocomplete #auto="matAutocomplete" (optionSelected)="selectTag($event)">
                <mat-option *ngFor="let tag of filteredTags | async" [value]="tag">
                  {{ tag }}
                </mat-option>
              </mat-autocomplete>
              <mat-hint>Common algorithm categories and data structures</mat-hint>
            </mat-form-field>

            <!-- Notes with Markup Toolbar -->
            <div class="notes-section">
              <label class="notes-label">Notes</label>
              <div class="markup-toolbar">
                <button mat-icon-button
                        type="button"
                        (click)="applyFormat('bold')"
                        title="Bold"
                        class="markup-btn">
                  <mat-icon>format_bold</mat-icon>
                </button>
                <button mat-icon-button
                        type="button"
                        (click)="applyFormat('italic')"
                        title="Italic"
                        class="markup-btn">
                  <mat-icon>format_italic</mat-icon>
                </button>
                <button mat-icon-button
                        type="button"
                        (click)="applyFormat('code')"
                        title="Code"
                        class="markup-btn">
                  <mat-icon>code</mat-icon>
                </button>
                <button mat-icon-button
                        type="button"
                        (click)="applyFormat('bullet')"
                        title="Bullet Point"
                        class="markup-btn">
                  <mat-icon>format_list_bulleted</mat-icon>
                </button>
              </div>
              <mat-form-field appearance="outline" class="full-width textarea-field">
                <textarea matInput
                          #notesTextarea
                          formControlName="notes"
                          rows="4"
                          placeholder="Add your notes, approach, or key insights..."></textarea>
                <mat-hint>Use the toolbar above for formatting</mat-hint>
              </mat-form-field>
            </div>
          </div>
        </mat-dialog-content>

        <mat-dialog-actions align="end">
          <button mat-button
                  type="button"
                  (click)="onCancel()">
            Cancel
          </button>
          <button mat-raised-button
                  color="primary"
                  type="submit"
                  [disabled]="problemForm.invalid">
            {{ isEdit ? 'Update' : 'Add' }} Problem
          </button>
        </mat-dialog-actions>
      </form>
    </div>
  `,
  styles: [`
    .form-container {
      width: 100%;
      max-width: 600px;
      margin: 0 auto;
    }

    .form-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
      padding-bottom: 1rem;
      border-bottom: 1px solid rgba(0, 0, 0, 0.1);
    }

    .form-header h2 {
      margin: 0;
      font-size: 1.5rem;
      font-weight: 500;
      color: var(--mdc-theme-primary);
    }

    .import-btn {
      color: var(--mdc-theme-primary);
      transition: background-color 0.2s ease;
    }

    .import-btn:hover {
      background-color: rgba(103, 80, 164, 0.1);
    }

    .form-content {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
      padding: 0;
    }

    .import-section {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.75rem;
      padding: 1.5rem;
      background: rgba(0, 0, 0, 0.02);
      border: 2px dashed rgba(0, 0, 0, 0.1);
      border-radius: 12px;
      margin-bottom: 1rem;
      transition: all 0.2s ease;
    }

    .import-section:hover {
      background: rgba(0, 0, 0, 0.04);
      border-color: rgba(0, 0, 0, 0.2);
    }

    .import-from-leetcode-btn {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem 2rem;
      font-size: 1rem;
      font-weight: 500;
      min-width: 200px;
      justify-content: center;
    }

    .import-from-leetcode-btn mat-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
      margin: 0;
    }

    .import-hint {
      margin: 0;
      font-size: 0.875rem;
      color: rgba(0, 0, 0, 0.6);
      text-align: center;
      font-style: italic;
    }

    .full-width {
      width: 100%;
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }

    .textarea-field .mat-mdc-text-field-wrapper {
      min-height: 120px;
    }

    .textarea-field textarea {
      min-height: 80px;
      resize: vertical;
    }

    mat-dialog-content {
      max-height: 70vh;
      overflow-y: auto;
      padding: 0 24px;
      margin: 0;
    }

    mat-dialog-actions {
      padding: 16px 24px;
      margin: 0;
      gap: 0.5rem;
    }

    mat-chip-grid {
      margin: 8px 0;
    }

    mat-chip-row {
      margin: 0 8px 8px 0;
    }

    .notes-section {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      width: 100%;
    }

    .notes-label {
      font-size: 0.875rem;
      font-weight: 500;
      color: rgba(0, 0, 0, 0.6);
      margin: 0;
    }

    .markup-toolbar {
      display: flex;
      gap: 0.25rem;
      padding: 0.5rem;
      background: rgba(0, 0, 0, 0.02);
      border: 1px solid rgba(0, 0, 0, 0.1);
      border-radius: 8px 8px 0 0;
      flex-wrap: wrap;
    }

    .markup-btn {
      width: 36px;
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background-color 0.2s ease;
    }

    .markup-btn:hover {
      background-color: rgba(0, 0, 0, 0.04);
    }

    .markup-btn mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
      margin: 0;
    }

    .notes-section .mat-mdc-form-field {
      .mat-mdc-text-field-wrapper {
        border-radius: 0 0 4px 4px;
        border-top: none;
      }
    }

    // Dark theme support
    :host-context(.dark-theme) .form-header {
      border-bottom-color: rgba(255, 255, 255, 0.1);
    }

    :host-context(.dark-theme) .import-section {
      background: rgba(255, 255, 255, 0.02);
      border-color: rgba(255, 255, 255, 0.1);
    }

    :host-context(.dark-theme) .import-section:hover {
      background: rgba(255, 255, 255, 0.04);
      border-color: rgba(255, 255, 255, 0.2);
    }

    :host-context(.dark-theme) .import-hint {
      color: rgba(255, 255, 255, 0.6);
    }

    :host-context(.dark-theme) .notes-label {
      color: rgba(255, 255, 255, 0.7);
    }

    :host-context(.dark-theme) .markup-toolbar {
      background: rgba(255, 255, 255, 0.02);
      border-color: rgba(255, 255, 255, 0.1);
    }

    :host-context(.dark-theme) .markup-btn:hover {
      background-color: rgba(255, 255, 255, 0.04);
    }

    // Responsive design
    @media (max-width: 768px) {
      .form-container {
        max-width: 100%;
      }

      .form-row {
        grid-template-columns: 1fr;
        gap: 1rem;
      }

      .form-header {
        flex-direction: column;
        gap: 1rem;
        align-items: flex-start;
      }

      .import-from-leetcode-btn {
        min-width: 100%;
        padding: 1rem 2rem;
      }

      mat-dialog-content {
        padding: 0 16px;
      }

      mat-dialog-actions {
        padding: 16px;
        flex-direction: column;
        align-items: stretch;
      }

      mat-dialog-actions button {
        width: 100%;
        margin: 0.25rem 0;
      }
    }

    @media (max-width: 480px) {
      .import-section {
        padding: 1rem;
        margin: 0 -0.5rem 1rem -0.5rem;
      }

      .import-from-leetcode-btn {
        padding: 0.875rem 1.5rem;
        font-size: 0.9rem;
      }
    }

    // Enhanced scrollbar for dialog content
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


export class ProblemFormComponent implements OnInit {
  problemForm: FormGroup;
  isEdit = false;
  selectedTags: string[] = [];
  allTags = COMMON_TAGS;
  filteredTags: Observable<string[]>;

  @ViewChild('notesTextarea') notesTextarea!: ElementRef<HTMLTextAreaElement>;

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<ProblemFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: Problem | null,
    private leetcodeService: LeetcodeService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {
    this.isEdit = !!data;
    this.selectedTags = data?.tags || [];

    this.problemForm = this.fb.group({
      leetcodeId: [data?.leetcodeId || '', [Validators.required, Validators.min(1)]],
      title: [data?.title || '', Validators.required],
      url: [data?.url || '', [Validators.required, Validators.pattern(/^https?:\/\/.+/)]],
      difficulty: [data?.difficulty || '', Validators.required],
      status: [data?.status || 'Not Attempted', Validators.required],
      attempts: [data?.attempts || 0, [Validators.min(0)]],
      timeSpent: [data?.timeSpent || 0, [Validators.min(0)]],
      notes: [data?.notes || ''],
      tagInput: ['']
    });

    this.filteredTags = this.problemForm.get('tagInput')!.valueChanges.pipe(
      startWith(''),
      map(value => this._filterTags(value || ''))
    );
  }

  ngOnInit(): void {}

  private _filterTags(value: string): string[] {
    const filterValue = value.toLowerCase();
    return this.allTags.filter(tag =>
      tag.toLowerCase().includes(filterValue) &&
      !this.selectedTags.includes(tag)
    );
  }

  addTag(event: any): void {
    const value = (event.value || '').trim();
    if (value && !this.selectedTags.includes(value)) {
      this.selectedTags.push(value);
      this.problemForm.get('tagInput')?.setValue('');
    }
    event.chipInput!.clear();
  }

  selectTag(event: any): void {
    const value = event.option.value;
    if (value && !this.selectedTags.includes(value)) {
      this.selectedTags.push(value);
      this.problemForm.get('tagInput')?.setValue('');
    }
  }

  removeTag(tag: string): void {
    const index = this.selectedTags.indexOf(tag);
    if (index >= 0) {
      this.selectedTags.splice(index, 1);
    }
  }

  openImportDialog(): void {
    const dialogRef = this.dialog.open(LeetcodeImportComponent, {
      width: '600px',
      maxWidth: '90vw',
      maxHeight: '90vh',
      autoFocus: false,
      disableClose: false
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Problem was imported successfully, close the form
        this.dialogRef.close(true);
      }
    });
  }

  async onSubmit(): Promise<void> {
    if (this.problemForm.valid) {
      try {
        const formValue = this.problemForm.value;
        const problemData = {
          ...formValue,
          tags: this.selectedTags,
          companies: this.data?.companies || []
        };

        delete problemData.tagInput;

        if (this.isEdit && this.data?.id) {
          await this.leetcodeService.updateProblem(this.data.id, problemData);
          this.snackBar.open('Problem updated successfully!', 'Close', {
            duration: 3000,
            panelClass: 'success-snackbar'
          });
        } else {
          await this.leetcodeService.addProblem(problemData);
          this.snackBar.open('Problem added successfully!', 'Close', {
            duration: 3000,
            panelClass: 'success-snackbar'
          });
        }

        this.dialogRef.close(true);
      } catch (error) {
        console.error('Error saving problem:', error);
        this.snackBar.open('Failed to save problem. Please try again.', 'Close', {
          duration: 3000,
          panelClass: 'error-snackbar'
        });
      }
    }
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }

  applyFormat(format: 'bold' | 'italic' | 'code' | 'bullet'): void {
    const textarea = this.notesTextarea.nativeElement;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);
    const beforeText = textarea.value.substring(0, start);
    const afterText = textarea.value.substring(end);

    let formattedText = '';
    let cursorOffset = 0;

    switch (format) {
      case 'bold':
        formattedText = selectedText ? `**${selectedText}**` : '**bold text**';
        cursorOffset = selectedText ? 2 : 2;
        break;
      case 'italic':
        formattedText = selectedText ? `*${selectedText}*` : '*italic text*';
        cursorOffset = selectedText ? 1 : 1;
        break;
      case 'code':
        formattedText = selectedText ? `\`${selectedText}\`` : '`code`';
        cursorOffset = selectedText ? 1 : 1;
        break;
      case 'bullet':
        formattedText = selectedText ? `• ${selectedText}` : '• bullet point';
        cursorOffset = selectedText ? 2 : 2;
        break;
    }

    const newValue = beforeText + formattedText + afterText;

    // Update form control
    this.problemForm.patchValue({ notes: newValue });

    // Update textarea value and focus
    textarea.value = newValue;
    textarea.focus();

    // Set cursor position
    const newCursorPos = selectedText ?
      start + formattedText.length :
      start + cursorOffset;

    setTimeout(() => {
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  }
}
