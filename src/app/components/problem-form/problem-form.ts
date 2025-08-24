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
                  [disabled]="isLoading || !problemForm.get('leetcodeId')?.value">
            <mat-icon *ngIf="!isLoading">cloud_download</mat-icon>
            <mat-spinner *ngIf="isLoading" diameter="16"></mat-spinner>
            {{ isLoading ? 'Fetching...' : 'Auto-fetch from LeetCode' }}
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
                  Easy
                </div>
              </mat-option>
              <mat-option value="Medium">
                <div class="difficulty-option medium">
                  <mat-icon>sentiment_neutral</mat-icon>
                  Medium
                </div>
              </mat-option>
              <mat-option value="Hard">
                <div class="difficulty-option hard">
                  <mat-icon>sentiment_very_dissatisfied</mat-icon>
                  Hard
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
                  Not Attempted
                </div>
              </mat-option>
              <mat-option value="Attempted">
                <div class="status-option attempted">
                  <mat-icon>partial_fulfillment</mat-icon>
                  Attempted
                </div>
              </mat-option>
              <mat-option value="Solved">
                <div class="status-option solved">
                  <mat-icon>check_circle</mat-icon>
                  Solved
                </div>
              </mat-option>
              <mat-option value="Reviewed">
                <div class="status-option reviewed">
                  <mat-icon>verified</mat-icon>
                  Reviewed
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

        <!-- Tags Section -->
        <div class="tags-section">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Tags</mat-label>
            <mat-chip-grid #chipGrid>
              <mat-chip-row
                *ngFor="let tag of tags"
                (removed)="removeTag(tag)"
                [removable]="true">
                {{ tag }}
                <mat-icon matChipRemove>cancel</mat-icon>
              </mat-chip-row>
            </mat-chip-grid>
            <input
              #tagInput
              matInput
              [matAutocomplete]="tagAutocomplete"
              [matChipInputFor]="chipGrid"
              [matChipInputSeparatorKeyCodes]="separatorKeysCodes"
              (matChipInputTokenEnd)="addTag($event)"
              placeholder="Type to add tags...">
            <mat-autocomplete
              #tagAutocomplete="matAutocomplete"
              (optionSelected)="selectedTag($event)">
              <mat-option *ngFor="let tag of filteredTags | async" [value]="tag">
                {{ tag }}
              </mat-option>
            </mat-autocomplete>
          </mat-form-field>
          <div class="tag-suggestions">
            <span class="suggestion-label">Suggestions:</span>
            <button type="button"
                    mat-chip-option
                    *ngFor="let tag of getTagSuggestions()"
                    (click)="addSuggestedTag(tag)"
                    class="suggestion-chip">
              {{ tag }}
            </button>
          </div>
        </div>

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

        <!-- Difficulty Rating Slider -->
        <div class="slider-section">
          <label class="slider-label">Personal Difficulty Rating</label>
          <mat-slider
            min="1"
            max="10"
            step="1"
            showTickMarks
            discrete
            formControlName="personalRating">
            <input matSliderThumb formControlName="personalRating">
          </mat-slider>
          <div class="slider-labels">
            <span>Very Easy</span>
            <span>Very Hard</span>
          </div>
        </div>

        <!-- Notes -->
        <mat-form-field appearance="outline" class="full-width notes-field">
          <mat-label>Notes</mat-label>
          <textarea matInput
                    formControlName="notes"
                    rows="4"
                    placeholder="Add your notes, approach, solution details, or key insights..."></textarea>
          <mat-icon matSuffix>notes</mat-icon>
          <mat-hint>Share your approach, key insights, or things to remember</mat-hint>
        </mat-form-field>

        <!-- Advanced Options -->
        <div class="advanced-section">
          <button type="button"
                  mat-button
                  (click)="showAdvanced = !showAdvanced"
                  class="toggle-advanced">
            <mat-icon>{{ showAdvanced ? 'expand_less' : 'expand_more' }}</mat-icon>
            {{ showAdvanced ? 'Hide' : 'Show' }} Advanced Options
          </button>

          <div class="advanced-options" [class.show]="showAdvanced">
            <div class="form-row">
              <mat-form-field appearance="outline">
                <mat-label>Company Tag</mat-label>
                <mat-select formControlName="companyTag" multiple>
                  <mat-option *ngFor="let company of commonCompanies" [value]="company">
                    {{ company }}
                  </mat-option>
                </mat-select>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Priority</mat-label>
                <mat-select formControlName="priority">
                  <mat-option value="Low">Low</mat-option>
                  <mat-option value="Medium">Medium</mat-option>
                  <mat-option value="High">High</mat-option>
                </mat-select>
              </mat-form-field>
            </div>

            <div class="checkbox-options">
              <mat-checkbox formControlName="isBookmarked">
                <mat-icon>bookmark</mat-icon>
                Bookmark this problem
              </mat-checkbox>

              <mat-checkbox formControlName="needsReview">
                <mat-icon>flag</mat-icon>
                Needs review later
              </mat-checkbox>
            </div>
          </div>
        </div>

      </form>
    </mat-dialog-content>

    <mat-dialog-actions align="end" class="dialog-actions">
      <button mat-button (click)="onCancel()" [disabled]="isLoading">
        Cancel
      </button>
      <button mat-button
              color="accent"
              (click)="saveDraft()"
              [disabled]="isLoading || problemForm.pristine"
              *ngIf="!data">
        <mat-icon>save</mat-icon>
        Save as Draft
      </button>
      <button mat-raised-button
              color="primary"
              (click)="onSave()"
              [disabled]="problemForm.invalid || isLoading">
        <mat-spinner *ngIf="isLoading" diameter="16"></mat-spinner>
        <mat-icon *ngIf="!isLoading">{{ data ? 'save' : 'add' }}</mat-icon>
        {{ isLoading ? 'Saving...' : (data ? 'Update Problem' : 'Add Problem') }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .dialog-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 1.5rem 0;
    }

    .dialog-header h2 {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin: 0;
      font-weight: 500;
    }

    .close-button {
      margin-right: -8px;
    }

    .dialog-content {
      padding: 1rem 1.5rem !important;
      max-height: 70vh;
      overflow-y: auto;
    }

    .problem-form {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      min-width: 600px;
      max-width: 800px;
    }

    .form-row {
      display: flex;
      gap: 1rem;
    }

    .form-row mat-form-field {
      flex: 1;
    }

    .id-field {
      flex: 0 0 140px;
    }

    .title-field {
      flex: 1;
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

    .fetch-hint {
      font-size: 0.8rem;
      color: rgba(0, 0, 0, 0.6);
    }

    .difficulty-option, .status-option {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .difficulty-option.easy mat-icon { color: #4CAF50; }
    .difficulty-option.medium mat-icon { color: #FFC107; }
    .difficulty-option.hard mat-icon { color: #F44336; }

    .status-option.solved mat-icon { color: #4CAF50; }
    .status-option.attempted mat-icon { color: #FFC107; }
    .status-option.not-attempted mat-icon { color: #9E9E9E; }
    .status-option.reviewed mat-icon { color: #3F51B5; }

    .tags-section {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .tag-suggestions {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      align-items: center;
    }

    .suggestion-label {
      font-size: 0.8rem;
      color: rgba(0, 0, 0, 0.6);
      margin-right: 0.5rem;
    }

    .suggestion-chip {
      font-size: 0.75rem;
      min-height: 28px;
    }

    .slider-section {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      margin: 0.5rem 0;
    }

    .slider-label {
      font-size: 0.9rem;
      font-weight: 500;
      color: rgba(0, 0, 0, 0.7);
    }

    .slider-labels {
      display: flex;
      justify-content: space-between;
      font-size: 0.8rem;
      color: rgba(0, 0, 0, 0.6);
      margin-top: -0.5rem;
    }

    .notes-field textarea {
      min-height: 80px;
    }

    .advanced-section {
      border-top: 1px solid rgba(0, 0, 0, 0.1);
      padding-top: 1rem;
    }

    .toggle-advanced {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 1rem;
    }

    .advanced-options {
      display: none;
      flex-direction: column;
      gap: 1rem;
    }

    .advanced-options.show {
      display: flex;
    }

    .checkbox-options {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .checkbox-options mat-checkbox {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .dialog-actions {
      padding: 1rem 1.5rem;
      gap: 0.5rem;
    }

    .dialog-actions button {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    @media (max-width: 700px) {
      .problem-form {
        min-width: 300px;
      }

      .form-row {
        flex-direction: column;
        gap: 0;
      }

      .id-field {
        flex: 1;
      }

      .dialog-content {
        padding: 1rem !important;
      }

      .dialog-header {
        padding: 1rem 1rem 0;
      }

      .dialog-actions {
        padding: 1rem;
        flex-wrap: wrap;
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
