import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar } from '@angular/material/snack-bar';
import { LeetCodeApiService, LeetCodeProblem, LeetCodeDailyChallenge } from '../../services/leetcode-api';
import { LeetcodeService } from '../../services/leetcode';
import { Problem } from '../../models/problem';

@Component({
  selector: 'app-leetcode-import',
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
    MatCardModule,
    MatChipsModule
  ],
  template: `
    <h2 mat-dialog-title>
      <mat-icon>cloud_download</mat-icon>
      Import from LeetCode
    </h2>

    <mat-dialog-content>
      <div class="import-options">
        <!-- Daily Challenge -->
        <mat-card class="import-card" (click)="fetchDailyChallenge()" [class.loading]="dailyLoading">
          <mat-card-header>
            <div mat-card-avatar class="daily-avatar">
              <mat-icon>today</mat-icon>
            </div>
            <mat-card-title>Daily Challenge</mat-card-title>
            <mat-card-subtitle>Import today's LeetCode daily challenge</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content *ngIf="dailyChallenge && dailyChallenge.question">
            <div class="daily-info">
              <h4>{{ dailyChallenge.question.title || 'Unknown Title' }}</h4>
              <div class="difficulty-badge"
                   [ngClass]="'difficulty-' + getDifficulty(dailyChallenge.question.difficulty).toLowerCase()"
                   *ngIf="getDifficulty(dailyChallenge.question.difficulty)">
                {{ getDifficulty(dailyChallenge.question.difficulty) }}
              </div>
              <div class="problem-id" *ngIf="dailyChallenge.question.questionFrontendId">
                #{{ dailyChallenge.question.questionFrontendId }}
              </div>
            </div>
          </mat-card-content>
          <mat-card-content *ngIf="dailyChallengeError">
            <div class="error-info">
              <mat-icon>error_outline</mat-icon>
              <span>{{ dailyChallengeError }}</span>
            </div>
          </mat-card-content>
          <mat-card-actions>
            <button mat-raised-button color="primary"
                    (click)="importDailyChallenge(); $event.stopPropagation()"
                    [disabled]="!dailyChallenge || dailyLoading || importingDaily || !!dailyChallengeError">
              <mat-spinner diameter="16" *ngIf="dailyLoading || importingDaily"></mat-spinner>
              <mat-icon *ngIf="!dailyLoading && !importingDaily">add</mat-icon>
              {{ getButtonText() }}
            </button>
            <button mat-button
                    (click)="retryDailyChallenge(); $event.stopPropagation()"
                    *ngIf="dailyChallengeError && !dailyLoading">
              <mat-icon>refresh</mat-icon>
              Retry
            </button>
          </mat-card-actions>
        </mat-card>

        <!-- Random Problem -->
        <mat-card class="import-card">
          <mat-card-header>
            <div mat-card-avatar class="random-avatar">
              <mat-icon>shuffle</mat-icon>
            </div>
            <mat-card-title>Random Problem</mat-card-title>
            <mat-card-subtitle>Get a random problem by difficulty</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Difficulty</mat-label>
              <mat-select [(value)]="selectedDifficulty">
                <mat-option value="">Any Difficulty</mat-option>
                <mat-option value="Easy">Easy</mat-option>
                <mat-option value="Medium">Medium</mat-option>
                <mat-option value="Hard">Hard</mat-option>
              </mat-select>
            </mat-form-field>
            <div class="random-problem-info" *ngIf="randomProblem">
              <h4>{{ randomProblem.title }}</h4>
              <div class="problem-meta">
                <div class="difficulty-badge"
                     [ngClass]="'difficulty-' + getDifficulty(randomProblem.difficulty).toLowerCase()"
                     *ngIf="getDifficulty(randomProblem.difficulty)">
                  {{ getDifficulty(randomProblem.difficulty) }}
                </div>
                <div class="problem-id" *ngIf="randomProblem.id || randomProblem.questionFrontendId">
                  #{{ randomProblem.id || randomProblem.questionFrontendId }}
                </div>
              </div>
              <div class="tags-container" *ngIf="randomProblem.tags?.length">
                <mat-chip *ngFor="let tag of randomProblem.tags?.slice(0, 3)">{{ tag }}</mat-chip>
                <span *ngIf="randomProblem.tags && randomProblem.tags.length > 3" class="more-tags">
                  +{{ randomProblem.tags.length - 3 }} more
                </span>
              </div>
              <div class="premium-badge" *ngIf="randomProblem.isPaidOnly">
                <mat-icon>star</mat-icon>
                <span>Premium</span>
              </div>
            </div>
            <div class="error-info" *ngIf="randomError">
              <mat-icon>error_outline</mat-icon>
              <span>{{ randomError }}</span>
            </div>
          </mat-card-content>
          <mat-card-actions>
            <button mat-button (click)="fetchRandomProblem()" [disabled]="randomLoading">
              <mat-spinner diameter="16" *ngIf="randomLoading"></mat-spinner>
              <mat-icon *ngIf="!randomLoading">refresh</mat-icon>
              {{ randomLoading ? 'Loading...' : 'Get Random' }}
            </button>
            <button mat-raised-button color="primary"
                    (click)="importRandomProblem()"
                    [disabled]="!randomProblem || randomLoading || importingRandom">
              <mat-spinner diameter="16" *ngIf="importingRandom"></mat-spinner>
              <mat-icon *ngIf="!importingRandom">add</mat-icon>
              {{ importingRandom ? 'Adding...' : 'Import Problem' }}
            </button>
          </mat-card-actions>
        </mat-card>

        <!-- Search Problem -->
        <mat-card class="import-card">
          <mat-card-header>
            <div mat-card-avatar class="search-avatar">
              <mat-icon>search</mat-icon>
            </div>
            <mat-card-title>Search Problem</mat-card-title>
            <mat-card-subtitle>Search by problem ID or title slug</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Problem ID or Title Slug</mat-label>
              <input matInput [(ngModel)]="searchQuery"
                     placeholder="e.g., 1, two-sum, valid-parentheses"
                     (keyup.enter)="searchProblem()">
              <mat-hint>Enter problem ID (number) or title slug (kebab-case)</mat-hint>
            </mat-form-field>
            <div class="search-result" *ngIf="searchedProblem">
              <h4>{{ searchedProblem.title }}</h4>
              <div class="problem-details">
                <div class="difficulty-badge"
                     [ngClass]="'difficulty-' + getDifficulty(searchedProblem.difficulty).toLowerCase()"
                     *ngIf="getDifficulty(searchedProblem.difficulty)">
                  {{ getDifficulty(searchedProblem.difficulty) }}
                </div>
                <span class="problem-id" *ngIf="searchedProblem.id || searchedProblem.questionFrontendId">
                  #{{ searchedProblem.id || searchedProblem.questionFrontendId }}
                </span>
                <div class="premium-badge" *ngIf="searchedProblem.isPaidOnly">
                  <mat-icon>star</mat-icon>
                  <span>Premium</span>
                </div>
              </div>
              <div class="tags-container" *ngIf="searchedProblem.tags?.length">
                <mat-chip *ngFor="let tag of searchedProblem.tags?.slice(0, 4)">{{ tag }}</mat-chip>
                <span *ngIf="searchedProblem.tags && searchedProblem.tags.length > 4" class="more-tags">
                  +{{ searchedProblem.tags.length - 4 }} more
                </span>
              </div>
            </div>
            <div class="error-info" *ngIf="searchError">
              <mat-icon>error_outline</mat-icon>
              <span>{{ searchError }}</span>
            </div>
          </mat-card-content>
          <mat-card-actions>
            <button mat-button (click)="searchProblem()" [disabled]="!searchQuery || searchLoading">
              <mat-spinner diameter="16" *ngIf="searchLoading"></mat-spinner>
              <mat-icon *ngIf="!searchLoading">search</mat-icon>
              {{ searchLoading ? 'Searching...' : 'Search' }}
            </button>
            <button mat-raised-button color="primary"
                    (click)="importSearchedProblem()"
                    [disabled]="!searchedProblem || searchLoading || importingSearched">
              <mat-spinner diameter="16" *ngIf="importingSearched"></mat-spinner>
              <mat-icon *ngIf="!importingSearched">add</mat-icon>
              {{ importingSearched ? 'Adding...' : 'Import Problem' }}
            </button>
          </mat-card-actions>
        </mat-card>
      </div>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Close</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .import-options {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
      min-width: 500px;
      max-width: 600px;
    }

    .import-card {
      cursor: pointer;
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }

    .import-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }

    .import-card.loading {
      cursor: default;
    }

    .daily-avatar {
      background-color: #4CAF50;
      color: white;
    }

    .random-avatar {
      background-color: #FF9800;
      color: white;
    }

    .search-avatar {
      background-color: #2196F3;
      color: white;
    }

    .daily-info, .random-problem-info, .search-result {
      margin-top: 1rem;
    }

    .daily-info h4, .random-problem-info h4, .search-result h4 {
      margin: 0 0 0.75rem 0;
      color: var(--mdc-theme-primary);
      font-size: 1rem;
      font-weight: 500;
      line-height: 1.3;
    }

    .problem-details, .problem-meta {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-bottom: 0.75rem;
      flex-wrap: wrap;
    }

    .difficulty-badge {
      padding: 0.25rem 0.75rem;
      border-radius: 12px;
      font-size: 0.8rem;
      font-weight: 500;
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

    .problem-id {
      background: rgba(103, 80, 164, 0.1);
      color: #5b21b6;
      padding: 0.25rem 0.75rem;
      border-radius: 12px;
      font-size: 0.8rem;
      font-weight: 500;
      border: 1px solid rgba(103, 80, 164, 0.2);
    }

    .premium-badge {
      display: flex;
      align-items: center;
      gap: 0.25rem;
      background: linear-gradient(135deg, #FFD700, #FFA500);
      color: #000;
      padding: 0.25rem 0.5rem;
      border-radius: 12px;
      font-size: 0.75rem;
      font-weight: 600;
    }

    .premium-badge mat-icon {
      font-size: 14px;
      width: 14px;
      height: 14px;
    }

    .tags-container {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      align-items: center;
      margin-top: 0.5rem;
    }

    .tags-container mat-chip {
      font-size: 0.75rem;
      height: 24px;
      --mdc-chip-container-height: 24px;
    }

    .more-tags {
      font-size: 0.8rem;
      color: rgba(0, 0, 0, 0.6);
      font-style: italic;
    }

    .error-info {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem;
      background: rgba(244, 67, 54, 0.1);
      border: 1px solid rgba(244, 67, 54, 0.2);
      border-radius: 8px;
      color: #d32f2f;
      font-size: 0.9rem;
      margin-top: 1rem;
    }

    .error-info mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    .full-width {
      width: 100%;
    }

    mat-card-actions {
      justify-content: flex-end;
      gap: 0.5rem;
      flex-wrap: wrap;
    }

    mat-card-actions button {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      min-width: 120px;
      justify-content: center;
    }

    h2[mat-dialog-title] {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0;
    }

    :host-context(.dark-theme) .more-tags {
      color: rgba(255, 255, 255, 0.6);
    }

    :host-context(.dark-theme) .problem-id {
      background: rgba(255, 255, 255, 0.1);
      color: #c4b5fd;
      border-color: rgba(255, 255, 255, 0.2);
    }

    :host-context(.dark-theme) .error-info {
      background: rgba(244, 67, 54, 0.2);
      border-color: rgba(244, 67, 54, 0.3);
      color: #ff6b6b;
    }

    @media (max-width: 600px) {
      .import-options {
        min-width: 300px;
        max-width: 90vw;
      }

      mat-card-actions {
        flex-direction: column;
        align-items: stretch;
      }

      mat-card-actions button {
        width: 100%;
        margin: 0.25rem 0;
      }

      .problem-details, .problem-meta {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.5rem;
      }
    }
  `]
})
export class LeetcodeImportComponent {
  dailyChallenge: LeetCodeDailyChallenge | null = null;
  randomProblem: LeetCodeProblem | null = null;
  searchedProblem: LeetCodeProblem | null = null;

  selectedDifficulty: 'Easy' | 'Medium' | 'Hard' | '' = '';
  searchQuery = '';

  dailyLoading = false;
  randomLoading = false;
  searchLoading = false;

  importingDaily = false;
  importingRandom = false;
  importingSearched = false;

  dailyChallengeError: string | null = null;
  randomError: string | null = null;
  searchError: string | null = null;

  constructor(
    public dialogRef: MatDialogRef<LeetcodeImportComponent>,
    private leetcodeApiService: LeetCodeApiService,
    private leetcodeService: LeetcodeService,
    private snackBar: MatSnackBar
  ) {
    this.fetchDailyChallenge();
  }

  /**
   * Safe method to get difficulty with fallback
   */
  getDifficulty(difficulty: any): string {
    if (!difficulty) return '';

    const difficultyStr = String(difficulty).toLowerCase();

    if (difficultyStr.includes('easy')) return 'Easy';
    if (difficultyStr.includes('medium')) return 'Medium';
    if (difficultyStr.includes('hard')) return 'Hard';

    // Fallback to original value if it's a valid difficulty
    const validDifficulties = ['Easy', 'Medium', 'Hard'];
    const capitalizedDifficulty = difficulty.charAt(0).toUpperCase() + difficulty.slice(1).toLowerCase();

    return validDifficulties.includes(capitalizedDifficulty) ? capitalizedDifficulty : '';
  }

  /**
   * Get appropriate button text based on current state
   */
  getButtonText(): string {
    if (this.dailyLoading) return 'Loading...';
    if (this.importingDaily) return 'Adding...';
    if (this.dailyChallengeError) return 'Retry';
    if (!this.dailyChallenge) return 'Load Daily Challenge';
    return 'Import Daily Challenge';
  }

  fetchDailyChallenge(): void {
    this.dailyLoading = true;
    this.dailyChallengeError = null;

    this.leetcodeApiService.getDailyChallenge().subscribe({
      next: (challenge) => {
        this.dailyChallenge = challenge;
        this.dailyLoading = false;
        console.log('Daily challenge loaded:', challenge);
      },
      error: (error) => {
        this.dailyChallengeError = error.message || 'Failed to load daily challenge';
        this.dailyLoading = false;
        console.error('Error fetching daily challenge:', error);
      }
    });
  }

  retryDailyChallenge(): void {
    this.fetchDailyChallenge();
  }

  fetchRandomProblem(): void {
    this.randomLoading = true;
    this.randomError = null;

    this.leetcodeApiService.getRandomProblem(this.selectedDifficulty || undefined).subscribe({
      next: (problem) => {
        this.randomProblem = problem;
        this.randomLoading = false;
        console.log('Random problem loaded:', problem);
      },
      error: (error) => {
        this.randomError = error.message || 'Failed to load random problem';
        this.randomLoading = false;
        console.error('Error fetching random problem:', error);
      }
    });
  }

  searchProblem(): void {
    if (!this.searchQuery.trim()) return;

    this.searchLoading = true;
    this.searchError = null;

    this.leetcodeApiService.getProblem(this.searchQuery.trim()).subscribe({
      next: (problem) => {
        this.searchedProblem = problem;
        this.searchLoading = false;
        console.log('Problem found:', problem);
      },
      error: (error) => {
        this.searchError = error.message || 'Problem not found';
        this.searchLoading = false;
        console.error('Error searching problem:', error);
      }
    });
  }

  async importDailyChallenge(): Promise<void> {
    if (!this.dailyChallenge || !this.dailyChallenge.question || this.importingDaily) return;

    this.importingDaily = true;

    try {
      // Convert daily challenge to problem format
      const problemData: LeetCodeProblem = {
        id: parseInt(this.dailyChallenge.question.questionFrontendId),
        questionId: this.dailyChallenge.question.questionId,
        questionFrontendId: this.dailyChallenge.question.questionFrontendId,
        title: this.dailyChallenge.question.title,
        titleSlug: this.dailyChallenge.question.titleSlug,
        difficulty: this.dailyChallenge.question.difficulty,
        isPaidOnly: this.dailyChallenge.question.isPaidOnly,
        tags: [],
        companies: []
      };

      await this.importProblem(problemData);

      this.snackBar.open('Daily challenge imported successfully!', 'Close', {
        duration: 3000,
        panelClass: ['success-snackbar']
      });

      this.dialogRef.close(true);
    } catch (error) {
      console.error('Error importing daily challenge:', error);
      this.snackBar.open('Failed to import daily challenge', 'Close', {
        duration: 3000,
        panelClass: ['error-snackbar']
      });
    } finally {
      this.importingDaily = false;
    }
  }

  async importRandomProblem(): Promise<void> {
    if (!this.randomProblem || this.importingRandom) return;

    this.importingRandom = true;

    try {
      await this.importProblem(this.randomProblem);

      this.snackBar.open('Random problem imported successfully!', 'Close', {
        duration: 3000,
        panelClass: ['success-snackbar']
      });

      this.dialogRef.close(true);
    } catch (error) {
      console.error('Error importing random problem:', error);
      this.snackBar.open('Failed to import random problem', 'Close', {
        duration: 3000,
        panelClass: ['error-snackbar']
      });
    } finally {
      this.importingRandom = false;
    }
  }

  async importSearchedProblem(): Promise<void> {
    if (!this.searchedProblem || this.importingSearched) return;

    this.importingSearched = true;

    try {
      await this.importProblem(this.searchedProblem);

      this.snackBar.open('Problem imported successfully!', 'Close', {
        duration: 3000,
        panelClass: ['success-snackbar']
      });

      this.dialogRef.close(true);
    } catch (error) {
      console.error('Error importing searched problem:', error);
      this.snackBar.open('Failed to import problem', 'Close', {
        duration: 3000,
        panelClass: ['error-snackbar']
      });
    } finally {
      this.importingSearched = false;
    }
  }

  private async importProblem(apiProblem: LeetCodeProblem): Promise<void> {
    const problemData = this.leetcodeApiService.convertApiProblemToLocal(apiProblem);
    await this.leetcodeService.addProblem(problemData as Omit<Problem, 'id' | 'userId' | 'createdAt' | 'updatedAt'>);
  }
}
