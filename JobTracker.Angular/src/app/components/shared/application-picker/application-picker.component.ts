import { Component, ElementRef, EventEmitter, HostListener, Input, Output, ViewChild } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { Job } from '../../../models/job.model';

@Component({
  selector: 'app-application-picker',
  standalone: true,
  imports: [TranslateModule],
  templateUrl: './application-picker.component.html',
  styleUrl: './application-picker.component.css'
})
export class ApplicationPickerComponent {
  @Input({ required: true }) applications: readonly Job[] = [];
  @Input() value: number | null = null;
  @Input() placeholder = 'shared.applicationPicker.placeholder';
  @Output() valueChange = new EventEmitter<number | null>();

  @ViewChild('searchField') private searchField?: ElementRef<HTMLInputElement>;

  isOpen = false;
  search = '';
  panelTop = 0;
  panelLeft = 0;
  panelWidth = 0;

  get selectedApplication(): Job | null {
    return this.applications.find(application => application.id === this.value) ?? null;
  }

  get filteredApplications(): readonly Job[] {
    const needle = this.search.trim().toLowerCase();
    if (!needle) return this.applications;
    return this.applications.filter(application =>
      `${application.company} ${application.position}`.toLowerCase().includes(needle)
    );
  }

  toggle(event: MouseEvent): void {
    event.stopPropagation();
    if (this.isOpen) {
      this.isOpen = false;
      return;
    }
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const panelHeight = Math.min(this.applications.length + 1, 5) * 46 + 58;
    const fitsBelow = window.innerHeight - rect.bottom - 8 >= panelHeight;
    this.panelTop = fitsBelow || rect.top < panelHeight ? rect.bottom + 4 : rect.top - panelHeight - 4;
    this.panelLeft = rect.left;
    this.panelWidth = rect.width;
    this.search = '';
    this.isOpen = true;
    setTimeout(() => this.searchField?.nativeElement.focus());
  }

  onSearch(event: Event): void {
    this.search = (event.target as HTMLInputElement).value;
  }

  pick(application: Job, event: MouseEvent): void {
    event.stopPropagation();
    this.valueChange.emit(application.id);
    this.isOpen = false;
  }

  clear(event: MouseEvent): void {
    event.stopPropagation();
    this.valueChange.emit(null);
    this.isOpen = false;
  }

  @HostListener('document:click')
  closePanel(): void {
    this.isOpen = false;
  }
}
