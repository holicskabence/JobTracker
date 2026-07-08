import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-page-section',
  standalone: true,
  templateUrl: './page-section.component.html',
  styleUrl: './page-section.component.css'
})
export class PageSectionComponent {
  @Input() title?: string;
  @Input() subtitle?: string;
}
