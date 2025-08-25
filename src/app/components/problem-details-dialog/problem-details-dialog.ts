import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { LeetCodeApiService, LeetCodeProblem } from '../../services/leetcode-api';

@Component({
  selector: 'app-problem-details-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    MatTabsModule
  ],
  template: `
    <div class="problem-details-dialog">
      <h2 mat-dialog-title>
        <mat-icon>info</mat-icon>
        Problem Details
      </h2>

      <mat-dialog-content>
        <div class="loading-state" *ngIf="loading">
          <mat-spinner diameter="40"></mat-spinner>
          <p>Loading problem details...</p>
        </div>

        <div class="error-state" *ngIf="error && !loading">
          <mat-icon>error_outline</mat-icon>
          <h3>Failed to Load Problem</h3>
          <p>{{ error }}</p>
          <button mat-raised-button color="primary" (click)="loadProblemDetails()">
            <mat-icon>refresh</mat-icon>
            Try Again
          </button>
        </div>

        <div class="problem-content" *ngIf="problemDetails && !loading">
          <!-- Problem Header -->
          <div class="problem-header">
            <div class="problem-title-section">
              <div class="problem-id-title">
                <span class="problem-id">#{{ problemDetails.id }}</span>
                <h3 class="problem-title">{{ problemDetails.title }}</h3>
              </div>
              <div class="problem-badges">
                <span class="difficulty-badge" [ngClass]="'difficulty-' + problemDetails.difficulty.toLowerCase()">
                  {{ problemDetails.difficulty }}
                </span>
                <div class="premium-badge" *ngIf="problemDetails.isPaidOnly">
                  <mat-icon>star</mat-icon>
                  <span>Premium</span>
                </div>
              </div>
            </div>
            <div class="problem-url">
              <a [href]="'https://leetcode.com/problems/' + problemDetails.titleSlug" target="_blank" rel="noopener">
                <mat-icon>open_in_new</mat-icon>
                Open on LeetCode
              </a>
            </div>
          </div>

          <mat-tab-group>
            <!-- Problem Description Tab -->
            <mat-tab label="Description">
              <div class="tab-content">
                <div class="problem-description" *ngIf="problemDetails.content">
                  <div [innerHTML]="sanitizedContent"></div>
                </div>
                <div class="no-content" *ngIf="!problemDetails.content">
                  <mat-icon>description</mat-icon>
                  <p>Problem description is not available through the API.</p>
                  <p>Please visit the LeetCode website to view the full problem description.</p>
                </div>
              </div>
            </mat-tab>

            <!-- Tags & Topics Tab -->
            <mat-tab label="Tags & Topics">
              <div class="tab-content">
                <div class="tags-section" *ngIf="problemDetails.tags && problemDetails.tags.length > 0">
                  <h4>Topics</h4>
                  <div class="tags-list">
                    <mat-chip *ngFor="let tag of problemDetails.tags" class="topic-chip">
                      {{ tag }}
                    </mat-chip>
                  </div>
                </div>

                <div class="companies-section" *ngIf="problemDetails.companies && problemDetails.companies.length > 0">
                  <h4>Companies</h4>
                  <div class="companies-list">
                    <mat-chip *ngFor="let company of problemDetails.companies" class="company-chip">
                      {{ company }}
                    </mat-chip>
                  </div>
                </div>

                <div class="no-tags" *ngIf="(!problemDetails.tags || problemDetails.tags.length === 0) && (!problemDetails.companies || problemDetails.companies.length === 0)">
                  <mat-icon>local_offer</mat-icon>
                  <p>No tags or company information available.</p>
                </div>
              </div>
            </mat-tab>

            <!-- Hints Tab -->
            <mat-tab label="Hints" *ngIf="problemDetails.hints && problemDetails.hints.length > 0">
              <div class="tab-content">
                <div class="hints-section">
                  <div class="hint-item" *ngFor="let hint of problemDetails.hints; let i = index">
                    <div class="hint-header">
                      <mat-icon>lightbulb_outline</mat-icon>
                      <span class="hint-number">Hint {{ i + 1 }}</span>
                    </div>
                    <p class="hint-text">{{ hint }}</p>
                  </div>
                </div>
              </div>
            </mat-tab>

            <!-- Statistics Tab -->
            <mat-tab label="Statistics" *ngIf="problemDetails.stats">
              <div class="tab-content">
                <div class="stats-section">
                  <div class="stat-item">
                    <mat-icon>check_circle</mat-icon>
                    <div class="stat-content">
                      <span class="stat-label">Acceptance Rate</span>
                      <span class="stat-value">{{ problemDetails.stats.acRate }}</span>
                    </div>
                  </div>
                  <div class="stat-item">
                    <mat-icon>people</mat-icon>
                    <div class="stat-content">
                      <span class="stat-label">Total Accepted</span>
                      <span class="stat-value">{{ problemDetails.stats.totalAccepted }}</span>
                    </div>
                  </div>
                  <div class="stat-item">
                    <mat-icon>assignment</mat-icon>
                    <div class="stat-content">
                      <span class="stat-label">Total Submissions</span>
                      <span class="stat-value">{{ problemDetails.stats.totalSubmission }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </mat-tab>

            <!-- Similar Problems Tab -->
            <mat-tab label="Similar Problems" *ngIf="problemDetails.similar && problemDetails.similar.length > 0">
              <div class="tab-content">
                <div class="similar-problems">
                  <div class="similar-problem" *ngFor="let similar of problemDetails.similar">
                    <h5>{{ similar.title }}</h5>
                    <span class="difficulty-badge" [ngClass]="'difficulty-' + similar.difficulty.toLowerCase()">
                      {{ similar.difficulty }}
                    </span>
                    <a [href]="'https://leetcode.com/problems/' + similar.titleSlug" target="_blank" rel="noopener">
                      <mat-icon>open_in_new</mat-icon>
                    </a>
                  </div>
                </div>
              </div>
            </mat-tab>
          </mat-tab-group>
        </div>
      </mat-dialog-content>

      <mat-dialog-actions align="end">
        <button mat-button mat-dialog-close>Close</button>
      </mat-dialog-actions>
    </div>
  `,
  styleUrls: ['./problem-details-dialog.scss']
})
export class ProblemDetailsDialogComponent implements OnInit {
  problemDetails: LeetCodeProblem | null = null;
  loading = false;
  error: string | null = null;
  sanitizedContent: SafeHtml = '';

  constructor(
    public dialogRef: MatDialogRef<ProblemDetailsDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { problemId: number; titleSlug: string },
    private leetcodeApi: LeetCodeApiService,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    this.loadProblemDetails();
  }

  loadProblemDetails(): void {
    this.loading = true;
    this.error = null;

    const identifier = this.data.titleSlug || this.data.problemId;

    this.leetcodeApi.getProblem(identifier).subscribe({
      next: (problem) => {
        this.problemDetails = problem;
        if (problem.content) {
          this.sanitizedContent = this.sanitizer.bypassSecurityTrustHtml(problem.content);
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading problem details:', error);
        this.error = error.message || 'Failed to load problem details';
        this.loading = false;
      }
    });
  }
}
