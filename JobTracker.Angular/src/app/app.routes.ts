import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { langGuard } from './guards/lang.guard';
import { langRedirectGuard } from './guards/lang-redirect.guard';
import { langMatcher } from './utils/lang-route-matcher';
import { LandingV2Component } from './components/landing-v2/landing-v2.component';
import { LoginComponent } from './components/auth/login/login.component';
import { RegisterComponent } from './components/auth/register/register.component';
import { DashboardComponent } from './components/layout/dashboard/dashboard.component';
import { OverviewComponent } from './components/overview/overview.component';
import { ApplicationsViewComponent } from './components/applications/applications-view/applications-view.component';
import { ApplicationChangesComponent } from './components/application-changes/application-changes.component';
import { EventsComponent } from './components/events/events.component';
import { DocumentsComponent } from './components/documents/documents.component';
import { StatisticsComponent } from './components/statistics/statistics.component';
import { MasterDataComponent } from './components/master-data/master-data.component';
import { ProfileComponent } from './components/profile/profile.component';
import { PracticeComponent } from './components/practice/practice.component';
import { LandingComponent } from './components/landing/landing.component';

export const routes: Routes = [
  {
    matcher: langMatcher,
    canActivate: [langGuard],
    children: [
      { path: '', component: LandingV2Component, pathMatch: 'full' },
      { path: 'landing-v1', component: LandingComponent, pathMatch: 'full' },
      { path: 'login', component: LoginComponent },
      { path: 'register', component: RegisterComponent },
    ]
  },
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'overview', pathMatch: 'full' },
      { path: 'overview', component: OverviewComponent },
      { path: 'applications', component: ApplicationsViewComponent },
      { path: 'table', redirectTo: 'applications' },
      { path: 'changes', component: ApplicationChangesComponent },
      { path: 'events', component: EventsComponent },
      { path: 'documents', component: DocumentsComponent },
      { path: 'statistics', component: StatisticsComponent },
      { path: 'master-data', component: MasterDataComponent },
      { path: 'profile', component: ProfileComponent },
      { path: 'practice', component: PracticeComponent },
    ]
  },
  { path: 'login', canActivate: [langRedirectGuard], pathMatch: 'full', component: LoginComponent },
  { path: 'register', canActivate: [langRedirectGuard], pathMatch: 'full', component: RegisterComponent },
  { path: '', canActivate: [langRedirectGuard], pathMatch: 'full', component: LandingV2Component },
  { path: '**', redirectTo: 'dashboard' }
];
