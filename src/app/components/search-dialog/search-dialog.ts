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
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { LeetCodeApiService, LeetCodeProblem } from '../../services/leetcode-api';
import { LeetcodeService } from '../../services/leetcode';
import { Problem } from '../../models/problem';
import { Observable } from 'rxjs';

interface SearchFilters {
  keyword: string;
  difficulty: 'Easy' | 'Medium' | 'Hard' | '';
  searchScope: 'leetcode' | 'user';
}

interface RandomFilters {
  difficulty: 'Easy' | 'Medium' | 'Hard' | '';
  topic: string;
}

interface SearchResult {
  id: number;
  title: string;
  titleSlug: string;
  difficulty: string;
  tags: string[];
  isPaidOnly: boolean;
}

// Common LeetCode topics/tags
const POPULAR_TOPICS = [
  'Array', 'String', 'Hash Table', 'Dynamic Programming', 'Math', 'Sorting',
  'Greedy', 'Depth-First Search', 'Binary Search', 'Breadth-First Search',
  'Tree', 'Matrix', 'Two Pointers', 'Bit Manipulation', 'Heap (Priority Queue)',
  'Stack', 'Graph', 'Design', 'Prefix Sum', 'Simulation', 'Counting',
  'Backtracking', 'Sliding Window', 'Union Find', 'Linked List', 'Trie',
  'Binary Search Tree', 'Recursion', 'Divide and Conquer', 'Memoization'
];

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
    MatDividerModule,
    MatButtonToggleModule,
    MatCheckboxModule
  ],
  template: `
    <h2 mat-dialog-title>
      <mat-icon>search</mat-icon>
      Search & Discover Problems
    </h2>

    <mat-dialog-content>
      <!-- Search Type Toggle -->
      <div class="search-type-toggle">
        <mat-button-toggle-group [(value)]="searchType" (change)="onSearchTypeChange()">
          <mat-button-toggle value="search">
            <mat-icon>search</mat-icon>
            Search Problems
          </mat-button-toggle>
          <mat-button-toggle value="random">
            <mat-icon>shuffle</mat-icon>
            Random Problem
          </mat-button-toggle>
        </mat-button-toggle-group>
      </div>

      <!-- Search Section -->
      <div class="search-section" *ngIf="searchType === 'search'">
        <div class="search-form">
          <!-- Search Scope -->
          <div class="search-scope">
            <mat-checkbox
              [(ngModel)]="searchInUserProblems"
              (change)="onSearchScopeChange()"
              color="primary">
              Search only in my problems ({{ userProblemsCount }})
            </mat-checkbox>
          </div>

          <mat-form-field appearance="outline" class="search-input">
            <mat-label>Search keyword</mat-label>
            <input matInput
                   [(ngModel)]="searchFilters.keyword"
                   placeholder="Enter problem title, keyword, or tag"
                   (keyup.enter)="searchProblems()">
            <mat-hint>
              {{ searchInUserProblems ? 'Search within your saved problems' : 'Search by problem title, description keywords, or tags' }}
            </mat-hint>
          </mat-form-field>

          <mat-form-field appearance="outline" class="difficulty-select">
            <mat-label>Difficulty</mat-label>
            <mat-select [(value)]="searchFilters.difficulty">
              <mat-option value="">Any Difficulty</mat-option>
              <mat-option value="Easy">Easy</mat-option>
              <mat-option value="Medium">Medium</mat-option>
              <mat-option value="Hard">Hard</mat-option>
            </mat-select>
          </mat-form-field>

          <button mat-raised-button
                  color="primary"
                  (click)="searchProblems()"
                  [disabled]="!searchFilters.keyword.trim() || searchLoading"
                  class="search-button">
            <mat-spinner diameter="20" *ngIf="searchLoading"></mat-spinner>
            <mat-icon *ngIf="!searchLoading">search</mat-icon>
            {{ searchLoading ? 'Searching...' : 'Search' }}
          </button>
        </div>

        <!-- Search Results -->
        <div class="results-container" *ngIf="searchResults.length > 0 || searchError || hasSearched">
          <mat-divider></mat-divider>

          <!-- Error Message -->
          <div class="error-message" *ngIf="searchError">
            <mat-icon>error_outline</mat-icon>
            <span>{{ searchError }}</span>
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
          <div class="no-results" *ngIf="!searchLoading && searchResults.length === 0 && hasSearched">
            <mat-icon>search_off</mat-icon>
            <h4>No problems found</h4>
            <p>{{ searchInUserProblems ? 'No problems in your list match the search criteria' : 'Try adjusting your search terms or removing filters' }}</p>
          </div>
        </div>
      </div>

      <!-- Random Problem Section -->
      <div class="random-section" *ngIf="searchType === 'random'">
        <div class="random-form">
          <div class="random-filters">
            <mat-form-field appearance="outline" class="topic-select">
              <mat-label>Topic (Optional)</mat-label>
              <mat-select [(value)]="randomFilters.topic">
                <mat-option value="">Any Topic</mat-option>
                <mat-option *ngFor="let topic of availableTopics" [value]="topic">
                  {{ topic }}
                </mat-option>
              </mat-select>
              <mat-hint>Select a specific topic to focus on</mat-hint>
            </mat-form-field>

            <mat-form-field appearance="outline" class="difficulty-select">
              <mat-label>Difficulty</mat-label>
              <mat-select [(value)]="randomFilters.difficulty">
                <mat-option value="">Any Difficulty</mat-option>
                <mat-option value="Easy">Easy</mat-option>
                <mat-option value="Medium">Medium</mat-option>
                <mat-option value="Hard">Hard</mat-option>
              </mat-select>
            </mat-form-field>
          </div>

          <button mat-raised-button
                  color="accent"
                  (click)="getRandomProblem()"
                  [disabled]="randomLoading"
                  class="random-button">
            <mat-spinner diameter="20" *ngIf="randomLoading"></mat-spinner>
            <mat-icon *ngIf="!randomLoading">shuffle</mat-icon>
            {{ randomLoading ? 'Finding...' : 'Get Random Problem' }}
          </button>
        </div>

        <!-- Random Problem Result -->
        <div class="random-result" *ngIf="randomProblem || randomError">
          <mat-divider></mat-divider>

          <!-- Error Message -->
          <div class="error-message" *ngIf="randomError">
            <mat-icon>error_outline</mat-icon>
            <span>{{ randomError }}</span>
          </div>

          <!-- Random Problem Display -->
          <div class="random-problem-display" *ngIf="randomProblem">
            <div class="random-header">
              <h4>Random Problem Found!</h4>
              <div class="random-filters-applied" *ngIf="randomFilters.topic || randomFilters.difficulty">
                <mat-chip *ngIf="randomFilters.topic" class="filter-chip">{{ randomFilters.topic }}</mat-chip>
                <mat-chip *ngIf="randomFilters.difficulty" class="filter-chip">{{ randomFilters.difficulty }}</mat-chip>
              </div>
            </div>

            <div class="random-problem-item"
                 (click)="selectRandomProblem()"
                 [class.selected]="selectedProblem?.id === randomProblem.id">

              <div class="problem-header">
                <div class="problem-id-title">
                  <span class="problem-id">#{{ randomProblem.id }}</span>
                  <h5 class="problem-title">{{ randomProblem.title }}</h5>
                </div>

                <div class="problem-difficulty">
                  <span class="difficulty-badge"
                        [ngClass]="'difficulty-' + randomProblem.difficulty.toLowerCase()">
                    {{ randomProblem.difficulty }}
                  </span>
                  <div class="premium-badge" *ngIf="randomProblem.isPaidOnly">
                    <mat-icon>star</mat-icon>
                    <span>Premium</span>
                  </div>
                </div>
              </div>

              <div class="problem-tags" *ngIf="randomProblem.tags.length > 0">
                <mat-chip *ngFor="let tag of randomProblem.tags.slice(0, 5)" class="tag-chip">
                  {{ tag }}
                </mat-chip>
                <span *ngIf="randomProblem.tags.length > 5" class="more-tags">
                  +{{ randomProblem.tags.length - 5 }} more
                </span>
              </div>
            </div>

            <div class="random-actions">
              <button mat-button (click)="getRandomProblem()" [disabled]="randomLoading">
                <mat-icon>refresh</mat-icon>
                Get Another
              </button>
            </div>
          </div>
        </div>
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

      <!-- Import Error -->
      <div class="import-error" *ngIf="importError">
        <mat-divider></mat-divider>
        <div class="error-message">
          <mat-icon>error_outline</mat-icon>
          <span>{{ importError }}</span>
        </div>
      </div>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-raised-button
              color="primary"
              [disabled]="!selectedProblem || importLoading"
              (click)="importSelectedProblem()">
        <mat-spinner diameter="20" *ngIf="importLoading"></mat-spinner>
        <mat-icon *ngIf="!importLoading">add</mat-icon>
        {{ importLoading ? 'Importing...' : 'Import Problem' }}
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
      min-width: 700px;
      max-width: 900px;
      max-height: 80vh;
      overflow-y: auto;
      padding: 0 24px 24px;
    }

    .search-type-toggle {
      margin-bottom: 1.5rem;
      display: flex;
      justify-content: center;
    }

    .search-type-toggle mat-button-toggle-group {
      border: 1px solid rgba(0, 0, 0, 0.12);
      border-radius: 8px;
    }

    .search-type-toggle mat-button-toggle {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0 16px;
      height: 48px;
    }

    .search-section,
    .random-section {
      margin-bottom: 1rem;
    }

    .search-scope {
      margin-bottom: 1rem;
      padding: 0.75rem;
      background: rgba(103, 80, 164, 0.05);
      border: 1px solid rgba(103, 80, 164, 0.1);
      border-radius: 8px;
    }

    .search-form,
    .random-form {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      margin-bottom: 1rem;
    }

    .search-form .search-input {
      flex: 1;
    }

    .search-form > div:last-of-type {
      display: flex;
      gap: 1rem;
      align-items: flex-end;
      flex-wrap: wrap;
    }

    .random-filters {
      display: flex;
      gap: 1rem;
      align-items: flex-end;
      flex-wrap: wrap;
    }

    .topic-select,
    .difficulty-select {
      min-width: 200px;
      flex: 1;
    }

    .search-button,
    .random-button {
      height: 56px;
      min-width: 140px;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .random-button {
      align-self: flex-start;
    }

    .results-container,
    .random-result {
      margin-top: 1rem;
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

    .result-item,
    .random-problem-item {
      padding: 1rem;
      border: 1px solid rgba(0, 0, 0, 0.1);
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s ease;
      background: rgba(0, 0, 0, 0.02);
    }

    .result-item:hover,
    .random-problem-item:hover {
      border-color: rgba(103, 80, 164, 0.3);
      background: rgba(103, 80, 164, 0.05);
      transform: translateY(-1px);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .result-item.selected,
    .random-problem-item.selected {
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

    .filter-chip {
      font-size: 0.8rem;
      height: 24px;
      --mdc-chip-container-height: 24px;
      background: rgba(33, 150, 243, 0.1);
      color: #1976d2;
      border: 1px solid rgba(33, 150, 243, 0.2);
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

    .random-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
      flex-wrap: wrap;
      gap: 1rem;
    }

    .random-header h4 {
      margin: 0;
      color: rgba(0, 0, 0, 0.87);
      font-weight: 500;
    }

    .random-filters-applied {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
    }

    .random-actions {
      margin-top: 1rem;
      display: flex;
      justify-content: center;
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
    :host-context(.dark-theme) .selected-header h4,
    :host-context(.dark-theme) .random-header h4 {
      color: rgba(255, 255, 255, 0.9);
    }

    :host-context(.dark-theme) .results-hint,
    :host-context(.dark-theme) .problem-url {
      color: rgba(255, 255, 255, 0.6);
    }

    :host-context(.dark-theme) .result-item,
    :host-context(.dark-theme) .random-problem-item {
      border-color: rgba(255, 255, 255, 0.1);
      background: rgba(255, 255, 255, 0.02);
    }

    :host-context(.dark-theme) .result-item:hover,
    :host-context(.dark-theme) .random-problem-item:hover {
      border-color: rgba(255, 255, 255, 0.3);
      background: rgba(255, 255, 255, 0.05);
    }

    :host-context(.dark-theme) .result-item.selected,
    :host-context(.dark-theme) .random-problem-item.selected {
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

    :host-context(.dark-theme) .filter-chip {
      background: rgba(33, 150, 243, 0.2);
      color: #64b5f6;
      border-color: rgba(33, 150, 243, 0.3);
    }

    :host-context(.dark-theme) .more-tags {
      color: rgba(255, 255, 255, 0.6);
    }

    :host-context(.dark-theme) .selected-info {
      background: rgba(255, 255, 255, 0.05);
      border-color: rgba(255, 255, 255, 0.1);
    }

    :host-context(.dark-theme) .search-scope {
      background: rgba(103, 80, 164, 0.1);
      border-color: rgba(103, 80, 164, 0.2);
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
    @media (max-width: 800px) {
      mat-dialog-content {
        min-width: 300px;
        max-width: 95vw;
      }

      .search-form > div:last-of-type,
      .random-filters {
        flex-direction: column;
        align-items: stretch;
      }

      .search-button,
      .random-button {
        height: 48px;
        width: 100%;
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

      .selected-header,
      .random-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.5rem;
      }

      .selected-title {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.5rem;
      }

      .search-type-toggle mat-button-toggle {
        padding: 0 12px;
        height: 40px;
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

    .import-error {
      margin-top: 1rem;
    }

    .import-error .error-message {
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

    .import-error .error-message mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    :host-context(.dark-theme) .import-error .error-message {
      background: rgba(244, 67, 54, 0.2);
      border-color: rgba(244, 67, 54, 0.3);
      color: #ff6b6b;
    }
  `]
})
export class SearchDialogComponent implements OnInit {
  searchType: 'search' | 'random' = 'search';

  searchFilters: SearchFilters = {
    keyword: '',
    difficulty: '',
    searchScope: 'leetcode'
  };

  randomFilters: RandomFilters = {
    difficulty: '',
    topic: ''
  };

  searchInUserProblems = false;
  availableTopics = POPULAR_TOPICS;
  userProblemsCount = 0;

  searchResults: SearchResult[] = [];
  randomProblem: SearchResult | null = null;
  selectedProblem: SearchResult | null = null;

  searchLoading = false;
  randomLoading = false;
  importLoading = false;
  importError: string | null = null;
  searchError: string | null = null;
  randomError: string | null = null;
  hasSearched = false;

  userProblems: Problem[] = [];

  constructor(
    public dialogRef: MatDialogRef<SearchDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private leetcodeApi: LeetCodeApiService,
    private leetcodeService: LeetcodeService
  ) {}

  ngOnInit(): void {
    // If initial keyword is provided
    if (this.data?.keyword) {
      this.searchFilters.keyword = this.data.keyword;
    }

    // Load user problems for local search
    this.leetcodeService.problems$.subscribe(problems => {
      this.userProblems = problems;
      this.userProblemsCount = problems.length;
    });
  }

  onSearchTypeChange(): void {
    // Clear previous results and errors
    this.searchResults = [];
    this.randomProblem = null;
    this.selectedProblem = null;
    this.searchError = null;
    this.randomError = null;
    this.hasSearched = false;
  }

  onSearchScopeChange(): void {
    this.searchFilters.searchScope = this.searchInUserProblems ? 'user' : 'leetcode';
    // Clear previous results when scope changes
    this.searchResults = [];
    this.selectedProblem = null;
    this.searchError = null;
    this.hasSearched = false;
  }

  async searchProblems(): Promise<void> {
    if (!this.searchFilters.keyword.trim()) {
      return;
    }

    this.searchLoading = true;
    this.searchError = null;
    this.searchResults = [];
    this.selectedProblem = null;
    this.hasSearched = false;

    try {
      if (this.searchInUserProblems) {
        // Search in user's problems
        this.searchInUserList();
      } else {
        // Search in LeetCode API
        await this.searchInLeetCode();
      }
      this.hasSearched = true;
    } catch (error: any) {
      console.error('Search error:', error);
      this.searchError = error.message || 'Failed to search problems. Please try again.';
      this.hasSearched = true;
    } finally {
      this.searchLoading = false;
    }
  }

  private searchInUserList(): void {
    const keyword = this.searchFilters.keyword.toLowerCase().trim();
    const difficulty = this.searchFilters.difficulty;

    let filteredProblems = this.userProblems.filter(problem => {
      // Search in title, tags, and companies
      const matchesKeyword =
        problem.title.toLowerCase().includes(keyword) ||
        problem.tags.some(tag => tag.toLowerCase().includes(keyword)) ||
        problem.companies.some(company => company.toLowerCase().includes(keyword));

      // Filter by difficulty if specified
      const matchesDifficulty = !difficulty || problem.difficulty === difficulty;

      return matchesKeyword && matchesDifficulty;
    });

    // Convert to SearchResult format
    this.searchResults = filteredProblems.map(problem => ({
      id: problem.leetcodeId,
      title: problem.title,
      titleSlug: this.generateTitleSlug(problem.title),
      difficulty: problem.difficulty,
      tags: problem.tags,
      isPaidOnly: false // User problems are already accessible
    }));
  }

  private generateTitleSlug(title: string): string {
    return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }

  private async searchInLeetCode(): Promise<void> {
    const problems = await this.leetcodeApi.searchProblems(
      this.searchFilters.keyword.trim(),
      50
    ).toPromise();

    if (problems) {
      // Filter by difficulty if specified
      let filteredProblems = problems;
      if (this.searchFilters.difficulty) {
        filteredProblems = problems.filter(p =>
          p.difficulty === this.searchFilters.difficulty
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
    }
  }

  async getRandomProblem(): Promise<void> {
    this.randomLoading = true;
    this.randomError = null;
    this.randomProblem = null;
    this.selectedProblem = null;

    try {
      let randomProblemData: LeetCodeProblem;

      if (this.randomFilters.topic) {
        // Get problems by tag first, then filter
        const problems = await this.leetcodeApi.getProblemsByTag(
          this.randomFilters.topic,
          100
        ).toPromise();

        if (!problems || problems.length === 0) {
          throw new Error(`No problems found for topic: ${this.randomFilters.topic}`);
        }

        // Filter by difficulty if specified
        let filteredProblems = problems;
        if (this.randomFilters.difficulty) {
          filteredProblems = problems.filter(p => p.difficulty === this.randomFilters.difficulty);
        }

        if (filteredProblems.length === 0) {
          throw new Error(`No ${this.randomFilters.difficulty || ''} problems found for topic: ${this.randomFilters.topic}`);
        }

        // Pick random problem
        const randomIndex = Math.floor(Math.random() * filteredProblems.length);
        randomProblemData = filteredProblems[randomIndex];
      } else {
        // Get random problem by difficulty only
        const result = await this.leetcodeApi.getRandomProblem(
          this.randomFilters.difficulty as any
        ).toPromise();

        if (!result) {
          throw new Error('No random problem found with the specified criteria');
        }

        randomProblemData = result;
      }

      if (randomProblemData) {
        this.randomProblem = {
          id: randomProblemData.questionFrontendId ?
              parseInt(randomProblemData.questionFrontendId) :
              (randomProblemData.id || 0),
          title: randomProblemData.title,
          titleSlug: randomProblemData.titleSlug,
          difficulty: randomProblemData.difficulty,
          tags: randomProblemData.tags || [],
          isPaidOnly: randomProblemData.isPaidOnly || false
        };
      } else {
        throw new Error('No random problem found with the specified criteria');
      }
    } catch (error: any) {
      console.error('Random problem error:', error);
      this.randomError = error.message || 'Failed to get random problem. Please try again.';
    } finally {
      this.randomLoading = false;
    }
  }

  importSelectedProblem(): Promise<void> {
    if (!this.selectedProblem) {
      return Promise.resolve();
    }

    this.importLoading = true;
    this.importError = null; // Clear previous errors

    try {
      // Check if problem already exists
      const existingProblems = this.userProblems;
      const existingProblem = existingProblems.find(p => p.leetcodeId === this.selectedProblem!.id);

      if (existingProblem) {
        this.importError = `Problem "${this.selectedProblem.title}" is already in your list.`;
        this.importLoading = false;
        return Promise.resolve();
      }

      // Convert SearchResult to the format expected by LeetcodeService.addProblem
      const problemToAdd: Omit<Problem, 'id' | 'userId' | 'createdAt' | 'updatedAt'> = {
        leetcodeId: this.selectedProblem.id,
        title: this.selectedProblem.title,
        difficulty: this.selectedProblem.difficulty as 'Easy' | 'Medium' | 'Hard',
        status: 'Not Attempted',
        url: `https://leetcode.com/problems/${this.selectedProblem.titleSlug}/`,
        tags: this.selectedProblem.tags || [],
        attempts: 0,
        timeSpent: 0,
        notes: '',
        companies: [],
        solvedDate: null,
        lastAttemptDate: null,
        firstAttemptDate: null,
        firstSolvedDate: null
      };

      console.log('Importing problem:', problemToAdd);

      return this.leetcodeService.addProblem(problemToAdd).then(() => {
        // Close dialog with success indication
        this.dialogRef.close({
          success: true,
          problem: problemToAdd,
          message: `"${problemToAdd.title}" has been added to your problem list!`
        });
      }).catch((error: any) => {
        console.error('Error importing problem:', error);
        this.importError = error.message || 'Failed to import problem. Please try again.';
      }).finally(() => {
        this.importLoading = false;
      });

    } catch (error: any) {
      console.error('Error importing problem:', error);
      this.importError = error.message || 'Failed to import problem. Please try again.';
      this.importLoading = false;
      return Promise.resolve();
    }
  }

  selectProblem(problem: SearchResult): void {
    this.selectedProblem = problem;
    this.importError = null; // Clear any previous import errors
  }

  selectRandomProblem(): void {
    if (this.randomProblem) {
      this.selectedProblem = this.randomProblem;
      this.importError = null; // Clear any previous import errors
    }
  }

  trackByProblem(index: number, problem: SearchResult): any {
    return problem.id;
  }
}
