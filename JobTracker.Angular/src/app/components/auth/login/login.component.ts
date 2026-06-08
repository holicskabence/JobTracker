import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-login',
  imports: [FormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  email = '';
  password = '';
  showPwd = false;
  error = '';
  loading = signal(false);

  submit(): void {
    this.error = '';
    if (!this.email.trim() || !this.password.trim()) {
      this.error = 'Add meg az e-mail címed és a jelszavadat.';
      return;
    }
    this.loading.set(true);
    this.auth.login(this.email.trim(), this.password).subscribe({
      next: ok => {
        if (ok) {
          this.router.navigate(['/dashboard']);
        } else {
          this.error = 'Hibás e-mail cím vagy jelszó.';
          this.loading.set(false);
        }
      },
      error: () => {
        this.error = 'Nem sikerült csatlakozni a szerverhez.';
        this.loading.set(false);
      }
    });
  }

  loginDemo(): void {
    this.loading.set(true);
    this.auth.loginDemo().subscribe({
      complete: () => {
        this.loading.set(false);
        this.router.navigate(['/dashboard']);
      }
    });
  }

  oauthLogin(): void {
    this.loginDemo();
  }
}
