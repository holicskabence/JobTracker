import { Component } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-landing-feature-strip',
  standalone: true,
  imports: [TranslateModule],
  templateUrl: './feature-strip.component.html',
  styleUrl: './feature-strip.component.css'
})
export class FeatureStripComponent {}
