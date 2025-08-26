import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialog, MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { LeetCodeApiService, LeetCodeProblem } from '../../services/leetcode-api';
import { AIService, ProblemAnalysis } from '../../services/ai.service';
import { AIAnalysisDialogComponent } from '../ai-analysis-dialog/ai-analysis-dialog';

@Component({
  selector: 'app-problem-details-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    MatTabsModule,
    MatCardModule,
    MatExpansionModule,
    MatSnackBarModule,
    MatTooltipModule
  ],
  templateUrl: './problem-details-dialog.html',
  styleUrls: ['./problem-details-dialog.scss']
})
export class ProblemDetailsDialogComponent implements OnInit {
  problemDetails: LeetCodeProblem | null = null;
  loading = false;
  error: string | null = null;
  sanitizedContent: SafeHtml = '';

  // AI Analysis properties
  aiAnalysis: ProblemAnalysis | null = null;
  aiLoading = false;
  aiError: string | null = null;
  isFromCache = false;

  constructor(
    public dialogRef: MatDialogRef<ProblemDetailsDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { problemId: number; titleSlug: string; title?: string; difficulty?: string; tags?: string[] },
    private leetcodeApi: LeetCodeApiService,
    private aiService: AIService,
    private sanitizer: DomSanitizer,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadProblemDetails();
    this.checkIfAnalysisInCache();
  }

  loadProblemDetails(): void {
    this.loading = true;
    this.error = null;

    const identifier = this.data.titleSlug || this.data.problemId;

    this.leetcodeApi.getProblem(identifier).subscribe({
      next: (problem) => {
        this.problemDetails = problem;
        if (problem.content) {
          this.sanitizedContent = this.sanitizer.bypassSecurityTrustHtml(problem.content);
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading problem details:', error);
        this.error = error.message || 'Failed to load problem details';
        this.loading = false;
      }
    });
  }

  async checkIfAnalysisInCache(): Promise<void> {
    try {
      const problemId = this.data.problemId;
      const titleSlug = this.data.titleSlug;
      this.isFromCache = await this.aiService.hasAnalysisInCache(problemId, titleSlug);
    } catch (error) {
      console.warn('Error checking cache status:', error);
    }
  }

  async generateAIAnalysis(forceRefresh: boolean = false): Promise<void> {
    this.aiLoading = true;
    this.aiError = null;

    try {
      // Use problemDetails if available, otherwise use the data passed to the dialog
      const problemData = this.problemDetails || {
        title: this.data.title,
        difficulty: this.data.difficulty,
        tags: this.data.tags,
        leetcodeId: this.data.problemId,
        titleSlug: this.data.titleSlug
      };

      this.aiAnalysis = await this.aiService.getProblemAnalysis(problemData, forceRefresh);
      this.isFromCache = !forceRefresh && await this.aiService.hasAnalysisInCache(this.data.problemId, this.data.titleSlug);

      const message = forceRefresh
        ? 'AI analysis refreshed successfully!'
        : this.isFromCache
          ? 'AI analysis loaded from cache!'
          : 'AI analysis generated and saved successfully!';

      this.snackBar.open(message, 'Close', { duration: 3000 });
    } catch (error) {
      console.error('Error generating AI analysis:', error);
      this.aiError = 'Failed to generate AI analysis. Please try again.';
      this.snackBar.open('Failed to generate AI analysis. Please try again.', 'Close', { duration: 5000 });
    } finally {
      this.aiLoading = false;
    }
  }

  async refreshAIAnalysis(): Promise<void> {
    if (confirm('This will regenerate the AI analysis using the latest AI model. Continue?')) {
      await this.generateAIAnalysis(true);
    }
  }

  getDifficultyColor(difficulty: string): string {
    switch (difficulty?.toLowerCase()) {
      case 'easy': return '#4caf50';
      case 'medium': return '#ff9800';
      case 'hard': return '#f44336';
      default: return '#2196f3';
    }
  }

  copyToClipboard(text: string): void {
    navigator.clipboard.writeText(text).then(() => {
      this.snackBar.open('Copied to clipboard!', 'Close', { duration: 2000 });
    }).catch(() => {
      this.snackBar.open('Failed to copy to clipboard', 'Close', { duration: 2000 });
    });
  }

  openLeetCodeProblem(): void {
    const titleSlug = this.problemDetails?.titleSlug || this.data.titleSlug;
    if (titleSlug) {
      const url = `https://leetcode.com/problems/${titleSlug}/`;
      window.open(url, '_blank');
    }
  }

  async openAIAnalysisDialog(): Promise<void> {
    const dialogRef = this.dialog.open(AIAnalysisDialogComponent, {
      width: '90vw',
      maxWidth: '1200px',
      height: '85vh',
      data: {
        problemId: this.data.problemId,
        titleSlug: this.data.titleSlug,
        title: this.data.title || this.problemDetails?.title || `Problem ${this.data.problemId}`,
        difficulty: this.data.difficulty || this.problemDetails?.difficulty,
        tags: this.data.tags || this.problemDetails?.tags,
        problemData: this.problemDetails
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Handle any result if needed
      }
    });
  }
}
