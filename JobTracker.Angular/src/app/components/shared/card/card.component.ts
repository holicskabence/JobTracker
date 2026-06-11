import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-card',
  standalone: true,
  templateUrl: './card.component.html',
  styleUrl: './card.component.css',
  host: {
    '[class.card--radius-md]': "radius === 'md'",
    '[class.card--radius-xl]': "radius === 'xl'",
    '[class.card--padding-lg]': "padding === 'lg'",
    '[class.card--padding-none]': "padding === 'none'",
    '[class.card--gap-none]': "gap === 'none'"
  }
})
export class CardComponent {
  @Input() radius: 'md' | 'lg' | 'xl' = 'lg';
  @Input() padding: 'card' | 'lg' | 'none' = 'card';
  @Input() gap: 'card' | 'none' = 'card';
}
