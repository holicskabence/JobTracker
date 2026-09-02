import { Component, EventEmitter, Input, Output } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-color-picker',
  standalone: true,
  imports: [TranslateModule],
  templateUrl: './color-picker.component.html',
  styleUrl: './color-picker.component.css'
})
export class ColorPickerComponent {
  @Input() value = '';
  @Output() valueChange = new EventEmitter<string>();

  readonly presets = ['#9b9b99', '#5fb9fa', '#f59e0b', '#26ac00', '#ef4444', '#8b5cf6', '#ec4899'];

  isSelected(preset: string): boolean {
    return this.value.toLowerCase() === preset;
  }

  get isCustomColor(): boolean {
    return !!this.value && !this.presets.includes(this.value.toLowerCase());
  }

  pick(color: string): void {
    this.value = color;
    this.valueChange.emit(color);
  }
}
