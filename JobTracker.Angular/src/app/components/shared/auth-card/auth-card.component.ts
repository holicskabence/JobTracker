import { Component, Input } from '@angular/core';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'app-auth-card',
  standalone: true,
  imports: [IconComponent],
  templateUrl: './auth-card.component.html',
  styleUrl: './auth-card.component.css'
})
export class AuthCardComponent {
  @Input() title = '';
  @Input() subtitle = '';
  @Input() maxWidth = '420px';
}
