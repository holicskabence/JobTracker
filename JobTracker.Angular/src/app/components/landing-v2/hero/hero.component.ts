import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { HeroIllustrationComponent } from './hero-illustration.component';

@Component({
  selector: 'app-landing-v2-hero',
  standalone: true,
  imports: [RouterLink, TranslateModule, HeroIllustrationComponent],
  templateUrl: './hero.component.html',
  styleUrl: './hero.component.css'
})
export class HeroComponent {}
