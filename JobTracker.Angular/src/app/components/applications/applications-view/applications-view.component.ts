import { Component, computed, inject, signal } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { ApplicationsViewService } from '../../../services/applications-view.service';
import { JobStoreService } from '../../../services/job-store.service';
import { KanbanComponent } from '../kanban/kanban.component';
import { TableViewComponent } from '../../table-view/table-view.component';
import { PageSectionComponent } from '../../shared/page-section/page-section.component';
import { SearchToolbarComponent } from '../../shared/search-toolbar/search-toolbar.component';
import { ApplicationsViewToggleComponent } from '../view-toggle/view-toggle.component';

@Component({
  selector: 'app-applications-view',
  standalone: true,
  imports: [KanbanComponent, TableViewComponent, PageSectionComponent, TranslateModule, SearchToolbarComponent, ApplicationsViewToggleComponent],
  templateUrl: './applications-view.component.html',
  styleUrl: './applications-view.component.css'
})
export class ApplicationsViewComponent {
  readonly viewService = inject(ApplicationsViewService);
  private readonly store = inject(JobStoreService);

  readonly search = signal('');
  readonly resultCount = computed(() => this.store.filterJobs(this.search()).length);
}
