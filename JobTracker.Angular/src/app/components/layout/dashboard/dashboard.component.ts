import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter, map, startWith } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import { DashboardTab } from '../../../models/job.model';
import { AuthService } from '../../../services/auth.service';
import { JobStoreService } from '../../../services/job-store.service';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { DashboardHeaderComponent } from '../dashboard-header/dashboard-header.component';
import { AddJobModalComponent } from '../../shared/add-job-modal/add-job-modal.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent, DashboardHeaderComponent, AddJobModalComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  private readonly router = inject(Router);
  readonly auth = inject(AuthService);
  readonly store = inject(JobStoreService);

  readonly collapsed = signal(false);
  readonly mobileOpen = signal(false);

  private readonly url = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map(e => e.urlAfterRedirects),
      startWith(this.router.url)
    ),
    { initialValue: this.router.url }
  );

  readonly activeTab = computed<DashboardTab>(() => {
    const segments = this.url().split('/').filter(Boolean);
    return (segments[1] ?? 'attekintes') as DashboardTab;
  });

  readonly userName = computed(() => {
    const user = this.auth.currentUser();
    return user ? `${user.firstName} ${user.lastName}`.trim() : '';
  });

  readonly userEmail = computed(() => this.auth.currentUser()?.email ?? '');

  ngOnInit(): void {
    this.store.loadInitialData();
  }

  toggleCollapsed(): void {
    this.collapsed.update(v => !v);
  }

  openMobileMenu(): void {
    this.mobileOpen.set(true);
  }

  closeMobileMenu(): void {
    this.mobileOpen.set(false);
  }

  addJob(): void {
    this.store.openModal(null);
  }

  logout(): void {
    this.auth.logout();
  }
}
