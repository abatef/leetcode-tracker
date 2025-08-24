import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="login-container">
      <div class="login-card-wrapper">
        <mat-card class="login-card">
          <mat-card-header class="login-header">
            <div mat-card-avatar class="login-avatar">
              <mat-icon>code</mat-icon>
            </div>
            <mat-card-title>LeetCode Tracker</mat-card-title>
            <mat-card-subtitle>Track your coding journey</mat-card-subtitle>
          </mat-card-header>

          <mat-card-content class="login-content">
            <div class="welcome-text">
              <h2>Welcome!</h2>
              <p>Sign in to start tracking your LeetCode progress and build your coding streak.</p>
            </div>

            <div class="features-list">
              <div class="feature-item">
                <mat-icon>analytics</mat-icon>
                <span>Track your progress and statistics</span>
              </div>
              <div class="feature-item">
                <mat-icon>local_fire_department</mat-icon>
                <span>Build and maintain your streak</span>
              </div>
              <div class="feature-item">
                <mat-icon>insights</mat-icon>
                <span>Get insights and recommendations</span>
              </div>
            </div>
          </mat-card-content>

          <mat-card-actions class="login-actions">
            <button mat-raised-button
                    color="primary"
                    class="google-signin-btn"
                    (click)="signInWithGoogle()"
                    [disabled]="loading">
              <mat-spinner diameter="20" *ngIf="loading"></mat-spinner>
              <mat-icon *ngIf="!loading">google</mat-icon>
              <span>{{ loading ? 'Signing in...' : 'Continue with Google' }}</span>
            </button>
          </mat-card-actions>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .login-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 1rem;
    }

    .login-card-wrapper {
      width: 100%;
      max-width: 400px;
    }

    .login-card {
      padding: 2rem;
      text-align: center;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
    }

    .login-header {
      margin-bottom: 2rem;
    }

    .login-avatar {
      background-color: var(--mdc-theme-primary);
      color: white;
    }

    .login-content {
      margin-bottom: 2rem;
    }

    .welcome-text h2 {
      margin: 0 0 1rem 0;
      color: var(--mdc-theme-on-surface);
    }

    .welcome-text p {
      margin: 0 0 2rem 0;
      color: var(--mdc-theme-on-surface-variant);
      line-height: 1.5;
    }

    .features-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      text-align: left;
    }

    .feature-item {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .feature-item mat-icon {
      color: var(--mdc-theme-primary);
    }

    .feature-item span {
      color: var(--mdc-theme-on-surface-variant);
    }

    .login-actions {
      display: flex;
      justify-content: center;
    }

    .google-signin-btn {
      width: 100%;
      height: 48px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      font-size: 1rem;
    }

    @media (max-width: 480px) {
      .login-card {
        padding: 1.5rem;
      }
    }
  `]
})
export class LoginComponent {
  loading = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  async signInWithGoogle(): Promise<void> {
    this.loading = true;

    try {
      await this.authService.signInWithGoogle();
      this.router.navigate(['/dashboard']);
    } catch (error) {
      console.error('Sign-in error:', error);
      // You might want to show an error message to the user
    } finally {
      this.loading = false;
    }
  }
}
