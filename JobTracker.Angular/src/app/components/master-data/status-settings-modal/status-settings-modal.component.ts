import { Component, EventEmitter, HostListener, OnChanges, Output, computed, signal, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { ColorPickerComponent } from '../../shared/color-picker/color-picker.component';
import { JobStatusConfig, STATUS_OUTCOMES, StatusOutcome, normalizeStatusConfig } from '../../../models/job.model';

type StatusFlag = 'countsAsApplication' | 'countsAsResponse' | 'isInterview' | 'isTerminal';

interface FlagRow {
  field: StatusFlag;
  on: boolean;
  lockedBy: string | null;
}

interface ImpactChip {
  key: string;
  color: string;
}

const DEFAULT_STALE_AFTER_DAYS = 21;

@Component({
  selector: 'app-status-settings-modal',
  standalone: true,
  imports: [FormsModule, TranslateModule, ColorPickerComponent],
  templateUrl: './status-settings-modal.component.html',
  styleUrl: './status-settings-modal.component.css'
})
export class StatusSettingsModalComponent implements OnChanges {
  @Input({ required: true }) config!: JobStatusConfig;
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<Partial<JobStatusConfig>>();

  readonly draft = signal<JobStatusConfig>({ key: '', label: '', color: '#5fb9fa' });
  readonly outcomes = STATUS_OUTCOMES;

  ngOnChanges(): void {
    this.draft.set(normalizeStatusConfig({
      ...this.config,
      description: this.config.description ?? '',
      outcome: this.config.outcome ?? 'Open'
    }));
  }

  private patch(changes: Partial<JobStatusConfig>): void {
    this.draft.update(current => normalizeStatusConfig({ ...current, ...changes }));
  }

  setLabel(value: string): void { this.patch({ label: value }); }
  setColor(value: string): void { this.patch({ color: value }); }
  setDescription(value: string): void { this.patch({ description: value }); }
  toggleKanban(): void { this.patch({ showInKanban: !(this.draft().showInKanban ?? true) }); }
  setOutcome(outcome: StatusOutcome): void { this.patch({ outcome }); }

  toggleFlag(field: StatusFlag): void {
    if (this.lockedBy(field)) return;
    this.patch({ [field]: !this.draft()[field] } as Partial<JobStatusConfig>);
  }

  /** Names the setting that forces this flag on, so a dead toggle always explains itself. */
  lockedBy(field: StatusFlag): string | null {
    const draft = this.draft();
    const closed = (draft.outcome ?? 'Open') !== 'Open';
    const decided = draft.outcome === 'Success' || draft.outcome === 'Rejected';
    if (field === 'countsAsApplication' && (draft.countsAsResponse || closed)) {
      return draft.countsAsResponse ? 'countsAsResponse' : 'outcome';
    }
    if (field === 'countsAsResponse' && (draft.isInterview || decided)) {
      return draft.isInterview ? 'isInterview' : 'outcome';
    }
    if (field === 'isTerminal' && closed) return 'outcome';
    return null;
  }

  readonly flagRows = computed<FlagRow[]>(() => {
    const draft = this.draft();
    const fields: StatusFlag[] = ['countsAsApplication', 'countsAsResponse', 'isInterview', 'isTerminal'];
    return fields.map(field => ({ field, on: !!draft[field], lockedBy: this.lockedBy(field) }));
  });

  readonly stalledTrackingAvailable = computed(() => !this.draft().isTerminal);
  readonly stalledTrackingOn = computed(() => !!this.draft().staleAfterDays);

  toggleStalledTracking(): void {
    this.patch({ staleAfterDays: this.stalledTrackingOn() ? null : DEFAULT_STALE_AFTER_DAYS });
  }

  /** Falls back to a day rather than null so clearing the field mid-edit cannot collapse the whole row. */
  setStaleAfterDays(value: string | number | null): void {
    const days = Math.trunc(Number(value));
    this.patch({ staleAfterDays: Number.isFinite(days) && days >= 1 ? Math.min(days, 365) : 1 });
  }

  readonly impactChips = computed<ImpactChip[]>(() => {
    const draft = this.draft();
    const chips: ImpactChip[] = [];
    if (draft.countsAsApplication) chips.push({ key: 'submitted', color: 'var(--clr-blue)' });
    if (draft.countsAsApplication && !draft.isTerminal) chips.push({ key: 'activePipeline', color: 'var(--clr-blue)' });
    if (draft.countsAsResponse) chips.push({ key: 'responseRate', color: 'var(--clr-yellow)' });
    if (draft.isInterview) chips.push({ key: 'interviewRate', color: 'var(--clr-yellow)' });
    if (draft.outcome === 'Success') chips.push({ key: 'successRate', color: 'var(--clr-green)' });
    if (draft.outcome === 'Rejected') chips.push({ key: 'rejections', color: 'var(--clr-red)' });
    if (draft.outcome === 'Withdrawn' || draft.outcome === 'Ghosted') chips.push({ key: 'closedNeutral', color: 'var(--clr-muted)' });
    if (draft.staleAfterDays) chips.push({ key: 'stalled', color: 'var(--clr-yellow)' });
    return chips;
  });

  submit(): void {
    const draft = this.draft();
    if (!draft.label.trim()) return;
    this.save.emit(draft);
  }

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('status-settings-backdrop')) this.close.emit();
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.close.emit();
  }
}
