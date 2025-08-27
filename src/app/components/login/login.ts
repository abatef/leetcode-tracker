import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../services/auth';
import { LeetcodeService } from '../../services/leetcode';
import { firstValueFrom } from 'rxjs';
import { filter, take } from 'rxjs/operators';

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
  templateUrl: './login.html',
  styleUrls: ['./login.scss']
})
export class LoginComponent {
  loading = false;
  demoLoading = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private leetcodeService: LeetcodeService
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

  async continueAsGuest(): Promise<void> {
    this.demoLoading = true;
    try {
      await this.authService.signInAsGuest();
      // Ensure Firebase user is available before seeding
      await firstValueFrom(this.authService.user$.pipe(filter(u => !!u), take(1)));
      await this.leetcodeService.seedDemoDataIfEmpty();
      this.router.navigate(['/dashboard'], { queryParams: { demo: '1' } });
    } catch (error) {
      console.error('Guest sign-in error:', error);
    } finally {
      this.demoLoading = false;
    }
  }
}
