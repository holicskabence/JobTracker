import { Component } from '@angular/core';

@Component({
  selector: 'app-gauge-graphic',
  standalone: true,
  templateUrl: './gauge-graphic.component.html',
  styleUrl: './gauge-graphic.component.css'
})
export class GaugeGraphicComponent {
  readonly arcPath = 'M9 51 A41 41 0 0 1 91 51';
}
