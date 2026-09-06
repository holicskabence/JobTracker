import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Job, JobStatus, JobStatusHistoryEntry } from '../../../models/job.model';
import { WORK_MODES, WorkMode } from '../../../models/user.model';
import { CalendarEvent } from '../../../models/planner.model';
import { JobStoreService } from '../../../services/job-store.service';
import { PlannerService } from '../../../services/planner.service';
import { StatusDropdownComponent } from '../status-dropdown/status-dropdown.component';
import { AutocompleteInputComponent } from '../autocomplete-input/autocomplete-input.component';

type ModalTab = 'main' | 'details' | 'info';

@Component({
  selector: 'app-add-job-modal',
  standalone: true,
  imports: [FormsModule, StatusDropdownComponent, AutocompleteInputComponent, TranslateModule],
  templateUrl: './add-job-modal.component.html',
  styleUrl: './add-job-modal.component.css'
})
export class AddJobModalComponent implements OnChanges {
  @Input() editJob: Job | null = null;
  @Output() close = new EventEmitter<void>();

  readonly store = inject(JobStoreService);
  private readonly planner = inject(PlannerService);
  private readonly translate = inject(TranslateService);

  company = '';
  position = '';
  link = '';
  source = '';
  lastDetectedSource = '';
  status: JobStatus = '';
  salary = '';
  officeLocation = '';
  workMode: WorkMode | null = null;
  benefits = '';
  description = '';
  submitted = false;
  duplicate = false;
  activeTab: ModalTab = 'main';

  readonly workModes = WORK_MODES;

  private get defaultStatus(): JobStatus {
    return this.store.statusConfigs()[0]?.key ?? '';
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['editJob']) {
      const job = changes['editJob'].currentValue as Job | null;
      if (job) {
        this.company = job.company;
        this.position = job.position;
        this.link = job.link ?? '';
        this.source = job.source ?? '';
        this.lastDetectedSource = '';
        this.status = job.status;
        this.salary = job.salary ?? '';
        this.officeLocation = job.officeLocation ?? '';
        this.workMode = job.workMode ?? null;
        this.benefits = job.benefits ?? '';
        this.description = job.description ?? '';
      } else {
        this.company = '';
        this.position = '';
        this.link = '';
        this.source = '';
        this.lastDetectedSource = '';
        this.status = this.defaultStatus;
        this.salary = '';
        this.officeLocation = '';
        this.workMode = null;
        this.benefits = '';
        this.description = '';
        this.submitted = false;
      }
      this.duplicate = false;
      this.activeTab = 'main';
    }
  }

  toggleWorkMode(mode: WorkMode): void {
    this.workMode = this.workMode === mode ? null : mode;
  }

  onLinkChange(link: string): void {
    this.link = link;
    const detected = this.store.detectSource(link);
    if (!detected) return;
    if (!this.source.trim() || this.source === this.lastDetectedSource) this.source = detected;
    this.lastDetectedSource = detected;
  }

  get sourceOptions(): string[] {
    return this.store.sources().map(s => s.name);
  }

  get isEdit(): boolean { return this.editJob != null; }

  get daysInStatus(): number {
    return this.editJob ? this.store.daysInStatus(this.editJob) : 0;
  }

  get isStalled(): boolean {
    return !!this.editJob && this.store.isStalled(this.editJob);
  }

  get staleAfterDays(): number | null {
    return this.store.statusConfigs().find(config => config.key === this.editJob?.status)?.staleAfterDays ?? null;
  }

  get historyEntries(): JobStatusHistoryEntry[] {
    return this.editJob ? this.store.historyFor(this.editJob.id) : [];
  }

  get linkedEvents(): CalendarEvent[] {
    if (!this.editJob) return [];
    return this.planner.events()
      .filter(event => event.jobId === this.editJob!.id)
      .sort((a, b) => b.date.localeCompare(a.date) || b.time.localeCompare(a.time));
  }

  eventTypeColor(type: string): string { return this.planner.eventTypeColor(type); }
  eventTypeColorAlpha(type: string, alpha: number): string { return this.planner.eventTypeColorAlpha(type, alpha); }

  statusLabel(status: string): string { return this.store.labelFor(status); }
  statusColor(status: string): string { return this.store.colorFor(status); }
  statusColorAlpha(status: string, alpha: number): string { return this.store.colorAlpha(status, alpha); }

  fmtDate(value: string): string {
    if (!value) return '—';
    const locale = this.translate.currentLang === 'en' ? 'en-US' : 'hu-HU';
    return new Date(value).toLocaleDateString(locale, { year: 'numeric', month: 'short', day: 'numeric' });
  }

  fmtDateTime(value: string | undefined): string {
    if (!value) return '—';
    const locale = this.translate.currentLang === 'en' ? 'en-US' : 'hu-HU';
    return new Date(value).toLocaleString(locale, {
      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  }

  private isDuplicate(company: string, position: string): boolean {
    return this.store.jobs().some(j =>
      j.id !== this.editJob?.id &&
      j.company.trim().toLowerCase() === company.toLowerCase() &&
      j.position.trim().toLowerCase() === position.toLowerCase()
    );
  }

  submit(): void {
    this.submitted = true;
    this.duplicate = false;
    if (!this.company.trim() || !this.position.trim()) {
      this.activeTab = 'main';
      return;
    }

    const company = this.company.trim();
    const position = this.position.trim();

    if (this.isDuplicate(company, position)) {
      this.duplicate = true;
      this.activeTab = 'main';
      return;
    }

    const data = {
      company,
      position,
      link: this.link.trim() || undefined,
      source: this.source.trim() || undefined,
      status: this.status
    };
    if (this.isEdit) {
      this.store.updateJob(this.editJob!.id, {
        ...data,
        date: this.editJob!.date,
        salary: this.salary.trim() || null,
        officeLocation: this.officeLocation.trim() || null,
        workMode: this.workMode,
        benefits: this.benefits.trim() || null,
        description: this.description.trim() || null
      });
    } else {
      this.store.addJob(data);
    }
    this.close.emit();
  }

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal-backdrop')) {
      this.close.emit();
    }
  }
}
