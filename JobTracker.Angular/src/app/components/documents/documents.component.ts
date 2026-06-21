import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgTemplateOutlet } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { PlannerService } from '../../services/planner.service';
import { DOCUMENT_TYPES, OUTREACH_TEMPLATES } from '../../models/planner.model';
import { SelectDropdownComponent } from '../shared/select-dropdown/select-dropdown.component';
import { CardComponent } from '../shared/card/card.component';
import { EmptyStateComponent } from '../shared/empty-state/empty-state.component';
import { BreakpointService } from '../../services/breakpoint.service';
import { PageHeaderComponent } from '../shared/page-header/page-header.component';

const DOC_TYPE_KEYS: Record<string, string> = {
  'Mind': 'documents.typeAll',
  'Önéletrajz': 'documents.typeResume',
  'Kísérőlevél': 'documents.typeCoverLetter',
  'Egyéb': 'documents.typeOther'
};

@Component({
  selector: 'app-documents',
  standalone: true,
  imports: [FormsModule, NgTemplateOutlet, SelectDropdownComponent, CardComponent, EmptyStateComponent, TranslateModule, PageHeaderComponent],
  templateUrl: './documents.component.html',
  styleUrl: './documents.component.css'
})
export class DocumentsComponent {
  readonly planner = inject(PlannerService);
  readonly breakpoint = inject(BreakpointService);
  private readonly translate = inject(TranslateService);

  readonly docTypes = DOCUMENT_TYPES;
  readonly templates = OUTREACH_TEMPLATES;
  readonly copiedId = signal<number | null>(null);
  readonly templatesOpen = signal(false);
  readonly formOpen = signal(false);

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

  readonly noDocumentsMessage = computed(() => {
    const f = this.docFilter();
    return f !== 'Mind'
      ? this.translate.instant('documents.noDocumentsOfType', { type: this.typeLabel(f) })
      : this.translate.instant('documents.noDocuments');
  });

  typeLabel(type: string): string {
    const key = DOC_TYPE_KEYS[type];
    return key ? this.translate.instant(key) : type;
  }

  private copyTimer: ReturnType<typeof setTimeout> | null = null;

  newDocName = '';
  newDocType = 'Önéletrajz';
  newDocVersion = 'v1.0';
  selectedFile: File | null = null;
  submitted = false;
  uploadingId = signal<number | null>(null);

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.selectedFile = input.files?.[0] ?? null;
  }

  submitDoc(): void {
    this.submitted = true;
    if (!this.newDocName.trim()) return;
    const file = this.selectedFile;
    this.planner.addDocumentWithFile(
      { name: this.newDocName.trim(), type: this.newDocType, version: this.newDocVersion },
      file ?? undefined
    );
    this.newDocName = '';
    this.newDocVersion = 'v1.0';
    this.selectedFile = null;
    this.submitted = false;
    this.formOpen.set(false);
  }

  openAddForm(): void {
    this.formOpen.set(true);
  }

  closeForm(): void {
    this.formOpen.set(false);
    this.newDocName = '';
    this.newDocVersion = 'v1.0';
    this.selectedFile = null;
    this.submitted = false;
  }

  onUploadFile(id: number, event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    this.uploadingId.set(id);
    this.planner.uploadDocumentFile(id, file, () => this.uploadingId.set(null));
    input.value = '';
  }

  downloadFile(id: number, fileName: string): void {
    this.planner.downloadDocumentFile(id, fileName);
  }

  copyTemplate(text: string, id: number): void {
    navigator.clipboard.writeText(text);
    this.copiedId.set(id);
    if (this.copyTimer) clearTimeout(this.copyTimer);
    this.copyTimer = setTimeout(() => this.copiedId.set(null), 2500);
  }
}
