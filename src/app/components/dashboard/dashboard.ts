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
  template: `
    <div class="dashboard-container">
      <!-- Welcome Section -->
      <div class="welcome-section">
        <h1>Dashboard</h1>
        <p>Track your LeetCode progress and maintain your coding streak</p>
      </div>

      <!-- Daily Challenge Card -->
      <mat-card class="daily-challenge-card" *ngIf="dailyChallenge">
        <mat-card-header>
          <div mat-card-avatar class="daily-avatar">
            <mat-icon>today</mat-icon>
          </div>
          <mat-card-title>Daily Challenge</mat-card-title>
          <mat-card-subtitle>{{ getCurrentDate() }}</mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          <div class="daily-challenge-content">
            <h3>{{ dailyChallenge.question.title }}</h3>
            <div class="challenge-meta">
              <div class="difficulty-badge" [ngClass]="'difficulty-' + dailyChallenge.question.difficulty.toLowerCase()">
                {{ dailyChallenge.question.difficulty }}
              </div>
              <span class="problem-id">#{{ dailyChallenge.question.questionFrontendId }}</span>
            </div>
            <p class="challenge-description">
              Complete today's daily challenge to maintain your streak!
            </p>
          </div>
        </mat-card-content>
        <mat-card-actions>
          <button mat-stroked-button
                  (click)="viewDailyChallenge()"
                  class="view-challenge-btn">
            <mat-icon>open_in_new</mat-icon>
            View on LeetCode
          </button>
          <button mat-raised-button
                  color="primary"
                  (click)="importDailyChallenge()"
                  [disabled]="importingDaily"
                  class="add-challenge-btn">
            <mat-icon *ngIf="!importingDaily">add</mat-icon>
            <mat-icon *ngIf="importingDaily" class="spinner-icon">hourglass_empty</mat-icon>
            {{ importingDaily ? 'Adding...' : 'Add to Tracker' }}
          </button>
        </mat-card-actions>
      </mat-card>

      <!-- Loading State for Daily Challenge -->
      <mat-card class="daily-challenge-card loading-card" *ngIf="!dailyChallenge && loadingDaily">
        <mat-card-header>
          <div mat-card-avatar class="daily-avatar">
            <mat-icon>today</mat-icon>
          </div>
          <mat-card-title>Daily Challenge</mat-card-title>
          <mat-card-subtitle>Loading today's challenge...</mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          <div class="loading-content">
            <div class="loading-skeleton title-skeleton"></div>
            <div class="loading-skeleton meta-skeleton"></div>
            <div class="loading-skeleton description-skeleton"></div>
          </div>
        </mat-card-content>
        <mat-card-actions>
          <button mat-stroked-button disabled class="view-challenge-btn">
            <mat-icon>open_in_new</mat-icon>
            View on LeetCode
          </button>
          <button mat-raised-button disabled class="add-challenge-btn">
            <mat-icon>add</mat-icon>
            Add to Tracker
          </button>
        </mat-card-actions>
      </mat-card>

      <!-- Error State for Daily Challenge -->
      <mat-card class="daily-challenge-card error-card" *ngIf="!dailyChallenge && !loadingDaily && dailyChallengeError">
        <mat-card-header>
          <div mat-card-avatar class="daily-avatar error-avatar">
            <mat-icon>error_outline</mat-icon>
          </div>
          <mat-card-title>Daily Challenge</mat-card-title>
          <mat-card-subtitle>Unable to load today's challenge</mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          <div class="error-content">
            <p>{{ dailyChallengeError }}</p>
          </div>
        </mat-card-content>
        <mat-card-actions>
          <button mat-stroked-button
                  (click)="loadDailyChallenge()"
                  class="retry-btn">
            <mat-icon>refresh</mat-icon>
            Retry
          </button>
          <button mat-raised-button
                  color="primary"
                  (click)="openLeetCodeDaily()"
                  class="open-leetcode-btn">
            <mat-icon>open_in_new</mat-icon>
            Open LeetCode
          </button>
        </mat-card-actions>
      </mat-card>

      <!-- Stats Grid -->
      <div class="stats-grid">
        <mat-card class="stat-card">
          <mat-card-header>
            <div mat-card-avatar class="total-avatar">
              <mat-icon>quiz</mat-icon>
            </div>
            <mat-card-title>{{ metrics.totalProblems }}</mat-card-title>
            <mat-card-subtitle>Total Problems</mat-card-subtitle>
          </mat-card-header>
        </mat-card>

        <mat-card class="stat-card">
          <mat-card-header>
            <div mat-card-avatar class="solved-avatar">
              <mat-icon>check_circle</mat-icon>
            </div>
            <mat-card-title>{{ metrics.solvedProblems }}</mat-card-title>
            <mat-card-subtitle>Solved</mat-card-subtitle>
          </mat-card-header>
        </mat-card>

        <mat-card class="stat-card">
          <mat-card-header>
            <div mat-card-avatar class="streak-avatar">
              <mat-icon>local_fire_department</mat-icon>
            </div>
            <mat-card-title>{{ metrics.streakDays }}</mat-card-title>
            <mat-card-subtitle>Day Streak</mat-card-subtitle>
          </mat-card-header>
        </mat-card>

        <mat-card class="stat-card">
          <mat-card-header>
            <div mat-card-avatar class="progress-avatar">
              <mat-icon>trending_up</mat-icon>
            </div>
            <mat-card-title>{{ getSuccessRate() }}%</mat-card-title>
            <mat-card-subtitle>Success Rate</mat-card-subtitle>
          </mat-card-header>
        </mat-card>
      </div>

      <!-- Chart and Recent Activity -->
      <div class="content-grid">
        <div class="chart-section">
          <app-progress-chart [problems]="problems"></app-progress-chart>
        </div>

        <div class="activity-section">
          <mat-card class="activity-card">
            <mat-card-header>
              <mat-card-title>Recent Activity</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <div class="activity-list" *ngIf="recentActivity.length > 0; else noActivity">
                <div class="activity-item" *ngFor="let activity of recentActivity">
                  <div class="activity-icon" [ngClass]="'activity-' + activity.type">
                    <mat-icon>{{ getActivityIcon(activity.type) }}</mat-icon>
                  </div>
                  <div class="activity-content">
                    <div class="activity-title">{{ activity.problem.title }}</div>
                    <div class="activity-time">{{ getRelativeTime(activity.timestamp) }}</div>
                  </div>
                  <div class="activity-meta">
                    <div class="difficulty-badge" [ngClass]="'difficulty-' + activity.problem.difficulty.toLowerCase()">
                      {{ activity.problem.difficulty }}
                    </div>
                  </div>
                </div>
              </div>
              <ng-template #noActivity>
                <div class="empty-activity">
                  <mat-icon>timeline</mat-icon>
                  <p>No recent activity</p>
                  <button mat-raised-button color="primary" (click)="addProblem()">
                    <mat-icon>add</mat-icon>
                    Add Your First Problem
                  </button>
                </div>
              </ng-template>
            </mat-card-content>
          </mat-card>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 2rem;
      display: flex;
      flex-direction: column;
      gap: 2rem;
    }

    .welcome-section {
      text-align: center;
      margin-bottom: 1rem;
    }

    .welcome-section h1 {
      font-size: 2.5rem;
      font-weight: 600;
      margin: 0 0 0.5rem 0;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .welcome-section p {
      font-size: 1.1rem;
      color: rgba(0, 0, 0, 0.6);
      margin: 0;
    }

    .daily-challenge-card {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      margin-bottom: 1rem;
      box-shadow: 0 8px 24px rgba(102, 126, 234, 0.3);
      border: none;
    }

    .daily-challenge-card.loading-card {
      background: linear-gradient(135deg, rgba(102, 126, 234, 0.7) 0%, rgba(118, 75, 162, 0.7) 100%);
    }

    .daily-challenge-card.error-card {
      background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
    }

    .daily-challenge-card .mat-mdc-card-header-text {
      color: white;
    }

    .daily-challenge-card .mat-mdc-card-title {
      color: white;
      font-size: 1.25rem;
      font-weight: 500;
      margin-bottom: 0.25rem;
    }

    .daily-challenge-card .mat-mdc-card-subtitle {
      color: rgba(255, 255, 255, 0.8);
      font-size: 0.9rem;
    }

    .daily-avatar {
      background-color: rgba(255, 255, 255, 0.2);
      color: white;
      border: 2px solid rgba(255, 255, 255, 0.3);
    }

    .daily-avatar.error-avatar {
      background-color: rgba(255, 255, 255, 0.1);
      color: #fef2f2;
    }

    .daily-challenge-content h3 {
      margin: 0 0 1rem 0;
      font-size: 1.35rem;
      font-weight: 500;
      line-height: 1.3;
      color: white;
    }

    .challenge-meta {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-bottom: 1rem;
      flex-wrap: wrap;
    }

    .difficulty-badge {
      padding: 0.35rem 0.85rem;
      border-radius: 16px;
      font-size: 0.8rem;
      font-weight: 600;
      text-transform: capitalize;
      letter-spacing: 0.5px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    }

    .difficulty-easy {
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      color: white;
    }

    .difficulty-medium {
      background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
      color: white;
    }

    .difficulty-hard {
      background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
      color: white;
    }

    .problem-id {
      background: rgba(255, 255, 255, 0.25);
      color: white;
      padding: 0.35rem 0.85rem;
      border-radius: 16px;
      font-size: 0.8rem;
      font-weight: 600;
      letter-spacing: 0.5px;
      border: 1px solid rgba(255, 255, 255, 0.3);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    }

    .challenge-description {
      margin: 0;
      opacity: 0.95;
      line-height: 1.6;
      font-size: 1rem;
      color: rgba(255, 255, 255, 0.9);
    }

    .daily-challenge-card mat-card-actions {
      padding: 16px 24px 24px 24px;
      gap: 1rem;
      justify-content: flex-start;
    }

    .view-challenge-btn,
    .retry-btn {
      color: white;
      border: 2px solid rgba(255, 255, 255, 0.4);
      background: rgba(255, 255, 255, 0.1);
      font-weight: 500;
      padding: 8px 20px;
      min-height: 40px;
      transition: all 0.3s ease;
    }

    .view-challenge-btn:hover,
    .retry-btn:hover {
      background: rgba(255, 255, 255, 0.2);
      border-color: rgba(255, 255, 255, 0.6);
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    }

    .add-challenge-btn,
    .open-leetcode-btn {
      background: rgba(255, 255, 255, 0.95);
      color: #667eea;
      font-weight: 600;
      padding: 8px 24px;
      min-height: 40px;
      border: 2px solid transparent;
      transition: all 0.3s ease;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }

    .add-challenge-btn:hover,
    .open-leetcode-btn:hover {
      background: white;
      transform: translateY(-1px);
      box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
    }

    .add-challenge-btn:disabled {
      background: rgba(255, 255, 255, 0.6);
      color: rgba(102, 126, 234, 0.7);
      cursor: not-allowed;
      transform: none;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .spinner-icon {
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    /* Loading skeleton styles */
    .loading-content {
      padding: 1rem 0;
    }

    .loading-skeleton {
      background: linear-gradient(90deg, rgba(255, 255, 255, 0.1) 25%, rgba(255, 255, 255, 0.2) 50%, rgba(255, 255, 255, 0.1) 75%);
      background-size: 200% 100%;
      animation: skeleton-loading 1.5s infinite;
      border-radius: 8px;
      margin-bottom: 0.75rem;
    }

    .title-skeleton {
      height: 28px;
      width: 70%;
    }

    .meta-skeleton {
      height: 20px;
      width: 40%;
    }

    .description-skeleton {
      height: 20px;
      width: 85%;
    }

    @keyframes skeleton-loading {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }

    /* Error content styles */
    .error-content {
      padding: 0.5rem 0;
    }

    .error-content p {
      margin: 0;
      color: rgba(255, 255, 255, 0.9);
      font-size: 0.95rem;
      line-height: 1.5;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1.5rem;
      margin-bottom: 1rem;
    }

    .stat-card {
      transition: transform 0.2s ease, box-shadow 0.2s ease;
      border: 1px solid rgba(0, 0, 0, 0.08);
    }

    .stat-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
    }

    .stat-card .mat-mdc-card-header {
      padding: 1.5rem;
    }

    .stat-card .mat-mdc-card-title {
      font-size: 2rem;
      font-weight: 600;
      margin: 0;
      color: var(--mdc-theme-primary);
    }

    .stat-card .mat-mdc-card-subtitle {
      font-size: 0.9rem;
      margin-top: 0.25rem;
      color: rgba(0, 0, 0, 0.6);
    }

    .total-avatar {
      background-color: #2196F3;
      color: white;
    }

    .solved-avatar {
      background-color: #4CAF50;
      color: white;
    }

    .streak-avatar {
      background-color: #FF9800;
      color: white;
    }

    .progress-avatar {
      background-color: #9C27B0;
      color: white;
    }

    .content-grid {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 2rem;
    }

    .activity-card {
      height: fit-content;
      border: 1px solid rgba(0, 0, 0, 0.08);
    }

    .activity-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .activity-item {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 0.75rem;
      border-radius: 8px;
      transition: background-color 0.2s ease;
    }

    .activity-item:hover {
      background-color: rgba(0, 0, 0, 0.02);
    }

    .activity-icon {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .activity-solved {
      background-color: rgba(76, 175, 80, 0.1);
      color: #4CAF50;
    }

    .activity-attempted {
      background-color: rgba(255, 152, 0, 0.1);
      color: #FF9800;
    }

    .activity-added {
      background-color: rgba(33, 150, 243, 0.1);
      color: #2196F3;
    }

    .activity-content {
      flex: 1;
      min-width: 0;
    }

    .activity-title {
      font-weight: 500;
      margin-bottom: 0.25rem;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .activity-time {
      font-size: 0.8rem;
      color: rgba(0, 0, 0, 0.6);
    }

    .activity-meta {
      flex-shrink: 0;
    }

    .empty-activity {
      text-align: center;
      padding: 3rem 1rem;
      color: rgba(0, 0, 0, 0.6);
    }

    .empty-activity mat-icon {
      font-size: 3rem;
      width: 3rem;
      height: 3rem;
      margin-bottom: 1rem;
      color: rgba(0, 0, 0, 0.3);
    }

    .empty-activity p {
      margin: 0 0 1.5rem 0;
      font-size: 1rem;
    }

    @media (max-width: 768px) {
      .dashboard-container {
        padding: 1rem;
        gap: 1.5rem;
      }

      .welcome-section h1 {
        font-size: 2rem;
      }

      .stats-grid {
        grid-template-columns: repeat(2, 1fr);
        gap: 1rem;
      }

      .content-grid {
        grid-template-columns: 1fr;
        gap: 1.5rem;
      }

      .challenge-meta {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.5rem;
      }

      .daily-challenge-card mat-card-actions {
        flex-direction: column;
        align-items: stretch;
        gap: 0.75rem;
      }

      .daily-challenge-card mat-card-actions button {
        width: 100%;
      }
    }

    @media (max-width: 480px) {
      .stats-grid {
        grid-template-columns: 1fr;
      }

      .activity-item {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.75rem;
      }

      .activity-meta {
        align-self: flex-end;
      }
    }

    /* Dark theme specific overrides */
    :host-context(.dark-theme) .welcome-section p {
      color: rgba(255, 255, 255, 0.6);
    }

    :host-context(.dark-theme) .stat-card .mat-mdc-card-subtitle {
      color: rgba(255, 255, 255, 0.6);
    }

    :host-context(.dark-theme) .activity-time {
      color: rgba(255, 255, 255, 0.6);
    }

    :host-context(.dark-theme) .empty-activity {
      color: rgba(255, 255, 255, 0.6);
    }

    :host-context(.dark-theme) .empty-activity mat-icon {
      color: rgba(255, 255, 255, 0.3);
    }
  `]
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
