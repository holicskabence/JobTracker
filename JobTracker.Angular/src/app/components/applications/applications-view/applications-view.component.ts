import { Component, inject, signal } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { ApplicationsViewService } from '../../../services/applications-view.service';
import { KanbanComponent } from '../kanban/kanban.component';
import { TableViewComponent } from '../../table-view/table-view.component';
import { PageSectionComponent } from '../../shared/page-section/page-section.component';
import { SearchToolbarComponent } from '../../shared/search-toolbar/search-toolbar.component';

@Component({
  selector: 'app-applications-view',
  standalone: true,
  imports: [KanbanComponent, TableViewComponent, PageSectionComponent, TranslateModule, SearchToolbarComponent],
  templateUrl: './applications-view.component.html',
  styleUrl: './applications-view.component.css'
})
export class ApplicationsViewComponent {
  readonly viewService = inject(ApplicationsViewService);
  readonly kanbanSearch = signal('');
}
