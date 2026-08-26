import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { DashboardMockupComponent } from './dashboard-mockup.component';
import { CtaBannerComponent } from "../cta-banner/cta-banner.component";

@Component({
  selector: 'app-landing-v2-dashboard-preview',
  standalone: true,
  imports: [RouterLink, TranslateModule, DashboardMockupComponent, CtaBannerComponent],
  templateUrl: './dashboard-preview.component.html',
  styleUrl: './dashboard-preview.component.css'
})
export class DashboardPreviewComponent {}
