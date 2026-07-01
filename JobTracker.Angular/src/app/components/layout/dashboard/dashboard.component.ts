import { Component, ElementRef, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import { gsap } from 'gsap';
import { DashboardTab } from '../../../models/job.model';
import { JobStoreService } from '../../../services/job-store.service';
import { PlannerService } from '../../../services/planner.service';
import { PracticeService } from '../../../services/practice.service';
import { AuthService } from '../../../services/auth.service';
import { ApplicationsViewService } from '../../../services/applications-view.service';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { DashboardHeaderComponent } from '../dashboard-header/dashboard-header.component';
import { AddJobModalComponent } from '../../shared/add-job-modal/add-job-modal.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    RouterOutlet,
    SidebarComponent,
    DashboardHeaderComponent,
    AddJobModalComponent,
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit, OnDestroy {
  readonly store = inject(JobStoreService);
  readonly planner = inject(PlannerService);
  readonly practice = inject(PracticeService);
  readonly auth = inject(AuthService);
  readonly viewService = inject(ApplicationsViewService);
  private router = inject(Router);
  private el: ElementRef<HTMLElement> = inject(ElementRef);

  readonly activeTab = signal<DashboardTab>('attekintes');
  readonly sidebarCollapsed = signal(false);
  readonly sidebarMobileOpen = signal(false);

  readonly modalOpen = this.store.modalOpen;
  readonly editingJob = this.store.editingJob;

  private routerSub?: Subscription;

  ngOnInit(): void {
    this.store.loadInitialData();
    this.planner.loadAll();
    this.practice.loadAll();
    this.syncTab(this.router.url);
    this.routerSub = this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe(e => this.syncTab((e as NavigationEnd).urlAfterRedirects));
  }

  ngOnDestroy(): void {
    this.routerSub?.unsubscribe();
  }

  private syncTab(url: string): void {
    const seg = url.split('/').filter(Boolean).pop() as DashboardTab;
    const valid: DashboardTab[] = [
      'attekintes', 'jelentkezesek', 'valtozasok', 'esemenyek',
      'dokumentumok', 'statisztika', 'torzsadatok', 'profil', 'gyakorlas'
    ];
    this.activeTab.set(valid.includes(seg) ? seg : 'attekintes');
  }

  navigateToTab(tab: DashboardTab): void {
    this.router.navigate(['/dashboard', tab]);
    this.sidebarMobileOpen.set(false);
  }

  onRouteActivate(): void {
    const main = this.el.nativeElement.querySelector<HTMLElement>('.content-body');
    if (main) {
      gsap.fromTo(main, { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.38, ease: 'power3.out', clearProps: 'transform' });
    }
  }

  logout(): void { this.auth.logout(); }
  openAddModal(): void { this.store.openModal(null); }
  closeModal(): void { this.store.closeModal(); }
}
