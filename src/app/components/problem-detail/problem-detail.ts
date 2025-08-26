import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { AIService, ProblemAnalysis } from '../../services/ai.service';

@Component({
  selector: 'app-problem-detail',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatExpansionModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatCardModule,
    MatDividerModule
  ],
  templateUrl: './problem-detail.html',
  styleUrls: ['./problem-detail.scss']
})
export class ProblemDetailComponent {
  isLoading = false;
  analysis: ProblemAnalysis | null = null;
  error: string | null = null;

  constructor(
    public dialogRef: MatDialogRef<ProblemDetailComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private aiService: AIService,
    private snackBar: MatSnackBar
  ) {}

  async fetchDetailedAnalysis(): Promise<void> {
    this.isLoading = true;
    this.error = null;

    try {
      this.analysis = await this.aiService.getProblemAnalysis(this.data);
      this.snackBar.open('Detailed analysis generated successfully!', 'Close', { duration: 3000 });
    } catch (error) {
      console.error('Error fetching problem analysis:', error);
      this.error = 'Failed to fetch detailed analysis. Please try again.';
      this.snackBar.open('Failed to generate analysis. Please try again.', 'Close', { duration: 5000 });
    } finally {
      this.isLoading = false;
    }
  }

  getDifficultyColor(difficulty: string): string {
    switch (difficulty?.toLowerCase()) {
      case 'easy': return '#00b894';
      case 'medium': return '#fdcb6e';
      case 'hard': return '#e17055';
      default: return '#74b9ff';
    }
  }

  openLeetCodeProblem(): void {
    const url = `https://leetcode.com/problems/${this.data.titleSlug || this.data.title?.toLowerCase().replace(/\s+/g, '-')}/`;
    window.open(url, '_blank');
  }

  copyToClipboard(text: string): void {
    navigator.clipboard.writeText(text).then(() => {
      this.snackBar.open('Copied to clipboard!', 'Close', { duration: 2000 });
    }).catch(() => {
      this.snackBar.open('Failed to copy to clipboard', 'Close', { duration: 2000 });
    });
  }

  closeDialog(): void {
    this.dialogRef.close();
  }
}
