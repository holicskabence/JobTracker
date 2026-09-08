import { Component } from '@angular/core';

@Component({
  selector: 'app-funnel-shape',
  standalone: true,
  templateUrl: './funnel-shape.component.html',
  styleUrl: './funnel-shape.component.css'
})
export class FunnelShapeComponent {
  readonly layers = [
    'M0 2 H132 L122 22 H10 Z',
    'M12 26 H120 L110 46 H22 Z',
    'M24 50 H108 L98 70 H34 Z',
    'M36 74 H96 L86 94 H46 Z'
  ];
}
