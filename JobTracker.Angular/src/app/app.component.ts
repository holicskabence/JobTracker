import { Component, inject } from '@angular/core';
import { NavigationStart, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { ToastComponent } from './components/shared/toast/toast.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ToastComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'JobTracker.Angular';

  private readonly router = inject(Router);

  constructor() {
    // Reset while the leaving page is still scrollable: once the shell locks
    // the document, iOS Safari keeps the old offset and scrollTo no longer takes.
    this.router.events
      .pipe(filter((event): event is NavigationStart => event instanceof NavigationStart))
      .subscribe(() => window.scrollTo(0, 0));
  }
}
