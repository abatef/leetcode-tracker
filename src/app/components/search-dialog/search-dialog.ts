import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { LeetCodeApiService, LeetCodeProblem } from '../../services/leetcode-api';

interface SearchFilters {
  keyword: string;
  difficulty: 'Easy' | 'Medium' | 'Hard' | '';
}

interface SearchResult {
  id: number;
  title: string;
  titleSlug: string;
  difficulty: string;
  tags: string[];
  isPaidOnly: boolean;
}

@Component({
  selector: 'app-search-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatDividerModule
  ],
  template: `
    <h2 mat-dialog-title>
      <mat-icon>search</mat-icon>
      Search LeetCode Problems
    </h2>

    <mat-dialog-content>
      <!-- Search Form -->
      <div class="search-form">
        <mat-form-field appearance="outline" class="search-input">
          <mat-label>Search keyword</mat-label>
          <input matInput
                 [(ngModel)]="filters.keyword"
                 placeholder="Enter problem title, keyword, or tag"
                 (keyup.enter)="searchProblems()">
          <mat-hint>Search by problem title, description keywords, or tags</mat-hint>
        </mat-form-field>

        <mat-form-field appearance="outline" class="difficulty-select">
          <mat-label>Difficulty</mat-label>
          <mat-select [(value)]="filters.difficulty">
            <mat-option value="">Any Difficulty</mat-option>
            <mat-option value="Easy">Easy</mat-option>
            <mat-option value="Medium">Medium</mat-option>
            <mat-option value="Hard">Hard</mat-option>
          </mat-select>
        </mat-form-field>

        <button mat-raised-button
                color="primary"
                (click)="searchProblems()"
                [disabled]="!filters.keyword.trim() || loading"
                class="search-button">
          <mat-spinner diameter="20" *ngIf="loading"></mat-spinner>
          <mat-icon *ngIf="!loading">search</mat-icon>
          {{ loading ? 'Searching...' : 'Search' }}
        </button>
      </div>

      <mat-divider *ngIf="searchResults.length > 0 || error"></mat-divider>

      <!-- Error Message -->
      <div class="error-message" *ngIf="error">
        <mat-icon>error_outline</mat-icon>
        <span>{{ error }}</span>
      </div>

      <!-- Search Results -->
      <div class="search-results" *ngIf="searchResults.length > 0">
        <div class="results-header">
          <h4>Search Results ({{ searchResults.length }})</h4>
          <span class="results-hint">Click on a problem to import it</span>
        </div>

        <div class="results-list">
          <div class="result-item"
               *ngFor="let problem of searchResults; trackBy: trackByProblem"
               (click)="selectProblem(problem)"
               [class.selected]="selectedProblem?.id === problem.id">

            <div class="problem-header">
              <div class="problem-id-title">
                <span class="problem-id">#{{ problem.id }}</span>
                <h5 class="problem-title">{{ problem.title }}</h5>
              </div>

              <div class="problem-difficulty">
                <span class="difficulty-badge"
                      [ngClass]="'difficulty-' + problem.difficulty.toLowerCase()">
                  {{ problem.difficulty }}
                </span>
                <div class="premium-badge" *ngIf="problem.isPaidOnly">
                  <mat-icon>star</mat-icon>
                  <span>Premium</span>
                </div>
              </div>
            </div>

            <div class="problem-tags" *ngIf="problem.tags.length > 0">
              <mat-chip *ngFor="let tag of problem.tags.slice(0, 4)" class="tag-chip">
                {{ tag }}
              </mat-chip>
              <span *ngIf="problem.tags.length > 4" class="more-tags">
                +{{ problem.tags.length - 4 }} more
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- No Results -->
      <div class="no-results" *ngIf="!loading && searchResults.length === 0 && hasSearched">
        <mat-icon>search_off</mat-icon>
        <h4>No problems found</h4>
        <p>Try adjusting your search terms or removing filters</p>
      </div>

      <!-- Selected Problem Preview -->
      <div class="selected-problem" *ngIf="selectedProblem">
        <mat-divider></mat-divider>
        <div class="selected-header">
          <h4>Selected Problem</h4>
          <span class="problem-url">{{ 'https://leetcode.com/problems/' + selectedProblem.titleSlug }}</span>
        </div>

        <div class="selected-info">
          <div class="selected-title">
            <span class="problem-id">#{{ selectedProblem.id }}</span>
            <span class="title">{{ selectedProblem.title }}</span>
            <span class="difficulty-badge"
                  [ngClass]="'difficulty-' + selectedProblem.difficulty.toLowerCase()">
              {{ selectedProblem.difficulty }}
            </span>
          </div>

          <div class="selected-tags" *ngIf="selectedProblem.tags.length > 0">
            <mat-chip *ngFor="let tag of selectedProblem.tags" class="tag-chip">
              {{ tag }}
            </mat-chip>
          </div>
        </div>
      </div>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-raised-button
              color="primary"
              [disabled]="!selectedProblem"
              (click)="importSelectedProblem()">
        <mat-icon>add</mat-icon>
        Import Problem
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    h2[mat-dialog-title] {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0;
    }

    mat-dialog-content {
      min-width: 600px;
      max-width: 800px;
      max-height: 70vh;
      overflow-y: auto;
      padding: 0 24px 24px;
    }

    .search-form {
      display: flex;
      gap: 1rem;
      align-items: flex-end;
      margin-bottom: 1rem;
      flex-wrap: wrap;
    }

    .search-input {
      flex: 1;
      min-width: 200px;
    }

    .difficulty-select {
      min-width: 140px;
    }

    .search-button {
      height: 56px;
      min-width: 120px;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .error-message {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 1rem;
      background: rgba(244, 67, 54, 0.1);
      border: 1px solid rgba(244, 67, 54, 0.2);
      border-radius: 8px;
      color: #d32f2f;
      margin: 1rem 0;
    }

    .search-results {
      margin-top: 1rem;
    }

    .results-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }

    .results-header h4 {
      margin: 0;
      color: rgba(0, 0, 0, 0.87);
      font-weight: 500;
    }

    .results-hint {
      font-size: 0.8rem;
      color: rgba(0, 0, 0, 0.6);
      font-style: italic;
    }

    .results-list {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      max-height: 300px;
      overflow-y: auto;
      padding-right: 8px;
    }

    .result-item {
      padding: 1rem;
      border: 1px solid rgba(0, 0, 0, 0.1);
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s ease;
      background: rgba(0, 0, 0, 0.02);
    }

    .result-item:hover {
      border-color: rgba(103, 80, 164, 0.3);
      background: rgba(103, 80, 164, 0.05);
      transform: translateY(-1px);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .result-item.selected {
      border-color: var(--mdc-theme-primary);
      background: rgba(103, 80, 164, 0.1);
      box-shadow: 0 2px 8px rgba(103, 80, 164, 0.2);
    }

    .problem-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 0.75rem;
      gap: 1rem;
    }

    .problem-id-title {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      flex: 1;
      min-width: 0;
    }

    .problem-id {
      background: rgba(103, 80, 164, 0.1);
      color: #5b21b6;
      padding: 0.25rem 0.5rem;
      border-radius: 8px;
      font-size: 0.75rem;
      font-weight: 600;
      border: 1px solid rgba(103, 80, 164, 0.2);
      flex-shrink: 0;
    }

    .problem-title {
      margin: 0;
      font-size: 0.9rem;
      font-weight: 500;
      color: rgba(0, 0, 0, 0.87);
      line-height: 1.3;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .problem-difficulty {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      flex-shrink: 0;
    }

    .difficulty-badge {
      padding: 0.25rem 0.5rem;
      border-radius: 8px;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: capitalize;
    }

    .difficulty-easy {
      background-color: rgba(76, 175, 80, 0.1);
      color: #4CAF50;
      border: 1px solid #4CAF50;
    }

    .difficulty-medium {
      background-color: rgba(255, 152, 0, 0.1);
      color: #FF9800;
      border: 1px solid #FF9800;
    }

    .difficulty-hard {
      background-color: rgba(244, 67, 54, 0.1);
      color: #F44336;
      border: 1px solid #F44336;
    }

    .premium-badge {
      display: flex;
      align-items: center;
      gap: 0.25rem;
      background: linear-gradient(135deg, #FFD700, #FFA500);
      color: #000;
      padding: 0.25rem 0.5rem;
      border-radius: 8px;
      font-size: 0.7rem;
      font-weight: 600;
    }

    .premium-badge mat-icon {
      font-size: 12px;
      width: 12px;
      height: 12px;
    }

    .problem-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      align-items: center;
    }

    .tag-chip {
      font-size: 0.7rem;
      height: 20px;
      --mdc-chip-container-height: 20px;
      background: rgba(103, 80, 164, 0.1);
      color: #5b21b6;
      border: 1px solid rgba(103, 80, 164, 0.2);
    }

    .more-tags {
      font-size: 0.7rem;
      color: rgba(0, 0, 0, 0.6);
      font-style: italic;
    }

    .no-results {
      text-align: center;
      padding: 2rem;
      color: rgba(0, 0, 0, 0.6);
    }

    .no-results mat-icon {
      font-size: 3rem;
      width: 3rem;
      height: 3rem;
      margin-bottom: 1rem;
      opacity: 0.5;
    }

    .no-results h4 {
      margin: 0 0 0.5rem 0;
      color: rgba(0, 0, 0, 0.7);
    }

    .no-results p {
      margin: 0;
      font-size: 0.9rem;
    }

    .selected-problem {
      margin-top: 1rem;
      padding-top: 1rem;
    }

    .selected-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }

    .selected-header h4 {
      margin: 0;
      color: rgba(0, 0, 0, 0.87);
      font-weight: 500;
    }

    .problem-url {
      font-size: 0.8rem;
      color: rgba(0, 0, 0, 0.6);
      font-family: 'Roboto Mono', monospace;
    }

    .selected-info {
      background: rgba(103, 80, 164, 0.05);
      border: 1px solid rgba(103, 80, 164, 0.1);
      border-radius: 8px;
      padding: 1rem;
    }

    .selected-title {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 0.75rem;
      flex-wrap: wrap;
    }

    .selected-title .title {
      font-weight: 500;
      color: rgba(0, 0, 0, 0.87);
      flex: 1;
    }

    .selected-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }

    // Dark theme styles
    :host-context(.dark-theme) .results-header h4,
    :host-context(.dark-theme) .selected-header h4 {
      color: rgba(255, 255, 255, 0.9);
    }

    :host-context(.dark-theme) .results-hint,
    :host-context(.dark-theme) .problem-url {
      color: rgba(255, 255, 255, 0.6);
    }

    :host-context(.dark-theme) .result-item {
      border-color: rgba(255, 255, 255, 0.1);
      background: rgba(255, 255, 255, 0.02);
    }

    :host-context(.dark-theme) .result-item:hover {
      border-color: rgba(255, 255, 255, 0.3);
      background: rgba(255, 255, 255, 0.05);
    }

    :host-context(.dark-theme) .result-item.selected {
      background: rgba(103, 80, 164, 0.2);
    }

    :host-context(.dark-theme) .problem-title,
    :host-context(.dark-theme) .selected-title .title {
      color: rgba(255, 255, 255, 0.9);
    }

    :host-context(.dark-theme) .problem-id {
      background: rgba(255, 255, 255, 0.1);
      color: #c4b5fd;
      border-color: rgba(255, 255, 255, 0.2);
    }

    :host-context(.dark-theme) .tag-chip {
      background: rgba(255, 255, 255, 0.1);
      color: #c4b5fd;
      border-color: rgba(255, 255, 255, 0.2);
    }

    :host-context(.dark-theme) .more-tags {
      color: rgba(255, 255, 255, 0.6);
    }

    :host-context(.dark-theme) .selected-info {
      background: rgba(255, 255, 255, 0.05);
      border-color: rgba(255, 255, 255, 0.1);
    }

    :host-context(.dark-theme) .no-results {
      color: rgba(255, 255, 255, 0.6);
    }

    :host-context(.dark-theme) .no-results h4 {
      color: rgba(255, 255, 255, 0.7);
    }

    :host-context(.dark-theme) .error-message {
      background: rgba(244, 67, 54, 0.2);
      border-color: rgba(244, 67, 54, 0.3);
      color: #ff6b6b;
    }

    // Mobile responsive
    @media (max-width: 600px) {
      mat-dialog-content {
        min-width: 300px;
        max-width: 90vw;
      }

      .search-form {
        flex-direction: column;
        align-items: stretch;
      }

      .search-button {
        height: 48px;
      }

      .problem-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.5rem;
      }

      .problem-id-title {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.5rem;
      }

      .problem-title {
        white-space: normal;
        overflow: visible;
        text-overflow: unset;
      }

      .selected-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.5rem;
      }

      .selected-title {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.5rem;
      }
    }

    // Scrollbar styling
    .results-list {
      scrollbar-width: thin;
      scrollbar-color: rgba(103, 80, 164, 0.3) rgba(0, 0, 0, 0.05);
    }

    .results-list::-webkit-scrollbar {
      width: 6px;
    }

    .results-list::-webkit-scrollbar-track {
      background: rgba(0, 0, 0, 0.03);
      border-radius: 3px;
    }

    .results-list::-webkit-scrollbar-thumb {
      background: rgba(103, 80, 164, 0.3);
      border-radius: 3px;
      transition: background-color 0.2s ease;
    }

    .results-list::-webkit-scrollbar-thumb:hover {
      background: rgba(103, 80, 164, 0.5);
    }
  `]
})
export class SearchDialogComponent implements OnInit {
  filters: SearchFilters = {
    keyword: '',
    difficulty: ''
  };

  searchResults: SearchResult[] = [];
  selectedProblem: SearchResult | null = null;
  loading = false;
  error: string | null = null;
  hasSearched = false;

  constructor(
    public dialogRef: MatDialogRef<SearchDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private leetcodeApi: LeetCodeApiService
  ) {}

  ngOnInit(): void {
    // If initial keyword is provided
    if (this.data?.keyword) {
      this.filters.keyword = this.data.keyword;
    }
  }

  async searchProblems(): Promise<void> {
    if (!this.filters.keyword.trim()) {
      return;
    }

    this.loading = true;
    this.error = null;
    this.searchResults = [];
    this.selectedProblem = null;
    this.hasSearched = false;

    try {
      const problems = await this.leetcodeApi.searchProblems(
        this.filters.keyword.trim(),
        50 // Get more results
      ).toPromise();

      if (problems) {
        // Filter by difficulty if specified
        let filteredProblems = problems;
        if (this.filters.difficulty) {
          filteredProblems = problems.filter(p =>
            p.difficulty === this.filters.difficulty
          );
        }

        // Transform to search results format
        this.searchResults = filteredProblems.map(problem => ({
          id: problem.questionFrontendId ?
              parseInt(problem.questionFrontendId) :
              (problem.id || 0),
          title: problem.title,
          titleSlug: problem.titleSlug,
          difficulty: problem.difficulty,
          tags: problem.tags || [],
          isPaidOnly: problem.isPaidOnly || false
        }));

        this.hasSearched = true;
      }
    } catch (error: any) {
      console.error('Search error:', error);
      this.error = error.message || 'Failed to search problems. Please try again.';
      this.hasSearched = true;
    } finally {
      this.loading = false;
    }
  }

  selectProblem(problem: SearchResult): void {
    this.selectedProblem = problem;
  }

  trackByProblem(index: number, problem: SearchResult): any {
    return problem.id;
  }

  importSelectedProblem(): void {
    if (this.selectedProblem) {
      // Convert SearchResult to LeetCodeProblem format
      const leetcodeProblem: LeetCodeProblem = {
        id: this.selectedProblem.id,
        questionFrontendId: this.selectedProblem.id.toString(),
        title: this.selectedProblem.title,
        titleSlug: this.selectedProblem.titleSlug,
        difficulty: this.selectedProblem.difficulty,
        tags: this.selectedProblem.tags,
        isPaidOnly: this.selectedProblem.isPaidOnly
      };

      this.dialogRef.close(leetcodeProblem);
    }
  }
}
