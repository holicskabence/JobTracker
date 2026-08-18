import { Component } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-landing-v2-site-footer',
  standalone: true,
  imports: [TranslateModule],
  templateUrl: './site-footer.component.html',
  styleUrl: './site-footer.component.css'
})
export class SiteFooterComponent {}
