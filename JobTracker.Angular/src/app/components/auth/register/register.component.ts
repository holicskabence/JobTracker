import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AuthService, RegisterPayload } from '../../../services/auth.service';
import { LanguageService } from '../../../services/language.service';
import { AuthCardComponent } from '../../shared/auth-card/auth-card.component';
import { WorkMode, WORK_MODES } from '../../../models/user.model';
import { isValidEmail } from '../../../utils/email';

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

  readonly workModes = WORK_MODES;

  step = signal<1 | 2>(1);

  firstName = '';
  lastName = '';
  email = '';
  password = '';
  confirm = '';
  showPwd = false;

  location = '';
  targetPosition = '';
  yearsOfExperience: number | null = null;
  preferredWorkMode: WorkMode | null = null;
  salaryExpectation = '';
  noticePeriodDays: number | null = null;
  linkedInUrl = '';
  gitHubUrl = '';
  portfolioUrl = '';
  mainSkills = '';

  loading = signal(false);
  errors: Record<string, string> = {};

  onSubmit(): void {
    if (this.step() === 1) this.continueToDetails();
    else this.createAccount();
  }

  continueToDetails(): void {
    if (!this.validateAccount()) return;
    this.step.set(2);
  }

  backToAccount(): void {
    this.step.set(1);
  }

  skipDetails(): void {
    this.clearDetails();
    this.createAccount();
  }

  toggleWorkMode(mode: WorkMode): void {
    this.preferredWorkMode = this.preferredWorkMode === mode ? null : mode;
  }

  private validateAccount(): boolean {
    this.errors = {};

    if (!this.firstName.trim()) this.errors['firstName'] = this.translate.instant('auth.register.firstNameRequiredError');
    if (!this.lastName.trim()) this.errors['lastName'] = this.translate.instant('auth.register.lastNameRequiredError');
    if (!this.email.trim()) this.errors['email'] = this.translate.instant('auth.register.emailRequiredError');
    else if (!isValidEmail(this.email)) this.errors['email'] = this.translate.instant('auth.register.emailInvalidError');
    if (!this.password) this.errors['password'] = this.translate.instant('auth.register.passwordRequiredError');
    else if (this.password.length < 6) this.errors['password'] = this.translate.instant('auth.register.passwordTooShortError');
    if (this.password && this.password !== this.confirm) this.errors['confirm'] = this.translate.instant('auth.register.passwordMismatchError');

    return Object.keys(this.errors).length === 0;
  }

  private clearDetails(): void {
    this.location = '';
    this.targetPosition = '';
    this.yearsOfExperience = null;
    this.preferredWorkMode = null;
    this.salaryExpectation = '';
    this.noticePeriodDays = null;
    this.linkedInUrl = '';
    this.gitHubUrl = '';
    this.portfolioUrl = '';
    this.mainSkills = '';
  }

  private createAccount(): void {
    if (!this.validateAccount()) {
      this.step.set(1);
      return;
    }

    this.loading.set(true);
    this.auth.register(this.buildPayload()).subscribe({
      complete: () => {
        this.loading.set(false);
        this.router.navigate(['/login']);
      },
      error: (err: HttpErrorResponse) => {
        this.errors['general'] = this.translate.instant(err.status === 409
          ? 'auth.register.emailTakenError'
          : 'auth.register.registrationFailedError');
        if (err.status === 409) this.step.set(1);
        this.loading.set(false);
      }
    });
  }

  private buildPayload(): RegisterPayload {
    return {
      firstName: this.firstName.trim(),
      lastName: this.lastName.trim(),
      email: this.email.trim(),
      password: this.password,
      preferredLanguage: this.languageService.currentLang(),
      location: this.trimmedOrNull(this.location),
      targetPosition: this.trimmedOrNull(this.targetPosition),
      yearsOfExperience: this.yearsOfExperience,
      preferredWorkMode: this.preferredWorkMode,
      salaryExpectation: this.trimmedOrNull(this.salaryExpectation),
      noticePeriodDays: this.noticePeriodDays,
      linkedInUrl: this.trimmedOrNull(this.linkedInUrl),
      gitHubUrl: this.trimmedOrNull(this.gitHubUrl),
      portfolioUrl: this.trimmedOrNull(this.portfolioUrl),
      mainSkills: this.trimmedOrNull(this.mainSkills)
    };
  }

  private trimmedOrNull(value: string): string | null {
    return value.trim() || null;
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
