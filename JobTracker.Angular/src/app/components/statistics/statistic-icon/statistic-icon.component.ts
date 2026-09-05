import { Component, Input } from '@angular/core';

export type StatisticIconName =
  | 'briefcase' | 'users' | 'inbox' | 'clock' | 'layers'
  | 'info' | 'pie' | 'star' | 'calendar' | 'sparkles' | 'check-circle'
  | 'arrow-up' | 'arrow-down' | 'caret-up' | 'caret-down' | 'refresh' | 'check';

@Component({
  selector: 'app-statistic-icon',
  standalone: true,
  templateUrl: './statistic-icon.component.html',
  styleUrl: './statistic-icon.component.css'
})
export class StatisticIconComponent {
  @Input({ required: true }) name!: StatisticIconName;
  @Input() size = 18;
}
