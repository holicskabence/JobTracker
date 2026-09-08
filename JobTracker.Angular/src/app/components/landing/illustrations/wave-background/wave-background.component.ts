import { Component } from '@angular/core';

@Component({
  selector: 'app-wave-background',
  standalone: true,
  templateUrl: './wave-background.component.html',
  styleUrl: './wave-background.component.css'
})
export class WaveBackgroundComponent {
  readonly rings = Array.from({ length: 20 }, (_, index) => ({
    radius: 300 + index * 80,
    strokeOpacity: (0.95 - index * 0.02).toFixed(3)
  }));
}
