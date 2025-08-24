import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { LeetcodeService } from '../../services/leetcode';
import { UserStats, Problem } from '../../models/problem';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-statistics',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatProgressBarModule
  ],
  template: `
    <div class="statistics-container">
      <h2 class="page-title">Statistics</h2>

      <div class="stats-grid" *ngIf="stats$ | async as stats">
        <mat-card class="stat-card">
          <mat-card-header>
            <div mat-card-avatar>
              <mat-icon>assignment</mat-icon>
            </div>
            <mat-card-title>Total Problems</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="stat-value">{{ stats.totalProblems }}</div>
          </mat-card-content>
        </mat-card>

        <mat-card class="stat-card">
          <mat-card-header>
            <div mat-card-avatar class="solved-avatar">
              <mat-icon>check_circle</mat-icon>
            </div>
            <mat-card-title>Solved</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="stat-value">{{ stats.solvedProblems }}</div>
            <mat-progress-bar
              mode="determinate"
              [value]="(stats.solvedProblems / stats.totalProblems) * 100">
            </mat-progress-bar>
          </mat-card-content>
        </mat-card>

        <mat-card class="stat-card">
          <mat-card-header>
            <div mat-card-avatar class="streak-avatar">
              <mat-icon>local_fire_department</mat-icon>
            </div>
            <mat-card-title>Streak</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="stat-value">{{ stats.streakDays }} days</div>
          </mat-card-content>
        </mat-card>

        <div class="difficulty-stats">
          <mat-card class="difficulty-card easy">
            <mat-card-content>
              <div class="difficulty-label">Easy</div>
              <div class="difficulty-count">{{ stats.easyCount }}</div>
            </mat-card-content>
          </mat-card>

          <mat-card class="difficulty-card medium">
            <mat-card-content>
              <div class="difficulty-label">Medium</div>
              <div class="difficulty-count">{{ stats.mediumCount }}</div>
            </mat-card-content>
          </mat-card>

          <mat-card class="difficulty-card hard">
            <mat-card-content>
              <div class="difficulty-label">Hard</div>
              <div class="difficulty-count">{{ stats.hardCount }}</div>
            </mat-card-content>
          </mat-card>
        </div>
      </div>

      <div class="insights-section" *ngIf="getInsights().length > 0">
        <h3>Insights</h3>
        <div class="insights-grid">
          <mat-card class="insight-card" *ngFor="let insight of getInsights()">
            <mat-card-header>
              <div mat-card-avatar>
                <mat-icon [style.color]="insight.color">{{ insight.icon }}</mat-icon>
              </div>
              <mat-card-title>{{ insight.title }}</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <p>{{ insight.description }}</p>
            </mat-card-content>
          </mat-card>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .statistics-container {
      padding: 2rem 1rem;
      max-width: 1200px;
      margin: 0 auto;
    }

    .page-title {
      margin-bottom: 2rem;
      font-size: 2.5rem;
      font-weight: 400;
      line-height: 1.2;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 1.5rem;
      margin-bottom: 3rem;
    }

    .stat-card {
      text-align: center;
    }

    .stat-card .mat-mdc-card-header {
      padding-bottom: 8px;
    }

    .stat-card .mat-mdc-card-content {
      padding-top: 8px;
    }

    .stat-value {
      font-size: 2.5rem;
      font-weight: 300;
      margin: 1rem 0;
      line-height: 1.1;
    }

    .solved-avatar {
      background-color: #4caf50 !important;
      color: white !important;
    }

    .streak-avatar {
      background-color: #ff9800 !important;
      color: white !important;
    }

    .difficulty-stats {
      grid-column: 1 / -1;
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1.5rem;
      margin-top: 1rem;
    }

    .difficulty-card {
      text-align: center;
    }

    .difficulty-card.easy {
      border-left: 4px solid #4caf50;
    }

    .difficulty-card.medium {
      border-left: 4px solid #ff9800;
    }

    .difficulty-card.hard {
      border-left: 4px solid #f44336;
    }

    .difficulty-label {
      font-weight: 500;
      margin-bottom: 0.5rem;
      font-size: 1rem;
      line-height: 1.4;
    }

    .difficulty-count {
      font-size: 2rem;
      font-weight: 300;
      line-height: 1.2;
    }

    .insights-section {
      margin-top: 3rem;
    }

    .insights-section h3 {
      margin-bottom: 1.5rem;
      font-size: 1.5rem;
      font-weight: 500;
      line-height: 1.3;
    }

    .insights-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 1.5rem;
    }

    .insight-card {
      cursor: pointer;
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }

    .insight-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
    }

    .insight-card .mat-mdc-card-content p {
      margin: 0;
      line-height: 1.5;
    }

    @media (max-width: 768px) {
      .statistics-container {
        padding: 1rem 0.5rem;
      }

      .stats-grid {
        grid-template-columns: 1fr;
        gap: 1rem;
      }

      .difficulty-stats {
        grid-template-columns: 1fr;
        gap: 1rem;
      }

      .insights-grid {
        grid-template-columns: 1fr;
        gap: 1rem;
      }

      .page-title {
        font-size: 2rem;
      }

      .stat-value {
        font-size: 2rem;
      }

      .difficulty-count {
        font-size: 1.5rem;
      }
    }

    /* Dark theme specific adjustments */
    :host-context(.dark-theme) {
      .insight-card:hover {
        box-shadow: 0 4px 20px rgba(255, 255, 255, 0.1);
      }
    }
  `]
})
export class StatisticsComponent implements OnInit {
  stats$: Observable<UserStats> | undefined;
  problems: Problem[] = [];
  private currentStats: UserStats = {
    totalProblems: 0,
    solvedProblems: 0,
    easyCount: 0,
    mediumCount: 0,
    hardCount: 0,
    streakDays: 0,
    lastActiveDate: new Date()
  };

  constructor(private leetcodeService: LeetcodeService) {}

  ngOnInit(): void {
    this.stats$ = this.leetcodeService.stats$;
    this.leetcodeService.problems$.subscribe(problems => {
      this.problems = problems;
    });

    // Store current stats for insights
    this.leetcodeService.stats$.subscribe(stats => {
      this.currentStats = stats;
    });
  }

  getInsights(): any[] {
    const insights = [];
    const stats = this.currentStats; // Use stored stats instead of .value

    if (stats.streakDays >= 7) {
      insights.push({
        icon: 'local_fire_department',
        color: '#FF5722',
        title: 'Great Streak!',
        description: `You're on a ${stats.streakDays}-day streak! Keep up the momentum.`
      });
    }

    if (stats.hardCount === 0 && stats.mediumCount > 0) {
      insights.push({
        icon: 'trending_up',
        color: '#FF9800',
        title: 'Ready for Hard Problems?',
        description: 'You\'ve mastered medium problems! Consider tackling some hard challenges to level up your skills.'
      });
    }

    if (stats.totalProblems > 0 && (stats.solvedProblems / stats.totalProblems) > 0.8) {
      insights.push({
        icon: 'emoji_events',
        color: '#4CAF50',
        title: 'Almost There!',
        description: `You've solved ${Math.round((stats.solvedProblems / stats.totalProblems) * 100)}% of your problems. You're doing great!`
      });
    }

    if (stats.streakDays === 0 && stats.totalProblems > 0) {
      insights.push({
        icon: 'schedule',
        color: '#2196F3',
        title: 'Start Your Streak',
        description: 'Solve a problem today to start building your solving streak!'
      });
    }

    if (insights.length === 0) {
      insights.push({
        icon: 'lightbulb',
        color: '#673AB7',
        title: 'Keep Learning',
        description: 'Consistency is key! Try to solve at least one problem every day to build momentum.'
      });
    }
    return insights;
  }
}
