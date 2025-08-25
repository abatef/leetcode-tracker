import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { Problem, ProblemAction } from '../../models/problem';

@Component({
  selector: 'app-timestamps-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule, MatDividerModule, MatChipsModule],
  template: `
    <h2 mat-dialog-title>
      <mat-icon>history</mat-icon>
      Problem Timeline
    </h2>

    <mat-dialog-content>
      <div class="problem-info">
        <h3>{{ data.title }}</h3>
        <span class="problem-id">#{{ data.leetcodeId }}</span>
      </div>

      <div class="timeline-container">
        <!-- Action History -->
        <div class="timeline-section" *ngIf="actionHistory.length > 0">
          <h4>Action History</h4>
          <div class="action-timeline">
            <div class="action-item" *ngFor="let action of actionHistory; trackBy: trackByAction">
              <div class="action-icon" [ngClass]="getActionIconClass(action.action)">
                <mat-icon>{{ getActionIcon(action.action) }}</mat-icon>
              </div>
              <div class="action-content">
                <div class="action-title">{{ action.details.description || getActionTitle(action.action) }}</div>
                <div class="action-date">{{ formatFullDate(action.timestamp) }}</div>
                <div class="action-relative">{{ getRelativeTime(action.timestamp) }}</div>
                <div class="action-details" *ngIf="action.details.field && action.details.oldValue !== undefined">
                  <mat-chip class="old-value">{{ formatValue(action.details.oldValue) }}</mat-chip>
                  <mat-icon class="arrow">arrow_forward</mat-icon>
                  <mat-chip class="new-value">{{ formatValue(action.details.newValue) }}</mat-chip>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Key Timestamps -->
        <div class="timeline-section">
          <h4>Key Timestamps</h4>
          <div class="timestamps-list">
            <div class="timestamp-item">
              <div class="timestamp-icon created">
                <mat-icon>add_circle</mat-icon>
              </div>
              <div class="timestamp-content">
                <div class="timestamp-title">Problem Added</div>
                <div class="timestamp-date">{{ formatFullDate(data.createdAt) }}</div>
                <div class="timestamp-relative">{{ getRelativeTime(data.createdAt) }}</div>
              </div>
            </div>

            <mat-divider></mat-divider>

            <div class="timestamp-item" *ngIf="data.firstAttemptDate">
              <div class="timestamp-icon attempted">
                <mat-icon>play_circle</mat-icon>
              </div>
              <div class="timestamp-content">
                <div class="timestamp-title">First Attempt</div>
                <div class="timestamp-date">{{ formatFullDate(data.firstAttemptDate) }}</div>
                <div class="timestamp-relative">{{ getRelativeTime(data.firstAttemptDate) }}</div>
              </div>
            </div>

            <mat-divider *ngIf="data.firstAttemptDate"></mat-divider>

            <div class="timestamp-item" *ngIf="data.firstSolvedDate">
              <div class="timestamp-icon first-solved">
                <mat-icon>star</mat-icon>
              </div>
              <div class="timestamp-content">
                <div class="timestamp-title">First Time Solved</div>
                <div class="timestamp-date">{{ formatFullDate(data.firstSolvedDate) }}</div>
                <div class="timestamp-relative">{{ getRelativeTime(data.firstSolvedDate) }}</div>
              </div>
            </div>

            <mat-divider *ngIf="data.firstSolvedDate"></mat-divider>

            <div class="timestamp-item" *ngIf="data.solvedDate && data.solvedDate !== data.firstSolvedDate">
              <div class="timestamp-icon solved">
                <mat-icon>check_circle</mat-icon>
              </div>
              <div class="timestamp-content">
                <div class="timestamp-title">Last Solved</div>
                <div class="timestamp-date">{{ formatFullDate(data.solvedDate) }}</div>
                <div class="timestamp-relative">{{ getRelativeTime(data.solvedDate) }}</div>
              </div>
            </div>

            <mat-divider *ngIf="data.solvedDate && data.solvedDate !== data.firstSolvedDate"></mat-divider>

            <div class="timestamp-item" *ngIf="isUpdated()">
              <div class="timestamp-icon updated">
                <mat-icon>edit</mat-icon>
              </div>
              <div class="timestamp-content">
                <div class="timestamp-title">Last Updated</div>
                <div class="timestamp-date">{{ formatFullDate(data.updatedAt) }}</div>
                <div class="timestamp-relative">{{ getRelativeTime(data.updatedAt) }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="timeline-stats">
        <div class="stat-item">
          <mat-icon>timer</mat-icon>
          <div class="stat-content">
            <span class="stat-value">{{ getTotalDays() }}</span>
            <span class="stat-label">Days since added</span>
          </div>
        </div>
        <div class="stat-item" *ngIf="data.firstSolvedDate">
          <mat-icon>trending_up</mat-icon>
          <div class="stat-content">
            <span class="stat-value">{{ getDaysToFirstSolve() }}</span>
            <span class="stat-label">Days to first solve</span>
          </div>
        </div>
        <div class="stat-item">
          <mat-icon>update</mat-icon>
          <div class="stat-content">
            <span class="stat-value">{{ actionHistory.length }}</span>
            <span class="stat-label">Total actions</span>
          </div>
        </div>
      </div>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Close</button>
    </mat-dialog-actions>
  `,
  styles: [`
    h2[mat-dialog-title] {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0;
    }

    .problem-info {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-bottom: 1.5rem;
      padding-bottom: 1rem;
      border-bottom: 1px solid rgba(0,0,0,0.1);
    }

    .problem-info h3 {
      margin: 0;
      color: var(--mdc-theme-primary);
      font-size: 1.1rem;
      font-weight: 500;
    }

    .problem-id {
      background: rgba(103, 80, 164, 0.1);
      color: #5b21b6;
      padding: 0.25rem 0.75rem;
      border-radius: 12px;
      font-size: 0.8rem;
      font-weight: 500;
      border: 1px solid rgba(103, 80, 164, 0.2);
    }

    mat-dialog-content {
      min-width: 600px;
      max-width: 800px;
      max-height: 600px;
      overflow-y: auto;
    }

    .timeline-container {
      display: flex;
      flex-direction: column;
      gap: 2rem;
    }

    .timeline-section h4 {
      margin: 0 0 1rem 0;
      color: rgba(0, 0, 0, 0.87);
      font-size: 1rem;
      font-weight: 500;
      padding-bottom: 0.5rem;
      border-bottom: 2px solid var(--mdc-theme-primary);
    }

    .action-timeline {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .action-item {
      display: flex;
      align-items: flex-start;
      gap: 1rem;
      padding: 1rem;
      background: rgba(0, 0, 0, 0.02);
      border-radius: 8px;
      border-left: 3px solid var(--mdc-theme-primary);
    }

    .action-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      flex-shrink: 0;
    }

    .action-icon.created {
      background: rgba(76, 175, 80, 0.1);
      color: #4caf50;
    }

    .action-icon.status_changed {
      background: rgba(33, 150, 243, 0.1);
      color: #2196f3;
    }

    .action-icon.notes_updated {
      background: rgba(255, 193, 7, 0.1);
      color: #ffc107;
    }

    .action-icon.tags_updated,
    .action-icon.companies_updated {
      background: rgba(156, 39, 176, 0.1);
      color: #9c27b0;
    }

    .action-icon.attempts_updated,
    .action-icon.time_updated {
      background: rgba(255, 87, 34, 0.1);
      color: #ff5722;
    }

    .action-content {
      flex: 1;
      min-width: 0;
    }

    .action-title {
      font-weight: 500;
      font-size: 0.9rem;
      margin-bottom: 0.25rem;
      color: rgba(0, 0, 0, 0.87);
    }

    .action-date {
      font-size: 0.8rem;
      color: rgba(0, 0, 0, 0.6);
      margin-bottom: 0.125rem;
    }

    .action-relative {
      font-size: 0.75rem;
      color: rgba(0, 0, 0, 0.5);
      font-style: italic;
    }

    .action-details {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-top: 0.5rem;
    }

    .action-details mat-chip {
      font-size: 0.75rem;
      height: 24px;
      --mdc-chip-container-height: 24px;
    }

    .old-value {
      background: rgba(244, 67, 54, 0.1);
      color: #f44336;
      border: 1px solid rgba(244, 67, 54, 0.2);
    }

    .new-value {
      background: rgba(76, 175, 80, 0.1);
      color: #4caf50;
      border: 1px solid rgba(76, 175, 80, 0.2);
    }

    .arrow {
      font-size: 16px;
      width: 16px;
      height: 16px;
      color: rgba(0, 0, 0, 0.5);
    }

    .timestamps-list {
      margin-bottom: 1.5rem;
    }

    .timestamp-item {
      display: flex;
      align-items: flex-start;
      gap: 1rem;
      padding: 1rem 0;
    }

    .timestamp-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      flex-shrink: 0;
    }

    .timestamp-icon.created {
      background: rgba(76, 175, 80, 0.1);
      color: #4caf50;
    }

    .timestamp-icon.attempted {
      background: rgba(255, 193, 7, 0.1);
      color: #ffc107;
    }

    .timestamp-icon.first-solved {
      background: rgba(255, 152, 0, 0.1);
      color: #ff9800;
    }

    .timestamp-icon.solved {
      background: rgba(76, 175, 80, 0.1);
      color: #4caf50;
    }

    .timestamp-icon.updated {
      background: rgba(33, 150, 243, 0.1);
      color: #2196f3;
    }

    .timestamp-content {
      flex: 1;
      min-width: 0;
    }

    .timestamp-title {
      font-weight: 500;
      font-size: 0.95rem;
      margin-bottom: 0.25rem;
      color: rgba(0, 0, 0, 0.87);
    }

    .timestamp-date {
      font-size: 0.85rem;
      color: rgba(0, 0, 0, 0.6);
      margin-bottom: 0.125rem;
    }

    .timestamp-relative {
      font-size: 0.8rem;
      color: rgba(0, 0, 0, 0.5);
      font-style: italic;
    }

    .timeline-stats {
      display: flex;
      justify-content: space-around;
      padding: 1rem;
      background: rgba(0, 0, 0, 0.02);
      border-radius: 8px;
      border-top: 1px solid rgba(0, 0, 0, 0.1);
    }

    .stat-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      text-align: center;
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
      font-size: 1.1rem;
      font-weight: 600;
      color: #1976d2;
      line-height: 1.2;
    }

    .stat-label {
      font-size: 0.75rem;
      color: rgba(0, 0, 0, 0.6);
      line-height: 1.2;
    }

    mat-divider {
      margin: 0 0 0 2rem;
    }

    // Dark theme styles
    :host-context(.dark-theme) .problem-info {
      border-bottom-color: rgba(255, 255, 255, 0.1);
    }

    :host-context(.dark-theme) .problem-id {
      background: rgba(255, 255, 255, 0.1);
      color: #c4b5fd;
      border-color: rgba(255, 255, 255, 0.2);
    }

    :host-context(.dark-theme) .timeline-section h4 {
      color: rgba(255, 255, 255, 0.9);
    }

    :host-context(.dark-theme) .action-item {
      background: rgba(255, 255, 255, 0.02);
    }

    :host-context(.dark-theme) .action-title,
    :host-context(.dark-theme) .timestamp-title {
      color: rgba(255, 255, 255, 0.9);
    }

    :host-context(.dark-theme) .action-date,
    :host-context(.dark-theme) .timestamp-date {
      color: rgba(255, 255, 255, 0.7);
    }

    :host-context(.dark-theme) .action-relative,
    :host-context(.dark-theme) .timestamp-relative {
      color: rgba(255, 255, 255, 0.5);
    }

    :host-context(.dark-theme) .timeline-stats {
      background: rgba(255, 255, 255, 0.02);
      border-top-color: rgba(255, 255, 255, 0.1);
    }

    :host-context(.dark-theme) .stat-label {
      color: rgba(255, 255, 255, 0.6);
    }

    :host-context(.dark-theme) .arrow {
      color: rgba(255, 255, 255, 0.5);
    }

    // Responsive design
    @media (max-width: 600px) {
      mat-dialog-content {
        min-width: 300px;
        max-width: 90vw;
      }

      .problem-info {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.5rem;
      }

      .timeline-stats {
        flex-direction: column;
        gap: 1rem;
        align-items: center;
      }

      .action-details {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.25rem;
      }
    }

    // Scrollbar
    mat-dialog-content {
      scrollbar-width: thin;
      scrollbar-color: rgba(103, 80, 164, 0.3) rgba(0, 0, 0, 0.05);
    }

    mat-dialog-content::-webkit-scrollbar {
      width: 6px;
    }

    mat-dialog-content::-webkit-scrollbar-track {
      background: rgba(0, 0, 0, 0.03);
      border-radius: 3px;
    }

    mat-dialog-content::-webkit-scrollbar-thumb {
      background: rgba(103, 80, 164, 0.3);
      border-radius: 3px;
      transition: background-color 0.2s ease;
    }

    mat-dialog-content::-webkit-scrollbar-thumb:hover {
      background: rgba(103, 80, 164, 0.5);
    }
  `]
})
export class TimestampsDialogComponent {
  actionHistory: ProblemAction[] = [];

  constructor(
    public dialogRef: MatDialogRef<TimestampsDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: Problem
  ) {
    this.actionHistory = (data.actionHistory || []).sort((a, b) =>
      b.timestamp.getTime() - a.timestamp.getTime()
    );
  }

  trackByAction(index: number, action: ProblemAction): any {
    return action.timestamp.getTime() + action.action + (action.details.field || '');
  }

  getActionIcon(action: string): string {
    switch (action) {
      case 'created': return 'add_circle';
      case 'status_changed': return 'swap_horiz';
      case 'notes_updated': return 'edit_note';
      case 'tags_updated': return 'local_offer';
      case 'companies_updated': return 'business';
      case 'attempts_updated': return 'repeat';
      case 'time_updated': return 'schedule';
      default: return 'update';
    }
  }

  getActionIconClass(action: string): string {
    return action.replace('_', '-');
  }

  getActionTitle(action: string): string {
    switch (action) {
      case 'created': return 'Problem Created';
      case 'status_changed': return 'Status Changed';
      case 'notes_updated': return 'Notes Updated';
      case 'tags_updated': return 'Tags Updated';
      case 'companies_updated': return 'Companies Updated';
      case 'attempts_updated': return 'Attempts Updated';
      case 'time_updated': return 'Time Updated';
      default: return 'Action Performed';
    }
  }

  formatValue(value: any): string {
    if (value === null || value === undefined) return 'None';
    if (Array.isArray(value)) return value.length > 0 ? value.join(', ') : 'None';
    return String(value);
  }

  formatFullDate(date: Date | null | undefined): string {
    if (!date) return 'Not available';
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }) + ' at ' + date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getRelativeTime(date: Date | null | undefined): string {
    if (!date) return '';

    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 30) return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;

    const diffInMonths = Math.floor(diffInDays / 30);
    if (diffInMonths < 12) return `${diffInMonths} month${diffInMonths > 1 ? 's' : ''} ago`;

    const diffInYears = Math.floor(diffInMonths / 12);
    return `${diffInYears} year${diffInYears > 1 ? 's' : ''} ago`;
  }

  isUpdated(): boolean {
    if (!this.data.updatedAt || !this.data.createdAt) return false;
    const timeDiff = Math.abs(this.data.updatedAt.getTime() - this.data.createdAt.getTime());
    return timeDiff > 60000; // More than 1 minute difference
  }

  getTotalDays(): number {
    if (!this.data.createdAt) return 0;
    const now = new Date();
    return Math.floor((now.getTime() - this.data.createdAt.getTime()) / (1000 * 60 * 60 * 24));
  }

  getDaysToFirstSolve(): number {
    if (!this.data.firstSolvedDate || !this.data.createdAt) return 0;
    return Math.floor((this.data.firstSolvedDate.getTime() - this.data.createdAt.getTime()) / (1000 * 60 * 60 * 24));
  }
}
