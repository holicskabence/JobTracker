import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { LandingComponent } from './components/landing/landing.component';
import { LoginComponent } from './components/auth/login/login.component';
import { RegisterComponent } from './components/auth/register/register.component';
import { DashboardComponent } from './components/layout/dashboard/dashboard.component';
import { OverviewComponent } from './components/overview/overview.component';
import { KanbanComponent } from './components/applications/kanban/kanban.component';
import { TableViewComponent } from './components/table-view/table-view.component';
import { EventsComponent } from './components/events/events.component';
import { DocumentsComponent } from './components/documents/documents.component';
import { StatisticsComponent } from './components/statistics/statistics.component';
import { MasterDataComponent } from './components/master-data/master-data.component';
import { ProfileComponent } from './components/profile/profile.component';
import { PracticeComponent } from './components/practice/practice.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'attekintes', pathMatch: 'full' },
      { path: 'attekintes', component: OverviewComponent },
      { path: 'jelentkezesek', component: KanbanComponent },
      { path: 'tablazat', component: TableViewComponent },
      { path: 'esemenyek', component: EventsComponent },
      { path: 'dokumentumok', component: DocumentsComponent },
      { path: 'statisztika', component: StatisticsComponent },
      { path: 'torzsadatok', component: MasterDataComponent },
      { path: 'profil', component: ProfileComponent },
      { path: 'gyakorlas', component: PracticeComponent },
    ]
  },
  { path: '', component: LandingComponent, pathMatch: 'full' },
  { path: '**', redirectTo: 'dashboard' }
];
