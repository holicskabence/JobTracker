import { Component, ElementRef, HostListener, Input, inject, signal } from '@angular/core';

@Component({
  selector: 'app-filter-dropdown',
  standalone: true,
  templateUrl: './filter-dropdown.component.html',
  styleUrl: './filter-dropdown.component.css'
})
export class FilterDropdownComponent {
  @Input() label = '';
  @Input() leadingIcon: 'calendar' | 'none' = 'none';
  @Input() active = false;
  @Input() panelAlign: 'left' | 'right' = 'left';

  private readonly elementRef = inject<ElementRef<HTMLElement>>(ElementRef);

  readonly isOpen = signal(false);

  toggle(): void {
    this.isOpen.update(open => !open);
  }

  close(): void {
    this.isOpen.set(false);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target as Node)) this.close();
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.close();
  }
}
