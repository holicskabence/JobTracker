import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { scrollToFragment } from '../fragment-link';

@Component({
  selector: 'app-landing-v2-site-footer',
  standalone: true,
  imports: [RouterLink, TranslateModule],
  templateUrl: './site-footer.component.html',
  styleUrl: './site-footer.component.css'
})
export class SiteFooterComponent {
  onSectionLinkClick(event: MouseEvent, fragment: string): void {
    scrollToFragment(event, fragment);
  }
}
