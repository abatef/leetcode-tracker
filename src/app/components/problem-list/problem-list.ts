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
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AllTagsDialogComponent } from '../tags-dialog/tags-dialog';

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
    MatSnackBarModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatTooltipModule,
    FormsModule
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

      <!-- Enhanced Filters Section -->
      <mat-card class="filters-card">
        <mat-card-content>
          <div class="filters-container">
            <div class="filter-row">
              <mat-form-field appearance="outline" class="filter-field">
                <mat-label>Search Problems</mat-label>
                <input matInput
                       [(ngModel)]="searchQuery"
                       (ngModelChange)="applyFilters()"
                       placeholder="Search by title or ID...">
                <mat-icon matSuffix>search</mat-icon>
              </mat-form-field>

              <mat-form-field appearance="outline" class="filter-field">
                <mat-label>Difficulty</mat-label>
                <mat-select [(ngModel)]="selectedDifficulty" (selectionChange)="applyFilters()" multiple>
                  <mat-option value="Easy">Easy</mat-option>
                  <mat-option value="Medium">Medium</mat-option>
                  <mat-option value="Hard">Hard</mat-option>
                </mat-select>
              </mat-form-field>

              <mat-form-field appearance="outline" class="filter-field">
                <mat-label>Status</mat-label>
                <mat-select [(ngModel)]="selectedStatus" (selectionChange)="applyFilters()" multiple>
                  <mat-option value="Not Attempted">Not Attempted</mat-option>
                  <mat-option value="Attempted">Attempted</mat-option>
                  <mat-option value="Solved">Solved</mat-option>
                  <mat-option value="Reviewed">Reviewed</mat-option>
                </mat-select>
              </mat-form-field>

              <mat-form-field appearance="outline" class="filter-field">
                <mat-label>Tags</mat-label>
                <mat-select [(ngModel)]="selectedTags" (selectionChange)="applyFilters()" multiple>
                  <mat-option *ngFor="let tag of allTags" [value]="tag">{{ tag }}</mat-option>
                </mat-select>
              </mat-form-field>

              <button mat-icon-button
                      (click)="clearFilters()"
                      title="Clear all filters"
                      class="clear-filters-btn">
                <mat-icon>clear</mat-icon>
              </button>
            </div>

            <div class="active-filters" *ngIf="hasActiveFilters()">
              <span class="filter-label">Active filters:</span>
              <mat-chip *ngIf="searchQuery" (removed)="clearSearch()" class="filter-chip">
                Search: "{{ searchQuery }}"
                <mat-icon matChipRemove>cancel</mat-icon>
              </mat-chip>
              <mat-chip *ngFor="let difficulty of selectedDifficulty"
                        (removed)="removeFilter('difficulty', difficulty)"
                        class="filter-chip">
                {{ difficulty }}
                <mat-icon matChipRemove>cancel</mat-icon>
              </mat-chip>
              <mat-chip *ngFor="let status of selectedStatus"
                        (removed)="removeFilter('status', status)"
                        class="filter-chip">
                {{ status }}
                <mat-icon matChipRemove>cancel</mat-icon>
              </mat-chip>
              <mat-chip *ngFor="let tag of selectedTags"
                        (removed)="removeFilter('tag', tag)"
                        class="filter-chip">
                {{ tag }}
                <mat-icon matChipRemove>cancel</mat-icon>
              </mat-chip>
            </div>
          </div>
        </mat-card-content>
      </mat-card>

      <mat-card class="problems-card">
        <mat-card-content>
          <div class="table-header">
            <span class="results-count">
              {{ filteredProblems.length }} of {{ totalProblems }} problems
            </span>
          </div>

          <div class="table-scroll-container">
            <mat-table [dataSource]="filteredProblems" class="problems-table">
              <ng-container matColumnDef="leetcodeId">
                <mat-header-cell *matHeaderCellDef class="id-column">#</mat-header-cell>
                <mat-cell *matCellDef="let problem" class="id-column">{{ problem.leetcodeId }}</mat-cell>
              </ng-container>

              <ng-container matColumnDef="title">
                <mat-header-cell *matHeaderCellDef class="title-column">Title</mat-header-cell>
                <mat-cell *matCellDef="let problem" class="title-column">
                  <div class="problem-title">
                    <a [href]="problem.url" target="_blank" class="title-link">
                      {{ problem.title }}
                      <mat-icon class="external-link">open_in_new</mat-icon>
                    </a>
                  </div>
                </mat-cell>
              </ng-container>

              <ng-container matColumnDef="difficulty">
                <mat-header-cell *matHeaderCellDef class="difficulty-column">Difficulty</mat-header-cell>
                <mat-cell *matCellDef="let problem" class="difficulty-column">
                  <mat-chip [class]="'difficulty-' + problem.difficulty.toLowerCase()">
                    {{ problem.difficulty }}
                  </mat-chip>
                </mat-cell>
              </ng-container>

              <ng-container matColumnDef="status">
                <mat-header-cell *matHeaderCellDef class="status-column">Status</mat-header-cell>
                <mat-cell *matCellDef="let problem" class="status-column">
                  <mat-chip [class]="'status-' + problem.status.toLowerCase().replace(' ', '-')">
                    {{ problem.status }}
                  </mat-chip>
                </mat-cell>
              </ng-container>

              <ng-container matColumnDef="tags">
                <mat-header-cell *matHeaderCellDef class="tags-column">Tags</mat-header-cell>
                <mat-cell *matCellDef="let problem" class="tags-column">
                  <div class="tags-container">
                    <mat-chip *ngFor="let tag of problem.tags.slice(0, 2)" class="tag-chip">
                      {{ tag }}
                    </mat-chip>
                    <button mat-button
                            *ngIf="problem.tags.length > 2"
                            class="more-tags-btn"
                            (click)="showAllTags(problem)"
                            [matTooltip]="getTooltipTags(problem)">
                      +{{ problem.tags.length - 2 }} more
                    </button>
                  </div>
                </mat-cell>
              </ng-container>

              <ng-container matColumnDef="attempts">
                <mat-header-cell *matHeaderCellDef class="attempts-column">Attempts</mat-header-cell>
                <mat-cell *matCellDef="let problem" class="attempts-column">{{ problem.attempts }}</mat-cell>
              </ng-container>

              <ng-container matColumnDef="notes">
                <mat-header-cell *matHeaderCellDef class="notes-column">Notes</mat-header-cell>
                <mat-cell *matCellDef="let problem" class="notes-column">
                  <button mat-icon-button
                          (click)="viewNotes(problem)"
                          [disabled]="!problem.notes"
                          [title]="problem.notes ? 'View notes' : 'No notes'">
                    <mat-icon [class.has-notes]="problem.notes">description</mat-icon>
                  </button>
                </mat-cell>
              </ng-container>

              <ng-container matColumnDef="actions">
                <mat-header-cell *matHeaderCellDef class="actions-column">Actions</mat-header-cell>
                <mat-cell *matCellDef="let problem" class="actions-column">
                  <button mat-icon-button
                          [matMenuTriggerFor]="actionMenu"
                          class="action-menu-button">
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
          </div>

          <div class="empty-state" *ngIf="filteredProblems.length === 0 && totalProblems === 0">
            <mat-icon>assignment</mat-icon>
            <h3>No problems yet</h3>
            <p>Start tracking your LeetCode journey by adding your first problem!</p>
            <button mat-raised-button color="primary" (click)="openAddProblemDialog()">
              <mat-icon>add</mat-icon>
              Add Your First Problem
            </button>
          </div>

          <div class="no-results-state" *ngIf="filteredProblems.length === 0 && totalProblems > 0">
            <mat-icon>search_off</mat-icon>
            <h3>No problems found</h3>
            <p>Try adjusting your filters or search criteria.</p>
            <button mat-button (click)="clearFilters()">
              <mat-icon>clear</mat-icon>
              Clear Filters
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
      min-width: 1100px; // Ensure minimum width for all columns
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

    // Filters Section
    .filters-card {
      margin-bottom: 1.5rem;
      border-radius: 12px !important;
      box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06) !important;
      border: 1px solid rgba(0, 0, 0, 0.05);
    }

    .filters-container {
      padding: 0.5rem 0;
    }

    .filter-row {
      display: flex;
      gap: 1rem;
      align-items: center;
      flex-wrap: wrap;
    }

    .filter-field {
      min-width: 200px;
      flex: 1;
    }

    .clear-filters-btn {
      width: 48px;
      height: 48px;
      flex-shrink: 0;
    }

    .active-filters {
      margin-top: 1rem;
      padding-top: 1rem;
      border-top: 1px solid rgba(0, 0, 0, 0.1);
      display: flex;
      align-items: center;
      gap: 0.5rem;
      flex-wrap: wrap;
    }

    .filter-label {
      font-size: 0.9rem;
      color: rgba(0, 0, 0, 0.6);
      font-weight: 500;
    }

    .filter-chip {
      background: rgba(103, 80, 164, 0.1) !important;
      color: #5b21b6 !important;
      font-size: 0.8rem !important;
      height: 24px !important;
    }

    .table-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
      padding: 0 0.5rem;
    }

    .results-count {
      font-size: 0.9rem;
      color: rgba(0, 0, 0, 0.6);
      font-weight: 500;
    }

    // Enhanced Column Widths
    .mat-mdc-header-cell, .mat-mdc-cell {
      &.id-column {
        flex: 0 0 80px !important;
        width: 80px !important;
        min-width: 80px !important;
        max-width: 80px !important;
      }

      &.title-column {
        flex: 0 0 300px !important;
        width: 300px !important;
        min-width: 250px !important;
        max-width: 350px !important;
      }

      &.difficulty-column {
        flex: 0 0 120px !important;
        width: 120px !important;
        min-width: 120px !important;
        max-width: 120px !important;
      }

      &.status-column {
        flex: 0 0 140px !important;
        width: 140px !important;
        min-width: 140px !important;
        max-width: 140px !important;
      }

      &.tags-column {
        flex: 0 0 250px !important;
        width: 250px !important;
        min-width: 220px !important;
        max-width: 280px !important;
      }

      &.attempts-column {
        flex: 0 0 100px !important;
        width: 100px !important;
        min-width: 100px !important;
        max-width: 100px !important;
      }

      &.notes-column {
        flex: 0 0 80px !important;
        width: 80px !important;
        min-width: 80px !important;
        max-width: 80px !important;
      }

      &.actions-column {
        flex: 0 0 60px !important;
        width: 60px !important;
        min-width: 60px !important;
        max-width: 60px !important;
        text-align: center !important;
        justify-content: center !important;
      }
    }

    // Enhanced Tags Display
    .tags-container {
      display: flex;
      align-items: center;
      gap: 6px;
      flex-wrap: wrap;
    }

    .more-tags-btn {
      font-size: 11px !important;
      height: 24px !important;
      min-height: 24px !important;
      padding: 0 8px !important;
      background: rgba(103, 80, 164, 0.05) !important;
      color: #5b21b6 !important;
      border: 1px solid rgba(103, 80, 164, 0.2) !important;
      border-radius: 12px !important;
      font-weight: 500 !important;
      transition: all 0.2s ease !important;
    }

    .more-tags-btn:hover {
      background: rgba(103, 80, 164, 0.1) !important;
      transform: translateY(-1px);
    }

    // No Results State
    .no-results-state {
      text-align: center;
      padding: 48px 32px;
      color: #6b7280;
    }

    .no-results-state mat-icon {
      font-size: 48px !important;
      width: 48px !important;
      height: 48px !important;
      margin-bottom: 16px;
      color: #d1d5db;
    }

    .no-results-state h3 {
      font-size: 18px;
      font-weight: 500;
      margin: 0 0 8px 0;
      color: #374151;
    }

    .no-results-state p {
      font-size: 14px;
      margin: 0 0 24px 0;
      color: #6b7280;
      line-height: 1.5;
    }

    // Dark theme enhancements
    :host-context(.dark-theme) {
      .filters-card {
        border: 1px solid rgba(255, 255, 255, 0.1);
        box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.3), 0 1px 2px 0 rgba(0, 0, 0, 0.2) !important;
      }

      .active-filters {
        border-top-color: rgba(255, 255, 255, 0.1);
      }

      .filter-label {
        color: rgba(255, 255, 255, 0.6);
      }

      .results-count {
        color: rgba(255, 255, 255, 0.6);
      }

      .filter-chip {
        background: rgba(255, 255, 255, 0.1) !important;
        color: #c4b5fd !important;
      }

      .more-tags-btn {
        background: rgba(255, 255, 255, 0.05) !important;
        color: #c4b5fd !important;
        border: 1px solid rgba(255, 255, 255, 0.2) !important;
      }

      .more-tags-btn:hover {
        background: rgba(255, 255, 255, 0.1) !important;
      }

      .no-results-state h3 {
        color: rgba(255, 255, 255, 0.9) !important;
      }

      .no-results-state mat-icon {
        color: rgba(255, 255, 255, 0.3) !important;
      }
    }

    // Responsive Design
    @media (max-width: 1200px) {
      .filter-row {
        flex-direction: column;
        align-items: stretch;
      }

      .filter-field {
        min-width: unset;
      }

      .problems-card {
        overflow-x: auto;
      }

      .problems-table {
        min-width: 1000px;
      }
    }

    @media (max-width: 768px) {
      .problems-table {
        min-width: 800px;
      }

      .mat-mdc-header-cell, .mat-mdc-cell {
        &.title-column {
          flex: 0 0 200px !important;
          width: 200px !important;
          min-width: 180px !important;
        }

        &.tags-column {
          flex: 0 0 180px !important;
          width: 180px !important;
          min-width: 160px !important;
        }
      }
    }

    .table-scroll-container {
      overflow-x: auto;
      overflow-y: visible;

      // Custom scrollbar for table
      scrollbar-width: thin;
      scrollbar-color: rgba(103, 80, 164, 0.3) rgba(0, 0, 0, 0.05);
    }

    .table-scroll-container::-webkit-scrollbar {
      height: 8px;
    }

    .table-scroll-container::-webkit-scrollbar-track {
      background: rgba(0, 0, 0, 0.03);
      border-radius: 4px;
    }

    .table-scroll-container::-webkit-scrollbar-thumb {
      background: rgba(103, 80, 164, 0.3);
      border-radius: 4px;
      transition: background-color 0.2s ease;
    }

    .table-scroll-container::-webkit-scrollbar-thumb:hover {
      background: rgba(103, 80, 164, 0.5);
    }

    // Dark theme table scroll
    :host-context(.dark-theme) .table-scroll-container {
      scrollbar-color: rgba(255, 255, 255, 0.2) rgba(255, 255, 255, 0.05);
    }

    :host-context(.dark-theme) .table-scroll-container::-webkit-scrollbar-track {
      background: rgba(255, 255, 255, 0.03);
    }

    :host-context(.dark-theme) .table-scroll-container::-webkit-scrollbar-thumb {
      background: rgba(255, 255, 255, 0.2);
    }

    :host-context(.dark-theme) .table-scroll-container::-webkit-scrollbar-thumb:hover {
      background: rgba(255, 255, 255, 0.3);
    }
  `]
})
export class ProblemListComponent implements OnInit {
  problems$: Observable<Problem[]>;
  displayedColumns: string[] = ['leetcodeId', 'title', 'difficulty', 'status', 'tags', 'attempts', 'notes', 'actions'];

  // Filter properties
  searchQuery: string = '';
  selectedDifficulty: string[] = [];
  selectedStatus: string[] = [];
  selectedTags: string[] = [];
  allTags: string[] = [];
  filteredProblems: Problem[] = [];
  totalProblems: number = 0;
  allProblems: Problem[] = [];

  constructor(
    private leetcodeService: LeetcodeService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {
    this.problems$ = this.leetcodeService.problems$;
  }

  ngOnInit(): void {
    this.problems$.subscribe(problems => {
      this.allProblems = problems;
      this.totalProblems = problems.length;
      this.extractAllTags(problems);
      this.applyFilters();
    });
  }

  private extractAllTags(problems: Problem[]): void {
    const tagSet = new Set<string>();
    problems.forEach(problem => {
      problem.tags.forEach(tag => tagSet.add(tag));
    });
    this.allTags = Array.from(tagSet).sort();
  }

  applyFilters(): void {
    let filtered = [...this.allProblems];

    // Search filter
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase().trim();
      filtered = filtered.filter(problem =>
        problem.title.toLowerCase().includes(query) ||
        problem.leetcodeId.toString().includes(query)
      );
    }

    // Difficulty filter
    if (this.selectedDifficulty.length > 0) {
      filtered = filtered.filter(problem =>
        this.selectedDifficulty.includes(problem.difficulty)
      );
    }

    // Status filter
    if (this.selectedStatus.length > 0) {
      filtered = filtered.filter(problem =>
        this.selectedStatus.includes(problem.status)
      );
    }

    // Tags filter
    if (this.selectedTags.length > 0) {
      filtered = filtered.filter(problem =>
        this.selectedTags.some(tag => problem.tags.includes(tag))
      );
    }

    this.filteredProblems = filtered;
  }

  clearFilters(): void {
    this.searchQuery = '';
    this.selectedDifficulty = [];
    this.selectedStatus = [];
    this.selectedTags = [];
    this.applyFilters();
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.applyFilters();
  }

  removeFilter(type: string, value: string): void {
    switch (type) {
      case 'difficulty':
        this.selectedDifficulty = this.selectedDifficulty.filter(d => d !== value);
        break;
      case 'status':
        this.selectedStatus = this.selectedStatus.filter(s => s !== value);
        break;
      case 'tag':
        this.selectedTags = this.selectedTags.filter(t => t !== value);
        break;
    }
    this.applyFilters();
  }

  hasActiveFilters(): boolean {
    return this.searchQuery.trim() !== '' ||
           this.selectedDifficulty.length > 0 ||
           this.selectedStatus.length > 0 ||
           this.selectedTags.length > 0;
  }

  showAllTags(problem: Problem): void {
    this.dialog.open(AllTagsDialogComponent, {
      width: '500px',
      data: { tags: problem.tags, title: problem.title }
    });
  }

  getTooltipTags(problem: Problem): string {
    return problem.tags.slice(2).join(', ');
  }

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
