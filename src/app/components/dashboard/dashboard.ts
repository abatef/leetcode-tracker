import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { RouterModule } from '@angular/router';
import { LeetcodeService } from '../../services/leetcode';
import { UserStats, Problem } from '../../models/problem';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    RouterModule
  ],
  template: `
    <div class="dashboard-container">
      <div class="welcome-section">
        <h1>Dashboard</h1>
        <p>Welcome back! Here's your coding progress overview.</p>
      </div>

      <div class="quick-stats" *ngIf="stats$ | async as stats">
        <mat-card class="stat-card primary">
          <mat-card-content>
            <div class="stat-icon">
              <mat-icon>assignment</mat-icon>
            </div>
            <div class="stat-info">
              <div class="stat-label">Total Problems</div>
              <div class="stat-value">{{ stats.totalProblems }}</div>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="stat-card success">
          <mat-card-content>
            <div class="stat-icon">
              <mat-icon>check_circle</mat-icon>
            </div>
            <div class="stat-info">
              <div class="stat-label">Solved</div>
              <div class="stat-value">{{ stats.solvedProblems }}</div>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="stat-card warning">
          <mat-card-content>
            <div class="stat-icon">
              <mat-icon>local_fire_department</mat-icon>
            </div>
            <div class="stat-info">
              <div class="stat-label">Current Streak</div>
              <div class="stat-value">{{ stats.streakDays }}</div>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="stat-card info">
          <mat-card-content>
            <div class="stat-icon">
              <mat-icon>trending_up</mat-icon>
            </div>
            <div class="stat-info">
              <div class="stat-label">Success Rate</div>
              <div class="stat-value">{{ getSuccessRate(stats) }}%</div>
            </div>
          </mat-card-content>
        </mat-card>
      </div>

      <div class="main-content">
        <div class="left-column">
          <mat-card class="progress-card">
            <mat-card-header>
              <mat-card-title>Progress Overview</mat-card-title>
            </mat-card-header>
            <mat-card-content *ngIf="stats$ | async as stats">
              <div class="progress-item">
                <div class="progress-header">
                  <span>Easy Problems</span>
                  <span>{{ stats.easyCount }}</span>
                </div>
                <mat-progress-bar
                  mode="determinate"
                  [value]="getProgressPercentage(stats.easyCount, stats.totalProblems)"
                  color="accent">
                </mat-progress-bar>
              </div>

              <div class="progress-item">
                <div class="progress-header">
                  <span>Medium Problems</span>
                  <span>{{ stats.mediumCount }}</span>
                </div>
                <mat-progress-bar
                  mode="determinate"
                  [value]="getProgressPercentage(stats.mediumCount, stats.totalProblems)"
                  color="primary">
                </mat-progress-bar>
              </div>

              <div class="progress-item">
                <div class="progress-header">
                  <span>Hard Problems</span>
                  <span>{{ stats.hardCount }}</span>
                </div>
                <mat-progress-bar
                  mode="determinate"
                  [value]="getProgressPercentage(stats.hardCount, stats.totalProblems)"
                  color="warn">
                </mat-progress-bar>
              </div>
            </mat-card-content>
          </mat-card>

          <mat-card class="quick-actions">
            <mat-card-header>
              <mat-card-title>Quick Actions</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <div class="action-buttons">
                <button mat-raised-button color="primary" routerLink="/problems">
                  <mat-icon>add</mat-icon>
                  Add New Problem
                </button>
                <button mat-raised-button routerLink="/statistics">
                  <mat-icon>analytics</mat-icon>
                  View Statistics
                </button>
                <button mat-raised-button routerLink="/problems">
                  <mat-icon>list</mat-icon>
                  Browse Problems
                </button>
              </div>
            </mat-card-content>
          </mat-card>
        </div>

        <div class="right-column">
          <mat-card class="recent-activity">
            <mat-card-header>
              <mat-card-title>Recent Activity</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <div class="activity-list">
                <div class="activity-item" *ngFor="let activity of getRecentActivity()">
                  <div class="activity-icon">
                    <mat-icon [class]="activity.type">{{ activity.icon }}</mat-icon>
                  </div>
                  <div class="activity-content">
                    <div class="activity-title">{{ activity.title }}</div>
                    <div class="activity-time">{{ activity.time | date:'MMM d, h:mm a' }}</div>
                  </div>
                </div>
                <div class="no-activity" *ngIf="getRecentActivity().length === 0">
                  <mat-icon>hourglass_empty</mat-icon>
                  <p>No recent activity</p>
                </div>
              </div>
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
      padding: 2rem 1rem;
    }

    .welcome-section {
      margin-bottom: 2rem;
    }

    .welcome-section h1 {
      font-size: 2.5rem;
      font-weight: 400;
      margin-bottom: 0.5rem;
    }

    .welcome-section p {
      color: rgba(0, 0, 0, 0.6);
      font-size: 1.1rem;
    }

    .quick-stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
      margin-bottom: 2rem;
    }

    .stat-card {
      cursor: default;
    }

    .stat-card.primary {
      border-left: 4px solid var(--mdc-theme-primary);
    }

    .stat-card.success {
      border-left: 4px solid #4CAF50;
    }

    .stat-card.warning {
      border-left: 4px solid #FF9800;
    }

    .stat-card.info {
      border-left: 4px solid #2196F3;
    }

    .stat-card mat-card-content {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .stat-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background-color: rgba(0, 0, 0, 0.1);
    }

    .stat-icon mat-icon {
      color: var(--mdc-theme-primary);
    }

    .stat-info {
      flex: 1;
    }

    .stat-label {
      font-size: 0.9rem;
      color: rgba(0, 0, 0, 0.6);
      display: block;
    }

    .stat-value {
      font-size: 1.8rem;
      font-weight: 300;
      color: var(--mdc-theme-on-surface);
    }

    .main-content {
      display: grid;
      grid-template-columns: 1fr 300px;
      gap: 2rem;
    }

    .progress-card {
      margin-bottom: 2rem;
    }

    .progress-item {
      margin-bottom: 1.5rem;
    }

    .progress-item:last-child {
      margin-bottom: 0;
    }

    .progress-header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 0.5rem;
      font-weight: 500;
    }

    .action-buttons {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .action-buttons button {
      justify-content: flex-start;
      gap: 0.5rem;
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
      background-color: rgba(0, 0, 0, 0.02);
    }

    .activity-icon mat-icon {
      color: var(--mdc-theme-primary);
    }

    .activity-icon mat-icon.solved {
      color: #4CAF50;
    }

    .activity-icon mat-icon.attempted {
      color: #FFC107;
    }

    .activity-content {
      flex: 1;
    }

    .activity-title {
      font-weight: 500;
      margin-bottom: 0.25rem;
      font-size: 0.9rem;
    }

    .activity-time {
      font-size: 0.8rem;
      color: rgba(0, 0, 0, 0.6);
    }

    .no-activity {
      text-align: center;
      padding: 2rem;
      color: rgba(0, 0, 0, 0.6);
    }

    .no-activity mat-icon {
      font-size: 2rem;
      width: 2rem;
      height: 2rem;
      margin-bottom: 1rem;
    }

    @media (max-width: 768px) {
      .main-content {
        grid-template-columns: 1fr;
      }

      .quick-stats {
        grid-template-columns: repeat(2, 1fr);
      }

      .dashboard-container {
        padding: 1rem 0.5rem;
      }
    }
  `]
})
export class DashboardComponent implements OnInit {
  stats$: Observable<UserStats>;
  problems: Problem[] = [];

  constructor(private leetcodeService: LeetcodeService) {
    this.stats$ = this.leetcodeService.stats$;
  }

  ngOnInit(): void {
    this.leetcodeService.problems$.subscribe(problems => {
      this.problems = problems;
    });
  }

  getSuccessRate(stats: UserStats): number {
    if (stats.totalProblems === 0) return 0;
    return Math.round((stats.solvedProblems / stats.totalProblems) * 100);
  }

  getProgressPercentage(count: number, total: number): number {
    if (total === 0) return 0;
    return (count / total) * 100;
  }

  getRecentActivity(): any[] {
    return this.problems
      .filter(p => p.status === 'Solved' || p.status === 'Attempted')
      .sort((a, b) => {
        const dateA = a.lastAttemptDate || a.updatedAt;
        const dateB = b.lastAttemptDate || b.updatedAt;
        return dateB.getTime() - dateA.getTime();
      })
      .slice(0, 5)
      .map(problem => ({
        title: `${problem.status} "${problem.title}"`,
        time: problem.lastAttemptDate || problem.updatedAt,
        icon: problem.status === 'Solved' ? 'check_circle' : 'partial_fulfillment',
        type: problem.status.toLowerCase()
      }));
  }
}
