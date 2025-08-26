import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDividerModule } from '@angular/material/divider';
import { AIService, ProblemAnalysis } from '../../services/ai.service';

export interface AIAnalysisDialogData {
  problemId: number;
  titleSlug?: string;
  title: string;
  difficulty?: string;
  tags?: string[];
  problemData?: any;
}

@Component({
  selector: 'app-ai-analysis-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatTabsModule,
    MatCardModule,
    MatExpansionModule,
    MatSnackBarModule,
    MatTooltipModule,
    MatBadgeModule,
    MatDividerModule
  ],
  templateUrl: './ai-analysis-dialog.html',
  styleUrls: ['./ai-analysis-dialog.scss']
})
export class AIAnalysisDialogComponent implements OnInit {
  aiAnalysis: ProblemAnalysis | null = null;
  loading = false;
  error: string | null = null;
  isFromCache = false;
  selectedTabIndex = 0;

  constructor(
    public dialogRef: MatDialogRef<AIAnalysisDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: AIAnalysisDialogData,
    private aiService: AIService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.checkCacheStatus();
    this.generateAIAnalysis();
  }

  async checkCacheStatus(): Promise<void> {
    try {
      this.isFromCache = await this.aiService.hasAnalysisInCache(
        this.data.problemId,
        this.data.titleSlug
      );
    } catch (error) {
      console.warn('Error checking cache status:', error);
    }
  }

  async generateAIAnalysis(forceRefresh: boolean = false): Promise<void> {
    if (this.loading) return;

    this.loading = true;
    this.error = null;

    try {
      const problemData = this.data.problemData || {
        title: this.data.title,
        difficulty: this.data.difficulty,
        tags: this.data.tags,
        leetcodeId: this.data.problemId,
        titleSlug: this.data.titleSlug
      };

      this.aiAnalysis = await this.aiService.getProblemAnalysis(problemData, forceRefresh);

      // Update cache status after generation
      this.isFromCache = !forceRefresh && await this.aiService.hasAnalysisInCache(
        this.data.problemId,
        this.data.titleSlug
      );

      const message = forceRefresh
        ? 'AI analysis refreshed successfully!'
        : this.isFromCache
          ? 'AI analysis loaded from cache!'
          : 'AI analysis generated successfully!';

      this.snackBar.open(message, 'Close', { duration: 3000 });

    } catch (error) {
      console.error('Error generating AI analysis:', error);
      this.error = 'Failed to generate AI analysis. Please try again.';
      this.snackBar.open('Failed to generate AI analysis', 'Close', { duration: 5000 });
    } finally {
      this.loading = false;
    }
  }

  async refreshAnalysis(): Promise<void> {
    if (confirm('Regenerate AI analysis with the latest model? This will overwrite cached data.')) {
      await this.generateAIAnalysis(true);
    }
  }

  copyToClipboard(text: string): void {
    navigator.clipboard.writeText(text).then(() => {
      this.snackBar.open('Copied to clipboard!', 'Close', { duration: 2000 });
    }).catch(() => {
      this.snackBar.open('Failed to copy to clipboard', 'Close', { duration: 2000 });
    });
  }

  getDifficultyColor(difficulty?: string): string {
    switch (difficulty?.toLowerCase()) {
      case 'easy': return '#4caf50';
      case 'medium': return '#ff9800';
      case 'hard': return '#f44336';
      default: return '#2196f3';
    }
  }

  getApproachIcon(index: number): string {
    const icons = ['rocket_launch', 'speed', 'memory', 'tune', 'psychology', 'code'];
    return icons[index] || 'code';
  }

  onTabChange(index: number): void {
    this.selectedTabIndex = index;
  }

  exportAnalysis(): void {
    if (!this.aiAnalysis) return;

    const exportData = {
      problem: {
        id: this.data.problemId,
        title: this.data.title,
        difficulty: this.data.difficulty
      },
      analysis: this.aiAnalysis,
      exportedAt: new Date().toISOString(),
      source: 'LeetCode Tracker - AI Analysis'
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leetcode-${this.data.problemId}-ai-analysis.json`;
    a.click();
    URL.revokeObjectURL(url);

    this.snackBar.open('Analysis exported successfully!', 'Close', { duration: 2000 });
  }
}
