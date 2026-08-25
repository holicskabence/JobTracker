import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { filter, map } from 'rxjs/operators';
import { TranslateModule } from '@ngx-translate/core';
import { ApplicationsView, ApplicationsViewService } from '../../../services/applications-view.service';

@Component({
  selector: 'app-applications-view-toggle',
  standalone: true,
  imports: [RouterLink, TranslateModule],
  templateUrl: './view-toggle.component.html',
  styleUrl: './view-toggle.component.css'
})
export class ApplicationsViewToggleComponent {
  readonly viewService = inject(ApplicationsViewService);
  private readonly router = inject(Router);

  private readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      map(() => this.router.url)
    ),
    { initialValue: this.router.url }
  );

  readonly historyActive = computed(() => this.currentUrl().startsWith('/dashboard/changes'));

  /** Which board view the control highlights, or null while the history view is open. */
  readonly activeBoardView = computed<ApplicationsView | null>(() =>
    this.historyActive() ? null : this.viewService.view()
  );

  selectBoardView(view: ApplicationsView): void {
    this.viewService.setView(view);
  }
}
