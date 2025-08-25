import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatTabsModule } from '@angular/material/tabs';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatBadgeModule } from '@angular/material/badge';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subject, takeUntil, combineLatest, interval, startWith } from 'rxjs';
import { map } from 'rxjs/operators';
import { trigger, state, style, transition, animate, query, stagger } from '@angular/animations';

import { LeetcodeService } from '../../services/leetcode';
import { LeetCodeApiService, LeetCodeDailyChallenge } from '../../services/leetcode-api';
import { ProblemFormComponent } from '../problem-form/problem-form';
import { LeetcodeImportComponent } from '../leetcode-import/leetcode-import';
import { SearchDialogComponent } from '../search-dialog/search-dialog';
import { ProblemDetailsDialogComponent } from '../problem-details-dialog/problem-details-dialog';
import { NotesDialogComponent } from '../notes-dialog/notes-dialog';
import { TimestampsDialogComponent } from '../timestamps-dialog/timestamps-dialog';
import { ProgressChartComponent } from '../progress-chart/progress-chart';
import { Problem, UserStats } from '../../models/problem';

interface ExtendedDashboardMetrics {
  totalProblems: number;
  solvedProblems: number;
  easyCount: number;
  mediumCount: number;
  hardCount: number;
  streakDays: number;
  weeklyGoal: number;
  weeklyProgress: number;
  averageTime: number;
  successRate: number;
  mostSolvedTag: string;
  mostActiveDay: string;
  totalTimeSpent: number;
  problemsThisWeek: number;
  problemsThisMonth: number;
  favoriteCompany: string;
  longestStreak: number;
  averageAttemptsPerProblem: number;
  recentlyAddedCount: number;
  pendingReviewCount: number;
}

interface ActivityItem {
  type: 'solved' | 'attempted' | 'added' | 'reviewed' | 'streak_milestone' | 'time_milestone';
  problem?: Problem;
  timestamp: Date;
  title: string;
  description: string;
  icon: string;
  iconColor: string;
}

interface QuickAction {
  title: string;
  description: string;
  icon: string;
  color: string;
  action: () => void;
  badge?: number;
}

interface Insight {
  title: string;
  description: string;
  type: 'tip' | 'achievement' | 'goal' | 'warning';
  icon: string;
  action?: () => void;
}

interface StreakData {
  current: number;
  longest: number;
  lastActiveDate: Date;
  isActive: boolean;
  daysUntilBreak: number;
}

interface CompanyProgress {
  name: string;
  solved: number;
  total: number;
  percentage: number;
}

interface TagProgress {
  name: string;
  solved: number;
  total: number;
  percentage: number;
  difficulty: { easy: number; medium: number; hard: number };
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
    MatTabsModule,
    MatExpansionModule,
    MatDividerModule,
    MatTooltipModule,
    MatBadgeModule,
    MatMenuModule,
    MatProgressSpinnerModule,
    ProgressChartComponent
  ],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.scss'],
  animations: [
    trigger('slideIn', [
      transition(':enter', [
        style({ transform: 'translateX(-100%)', opacity: 0 }),
        animate('300ms ease-in', style({ transform: 'translateX(0%)', opacity: 1 }))
      ])
    ]),
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate('400ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ]),
    trigger('staggerAnimation', [
      transition('* => *', [
        query(':enter', [
          style({ opacity: 0, transform: 'translateY(30px)' }),
          stagger(100, [
            animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
          ])
        ], { optional: true })
      ])
    ])
  ]
})
export class DashboardComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // Core data
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

  // Enhanced metrics
  metrics: ExtendedDashboardMetrics = {
    totalProblems: 0,
    solvedProblems: 0,
    easyCount: 0,
    mediumCount: 0,
    hardCount: 0,
    streakDays: 0,
    weeklyGoal: 7,
    weeklyProgress: 0,
    averageTime: 0,
    successRate: 0,
    mostSolvedTag: '',
    mostActiveDay: '',
    totalTimeSpent: 0,
    problemsThisWeek: 0,
    problemsThisMonth: 0,
    favoriteCompany: '',
    longestStreak: 0,
    averageAttemptsPerProblem: 0,
    recentlyAddedCount: 0,
    pendingReviewCount: 0
  };

  // Dashboard sections
  recentActivity: ActivityItem[] = [];
  quickActions: QuickAction[] = [];
  insights: Insight[] = [];
  streakData: StreakData = {
    current: 0,
    longest: 0,
    lastActiveDate: new Date(),
    isActive: false,
    daysUntilBreak: 0
  };
  companyProgress: CompanyProgress[] = [];
  tagProgress: TagProgress[] = [];

  // Daily challenge
  dailyChallenge: LeetCodeDailyChallenge | null = null;
  loadingDaily = false;
  importingDaily = false;
  dailyChallengeError: string | null = null;

  // UI state
  selectedTab = 0;
  loadingMetrics = true;
  showAdvancedStats = false;

  constructor(
    private leetcodeService: LeetcodeService,
    private leetcodeApiService: LeetCodeApiService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadData();
    this.loadDailyChallenge();
    this.setupQuickActions();
    this.startRealTimeUpdates();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadData(): void {
    combineLatest([
      this.leetcodeService.problems$,
      this.leetcodeService.stats$
    ]).pipe(
      takeUntil(this.destroy$)
    ).subscribe(([problems, stats]) => {
      this.problems = problems;
      this.stats = stats;
      this.updateAllMetrics();
      this.generateAllSections();
      this.loadingMetrics = false;
    });
  }

  private startRealTimeUpdates(): void {
    // Update clock and streak status every minute
    interval(60000).pipe(
      startWith(0),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.updateStreakStatus();
      this.updateTimeBasedInsights();
    });
  }

  private updateAllMetrics(): void {
    this.updateExtendedMetrics();
    this.updateStreakData();
    this.updateCompanyProgress();
    this.updateTagProgress();
  }

  private updateExtendedMetrics(): void {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Basic metrics
    this.metrics = {
      ...this.stats,
      weeklyGoal: 7,
      weeklyProgress: this.getProblemsInPeriod(oneWeekAgo),
      averageTime: this.calculateAverageTime(),
      successRate: this.calculateSuccessRate(),
      mostSolvedTag: this.getMostSolvedTag(),
      mostActiveDay: this.getMostActiveDay(),
      totalTimeSpent: this.getTotalTimeSpent(),
      problemsThisWeek: this.getProblemsInPeriod(oneWeekAgo),
      problemsThisMonth: this.getProblemsInPeriod(oneMonthAgo),
      favoriteCompany: this.getFavoriteCompany(),
      longestStreak: this.calculateLongestStreak(),
      averageAttemptsPerProblem: this.calculateAverageAttempts(),
      recentlyAddedCount: this.getRecentlyAddedCount(),
      pendingReviewCount: this.getPendingReviewCount()
    };
  }

  private updateStreakData(): void {
    const now = new Date();
    const oneDayMs = 24 * 60 * 60 * 1000;
    const lastActiveMs = this.stats.lastActiveDate.getTime();
    const daysSinceActive = Math.floor((now.getTime() - lastActiveMs) / oneDayMs);

    this.streakData = {
      current: this.stats.streakDays,
      longest: this.calculateLongestStreak(),
      lastActiveDate: this.stats.lastActiveDate,
      isActive: daysSinceActive === 0,
      daysUntilBreak: Math.max(0, 1 - daysSinceActive)
    };
  }

  private updateCompanyProgress(): void {
    const companyStats = new Map<string, { solved: number; total: number }>();

    this.problems.forEach(problem => {
      if (problem.companies && problem.companies.length > 0) {
        problem.companies.forEach(company => {
          if (!companyStats.has(company)) {
            companyStats.set(company, { solved: 0, total: 0 });
          }
          const stats = companyStats.get(company)!;
          stats.total++;
          if (problem.status === 'Solved') {
            stats.solved++;
          }
        });
      }
    });

    this.companyProgress = Array.from(companyStats.entries())
      .map(([name, stats]) => ({
        name,
        solved: stats.solved,
        total: stats.total,
        percentage: stats.total > 0 ? (stats.solved / stats.total) * 100 : 0
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);
  }

  private updateTagProgress(): void {
    const tagStats = new Map<string, {
      solved: number;
      total: number;
      difficulty: { easy: number; medium: number; hard: number };
    }>();

    this.problems.forEach(problem => {
      if (problem.tags && problem.tags.length > 0) {
        problem.tags.forEach(tag => {
          if (!tagStats.has(tag)) {
            tagStats.set(tag, {
              solved: 0,
              total: 0,
              difficulty: { easy: 0, medium: 0, hard: 0 }
            });
          }
          const stats = tagStats.get(tag)!;
          stats.total++;

          // Count by difficulty
          if (problem.difficulty === 'Easy') stats.difficulty.easy++;
          else if (problem.difficulty === 'Medium') stats.difficulty.medium++;
          else if (problem.difficulty === 'Hard') stats.difficulty.hard++;

          if (problem.status === 'Solved') {
            stats.solved++;
          }
        });
      }
    });

    this.tagProgress = Array.from(tagStats.entries())
      .map(([name, stats]) => ({
        name,
        solved: stats.solved,
        total: stats.total,
        percentage: stats.total > 0 ? (stats.solved / stats.total) * 100 : 0,
        difficulty: stats.difficulty
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 15);
  }

  private generateAllSections(): void {
    this.generateRecentActivity();
    this.generateInsights();
  }

  private generateRecentActivity(): void {
    const activities: ActivityItem[] = [];

    // Problem activities
    this.problems.forEach(problem => {
      if (problem.solvedDate) {
        activities.push({
          type: 'solved',
          problem,
          timestamp: problem.solvedDate,
          title: `Solved ${problem.title}`,
          description: `Completed in ${problem.attempts} attempt(s)`,
          icon: 'check_circle',
          iconColor: '#4caf50'
        });
      } else if (problem.lastAttemptDate) {
        activities.push({
          type: 'attempted',
          problem,
          timestamp: problem.lastAttemptDate,
          title: `Attempted ${problem.title}`,
          description: `${problem.attempts} attempt(s) so far`,
          icon: 'play_circle',
          iconColor: '#ff9800'
        });
      }

      if (problem.createdAt) {
        activities.push({
          type: 'added',
          problem,
          timestamp: problem.createdAt,
          title: `Added ${problem.title}`,
          description: `${problem.difficulty} difficulty`,
          icon: 'add_circle',
          iconColor: '#2196f3'
        });
      }
    });

    // Streak milestones
    if (this.stats.streakDays > 0 && this.stats.streakDays % 7 === 0) {
      activities.push({
        type: 'streak_milestone',
        timestamp: this.stats.lastActiveDate,
        title: `${this.stats.streakDays}-Day Streak!`,
        description: 'Keep up the great work!',
        icon: 'local_fire_department',
        iconColor: '#ff5722'
      });
    }

    // Time milestones
    const totalHours = Math.floor(this.metrics.totalTimeSpent / 60);
    if (totalHours > 0 && totalHours % 10 === 0) {
      activities.push({
        type: 'time_milestone',
        timestamp: new Date(),
        title: `${totalHours} Hours Invested!`,
        description: 'Dedication pays off',
        icon: 'schedule',
        iconColor: '#9c27b0'
      });
    }

    this.recentActivity = activities
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 10);
  }

  private generateInsights(): void {
    this.insights = [];

    // Streak insights
    if (this.streakData.current === 0) {
      this.insights.push({
        title: 'Start Your Coding Journey',
        description: 'Solve your first problem today to begin building a streak!',
        type: 'tip',
        icon: 'rocket_launch',
        action: () => this.openSearchDialog()
      });
    } else if (this.streakData.current >= 7) {
      this.insights.push({
        title: 'Streak Master!',
        description: `Amazing ${this.streakData.current}-day streak. You're on fire!`,
        type: 'achievement',
        icon: 'local_fire_department'
      });
    } else if (!this.streakData.isActive && this.streakData.daysUntilBreak === 0) {
      this.insights.push({
        title: 'Streak at Risk!',
        description: 'Solve a problem today to maintain your streak.',
        type: 'warning',
        icon: 'warning',
        action: () => this.openSearchDialog()
      });
    }

    // Progress insights
    const weeklyProgress = (this.metrics.weeklyProgress / this.metrics.weeklyGoal) * 100;
    if (weeklyProgress >= 100) {
      this.insights.push({
        title: 'Weekly Goal Achieved!',
        description: `You've exceeded your weekly goal of ${this.metrics.weeklyGoal} problems.`,
        type: 'achievement',
        icon: 'emoji_events'
      });
    } else if (weeklyProgress >= 50) {
      this.insights.push({
        title: 'Halfway There!',
        description: `${Math.round(weeklyProgress)}% complete with your weekly goal.`,
        type: 'goal',
        icon: 'trending_up'
      });
    }

    // Skill recommendations
    if (this.metrics.mostSolvedTag) {
      const weakestTag = this.tagProgress.find(tag => tag.percentage < 50);
      if (weakestTag) {
        this.insights.push({
          title: 'Skill Diversification',
          description: `Try some ${weakestTag.name} problems to broaden your skills.`,
          type: 'tip',
          icon: 'psychology',
          action: () => this.searchByTag(weakestTag.name)
        });
      }
    }

    // Company preparation
    if (this.companyProgress.length > 0) {
      const topCompany = this.companyProgress[0];
      if (topCompany.percentage < 80) {
        this.insights.push({
          title: 'Company Focus',
          description: `Complete more ${topCompany.name} problems for interview prep.`,
          type: 'tip',
          icon: 'work',
          action: () => this.searchByCompany(topCompany.name)
        });
      }
    }

    // Daily challenge
    if (this.dailyChallenge && !this.isDailyChallengeCompleted()) {
      this.insights.push({
        title: 'Daily Challenge Available',
        description: 'Complete today\'s daily challenge to maintain consistency.',
        type: 'goal',
        icon: 'today',
        action: () => this.viewDailyChallenge()
      });
    }
  }

  private setupQuickActions(): void {
    this.quickActions = [
      {
        title: 'Add Problem',
        description: 'Manually add a new problem',
        icon: 'add',
        color: 'primary',
        action: () => this.addProblem()
      },
      {
        title: 'Import from LeetCode',
        description: 'Import problems from LeetCode',
        icon: 'cloud_download',
        color: 'accent',
        action: () => this.openImportDialog()
      },
      {
        title: 'Search Problems',
        description: 'Find problems to solve',
        icon: 'search',
        color: 'warn',
        action: () => this.openSearchDialog()
      },
      {
        title: 'View All Problems',
        description: 'See your complete problem list',
        icon: 'list',
        color: 'primary',
        action: () => this.viewAllProblems(),
        badge: this.metrics.pendingReviewCount
      },
      {
        title: 'Statistics',
        description: 'Detailed analytics and insights',
        icon: 'analytics',
        color: 'accent',
        action: () => this.viewStatistics()
      },
      {
        title: 'Random Problem',
        description: 'Get a random problem to solve',
        icon: 'shuffle',
        color: 'warn',
        action: () => this.getRandomProblem()
      }
    ];
  }

  // Calculation methods
  private getProblemsInPeriod(since: Date): number {
    return this.problems.filter(p =>
      p.solvedDate && p.solvedDate >= since
    ).length;
  }


  getEasyProblemsCount(): number {
    return this.problems?.filter(p => p.difficulty === 'Easy').length || 0;
  }

  getMediumProblemsCount(): number {
    return this.problems?.filter(p => p.difficulty === 'Medium').length || 0;
  }

  getHardProblemsCount(): number {
    return this.problems?.filter(p => p.difficulty === 'Hard').length || 0;
  }

  private calculateAverageTime(): number {
    const solvedProblems = this.problems.filter(p =>
      p.status === 'Solved' && p.timeSpent > 0
    );
    if (solvedProblems.length === 0) return 0;

    const totalTime = solvedProblems.reduce((sum, p) => sum + p.timeSpent, 0);
    return Math.round(totalTime / solvedProblems.length);
  }

  private calculateSuccessRate(): number {
    if (this.stats.totalProblems === 0) return 0;
    return Math.round((this.stats.solvedProblems / this.stats.totalProblems) * 100);
  }

  private getMostSolvedTag(): string {
    if (this.tagProgress.length === 0) return '';
    return this.tagProgress[0].name;
  }

  private getMostActiveDay(): string {
    const dayCount = new Array(7).fill(0);

    this.problems.forEach(problem => {
      if (problem.solvedDate) {
        dayCount[problem.solvedDate.getDay()]++;
      }
    });

    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const maxIndex = dayCount.indexOf(Math.max(...dayCount));
    return days[maxIndex];
  }

  private getTotalTimeSpent(): number {
    return this.problems.reduce((total, problem) => total + problem.timeSpent, 0);
  }

  private getFavoriteCompany(): string {
    if (this.companyProgress.length === 0) return '';
    return this.companyProgress[0].name;
  }

  private calculateLongestStreak(): number {
    // This would need to be calculated from historical data
    // For now, return current streak as a placeholder
    return Math.max(this.stats.streakDays, 0);
  }

  private calculateAverageAttempts(): number {
    if (this.problems.length === 0) return 0;
    const totalAttempts = this.problems.reduce((sum, p) => sum + p.attempts, 0);
    return Math.round((totalAttempts / this.problems.length) * 10) / 10;
  }

  private getRecentlyAddedCount(): number {
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
    return this.problems.filter(p =>
      p.createdAt && p.createdAt >= threeDaysAgo
    ).length;
  }

  private getPendingReviewCount(): number {
    return this.problems.filter(p =>
      p.status === 'Solved' && (!p.notes || p.notes.trim().length === 0)
    ).length;
  }

  public isDailyChallengeCompleted(): boolean {
    if (!this.dailyChallenge) return false;
    return this.problems.some(p =>
      p.title === this.dailyChallenge!.question.title && p.status === 'Solved'
    );
  }

  private updateStreakStatus(): void {
    // This would update streak status in real-time
    this.updateStreakData();
  }

  private updateTimeBasedInsights(): void {
    // Regenerate insights that depend on time
    this.generateInsights();
  }

  // Action methods
  loadDailyChallenge(): void {
    this.loadingDaily = true;
    this.dailyChallengeError = null;

    this.leetcodeApiService.getDailyChallenge().subscribe({
      next: (challenge) => {
        this.dailyChallenge = challenge;
        this.loadingDaily = false;
        this.generateInsights(); // Regenerate insights with daily challenge info
      },
      error: (error) => {
        console.error('Failed to load daily challenge:', error);
        this.loadingDaily = false;
        this.dailyChallengeError = 'Failed to load today\'s challenge. Please try again.';
      }
    });
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
          { duration: 4000, panelClass: 'success-snackbar' }
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

  viewDailyChallenge(): void {
    if (this.dailyChallenge) {
      // Use the actual LeetCode URL from the daily challenge
      window.open(`https://leetcode.com${this.dailyChallenge.link}`, '_blank');
    }
  }

  openLeetCodeDaily(): void {
    window.open('https://leetcode.com/problemset/', '_blank');
  }

  addProblem(): void {
    const dialogRef = this.dialog.open(ProblemFormComponent, {
      width: '600px',
      maxWidth: '90vw',
      data: null
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.snackBar.open('Problem added successfully!', 'Close', {
          duration: 3000
        });
      }
    });
  }

  openImportDialog(): void {
    const dialogRef = this.dialog.open(LeetcodeImportComponent, {
      width: '600px',
      maxWidth: '90vw',
      maxHeight: '90vh',
      autoFocus: false,
      disableClose: false
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.snackBar.open('Problem imported successfully!', 'Close', {
          duration: 3000
        });
      }
    });
  }

  openSearchDialog(): void {
    const dialogRef = this.dialog.open(SearchDialogComponent, {
      width: '90vw',
      maxWidth: '900px',
      maxHeight: '90vh',
      disableClose: false,
      autoFocus: false
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result?.success) {
        this.snackBar.open(result.message || 'Problem imported successfully!', 'Close', {
          duration: 3000
        });
      }
    });
  }

  searchByTag(tag: string): void {
    const dialogRef = this.dialog.open(SearchDialogComponent, {
      width: '90vw',
      maxWidth: '900px',
      maxHeight: '90vh',
      data: { keyword: tag }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result?.success) {
        this.snackBar.open('Problem imported successfully!', 'Close', {
          duration: 3000
        });
      }
    });
  }

  searchByCompany(company: string): void {
    const dialogRef = this.dialog.open(SearchDialogComponent, {
      width: '90vw',
      maxWidth: '900px',
      maxHeight: '90vh',
      data: { keyword: company }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result?.success) {
        this.snackBar.open('Problem imported successfully!', 'Close', {
          duration: 3000
        });
      }
    });
  }

  getRandomProblem(): void {
    this.openSearchDialog();
  }

  viewAllProblems(): void {
    // Navigate to problems page
    window.location.href = '/problems';
  }

  viewStatistics(): void {
    // Navigate to statistics page
    window.location.href = '/statistics';
  }

  viewProblemDetails(problem: Problem): void {
    const titleSlug = this.generateTitleSlug(problem.title);

    this.dialog.open(ProblemDetailsDialogComponent, {
      width: '90vw',
      maxWidth: '1000px',
      height: '90vh',
      maxHeight: '800px',
      data: {
        problemId: problem.leetcodeId,
        titleSlug: titleSlug
      },
      panelClass: 'problem-details-dialog-container'
    });
  }

  viewNotes(problem: Problem): void {
    this.dialog.open(NotesDialogComponent, {
      width: '600px',
      maxWidth: '90vw',
      data: problem
    });
  }

  viewTimestamps(problem: Problem): void {
    this.dialog.open(TimestampsDialogComponent, {
      width: '600px',
      maxWidth: '90vw',
      data: problem
    });
  }

  // Utility methods
  getCurrentDate(): string {
    return new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
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

  getActivityIcon(type: string): string {
    switch (type) {
      case 'solved': return 'check_circle';
      case 'attempted': return 'play_circle';
      case 'added': return 'add_circle';
      case 'reviewed': return 'rate_review';
      case 'streak_milestone': return 'local_fire_department';
      case 'time_milestone': return 'schedule';
      default: return 'info';
    }
  }

  private generateTitleSlug(title: string): string {
    return title.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }

  getDifficultyColor(difficulty: string): string {
    switch (difficulty) {
      case 'Easy': return '#4caf50';
      case 'Medium': return '#ff9800';
      case 'Hard': return '#f44336';
      default: return '#757575';
    }
  }

  getProgressColor(percentage: number): string {
    if (percentage >= 80) return '#4caf50';
    if (percentage >= 50) return '#ff9800';
    return '#f44336';
  }

  toggleAdvancedStats(): void {
    this.showAdvancedStats = !this.showAdvancedStats;
  }

  onTabChange(index: number): void {
    this.selectedTab = index;
  }
}
