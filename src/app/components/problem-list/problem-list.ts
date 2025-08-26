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
import { ProblemDetailsDialogComponent } from '../problem-details-dialog/problem-details-dialog';
import { MatDividerModule } from '@angular/material/divider';

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
    MatSelectModule,
    MatDividerModule
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

  // Company logos mapping
  private companyLogos: { [key: string]: string } = {
    'Meta': 'https://upload.wikimedia.org/wikipedia/commons/0/05/Meta_Platforms_Inc._logo_%28cropped%29.svg',
    'Apple': 'https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg',
    'Amazon': 'https://upload.wikimedia.org/wikipedia/commons/4/4a/Amazon_icon.svg',
    'Netflix': 'https://upload.wikimedia.org/wikipedia/commons/0/0c/Netflix_2015_N_logo.svg',
    'Google': 'https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg',
    'Microsoft': 'https://upload.wikimedia.org/wikipedia/commons/4/44/Microsoft_logo.svg',
    'Tesla': 'https://upload.wikimedia.org/wikipedia/commons/b/bb/Tesla_T_symbol.svg',
    'Uber': 'https://upload.wikimedia.org/wikipedia/commons/c/cc/Uber_logo_2018.png',
    'LinkedIn': 'https://upload.wikimedia.org/wikipedia/commons/8/81/LinkedIn_icon.svg',
    'Spotify': 'https://upload.wikimedia.org/wikipedia/commons/1/19/Spotify_logo_without_text.svg',
    'Airbnb': 'https://upload.wikimedia.org/wikipedia/commons/6/69/Airbnb_Logo_Bélo.svg',
    'Twitter': 'https://upload.wikimedia.org/wikipedia/commons/6/6f/Logo_of_Twitter.svg'
  };

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
      if (result?.success) {
        this.snackBar.open(result.message || 'Problem imported successfully!', 'Close', {
          duration: 3000
        });
      }
    });
  }

  viewProblemDetails(problem: Problem): void {
    // Generate titleSlug from the problem title or use a default
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

  private generateTitleSlug(title: string): string {
    return title.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters except spaces and hyphens
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
      .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
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

  getCompanyLogo(companyName: string): string {
    return this.companyLogos[companyName] || '';
  }

  onCompanyImageError(event: any, companyName: string): void {
    // Create a fallback with company initial
    const img = event.target;
    img.style.display = 'none';

    const parent = img.parentElement;
    if (parent && !parent.querySelector('.company-fallback')) {
      const fallback = document.createElement('div');
      fallback.className = 'company-fallback';
      fallback.style.cssText = `
        width: 24px;
        height: 24px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 600;
        font-size: 10px;
        border-radius: 4px;
        text-transform: uppercase;
      `;
      fallback.textContent = companyName.charAt(0).toUpperCase();
      fallback.title = companyName;
      parent.appendChild(fallback);
    }
  }
}
