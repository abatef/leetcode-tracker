import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { LeetcodeService } from '../../services/leetcode';
import { Problem } from '../../models/problem';
import { ProblemFormComponent } from '../problem-form/problem-form';
import { NotesDialogComponent } from '../notes-dialog/notes-dialog';
import { AllTagsDialogComponent } from '../tags-dialog/tags-dialog';
import { TimestampsDialogComponent } from '../timestamps-dialog/timestamps-dialog';
import { Observable } from 'rxjs';
import { MatChipsModule } from '@angular/material/chips';

@Component({
  selector: 'app-problem-list',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatChipsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule
  ],
  template: `
    <div class="problem-list-container">
      <div class="header-section">
        <h2>Problems</h2>
        <button mat-raised-button color="primary" (click)="addProblem()">
          <mat-icon>add</mat-icon>
          Add Problem
        </button>
      </div>

      <div class="filters-section">
        <mat-form-field appearance="outline">
          <mat-label>Search</mat-label>
          <input matInput (keyup)="applyFilter($event)" placeholder="Search problems...">
          <mat-icon matSuffix>search</mat-icon>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Difficulty</mat-label>
          <mat-select (selectionChange)="filterByDifficulty($event.value)" [value]="''">
            <mat-option value="">All</mat-option>
            <mat-option value="Easy">Easy</mat-option>
            <mat-option value="Medium">Medium</mat-option>
            <mat-option value="Hard">Hard</mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Status</mat-label>
          <mat-select (selectionChange)="filterByStatus($event.value)" [value]="''">
            <mat-option value="">All</mat-option>
            <mat-option value="Not Attempted">Not Attempted</mat-option>
            <mat-option value="Attempted">Attempted</mat-option>
            <mat-option value="Solved">Solved</mat-option>
            <mat-option value="Reviewed">Reviewed</mat-option>
          </mat-select>
        </mat-form-field>
      </div>

      <div class="table-container">
        <table mat-table [dataSource]="dataSource" matSort class="problems-table">
          <!-- ID Column -->
          <ng-container matColumnDef="id">
            <th mat-header-cell *matHeaderCellDef mat-sort-header>ID</th>
            <td mat-cell *matCellDef="let problem">{{ problem.leetcodeId }}</td>
          </ng-container>

          <!-- Title Column -->
          <ng-container matColumnDef="title">
            <th mat-header-cell *matHeaderCellDef mat-sort-header>Title</th>
            <td mat-cell *matCellDef="let problem">
              <a [href]="problem.url" target="_blank" class="title-link">
                {{ problem.title }}
              </a>
            </td>
          </ng-container>

          <!-- Difficulty Column -->
          <ng-container matColumnDef="difficulty">
            <th mat-header-cell *matHeaderCellDef mat-sort-header>Difficulty</th>
            <td mat-cell *matCellDef="let problem">
              <span class="difficulty-badge" [class]="'difficulty-' + problem.difficulty.toLowerCase()">
                {{ problem.difficulty }}
              </span>
            </td>
          </ng-container>

          <!-- Status Column -->
          <ng-container matColumnDef="status">
            <th mat-header-cell *matHeaderCellDef mat-sort-header>Status</th>
            <td mat-cell *matCellDef="let problem">
              <span class="status-badge" [class]="'status-' + problem.status.replace(' ', '-').toLowerCase()">
                {{ problem.status }}
              </span>
            </td>
          </ng-container>

          <!-- Tags Column -->
          <ng-container matColumnDef="tags">
            <th mat-header-cell *matHeaderCellDef>Tags</th>
            <td mat-cell *matCellDef="let problem">
              <div class="tags-container">
                <mat-chip *ngFor="let tag of problem.tags.slice(0, 3)">{{ tag }}</mat-chip>
                <span class="more-tags" *ngIf="problem.tags.length > 3">
                  +{{ problem.tags.length - 3 }} more
                </span>
              </div>
            </td>
          </ng-container>

          <!-- Attempts Column -->
          <ng-container matColumnDef="attempts">
            <th mat-header-cell *matHeaderCellDef mat-sort-header>Attempts</th>
            <td mat-cell *matCellDef="let problem">{{ problem.attempts }}</td>
          </ng-container>

          <!-- Time Spent Column -->
          <ng-container matColumnDef="timeSpent">
            <th mat-header-cell *matHeaderCellDef mat-sort-header>Time (min)</th>
            <td mat-cell *matCellDef="let problem">{{ problem.timeSpent }}</td>
          </ng-container>

          <!-- Actions Column -->
          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef>Actions</th>
            <td mat-cell *matCellDef="let problem">
              <button mat-icon-button [matMenuTriggerFor]="actionMenu">
                <mat-icon>more_vert</mat-icon>
              </button>
              <mat-menu #actionMenu="matMenu">
                <button mat-menu-item (click)="editProblem(problem)">
                  <mat-icon>edit</mat-icon>
                  <span>Edit</span>
                </button>
                <button mat-menu-item (click)="viewNotes(problem)" *ngIf="problem.notes">
                  <mat-icon>description</mat-icon>
                  <span>View Notes</span>
                </button>
                <button mat-menu-item (click)="viewAllTags(problem)" *ngIf="problem.tags.length > 3">
                  <mat-icon>local_offer</mat-icon>
                  <span>View All Tags</span>
                </button>
                <button mat-menu-item (click)="viewTimestamps(problem)">
                  <mat-icon>schedule</mat-icon>
                  <span>View Timeline</span>
                </button>
                <button mat-menu-item (click)="deleteProblem(problem)" class="delete-action">
                  <mat-icon>delete</mat-icon>
                  <span>Delete</span>
                </button>
              </mat-menu>
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
          <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
        </table>

        <div class="empty-state" *ngIf="dataSource.data.length === 0">
          <mat-icon>assignment</mat-icon>
          <h3>No problems found</h3>
          <p>Start by adding your first LeetCode problem!</p>
        </div>
      </div>

      <mat-paginator
        [pageSizeOptions]="[5, 10, 20, 50]"
        showFirstLastButtons
        aria-label="Select page of problems">
      </mat-paginator>
    </div>
  `,
  styles: [`
    .problem-list-container {
      padding: 2rem 1rem;
      max-width: 1200px;
      margin: 0 auto;
    }

    .header-section {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
    }

    .header-section h2 {
      margin: 0;
      font-size: 2.5rem;
      font-weight: 400;
      line-height: 1.2;
    }

    .filters-section {
      display: flex;
      gap: 1rem;
      margin-bottom: 2rem;
      flex-wrap: wrap;
    }

    .filters-section mat-form-field {
      min-width: 200px;
    }

    .table-container {
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      overflow: hidden;
      margin-bottom: 1rem;
    }

    .problems-table {
      width: 100%;
    }

    .title-link {
      color: var(--mdc-theme-primary);
      text-decoration: none;
      font-weight: 500;
      transition: color 0.2s ease;
    }

    .title-link:hover {
      text-decoration: underline;
    }

    .difficulty-badge {
      padding: 0.25rem 0.75rem;
      border-radius: 12px;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .difficulty-easy {
      background-color: rgba(76, 175, 80, 0.1);
      color: #2e7d32;
    }

    .difficulty-medium {
      background-color: rgba(255, 152, 0, 0.1);
      color: #f57c00;
    }

    .difficulty-hard {
      background-color: rgba(244, 67, 54, 0.1);
      color: #d32f2f;
    }

    .status-badge {
      padding: 0.25rem 0.75rem;
      border-radius: 12px;
      font-size: 0.75rem;
      font-weight: 500;
    }

    .status-not-attempted {
      background-color: rgba(158, 158, 158, 0.1);
      color: #616161;
    }

    .status-attempted {
      background-color: rgba(255, 193, 7, 0.1);
      color: #f57c00;
    }

    .status-solved {
      background-color: rgba(76, 175, 80, 0.1);
      color: #2e7d32;
    }

    .status-reviewed {
      background-color: rgba(103, 58, 183, 0.1);
      color: #5e35b1;
    }

    .tags-container {
      display: flex;
      flex-wrap: wrap;
      gap: 0.25rem;
      align-items: center;
    }

    .tags-container mat-chip {
      font-size: 0.7rem;
      height: 24px;
      margin: 0;
    }

    .more-tags {
      font-size: 0.75rem;
      color: rgba(0, 0, 0, 0.6);
      margin-left: 0.25rem;
    }

    .delete-action {
      color: #f44336;
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
      color: rgba(0, 0, 0, 0.3);
    }

    .empty-state h3 {
      margin: 0 0 0.5rem 0;
      font-size: 1.5rem;
      font-weight: 400;
    }

    .empty-state p {
      margin: 0;
      font-size: 1rem;
    }

    @media (max-width: 768px) {
      .problem-list-container {
        padding: 1rem 0.5rem;
      }

      .header-section {
        flex-direction: column;
        gap: 1rem;
        align-items: stretch;
      }

      .filters-section {
        flex-direction: column;
      }

      .filters-section mat-form-field {
        min-width: auto;
      }

      .header-section h2 {
        font-size: 2rem;
        text-align: center;
      }
    }

    /* Dark theme support */
    :host-context(.dark-theme) .table-container {
      background: #1e1e1e;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
    }

    :host-context(.dark-theme) .difficulty-easy {
      background-color: rgba(76, 175, 80, 0.2);
      color: #81c784;
    }

    :host-context(.dark-theme) .difficulty-medium {
      background-color: rgba(255, 152, 0, 0.2);
      color: #ffb74d;
    }

    :host-context(.dark-theme) .difficulty-hard {
      background-color: rgba(244, 67, 54, 0.2);
      color: #e57373;
    }

    :host-context(.dark-theme) .status-not-attempted {
      background-color: rgba(158, 158, 158, 0.2);
      color: #bdbdbd;
    }

    :host-context(.dark-theme) .status-attempted {
      background-color: rgba(255, 193, 7, 0.2);
      color: #ffcc02;
    }

    :host-context(.dark-theme) .status-solved {
      background-color: rgba(76, 175, 80, 0.2);
      color: #81c784;
    }

    :host-context(.dark-theme) .status-reviewed {
      background-color: rgba(103, 58, 183, 0.2);
      color: #b39ddb;
    }

    :host-context(.dark-theme) .more-tags {
      color: rgba(255, 255, 255, 0.6);
    }

    :host-context(.dark-theme) .title-link {
      color: #9fa8da;
    }

    :host-context(.dark-theme) .empty-state {
      color: rgba(255, 255, 255, 0.7);
    }

    :host-context(.dark-theme) .empty-state mat-icon {
      color: rgba(255, 255, 255, 0.3);
    }

    :host-context(.dark-theme) .empty-state h3 {
      color: rgba(255, 255, 255, 0.9);
    }
  `]
})
export class ProblemListComponent implements OnInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  displayedColumns: string[] = ['id', 'title', 'difficulty', 'status', 'tags', 'attempts', 'timeSpent', 'actions'];
  dataSource = new MatTableDataSource<Problem>();
  problems: Problem[] = [];

  constructor(
    private leetcodeService: LeetcodeService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.leetcodeService.problems$.subscribe(problems => {
      this.problems = problems;
      this.dataSource.data = problems;
    });
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  filterByDifficulty(difficulty: string): void {
    if (difficulty) {
      this.dataSource.data = this.problems.filter(p => p.difficulty === difficulty);
    } else {
      this.dataSource.data = this.problems;
    }
  }

  filterByStatus(status: string): void {
    if (status) {
      this.dataSource.data = this.problems.filter(p => p.status === status);
    } else {
      this.dataSource.data = this.problems;
    }
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

  editProblem(problem: Problem): void {
    const dialogRef = this.dialog.open(ProblemFormComponent, {
      width: '600px',
      maxWidth: '90vw',
      data: problem
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.snackBar.open('Problem updated successfully!', 'Close', {
          duration: 3000
        });
      }
    });
  }

  viewNotes(problem: Problem): void {
    this.dialog.open(NotesDialogComponent, {
      width: '600px',
      maxWidth: '90vw',
      data: problem
    });
  }

  viewAllTags(problem: Problem): void {
    this.dialog.open(AllTagsDialogComponent, {
      width: '500px',
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

  async deleteProblem(problem: Problem): Promise<void> {
    if (confirm(`Are you sure you want to delete "${problem.title}"?`)) {
      try {
        await this.leetcodeService.deleteProblem(problem.id!);
        this.snackBar.open('Problem deleted successfully!', 'Close', {
          duration: 3000
        });
      } catch (error) {
        console.error('Error deleting problem:', error);
        this.snackBar.open('Error deleting problem', 'Close', {
          duration: 3000
        });
      }
    }
  }
}
