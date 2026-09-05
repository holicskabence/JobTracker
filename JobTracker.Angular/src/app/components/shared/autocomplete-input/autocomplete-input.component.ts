import { Component, ElementRef, HostListener, Input, Output, EventEmitter, ViewChild } from '@angular/core';

@Component({
  selector: 'app-autocomplete-input',
  standalone: true,
  templateUrl: './autocomplete-input.component.html',
  styleUrl: './autocomplete-input.component.css'
})
export class AutocompleteInputComponent {
  @Input({ required: true }) options: readonly string[] = [];
  @Input() value = '';
  @Input() placeholder = '';
  @Input() inputId = '';
  @Output() valueChange = new EventEmitter<string>();

  @ViewChild('textField') textField?: ElementRef<HTMLInputElement>;

  isOpen = false;
  panelTop = 0;
  panelLeft = 0;
  panelWidth = 0;

  get filteredOptions(): readonly string[] {
    const needle = this.value.trim().toLowerCase();
    if (!needle) return this.options;
    const matches = this.options.filter(option => option.toLowerCase().includes(needle));
    return matches.length > 0 ? matches : this.options;
  }

  onInput(event: Event): void {
    this.value = (event.target as HTMLInputElement).value;
    this.valueChange.emit(this.value);
    this.openPanel(event.target as HTMLElement);
  }

  onFieldClick(event: MouseEvent): void {
    event.stopPropagation();
    this.openPanel(event.currentTarget as HTMLElement);
  }

  toggle(event: MouseEvent): void {
    event.stopPropagation();
    if (this.isOpen) {
      this.isOpen = false;
      return;
    }
    this.openPanel(this.textField?.nativeElement ?? (event.currentTarget as HTMLElement));
    this.textField?.nativeElement.focus();
  }

  pick(option: string, event: MouseEvent): void {
    event.stopPropagation();
    this.value = option;
    this.valueChange.emit(option);
    this.isOpen = false;
  }

  clear(event: MouseEvent): void {
    event.stopPropagation();
    this.value = '';
    this.valueChange.emit('');
    this.isOpen = false;
  }

  private openPanel(anchor: HTMLElement): void {
    const rect = anchor.getBoundingClientRect();
    const estimatedHeight = Math.min(this.filteredOptions.length, 6) * 38 + 10;
    this.panelLeft = rect.left;
    this.panelWidth = rect.width;
    this.panelTop = window.innerHeight - rect.bottom - 8 >= estimatedHeight || rect.top < estimatedHeight
      ? rect.bottom + 4
      : rect.top - estimatedHeight - 4;
    this.isOpen = true;
  }

  @HostListener('document:click')
  closePanel(): void {
    this.isOpen = false;
  }
}
