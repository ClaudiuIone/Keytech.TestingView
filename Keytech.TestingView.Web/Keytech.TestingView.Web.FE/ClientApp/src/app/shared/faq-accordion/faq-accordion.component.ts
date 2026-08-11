import { Component, Input } from '@angular/core';

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

@Component({
  selector: 'app-faq-accordion',
  standalone: true,
  templateUrl: './faq-accordion.component.html',
  styleUrl: './faq-accordion.component.scss',
})
export class FaqAccordionComponent {
  @Input() items: FaqItem[] = [];
  /** When true, questions and answers are always visible (no collapse). */
  @Input() showAnswers = false;
  openId: string | null = null;

  toggle(id: string): void {
    this.openId = this.openId === id ? null : id;
  }

  onKeydown(event: KeyboardEvent, id: string): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.toggle(id);
    }
  }
}
