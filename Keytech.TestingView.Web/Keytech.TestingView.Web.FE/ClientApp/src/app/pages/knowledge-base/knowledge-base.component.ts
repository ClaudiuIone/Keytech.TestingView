import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SiteHeaderComponent } from '../../layout/site-header/site-header.component';
import { SiteFooterComponent } from '../../layout/site-footer/site-footer.component';
import { ApiService, KnowledgeCategory } from '../../core/api.service';
import { SeoService } from '../../core/seo.service';

@Component({
  selector: 'app-knowledge-base',
  standalone: true,
  imports: [SiteHeaderComponent, SiteFooterComponent, RouterLink],
  templateUrl: './knowledge-base.component.html',
  styleUrl: './knowledge-base.component.scss',
})
export class KnowledgeBaseComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly seo = inject(SeoService);

  categories: KnowledgeCategory[] = [];
  loadError = false;

  ngOnInit(): void {
    this.seo.setPage({
      title: 'Knowledge Base',
      description: 'Answers about TestingView backtesting, TradingView compatibility, plans, journaling, and playback controls.',
      canonical: 'https://testingview.com/knowledge-base',
    });

    this.api.getKnowledgeBase().subscribe({
      next: (doc) => {
        this.categories = doc.categories;
        this.loadError = doc.categories.length === 0;
      },
      error: () => (this.loadError = true),
    });
  }

  scrollToCategory(slug: string, event: Event): void {
    event.preventDefault();
    document.getElementById(slug)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}
