import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Observable, Subject, takeUntil } from 'rxjs';
import { LeetcodeService } from '../../services/leetcode';
import { LeetCodeApiService, LeetCodeDailyChallenge } from '../../services/leetcode-api';
import { Problem, UserStats } from '../../models/problem';
import { ProblemFormComponent } from '../problem-form/problem-form';
import { ProgressChartComponent } from '../progress-chart/progress-chart';

interface DashboardMetrics {
  totalProblems: number;
  solvedProblems: number;
  easyCount: number;
  mediumCount: number;
  hardCount: number;
  streakDays: number;
  weeklyGoal: number;
  weeklyProgress: number;
  averageTime: number;
}

interface ActivityItem {
  type: 'solved' | 'attempted' | 'added';
  problem: Problem;
  timestamp: Date;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatChipsModule,
    ProgressChartComponent
  ],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.scss']
})
export class DashboardComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  problems: Problem[] = [];
  stats: UserStats = {
    totalProblems: 0,
    solvedProblems: 0,
    easyCount: 0,
    mediumCount: 0,
    hardCount: 0,
    streakDays: 0,
    lastActiveDate: new Date()
  };

  metrics: DashboardMetrics = {
    totalProblems: 0,
    solvedProblems: 0,
    easyCount: 0,
    mediumCount: 0,
    hardCount: 0,
    streakDays: 0,
    weeklyGoal: 7,
    weeklyProgress: 0,
    averageTime: 0
  };

  recentActivity: ActivityItem[] = [];
  dailyChallenge: LeetCodeDailyChallenge | null = null;
  loadingDaily = false;
  importingDaily = false;
  dailyChallengeError: string | null = null;

  constructor(
    private leetcodeService: LeetcodeService,
    private leetcodeApiService: LeetCodeApiService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadData();
    this.loadDailyChallenge();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadData(): void {
    this.leetcodeService.problems$
      .pipe(takeUntil(this.destroy$))
      .subscribe(problems => {
        this.problems = problems;
        this.generateRecentActivity();
      });

    this.leetcodeService.stats$
      .pipe(takeUntil(this.destroy$))
      .subscribe(stats => {
        this.stats = stats;
        this.updateMetrics();
      });
  }

  loadDailyChallenge(): void {
    this.loadingDaily = true;
    this.dailyChallengeError = null;

    this.leetcodeApiService.getDailyChallenge().subscribe({
      next: (challenge) => {
        this.dailyChallenge = challenge;
        this.loadingDaily = false;
        this.dailyChallengeError = null;
      },
      error: (error) => {
        console.error('Failed to load daily challenge:', error);
        this.loadingDaily = false;
        this.dailyChallengeError = 'Failed to load today\'s challenge. Please try again.';
      }
    });
  }

  private updateMetrics(): void {
    const weeklyProblems = this.getWeeklyProgress();

    this.metrics = {
      totalProblems: this.stats.totalProblems,
      solvedProblems: this.stats.solvedProblems,
      easyCount: this.stats.easyCount,
      mediumCount: this.stats.mediumCount,
      hardCount: this.stats.hardCount,
      streakDays: this.stats.streakDays,
      weeklyGoal: 7,
      weeklyProgress: weeklyProblems,
      averageTime: this.calculateAverageTime()
    };
  }

  private generateRecentActivity(): void {
    const activities: ActivityItem[] = [];

    this.problems.forEach(problem => {
      if (problem.solvedDate) {
        activities.push({
          type: 'solved',
          problem,
          timestamp: problem.solvedDate
        });
      } else if (problem.lastAttemptDate) {
        activities.push({
          type: 'attempted',
          problem,
          timestamp: problem.lastAttemptDate
        });
      }

      if (problem.createdAt) {
        activities.push({
          type: 'added',
          problem,
          timestamp: problem.createdAt
        });
      }
    });

    this.recentActivity = activities
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 5);
  }

  private getWeeklyProgress(): number {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    return this.problems.filter(problem => {
      return problem.solvedDate && problem.solvedDate >= oneWeekAgo;
    }).length;
  }

  private calculateAverageTime(): number {
    const solvedProblems = this.problems.filter(p => p.status === 'Solved' && p.timeSpent > 0);
    if (solvedProblems.length === 0) return 0;

    const totalTime = solvedProblems.reduce((sum, p) => sum + p.timeSpent, 0);
    return Math.round(totalTime / solvedProblems.length);
  }

  getCurrentDate(): string {
    return new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  getSuccessRate(): number {
    if (this.stats.totalProblems === 0) return 0;
    return Math.round((this.stats.solvedProblems / this.stats.totalProblems) * 100);
  }

  getActivityIcon(type: string): string {
    switch (type) {
      case 'solved': return 'check_circle';
      case 'attempted': return 'play_circle';
      case 'added': return 'add_circle';
      default: return 'info';
    }
  }

  getRelativeTime(date: Date): string {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;

    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  }

  viewDailyChallenge(): void {
    if (this.dailyChallenge) {
      window.open(this.dailyChallenge.link, '_blank');
    }
  }

  openLeetCodeDaily(): void {
    window.open('https://leetcode.com/problemset/', '_blank');
  }

  async importDailyChallenge(): Promise<void> {
    if (!this.dailyChallenge || this.importingDaily) return;

    this.importingDaily = true;

    try {
      // Check if this problem already exists
      const existingProblem = this.problems.find(p =>
        p.title === this.dailyChallenge!.question.title ||
        p.leetcodeId === parseInt(this.dailyChallenge!.question.questionId)
      );

      if (existingProblem) {
        this.snackBar.open(
          `Problem "${this.dailyChallenge.question.title}" is already in your tracker!`,
          'Close',
          { duration: 4000, panelClass: 'warning-snackbar' }
        );
        this.importingDaily = false;
        return;
      }

      // Fetch full problem details
      const problem = await this.leetcodeApiService.getProblem(this.dailyChallenge.question.titleSlug).toPromise();

      if (problem) {
        const problemData = this.leetcodeApiService.convertApiProblemToLocal(problem);
        await this.leetcodeService.addProblem(problemData as Omit<Problem, 'id' | 'userId' | 'createdAt' | 'updatedAt'>);

        this.snackBar.open(
          `"${this.dailyChallenge.question.title}" added to your tracker!`,
          'Close',
          {
            duration: 4000,
            panelClass: 'success-snackbar'
          }
        );
      }
    } catch (error) {
      console.error('Failed to import daily challenge:', error);
      this.snackBar.open(
        'Failed to import daily challenge. Please try again.',
        'Close',
        { duration: 4000, panelClass: 'error-snackbar' }
      );
    } finally {
      this.importingDaily = false;
    }
  }

  addProblem(): void {
    const dialogRef = this.dialog.open(ProblemFormComponent, {
      width: '600px',
      maxWidth: '90vw',
      data: null
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Problem was added successfully
      }
    });
  }
}
