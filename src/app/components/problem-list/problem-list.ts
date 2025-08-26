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
import { QuickEditDialogComponent } from '../quick-edit-dialog/quick-edit-dialog';
import { MatTooltipModule } from '@angular/material/tooltip';

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
    MatDividerModule,
    MatTooltipModule
  ],
  templateUrl: './problem-list.html',
  styleUrls: ['./problem-list.scss']
})
export class ProblemListComponent implements OnInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  // Column definitions with visibility control and default widths
  columnDefinitions = [
    { key: 'id', label: 'ID', visible: true, clickable: false, width: 80, minWidth: 60, maxWidth: 120 },
    { key: 'title', label: 'Title', visible: true, clickable: false, width: 250, minWidth: 150, maxWidth: 400 }, // Increased from 200
    { key: 'difficulty', label: 'Difficulty', visible: true, clickable: true, width: 120, minWidth: 100, maxWidth: 150 },
    { key: 'status', label: 'Status', visible: true, clickable: true, width: 130, minWidth: 100, maxWidth: 150 }, // Increased from 120
    { key: 'tags', label: 'Tags', visible: true, clickable: true, width: 220, minWidth: 120, maxWidth: 300 }, // Increased from 180
    { key: 'companies', label: 'Companies', visible: true, clickable: true, width: 180, minWidth: 100, maxWidth: 200 }, // Increased from 150
    { key: 'attempts', label: 'Attempts', visible: true, clickable: true, width: 100, minWidth: 80, maxWidth: 120 },
    { key: 'timeSpent', label: 'Time (min)', visible: true, clickable: true, width: 120, minWidth: 100, maxWidth: 150 },
    { key: 'dateAdded', label: 'Date Added', visible: true, clickable: false, width: 130, minWidth: 100, maxWidth: 150 }, // Increased from 120
    { key: 'notes', label: 'Notes', visible: true, clickable: false, width: 80, minWidth: 60, maxWidth: 100 },
    { key: 'actions', label: 'Actions', visible: true, clickable: false, width: 80, minWidth: 60, maxWidth: 100 }
  ];

  // Track resizing state
  isResizing = false;
  resizingColumn: string | null = null;
  startX = 0;
  startWidth = 0;

  get displayedColumns(): string[] {
    return this.columnDefinitions
      .filter(col => col.visible)
      .map(col => col.key);
  }

  get visibleColumns() {
    return this.columnDefinitions.filter(col => col.visible);
  }

  get hiddenColumns() {
    return this.columnDefinitions.filter(col => !col.visible);
  }

  dataSource = new MatTableDataSource<Problem>();
  problems: Problem[] = [];
  availableCompanies: string[] = [];
  showColumnOptions = false;

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
    this.loadColumnPreferences();
    this.leetcodeService.problems$.subscribe(problems => {
      this.problems = problems;
      this.dataSource.data = problems;
      this.updateAvailableCompanies();
    });
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
    this.setupResizeListeners();
    this.loadColumnWidths();
    // Apply column widths after a delay to ensure DOM is ready
    setTimeout(() => this.applyColumnWidths(), 200);
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

  // Update viewNotes method to handle the result
  viewNotes(problem: Problem): void {
    const dialogRef = this.dialog.open(NotesDialogComponent, {
      width: '600px',
      maxWidth: '90vw',
      data: problem
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result !== undefined) {
        // Update the local problem data with the new notes
        const updatedProblem = this.problems.find(p => p.id === problem.id);
        if (updatedProblem) {
          updatedProblem.notes = result;
        }
      }
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

  // Column visibility methods
  toggleColumn(columnKey: string): void {
    const column = this.columnDefinitions.find(col => col.key === columnKey);
    if (column) {
      column.visible = !column.visible;
      // Save to localStorage
      this.saveColumnPreferences();
    }
  }

  showColumn(columnKey: string): void {
    const column = this.columnDefinitions.find(col => col.key === columnKey);
    if (column) {
      column.visible = true;
      this.saveColumnPreferences();
    }
  }

  hideColumn(columnKey: string): void {
    const column = this.columnDefinitions.find(col => col.key === columnKey);
    if (column) {
      column.visible = false;
      this.saveColumnPreferences();
    }
  }

  // Column resizing methods
  private setupResizeListeners(): void {
    document.addEventListener('mousemove', this.onMouseMove.bind(this));
    document.addEventListener('mouseup', this.onMouseUp.bind(this));
  }

  onResizeStart(event: MouseEvent, columnKey: string): void {
    event.preventDefault();
    event.stopPropagation();

    this.isResizing = true;
    this.resizingColumn = columnKey;
    this.startX = event.clientX;

    const column = this.columnDefinitions.find(col => col.key === columnKey);
    this.startWidth = column ? column.width : 100;

    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    document.body.classList.add('resizing');
  }

  private onMouseMove(event: MouseEvent): void {
    if (!this.isResizing || !this.resizingColumn) return;

    const diff = event.clientX - this.startX;
    const newWidth = Math.max(this.startWidth + diff, 60); // Minimum width of 60px

    const column = this.columnDefinitions.find(col => col.key === this.resizingColumn);
    if (column) {
      const maxWidth = column.maxWidth || 500;
      column.width = Math.min(newWidth, maxWidth);
      this.applyColumnWidths();
    }
  }

  private onMouseUp(): void {
    if (this.isResizing) {
      this.isResizing = false;
      this.resizingColumn = null;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      document.body.classList.remove('resizing');
      this.saveColumnWidths();
    }
  }

  private applyColumnWidths(): void {
    // Use requestAnimationFrame to ensure DOM updates
    requestAnimationFrame(() => {
      this.columnDefinitions.forEach(col => {
        if (col.visible) {
          const headerCells = document.querySelectorAll(`.mat-column-${col.key}.mat-mdc-header-cell`);
          const cells = document.querySelectorAll(`.mat-column-${col.key}.mat-mdc-cell`);

          [...headerCells, ...cells].forEach(el => {
            const element = el as HTMLElement;
            element.style.width = `${col.width}px`;
            element.style.minWidth = `${col.width}px`; // Set min-width to same as width
            element.style.maxWidth = `${col.maxWidth || 500}px`;
            // Remove flex property to let table use natural sizing
          });
        }
      });
    });
  }

  private saveColumnWidths(): void {
    const widths = this.columnDefinitions.reduce((acc, col) => {
      acc[col.key] = col.width;
      return acc;
    }, {} as Record<string, number>);
    localStorage.setItem('leetcode-tracker-column-widths', JSON.stringify(widths));
  }

  private loadColumnWidths(): void {
    const saved = localStorage.getItem('leetcode-tracker-column-widths');
    if (saved) {
      try {
        const widths = JSON.parse(saved);
        this.columnDefinitions.forEach(col => {
          if (widths.hasOwnProperty(col.key)) {
            col.width = widths[col.key];
          }
        });
      } catch (error) {
        console.error('Error loading column widths:', error);
      }
    }
  }

  resetColumns(): void {
    // Reset both visibility and widths
    this.columnDefinitions.forEach(col => {
      col.visible = true;
      // Reset to default widths (updated values)
      switch (col.key) {
        case 'id': col.width = 80; break;
        case 'title': col.width = 250; break; // Updated
        case 'difficulty': col.width = 120; break;
        case 'status': col.width = 130; break; // Updated
        case 'tags': col.width = 220; break; // Updated
        case 'companies': col.width = 180; break; // Updated
        case 'attempts': col.width = 100; break;
        case 'timeSpent': col.width = 120; break;
        case 'dateAdded': col.width = 130; break; // Updated
        case 'notes': col.width = 80; break;
        case 'actions': col.width = 80; break;
      }
    });
    this.saveColumnPreferences();
    this.saveColumnWidths();
    this.applyColumnWidths();
  }

  private saveColumnPreferences(): void {
    const preferences = this.columnDefinitions.reduce((acc, col) => {
      acc[col.key] = col.visible;
      return acc;
    }, {} as Record<string, boolean>);
    localStorage.setItem('leetcode-tracker-columns', JSON.stringify(preferences));
  }

  private loadColumnPreferences(): void {
    const saved = localStorage.getItem('leetcode-tracker-columns');
    if (saved) {
      try {
        const preferences = JSON.parse(saved);
        this.columnDefinitions.forEach(col => {
          if (preferences.hasOwnProperty(col.key)) {
            col.visible = preferences[col.key];
          }
        });
      } catch (error) {
        console.error('Error loading column preferences:', error);
      }
    }
  }

  // Column click handlers
  onColumnClick(column: string, problem: Problem, event: Event): void {
    // Prevent click if it's on a link or button
    const target = event.target as HTMLElement;
    if (target.tagName === 'A' || target.closest('button') || target.closest('mat-chip')) {
      return;
    }

    const columnDef = this.columnDefinitions.find(col => col.key === column);
    if (!columnDef || !columnDef.clickable) {
      return;
    }

    switch (column) {
      case 'difficulty':
        this.editDifficulty(problem);
        break;
      case 'status':
        this.editStatus(problem);
        break;
      case 'tags':
        this.editTags(problem);
        break;
      case 'companies':
        this.editCompanies(problem);
        break;
      case 'attempts':
        this.editAttempts(problem);
        break;
      case 'timeSpent':
        this.editTimeSpent(problem);
        break;
    }
  }

  // Quick edit dialogs
  private editDifficulty(problem: Problem): void {
    const dialogRef = this.dialog.open(QuickEditDialogComponent, {
      width: '300px',
      data: {
        title: 'Edit Difficulty',
        field: 'difficulty',
        value: problem.difficulty,
        type: 'select',
        options: ['Easy', 'Medium', 'Hard']
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result !== undefined && result !== problem.difficulty) {
        this.updateProblemField(problem, 'difficulty', result);
      }
    });
  }

  private editStatus(problem: Problem): void {
    const dialogRef = this.dialog.open(QuickEditDialogComponent, {
      width: '300px',
      data: {
        title: 'Edit Status',
        field: 'status',
        value: problem.status,
        type: 'select',
        options: ['Not Attempted', 'Attempted', 'Solved', 'Reviewed']
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result !== undefined && result !== problem.status) {
        this.updateProblemField(problem, 'status', result);
      }
    });
  }

  private editTags(problem: Problem): void {
    this.dialog.open(AllTagsDialogComponent, {
      width: '500px',
      maxWidth: '90vw',
      data: { ...problem, editable: true }
    }).afterClosed().subscribe(result => {
      if (result !== undefined) {
        this.updateProblemField(problem, 'tags', result);
      }
    });
  }

  private editCompanies(problem: Problem): void {
    this.viewCompanies(problem);
  }

  private editAttempts(problem: Problem): void {
    const dialogRef = this.dialog.open(QuickEditDialogComponent, {
      width: '300px',
      data: {
        title: 'Edit Attempts',
        field: 'attempts',
        value: problem.attempts,
        type: 'number',
        min: 0
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result !== undefined && result !== problem.attempts) {
        this.updateProblemField(problem, 'attempts', parseInt(result));
      }
    });
  }

  private editTimeSpent(problem: Problem): void {
    const dialogRef = this.dialog.open(QuickEditDialogComponent, {
      width: '300px',
      data: {
        title: 'Edit Time Spent (minutes)',
        field: 'timeSpent',
        value: problem.timeSpent,
        type: 'number',
        min: 0
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result !== undefined && result !== problem.timeSpent) {
        this.updateProblemField(problem, 'timeSpent', parseInt(result));
      }
    });
  }

  private async updateProblemField(problem: Problem, field: string, value: any): Promise<void> {
    try {
      await this.leetcodeService.updateProblem(problem.id!, { [field]: value });
      this.snackBar.open(`${field} updated successfully!`, 'Close', {
        duration: 3000,
        panelClass: 'success-snackbar'
      });
    } catch (error) {
      console.error(`Error updating ${field}:`, error);
      this.snackBar.open(`Error updating ${field}`, 'Close', {
        duration: 3000,
        panelClass: 'error-snackbar'
      });
    }
  }

  // Check if problem has notes
  hasNotes(problem: Problem): boolean {
    return !!(problem.notes && problem.notes.trim().length > 0);
  }

  // Helper method to format date
  formatDate(date: string | Date | undefined): string {
    if (!date) return '—';

    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      return dateObj.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      return '—';
    }
  }
}
