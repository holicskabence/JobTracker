import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'th[appSortableHeaderCell]',
  standalone: true,
  templateUrl: './sortable-header-cell.component.html',
  styleUrl: './sortable-header-cell.component.css',
  host: {
    '(click)': 'sortClick.emit()'
  }
})
export class SortableHeaderCellComponent {
  @Input() active = false;
  @Input() direction: 'asc' | 'description' = 'asc';
  @Output() sortClick = new EventEmitter<void>();

  get icon(): string {
    if (!this.active) return '↕';
    return this.direction === 'asc' ? '↑' : '↓';
  }
}
