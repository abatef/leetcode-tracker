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
      overflow: hidden;
    }

    .problems-table {
      width: 100%;
    }

    .problem-row:hover {
      background-color: rgba(0, 0, 0, 0.02);
    }

    .problem-title {
      max-width: 200px;
    }

    .title-link {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      text-decoration: none;
      color: var(--mdc-theme-primary);
      font-weight: 500;
    }

    .title-link:hover {
      text-decoration: underline;
    }

    .external-link {
      font-size: 1rem;
      width: 1rem;
      height: 1rem;
    }

    .difficulty-easy {
      background-color: #4CAF50;
      color: white;
    }

    .difficulty-medium {
      background-color: #FF9800;
      color: white;
    }

    .difficulty-hard {
      background-color: #F44336;
      color: white;
    }

    .status-solved {
      background-color: #4CAF50;
      color: white;
    }

    .status-attempted {
      background-color: #FF9800;
      color: white;
    }

    .status-not-attempted {
      background-color: #9E9E9E;
      color: white;
    }

    .status-reviewed {
      background-color: #2196F3;
      color: white;
    }

    .tags-container {
      display: flex;
      align-items: center;
      gap: 0.25rem;
      flex-wrap: wrap;
    }

    .tag-chip {
      font-size: 0.75rem;
      height: 24px;
      background-color: rgba(0, 0, 0, 0.1);
    }

    .more-tags {
      font-size: 0.75rem;
      color: rgba(0, 0, 0, 0.6);
    }

    .empty-state {
      text-align: center;
      padding: 4rem 2rem;
      color: rgba(0, 0, 0, 0.6);
    }

    .empty-state mat-icon {
      font-size: 4rem;
      width: 4rem;
      height: 4rem;
      margin-bottom: 1rem;
    }

    .empty-state h3 {
      margin-bottom: 0.5rem;
      color: rgba(0, 0, 0, 0.8);
    }

    .empty-state p {
      margin-bottom: 2rem;
    }

    @media (max-width: 768px) {
      .header {
        flex-direction: column;
        gap: 1.5rem;
        align-items: stretch;
      }

      .add-problem-btn {
        width: 100%;
        justify-content: center !important;
      }
    }
  `]
})
export class ProblemListComponent implements OnInit {
  problems$: Observable<Problem[]>;
  displayedColumns: string[] = ['leetcodeId', 'title', 'difficulty', 'status', 'tags', 'attempts', 'actions'];

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
}
