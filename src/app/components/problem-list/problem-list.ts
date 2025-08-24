import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatCardModule } from '@angular/material/card';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { LeetcodeService } from '../../services/leetcode';
import { Problem } from '../../models/problem';
import { Observable } from 'rxjs';
import { ProblemFormComponent } from '../problem-form/problem-form';
import { NotesDialogComponent } from '../notes-dialog/notes-dialog';

@Component({
  selector: 'app-problem-list',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatCardModule,
    MatMenuModule,
    MatDialogModule,
    MatSnackBarModule
  ],
  template: `
    <div class="problem-list-container">
      <div class="header">
        <div class="header-content">
          <h1>Problems</h1>
          <p>Manage and track your LeetCode problems</p>
        </div>
        <button mat-raised-button color="primary" (click)="openAddProblemDialog()" class="add-problem-btn">
          <mat-icon>add</mat-icon>
          <span>Add Problem</span>
        </button>
      </div>

      <mat-card class="problems-card">
        <mat-card-content>
          <mat-table [dataSource]="(problems$ | async) || []" class="problems-table">
            <ng-container matColumnDef="leetcodeId">
              <mat-header-cell *matHeaderCellDef>#</mat-header-cell>
              <mat-cell *matCellDef="let problem">{{ problem.leetcodeId }}</mat-cell>
            </ng-container>

            <ng-container matColumnDef="title">
              <mat-header-cell *matHeaderCellDef>Title</mat-header-cell>
              <mat-cell *matCellDef="let problem">
                <div class="problem-title">
                  <a [href]="problem.url" target="_blank" class="title-link">
                    {{ problem.title }}
                    <mat-icon class="external-link">open_in_new</mat-icon>
                  </a>
                </div>
              </mat-cell>
            </ng-container>

            <ng-container matColumnDef="difficulty">
              <mat-header-cell *matHeaderCellDef>Difficulty</mat-header-cell>
              <mat-cell *matCellDef="let problem">
                <mat-chip [class]="'difficulty-' + problem.difficulty.toLowerCase()">
                  {{ problem.difficulty }}
                </mat-chip>
              </mat-cell>
            </ng-container>

            <ng-container matColumnDef="status">
              <mat-header-cell *matHeaderCellDef>Status</mat-header-cell>
              <mat-cell *matCellDef="let problem">
                <mat-chip [class]="'status-' + problem.status.toLowerCase().replace(' ', '-')">
                  {{ problem.status }}
                </mat-chip>
              </mat-cell>
            </ng-container>

            <ng-container matColumnDef="tags">
              <mat-header-cell *matHeaderCellDef>Tags</mat-header-cell>
              <mat-cell *matCellDef="let problem">
                <div class="tags-container">
                  <mat-chip *ngFor="let tag of problem.tags.slice(0, 2)" class="tag-chip">
                    {{ tag }}
                  </mat-chip>
                  <span *ngIf="problem.tags.length > 2" class="more-tags">
                    +{{ problem.tags.length - 2 }} more
                  </span>
                </div>
              </mat-cell>
            </ng-container>

            <ng-container matColumnDef="attempts">
              <mat-header-cell *matHeaderCellDef>Attempts</mat-header-cell>
              <mat-cell *matCellDef="let problem">{{ problem.attempts }}</mat-cell>
            </ng-container>

            <ng-container matColumnDef="notes">
              <mat-header-cell *matHeaderCellDef>Notes</mat-header-cell>
              <mat-cell *matCellDef="let problem">
                <button mat-icon-button
                        (click)="viewNotes(problem)"
                        [disabled]="!problem.notes"
                        [title]="problem.notes ? 'View notes' : 'No notes'">
                  <mat-icon [class.has-notes]="problem.notes">description</mat-icon>
                </button>
              </mat-cell>
            </ng-container>

            <ng-container matColumnDef="actions">
              <mat-header-cell *matHeaderCellDef>Actions</mat-header-cell>
              <mat-cell *matCellDef="let problem">
                <button mat-icon-button [matMenuTriggerFor]="actionMenu">
                  <mat-icon>more_vert</mat-icon>
                </button>
                <mat-menu #actionMenu="matMenu">
                  <button mat-menu-item (click)="editProblem(problem)">
                    <mat-icon>edit</mat-icon>
                    <span>Edit</span>
                  </button>
                  <button mat-menu-item (click)="deleteProblem(problem)">
                    <mat-icon>delete</mat-icon>
                    <span>Delete</span>
                  </button>
                </mat-menu>
              </mat-cell>
            </ng-container>

            <mat-header-row *matHeaderRowDef="displayedColumns"></mat-header-row>
            <mat-row *matRowDef="let row; columns: displayedColumns;" class="problem-row"></mat-row>
          </mat-table>

          <div class="empty-state" *ngIf="(problems$ | async)?.length === 0">
            <mat-icon>assignment</mat-icon>
            <h3>No problems yet</h3>
            <p>Start tracking your LeetCode journey by adding your first problem!</p>
            <button mat-raised-button color="primary" (click)="openAddProblemDialog()">
              <mat-icon>add</mat-icon>
              Add Your First Problem
            </button>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .problem-list-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 2rem 1rem;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      margin-bottom: 2rem;
      gap: 1rem;
    }

    .header-content h1 {
      font-size: 2.5rem;
      font-weight: 400;
      margin-bottom: 0.5rem;
      line-height: 1.2;
    }

    .header-content p {
      color: rgba(0, 0, 0, 0.6);
      margin: 0;
      font-size: 1.1rem;
    }

    .add-problem-btn {
      height: 56px !important;
      padding: 0 32px !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      gap: 12px !important;
      font-weight: 500 !important;
      border-radius: 12px !important;
      flex-shrink: 0;
      min-width: 180px;
      font-size: 16px !important;
    }

    .add-problem-btn mat-icon {
      font-size: 24px !important;
      width: 24px !important;
      height: 24px !important;
      margin: 0 !important;
    }

    .add-problem-btn span {
      font-size: 16px;
      font-weight: 500;
      line-height: 1;
    }

    /* Dark theme override */
    :host-context(.dark-theme) .header-content p {
      color: rgba(255, 255, 255, 0.6);
    }

    .problems-card {
      border-radius: 12px !important;
      box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06) !important;
      border: 1px solid rgba(0, 0, 0, 0.05);
      overflow: hidden;
    }

    .problems-table {
      width: 100%;
      font-family: 'Google Sans', 'Roboto', sans-serif;
      background: transparent;
    }

    .mat-mdc-table {
      background: transparent !important;
    }

    .mat-mdc-header-row {
      background: rgba(103, 80, 164, 0.04) !important;
      border-bottom: 1px solid rgba(0, 0, 0, 0.08) !important;
      height: 56px;
    }

    .mat-mdc-header-cell {
      color: #1f2937 !important;
      font-size: 12px !important;
      font-weight: 500 !important;
      letter-spacing: 0.8px !important;
      text-transform: uppercase !important;
      padding: 0 16px !important;
      border-bottom: none !important;
      height: 56px;
      display: flex;
      align-items: center;
    }

    .mat-mdc-row {
      border-bottom: 1px solid rgba(0, 0, 0, 0.05) !important;
      height: 72px;
      transition: background-color 0.15s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .mat-mdc-row:hover {
      background: rgba(103, 80, 164, 0.04) !important;
    }

    .mat-mdc-row:last-child {
      border-bottom: none !important;
    }

    .mat-mdc-cell {
      color: #374151 !important;
      font-size: 14px !important;
      font-weight: 400 !important;
      padding: 12px 16px !important;
      border-bottom: none !important;
      height: 72px;
      display: flex;
      align-items: center;
      line-height: 1.43;
    }

    // Title cell styling
    .mat-mdc-cell .problem-title {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .title-link {
      color: #1976d2 !important;
      text-decoration: none !important;
      font-weight: 500 !important;
      display: flex;
      align-items: center;
      gap: 6px;
      transition: color 0.15s ease;
    }

    .title-link:hover {
      color: #1565c0 !important;
    }

    .external-link {
      font-size: 16px !important;
      width: 16px !important;
      height: 16px !important;
      opacity: 0.6;
    }

    // Modern Material chips
    .mat-mdc-chip {
      font-size: 12px !important;
      font-weight: 500 !important;
      height: 28px !important;
      border-radius: 14px !important;
      padding: 0 12px !important;
      border: none !important;
      letter-spacing: 0.25px !important;
    }

    .difficulty-easy {
      background: rgba(34, 197, 94, 0.12) !important;
      color: #059669 !important;
    }

    .difficulty-medium {
      background: rgba(251, 146, 60, 0.12) !important;
      color: #ea580c !important;
    }

    .difficulty-hard {
      background: rgba(239, 68, 68, 0.12) !important;
      color: #dc2626 !important;
    }

    .status-solved {
      background: rgba(34, 197, 94, 0.12) !important;
      color: #059669 !important;
    }

    .status-attempted {
      background: rgba(251, 191, 36, 0.12) !important;
      color: #d97706 !important;
    }

    .status-not-attempted {
      background: rgba(148, 163, 184, 0.12) !important;
      color: #64748b !important;
    }

    .status-reviewed {
      background: rgba(99, 102, 241, 0.12) !important;
      color: #4f46e5 !important;
    }

    // Tags styling
    .tags-container {
      display: flex;
      align-items: center;
      gap: 4px;
      flex-wrap: wrap;
    }

    .tag-chip {
      background: rgba(103, 80, 164, 0.08) !important;
      color: #5b21b6 !important;
      border: 1px solid rgba(103, 80, 164, 0.2) !important;
      font-size: 11px !important;
      height: 24px !important;
      border-radius: 12px !important;
      padding: 0 8px !important;
      font-weight: 500 !important;
    }

    .more-tags {
      font-size: 12px !important;
      color: #6b7280 !important;
      font-weight: 500 !important;
    }

    // Notes button
    .mat-mdc-icon-button {
      width: 40px !important;
      height: 40px !important;
      border-radius: 20px !important;
    }

    .mat-mdc-icon-button mat-icon.has-notes {
      color: #1976d2 !important;
    }

    .mat-mdc-icon-button mat-icon:not(.has-notes) {
      color: #9ca3af !important;
    }

    .mat-mdc-icon-button:hover {
      background: rgba(0, 0, 0, 0.04) !important;
    }

    // Actions menu button
    .mat-mdc-icon-button[aria-expanded="true"] {
      background: rgba(103, 80, 164, 0.08) !important;
    }

    // Empty state
    .empty-state {
      text-align: center;
      padding: 64px 32px;
      color: #6b7280;
    }

    .empty-state mat-icon {
      font-size: 64px !important;
      width: 64px !important;
      height: 64px !important;
      margin-bottom: 16px;
      color: #d1d5db;
    }

    .empty-state h3 {
      font-size: 20px;
      font-weight: 500;
      margin: 0 0 8px 0;
      color: #374151;
    }

    .empty-state p {
      font-size: 14px;
      margin: 0 0 24px 0;
      color: #6b7280;
      line-height: 1.5;
    }

    // Dark theme overrides
    :host-context(.dark-theme) {
      .problems-card {
        border: 1px solid rgba(255, 255, 255, 0.1);
        box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.3), 0 1px 2px 0 rgba(0, 0, 0, 0.2) !important;
      }

      .mat-mdc-header-row {
        background: rgba(255, 255, 255, 0.05) !important;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1) !important;
      }

      .mat-mdc-header-cell {
        color: rgba(255, 255, 255, 0.7) !important;
      }

      .mat-mdc-row {
        border-bottom: 1px solid rgba(255, 255, 255, 0.05) !important;
      }

      .mat-mdc-row:hover {
        background: rgba(255, 255, 255, 0.05) !important;
      }

      .mat-mdc-cell {
        color: rgba(255, 255, 255, 0.9) !important;
      }

      .title-link {
        color: #93c5fd !important;
      }

      .title-link:hover {
        color: #bfdbfe !important;
      }

      .difficulty-easy {
        background: rgba(34, 197, 94, 0.2) !important;
        color: #4ade80 !important;
      }

      .difficulty-medium {
        background: rgba(251, 146, 60, 0.2) !important;
        color: #fb923c !important;
      }

      .difficulty-hard {
        background: rgba(239, 68, 68, 0.2) !important;
        color: #f87171 !important;
      }

      .status-solved {
        background: rgba(34, 197, 94, 0.2) !important;
        color: #4ade80 !important;
      }

      .status-attempted {
        background: rgba(251, 191, 36, 0.2) !important;
        color: #fbbf24 !important;
      }

      .status-not-attempted {
        background: rgba(148, 163, 184, 0.2) !important;
        color: #94a3b8 !important;
      }

      .status-reviewed {
        background: rgba(99, 102, 241, 0.2) !important;
        color: #a5b4fc !important;
      }

      .tag-chip {
        background: rgba(255, 255, 255, 0.1) !important;
        color: #c4b5fd !important;
        border: 1px solid rgba(255, 255, 255, 0.2) !important;
      }

      .more-tags {
        color: rgba(255, 255, 255, 0.6) !important;
      }

      .mat-mdc-icon-button:hover {
        background: rgba(255, 255, 255, 0.05) !important;
      }

      .empty-state h3 {
        color: rgba(255, 255, 255, 0.9) !important;
      }

      .empty-state mat-icon {
        color: rgba(255, 255, 255, 0.3) !important;
      }
    }

    // Responsive design
    @media (max-width: 768px) {
      .mat-mdc-cell, .mat-mdc-header-cell {
        padding: 8px 12px !important;
      }

      .mat-mdc-row {
        height: 64px;
      }

      .mat-mdc-header-row {
        height: 48px;
      }

      .mat-mdc-header-cell {
        height: 48px;
        font-size: 11px !important;
      }

      .mat-mdc-cell {
        height: 64px;
        font-size: 13px !important;
      }
    }
  `]
})
export class ProblemListComponent implements OnInit {
  problems$: Observable<Problem[]>;
  displayedColumns: string[] = ['leetcodeId', 'title', 'difficulty', 'status', 'tags', 'attempts', 'notes', 'actions'];

  constructor(
    private leetcodeService: LeetcodeService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar // Inject MatSnackBar
  ) {
    this.problems$ = this.leetcodeService.problems$;
  }

  ngOnInit(): void {}

  openAddProblemDialog(): void {
    console.log('Opening add problem dialog...'); // Debug log

    const dialogRef = this.dialog.open(ProblemFormComponent, {
      width: '90vw',
      maxWidth: '600px',
      minWidth: '500px',
      height: 'auto',
      maxHeight: '90vh',
      disableClose: false,
      autoFocus: true,
      restoreFocus: true,
      data: null // Make sure this is null for add mode
    });

    dialogRef.afterClosed().subscribe(result => {
      console.log('Dialog closed with result:', result); // Debug log

      if (result) {
        console.log('Adding problem...'); // Debug log
        this.leetcodeService.addProblem(result).then(() => {
          console.log('Problem added successfully!'); // Debug log
          this.snackBar.open('Problem added successfully!', 'Close', {
            duration: 3000,
            verticalPosition: 'top',
            panelClass: ['snack-bar-success']
          });
        }).catch(error => {
          console.error('Error adding problem:', error); // Debug log
          this.snackBar.open('Error adding problem. Please try again.', 'Close', {
            duration: 3000,
            verticalPosition: 'top',
            panelClass: ['snack-bar-error']
          });
        });
      }
    });
  }

  editProblem(problem: Problem): void {
    const dialogRef = this.dialog.open(ProblemFormComponent, {
      width: '90vw',
      maxWidth: '600px',
      minWidth: '500px',
      height: 'auto',
      maxHeight: '90vh',
      disableClose: false,
      autoFocus: true,
      restoreFocus: true,
      data: problem
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && problem.id) {
        this.leetcodeService.updateProblem(problem.id, result);
      }
    });
  }

  async deleteProblem(problem: Problem): Promise<void> {
    if (confirm('Are you sure you want to delete this problem?')) {
      if (problem.id) {
        await this.leetcodeService.deleteProblem(problem.id);
      }
    }
  }

  viewNotes(problem: Problem): void {
    this.dialog.open(NotesDialogComponent, {
      width: '90vw',
      maxWidth: '700px',
      data: problem
    });
  }
}
