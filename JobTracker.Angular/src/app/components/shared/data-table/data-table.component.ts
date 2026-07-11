import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-data-table',
  standalone: true,
  templateUrl: './data-table.component.html',
  styleUrl: './data-table.component.css',
  host: {
    '[class.data-table--sticky]': 'stickyHeader',
    '[class.data-table--compact]': "mobileBreakpoint === 'compact'"
  }
})
export class DataTableComponent {
  @Input() stickyHeader = true;
  @Input() mobileBreakpoint: 'default' | 'compact' = 'default';
}
