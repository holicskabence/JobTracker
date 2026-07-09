import { Component, inject } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { ApplicationsViewService } from '../../../services/applications-view.service';
import { KanbanComponent } from '../kanban/kanban.component';
import { TableViewComponent } from '../../table-view/table-view.component';
import { PageSectionComponent } from '../../shared/page-section/page-section.component';

@Component({
  selector: 'app-applications-view',
  standalone: true,
  imports: [KanbanComponent, TableViewComponent, PageSectionComponent, TranslateModule],
  templateUrl: './applications-view.component.html',
  styleUrl: './applications-view.component.css'
})
export class ApplicationsViewComponent {
  readonly viewService = inject(ApplicationsViewService);
}
