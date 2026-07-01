import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AuthService } from '../../../services/auth.service';
import { LanguageService } from '../../../services/language.service';
import { AuthCardComponent } from '../../shared/auth-card/auth-card.component';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, RouterLink, AuthCardComponent, TranslateModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly languageService = inject(LanguageService);
  private readonly translate = inject(TranslateService);

  firstName = '';
  lastName = '';
  email = '';
  password = '';
  confirm = '';
  showPwd = false;
  loading = signal(false);
  errors: Record<string, string> = {};

  submit(): void {
    this.errors = {};

    if (!this.firstName.trim()) this.errors['firstName'] = this.translate.instant('auth.register.firstNameRequiredError');
    if (!this.lastName.trim()) this.errors['lastName'] = this.translate.instant('auth.register.lastNameRequiredError');
    if (!this.email.trim()) this.errors['email'] = this.translate.instant('auth.register.emailRequiredError');
    if (!this.password) this.errors['password'] = this.translate.instant('auth.register.passwordRequiredError');
    else if (this.password.length < 6) this.errors['password'] = this.translate.instant('auth.register.passwordTooShortError');
    if (this.password && this.password !== this.confirm) this.errors['confirm'] = this.translate.instant('auth.register.passwordMismatchError');

    if (Object.keys(this.errors).length > 0) return;

    this.loading.set(true);
    this.auth.register({
      firstName: this.firstName.trim(),
      lastName: this.lastName.trim(),
      email: this.email.trim(),
      password: this.password,
      preferredLanguage: this.languageService.currentLang()
    }).subscribe({
      complete: () => {
        this.loading.set(false);
        this.router.navigate(['/login']);
      },
      error: (err: HttpErrorResponse) => {
        this.errors['general'] = err.error?.message ?? this.translate.instant('auth.register.registrationFailedError');
        this.loading.set(false);
      }
    });
  }

  oauthLogin(): void {
    this.loading.set(true);
    this.auth.loginDemo().subscribe({
      complete: () => {
        this.loading.set(false);
        this.router.navigate(['/dashboard']);
      }
    });
  }
}
