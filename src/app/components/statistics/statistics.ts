import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatChipsModule } from '@angular/material/chips';
import { LeetcodeService } from '../../services/leetcode';
import { UserStats, Problem } from '../../models/problem';
import { Observable, Subject, combineLatest } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { ProgressChartComponent } from '../progress-chart/progress-chart';

interface DifficultyStats {
  difficulty: string;
  solved: number;
  total: number;
  percentage: number;
  color: string;
}

interface TagStats {
  tag: string;
  count: number;
  percentage: number;
}

interface CompanyStats {
  company: string;
  count: number;
  percentage: number;
}

interface StreakData {
  date: Date;
  count: number;
  isToday: boolean;
}

interface MonthlyProgress {
  month: string;
  solved: number;
  attempted: number;
}

@Component({
  selector: 'app-statistics',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatProgressBarModule,
    MatTabsModule,
    MatButtonToggleModule,
    MatChipsModule,
    ProgressChartComponent
  ],
  template: `
    <div class="statistics-container">
      <h2 class="page-title">Statistics & Analytics</h2>

      <!-- Quick Stats Overview -->
      <div class="quick-stats" *ngIf="currentStats">
        <mat-card class="stat-card primary">
          <mat-card-content>
            <div class="stat-icon">
              <mat-icon>assignment</mat-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ currentStats.totalProblems }}</div>
              <div class="stat-label">Total Problems</div>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="stat-card success">
          <mat-card-content>
            <div class="stat-icon">
              <mat-icon>check_circle</mat-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ currentStats.solvedProblems }}</div>
              <div class="stat-label">Solved</div>
              <div class="stat-subtitle">{{ cachedSuccessRate }}% Success Rate</div>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="stat-card warning">
          <mat-card-content>
            <div class="stat-icon">
              <mat-icon>local_fire_department</mat-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ currentStats.streakDays }}</div>
              <div class="stat-label">Day Streak</div>
              <div class="stat-subtitle">{{ cachedStreakMessage }}</div>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="stat-card info">
          <mat-card-content>
            <div class="stat-icon">
              <mat-icon>speed</mat-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ cachedAverageTime }}</div>
              <div class="stat-label">Avg Time</div>
              <div class="stat-subtitle">per problem</div>
            </div>
          </mat-card-content>
        </mat-card>
      </div>

      <!-- Detailed Analytics Tabs -->
      <mat-card class="analytics-card">
        <mat-tab-group>
          <!-- Overview Tab -->
          <mat-tab label="Overview">
            <div class="tab-content">
              <!-- Progress Chart -->
              <app-progress-chart [problems]="currentProblems"></app-progress-chart>

              <!-- Difficulty Breakdown -->
              <div class="charts-grid">
                <mat-card class="chart-card">
                  <mat-card-header>
                    <mat-card-title>
                      <mat-icon>assessment</mat-icon>
                      Difficulty Breakdown
                    </mat-card-title>
                  </mat-card-header>
                  <mat-card-content>
                    <div class="difficulty-chart">
                      <div class="difficulty-legend">
                        <div class="legend-item" *ngFor="let item of cachedDifficultyStats">
                          <div class="legend-color" [style.background-color]="item.color"></div>
                          <div class="legend-info">
                            <span class="legend-label">{{ item.difficulty }}</span>
                            <span class="legend-value">{{ item.solved }}/{{ item.total }} ({{ item.percentage }}%)</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </mat-card-content>
                </mat-card>

                <!-- Monthly Progress -->
                <mat-card class="chart-card">
                  <mat-card-header>
                    <mat-card-title>
                      <mat-icon>calendar_month</mat-icon>
                      Monthly Progress
                    </mat-card-title>
                  </mat-card-header>
                  <mat-card-content>
                    <div class="monthly-chart">
                      <div class="month-item" *ngFor="let month of cachedMonthlyProgress">
                        <div class="month-header">
                          <span class="month-name">{{ month.month }}</span>
                          <span class="month-total">{{ month.solved + month.attempted }}</span>
                        </div>
                        <div class="month-bars">
                          <div class="progress-bar">
                            <div class="bar solved"
                                 [style.width.%]="getBarWidth(month.solved, month.solved + month.attempted)">
                            </div>
                            <div class="bar attempted"
                                 [style.width.%]="getBarWidth(month.attempted, month.solved + month.attempted)">
                            </div>
                          </div>
                        </div>
                        <div class="month-stats">
                          <span class="solved-count">{{ month.solved }} solved</span>
                          <span class="attempted-count">{{ month.attempted }} attempted</span>
                        </div>
                      </div>
                    </div>
                  </mat-card-content>
                </mat-card>
              </div>
            </div>
          </mat-tab>

          <!-- Performance Tab -->
          <mat-tab label="Performance">
            <div class="tab-content">
              <!-- Performance Metrics -->
              <div class="metrics-grid">
                <mat-card class="metric-card">
                  <mat-card-header>
                    <mat-card-title>Solving Speed</mat-card-title>
                  </mat-card-header>
                  <mat-card-content>
                    <div class="metric-value">{{ cachedAverageTime }}</div>
                    <div class="metric-label">Average per problem</div>
                    <div class="metric-comparison">
                      <span class="improvement" [class.positive]="cachedSpeedImproving">
                        {{ cachedSpeedTrend }}
                      </span>
                    </div>
                  </mat-card-content>
                </mat-card>

                <mat-card class="metric-card">
                  <mat-card-header>
                    <mat-card-title>Success Rate</mat-card-title>
                  </mat-card-header>
                  <mat-card-content>
                    <div class="metric-value">{{ cachedSuccessRate }}%</div>
                    <div class="metric-label">Problems solved on first try</div>
                  </mat-card-content>
                </mat-card>

                <mat-card class="metric-card">
                  <mat-card-header>
                    <mat-card-title>Most Active Day</mat-card-title>
                  </mat-card-header>
                  <mat-card-content>
                    <div class="metric-value">{{ cachedMostActiveDay }}</div>
                    <div class="metric-label">Day of the week</div>
                  </mat-card-content>
                </mat-card>
              </div>
            </div>
          </mat-tab>

          <!-- Tags & Companies Tab -->
          <mat-tab label="Tags & Companies">
            <div class="tab-content">
              <div class="tags-companies-grid">
                <!-- Top Tags -->
                <mat-card class="tags-card">
                  <mat-card-header>
                    <mat-card-title>
                      <mat-icon>label</mat-icon>
                      Most Used Tags
                    </mat-card-title>
                  </mat-card-header>
                  <mat-card-content>
                    <div class="tag-item" *ngFor="let tag of cachedTopTags">
                      <span class="tag-name">{{ tag.tag }}</span>
                      <div class="tag-bar">
                        <div class="tag-progress" [style.width.%]="tag.percentage"></div>
                      </div>
                      <span class="tag-count">{{ tag.count }}</span>
                    </div>
                  </mat-card-content>
                </mat-card>

                <!-- Top Companies -->
                <mat-card class="companies-card">
                  <mat-card-header>
                    <mat-card-title>
                      <mat-icon>business</mat-icon>
                      Top Companies
                    </mat-card-title>
                  </mat-card-header>
                  <mat-card-content>
                    <div class="company-item" *ngFor="let company of cachedTopCompanies">
                      <span class="company-name">{{ company.company }}</span>
                      <div class="company-bar">
                        <div class="company-progress" [style.width.%]="company.percentage"></div>
                      </div>
                      <span class="company-count">{{ company.count }}</span>
                    </div>
                  </mat-card-content>
                </mat-card>
              </div>
            </div>
          </mat-tab>
        </mat-tab-group>
      </mat-card>
    </div>
  `,
  styles: [`
    .statistics-container {
      padding: 1rem;
      max-width: 1200px;
      margin: 0 auto;
      min-height: calc(100vh - 64px);
    }

    .page-title {
      font-size: 2rem;
      font-weight: 400;
      margin: 0 0 2rem 0;
      color: var(--mdc-theme-on-surface);
    }

    .quick-stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1.5rem;
      margin-bottom: 2rem;
    }

    .stat-card {
      overflow: hidden;
    }

    .stat-card.primary { border-left: 4px solid #1976d2; }
    .stat-card.success { border-left: 4px solid #4caf50; }
    .stat-card.warning { border-left: 4px solid #ff9800; }
    .stat-card.info { border-left: 4px solid #9c27b0; }

    .stat-card mat-card-content {
      padding: 1.5rem;
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .stat-icon {
      flex-shrink: 0;
      width: 48px;
      height: 48px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .primary .stat-icon { background-color: rgba(25, 118, 210, 0.1); }
    .success .stat-icon { background-color: rgba(76, 175, 80, 0.1); }
    .warning .stat-icon { background-color: rgba(255, 152, 0, 0.1); }
    .info .stat-icon { background-color: rgba(156, 39, 176, 0.1); }

    .primary .stat-icon mat-icon { color: #1976d2; }
    .success .stat-icon mat-icon { color: #4caf50; }
    .warning .stat-icon mat-icon { color: #ff9800; }
    .info .stat-icon mat-icon { color: #9c27b0; }

    .stat-info {
      flex: 1;
    }

    .stat-value {
      font-size: 2rem;
      font-weight: 600;
      line-height: 1;
      margin-bottom: 0.25rem;
      color: var(--mdc-theme-on-surface);
    }

    .stat-label {
      font-size: 0.9rem;
      color: var(--mdc-theme-on-surface-variant);
      margin-bottom: 0.25rem;
    }

    .stat-subtitle {
      font-size: 0.8rem;
      color: var(--mdc-theme-on-surface-variant);
      font-weight: 500;
    }

    .analytics-card {
      margin-top: 2rem;
    }

    .tab-content {
      padding: 1.5rem;
    }

    .charts-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
      gap: 2rem;
      margin-top: 2rem;
    }

    .chart-card {
      height: 400px;
    }

    .chart-card mat-card-header {
      padding-bottom: 1rem;
    }

    .chart-card mat-card-title {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 1.1rem;
      font-weight: 500;
    }

    .difficulty-chart,
    .monthly-chart {
      height: 300px;
      overflow-y: auto;
    }

    .difficulty-legend {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      padding: 1rem;
    }

    .legend-item {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .legend-color {
      width: 20px;
      height: 20px;
      border-radius: 4px;
      flex-shrink: 0;
    }

    .legend-info {
      flex: 1;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .legend-label {
      font-weight: 500;
      color: var(--mdc-theme-on-surface);
    }

    .legend-value {
      font-size: 0.9rem;
      color: var(--mdc-theme-on-surface-variant);
    }

    .month-item {
      margin-bottom: 1.5rem;
      padding: 1rem;
      border: 1px solid rgba(0, 0, 0, 0.1);
      border-radius: 8px;
    }

    .month-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.5rem;
    }

    .month-name {
      font-weight: 500;
      color: var(--mdc-theme-on-surface);
    }

    .month-total {
      font-size: 0.9rem;
      color: var(--mdc-theme-on-surface-variant);
    }

    .month-bars {
      margin: 0.5rem 0;
    }

    .progress-bar {
      position: relative;
      height: 8px;
      background-color: rgba(0, 0, 0, 0.1);
      border-radius: 4px;
      overflow: hidden;
    }

    .bar {
      position: absolute;
      height: 100%;
      border-radius: 4px;
    }

    .bar.solved {
      background-color: #4caf50;
      z-index: 2;
    }

    .bar.attempted {
      background-color: #ff9800;
      z-index: 1;
      left: 0;
    }

    .month-stats {
      display: flex;
      justify-content: space-between;
      font-size: 0.8rem;
      margin-top: 0.5rem;
    }

    .solved-count {
      color: #4caf50;
      font-weight: 500;
    }

    .attempted-count {
      color: #ff9800;
      font-weight: 500;
    }

    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1.5rem;
    }

    .metric-card mat-card-content {
      text-align: center;
      padding: 2rem 1rem;
    }

    .metric-value {
      font-size: 2.5rem;
      font-weight: 600;
      color: var(--mdc-theme-primary);
      margin-bottom: 0.5rem;
    }

    .metric-label {
      font-size: 0.9rem;
      color: var(--mdc-theme-on-surface-variant);
      margin-bottom: 1rem;
    }

    .improvement {
      font-size: 0.8rem;
      padding: 0.25rem 0.5rem;
      border-radius: 12px;
      background-color: rgba(0, 0, 0, 0.05);
      color: var(--mdc-theme-on-surface-variant);
    }

    .improvement.positive {
      background-color: rgba(76, 175, 80, 0.1);
      color: #4caf50;
    }

    .tags-companies-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
      gap: 2rem;
    }

    .tags-card,
    .companies-card {
      height: 400px;
    }

    .tag-item,
    .company-item {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-bottom: 1rem;
      padding: 0.5rem;
      border-radius: 8px;
      background-color: rgba(0, 0, 0, 0.02);
    }

    .tag-name,
    .company-name {
      width: 120px;
      font-size: 0.9rem;
      font-weight: 500;
      color: var(--mdc-theme-on-surface);
      flex-shrink: 0;
    }

    .tag-bar,
    .company-bar {
      flex: 1;
      height: 6px;
      background-color: rgba(0, 0, 0, 0.1);
      border-radius: 3px;
      overflow: hidden;
    }

    .tag-progress {
      height: 100%;
      background-color: #1976d2;
      border-radius: 3px;
      transition: width 0.3s ease;
    }

    .company-progress {
      height: 100%;
      background-color: #9c27b0;
      border-radius: 3px;
      transition: width 0.3s ease;
    }

    .tag-count,
    .company-count {
      width: 30px;
      text-align: right;
      font-size: 0.8rem;
      color: var(--mdc-theme-on-surface-variant);
      flex-shrink: 0;
    }

    @media (max-width: 768px) {
      .statistics-container {
        padding: 0.5rem;
      }

      .quick-stats {
        grid-template-columns: 1fr;
        gap: 1rem;
      }

      .charts-grid,
      .tags-companies-grid {
        grid-template-columns: 1fr;
        gap: 1rem;
      }

      .metrics-grid {
        grid-template-columns: 1fr;
        gap: 1rem;
      }

      .tab-content {
        padding: 1rem;
      }

      .page-title {
        font-size: 1.5rem;
        margin-bottom: 1rem;
      }
    }
  `]
})
export class StatisticsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // Cached computed values to prevent recalculation
  currentStats: UserStats | null = null;
  currentProblems: Problem[] = [];
  cachedDifficultyStats: DifficultyStats[] = [];
  cachedMonthlyProgress: MonthlyProgress[] = [];
  cachedTopTags: TagStats[] = [];
  cachedTopCompanies: CompanyStats[] = [];
  cachedSuccessRate: number = 0;
  cachedStreakMessage: string = '';
  cachedAverageTime: string = '0 min';
  cachedSpeedTrend: string = '';
  cachedSpeedImproving: boolean = false;
  cachedMostActiveDay: string = '';

  constructor(
    private leetcodeService: LeetcodeService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Combine stats and problems with debouncing to prevent excessive updates
    combineLatest([
      this.leetcodeService.stats$,
      this.leetcodeService.problems$
    ]).pipe(
      debounceTime(100), // Debounce rapid changes
      distinctUntilChanged((a, b) =>
        a[0] === b[0] && a[1].length === b[1].length
      ),
      takeUntil(this.destroy$)
    ).subscribe(([stats, problems]) => {
      this.updateData(stats, problems);
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private updateData(stats: UserStats, problems: Problem[]): void {
    this.currentStats = stats;
    this.currentProblems = problems;

    // Cache all computed values
    this.cacheComputedValues(stats, problems);

    // Trigger change detection once
    this.cdr.markForCheck();
  }

  private cacheComputedValues(stats: UserStats, problems: Problem[]): void {
    this.cachedDifficultyStats = this.computeDifficultyStats(stats);
    this.cachedMonthlyProgress = this.computeMonthlyProgress(problems);
    this.cachedTopTags = this.computeTopTags(problems);
    this.cachedTopCompanies = this.computeTopCompanies(problems);
    this.cachedSuccessRate = this.computeSuccessRate(stats);
    this.cachedStreakMessage = this.computeStreakMessage(stats.streakDays);
    this.cachedAverageTime = this.computeAverageTime(problems);
    this.cachedSpeedTrend = this.computeSpeedTrend(problems);
    this.cachedSpeedImproving = this.computeSpeedImproving(problems);
    this.cachedMostActiveDay = this.computeMostActiveDay(problems);
  }

  private computeDifficultyStats(stats: UserStats): DifficultyStats[] {
    const totalSolved = stats.solvedProblems;
    return [
      {
        difficulty: 'Easy',
        solved: stats.easyCount,
        total: stats.easyCount,
        percentage: totalSolved > 0 ? Math.round((stats.easyCount / totalSolved) * 100) : 0,
        color: '#4caf50'
      },
      {
        difficulty: 'Medium',
        solved: stats.mediumCount,
        total: stats.mediumCount,
        percentage: totalSolved > 0 ? Math.round((stats.mediumCount / totalSolved) * 100) : 0,
        color: '#ff9800'
      },
      {
        difficulty: 'Hard',
        solved: stats.hardCount,
        total: stats.hardCount,
        percentage: totalSolved > 0 ? Math.round((stats.hardCount / totalSolved) * 100) : 0,
        color: '#f44336'
      }
    ];
  }

  private computeMonthlyProgress(problems: Problem[]): MonthlyProgress[] {
    const monthlyData = new Map<string, { solved: number; attempted: number }>();

    problems.forEach(problem => {
      const date = problem.lastAttemptDate || problem.createdAt;
      if (date) {
        const monthKey = date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });

        if (!monthlyData.has(monthKey)) {
          monthlyData.set(monthKey, { solved: 0, attempted: 0 });
        }

        const data = monthlyData.get(monthKey)!;
        if (problem.status === 'Solved') {
          data.solved++;
        } else if (problem.status === 'Attempted') {
          data.attempted++;
        }
      }
    });

    return Array.from(monthlyData.entries())
      .map(([month, data]) => ({ month, ...data }))
      .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime())
      .slice(-6); // Last 6 months
  }

  private computeTopTags(problems: Problem[]): TagStats[] {
    const tagCounts = new Map<string, number>();

    problems.forEach(problem => {
      problem.tags.forEach(tag => {
        tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
      });
    });

    const totalProblems = problems.length;
    return Array.from(tagCounts.entries())
      .map(([tag, count]) => ({
        tag,
        count,
        percentage: totalProblems > 0 ? Math.round((count / totalProblems) * 100) : 0
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  private computeTopCompanies(problems: Problem[]): CompanyStats[] {
    const companyCounts = new Map<string, number>();

    problems.forEach(problem => {
      if (problem.companies) {
        problem.companies.forEach(company => {
          companyCounts.set(company, (companyCounts.get(company) || 0) + 1);
        });
      }
    });

    const totalProblems = problems.length;
    return Array.from(companyCounts.entries())
      .map(([company, count]) => ({
        company,
        count,
        percentage: totalProblems > 0 ? Math.round((count / totalProblems) * 100) : 0
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  private computeSuccessRate(stats: UserStats): number {
    return stats.totalProblems > 0
      ? Math.round((stats.solvedProblems / stats.totalProblems) * 100)
      : 0;
  }

  private computeStreakMessage(streakDays: number): string {
    if (streakDays === 0) return 'Start your streak!';
    if (streakDays < 7) return 'Keep it up!';
    if (streakDays < 30) return 'Great momentum!';
    return 'Amazing streak!';
  }

  private computeAverageTime(problems: Problem[]): string {
    const solvedProblems = problems.filter(p => p.status === 'Solved' && p.timeSpent > 0);
    if (solvedProblems.length === 0) return '0 min';

    const totalTime = solvedProblems.reduce((sum, p) => sum + p.timeSpent, 0);
    const avgTime = Math.round(totalTime / solvedProblems.length);
    return `${avgTime} min`;
  }

  private computeSpeedTrend(problems: Problem[]): string {
    const recentProblems = problems
      .filter(p => p.status === 'Solved' && p.timeSpent > 0)
      .sort((a, b) => (b.solvedDate?.getTime() || 0) - (a.solvedDate?.getTime() || 0))
      .slice(0, 10);

    if (recentProblems.length < 5) return 'Need more data';

    const recentAvg = recentProblems.slice(0, 5).reduce((sum, p) => sum + p.timeSpent, 0) / 5;
    const olderAvg = recentProblems.slice(5, 10).reduce((sum, p) => sum + p.timeSpent, 0) / 5;

    const improvement = ((olderAvg - recentAvg) / olderAvg) * 100;

    if (Math.abs(improvement) < 5) return 'Stable';
    return improvement > 0 ? `${Math.round(improvement)}% faster` : `${Math.round(-improvement)}% slower`;
  }

  private computeSpeedImproving(problems: Problem[]): boolean {
    const recentProblems = problems
      .filter(p => p.status === 'Solved' && p.timeSpent > 0)
      .sort((a, b) => (b.solvedDate?.getTime() || 0) - (a.solvedDate?.getTime() || 0))
      .slice(0, 10);

    if (recentProblems.length < 5) return false;

    const recentAvg = recentProblems.slice(0, 5).reduce((sum, p) => sum + p.timeSpent, 0) / 5;
    const olderAvg = recentProblems.slice(5, 10).reduce((sum, p) => sum + p.timeSpent, 0) / 5;

    return recentAvg < olderAvg;
  }

  private computeMostActiveDay(problems: Problem[]): string {
    const dayCounts = new Map<string, number>();
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    problems.forEach(problem => {
      const date = problem.lastAttemptDate || problem.createdAt;
      if (date) {
        const dayName = dayNames[date.getDay()];
        dayCounts.set(dayName, (dayCounts.get(dayName) || 0) + 1);
      }
    });

    if (dayCounts.size === 0) return 'No data';

    return Array.from(dayCounts.entries())
      .sort(([,a], [,b]) => b - a)[0][0];
  }

  // Simple helper methods that don't require caching
  getBarWidth(value: number, total: number): number {
    return total > 0 ? (value / total) * 100 : 0;
  }
}
