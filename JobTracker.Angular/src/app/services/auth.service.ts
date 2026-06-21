import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, map } from 'rxjs';
import { UserProfile } from '../models/user.model';

interface AuthResponse {
  token: string;
  profile: UserProfile;
}

interface UserProfileResponse {
  id: number;
  firstName: string;
  lastName: string;
  position: string;
  email: string;
  phone: string;
  goal: number;
  joinDate: string;
  hasAvatar: boolean;
  useAiEvaluation: boolean;
  preferredLanguage: string;
}

interface UpdateProfileRequest {
  firstName: string;
  lastName: string;
  position: string;
  email: string;
  phone: string;
  goal: number;
  useAiEvaluation: boolean;
  preferredLanguage: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  readonly currentUser = signal<UserProfile | null>(null);
  readonly isLoggedIn = computed(() => this.currentUser() !== null);
  readonly avatarObjectUrl = signal<string | null>(null);

  private readonly router = inject(Router);

  constructor(private readonly http: HttpClient) {
    this.initFromStorage();
  }

  initFromStorage(): void {
    const token = localStorage.getItem('jt_token');
    const userJson = localStorage.getItem('jt_user');
    if (token && userJson) {
      try {
        const user: UserProfile = JSON.parse(userJson);
        this.currentUser.set(user);
        // Deferred: issuing the HTTP request synchronously here would make errorInterceptor's
        // inject(AuthService) run while this constructor is still on the stack, triggering NG0200
        // (circular DI) and silently dropping the avatar on every fresh page load.
        if (user.hasAvatar) queueMicrotask(() => this.loadAvatar());
      } catch {
        this.clearStorage();
      }
    }
  }

  loadAvatar(): void {
    this.http.get('/api/profile/avatar', { responseType: 'blob' }).subscribe({
      next: blob => {
        const prev = this.avatarObjectUrl();
        if (prev) URL.revokeObjectURL(prev);
        this.avatarObjectUrl.set(URL.createObjectURL(blob));
      },
      error: () => this.avatarObjectUrl.set(null)
    });
  }

  uploadAvatar(file: File): Observable<UserProfile> {
    const fd = new FormData();
    fd.append('file', file);
    return this.http.post<UserProfileResponse>('/api/profile/avatar', fd).pipe(
      map(r => this.mapProfile(r)),
      tap(user => {
        this.currentUser.set(user);
        localStorage.setItem('jt_user', JSON.stringify(user));
        this.loadAvatar();
      })
    );
  }

  deleteAvatar(): Observable<void> {
    return this.http.delete<void>('/api/profile/avatar').pipe(
      tap(() => {
        const user = this.currentUser();
        if (user) {
          const updated = { ...user, hasAvatar: false };
          this.currentUser.set(updated);
          localStorage.setItem('jt_user', JSON.stringify(updated));
        }
        const prev = this.avatarObjectUrl();
        if (prev) URL.revokeObjectURL(prev);
        this.avatarObjectUrl.set(null);
      })
    );
  }

  login(email: string, password: string): Observable<void> {
    return this.http.post<AuthResponse>('/api/auth/login', { email, password }).pipe(
      tap(res => this.persistSession(res)),
      map(() => undefined)
    );
  }

  loginDemo(): Observable<void> {
    return this.http.post<AuthResponse>('/api/auth/login', {
      email: 'demo@jobtracker.app', password: 'Demo@1234'
    }).pipe(
      tap(res => this.persistSession(res)),
      map(() => undefined as void)
    );
  }

  register(data: { firstName: string; lastName: string; email: string; password: string; preferredLanguage?: string }): Observable<void> {
    return this.http.post<AuthResponse>('/api/auth/register', data).pipe(
      tap(res => this.persistSession(res)),
      map(() => undefined)
    );
  }

  googleLogin(idToken: string): Observable<void> {
    return this.http.post<AuthResponse>('/api/auth/google', { token: idToken }).pipe(
      tap(res => this.persistSession(res)),
      map(() => undefined)
    );
  }

  facebookLogin(accessToken: string): Observable<void> {
    return this.http.post<AuthResponse>('/api/auth/facebook', { token: accessToken }).pipe(
      tap(res => this.persistSession(res)),
      map(() => undefined)
    );
  }

  logout(): void {
    this.clearStorage();
    this.currentUser.set(null);
    const prev = this.avatarObjectUrl();
    if (prev) URL.revokeObjectURL(prev);
    this.avatarObjectUrl.set(null);
    this.router.navigate(['/login']);
  }

  updateProfile(data: UpdateProfileRequest): Observable<UserProfile> {
    return this.http.put<UserProfileResponse>('/api/profile', data).pipe(
      map(r => this.mapProfile(r)),
      tap(user => {
        this.currentUser.set(user);
        localStorage.setItem('jt_user', JSON.stringify(user));
      })
    );
  }

  changePassword(currentPassword: string, newPassword: string): Observable<void> {
    return this.http.patch<void>('/api/profile/password', { currentPassword, newPassword }).pipe(
      map(() => undefined)
    );
  }

  private persistSession(res: AuthResponse): void {
    const user = this.mapProfile(res.profile as unknown as UserProfileResponse);
    localStorage.setItem('jt_token', res.token);
    localStorage.setItem('jt_user', JSON.stringify(user));
    this.currentUser.set(user);
    const prev = this.avatarObjectUrl();
    if (prev) URL.revokeObjectURL(prev);
    this.avatarObjectUrl.set(null);
    if (user.hasAvatar) this.loadAvatar();
  }

  private mapProfile(r: UserProfileResponse): UserProfile {
    return {
      id: r.id,
      firstName: r.firstName,
      lastName: r.lastName,
      name: [r.lastName, r.firstName].filter(Boolean).join(' '),
      position: r.position,
      email: r.email,
      phone: r.phone,
      goal: r.goal,
      joinDate: r.joinDate,
      hasAvatar: r.hasAvatar ?? false,
      useAiEvaluation: r.useAiEvaluation ?? false,
      preferredLanguage: r.preferredLanguage ?? 'hu'
    };
  }

  private clearStorage(): void {
    localStorage.removeItem('jt_token');
    localStorage.removeItem('jt_user');
  }
}
