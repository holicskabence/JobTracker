import { Component } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { IconComponent } from '../../shared/icon/icon.component';

@Component({
  selector: 'app-landing-feature-strip',
  standalone: true,
  imports: [TranslateModule, IconComponent],
  templateUrl: './feature-strip.component.html',
  styleUrl: './feature-strip.component.css'
})
export class FeatureStripComponent {}
