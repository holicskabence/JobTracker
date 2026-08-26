import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-landing-interview-prep',
  standalone: true,
  imports: [RouterLink, TranslateModule],
  templateUrl: './interview-prep.component.html',
  styleUrl: './interview-prep.component.css'
})
export class InterviewPrepComponent {}
