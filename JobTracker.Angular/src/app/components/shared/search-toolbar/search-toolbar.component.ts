import { Component, EventEmitter, Input, Output } from '@angular/core';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'app-search-toolbar',
  standalone: true,
  imports: [IconComponent],
  templateUrl: './search-toolbar.component.html',
  styleUrl: './search-toolbar.component.css',
  host: {
    '[class.search-toolbar--compact]': "size === 'compact'"
  }
})
export class SearchToolbarComponent {
  @Input() value = '';
  @Input() placeholder = '';
  @Input() clearTitle = '';
  @Input() countLabel = '';
  @Input() size: 'default' | 'compact' = 'default';
  @Output() valueChange = new EventEmitter<string>();

  onInput(event: Event): void {
    this.valueChange.emit((event.target as HTMLInputElement).value);
  }

  onClear(): void {
    this.valueChange.emit('');
  }
}
