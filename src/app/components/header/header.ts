import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { AuthService } from '../../services/auth';
import { ThemeService } from '../../services/theme';
import { Observable } from 'rxjs';
import { User } from '@angular/fire/auth';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatDividerModule
  ],
  template: `
    <mat-toolbar color="primary">
      <div class="header-content">
        <div class="left-section">
          <mat-icon class="logo-icon">code</mat-icon>
          <span class="app-title">LeetCode Tracker</span>
        </div>

        <nav class="nav-links" *ngIf="user$ | async">
          <a mat-button routerLink="/dashboard" routerLinkActive="active">
            <mat-icon>dashboard</mat-icon>
            Dashboard
          </a>
          <a mat-button routerLink="/problems" routerLinkActive="active">
            <mat-icon>list</mat-icon>
            Problems
          </a>
          <a mat-button routerLink="/statistics" routerLinkActive="active">
            <mat-icon>analytics</mat-icon>
            Statistics
          </a>
        </nav>

        <div class="right-section">
          <button mat-icon-button
                  (click)="toggleTheme()"
                  title="Toggle theme">
            <mat-icon>{{ (isDarkMode$ | async) ? 'light_mode' : 'dark_mode' }}</mat-icon>
          </button>

          <div *ngIf="user$ | async as user" class="user-section">
            <button mat-button [matMenuTriggerFor]="userMenu" class="user-button">
              <img [src]="user.photoURL"
                   [alt]="user.displayName"
                   class="user-avatar"
                   *ngIf="user.photoURL">
              <mat-icon *ngIf="!user.photoURL">account_circle</mat-icon>
              <span class="user-name">{{ user.displayName || 'User' }}</span>
              <mat-icon>arrow_drop_down</mat-icon>
            </button>

            <mat-menu #userMenu="matMenu">
              <button mat-menu-item disabled>
                <mat-icon>account_circle</mat-icon>
                <span>{{ user.email }}</span>
              </button>
              <mat-divider></mat-divider>
              <button mat-menu-item (click)="signOut()">
                <mat-icon>logout</mat-icon>
                <span>Sign Out</span>
              </button>
            </mat-menu>
          </div>

          <button mat-raised-button
                  color="accent"
                  routerLink="/login"
                  *ngIf="!(user$ | async)">
            Sign In
          </button>
        </div>
      </div>
    </mat-toolbar>
  `,
  styles: [`
    .header-content {
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: 100%;
      max-width: 1200px;
      margin: 0 auto;
    }

    .left-section {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .logo-icon {
      font-size: 1.5rem;
      width: 1.5rem;
      height: 1.5rem;
    }

    .app-title {
      font-size: 1.25rem;
      font-weight: 500;
    }

    .nav-links {
      display: flex;
      gap: 0.5rem;
    }

    .nav-links a {
      display: flex;
      align-items: center;
      gap: 0.25rem;
    }

    .nav-links a.active {
      background-color: rgba(255, 255, 255, 0.1);
    }

    .right-section {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .user-section {
      display: flex;
      align-items: center;
    }

    .user-button {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .user-avatar {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      object-fit: cover;
    }

    .user-name {
      max-width: 100px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    @media (max-width: 768px) {
      .nav-links {
        display: none;
      }

      .user-name {
        display: none;
      }

      .app-title {
        font-size: 1rem;
      }
    }
  `]
})
export class HeaderComponent {
  user$: Observable<User | null>;
  isDarkMode$: Observable<boolean>;

  constructor(
    private authService: AuthService,
    private themeService: ThemeService
  ) {
    this.user$ = this.authService.user$;
    this.isDarkMode$ = this.themeService.isDarkMode$;
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }

  async signOut(): Promise<void> {
    try {
      await this.authService.signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  }
}
