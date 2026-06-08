import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { UserProfile } from '../../models/user.model';

@Component({
  selector: 'app-profile',
  imports: [FormsModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent implements OnInit {
  readonly auth = inject(AuthService);

  firstName = '';
  lastName = '';
  phone = '';
  position = '';
  email = '';
  goal = 30;
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

  ngOnInit(): void {
    const u = this.auth.currentUser();
    if (u) {
      this.firstName = u.firstName;
      this.lastName = u.lastName;
      this.phone = u.phone;
      this.position = u.position;
      this.email = u.email;
      this.goal = u.goal;
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
      goal: this.goal
    }).subscribe({
      next: () => {
        this.saved = true;
        setTimeout(() => this.saved = false, 2000);
      },
      error: () => {
        this.saveError = 'Mentés sikertelen. Próbáld meg újra.';
      }
    });
  }

  changePassword(): void {
    this.pwdError = '';
    if (!this.currentPwd) { this.pwdError = 'Add meg a jelenlegi jelszavadat.'; return; }
    if (!this.newPwd) { this.pwdError = 'Az új jelszó nem lehet üres.'; return; }
    if (this.newPwd.length < 6) { this.pwdError = 'Az új jelszónak legalább 6 karakter hosszúnak kell lennie.'; return; }
    if (this.newPwd !== this.confirmPwd) { this.pwdError = 'A két jelszó nem egyezik.'; return; }

    this.auth.changePassword(this.currentPwd, this.newPwd).subscribe({
      next: result => {
        if (result.ok) {
          this.currentPwd = '';
          this.newPwd = '';
          this.confirmPwd = '';
          this.pwdSaved = true;
          setTimeout(() => this.pwdSaved = false, 2500);
        } else {
          this.pwdError = result.message ?? 'A jelenlegi jelszó nem helyes.';
        }
      },
      error: () => {
        this.pwdError = 'Jelszócsere sikertelen.';
      }
    });
  }

  logout(): void { this.auth.logout(); }
}
