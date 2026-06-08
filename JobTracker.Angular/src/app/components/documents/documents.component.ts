import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PlannerService } from '../../services/planner.service';
import { DOCUMENT_TYPES, OUTREACH_TEMPLATES } from '../../models/planner.model';
import { SelectDropdownComponent } from '../shared/select-dropdown/select-dropdown.component';

@Component({
  selector: 'app-documents',
  standalone: true,
  imports: [FormsModule, SelectDropdownComponent],
  templateUrl: './documents.component.html',
  styleUrl: './documents.component.css'
})
export class DocumentsComponent {
  readonly planner = inject(PlannerService);

  readonly docTypes = DOCUMENT_TYPES;
  readonly templates = OUTREACH_TEMPLATES;
  readonly copiedId = signal<number | null>(null);
  readonly templatesOpen = signal(false);

  toggleTemplates(): void {
    this.templatesOpen.update(open => !open);
  }

  readonly docFilter = signal('Mind');
  readonly filterOptions = ['Mind', ...DOCUMENT_TYPES] as const;

  readonly filteredDocuments = computed(() => {
    const f = this.docFilter();
    if (f === 'Mind') return this.planner.documents();
    return this.planner.documents().filter(d => d.type === f);
  });

  private copyTimer: ReturnType<typeof setTimeout> | null = null;

  newDocName = '';
  newDocType = 'Önéletrajz';
  newDocVersion = 'v1.0';
  submitted = false;

  submitDoc(): void {
    this.submitted = true;
    if (!this.newDocName.trim()) return;
    this.planner.addDocument({ name: this.newDocName.trim(), type: this.newDocType, version: this.newDocVersion });
    this.newDocName = '';
    this.newDocVersion = 'v1.0';
    this.submitted = false;
  }

  copyTemplate(text: string, id: number): void {
    navigator.clipboard.writeText(text);
    this.copiedId.set(id);
    if (this.copyTimer) clearTimeout(this.copyTimer);
    this.copyTimer = setTimeout(() => this.copiedId.set(null), 2500);
  }
}
