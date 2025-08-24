import { Component, Inject, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { Problem } from '../../models/problem';

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
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatChipsModule,
    MatIconModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatAutocompleteModule,
    MatCheckboxModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
  ],
  template: `
    <div class="dialog-container">
      <div class="dialog-header">
        <h2 mat-dialog-title>
          <mat-icon>{{ data ? 'edit' : 'add' }}</mat-icon>
          {{ data ? 'Edit Problem' : 'Add New Problem' }}
        </h2>
        <button mat-icon-button mat-dialog-close class="close-button">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <mat-dialog-content class="dialog-content">
        <form [formGroup]="problemForm" class="problem-form">

          <!-- Auto-fetch Option -->
          <div class="auto-fetch-option" *ngIf="!data">
            <mat-checkbox formControlName="autoFetch" color="primary">
              Auto-fetch problem details from LeetCode
            </mat-checkbox>
            <p class="auto-fetch-hint">When enabled, problem details will be fetched automatically when you enter the Problem ID</p>
          </div>

          <!-- Problem ID and Title Row -->
          <div class="form-row">
            <mat-form-field appearance="outline" class="id-field">
              <mat-label>Problem ID</mat-label>
              <input matInput
                     formControlName="leetcodeId"
                     type="number"
                     (blur)="onProblemIdChange()">
              <mat-error *ngIf="problemForm.get('leetcodeId')?.errors?.['required']">
                Problem ID is required
              </mat-error>
              <mat-error *ngIf="problemForm.get('leetcodeId')?.errors?.['min']">
                Problem ID must be greater than 0
              </mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline" class="title-field">
              <mat-label>Problem Title</mat-label>
              <input matInput
                     formControlName="title">
              <mat-error *ngIf="problemForm.get('title')?.errors?.['required']">
                Problem title is required
              </mat-error>
            </mat-form-field>
          </div>

          <!-- Manual fetch button (only show if auto-fetch is disabled) -->
          <div class="fetch-section" *ngIf="!data && !problemForm.get('autoFetch')?.value">
            <button type="button"
                    mat-stroked-button
                    color="primary"
                    (click)="fetchProblemDetails()"
                    [disabled]="isLoading || !problemForm.get('leetcodeId')?.value"
                    class="fetch-button">
              <mat-spinner *ngIf="isLoading" diameter="16"></mat-spinner>
              <mat-icon *ngIf="!isLoading">cloud_download</mat-icon>
              <span>{{ isLoading ? 'Fetching...' : 'Fetch from LeetCode' }}</span>
            </button>
          </div>

          <!-- Difficulty and Status Row -->
          <div class="form-row">
            <mat-form-field appearance="outline">
              <mat-label>Difficulty</mat-label>
              <mat-select formControlName="difficulty">
                <mat-option value="Easy">
                  <div class="select-option">
                    <mat-icon class="difficulty-icon easy">sentiment_satisfied</mat-icon>
                    <span>Easy</span>
                  </div>
                </mat-option>
                <mat-option value="Medium">
                  <div class="select-option">
                    <mat-icon class="difficulty-icon medium">sentiment_neutral</mat-icon>
                    <span>Medium</span>
                  </div>
                </mat-option>
                <mat-option value="Hard">
                  <div class="select-option">
                    <mat-icon class="difficulty-icon hard">sentiment_very_dissatisfied</mat-icon>
                    <span>Hard</span>
                  </div>
                </mat-option>
              </mat-select>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Status</mat-label>
              <mat-select formControlName="status" (selectionChange)="onStatusChange($event)">
                <mat-option value="Not Attempted">
                  <div class="select-option">
                    <mat-icon class="status-icon not-attempted">radio_button_unchecked</mat-icon>
                    <span>Not Attempted</span>
                  </div>
                </mat-option>
                <mat-option value="Attempted">
                  <div class="select-option">
                    <mat-icon class="status-icon attempted">partial_fulfillment</mat-icon>
                    <span>Attempted</span>
                  </div>
                </mat-option>
                <mat-option value="Solved">
                  <div class="select-option">
                    <mat-icon class="status-icon solved">check_circle</mat-icon>
                    <span>Solved</span>
                  </div>
                </mat-option>
                <mat-option value="Reviewed">
                  <div class="select-option">
                    <mat-icon class="status-icon reviewed">verified</mat-icon>
                    <span>Reviewed</span>
                  </div>
                </mat-option>
              </mat-select>
            </mat-form-field>
          </div>

          <!-- Problem URL -->
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Problem URL</mat-label>
            <input matInput
                   formControlName="url">
            <mat-error *ngIf="problemForm.get('url')?.errors?.['required']">
              Problem URL is required
            </mat-error>
          </mat-form-field>

          <!-- Attempts and Time Spent -->
          <div class="form-row">
            <mat-form-field appearance="outline">
              <mat-label>Attempts</mat-label>
              <input matInput
                     formControlName="attempts"
                     type="number"
                     min="0"
                     max="100">
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Time Spent (minutes)</mat-label>
              <input matInput
                     formControlName="timeSpent"
                     type="number"
                     min="0"
                     max="1440">
            </mat-form-field>
          </div>

          <!-- Solved Date (only show if status is Solved) -->
          <mat-form-field appearance="outline" class="full-width" *ngIf="showSolvedDate">
            <mat-label>Solved Date</mat-label>
            <input matInput
                   [matDatepicker]="solvedDatePicker"
                   formControlName="solvedDate"
                   readonly>
            <mat-datepicker-toggle matSuffix [for]="solvedDatePicker"></mat-datepicker-toggle>
            <mat-datepicker #solvedDatePicker></mat-datepicker>
          </mat-form-field>

          <!-- Tags Section -->
          <div class="tags-section">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Add Tag</mat-label>
              <input matInput
                     #tagInput
                     [matAutocomplete]="auto"
                     (keyup.enter)="addTag(tagInput.value); tagInput.value = ''">
              <mat-autocomplete #auto="matAutocomplete" (optionSelected)="addTag($event.option.value); tagInput.value = ''">
                <mat-option *ngFor="let tag of filteredTags" [value]="tag">
                  {{ tag }}
                </mat-option>
              </mat-autocomplete>
            </mat-form-field>

            <div class="selected-tags" *ngIf="selectedTags.length > 0">
              <div class="tags-list">
                <span class="tag-chip" *ngFor="let tag of selectedTags">
                  {{ tag }}
                  <mat-icon (click)="removeTag(tag)" class="remove-tag">close</mat-icon>
                </span>
              </div>
            </div>
          </div>

          <!-- Notes with Markdown Support -->
          <div class="notes-section">
            <mat-form-field appearance="outline" class="full-width notes-field">
              <mat-label>Notes</mat-label>
              <textarea matInput
                        #notesTextarea
                        formControlName="notes"
                        rows="4"></textarea>
              <mat-hint>Markdown formatting supported: **bold**, *italic*, - bullets, 1. numbers, \`code\`</mat-hint>
            </mat-form-field>

            <!-- Markdown Toolbar -->
            <div class="markdown-toolbar">
              <button type="button" mat-icon-button (click)="insertMarkdown('bold')" title="Bold">
                <mat-icon>format_bold</mat-icon>
              </button>
              <button type="button" mat-icon-button (click)="insertMarkdown('italic')" title="Italic">
                <mat-icon>format_italic</mat-icon>
              </button>
              <button type="button" mat-icon-button (click)="insertMarkdown('bullet')" title="Bullet List">
                <mat-icon>format_list_bulleted</mat-icon>
              </button>
              <button type="button" mat-icon-button (click)="insertMarkdown('number')" title="Numbered List">
                <mat-icon>format_list_numbered</mat-icon>
              </button>
              <button type="button" mat-icon-button (click)="insertMarkdown('code')" title="Code">
                <mat-icon>code</mat-icon>
              </button>
            </div>
          </div>

        </form>
      </mat-dialog-content>

      <mat-dialog-actions align="end" class="dialog-actions">
        <button mat-button (click)="onCancel()" [disabled]="isLoading">
          Cancel
        </button>
        <button mat-raised-button
                color="primary"
                (click)="onSave()"
                [disabled]="problemForm.invalid || isLoading"
                class="save-button">
          <mat-spinner *ngIf="isLoading" diameter="16"></mat-spinner>
          <mat-icon *ngIf="!isLoading">{{ data ? 'save' : 'add' }}</mat-icon>
          <span>{{ isLoading ? 'Saving...' : (data ? 'Update Problem' : 'Add Problem') }}</span>
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .dialog-container {
      width: 100%;
      max-width: 600px;
      min-width: 500px;
    }

    .dialog-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 1.5rem 0;
      margin-bottom: 1rem;
    }

    .dialog-header h2 {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin: 0;
      font-weight: 500;
      font-size: 1.5rem;
    }

    .dialog-header h2 mat-icon {
      width: 24px;
      height: 24px;
      font-size: 24px;
      line-height: 24px;
    }

    .close-button {
      margin-right: -8px;
    }

    .dialog-content {
      padding: 0 1.5rem !important;
      max-height: 70vh;
      overflow-y: auto;
    }

    .problem-form {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
      width: 100%;
    }

    .auto-fetch-option {
      padding: 1rem;
      background-color: rgba(63, 81, 181, 0.1);
      border-radius: 8px;
      border-left: 4px solid #3f51b5;
    }

    .auto-fetch-option mat-checkbox {
      margin-bottom: 0.5rem;
    }

    .auto-fetch-hint {
      margin: 0;
      font-size: 0.875rem;
      color: rgba(0, 0, 0, 0.6);
      line-height: 1.4;
    }

    .form-row {
      display: flex;
      gap: 1rem;
      align-items: flex-start;
    }

    .form-row mat-form-field {
      flex: 1;
    }

    .id-field {
      flex: 0 0 140px;
      min-width: 140px;
    }

    .title-field {
      flex: 1;
      min-width: 200px;
    }

    .full-width {
      width: 100%;
    }

    .fetch-section {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      align-items: flex-start;
      margin: -0.5rem 0 0.5rem 0;
    }

    .fetch-button {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding: 0.75rem 1.5rem;
      height: 48px;
      border-radius: 8px;
      font-weight: 500;
    }

    .fetch-button mat-icon,
    .fetch-button mat-spinner {
      margin: 0 !important;
      width: 20px;
      height: 20px;
      font-size: 20px;
    }

    .select-option {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.25rem 0;
    }

    .select-option mat-icon {
      width: 20px;
      height: 20px;
      font-size: 20px;
      margin: 0;
    }

    .difficulty-icon.easy {
      color: #4CAF50;
    }

    .difficulty-icon.medium {
      color: #FF9800;
    }

    .difficulty-icon.hard {
      color: #F44336;
    }

    .status-icon.solved {
      color: #4CAF50;
    }

    .status-icon.attempted {
      color: #FF9800;
    }

    .status-icon.not-attempted {
      color: #9E9E9E;
    }

    .status-icon.reviewed {
      color: #3F51B5;
    }

    .tags-section {
      margin: 0.5rem 0;
    }

    .selected-tags {
      margin-top: 1rem;
    }

    .tags-list {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }

    .tag-chip {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 0.75rem;
      background-color: rgba(63, 81, 181, 0.1);
      border: 1px solid rgba(63, 81, 181, 0.3);
      border-radius: 20px;
      font-size: 0.875rem;
      color: #3f51b5;
      font-weight: 500;
    }

    .remove-tag {
      font-size: 18px;
      width: 18px;
      height: 18px;
      cursor: pointer;
      opacity: 0.7;
      transition: opacity 0.2s ease;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .remove-tag:hover {
      opacity: 1;
      background-color: rgba(63, 81, 181, 0.2);
    }

    .notes-section {
      position: relative;
    }

    .notes-field textarea {
      min-height: 100px;
      resize: vertical;
      font-family: 'Roboto Mono', monospace;
    }

    .markdown-toolbar {
      display: flex;
      gap: 0.25rem;
      margin-top: 0.5rem;
      padding: 0.5rem;
      background-color: rgba(0, 0, 0, 0.05);
      border-radius: 4px;
    }

    .markdown-toolbar button {
      width: 36px;
      height: 36px;
    }

    .markdown-toolbar mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    .dialog-actions {
      padding: 1.5rem;
      gap: 1rem;
      border-top: 1px solid rgba(0, 0, 0, 0.1);
      margin-top: 1rem;
    }

    .save-button {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.75rem;
      min-width: 160px;
      height: 48px;
      font-weight: 500;
      border-radius: 8px;
    }

    .save-button mat-icon,
    .save-button mat-spinner {
      margin: 0 !important;
      width: 20px;
      height: 20px;
      font-size: 20px;
    }

    /* Dark theme overrides for the form */
    :host-context(.dark-theme) .auto-fetch-hint {
      color: rgba(255, 255, 255, 0.6);
    }

    :host-context(.dark-theme) .dialog-actions {
      border-top: 1px solid rgba(255, 255, 255, 0.1);
    }

    :host-context(.dark-theme) .auto-fetch-option {
      background-color: rgba(63, 81, 181, 0.2);
    }

    :host-context(.dark-theme) .tag-chip {
      background-color: rgba(63, 81, 181, 0.2);
      color: #9fa8da;
      border-color: rgba(159, 168, 218, 0.3);
    }

    :host-context(.dark-theme) .remove-tag:hover {
      background-color: rgba(159, 168, 218, 0.3);
    }

    :host-context(.dark-theme) .markdown-toolbar {
      background-color: rgba(255, 255, 255, 0.05);
    }

    @media (max-width: 600px) {
      .dialog-container {
        min-width: 280px;
        max-width: 90vw;
      }

      .form-row {
        flex-direction: column;
        gap: 1rem;
      }

      .id-field {
        flex: 1;
        min-width: auto;
      }

      .dialog-content {
        padding: 0 1rem !important;
        max-height: 60vh;
      }

      .dialog-header {
        padding: 1rem 1rem 0;
      }

      .dialog-actions {
        padding: 1rem;
        flex-wrap: wrap;
      }

      .save-button {
        min-width: auto;
        flex: 1;
      }

      .fetch-button {
        width: 100%;
      }
    }
  `]
})
export class ProblemFormComponent implements OnInit {
  @ViewChild('notesTextarea') notesTextarea!: ElementRef<HTMLTextAreaElement>;

  problemForm: FormGroup;
  selectedTags: string[] = [];
  filteredTags: string[] = COMMON_TAGS;
  isLoading = false;
  showSolvedDate = false;

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<ProblemFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: Problem | null
  ) {
    this.problemForm = this.fb.group({
      leetcodeId: ['', [Validators.required, Validators.min(1)]],
      title: ['', Validators.required],
      difficulty: ['Easy', Validators.required],
      status: ['Not Attempted', Validators.required],
      url: ['', Validators.required],
      notes: [''],
      attempts: [0, [Validators.min(0)]],
      timeSpent: [0, [Validators.min(0)]],
      solvedDate: [null],
      autoFetch: [true]
    });
  }

  ngOnInit(): void {
    if (this.data) {
      this.problemForm.patchValue({
        leetcodeId: this.data.leetcodeId,
        title: this.data.title,
        difficulty: this.data.difficulty,
        status: this.data.status,
        url: this.data.url,
        notes: this.data.notes,
        attempts: this.data.attempts,
        timeSpent: this.data.timeSpent,
        solvedDate: this.data.solvedDate,
        autoFetch: false
      });
      this.selectedTags = [...this.data.tags];
      this.showSolvedDate = this.data.status === 'Solved';
    }

    this.problemForm.get('status')?.valueChanges.subscribe(status => {
      this.showSolvedDate = status === 'Solved';
      if (status === 'Solved' && !this.problemForm.get('solvedDate')?.value) {
        this.problemForm.patchValue({ solvedDate: new Date() });
      }
    });

    this.problemForm.get('leetcodeId')?.valueChanges.subscribe(() => {
      if (this.problemForm.get('autoFetch')?.value && !this.data) {
        const leetcodeId = this.problemForm.get('leetcodeId')?.value;
        if (leetcodeId && leetcodeId > 0) {
          setTimeout(() => this.fetchProblemDetails(), 500);
        }
      }
    });
  }

  onProblemIdChange(): void {
    const leetcodeId = this.problemForm.get('leetcodeId')?.value;
    const title = this.problemForm.get('title')?.value;
    if (leetcodeId && title && !this.problemForm.get('url')?.value) {
      const slug = title.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
      this.problemForm.patchValue({
        url: `https://leetcode.com/problems/${slug}/`
      });
    }
  }

  onStatusChange(event: any): void {
    const status = event.value;
    this.showSolvedDate = status === 'Solved';
    if (status === 'Solved' && !this.problemForm.get('solvedDate')?.value) {
      this.problemForm.patchValue({ solvedDate: new Date() });
    }
  }

  addTag(tag: string): void {
    if (tag && !this.selectedTags.includes(tag)) {
      this.selectedTags.push(tag);
    }
  }

  removeTag(tag: string): void {
    const index = this.selectedTags.indexOf(tag);
    if (index >= 0) {
      this.selectedTags.splice(index, 1);
    }
  }

  insertMarkdown(type: string): void {
    const textarea = this.notesTextarea.nativeElement;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);
    const notesControl = this.problemForm.get('notes');
    let newText = '';

    switch (type) {
      case 'bold':
        newText = selectedText ? `**${selectedText}**` : '**bold text**';
        break;
      case 'italic':
        newText = selectedText ? `*${selectedText}*` : '*italic text*';
        break;
      case 'bullet':
        newText = selectedText ? `- ${selectedText}` : '- bullet point';
        break;
      case 'number':
        newText = selectedText ? `1. ${selectedText}` : '1. numbered item';
        break;
      case 'code':
        newText = selectedText ? `\`${selectedText}\`` : '`code`';
        break;
    }

    const currentValue = notesControl?.value || '';
    const newValue = currentValue.substring(0, start) + newText + currentValue.substring(end);
    notesControl?.setValue(newValue);

    // Set cursor position
    setTimeout(() => {
      const newPosition = start + newText.length;
      textarea.setSelectionRange(newPosition, newPosition);
      textarea.focus();
    });
  }

  async fetchProblemDetails(): Promise<void> {
    const leetcodeId = this.problemForm.get('leetcodeId')?.value;
    if (!leetcodeId) return;

    this.isLoading = true;
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));

      const mockData = this.generateMockProblemData(leetcodeId);

      this.problemForm.patchValue({
        title: mockData.title,
        difficulty: mockData.difficulty,
        url: mockData.url
      });

      this.selectedTags = [...mockData.tags];
    } catch (error) {
      console.error('Failed to fetch problem details:', error);
    } finally {
      this.isLoading = false;
    }
  }

  private generateMockProblemData(id: number): any {
    const mockProblems: {[key: number]: any} = {
      1: { title: 'Two Sum', difficulty: 'Easy', tags: ['Array', 'Hash Table'] },
      2: { title: 'Add Two Numbers', difficulty: 'Medium', tags: ['Linked List', 'Math'] },
      3: { title: 'Longest Substring Without Repeating Characters', difficulty: 'Medium', tags: ['Hash Table', 'String', 'Sliding Window'] },
      4: { title: 'Median of Two Sorted Arrays', difficulty: 'Hard', tags: ['Array', 'Binary Search', 'Divide and Conquer'] }
    };

    const problem = mockProblems[id] || {
      title: `Problem ${id}`,
      difficulty: 'Medium',
      tags: ['Array']
    };

    return {
      ...problem,
      url: `https://leetcode.com/problems/${problem.title.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '')}/`
    };
  }

  async onSave(): Promise<void> {
    if (this.problemForm.invalid) return;

    this.isLoading = true;
    try {
      const formValue = this.problemForm.value;
      const problemData = {
        leetcodeId: formValue.leetcodeId,
        title: formValue.title,
        difficulty: formValue.difficulty,
        status: formValue.status,
        url: formValue.url,
        tags: [...this.selectedTags],
        attempts: formValue.attempts,
        timeSpent: formValue.timeSpent,
        notes: formValue.notes,
        solvedDate: formValue.status === 'Solved' ? formValue.solvedDate : undefined,
        lastAttemptDate: formValue.status !== 'Not Attempted' ? new Date() : undefined
      };

      this.dialogRef.close(problemData);
    } catch (error) {
      console.error('Failed to save problem:', error);
    } finally {
      this.isLoading = false;
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
