import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { AuthService } from '../../../services/auth.service';
import { IconComponent } from '../../shared/icon/icon.component';
import { WaveBackgroundComponent } from '../illustrations/wave-background/wave-background.component';
import { AreaChartGraphicComponent } from '../illustrations/area-chart-graphic/area-chart-graphic.component';
import { FunnelShapeComponent } from '../illustrations/funnel-shape/funnel-shape.component';
import { GaugeGraphicComponent } from '../illustrations/gauge-graphic/gauge-graphic.component';

@Component({
  selector: 'app-landing-analytics',
  standalone: true,
  imports: [RouterLink, TranslateModule, IconComponent, WaveBackgroundComponent, AreaChartGraphicComponent, FunnelShapeComponent, GaugeGraphicComponent],
  templateUrl: './analytics.component.html',
  styleUrl: './analytics.component.css'
})
export class AnalyticsComponent {
  private readonly auth = inject(AuthService);

  readonly ctaLink = computed(() => this.auth.isLoggedIn() ? '/dashboard/statistics' : '/register');
}
