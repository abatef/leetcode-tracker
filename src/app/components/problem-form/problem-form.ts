import { Component, Inject, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSliderModule } from '@angular/material/slider';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { Problem } from '../../models/problem';
import { LeetcodeService } from '../../services/leetcode';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { MatChipInputEvent } from '@angular/material/chips';
import { Observable, startWith, map } from 'rxjs';

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
    MatSliderModule,
    MatCheckboxModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatAutocompleteModule
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

          <!-- Problem ID and Title Row -->
          <div class="form-row">
            <mat-form-field appearance="outline" class="id-field">
              <mat-label>Problem ID</mat-label>
              <input matInput
                     formControlName="leetcodeId"
                     type="number"
                     placeholder="1"
                     (blur)="onProblemIdChange()">
              <mat-icon matSuffix>tag</mat-icon>
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
                     formControlName="title"
                     placeholder="Two Sum"
                     #titleInput>
              <mat-icon matSuffix>title</mat-icon>
              <mat-error *ngIf="problemForm.get('title')?.errors?.['required']">
                Problem title is required
              </mat-error>
            </mat-form-field>
          </div>

          <!-- Auto-fetch button -->
          <div class="fetch-section" *ngIf="!data">
            <button type="button"
                    mat-stroked-button
                    color="primary"
                    (click)="fetchProblemDetails()"
                    [disabled]="isLoading || !problemForm.get('leetcodeId')?.value"
                    class="fetch-button">
              <mat-icon *ngIf="!isLoading">cloud_download</mat-icon>
              <mat-spinner *ngIf="isLoading" diameter="16"></mat-spinner>
              <span>{{ isLoading ? 'Fetching...' : 'Auto-fetch from LeetCode' }}</span>
            </button>
            <span class="fetch-hint">Fill in the Problem ID and click to auto-populate details</span>
          </div>

          <!-- Difficulty and Status Row -->
          <div class="form-row">
            <mat-form-field appearance="outline">
              <mat-label>Difficulty</mat-label>
              <mat-select formControlName="difficulty">
                <mat-option value="Easy">
                  <div class="difficulty-option easy">
                    <mat-icon>sentiment_satisfied</mat-icon>
                    <span>Easy</span>
                  </div>
                </mat-option>
                <mat-option value="Medium">
                  <div class="difficulty-option medium">
                    <mat-icon>sentiment_neutral</mat-icon>
                    <span>Medium</span>
                  </div>
                </mat-option>
                <mat-option value="Hard">
                  <div class="difficulty-option hard">
                    <mat-icon>sentiment_very_dissatisfied</mat-icon>
                    <span>Hard</span>
                  </div>
                </mat-option>
              </mat-select>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Status</mat-label>
              <mat-select formControlName="status" (selectionChange)="onStatusChange($event)">
                <mat-option value="Not Attempted">
                  <div class="status-option not-attempted">
                    <mat-icon>radio_button_unchecked</mat-icon>
                    <span>Not Attempted</span>
                  </div>
                </mat-option>
                <mat-option value="Attempted">
                  <div class="status-option attempted">
                    <mat-icon>partial_fulfillment</mat-icon>
                    <span>Attempted</span>
                  </div>
                </mat-option>
                <mat-option value="Solved">
                  <div class="status-option solved">
                    <mat-icon>check_circle</mat-icon>
                    <span>Solved</span>
                  </div>
                </mat-option>
                <mat-option value="Reviewed">
                  <div class="status-option reviewed">
                    <mat-icon>verified</mat-icon>
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
                   formControlName="url"
                   placeholder="https://leetcode.com/problems/two-sum/">
            <mat-icon matSuffix>link</mat-icon>
            <mat-error *ngIf="problemForm.get('url')?.errors?.['required']">
              Problem URL is required
            </mat-error>
            <mat-error *ngIf="problemForm.get('url')?.errors?.['pattern']">
              Please enter a valid LeetCode problem URL
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
              <mat-icon matSuffix>refresh</mat-icon>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Time Spent (minutes)</mat-label>
              <input matInput
                     formControlName="timeSpent"
                     type="number"
                     min="0"
                     max="1440">
              <mat-icon matSuffix>access_time</mat-icon>
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

          <!-- Notes -->
          <mat-form-field appearance="outline" class="full-width notes-field">
            <mat-label>Notes</mat-label>
            <textarea matInput
                      formControlName="notes"
                      rows="3"
                      placeholder="Add your notes, approach, solution details, or key insights..."></textarea>
            <mat-icon matSuffix>notes</mat-icon>
            <mat-hint>Share your approach, key insights, or things to remember</mat-hint>
          </mat-form-field>

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
      padding: 0.5rem 1rem;
    }

    .fetch-button mat-icon,
    .fetch-button mat-spinner {
      margin: 0 !important;
    }

    .fetch-hint {
      font-size: 0.8rem;
      color: rgba(0, 0, 0, 0.6);
      line-height: 1.4;
    }

    .difficulty-option, .status-option {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.25rem 0;
    }

    .difficulty-option mat-icon, .status-option mat-icon {
      width: 20px;
      height: 20px;
      font-size: 20px;
      line-height: 20px;
      margin: 0;
    }

    .difficulty-option.easy mat-icon { color: #4CAF50; }
    .difficulty-option.medium mat-icon { color: #FF9800; }
    .difficulty-option.hard mat-icon { color: #F44336; }

    .status-option.solved mat-icon { color: #4CAF50; }
    .status-option.attempted mat-icon { color: #FF9800; }
    .status-option.not-attempted mat-icon { color: #9E9E9E; }
    .status-option.reviewed mat-icon { color: #3F51B5; }

    .notes-field textarea {
      min-height: 80px;
      resize: vertical;
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
      gap: 0.5rem;
      min-width: 140px;
    }

    .save-button mat-icon,
    .save-button mat-spinner {
      margin: 0 !important;
    }

    /* Dark theme overrides for the form */
    :host-context(.dark-theme) {
      .fetch-hint {
        color: rgba(255, 255, 255, 0.6);
      }

      .dialog-actions {
        border-top: 1px solid rgba(255, 255, 255, 0.1);
      }
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
    }
  `]
})
export class ProblemFormComponent implements OnInit {
  @ViewChild('tagInput') tagInput!: ElementRef<HTMLInputElement>;

  problemForm: FormGroup;
  isLoading = false;
  showAdvanced = false;
  showSolvedDate = false;

  // Tags
  tags: string[] = [];
  separatorKeysCodes: number[] = [ENTER, COMMA];
  filteredTags: Observable<string[]>;

  // Common companies for autocomplete
  commonCompanies = [
    'Google', 'Amazon', 'Microsoft', 'Facebook', 'Apple', 'Netflix', 'Uber',
    'Adobe', 'LinkedIn', 'Twitter', 'Airbnb', 'Salesforce', 'Oracle', 'IBM'
  ];

  constructor(
    private fb: FormBuilder,
    private leetcodeService: LeetcodeService,
    private snackBar: MatSnackBar,
    public dialogRef: MatDialogRef<ProblemFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: Problem | null
  ) {
    this.problemForm = this.createForm();
    this.filteredTags = this.problemForm.get('tagInput')!.valueChanges.pipe(
      startWith(''),
      map((value: string | null) => this._filterTags(value || ''))
    );
  }

  ngOnInit(): void {
    if (this.data) {
      this.populateForm(this.data);
    }

    // Watch status changes to show/hide solved date
    this.problemForm.get('status')?.valueChanges.subscribe(status => {
      this.showSolvedDate = status === 'Solved';
      if (status === 'Solved' && !this.problemForm.get('solvedDate')?.value) {
        this.problemForm.patchValue({ solvedDate: new Date() });
      }
    });
  }

  private createForm(): FormGroup {
    return this.fb.group({
      leetcodeId: ['', [Validators.required, Validators.min(1)]],
      title: ['', Validators.required],
      difficulty: ['Easy', Validators.required],
      status: ['Not Attempted', Validators.required],
      url: ['', [Validators.required, this.leetcodeUrlValidator]],
      tagInput: [''],
      attempts: [0, [Validators.required, Validators.min(0)]],
      timeSpent: [0, [Validators.required, Validators.min(0)]],
      notes: [''],
      solvedDate: [null],
      personalRating: [5],
      companyTag: [[]],
      priority: ['Medium'],
      isBookmarked: [false],
      needsReview: [false]
    });
  }

  private populateForm(problem: Problem): void {
    this.tags = [...problem.tags];
    this.showSolvedDate = problem.status === 'Solved';

    this.problemForm.patchValue({
      leetcodeId: problem.leetcodeId,
      title: problem.title,
      difficulty: problem.difficulty,
      status: problem.status,
      url: problem.url,
      attempts: problem.attempts,
      timeSpent: problem.timeSpent,
      notes: problem.notes,
      solvedDate: problem.solvedDate,
      personalRating: (problem as any).personalRating || 5,
      companyTag: (problem as any).companyTag || [],
      priority: (problem as any).priority || 'Medium',
      isBookmarked: (problem as any).isBookmarked || false,
      needsReview: (problem as any).needsReview || false
    });
  }

  private leetcodeUrlValidator(control: AbstractControl): {[key: string]: any} | null {
    if (!control.value) return null;
    const urlPattern = /^https:\/\/leetcode\.com\/problems\/.+/;
    return urlPattern.test(control.value) ? null : { 'pattern': { value: control.value } };
  }

  private _filterTags(value: string): string[] {
    const filterValue = value.toLowerCase();
    return COMMON_TAGS
      .filter(tag => tag.toLowerCase().includes(filterValue))
      .filter(tag => !this.tags.includes(tag));
  }

  async fetchProblemDetails(): Promise<void> {
    const leetcodeId = this.problemForm.get('leetcodeId')?.value;
    if (!leetcodeId) return;

    this.isLoading = true;
    try {
      // This is a mock implementation - in a real app you'd call a backend service
      // that scrapes LeetCode or uses their API
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate API call

      // Mock data based on problem ID
      const mockData = this.generateMockProblemData(leetcodeId);

      this.problemForm.patchValue({
        title: mockData.title,
        difficulty: mockData.difficulty,
        url: mockData.url
      });

      this.tags = [...mockData.tags];

      this.snackBar.open('Problem details fetched successfully!', 'Close', { duration: 3000 });
    } catch (error) {
      console.error('Failed to fetch problem details:', error);
      this.snackBar.open('Failed to fetch problem details. Please fill manually.', 'Close', { duration: 5000 });
    } finally {
      this.isLoading = false;
    }
  }

  private generateMockProblemData(id: number): any {
    // Mock data generation - replace with actual API call
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

  onProblemIdChange(): void {
    const leetcodeId = this.problemForm.get('leetcodeId')?.value;
    if (leetcodeId && !this.problemForm.get('url')?.value) {
      // Auto-generate URL if not provided
      const baseUrl = 'https://leetcode.com/problems/problem-' + leetcodeId + '/';
      this.problemForm.patchValue({ url: baseUrl });
    }
  }

  onStatusChange(event: any): void {
    const status = event.value;
    this.showSolvedDate = status === 'Solved';

    if (status === 'Solved' && !this.problemForm.get('solvedDate')?.value) {
      this.problemForm.patchValue({ solvedDate: new Date() });
    }
  }

  // Tag management methods
  addTag(event: MatChipInputEvent): void {
    const value = (event.value || '').trim();
    if (value && !this.tags.includes(value)) {
      this.tags.push(value);
    }
    event.chipInput!.clear();
    this.problemForm.get('tagInput')?.setValue('');
  }

  removeTag(tag: string): void {
    const index = this.tags.indexOf(tag);
    if (index >= 0) {
      this.tags.splice(index, 1);
    }
  }

  selectedTag(event: any): void {
    const tag = event.option.value;
    if (!this.tags.includes(tag)) {
      this.tags.push(tag);
    }
    this.tagInput.nativeElement.value = '';
    this.problemForm.get('tagInput')?.setValue('');
  }

  addSuggestedTag(tag: string): void {
    if (!this.tags.includes(tag)) {
      this.tags.push(tag);
    }
  }

  getTagSuggestions(): string[] {
    const difficulty = this.problemForm.get('difficulty')?.value;
    const suggestions: {[key: string]: string[]} = {
      'Easy': ['Array', 'String', 'Hash Table', 'Math'],
      'Medium': ['Dynamic Programming', 'Tree', 'Graph', 'Backtracking'],
      'Hard': ['Dynamic Programming', 'Graph', 'Tree', 'Backtracking', 'Binary Search']
    };

    return suggestions[difficulty]?.filter(tag => !this.tags.includes(tag)).slice(0, 3) || [];
  }

  async saveDraft(): Promise<void> {
    // Save as draft (status = 'Not Attempted', minimal validation)
    this.problemForm.patchValue({ status: 'Not Attempted' });
    await this.saveForm(true);
  }

  async onSave(): Promise<void> {
    await this.saveForm(false);
  }

  private async saveForm(isDraft: boolean): Promise<void> {
    if (this.problemForm.invalid && !isDraft) return;

    this.isLoading = true;
    try {
      const formValue = this.problemForm.value;

      const problemData: Omit<Problem, 'id' | 'userId' | 'createdAt' | 'updatedAt'> = {
        leetcodeId: formValue.leetcodeId,
        title: formValue.title,
        difficulty: formValue.difficulty,
        status: formValue.status,
        url: formValue.url,
        tags: [...this.tags],
        attempts: formValue.attempts,
        timeSpent: formValue.timeSpent,
        notes: formValue.notes,
        solvedDate: formValue.status === 'Solved' ? formValue.solvedDate : undefined,
        lastAttemptDate: formValue.status !== 'Not Attempted' ? new Date() : undefined
      };

      // Add extended properties
      const extendedData = {
        ...problemData,
        personalRating: formValue.personalRating,
        companyTag: formValue.companyTag,
        priority: formValue.priority,
        isBookmarked: formValue.isBookmarked,
        needsReview: formValue.needsReview,
        isDraft
      };

      if (this.data?.id) {
        await this.leetcodeService.updateProblem(this.data.id, extendedData);
        this.snackBar.open('Problem updated successfully!', 'Close', { duration: 3000 });
      } else {
        await this.leetcodeService.addProblem(extendedData);
        this.snackBar.open(
          isDraft ? 'Problem saved as draft!' : 'Problem added successfully!',
          'Close',
          { duration: 3000 }
        );
      }

      this.dialogRef.close(true);
    } catch (error) {
      console.error('Failed to save problem:', error);
      this.snackBar.open('Failed to save problem. Please try again.', 'Close', { duration: 5000 });
    } finally {
      this.isLoading = false;
    }
  }

  onCancel(): void {
    if (this.problemForm.dirty) {
      const confirmed = confirm('You have unsaved changes. Are you sure you want to cancel?');
      if (!confirmed) return;
    }
    this.dialogRef.close(false);
  }
}
