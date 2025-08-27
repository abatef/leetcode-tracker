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
  { name: 'Twitter', logo: 'https://upload.wikimedia.org/wikipedia/commons/6/6f/Logo_of_Twitter.svg' },
  { name: 'Adobe', logo: 'https://upload.wikimedia.org/wikipedia/commons/7/7b/Adobe_Systems_logo_and_wordmark.svg' },
  { name: 'Atlassian', logo: 'https://cdn.simpleicons.org/atlassian' },
  { name: 'Bloomberg', logo: 'https://upload.wikimedia.org/wikipedia/commons/5/5d/New_Bloomberg_Logo.svg' },
  { name: 'Datadog', logo: 'https://cdn.simpleicons.org/datadog' },
  { name: 'Doordash', logo: 'https://cdn.simpleicons.org/doordash' },
  { name: 'Dropbox', logo: 'https://cdn.simpleicons.org/dropbox' },
  { name: 'Goldman Sachs', logo: 'https://cdn.simpleicons.org/goldmansachs' },
  { name: 'Nvidia', logo: 'https://cdn.simpleicons.org/nvidia' },
  { name: 'Oracle', logo: 'https://upload.wikimedia.org/wikipedia/commons/e/e1/Oracle_Corporation_logo.svg' },
  { name: 'Palantir', logo: 'https://cdn.simpleicons.org/palantir' },
  { name: 'PayPal', logo: 'https://cdn.simpleicons.org/paypal' },
  { name: 'Salesforce', logo: 'https://cdn.simpleicons.org/salesforce' },
  { name: 'Snowflake', logo: 'https://cdn.simpleicons.org/snowflake' },
  { name: 'Square', logo: 'https://cdn.simpleicons.org/square' },
  { name: 'Stripe', logo: 'https://cdn.simpleicons.org/stripe' },
  { name: 'TikTok', logo: 'https://cdn.simpleicons.org/tiktok' }
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
  templateUrl: './companies-dialog.html',
  styleUrls: ['./companies-dialog.scss']
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
