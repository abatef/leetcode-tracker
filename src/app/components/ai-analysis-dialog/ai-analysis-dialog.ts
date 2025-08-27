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
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { AIService, ProblemAnalysis } from '../../services/ai.service';
import { AIAnalysisCacheService } from '../../services/ai-analysis-cache.service';

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
    MatDividerModule,
    MatFormFieldModule,
    MatSelectModule
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
  selectedApproachIndex = 0;
  selectedApproachLang: Record<number, string> = {};
  generatingCode: Record<number, boolean> = {};
  isRefreshing = false;
  programmingLanguages: string[] = [
    'JavaScript',
    'TypeScript',
    'Python',
    'Java',
    'C++',
    'Go',
    'C#',
    'Rust'
  ];
  cachedAnalysisId: string | null = null;

  constructor(
    public dialogRef: MatDialogRef<AIAnalysisDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: AIAnalysisDialogData,
    private aiService: AIService,
    private snackBar: MatSnackBar,
    private cacheService: AIAnalysisCacheService
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
    this.isRefreshing = !!forceRefresh;

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

      // Ensure we have a cached record and remember its id for later updates
      const cached = await this.cacheService.getCachedAnalysis(this.data.problemId, this.data.titleSlug);
      if (!cached) {
        await this.cacheService.saveAnalysisToCache(
          this.data.problemId,
          this.aiAnalysis!,
          this.data.titleSlug,
          this.data.title
        );
        const created = await this.cacheService.getCachedAnalysis(this.data.problemId, this.data.titleSlug);
        this.cachedAnalysisId = created?.id || null;
      } else {
        this.cachedAnalysisId = cached.id || null;
      }

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
      this.isRefreshing = false;
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

  onSelectApproach(index: number): void {
    this.selectedApproachIndex = index;
  }

  getSelectedApproachCode(): string | null {
    if (!this.aiAnalysis || !this.aiAnalysis.multipleApproaches || this.aiAnalysis.multipleApproaches.length === 0) {
      return null;
    }
    const approach = this.aiAnalysis.multipleApproaches[this.selectedApproachIndex] || this.aiAnalysis.multipleApproaches[0];
    return approach?.code || null;
  }

  copySelectedApproachCode(): void {
    const code = this.getSelectedApproachCode();
    if (!code) {
      this.snackBar.open('No code available for the selected approach', 'Close', { duration: 2000 });
      return;
    }
    this.copyToClipboard(code);
  }

  downloadSelectedApproachCode(): void {
    const code = this.getSelectedApproachCode();
    if (!code) {
      this.snackBar.open('No code available for the selected approach', 'Close', { duration: 2000 });
      return;
    }
    const approach = this.aiAnalysis!.multipleApproaches[this.selectedApproachIndex] || this.aiAnalysis!.multipleApproaches[0];
    const safeName = (approach?.name || 'approach').toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const filename = `leetcode-${this.data.problemId}-${safeName}.txt`;
    const blob = new Blob([code], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    this.snackBar.open('Code downloaded', 'Close', { duration: 2000 });
  }

  copyApproachCode(index: number): void {
    if (!this.aiAnalysis || !this.aiAnalysis.multipleApproaches?.length) {
      return;
    }
    const code = this.getApproachCodeFor(index);
    if (!code) {
      this.snackBar.open('No code available for this approach', 'Close', { duration: 2000 });
      return;
    }
    this.copyToClipboard(code);
  }

  downloadApproachCode(index: number): void {
    if (!this.aiAnalysis || !this.aiAnalysis.multipleApproaches?.length) {
      return;
    }
    const approach = this.aiAnalysis.multipleApproaches[index];
    const code = this.getApproachCodeFor(index);
    if (!code) {
      this.snackBar.open('No code available for this approach', 'Close', { duration: 2000 });
      return;
    }
    const lang = this.selectedApproachLang[index];
    const safeName = (approach?.name || `approach-${index + 1}`).toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const filename = `leetcode-${this.data.problemId}-${safeName}${lang ? `-${lang.toLowerCase()}` : ''}.txt`;
    const blob = new Blob([code], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    this.snackBar.open('Code downloaded', 'Close', { duration: 2000 });
  }

  getApproachLanguages(index: number): string[] {
    if (!this.aiAnalysis || !this.aiAnalysis.multipleApproaches?.length) return [];
    const codeField = (this.aiAnalysis.multipleApproaches as any)[index]?.code;
    if (!codeField) return [];
    if (typeof codeField === 'string') return ['Default'];
    if (typeof codeField === 'object') return Object.keys(codeField);
    return [];
  }

  setApproachLanguage(index: number, language: string): void {
    this.selectedApproachLang[index] = language;
  }

  getApproachCodeFor(index: number): string | null {
    if (!this.aiAnalysis || !this.aiAnalysis.multipleApproaches?.length) return null;
    const approach: any = (this.aiAnalysis.multipleApproaches as any)[index];
    const codeField = approach?.code;
    if (!codeField) return null;
    if (typeof codeField === 'string') {
      const selected = this.selectedApproachLang[index];
      // When only a single default code is present, show it only if no language is selected
      // or if the selected pseudo-language is 'Default'
      if (!selected || selected === 'Default') {
        return codeField;
      }
      return null;
    }
    if (typeof codeField === 'object') {
      const selected = this.selectedApproachLang[index];
      if (selected && codeField[selected]) {
        return codeField[selected];
      }
      return null;
    }
    return null;
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

  async generateApproachCode(index: number): Promise<void> {
    if (!this.aiAnalysis) return;
    const approach: any = (this.aiAnalysis.multipleApproaches as any)[index];
    if (!approach) return;

    const language = this.selectedApproachLang[index] || this.programmingLanguages[0];
    this.selectedApproachLang[index] = language;
    this.generatingCode[index] = true;

    const problemTitle = this.data.title;
    const prompt = `Generate a clean, idiomatic ${language} solution for the following LeetCode approach.

Problem: ${problemTitle} (ID: ${this.data.problemId})
Difficulty: ${this.data.difficulty || 'Unknown'}
Approach: ${approach.name}
Time Complexity: ${approach.timeComplexity}
Space Complexity: ${approach.spaceComplexity}
Detailed Approach Description: ${approach.description}

Requirements:
- Provide only the complete ${language} code solution.
- No extra commentary, no markdown fences, no explanations.
- Prefer clarity and readability over micro-optimizations.
`;

    try {
      const raw = await this.aiService.enhanceNotes(prompt);
      let code = raw.trim();
      // Remove any accidental code fences
      if (code.startsWith('```')) {
        code = code.replace(/^```[a-zA-Z]*\n/, '').replace(/\n```$/, '');
      }

      // Store per-language
      const existing = approach.code;
      if (!existing) {
        (this.aiAnalysis.multipleApproaches as any)[index].code = { [language]: code };
      } else if (typeof existing === 'string') {
        // Convert to object keeping the original under 'Default'
        (this.aiAnalysis.multipleApproaches as any)[index].code = { Default: existing, [language]: code };
      } else if (typeof existing === 'object') {
        (this.aiAnalysis.multipleApproaches as any)[index].code = { ...existing, [language]: code };
      }

      // Persist updated analysis to cache
      try {
        if (this.cachedAnalysisId) {
          await this.cacheService.updateCachedAnalysis(this.cachedAnalysisId, this.aiAnalysis!);
        } else {
          await this.cacheService.saveAnalysisToCache(
            this.data.problemId,
            this.aiAnalysis!,
            this.data.titleSlug,
            this.data.title
          );
          const created = await this.cacheService.getCachedAnalysis(this.data.problemId, this.data.titleSlug);
          this.cachedAnalysisId = created?.id || null;
        }
      } catch (persistError) {
        console.warn('Failed to persist generated code to cache', persistError);
      }

      this.snackBar.open(`Generated ${language} code for ${approach.name}`, 'Close', { duration: 2500 });
    } catch (e) {
      console.error('Failed to generate approach code', e);
      this.snackBar.open('Failed to generate code. Please try again.', 'Close', { duration: 3000 });
    } finally {
      this.generatingCode[index] = false;
    }
  }

  async loadOrGenerateAnalysis(): Promise<void> {
    this.loading = true;
    this.error = null;
    try {
      const cached = await this.cacheService.getCachedAnalysis(this.data.problemId, this.data.titleSlug);
      if (cached) {
        this.aiAnalysis = cached.analysisData;
        this.cachedAnalysisId = cached.id || null;
        this.isFromCache = true;
        this.snackBar.open('Loaded AI analysis from cache', 'Close', { duration: 2500 });
      } else {
        await this.generateAIAnalysis(false);
      }
    } catch (e) {
      console.error('Failed to load or generate analysis', e);
      this.error = 'Failed to load or generate analysis.';
      this.snackBar.open('Failed to load or generate analysis', 'Close', { duration: 3000 });
    } finally {
      this.loading = false;
    }
  }
}
