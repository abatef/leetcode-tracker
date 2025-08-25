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
  templateUrl: './leetcode-import.html',
  styleUrls: ['./leetcode-import.scss']
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
