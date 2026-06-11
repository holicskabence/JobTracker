import { AfterViewInit, Component, ElementRef, inject, signal, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../../services/auth.service';
import { SocialAuthService } from '../../../services/social-auth.service';
import { AuthCardComponent } from '../../shared/auth-card/auth-card.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, RouterLink, AuthCardComponent],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent implements AfterViewInit {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly social = inject(SocialAuthService);

  @ViewChild('googleBtn') googleBtn?: ElementRef<HTMLDivElement>;

  email = '';
  password = '';
  showPwd = false;
  error = '';
  loading = signal(false);
  loadingAction = signal<'email' | 'demo' | 'google' | 'facebook' | null>(null);

  ngAfterViewInit(): void {
    if (this.googleBtn) {
      this.social.initGoogleButton(this.googleBtn.nativeElement);
      this.social.onGoogleCredential().subscribe(idToken => this.handleGoogleCredential(idToken));
    }
  }

  submit(): void {
    this.error = '';
    if (!this.email.trim() || !this.password.trim()) {
      this.error = 'Add meg az e-mail címed és a jelszavadat.';
      return;
    }
    this.loading.set(true);
    this.loadingAction.set('email');
    this.auth.login(this.email.trim(), this.password).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: (err: HttpErrorResponse) => {
        this.error = err.status === 401
          ? (err.error?.message ?? 'Hibás e-mail cím vagy jelszó.')
          : 'Nem sikerült csatlakozni a szerverhez.';
        this.loading.set(false);
        this.loadingAction.set(null);
      }
    });
  }

  loginDemo(): void {
    this.loading.set(true);
    this.loadingAction.set('demo');
    this.auth.loginDemo().subscribe({
      complete: () => {
        this.loading.set(false);
        this.loadingAction.set(null);
        this.router.navigate(['/dashboard']);
      }
    });
  }

  googleLogin(): void {
    this.error = '';
    if (this.googleBtn) this.social.triggerGoogle(this.googleBtn.nativeElement);
  }

  facebookLogin(): void {
    this.error = '';
    this.loading.set(true);
    this.loadingAction.set('facebook');
    this.social.signInWithFacebook()
      .then(accessToken => {
        this.auth.facebookLogin(accessToken).subscribe({
          next: () => this.router.navigate(['/dashboard']),
          error: () => {
            this.error = 'Sikertelen Facebook bejelentkezés.';
            this.loading.set(false);
            this.loadingAction.set(null);
          }
        });
      })
      .catch((err: Error) => {
        this.error = err.message || 'Sikertelen Facebook bejelentkezés.';
        this.loading.set(false);
        this.loadingAction.set(null);
      });
  }

  private handleGoogleCredential(idToken: string): void {
    this.error = '';
    this.loading.set(true);
    this.loadingAction.set('google');
    this.auth.googleLogin(idToken).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: () => {
        this.error = 'Sikertelen Google bejelentkezés.';
        this.loading.set(false);
        this.loadingAction.set(null);
      }
    });
  }
}
