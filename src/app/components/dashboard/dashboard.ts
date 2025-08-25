import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatBadgeModule } from '@angular/material/badge';
import { RouterModule } from '@angular/router';
import { LeetcodeService } from '../../services/leetcode';
import { UserStats, Problem } from '../../models/problem';
import { Observable, combineLatest, interval, Subscription } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { ProgressChartComponent } from '../progress-chart/progress-chart';

interface DashboardMetrics {
  totalProblems: number;
  solvedProblems: number;
  attemptedProblems: number;
  todaySolved: number;
  weekSolved: number;
  monthSolved: number;
  currentStreak: number;
  longestStreak: number;
  averageTimePerProblem: number;
  favoriteTag: string;
  topCompany: string;
  successRate: number;
  productivityScore: number;
  weeklyGrowth: number;
  monthlyGrowth: number;
}

interface ActivityItem {
  type: 'solved' | 'attempted' | 'reviewed' | 'milestone';
  title: string;
  description: string;
  time: Date;
  icon: string;
  color: string;
  points?: number;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  unlocked: boolean;
  progress: number;
  maxProgress: number;
  unlockedDate?: Date;
}

interface WeeklyGoal {
  target: number;
  current: number;
  type: 'problems' | 'minutes' | 'streak';
  title: string;
  icon: string;
}

interface StudyStreak {
  current: number;
  longest: number;
  lastActiveDate: Date;
  isActive: boolean;
  daysThisWeek: number;
  weeklyTarget: number;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatTabsModule,
    MatChipsModule,
    MatMenuModule,
    MatTooltipModule,
    MatDialogModule,
    MatExpansionModule,
    MatGridListModule,
    MatBadgeModule,
    RouterModule,
    ProgressChartComponent
  ],
  template: `
    <div class="dashboard-container">
      <!-- Header Section with Real-time Clock -->
      <div class="dashboard-header">
        <div class="welcome-section">
          <div class="greeting-container">
            <h1>{{ getGreeting() }}</h1>
            <div class="current-time">
              <mat-icon>schedule</mat-icon>
              <span>{{ currentTime | date:'MMM d, y • h:mm a' }}</span>
            </div>
          </div>
          <p>{{ getMotivationalMessage() }}</p>
        </div>

        <!-- Quick Action Floating Buttons -->
        <div class="quick-actions-float">
          <button mat-mini-fab color="primary"
                  routerLink="/problems"
                  matTooltip="Add New Problem"
                  matTooltipPosition="left">
            <mat-icon>add</mat-icon>
          </button>
          <button mat-mini-fab color="accent"
                  (click)="startFocusSession()"
                  matTooltip="Start Focus Session"
                  matTooltipPosition="left">
            <mat-icon>play_circle_filled</mat-icon>
          </button>
        </div>
      </div>

      <!-- Enhanced Stats Grid with Animations -->
      <div class="enhanced-stats-grid" *ngIf="dashboardMetrics">
        <mat-card class="metric-card primary-metric"
                  [matBadge]="dashboardMetrics.todaySolved > 0 ? '+' + dashboardMetrics.todaySolved : ''"
                  matBadgePosition="above after"
                  matBadgeColor="accent">
          <div class="metric-icon">
            <mat-icon>assessment</mat-icon>
          </div>
          <div class="metric-content">
            <div class="metric-value">{{ dashboardMetrics.totalProblems }}</div>
            <div class="metric-label">Total Problems</div>
            <div class="metric-growth" [class.positive]="dashboardMetrics.weeklyGrowth > 0">
              <mat-icon>{{ dashboardMetrics.weeklyGrowth > 0 ? 'trending_up' : 'trending_flat' }}</mat-icon>
              <span>{{ dashboardMetrics.weeklyGrowth }}% this week</span>
            </div>
          </div>
        </mat-card>

        <mat-card class="metric-card success-metric">
          <div class="metric-icon">
            <mat-icon>check_circle</mat-icon>
          </div>
          <div class="metric-content">
            <div class="metric-value">{{ dashboardMetrics.solvedProblems }}</div>
            <div class="metric-label">Solved</div>
            <div class="metric-sub">
              <span>{{ dashboardMetrics.successRate }}% success rate</span>
            </div>
          </div>
        </mat-card>

        <mat-card class="metric-card streak-metric"
                  [class.streak-active]="studyStreak.isActive">
          <div class="metric-icon">
            <mat-icon>local_fire_department</mat-icon>
          </div>
          <div class="metric-content">
            <div class="metric-value">{{ studyStreak.current }}</div>
            <div class="metric-label">Day Streak</div>
            <div class="metric-sub">
              <span>Best: {{ studyStreak.longest }} days</span>
            </div>
          </div>
        </mat-card>

        <mat-card class="metric-card productivity-metric">
          <div class="metric-icon">
            <mat-icon>psychology</mat-icon>
          </div>
          <div class="metric-content">
            <div class="metric-value">{{ dashboardMetrics.productivityScore }}%</div>
            <div class="metric-label">Productivity</div>
            <div class="metric-sub">
              <span>{{ getProductivityLevel() }}</span>
            </div>
          </div>
        </mat-card>

        <mat-card class="metric-card time-metric">
          <div class="metric-icon">
            <mat-icon>schedule</mat-icon>
          </div>
          <div class="metric-content">
            <div class="metric-value">{{ dashboardMetrics.averageTimePerProblem }}m</div>
            <div class="metric-label">Avg Time</div>
            <div class="metric-sub">
              <span>Per problem</span>
            </div>
          </div>
        </mat-card>

        <mat-card class="metric-card focus-metric">
          <div class="metric-icon">
            <mat-icon>favorite</mat-icon>
          </div>
          <div class="metric-content">
            <div class="metric-value">{{ dashboardMetrics.favoriteTag || 'None' }}</div>
            <div class="metric-label">Favorite Tag</div>
            <div class="metric-sub">
              <span>Most solved</span>
            </div>
          </div>
        </mat-card>
      </div>

      <!-- Weekly Goals Section -->
      <mat-card class="goals-card">
        <mat-card-header>
          <mat-card-title>
            <mat-icon>flag</mat-icon>
            Weekly Goals
          </mat-card-title>
          <button mat-icon-button [matMenuTriggerFor]="goalsMenu">
            <mat-icon>more_vert</mat-icon>
          </button>
          <mat-menu #goalsMenu="matMenu">
            <button mat-menu-item (click)="editGoals()">
              <mat-icon>edit</mat-icon>
              Edit Goals
            </button>
            <button mat-menu-item (click)="resetGoals()">
              <mat-icon>refresh</mat-icon>
              Reset Goals
            </button>
          </mat-menu>
        </mat-card-header>
        <mat-card-content>
          <div class="goals-grid">
            <div class="goal-item" *ngFor="let goal of weeklyGoals">
              <div class="goal-header">
                <mat-icon [style.color]="getGoalColor(goal)">{{ goal.icon }}</mat-icon>
                <span class="goal-title">{{ goal.title }}</span>
                <span class="goal-progress">{{ goal.current }}/{{ goal.target }}</span>
              </div>
              <mat-progress-bar
                mode="determinate"
                [value]="(goal.current / goal.target) * 100"
                [color]="getGoalProgressColor(goal)">
              </mat-progress-bar>
              <div class="goal-status">
                <span [class]="getGoalStatusClass(goal)">
                  {{ getGoalStatus(goal) }}
                </span>
              </div>
            </div>
          </div>
        </mat-card-content>
      </mat-card>

      <!-- Main Content Tabs -->
      <mat-tab-group class="dashboard-tabs" selectedIndex="0">

        <!-- Overview Tab -->
        <mat-tab label="Overview">
          <div class="tab-content">
            <div class="overview-grid">

              <!-- Progress Chart -->
              <mat-card class="chart-card">
                <mat-card-header>
                  <mat-card-title>Progress Chart</mat-card-title>
                </mat-card-header>
                <mat-card-content>
                  <app-progress-chart [problems]="problems"></app-progress-chart>
                </mat-card-content>
              </mat-card>

              <!-- Difficulty Breakdown -->
              <mat-card class="breakdown-card">
                <mat-card-header>
                  <mat-card-title>Difficulty Breakdown</mat-card-title>
                </mat-card-header>
                <mat-card-content>
                  <div class="difficulty-stats" *ngIf="stats$ | async as stats">
                    <div class="difficulty-item easy">
                      <div class="difficulty-circle">
                        <div class="circle-progress" [style.--progress]="getProgressPercentage(stats.easyCount, getTotalDifficultyCount('Easy'))"></div>
                        <div class="circle-content">
                          <span class="count">{{ stats.easyCount }}</span>
                          <span class="total">{{ getTotalDifficultyCount('Easy') }}</span>
                        </div>
                      </div>
                      <div class="difficulty-label">Easy</div>
                    </div>

                    <div class="difficulty-item medium">
                      <div class="difficulty-circle">
                        <div class="circle-progress" [style.--progress]="getProgressPercentage(stats.mediumCount, getTotalDifficultyCount('Medium'))"></div>
                        <div class="circle-content">
                          <span class="count">{{ stats.mediumCount }}</span>
                          <span class="total">{{ getTotalDifficultyCount('Medium') }}</span>
                        </div>
                      </div>
                      <div class="difficulty-label">Medium</div>
                    </div>

                    <div class="difficulty-item hard">
                      <div class="difficulty-circle">
                        <div class="circle-progress" [style.--progress]="getProgressPercentage(stats.hardCount, getTotalDifficultyCount('Hard'))"></div>
                        <div class="circle-content">
                          <span class="count">{{ stats.hardCount }}</span>
                          <span class="total">{{ getTotalDifficultyCount('Hard') }}</span>
                        </div>
                      </div>
                      <div class="difficulty-label">Hard</div>
                    </div>
                  </div>
                </mat-card-content>
              </mat-card>

            </div>
          </div>
        </mat-tab>

        <!-- Activity Tab -->
        <mat-tab label="Activity">
          <div class="tab-content">
            <mat-card class="activity-card">
              <mat-card-header>
                <mat-card-title>Recent Activity</mat-card-title>
                <button mat-button (click)="refreshActivity()">
                  <mat-icon>refresh</mat-icon>
                  Refresh
                </button>
              </mat-card-header>
              <mat-card-content>
                <div class="activity-timeline">
                  <div class="activity-item" *ngFor="let activity of recentActivities">
                    <div class="activity-avatar" [style.background-color]="activity.color">
                      <mat-icon>{{ activity.icon }}</mat-icon>
                    </div>
                    <div class="activity-content">
                      <div class="activity-title">{{ activity.title }}</div>
                      <div class="activity-description">{{ activity.description }}</div>
                      <div class="activity-time">{{ activity.time | date:'MMM d, h:mm a' }}</div>
                    </div>
                    <div class="activity-points" *ngIf="activity.points">
                      +{{ activity.points }}pts
                    </div>
                  </div>

                  <div class="empty-activity" *ngIf="recentActivities.length === 0">
                    <mat-icon>history</mat-icon>
                    <p>No recent activity</p>
                    <button mat-raised-button color="primary" routerLink="/problems">
                      Start Solving Problems
                    </button>
                  </div>
                </div>
              </mat-card-content>
            </mat-card>
          </div>
        </mat-tab>

        <!-- Achievements Tab -->
        <mat-tab label="Achievements">
          <div class="tab-content">
            <mat-card class="achievements-card">
              <mat-card-header>
                <mat-card-title>Achievements & Milestones</mat-card-title>
                <div class="achievement-stats">
                  <mat-chip>{{ getUnlockedAchievements().length }}/{{ achievements.length }} Unlocked</mat-chip>
                </div>
              </mat-card-header>
              <mat-card-content>
                <div class="achievements-grid">
                  <div class="achievement-item"
                       *ngFor="let achievement of achievements"
                       [class.unlocked]="achievement.unlocked"
                       [class.locked]="!achievement.unlocked">

                    <div class="achievement-icon" [style.background-color]="achievement.unlocked ? achievement.color : '#ccc'">
                      <mat-icon>{{ achievement.icon }}</mat-icon>
                    </div>

                    <div class="achievement-info">
                      <div class="achievement-title">{{ achievement.title }}</div>
                      <div class="achievement-description">{{ achievement.description }}</div>

                      <div class="achievement-progress" *ngIf="!achievement.unlocked">
                        <mat-progress-bar
                          mode="determinate"
                          [value]="(achievement.progress / achievement.maxProgress) * 100">
                        </mat-progress-bar>
                        <span class="progress-text">{{ achievement.progress }}/{{ achievement.maxProgress }}</span>
                      </div>

                      <div class="achievement-unlocked" *ngIf="achievement.unlocked">
                        <mat-icon>check_circle</mat-icon>
                        <span>Unlocked {{ achievement.unlockedDate | date:'MMM d, y' }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </mat-card-content>
            </mat-card>
          </div>
        </mat-tab>

        <!-- Analytics Tab -->
        <mat-tab label="Analytics">
          <div class="tab-content">
            <div class="analytics-grid">

              <!-- Performance Metrics -->
              <mat-card class="performance-card">
                <mat-card-header>
                  <mat-card-title>Performance Metrics</mat-card-title>
                </mat-card-header>
                <mat-card-content>
                  <div class="performance-metrics">
                    <div class="metric-row">
                      <span class="metric-name">Problem Solving Speed</span>
                      <div class="metric-bar">
                        <mat-progress-bar mode="determinate" [value]="getSpeedMetric()" color="primary"></mat-progress-bar>
                      </div>
                      <span class="metric-value">{{ getSpeedMetric() }}%</span>
                    </div>

                    <div class="metric-row">
                      <span class="metric-name">Consistency</span>
                      <div class="metric-bar">
                        <mat-progress-bar mode="determinate" [value]="getConsistencyMetric()" color="accent"></mat-progress-bar>
                      </div>
                      <span class="metric-value">{{ getConsistencyMetric() }}%</span>
                    </div>

                    <div class="metric-row">
                      <span class="metric-name">Difficulty Progress</span>
                      <div class="metric-bar">
                        <mat-progress-bar mode="determinate" [value]="getDifficultyProgress()" color="warn"></mat-progress-bar>
                      </div>
                      <span class="metric-value">{{ getDifficultyProgress() }}%</span>
                    </div>
                  </div>
                </mat-card-content>
              </mat-card>

              <!-- Tag Analysis -->
              <mat-card class="tags-analysis-card">
                <mat-card-header>
                  <mat-card-title>Topic Mastery</mat-card-title>
                </mat-card-header>
                <mat-card-content>
                  <div class="tags-analysis">
                    <div class="tag-item" *ngFor="let tag of getTopTags()">
                      <div class="tag-info">
                        <span class="tag-name">{{ tag.name }}</span>
                        <span class="tag-count">{{ tag.count }} problems</span>
                      </div>
                      <div class="tag-mastery">
                        <mat-progress-bar
                          mode="determinate"
                          [value]="tag.mastery"
                          [color]="getMasteryColor(tag.mastery)">
                        </mat-progress-bar>
                        <span class="mastery-text">{{ tag.mastery }}%</span>
                      </div>
                    </div>
                  </div>
                </mat-card-content>
              </mat-card>

            </div>
          </div>
        </mat-tab>

      </mat-tab-group>

      <!-- Study Session Panel (Expandable) -->
      <mat-expansion-panel class="study-session-panel" [expanded]="focusSessionActive">
        <mat-expansion-panel-header>
          <mat-panel-title>
            <mat-icon>timer</mat-icon>
            Focus Session
          </mat-panel-title>
          <mat-panel-description>
            {{ focusSessionActive ? 'Session in progress...' : 'Start a focused study session' }}
          </mat-panel-description>
        </mat-expansion-panel-header>

        <div class="focus-session-content">
          <div class="session-timer" *ngIf="focusSessionActive">
            <div class="timer-display">
              <span class="time-value">{{ formatTime(sessionTime) }}</span>
              <span class="time-label">{{ getSessionStatus() }}</span>
            </div>
            <div class="timer-controls">
              <button mat-icon-button (click)="pauseSession()" *ngIf="!sessionPaused">
                <mat-icon>pause</mat-icon>
              </button>
              <button mat-icon-button (click)="resumeSession()" *ngIf="sessionPaused">
                <mat-icon>play_arrow</mat-icon>
              </button>
              <button mat-icon-button (click)="endSession()">
                <mat-icon>stop</mat-icon>
              </button>
            </div>
          </div>

          <div class="session-setup" *ngIf="!focusSessionActive">
            <p>Set a timer for focused problem solving</p>
            <div class="session-presets">
              <button mat-stroked-button (click)="startSession(25)">25 min</button>
              <button mat-stroked-button (click)="startSession(45)">45 min</button>
              <button mat-stroked-button (click)="startSession(60)">1 hour</button>
              <button mat-stroked-button (click)="startSession(90)">90 min</button>
            </div>
          </div>
        </div>
      </mat-expansion-panel>

    </div>
  `,
  styles: [`
    .dashboard-container {
      max-width: 1400px;
      margin: 0 auto;
      padding: 1.5rem;
      min-height: 100vh;
      background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
    }

    .dashboard-header {
      position: relative;
      margin-bottom: 2rem;
    }

    .greeting-container {
      display: flex;
      align-items: center;
      gap: 2rem;
      margin-bottom: 0.5rem;
    }

    .greeting-container h1 {
      font-size: 2.5rem;
      font-weight: 300;
      margin: 0;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      background-clip: text;
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .current-time {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: rgba(0, 0, 0, 0.6);
      font-size: 1rem;
    }

    .current-time mat-icon {
      font-size: 1.1rem;
    }

    .quick-actions-float {
      position: absolute;
      top: 0;
      right: 0;
      display: flex;
      gap: 1rem;
    }

    .enhanced-stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1.5rem;
      margin-bottom: 2rem;
    }

    .metric-card {
      padding: 1.5rem;
      border-radius: 16px;
      background: white;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
      border: 1px solid rgba(0, 0, 0, 0.05);
      transition: all 0.3s ease;
      position: relative;
      overflow: hidden;
    }

    .metric-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 4px;
      background: linear-gradient(90deg, var(--card-color), var(--card-color-light));
    }

    .metric-card.primary-metric {
      --card-color: #667eea;
      --card-color-light: #764ba2;
    }

    .metric-card.success-metric {
      --card-color: #4CAF50;
      --card-color-light: #81C784;
    }

    .metric-card.streak-metric {
      --card-color: #FF9800;
      --card-color-light: #FFB74D;
    }

    .metric-card.productivity-metric {
      --card-color: #9C27B0;
      --card-color-light: #BA68C8;
    }

    .metric-card.time-metric {
      --card-color: #2196F3;
      --card-color-light: #64B5F6;
    }

    .metric-card.focus-metric {
      --card-color: #E91E63;
      --card-color-light: #F06292;
    }

    .metric-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
    }

    .metric-card {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .metric-icon {
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background: var(--card-color);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .metric-icon mat-icon {
      color: white;
      font-size: 1.5rem;
    }

    .metric-content {
      flex: 1;
    }

    .metric-value {
      font-size: 2rem;
      font-weight: 600;
      color: var(--card-color);
      line-height: 1;
      margin-bottom: 0.25rem;
    }

    .metric-label {
      font-size: 0.9rem;
      color: rgba(0, 0, 0, 0.6);
      font-weight: 500;
      margin-bottom: 0.25rem;
    }

    .metric-growth {
      display: flex;
      align-items: center;
      gap: 0.25rem;
      font-size: 0.8rem;
      color: rgba(0, 0, 0, 0.5);
    }

    .metric-growth.positive {
      color: #4CAF50;
    }

    .metric-growth mat-icon {
      font-size: 0.9rem;
    }

    .metric-sub {
      font-size: 0.8rem;
      color: rgba(0, 0, 0, 0.5);
    }

    .streak-active .metric-icon {
      animation: pulse 2s infinite;
    }

    @keyframes pulse {
      0% { transform: scale(1); }
      50% { transform: scale(1.05); }
      100% { transform: scale(1); }
    }

    .goals-card {
      margin-bottom: 2rem;
      border-radius: 16px;
    }

    .goals-card mat-card-header {
      padding-bottom: 0;
    }

    .goals-grid {
      display: grid;
      gap: 1rem;
    }

    .goal-item {
      padding: 1rem;
      border-radius: 12px;
      background: rgba(0, 0, 0, 0.02);
      border: 1px solid rgba(0, 0, 0, 0.05);
    }

    .goal-header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0.5rem;
    }

    .goal-title {
      flex: 1;
      font-weight: 500;
    }

    .goal-progress {
      font-size: 0.9rem;
      color: rgba(0, 0, 0, 0.6);
    }

    .goal-status {
      margin-top: 0.5rem;
      text-align: right;
    }

    .goal-status span {
      font-size: 0.8rem;
      padding: 0.25rem 0.5rem;
      border-radius: 12px;
    }

    .goal-status .completed {
      background: rgba(76, 175, 80, 0.1);
      color: #4CAF50;
    }

    .goal-status .in-progress {
      background: rgba(255, 152, 0, 0.1);
      color: #FF9800;
    }

    .goal-status .not-started {
      background: rgba(0, 0, 0, 0.05);
      color: rgba(0, 0, 0, 0.6);
    }

    .dashboard-tabs {
      background: white;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
      margin-bottom: 2rem;
    }

    .tab-content {
      padding: 2rem;
    }

    .overview-grid {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 2rem;
    }

    .chart-card {
      border-radius: 12px;
    }

    .breakdown-card {
      border-radius: 12px;
    }

    .difficulty-stats {
      display: flex;
      flex-direction: column;
      gap: 2rem;
      align-items: center;
    }

    .difficulty-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
    }

    .difficulty-circle {
      position: relative;
      width: 80px;
      height: 80px;
      border-radius: 50%;
      background: conic-gradient(
        var(--difficulty-color) calc(var(--progress) * 1%),
        rgba(0, 0, 0, 0.1) calc(var(--progress) * 1%)
      );
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .difficulty-circle::before {
      content: '';
      position: absolute;
      inset: 8px;
      border-radius: 50%;
      background: white;
    }

    .circle-content {
      position: relative;
      z-index: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      font-weight: 600;
    }

    .circle-content .count {
      font-size: 1.2rem;
      color: var(--difficulty-color);
    }

    .circle-content .total {
      font-size: 0.8rem;
      color: rgba(0, 0, 0, 0.5);
    }

    .difficulty-item.easy {
      --difficulty-color: #4CAF50;
    }

    .difficulty-item.medium {
      --difficulty-color: #FF9800;
    }

    .difficulty-item.hard {
      --difficulty-color: #F44336;
    }

    .difficulty-label {
      font-weight: 500;
      color: var(--difficulty-color);
    }

    .activity-card {
      border-radius: 12px;
    }

    .activity-timeline {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .activity-item {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem;
      border-radius: 12px;
      background: rgba(0, 0, 0, 0.02);
      border: 1px solid rgba(0, 0, 0, 0.05);
      transition: all 0.2s ease;
    }

    .activity-item:hover {
      background: rgba(0, 0, 0, 0.04);
      transform: translateX(4px);
    }

    .activity-avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      flex-shrink: 0;
    }

    .activity-content {
      flex: 1;
    }

    .activity-title {
      font-weight: 500;
      margin-bottom: 0.25rem;
    }

    .activity-description {
      font-size: 0.9rem;
      color: rgba(0, 0, 0, 0.6);
      margin-bottom: 0.25rem;
    }

    .activity-time {
      font-size: 0.8rem;
      color: rgba(0, 0, 0, 0.5);
    }

    .activity-points {
      font-weight: 600;
      color: #4CAF50;
      font-size: 0.9rem;
    }

    .empty-activity {
      text-align: center;
      padding: 3rem 2rem;
      color: rgba(0, 0, 0, 0.6);
    }

    .empty-activity mat-icon {
      font-size: 3rem;
      width: 3rem;
      height: 3rem;
      margin-bottom: 1rem;
      color: rgba(0, 0, 0, 0.3);
    }

    .achievements-card {
      border-radius: 12px;
    }

    .achievement-stats {
      display: flex;
      gap: 0.5rem;
    }

    .achievements-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 1rem;
    }

    .achievement-item {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem;
      border-radius: 12px;
      background: rgba(0, 0, 0, 0.02);
      border: 1px solid rgba(0, 0, 0, 0.05);
      transition: all 0.3s ease;
    }

    .achievement-item.unlocked {
      background: rgba(76, 175, 80, 0.1);
      border-color: #4CAF50;
    }

    .achievement-item.locked {
      opacity: 0.6;
    }

    .achievement-icon {
      width: 50px;
      height: 50px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      flex-shrink: 0;
    }

    .achievement-info {
      flex: 1;
    }

    .achievement-title {
      font-weight: 600;
      margin-bottom: 0.25rem;
    }

    .achievement-description {
      font-size: 0.9rem;
      color: rgba(0, 0, 0, 0.6);
      margin-bottom: 0.5rem;
    }

    .achievement-progress {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .achievement-progress mat-progress-bar {
      flex: 1;
    }

    .progress-text {
      font-size: 0.8rem;
      color: rgba(0, 0, 0, 0.6);
    }

    .achievement-unlocked {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: #4CAF50;
      font-size: 0.9rem;
    }

    .analytics-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 2rem;
    }

    .performance-card,
    .tags-analysis-card {
      border-radius: 12px;
    }

    .performance-metrics {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .metric-row {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .metric-name {
      flex: 0 0 140px;
      font-size: 0.9rem;
      font-weight: 500;
    }

    .metric-bar {
      flex: 1;
    }

    .metric-value {
      flex: 0 0 50px;
      text-align: right;
      font-weight: 600;
      font-size: 0.9rem;
    }

    .tags-analysis {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .tag-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1rem;
    }

    .tag-info {
      flex: 1;
    }

    .tag-name {
      font-weight: 500;
      display: block;
    }

    .tag-count {
      font-size: 0.8rem;
      color: rgba(0, 0, 0, 0.6);
    }

    .tag-mastery {
      flex: 0 0 120px;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .tag-mastery mat-progress-bar {
      flex: 1;
    }

    .mastery-text {
      font-size: 0.8rem;
      font-weight: 600;
    }

    .study-session-panel {
      border-radius: 12px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
    }

    .focus-session-content {
      padding: 1rem 0;
    }

    .session-timer {
      text-align: center;
    }

    .timer-display {
      margin-bottom: 1rem;
    }

    .time-value {
      font-size: 3rem;
      font-weight: 300;
      color: #667eea;
      display: block;
    }

    .time-label {
      font-size: 1rem;
      color: rgba(0, 0, 0, 0.6);
    }

    .timer-controls {
      display: flex;
      justify-content: center;
      gap: 1rem;
    }

    .session-setup {
      text-align: center;
    }

    .session-presets {
      display: flex;
      justify-content: center;
      gap: 1rem;
      margin-top: 1rem;
    }

    @media (max-width: 1200px) {
      .overview-grid {
        grid-template-columns: 1fr;
      }

      .analytics-grid {
        grid-template-columns: 1fr;
      }
    }

    @media (max-width: 768px) {
      .dashboard-container {
        padding: 1rem;
      }

      .enhanced-stats-grid {
        grid-template-columns: repeat(2, 1fr);
        gap: 1rem;
      }

      .greeting-container {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.5rem;
      }

      .greeting-container h1 {
        font-size: 2rem;
      }

      .quick-actions-float {
        position: static;
        justify-content: center;
        margin-top: 1rem;
      }

      .achievements-grid {
        grid-template-columns: 1fr;
      }

      .session-presets {
        flex-wrap: wrap;
      }
    }

    :host-context(.dark-theme) {
      .dashboard-container {
        background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
      }

      .metric-card,
      .goals-card,
      .dashboard-tabs,
      .chart-card,
      .breakdown-card,
      .activity-card,
      .achievements-card,
      .performance-card,
      .tags-analysis-card,
      .study-session-panel {
        background: var(--bg-secondary);
        border-color: var(--border-color);
      }

      .current-time {
        color: var(--text-secondary);
      }

      .metric-label,
      .goal-progress,
      .activity-description,
      .activity-time,
      .achievement-description,
      .tag-count {
        color: var(--text-secondary);
      }

      .goal-item,
      .activity-item,
      .achievement-item {
        background: var(--bg-surface);
        border-color: var(--border-color);
      }

      .time-label {
        color: var(--text-secondary);
      }
    }
  `]
})
export class DashboardComponent implements OnInit, OnDestroy {
  stats$: Observable<UserStats>;
  problems: Problem[] = [];
  currentTime = new Date();

  // Enhanced dashboard data
  dashboardMetrics: DashboardMetrics | null = null;
  recentActivities: ActivityItem[] = [];
  achievements: Achievement[] = [];
  weeklyGoals: WeeklyGoal[] = [];
  studyStreak: StudyStreak = {
    current: 0,
    longest: 0,
    lastActiveDate: new Date(),
    isActive: false,
    daysThisWeek: 0,
    weeklyTarget: 5
  };

  // Focus session
  focusSessionActive = false;
  sessionTime = 0;
  sessionDuration = 0;
  sessionPaused = false;
  private sessionInterval?: any;
  private timeUpdateSubscription?: Subscription;

  constructor(
    private leetcodeService: LeetcodeService,
    private dialog: MatDialog
  ) {
    this.stats$ = this.leetcodeService.stats$;
    this.initializeAchievements();
    this.initializeWeeklyGoals();
  }

  ngOnInit(): void {
    this.leetcodeService.problems$.subscribe(problems => {
      this.problems = problems;
      this.updateDashboardMetrics();
      this.updateRecentActivities();
      this.updateAchievements();
      this.updateStudyStreak();
    });

    // Update time every minute
    this.timeUpdateSubscription = interval(60000).pipe(
      startWith(0)
    ).subscribe(() => {
      this.currentTime = new Date();
    });
  }

  ngOnDestroy(): void {
    this.timeUpdateSubscription?.unsubscribe();
    this.endSession();
  }

  private updateDashboardMetrics(): void {
    const solvedProblems = this.problems.filter(p => p.status === 'Solved');
    const attemptedProblems = this.problems.filter(p => p.status === 'Attempted');

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    const monthAgo = new Date(today);
    monthAgo.setMonth(monthAgo.getMonth() - 1);

    const todaySolved = solvedProblems.filter(p =>
      p.solvedDate && p.solvedDate >= today
    ).length;

    const weekSolved = solvedProblems.filter(p =>
      p.solvedDate && p.solvedDate >= weekAgo
    ).length;

    const monthSolved = solvedProblems.filter(p =>
      p.solvedDate && p.solvedDate >= monthAgo
    ).length;

    // Calculate average time
    const totalTime = this.problems.reduce((sum, p) => sum + (p.timeSpent || 0), 0);
    const averageTime = this.problems.length > 0 ? Math.round(totalTime / this.problems.length) : 0;

    // Get favorite tag
    const tagCounts: { [key: string]: number } = {};
    solvedProblems.forEach(p => {
      p.tags.forEach(tag => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    });
    const favoriteTag = Object.keys(tagCounts).reduce((a, b) =>
      tagCounts[a] > tagCounts[b] ? a : b, ''
    );

    // Get top company
    const companyCounts: { [key: string]: number } = {};
    solvedProblems.forEach(p => {
      (p.companies || []).forEach(company => {
        companyCounts[company] = (companyCounts[company] || 0) + 1;
      });
    });
    const topCompany = Object.keys(companyCounts).reduce((a, b) =>
      companyCounts[a] > companyCounts[b] ? a : b, ''
    );

    const successRate = this.problems.length > 0 ?
      Math.round((solvedProblems.length / this.problems.length) * 100) : 0;

    // Calculate productivity score (combination of success rate, consistency, and recent activity)
    const consistencyScore = this.calculateConsistencyScore();
    const recentActivityScore = Math.min(weekSolved * 10, 50);
    const productivityScore = Math.round((successRate * 0.4) + (consistencyScore * 0.3) + (recentActivityScore * 0.3));

    this.dashboardMetrics = {
      totalProblems: this.problems.length,
      solvedProblems: solvedProblems.length,
      attemptedProblems: attemptedProblems.length,
      todaySolved,
      weekSolved,
      monthSolved,
      currentStreak: this.studyStreak.current,
      longestStreak: this.studyStreak.longest,
      averageTimePerProblem: averageTime,
      favoriteTag,
      topCompany,
      successRate,
      productivityScore,
      weeklyGrowth: this.calculateWeeklyGrowth(),
      monthlyGrowth: this.calculateMonthlyGrowth()
    };
  }

  private calculateConsistencyScore(): number {
    // Calculate how consistently the user has been solving problems
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      return date;
    });

    const activeDays = last30Days.filter(date => {
      return this.problems.some(p =>
        p.solvedDate &&
        p.solvedDate.toDateString() === date.toDateString()
      );
    }).length;

    return Math.round((activeDays / 30) * 100);
  }

  private calculateWeeklyGrowth(): number {
    const thisWeek = this.getProblemsInDateRange(7);
    const lastWeek = this.getProblemsInDateRange(14, 7);

    if (lastWeek.length === 0) return thisWeek.length > 0 ? 100 : 0;

    return Math.round(((thisWeek.length - lastWeek.length) / lastWeek.length) * 100);
  }

  private calculateMonthlyGrowth(): number {
    const thisMonth = this.getProblemsInDateRange(30);
    const lastMonth = this.getProblemsInDateRange(60, 30);

    if (lastMonth.length === 0) return thisMonth.length > 0 ? 100 : 0;

    return Math.round(((thisMonth.length - lastMonth.length) / lastMonth.length) * 100);
  }

  private getProblemsInDateRange(days: number, offset: number = 0): Problem[] {
    const endDate = new Date();
    endDate.setDate(endDate.getDate() - offset);
    endDate.setHours(23, 59, 59, 999);

    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    return this.problems.filter(p =>
      p.solvedDate &&
      p.solvedDate >= startDate &&
      p.solvedDate <= endDate
    );
  }

  private updateRecentActivities(): void {
    const activities: ActivityItem[] = [];

    // Add solved problems
    this.problems
      .filter(p => p.status === 'Solved' && p.solvedDate)
      .sort((a, b) => (b.solvedDate?.getTime() || 0) - (a.solvedDate?.getTime() || 0))
      .slice(0, 10)
      .forEach(problem => {
        activities.push({
          type: 'solved',
          title: `Solved "${problem.title}"`,
          description: `${problem.difficulty} • ${problem.tags.slice(0, 2).join(', ')}`,
          time: problem.solvedDate!,
          icon: 'check_circle',
          color: '#4CAF50',
          points: this.getPointsForDifficulty(problem.difficulty)
        });
      });

    // Add attempted problems
    this.problems
      .filter(p => p.status === 'Attempted' && p.lastAttemptDate)
      .sort((a, b) => (b.lastAttemptDate?.getTime() || 0) - (a.lastAttemptDate?.getTime() || 0))
      .slice(0, 5)
      .forEach(problem => {
        activities.push({
          type: 'attempted',
          title: `Attempted "${problem.title}"`,
          description: `${problem.difficulty} • ${problem.attempts} attempt${problem.attempts > 1 ? 's' : ''}`,
          time: problem.lastAttemptDate!,
          icon: 'play_circle_outline',
          color: '#FF9800'
        });
      });

    // Sort all activities by time
    this.recentActivities = activities
      .sort((a, b) => b.time.getTime() - a.time.getTime())
      .slice(0, 15);
  }

  private getPointsForDifficulty(difficulty: string): number {
    switch (difficulty) {
      case 'Easy': return 1;
      case 'Medium': return 3;
      case 'Hard': return 5;
      default: return 1;
    }
  }

  private initializeAchievements(): void {
    this.achievements = [
      {
        id: 'first_solve',
        title: 'First Steps',
        description: 'Solve your first problem',
        icon: 'star',
        color: '#4CAF50',
        unlocked: false,
        progress: 0,
        maxProgress: 1
      },
      {
        id: 'speed_demon',
        title: 'Speed Demon',
        description: 'Solve 10 problems in one day',
        icon: 'flash_on',
        color: '#FF9800',
        unlocked: false,
        progress: 0,
        maxProgress: 10
      },
      {
        id: 'streak_master',
        title: 'Streak Master',
        description: 'Maintain a 7-day solving streak',
        icon: 'local_fire_department',
        color: '#F44336',
        unlocked: false,
        progress: 0,
        maxProgress: 7
      },
      {
        id: 'century_club',
        title: 'Century Club',
        description: 'Solve 100 problems',
        icon: 'emoji_events',
        color: '#9C27B0',
        unlocked: false,
        progress: 0,
        maxProgress: 100
      },
      {
        id: 'hard_core',
        title: 'Hard Core',
        description: 'Solve 25 hard problems',
        icon: 'fitness_center',
        color: '#E91E63',
        unlocked: false,
        progress: 0,
        maxProgress: 25
      },
      {
        id: 'tag_master',
        title: 'Tag Master',
        description: 'Solve problems in 10 different tags',
        icon: 'category',
        color: '#2196F3',
        unlocked: false,
        progress: 0,
        maxProgress: 10
      }
    ];
  }

  private updateAchievements(): void {
    const solvedProblems = this.problems.filter(p => p.status === 'Solved');

    // First Steps
    const firstSteps = this.achievements.find(a => a.id === 'first_solve');
    if (firstSteps) {
      firstSteps.progress = Math.min(solvedProblems.length, 1);
      if (!firstSteps.unlocked && firstSteps.progress >= firstSteps.maxProgress) {
        firstSteps.unlocked = true;
        firstSteps.unlockedDate = new Date();
      }
    }

    // Century Club
    const centuryClub = this.achievements.find(a => a.id === 'century_club');
    if (centuryClub) {
      centuryClub.progress = solvedProblems.length;
      if (!centuryClub.unlocked && centuryClub.progress >= centuryClub.maxProgress) {
        centuryClub.unlocked = true;
        centuryClub.unlockedDate = new Date();
      }
    }

    // Hard Core
    const hardCore = this.achievements.find(a => a.id === 'hard_core');
    if (hardCore) {
      hardCore.progress = solvedProblems.filter(p => p.difficulty === 'Hard').length;
      if (!hardCore.unlocked && hardCore.progress >= hardCore.maxProgress) {
        hardCore.unlocked = true;
        hardCore.unlockedDate = new Date();
      }
    }

    // Streak Master
    const streakMaster = this.achievements.find(a => a.id === 'streak_master');
    if (streakMaster) {
      streakMaster.progress = Math.min(this.studyStreak.current, 7);
      if (!streakMaster.unlocked && streakMaster.progress >= streakMaster.maxProgress) {
        streakMaster.unlocked = true;
        streakMaster.unlockedDate = new Date();
      }
    }

    // Tag Master
    const tagMaster = this.achievements.find(a => a.id === 'tag_master');
    if (tagMaster) {
      const uniqueTags = new Set();
      solvedProblems.forEach(p => p.tags.forEach(tag => uniqueTags.add(tag)));
      tagMaster.progress = uniqueTags.size;
      if (!tagMaster.unlocked && tagMaster.progress >= tagMaster.maxProgress) {
        tagMaster.unlocked = true;
        tagMaster.unlockedDate = new Date();
      }
    }

    // Speed Demon (check today's solved count)
    const speedDemon = this.achievements.find(a => a.id === 'speed_demon');
    if (speedDemon && this.dashboardMetrics) {
      speedDemon.progress = this.dashboardMetrics.todaySolved;
      if (!speedDemon.unlocked && speedDemon.progress >= speedDemon.maxProgress) {
        speedDemon.unlocked = true;
        speedDemon.unlockedDate = new Date();
      }
    }
  }

  private initializeWeeklyGoals(): void {
    this.weeklyGoals = [
      {
        target: 5,
        current: 0,
        type: 'problems',
        title: 'Solve 5 Problems',
        icon: 'assignment_turned_in'
      },
      {
        target: 3,
        current: 0,
        type: 'streak',
        title: 'Maintain 3-Day Streak',
        icon: 'local_fire_department'
      },
      {
        target: 120,
        current: 0,
        type: 'minutes',
        title: '2 Hours Study Time',
        icon: 'schedule'
      }
    ];

    this.updateWeeklyGoals();
  }

  private updateWeeklyGoals(): void {
    if (!this.dashboardMetrics) return;

    // Update problems goal
    const problemsGoal = this.weeklyGoals.find(g => g.type === 'problems');
    if (problemsGoal) {
      problemsGoal.current = this.dashboardMetrics.weekSolved;
    }

    // Update streak goal
    const streakGoal = this.weeklyGoals.find(g => g.type === 'streak');
    if (streakGoal) {
      streakGoal.current = Math.min(this.studyStreak.current, streakGoal.target);
    }

    // Update time goal
    const timeGoal = this.weeklyGoals.find(g => g.type === 'minutes');
    if (timeGoal) {
      const weeklyTime = this.getProblemsInDateRange(7)
        .reduce((sum, p) => sum + (p.timeSpent || 0), 0);
      timeGoal.current = weeklyTime;
    }
  }

  private updateStudyStreak(): void {
    const solvedProblems = this.problems
      .filter(p => p.status === 'Solved' && p.solvedDate)
      .sort((a, b) => (b.solvedDate?.getTime() || 0) - (a.solvedDate?.getTime() || 0));

    if (solvedProblems.length === 0) {
      this.studyStreak = {
        current: 0,
        longest: 0,
        lastActiveDate: new Date(),
        isActive: false,
        daysThisWeek: 0,
        weeklyTarget: 5
      };
      return;
    }

    // Calculate current streak
    let currentStreak = 0;
    let longestStreak = 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dates = [...new Set(solvedProblems.map(p => p.solvedDate!.toDateString()))]
      .map(dateStr => new Date(dateStr))
      .sort((a, b) => b.getTime() - a.getTime());

    // Check if active today or yesterday
    const isActiveToday = dates.some(date => date.toDateString() === today.toDateString());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const isActiveYesterday = dates.some(date => date.toDateString() === yesterday.toDateString());

    if (isActiveToday || isActiveYesterday) {
      let checkDate = new Date(today);
      if (!isActiveToday) {
        checkDate = yesterday;
      }

      while (dates.some(date => date.toDateString() === checkDate.toDateString())) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      }
    }

    // Calculate longest streak
    let tempStreak = 0;
    for (let i = 0; i < dates.length; i++) {
      if (i === 0 || this.isConsecutiveDay(dates[i], dates[i - 1])) {
        tempStreak++;
        longestStreak = Math.max(longestStreak, tempStreak);
      } else {
        tempStreak = 1;
      }
    }

    this.studyStreak = {
      current: currentStreak,
      longest: longestStreak,
      lastActiveDate: dates[0] || new Date(),
      isActive: isActiveToday,
      daysThisWeek: this.getDaysThisWeek(),
      weeklyTarget: 5
    };
  }

  private isConsecutiveDay(current: Date, previous: Date): boolean {
    const diffTime = previous.getTime() - current.getTime();
    const diffDays = diffTime / (1000 * 60 * 60 * 24);
    return diffDays === 1;
  }

  private getDaysThisWeek(): number {
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    return this.problems.filter(p =>
      p.status === 'Solved' &&
      p.solvedDate &&
      p.solvedDate >= startOfWeek
    ).length;
  }

  getConsistencyMetric(): number {
    return this.calculateConsistencyScore();
  }

  getSpeedMetric(): number {
    if (!this.dashboardMetrics) return 0;
    const avgTime = this.dashboardMetrics.averageTimePerProblem;
    // Convert to percentage where lower time = higher score
    // Assuming 30 minutes is average, 15 minutes is excellent (100%)
    return Math.min(Math.max(100 - ((avgTime - 15) * 2), 0), 100);
  }

  getDifficultyProgress(): number {
    const easyCount = this.problems.filter(p => p.difficulty === 'Easy' && p.status === 'Solved').length;
    const mediumCount = this.problems.filter(p => p.difficulty === 'Medium' && p.status === 'Solved').length;
    const hardCount = this.problems.filter(p => p.difficulty === 'Hard' && p.status === 'Solved').length;

    const totalSolved = easyCount + mediumCount + hardCount;
    if (totalSolved === 0) return 0;

    // Weight harder problems more
    const weightedScore = (easyCount * 1 + mediumCount * 2 + hardCount * 3) / (totalSolved * 3);
    return Math.round(weightedScore * 100);
  }

  getGreeting(): string {
    const hour = new Date().getHours();

    if (hour < 12) {
      return 'Good Morning!';
    } else if (hour < 17) {
      return 'Good Afternoon!';
    } else {
      return 'Good Evening!';
    }
  }

  getMotivationalMessage(): string {
    const hour = new Date().getHours();
    const solvedToday = this.dashboardMetrics?.todaySolved || 0;

    if (solvedToday > 0) {
      return `Great job! You've solved ${solvedToday} problem${solvedToday > 1 ? 's' : ''} today. Keep up the momentum!`;
    }

    if (hour < 12) {
      return "Ready to tackle some challenging problems today?";
    } else if (hour < 17) {
      return "Perfect time for some focused problem solving!";
    } else {
      return "End your day strong with some coding practice!";
    }
  }

  getProductivityLevel(): string {
    if (!this.dashboardMetrics) return 'Getting Started';

    const score = this.dashboardMetrics.productivityScore;
    if (score >= 90) return 'Exceptional';
    if (score >= 80) return 'Excellent';
    if (score >= 70) return 'Very Good';
    if (score >= 60) return 'Good';
    if (score >= 50) return 'Average';
    return 'Room for Growth';
  }

  getGoalColor(goal: WeeklyGoal): string {
    const progress = goal.current / goal.target;
    if (progress >= 1) return '#4CAF50';
    if (progress >= 0.7) return '#FF9800';
    return '#9E9E9E';
  }

  getGoalProgressColor(goal: WeeklyGoal): 'primary' | 'accent' | 'warn' {
    const progress = goal.current / goal.target;
    if (progress >= 1) return 'primary';
    if (progress >= 0.7) return 'accent';
    return 'warn';
  }

  getGoalStatus(goal: WeeklyGoal): string {
    const progress = goal.current / goal.target;
    if (progress >= 1) return 'Completed';
    if (progress >= 0.7) return 'Almost There';
    if (progress > 0) return 'In Progress';
    return 'Not Started';
  }

  getGoalStatusClass(goal: WeeklyGoal): string {
    const progress = goal.current / goal.target;
    if (progress >= 1) return 'completed';
    if (progress > 0) return 'in-progress';
    return 'not-started';
  }

  getProgressPercentage(count: number, total: number): number {
    return total > 0 ? (count / total) * 100 : 0;
  }

  getTotalDifficultyCount(difficulty: string): number {
    // These are approximate total counts from LeetCode
    switch (difficulty) {
      case 'Easy': return 800;
      case 'Medium': return 1700;
      case 'Hard': return 700;
      default: return 0;
    }
  }

  getUnlockedAchievements(): Achievement[] {
    return this.achievements.filter(a => a.unlocked);
  }

  getTopTags(): any[] {
    const tagCounts: { [key: string]: number } = {};
    const solvedProblems = this.problems.filter(p => p.status === 'Solved');

    solvedProblems.forEach(p => {
      p.tags.forEach(tag => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    });

    return Object.entries(tagCounts)
      .map(([name, count]) => ({
        name,
        count,
        mastery: Math.min((count / 10) * 100, 100) // 10 problems = 100% mastery
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }

  getMasteryColor(mastery: number): 'primary' | 'accent' | 'warn' {
    if (mastery >= 80) return 'primary';
    if (mastery >= 50) return 'accent';
    return 'warn';
  }

  startFocusSession(): void {
    // Default to 25 minutes (Pomodoro technique)
    this.startSession(25);
  }

  startSession(minutes: number): void {
    this.sessionDuration = minutes * 60; // Convert to seconds
    this.sessionTime = this.sessionDuration;
    this.focusSessionActive = true;
    this.sessionPaused = false;

    this.sessionInterval = setInterval(() => {
      if (!this.sessionPaused && this.sessionTime > 0) {
        this.sessionTime--;
      } else if (this.sessionTime === 0) {
        this.endSession();
        // Could add notification or sound here
      }
    }, 1000);
  }

  pauseSession(): void {
    this.sessionPaused = true;
  }

  resumeSession(): void {
    this.sessionPaused = false;
  }

  endSession(): void {
    if (this.sessionInterval) {
      clearInterval(this.sessionInterval);
      this.sessionInterval = undefined;
    }
    this.focusSessionActive = false;
    this.sessionTime = 0;
    this.sessionPaused = false;
  }

  formatTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  getSessionStatus(): string {
    if (this.sessionPaused) return 'Paused';
    return 'Focus Time';
  }

  editGoals(): void {
    // Could open a dialog to edit goals
    console.log('Edit goals clicked');
  }

  resetGoals(): void {
    this.weeklyGoals.forEach(goal => {
      goal.current = 0;
    });
  }

    refreshActivity(): void {
      this.updateRecentActivities();
    }
  }
