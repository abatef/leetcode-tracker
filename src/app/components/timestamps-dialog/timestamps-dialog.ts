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
  templateUrl: './timestamps-dialog.html',
  styleUrls: ['./timestamps-dialog.scss']
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

  // New method to check if we should show value details
  shouldShowValueDetails(action: string): boolean {
    return action !== 'notes_updated';
  }

  // New method to format tags as array
  formatTagsArray(value: any): string[] {
    if (value === null || value === undefined) return [];
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') return value.split(',').map(tag => tag.trim()).filter(tag => tag);
    return [];
  }

  // New method to check if action is tags related
  isTagsAction(action: string): boolean {
    return action === 'tags_updated';
  }

  // New method to get added and removed items
  getAddedAndRemovedItems(oldValue: any, newValue: any): { added: string[], removed: string[] } {
    const oldArray = this.formatTagsArray(oldValue);
    const newArray = this.formatTagsArray(newValue);

    const added = newArray.filter(item => !oldArray.includes(item));
    const removed = oldArray.filter(item => !newArray.includes(item));

    return { added, removed };
  }

  // New method to check if action is companies related
  isCompaniesAction(action: string): boolean {
    return action === 'companies_updated';
  }

  // New method to check if action is tags or companies related
  isTagsOrCompaniesAction(action: string): boolean {
    return action === 'tags_updated' || action === 'companies_updated';
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
