import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

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

    if (!this.firstName.trim()) this.errors['firstName'] = 'Keresztnév megadása kötelező.';
    if (!this.lastName.trim()) this.errors['lastName'] = 'Vezetéknév megadása kötelező.';
    if (!this.email.trim()) this.errors['email'] = 'E-mail cím megadása kötelező.';
    if (!this.password) this.errors['password'] = 'Jelszó megadása kötelező.';
    else if (this.password.length < 6) this.errors['password'] = 'Legalább 6 karakter szükséges.';
    if (this.password && this.password !== this.confirm) this.errors['confirm'] = 'A két jelszó nem egyezik.';

    if (Object.keys(this.errors).length > 0) return;

    this.loading.set(true);
    this.auth.register({
      firstName: this.firstName.trim(),
      lastName: this.lastName.trim(),
      email: this.email.trim(),
      password: this.password
    }).subscribe({
      complete: () => {
        this.loading.set(false);
        this.router.navigate(['/login']);
      },
      error: () => {
        this.errors['general'] = 'Regisztráció sikertelen. Próbáld meg újra.';
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
