// ===============================
// ENHANCED PROGRESS CHART COMPONENT
// ===============================

// src/app/components/progress-chart/progress-chart.component.ts
import { Component, Input, OnInit, OnChanges, SimpleChanges, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatIconModule } from '@angular/material/icon';
import { Problem } from '../../models/problem';
import { Chart, ChartConfiguration, ChartType, registerables } from 'chart.js';

// Register Chart.js components
Chart.register(...registerables);

interface ChartData {
  labels: string[];
  datasets: any[];
}

@Component({
  selector: 'app-progress-chart',
  standalone: true,
  imports: [CommonModule, MatButtonToggleModule, MatIconModule],
  template: `
    <div class="chart-container">
      <div class="chart-header">
        <h3>Progress Overview</h3>
        <mat-button-toggle-group [(value)]="selectedPeriod" (change)="onPeriodChange()">
          <mat-button-toggle value="7days">7 Days</mat-button-toggle>
          <mat-button-toggle value="30days">30 Days</mat-button-toggle>
          <mat-button-toggle value="90days">90 Days</mat-button-toggle>
        </mat-button-toggle-group>
      </div>

      <div class="chart-content">
        <canvas #chartCanvas></canvas>
      </div>

      <div class="chart-legend" *ngIf="chartData">
        <div class="legend-item">
          <div class="legend-color solved"></div>
          <span>Problems Solved</span>
        </div>
        <div class="legend-item">
          <div class="legend-color attempted"></div>
          <span>Problems Attempted</span>
        </div>
      </div>

      <div class="chart-stats" *ngIf="chartStats">
        <div class="stat-item">
          <mat-icon>trending_up</mat-icon>
          <div class="stat-content">
            <span class="stat-value">{{ chartStats.totalSolved }}</span>
            <span class="stat-label">Solved in Period</span>
          </div>
        </div>
        <div class="stat-item">
          <mat-icon>schedule</mat-icon>
          <div class="stat-content">
            <span class="stat-value">{{ chartStats.avgPerDay | number:'1.1-1' }}</span>
            <span class="stat-label">Avg per Day</span>
          </div>
        </div>
        <div class="stat-item">
          <mat-icon>local_fire_department</mat-icon>
          <div class="stat-content">
            <span class="stat-value">{{ chartStats.bestDay }}</span>
            <span class="stat-label">Best Day</span>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .chart-container {
      padding: 1rem;
      background: white;
      border-radius: 8px;
    }

    .chart-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
    }

    .chart-header h3 {
      margin: 0;
      font-weight: 500;
      color: rgba(0, 0, 0, 0.87);
    }

    .chart-content {
      position: relative;
      height: 300px;
      margin-bottom: 1rem;
    }

    .chart-content canvas {
      max-height: 300px;
    }

    .chart-legend {
      display: flex;
      justify-content: center;
      gap: 2rem;
      margin-bottom: 1.5rem;
    }

    .legend-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.9rem;
    }

    .legend-color {
      width: 16px;
      height: 16px;
      border-radius: 3px;
    }

    .legend-color.solved {
      background-color: #4CAF50;
    }

    .legend-color.attempted {
      background-color: #FFC107;
    }

    .chart-stats {
      display: flex;
      justify-content: space-around;
      padding-top: 1rem;
      border-top: 1px solid rgba(0, 0, 0, 0.1);
    }

    .stat-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .stat-item mat-icon {
      color: #1976d2;
      font-size: 1.25rem;
    }

    .stat-content {
      display: flex;
      flex-direction: column;
    }

    .stat-value {
      font-size: 1.25rem;
      font-weight: 600;
      color: #1976d2;
    }

    .stat-label {
      font-size: 0.8rem;
      color: rgba(0, 0, 0, 0.6);
    }

    @media (max-width: 768px) {
      .chart-header {
        flex-direction: column;
        gap: 1rem;
        align-items: stretch;
      }

      .chart-content {
        height: 250px;
      }

      .chart-legend {
        flex-direction: column;
        align-items: center;
        gap: 0.5rem;
      }

      .chart-stats {
        flex-direction: column;
        gap: 1rem;
        align-items: center;
      }
    }
  `]
})
export class ProgressChartComponent implements OnInit, OnChanges, OnDestroy {
  @ViewChild('chartCanvas', { static: true }) chartCanvas!: ElementRef<HTMLCanvasElement>;
  @Input() problems: Problem[] = [];

  chart: Chart | null = null;
  selectedPeriod: '7days' | '30days' | '90days' = '30days';
  chartData: ChartData | null = null;
  chartStats: any = null;

  ngOnInit(): void {
    this.createChart();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['problems'] && this.chart) {
      this.updateChart();
    }
  }

  ngOnDestroy(): void {
    if (this.chart) {
      this.chart.destroy();
    }
  }

  onPeriodChange(): void {
    this.updateChart();
  }

  private createChart(): void {
    const ctx = this.chartCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    this.chartData = this.generateChartData();
    this.chartStats = this.calculateStats();

    const config: ChartConfiguration = {
      type: 'bar',
      data: this.chartData,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: false
          },
          legend: {
            display: false
          },
          tooltip: {
            mode: 'index',
            intersect: false,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            titleColor: 'white',
            bodyColor: 'white',
            borderColor: '#1976d2',
            borderWidth: 1,
            cornerRadius: 8,
            callbacks: {
              title: (context) => {
                return `${context[0].label}`;
              },
              label: (context) => {
                const label = context.dataset.label || '';
                const value = context.parsed.y;
                return `${label}: ${value} problems`;
              }
            }
          }
        },
        scales: {
          x: {
            stacked: false,
            grid: {
              display: false
            },
            ticks: {
              color: 'rgba(0, 0, 0, 0.6)',
              font: {
                size: 11
              }
            }
          },
          y: {
            beginAtZero: true,
            grid: {
              color: 'rgba(0, 0, 0, 0.1)'
            },
            ticks: {
              color: 'rgba(0, 0, 0, 0.6)',
              stepSize: 1,
              font: {
                size: 11
              }
            }
          }
        },
        interaction: {
          mode: 'nearest',
          axis: 'x',
          intersect: false
        },
        animation: {
          duration: 750,
          easing: 'easeInOutQuart'
        }
      }
    };

    this.chart = new Chart(ctx, config);
  }

  private updateChart(): void {
    if (!this.chart) return;

    this.chartData = this.generateChartData();
    this.chartStats = this.calculateStats();

    this.chart.data = this.chartData;
    this.chart.update('active');
  }

  private generateChartData(): ChartData {
    const days = this.getPeriodDays();
    const labels: string[] = [];
    const solvedData: number[] = [];
    const attemptedData: number[] = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      // Format label based on period
      let label: string;
      if (days <= 7) {
        label = date.toLocaleDateString('en-US', { weekday: 'short' });
      } else if (days <= 30) {
        label = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      } else {
        label = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      }

      labels.push(label);

      // Count problems solved on this date
      const solvedCount = this.problems.filter(problem => {
        if (!problem.solvedDate) return false;
        const solvedDate = new Date(problem.solvedDate);
        solvedDate.setHours(0, 0, 0, 0);
        return solvedDate.getTime() === date.getTime();
      }).length;

      // Count problems attempted (but not solved) on this date
      const attemptedCount = this.problems.filter(problem => {
        if (!problem.lastAttemptDate || problem.status === 'Solved') return false;
        const attemptDate = new Date(problem.lastAttemptDate);
        attemptDate.setHours(0, 0, 0, 0);
        return attemptDate.getTime() === date.getTime();
      }).length;

      solvedData.push(solvedCount);
      attemptedData.push(attemptedCount);
    }

    return {
      labels,
      datasets: [
        {
          label: 'Solved',
          data: solvedData,
          backgroundColor: '#4CAF50',
          borderColor: '#388E3C',
          borderWidth: 1,
          borderRadius: 4,
          borderSkipped: false,
        },
        {
          label: 'Attempted',
          data: attemptedData,
          backgroundColor: '#FFC107',
          borderColor: '#F57C00',
          borderWidth: 1,
          borderRadius: 4,
          borderSkipped: false,
        }
      ]
    };
  }

  private calculateStats(): any {
    const days = this.getPeriodDays();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const problemsInPeriod = this.problems.filter(problem => {
      if (!problem.solvedDate) return false;
      return new Date(problem.solvedDate) >= startDate;
    });

    const totalSolved = problemsInPeriod.length;
    const avgPerDay = totalSolved / days;

    // Find the day with most problems solved
    const dailyCounts: { [key: string]: number } = {};
    problemsInPeriod.forEach(problem => {
      if (problem.solvedDate) {
        const dateKey = new Date(problem.solvedDate).toDateString();
        dailyCounts[dateKey] = (dailyCounts[dateKey] || 0) + 1;
      }
    });

    const maxDaily = Math.max(...Object.values(dailyCounts), 0);
    const bestDay = maxDaily;

    return {
      totalSolved,
      avgPerDay,
      bestDay
    };
  }

  private getPeriodDays(): number {
    switch (this.selectedPeriod) {
      case '7days': return 7;
      case '30days': return 30;
      case '90days': return 90;
      default: return 30;
    }
  }
}

// ===============================
// ALTERNATIVE MINIMAL CHART (Canvas-based)
// ===============================

// If you prefer not to use Chart.js, here's a simpler canvas-based implementation:

/*
@Component({
  selector: 'app-simple-progress-chart',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="simple-chart-container">
      <h4>Last 7 Days Progress</h4>
      <div class="chart-wrapper">
        <canvas #canvas width="400" height="200"></canvas>
        <div class="chart-overlay" *ngIf="isEmpty">
          <mat-icon>insights</mat-icon>
          <p>Start solving problems to see your progress!</p>
        </div>
      </div>
      <div class="simple-legend">
        <div class="legend-item">
          <div class="color-box solved"></div>
          <span>Solved</span>
        </div>
        <div class="legend-item">
          <div class="color-box attempted"></div>
          <span>Attempted</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .simple-chart-container {
      padding: 1rem;
    }

    .simple-chart-container h4 {
      text-align: center;
      margin-bottom: 1rem;
      color: rgba(0, 0, 0, 0.7);
    }

    .chart-wrapper {
      position: relative;
      height: 200px;
      margin-bottom: 1rem;
    }

    canvas {
      width: 100%;
      height: 100%;
      border-radius: 8px;
      background: #f5f5f5;
    }

    .chart-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      color: rgba(0, 0, 0, 0.5);
    }

    .chart-overlay mat-icon {
      font-size: 2rem;
      width: 2rem;
      height: 2rem;
      margin-bottom: 0.5rem;
    }

    .simple-legend {
      display: flex;
      justify-content: center;
      gap: 1rem;
    }

    .legend-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.9rem;
    }

    .color-box {
      width: 12px;
      height: 12px;
      border-radius: 2px;
    }

    .color-box.solved {
      background-color: #4CAF50;
    }

    .color-box.attempted {
      background-color: #FFC107;
    }
  `]
})
export class SimpleProgressChartComponent implements OnInit, OnChanges {
  @ViewChild('canvas', { static: true }) canvas!: ElementRef<HTMLCanvasElement>;
  @Input() problems: Problem[] = [];

  isEmpty = true;

  ngOnInit(): void {
    this.drawChart();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['problems']) {
      this.drawChart();
    }
  }

  private drawChart(): void {
    const canvas = this.canvas.nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const data = this.getLast7DaysData();
    this.isEmpty = data.every(d => d.solved === 0 && d.attempted === 0);

    if (this.isEmpty) return;

    const maxValue = Math.max(...data.map(d => d.solved + d.attempted), 1);
    const barWidth = canvas.width / 7;
    const maxHeight = canvas.height - 60;

    data.forEach((dayData, index) => {
      const x = index * barWidth + 10;
      const barPadding = 20;
      const actualBarWidth = barWidth - barPadding;

      // Draw solved problems (bottom part)
      const solvedHeight = (dayData.solved / maxValue) * maxHeight;
      const solvedY = canvas.height - 40 - solvedHeight;

      ctx.fillStyle = '#4CAF50';
      ctx.fillRect(x, solvedY, actualBarWidth, solvedHeight);

      // Draw attempted problems (top part)
      const attemptedHeight = (dayData.attempted / maxValue) * maxHeight;
      const attemptedY = solvedY - attemptedHeight;

      ctx.fillStyle = '#FFC107';
      ctx.fillRect(x, attemptedY, actualBarWidth, attemptedHeight);

      // Draw day labels
      ctx.fillStyle = '#666';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';

      const today = new Date();
      const date = new Date(today);
      date.setDate(date.getDate() - (6 - index));
      const dayLabel = date.toLocaleDateString('en-US', { weekday: 'short' });

      ctx.fillText(dayLabel, x + actualBarWidth / 2, canvas.height - 5);

      // Draw values on top of bars
      const totalValue = dayData.solved + dayData.attempted;
      if (totalValue > 0) {
        ctx.fillStyle = '#333';
        ctx.font = '11px Arial';
        ctx.fillText(totalValue.toString(), x + actualBarWidth / 2, attemptedY - 5);
      }
    });
  }

  private getLast7DaysData(): { solved: number; attempted: number }[] {
    const today = new Date();
    const data: { solved: number; attempted: number }[] = [];

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const solvedCount = this.problems.filter(problem => {
        if (!problem.solvedDate) return false;
        const solvedDate = new Date(problem.solvedDate);
        solvedDate.setHours(0, 0, 0, 0);
        return solvedDate.getTime() === date.getTime();
      }).length;

      const attemptedCount = this.problems.filter(problem => {
        if (!problem.lastAttemptDate || problem.status === 'Solved') return false;
        const attemptDate = new Date(problem.lastAttemptDate);
        attemptDate.setHours(0, 0, 0, 0);
        return attemptDate.getTime() === date.getTime();
      }).length;

      data.push({ solved: solvedCount, attempted: attemptedCount });
    }

    return data;
  }
}
*/
