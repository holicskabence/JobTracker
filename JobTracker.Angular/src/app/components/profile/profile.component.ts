import { Component, inject, OnInit } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AuthService } from '../../services/auth.service';
import { UserProfile, WorkMode, WORK_MODES } from '../../models/user.model';
import { calculateProfileCompleteness, ProfileCompleteness } from '../../utils/profile-completeness';
import { CardComponent } from '../shared/card/card.component';
import { PageSectionComponent } from '../shared/page-section/page-section.component';
import { LanguageSwitcherComponent } from '../shared/language-switcher/language-switcher.component';

type ProfileSection = 'personalInformation' | 'careerPreferences' | 'professionalLinks' | 'goal' | 'aiSettings';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [FormsModule, NgTemplateOutlet, TranslateModule, CardComponent, PageSectionComponent, LanguageSwitcherComponent],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent implements OnInit {
  readonly auth = inject(AuthService);
  private readonly translate = inject(TranslateService);

  readonly workModes = WORK_MODES;

  firstName = '';
  lastName = '';
  phone = '';
  email = '';
  location = '';

  position = '';
  targetPosition = '';
  yearsOfExperience: number | null = null;
  preferredWorkMode: WorkMode | null = null;
  preferredLocations = '';
  salaryExpectation = '';
  noticePeriodDays: number | null = null;
  mainSkills = '';

  linkedInUrl = '';
  gitHubUrl = '';
  portfolioUrl = '';

  goal = 30;
  useAiEvaluation = false;

  savedSection: ProfileSection | null = null;
  errorSection: ProfileSection | null = null;
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
    if (!u) return;

    this.firstName = u.firstName;
    this.lastName = u.lastName;
    this.phone = u.phone;
    this.email = u.email;
    this.location = u.location ?? '';

    this.position = u.position;
    this.targetPosition = u.targetPosition ?? '';
    this.yearsOfExperience = u.yearsOfExperience;
    this.preferredWorkMode = u.preferredWorkMode;
    this.preferredLocations = u.preferredLocations ?? '';
    this.salaryExpectation = u.salaryExpectation ?? '';
    this.noticePeriodDays = u.noticePeriodDays;
    this.mainSkills = u.mainSkills ?? '';

    this.linkedInUrl = u.linkedInUrl ?? '';
    this.gitHubUrl = u.gitHubUrl ?? '';
    this.portfolioUrl = u.portfolioUrl ?? '';

    this.goal = u.goal;
    this.useAiEvaluation = u.useAiEvaluation;
  }

  get initials(): string {
    const n = [this.lastName, this.firstName].filter(Boolean).join(' ');
    return n.split(' ').map(p => p[0] ?? '').join('').slice(0, 2).toUpperCase();
  }

  get user(): UserProfile | null { return this.auth.currentUser(); }

  get completeness(): ProfileCompleteness {
    return calculateProfileCompleteness({
      firstName: this.firstName,
      lastName: this.lastName,
      email: this.email,
      phone: this.phone,
      location: this.location,
      position: this.position,
      targetPosition: this.targetPosition,
      yearsOfExperience: this.yearsOfExperience,
      preferredWorkMode: this.preferredWorkMode,
      preferredLocations: this.preferredLocations,
      salaryExpectation: this.salaryExpectation,
      noticePeriodDays: this.noticePeriodDays,
      mainSkills: this.mainSkills,
      linkedInUrl: this.linkedInUrl,
      gitHubUrl: this.gitHubUrl,
      portfolioUrl: this.portfolioUrl
    });
  }

  get skillChips(): string[] {
    return this.splitSkills(this.mainSkills);
  }

  get userSkillChips(): string[] {
    return this.splitSkills(this.user?.mainSkills ?? '');
  }

  private splitSkills(value: string): string[] {
    return value.split(',').map(s => s.trim()).filter(Boolean);
  }

  toggleWorkMode(mode: WorkMode): void {
    this.preferredWorkMode = this.preferredWorkMode === mode ? null : mode;
  }

  save(section: ProfileSection): void {
    this.saveError = '';
    this.errorSection = null;

    this.auth.updateProfile({
      firstName: this.firstName.trim(),
      lastName: this.lastName.trim(),
      position: this.position.trim(),
      email: this.email.trim(),
      phone: this.phone.trim(),
      goal: this.goal,
      useAiEvaluation: this.useAiEvaluation,
      preferredLanguage: this.user?.preferredLanguage ?? 'hu',
      location: this.trimmedOrNull(this.location),
      targetPosition: this.trimmedOrNull(this.targetPosition),
      yearsOfExperience: this.yearsOfExperience,
      preferredWorkMode: this.preferredWorkMode,
      preferredLocations: this.trimmedOrNull(this.preferredLocations),
      salaryExpectation: this.trimmedOrNull(this.salaryExpectation),
      noticePeriodDays: this.noticePeriodDays,
      linkedInUrl: this.trimmedOrNull(this.linkedInUrl),
      gitHubUrl: this.trimmedOrNull(this.gitHubUrl),
      portfolioUrl: this.trimmedOrNull(this.portfolioUrl),
      mainSkills: this.trimmedOrNull(this.mainSkills)
    }).subscribe({
      next: () => {
        this.savedSection = section;
        setTimeout(() => {
          if (this.savedSection === section) this.savedSection = null;
        }, 2000);
      },
      error: () => {
        this.errorSection = section;
        this.saveError = this.translate.instant('profile.saveError');
      }
    });
  }

  private trimmedOrNull(value: string): string | null {
    return value.trim() || null;
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
