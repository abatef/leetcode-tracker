import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Problem } from '../../models/problem';

interface Company {
  name: string;
  logo: string;
}

const MAANG_COMPANIES: Company[] = [
  { name: 'Meta', logo: 'https://upload.wikimedia.org/wikipedia/commons/0/05/Meta_Platforms_Inc._logo_%28cropped%29.svg' },
  { name: 'Apple', logo: 'https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg' },
  { name: 'Amazon', logo: 'https://upload.wikimedia.org/wikipedia/commons/4/4a/Amazon_icon.svg' },
  { name: 'Netflix', logo: 'https://upload.wikimedia.org/wikipedia/commons/0/0c/Netflix_2015_N_logo.svg' },
  { name: 'Google', logo: 'https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg' },
  { name: 'Microsoft', logo: 'https://upload.wikimedia.org/wikipedia/commons/4/44/Microsoft_logo.svg' },
  { name: 'Tesla', logo: 'https://upload.wikimedia.org/wikipedia/commons/b/bb/Tesla_T_symbol.svg' },
  { name: 'Uber', logo: 'https://upload.wikimedia.org/wikipedia/commons/c/cc/Uber_logo_2018.png' },
  { name: 'LinkedIn', logo: 'https://upload.wikimedia.org/wikipedia/commons/8/81/LinkedIn_icon.svg' },
  { name: 'Spotify', logo: 'https://upload.wikimedia.org/wikipedia/commons/1/19/Spotify_logo_without_text.svg' },
  { name: 'Airbnb', logo: 'https://upload.wikimedia.org/wikipedia/commons/6/69/Airbnb_Logo_Bélo.svg' },
  { name: 'Twitter', logo: 'https://upload.wikimedia.org/wikipedia/commons/6/6f/Logo_of_Twitter.svg' }
];

@Component({
  selector: 'app-companies-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatInputModule
  ],
  template: `
    <h2 mat-dialog-title>
      <mat-icon>business</mat-icon>
      Companies
    </h2>

    <mat-dialog-content>
      <div class="problem-info">
        <h3>{{ data.title }}</h3>
        <span class="problem-id">#{{ data.leetcodeId }}</span>
      </div>

      <div class="companies-section">
        <h4>Select Companies</h4>
        <div class="companies-grid">
          <div class="company-item"
               *ngFor="let company of companies"
               [class.selected]="selectedCompanies.includes(company.name)"
               (click)="toggleCompany(company.name)">
            <div class="company-checkbox">
              <mat-checkbox
                [checked]="selectedCompanies.includes(company.name)"
                (change)="toggleCompany(company.name)"
                color="primary">
              </mat-checkbox>
            </div>
            <div class="company-logo">
              <img [src]="company.logo"
                   [alt]="company.name + ' logo'"
                   (error)="onImageError($event, company.name)">
            </div>
            <div class="company-name">{{ company.name }}</div>
          </div>
        </div>
      </div>

      <div class="selected-companies" *ngIf="selectedCompanies.length > 0">
        <h4>Selected Companies ({{ selectedCompanies.length }})</h4>
        <div class="selected-companies-list">
          <mat-chip *ngFor="let company of selectedCompanies" class="company-chip">
            {{ company }}
            <mat-icon (click)="removeCompany(company)" class="remove-company">close</mat-icon>
          </mat-chip>
        </div>
      </div>

      <div class="filter-hint" *ngIf="selectedCompanies.length > 0">
        <mat-icon>info</mat-icon>
        <span>You can filter problems by these companies in the Problems list</span>
      </div>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">Cancel</button>
      <button mat-raised-button color="primary" (click)="onSave()">
        Save Companies
      </button>
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
      min-width: 500px;
      max-width: 700px;
      max-height: 600px;
      overflow-y: auto;
    }

    .companies-section h4 {
      margin: 0 0 1rem 0;
      color: rgba(0, 0, 0, 0.87);
      font-size: 1rem;
      font-weight: 500;
    }

    .companies-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
      gap: 1rem;
      margin-bottom: 2rem;
    }

    .company-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
      padding: 1rem;
      border: 2px solid rgba(0, 0, 0, 0.1);
      border-radius: 12px;
      cursor: pointer;
      transition: all 0.2s ease;
      background: rgba(0, 0, 0, 0.02);
    }

    .company-item:hover {
      border-color: rgba(103, 80, 164, 0.3);
      background: rgba(103, 80, 164, 0.05);
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    .company-item.selected {
      border-color: var(--mdc-theme-primary);
      background: rgba(103, 80, 164, 0.1);
    }

    .company-checkbox {
      align-self: flex-start;
      width: 100%;
      display: flex;
      justify-content: flex-start;
    }

    .company-logo {
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      border-radius: 8px;
      background: white;
      border: 1px solid rgba(0, 0, 0, 0.1);
    }

    .company-logo img {
      width: 32px;
      height: 32px;
      object-fit: contain;
    }

    .company-name {
      font-size: 0.85rem;
      font-weight: 500;
      text-align: center;
      color: rgba(0, 0, 0, 0.87);
    }

    .selected-companies {
      margin-top: 1.5rem;
      padding-top: 1.5rem;
      border-top: 1px solid rgba(0, 0, 0, 0.1);
    }

    .selected-companies h4 {
      margin: 0 0 1rem 0;
      color: rgba(0, 0, 0, 0.87);
      font-size: 1rem;
      font-weight: 500;
    }

    .selected-companies-list {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }

    .company-chip {
      background: rgba(103, 80, 164, 0.1) !important;
      color: #5b21b6 !important;
      border: 1px solid rgba(103, 80, 164, 0.2) !important;
      font-weight: 500 !important;
      display: inline-flex !important;
      align-items: center !important;
      gap: 0.5rem !important;
    }

    .remove-company {
      font-size: 16px;
      width: 16px;
      height: 16px;
      cursor: pointer;
      opacity: 0.7;
      transition: opacity 0.2s ease;
    }

    .remove-company:hover {
      opacity: 1;
    }

    .filter-hint {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-top: 1rem;
      padding: 0.75rem;
      background: rgba(33, 150, 243, 0.1);
      border-radius: 8px;
      font-size: 0.85rem;
      color: #1976d2;
    }

    .filter-hint mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
    }

    :host-context(.dark-theme) .problem-info {
      border-bottom-color: rgba(255, 255, 255, 0.1);
    }

    :host-context(.dark-theme) .problem-id {
      background: rgba(255, 255, 255, 0.1);
      color: #c4b5fd;
      border-color: rgba(255, 255, 255, 0.2);
    }

    :host-context(.dark-theme) .companies-section h4,
    :host-context(.dark-theme) .selected-companies h4 {
      color: rgba(255, 255, 255, 0.9);
    }

    :host-context(.dark-theme) .company-item {
      border-color: rgba(255, 255, 255, 0.1);
      background: rgba(255, 255, 255, 0.02);
    }

    :host-context(.dark-theme) .company-item:hover {
      border-color: rgba(255, 255, 255, 0.3);
      background: rgba(255, 255, 255, 0.05);
    }

    :host-context(.dark-theme) .company-item.selected {
      border-color: var(--mdc-theme-primary);
      background: rgba(103, 80, 164, 0.2);
    }

    :host-context(.dark-theme) .company-name {
      color: rgba(255, 255, 255, 0.9);
    }

    :host-context(.dark-theme) .selected-companies {
      border-top-color: rgba(255, 255, 255, 0.1);
    }

    :host-context(.dark-theme) .company-chip {
      background: rgba(255, 255, 255, 0.1) !important;
      color: #c4b5fd !important;
      border: 1px solid rgba(255, 255, 255, 0.2) !important;
    }

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

      .companies-grid {
        grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
        gap: 0.75rem;
      }
    }

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

    :host-context(.dark-theme) mat-dialog-content {
      scrollbar-color: rgba(255, 255, 255, 0.2) rgba(255, 255, 255, 0.05);
    }

    :host-context(.dark-theme) mat-dialog-content::-webkit-scrollbar-track {
      background: rgba(255, 255, 255, 0.03);
    }

    :host-context(.dark-theme) mat-dialog-content::-webkit-scrollbar-thumb {
      background: rgba(255, 255, 255, 0.2);
    }

    :host-context(.dark-theme) mat-dialog-content::-webkit-scrollbar-thumb:hover {
      background: rgba(255, 255, 255, 0.3);
    }
  `]
})
export class CompaniesDialogComponent {
  companies = MAANG_COMPANIES;
  selectedCompanies: string[] = [];

  constructor(
    public dialogRef: MatDialogRef<CompaniesDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: Problem
  ) {
    this.selectedCompanies = [...(data.companies || [])];
  }

  toggleCompany(companyName: string): void {
    const index = this.selectedCompanies.indexOf(companyName);
    if (index >= 0) {
      this.selectedCompanies.splice(index, 1);
    } else {
      this.selectedCompanies.push(companyName);
    }
  }

  removeCompany(companyName: string): void {
    const index = this.selectedCompanies.indexOf(companyName);
    if (index >= 0) {
      this.selectedCompanies.splice(index, 1);
    }
  }

  onImageError(event: any, companyName: string): void {
    event.target.style.display = 'none';
    // Create a fallback with company initial
    const parent = event.target.parentElement;
    const fallback = document.createElement('div');
    fallback.style.cssText = `
      width: 32px;
      height: 32px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: 14px;
      border-radius: 4px;
    `;
    fallback.textContent = companyName.charAt(0).toUpperCase();
    parent.appendChild(fallback);
  }

  onSave(): void {
    this.dialogRef.close(this.selectedCompanies);
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
