import { Component, Input } from '@angular/core';

export type BadgeVariant = 'green' | 'blue' | 'yellow' | 'red' | 'gray';

@Component({
  selector: 'app-badge',
  standalone: true,
  templateUrl: './badge.component.html',
  styleUrl: './badge.component.css',
  host: {
    '[class]': '"badge--" + variant'
  }
})
export class BadgeComponent {
  @Input() variant: BadgeVariant = 'gray';
}
