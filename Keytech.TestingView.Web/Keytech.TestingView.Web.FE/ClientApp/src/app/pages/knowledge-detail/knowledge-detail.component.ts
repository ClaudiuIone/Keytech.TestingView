import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { SiteHeaderComponent } from '../../layout/site-header/site-header.component';
import { SiteFooterComponent } from '../../layout/site-footer/site-footer.component';
import { ApiService } from '../../core/api.service';
import { SeoService } from '../../core/seo.service';

@Component({
  selector: 'app-knowledge-detail',
  standalone: true,
  imports: [SiteHeaderComponent, SiteFooterComponent, RouterLink],
  templateUrl: './knowledge-detail.component.html',
  styleUrl: './knowledge-detail.component.scss',
})
export class KnowledgeDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly api = inject(ApiService);
  private readonly seo = inject(SeoService);

  slug = '';
  question = '';
  answer = '';
  notFound = false;

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      this.slug = params.get('slug') || '';
      this.api.getKnowledgeItem(this.slug).subscribe({
        next: (item) => {
          this.question = item.question;
          this.answer = item.answer;
          this.seo.setPage({
            title: item.question,
            description: item.answer.slice(0, 155),
            canonical: `https://testingview.com/knowledge-base/${this.slug}`,
            jsonLd: {
              '@context': 'https://schema.org',
              '@type': 'FAQPage',
              mainEntity: [{
                '@type': 'Question',
                name: item.question,
                acceptedAnswer: { '@type': 'Answer', text: item.answer },
              }],
            },
          });
        },
        error: () => (this.notFound = true),
      });
    });
  }
}
