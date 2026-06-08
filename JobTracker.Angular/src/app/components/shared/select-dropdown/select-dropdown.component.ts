import { Component, HostListener, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-select-dropdown',
  imports: [],
  templateUrl: './select-dropdown.component.html',
  styleUrl: './select-dropdown.component.css'
})
export class SelectDropdownComponent {
  @Input({ required: true }) options: readonly string[] = [];
  @Input() value = '';
  @Input() placeholder = 'Válassz…';
  @Output() valueChange = new EventEmitter<string>();

  isOpen = false;
  panelTop = 0;
  panelLeft = 0;
  panelWidth = 200;

  toggle(event: MouseEvent): void {
    event.stopPropagation();
    if (!this.isOpen) {
      const btn = event.currentTarget as HTMLElement;
      const r = btn.getBoundingClientRect();
      this.panelTop = r.bottom + 4;
      this.panelLeft = r.left;
      this.panelWidth = r.width;
    }
    this.isOpen = !this.isOpen;
  }

  pick(option: string, event: MouseEvent): void {
    event.stopPropagation();
    this.valueChange.emit(option);
    this.isOpen = false;
  }

  @HostListener('document:click')
  onDocClick(): void { this.isOpen = false; }
}
