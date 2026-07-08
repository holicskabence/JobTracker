import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AuthService } from '../../services/auth.service';
import { UserProfile } from '../../models/user.model';
import { CardComponent } from '../shared/card/card.component';
import { PageSectionComponent } from '../shared/page-section/page-section.component';
import { LanguageSwitcherComponent } from '../shared/language-switcher/language-switcher.component';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [FormsModule, TranslateModule, CardComponent, PageSectionComponent, LanguageSwitcherComponent],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent implements OnInit {
  readonly auth = inject(AuthService);
  private readonly translate = inject(TranslateService);

  firstName = '';
  lastName = '';
  phone = '';
  position = '';
  email = '';
  goal = 30;
  useAiEvaluation = false;
  saved = false;
  saveError = '';

  currentPwd = '';
  newPwd = '';
  confirmPwd = '';
  showCurrentPwd = false;
  showNewPwd = false;
  showConfirmPwd = false;
  pwdError = '';
  pwdSaved = false;

  avatarUploading = false;
  avatarError = '';

  ngOnInit(): void {
    const u = this.auth.currentUser();
    if (u) {
      this.firstName = u.firstName;
      this.lastName = u.lastName;
      this.phone = u.phone;
      this.position = u.position;
      this.email = u.email;
      this.goal = u.goal;
      this.useAiEvaluation = u.useAiEvaluation;
    }
  }

  get initials(): string {
    const n = [this.lastName, this.firstName].filter(Boolean).join(' ');
    return n.split(' ').map(p => p[0] ?? '').join('').slice(0, 2).toUpperCase();
  }

  get user(): UserProfile | null { return this.auth.currentUser(); }

  save(): void {
    this.saveError = '';
    this.auth.updateProfile({
      firstName: this.firstName.trim(),
      lastName: this.lastName.trim(),
      position: this.position.trim(),
      email: this.email.trim(),
      phone: this.phone.trim(),
      goal: this.goal,
      useAiEvaluation: this.useAiEvaluation,
      preferredLanguage: this.user?.preferredLanguage ?? 'hu'
    }).subscribe({
      next: () => {
        this.saved = true;
        setTimeout(() => this.saved = false, 2000);
      },
      error: () => {
        this.saveError = this.translate.instant('profile.personalData.saveError');
      }
    });
  }

  changePassword(): void {
    this.pwdError = '';
    if (!this.currentPwd) { this.pwdError = this.translate.instant('profile.password.currentPwdRequired'); return; }
    if (!this.newPwd) { this.pwdError = this.translate.instant('profile.password.newPwdRequired'); return; }
    if (this.newPwd.length < 6) { this.pwdError = this.translate.instant('profile.password.newPwdMinLength'); return; }
    if (this.newPwd !== this.confirmPwd) { this.pwdError = this.translate.instant('profile.password.mismatch'); return; }

    this.auth.changePassword(this.currentPwd, this.newPwd).subscribe({
      next: () => {
        this.currentPwd = '';
        this.newPwd = '';
        this.confirmPwd = '';
        this.pwdSaved = true;
        setTimeout(() => this.pwdSaved = false, 2500);
      },
      error: (err: HttpErrorResponse) => {
        this.pwdError = err.error?.message ?? this.translate.instant('profile.password.changeError');
      }
    });
  }

  onAvatarSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.avatarError = '';
    this.avatarUploading = true;
    this.auth.uploadAvatar(file).subscribe({
      next: () => { this.avatarUploading = false; },
      error: () => { this.avatarUploading = false; this.avatarError = this.translate.instant('profile.summary.avatarUploadError'); }
    });
  }

  deleteAvatar(): void {
    this.avatarError = '';
    this.auth.deleteAvatar().subscribe({
      error: () => { this.avatarError = this.translate.instant('profile.summary.avatarDeleteError'); }
    });
  }

  logout(): void { this.auth.logout(); }
}
