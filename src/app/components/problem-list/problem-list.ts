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
import { CompaniesDialogComponent } from '../companies-dialog/companies-dialog';
import { SearchDialogComponent } from '../search-dialog/search-dialog';

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
  templateUrl: './problem-list.html',
  styleUrls: ['./problem-list.scss']
})
export class ProblemListComponent implements OnInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  displayedColumns: string[] = ['id', 'title', 'difficulty', 'status', 'tags', 'companies', 'attempts', 'timeSpent', 'actions'];
  dataSource = new MatTableDataSource<Problem>();
  problems: Problem[] = [];
  availableCompanies: string[] = [];

  constructor(
    private leetcodeService: LeetcodeService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.leetcodeService.problems$.subscribe(problems => {
      this.problems = problems;
      this.dataSource.data = problems;
      this.updateAvailableCompanies();
    });
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  private updateAvailableCompanies(): void {
    const companiesSet = new Set<string>();
    this.problems.forEach(problem => {
      if (problem.companies && problem.companies.length > 0) {
        problem.companies.forEach(company => companiesSet.add(company));
      }
    });
    this.availableCompanies = Array.from(companiesSet).sort();
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

  filterByCompany(company: string): void {
    if (company) {
      this.dataSource.data = this.problems.filter(p =>
        p.companies && p.companies.includes(company)
      );
    } else {
      this.dataSource.data = this.problems;
    }
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
      if (result?.action === 'edit') {
        // Open edit dialog for the selected problem
        this.openEditDialog(result.problem);
      }
    });
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

  viewCompanies(problem: Problem): void {
    const dialogRef = this.dialog.open(CompaniesDialogComponent, {
      width: '700px',
      maxWidth: '90vw',
      data: problem
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result !== undefined) {
        this.leetcodeService.updateProblem(problem.id!, { companies: result });
        this.snackBar.open('Companies updated successfully!', 'Close', {
          duration: 3000
        });
      }
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

  openImportDialog(): void {
    // TODO: Implement import functionality
    this.snackBar.open('Import feature coming soon!', 'Close', {
      duration: 3000
    });
  }

  private openEditDialog(problem: Problem): void {
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
}
