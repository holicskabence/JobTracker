import { Component, inject } from '@angular/core';
import { ApplicationsViewService } from '../../../services/applications-view.service';
import { KanbanComponent } from '../kanban/kanban.component';
import { TableViewComponent } from '../../table-view/table-view.component';

@Component({
  selector: 'app-applications-view',
  standalone: true,
  imports: [KanbanComponent, TableViewComponent],
  templateUrl: './applications-view.component.html'
})
export class ApplicationsViewComponent {
  readonly viewService = inject(ApplicationsViewService);
}
