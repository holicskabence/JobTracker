import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-landing-button',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './landing-button.component.html',
  styleUrl: './landing-button.component.css'
})
export class LandingButtonComponent {
  @Input({ required: true }) routerLink!: string;
  @Input() variant: 'primary' | 'ghost' | 'cta' = 'primary';
  @Input() size: 'default' | 'lg' = 'default';
}
