import { Component, Input } from '@angular/core';

export type IconName =
  | 'refresh'
  | 'caret-down'
  | 'caret-up'
  | 'arrow-down'
  | 'arrow-up'
  | 'pie'
  | 'info'
  | 'inbox'
  | 'users'
  | 'alert-circle'
  | 'alert-triangle'
  | 'arrow-down-long'
  | 'bookmark'
  | 'brain'
  | 'briefcase'
  | 'briefcase-line'
  | 'briefcase-outline'
  | 'calendar'
  | 'calendar-outline'
  | 'chart-bar'
  | 'chart-bars'
  | 'chart-line'
  | 'check'
  | 'check-circle'
  | 'check-thick'
  | 'chevron-down'
  | 'chevron-left'
  | 'chevron-right'
  | 'chevron-up'
  | 'circle-check-filled'
  | 'circle-check-thin'
  | 'clipboard-check'
  | 'clock'
  | 'close'
  | 'close-circle'
  | 'code'
  | 'columns'
  | 'copy'
  | 'database'
  | 'document-lines'
  | 'download'
  | 'edit'
  | 'external-link'
  | 'eye'
  | 'eye-off'
  | 'facebook'
  | 'file'
  | 'file-chart'
  | 'file-page'
  | 'file-text'
  | 'github'
  | 'github-outline'
  | 'globe'
  | 'google'
  | 'grid'
  | 'grid-squares'
  | 'help-circle'
  | 'history'
  | 'layers'
  | 'lightbulb'
  | 'link'
  | 'linkedin'
  | 'linkedin-outline'
  | 'list-bullet'
  | 'list-lines'
  | 'list-numbered'
  | 'lock'
  | 'log-out'
  | 'logo-mark'
  | 'logo-mark-filled'
  | 'mail'
  | 'maximize'
  | 'menu'
  | 'menu-thin'
  | 'minus-circle'
  | 'more-vertical'
  | 'plus'
  | 'save'
  | 'search'
  | 'settings'
  | 'sparkles'
  | 'spinner'
  | 'squares-four'
  | 'star'
  | 'target'
  | 'trash'
  | 'twitter'
  | 'upload';

const SELF_STYLED_ICONS = new Set<IconName>(['arrow-down-long', 'calendar-outline', 'chart-bars', 'check-thick', 'circle-check-filled', 'circle-check-thin', 'document-lines', 'facebook', 'file-page', 'github', 'google', 'grid-squares', 'linkedin', 'logo-mark', 'logo-mark-filled', 'menu-thin', 'more-vertical', 'star', 'twitter']);

const DEFAULT_STROKE_WIDTH: Partial<Record<IconName, number>> = {
  'save': 2.5,
  'check': 3,
  'check-circle': 2.5,
  'chevron-down': 2.5,
  'chevron-left': 2.5,
  'chevron-right': 2.5,
  'chevron-up': 2.5,
  'close': 2.5,
  'close-circle': 2.5,
  'download': 2.5,
  'edit': 2.5,
  'help-circle': 2.2,
  'maximize': 2.2,
  'menu': 2.5,
  'minus-circle': 2.5,
  'plus': 2.5,
  'search': 2.5,
  'sparkles': 2.2,
  'spinner': 2.5,
  'upload': 2.5,
};

const WRAPPER_FILL: Partial<Record<IconName, string>> = {
  'logo-mark': 'currentColor',
  'facebook': '#1877F2',
};

@Component({
  selector: 'app-icon',
  standalone: true,
  templateUrl: './icon.component.html',
  styleUrl: './icon.component.css'
})
export class IconComponent {
  @Input({ required: true }) name!: IconName;
  @Input() size?: number;
  @Input() strokeWidth?: number;
  @Input() fill?: string;

  get isSelfStyled(): boolean {
    return SELF_STYLED_ICONS.has(this.name);
  }

  get wrapperFill(): string | null {
    if (this.fill) return this.fill;
    return WRAPPER_FILL[this.name] ?? (this.isSelfStyled ? null : 'none');
  }

  get wrapperStroke(): string | null {
    return this.isSelfStyled ? null : 'currentColor';
  }

  get wrapperStrokeWidth(): number | null {
    if (this.isSelfStyled) return null;
    return this.strokeWidth ?? DEFAULT_STROKE_WIDTH[this.name] ?? 2;
  }

  get wrapperLineCap(): string | null {
    return this.isSelfStyled ? null : 'round';
  }
}
