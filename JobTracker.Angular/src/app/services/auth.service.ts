import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, map, catchError, of } from 'rxjs';
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
}

interface UpdateProfileRequest {
  firstName: string;
  lastName: string;
  position: string;
  email: string;
  phone: string;
  goal: number;
}

const OFFLINE_DEMO_USER: UserProfile = {
  id: 0,
  firstName: 'Bence',
  lastName: 'Holicska',
  name: 'Holicska Bence',
  position: 'Fullstack Developer',
  email: 'benceholicska@gmail.com',
  phone: '+36 30 123 4567',
  goal: 30,
  joinDate: '2026. március'
};

@Injectable({ providedIn: 'root' })
export class AuthService {
  readonly currentUser = signal<UserProfile | null>(null);
  readonly isLoggedIn = computed(() => this.currentUser() !== null);

  private readonly router = inject(Router);

  constructor(private readonly http: HttpClient) {
    this.initFromStorage();
  }

  initFromStorage(): void {
    const token = localStorage.getItem('jt_token');
    const userJson = localStorage.getItem('jt_user');
    if (token && userJson) {
      try {
        this.currentUser.set(JSON.parse(userJson));
      } catch {
        this.clearStorage();
      }
    }
  }

  login(email: string, password: string): Observable<boolean> {
    return this.http.post<AuthResponse>('/api/auth/login', { email, password }).pipe(
      tap(res => this.persistSession(res)),
      map(() => true),
      catchError(() => of(false))
    );
  }

  loginDemo(): Observable<void> {
    return this.http.post<AuthResponse>('/api/auth/login', {
      email: 'benceholicska@gmail.com', password: 'Demo@1234'
    }).pipe(
      tap(res => this.persistSession(res)),
      map(() => undefined as void),
      catchError(() => {
        this.currentUser.set(OFFLINE_DEMO_USER);
        return of(undefined as void);
      })
    );
  }

  register(data: { firstName: string; lastName: string; email: string; password: string }): Observable<void> {
    return this.http.post<AuthResponse>('/api/auth/register', data).pipe(
      tap(res => this.persistSession(res)),
      map(() => undefined)
    );
  }

  logout(): void {
    this.clearStorage();
    this.currentUser.set(null);
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

  changePassword(currentPassword: string, newPassword: string): Observable<{ ok: boolean; message?: string }> {
    return this.http.patch('/api/profile/password', { currentPassword, newPassword }, { observe: 'response' }).pipe(
      map(res => ({ ok: res.status === 204 })),
      catchError(() => of({ ok: false, message: 'A jelenlegi jelszó nem helyes.' }))
    );
  }

  private persistSession(res: AuthResponse): void {
    const user = this.mapProfile(res.profile as unknown as UserProfileResponse);
    localStorage.setItem('jt_token', res.token);
    localStorage.setItem('jt_user', JSON.stringify(user));
    this.currentUser.set(user);
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
      joinDate: r.joinDate
    };
  }

  private clearStorage(): void {
    localStorage.removeItem('jt_token');
    localStorage.removeItem('jt_user');
  }
}
