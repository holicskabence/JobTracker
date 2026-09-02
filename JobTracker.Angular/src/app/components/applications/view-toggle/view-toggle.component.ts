import { Component, inject } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { ApplicationsView, ApplicationsViewService } from '../../../services/applications-view.service';

@Component({
  selector: 'app-applications-view-toggle',
  standalone: true,
  imports: [TranslateModule],
  templateUrl: './view-toggle.component.html',
  styleUrl: './view-toggle.component.css'
})
export class ApplicationsViewToggleComponent {
  readonly viewService = inject(ApplicationsViewService);

  selectView(view: ApplicationsView): void {
    this.viewService.setView(view);
  }
}
