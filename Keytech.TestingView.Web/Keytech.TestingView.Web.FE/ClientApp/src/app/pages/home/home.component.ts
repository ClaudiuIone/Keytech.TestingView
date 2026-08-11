import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SiteHeaderComponent } from '../../layout/site-header/site-header.component';
import { SiteFooterComponent } from '../../layout/site-footer/site-footer.component';
import { FaqAccordionComponent, FaqItem } from '../../shared/faq-accordion/faq-accordion.component';
import { ApiService, PlanInfo, SiteConfig } from '../../core/api.service';
import { SeoService } from '../../core/seo.service';
import { forkJoin } from 'rxjs';

const HOME_FAQ_QUESTIONS = [
  'What is TestingView?',
  'Do I need a TradingView subscription to use TestingView?',
  'What plans are available?',
  'How do I start a TestingView session?',
  'How do I open a position in TestingView?',
  'Can I use multiple charts?',
  'Will TestingView skip candles when changing timeframes?',
  'What playback controls does TestingView add?',
  'What statistics are available?',
  'Can I change my TradingView username?',
];

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [SiteHeaderComponent, SiteFooterComponent, FaqAccordionComponent, RouterLink],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly seo = inject(SeoService);

  site: SiteConfig | null = null;
  plans: PlanInfo[] = [];
  faqItems: FaqItem[] = [];
  activeVideo = 0;
  loggedIn = false;
  planName = '';

  readonly videos = [
    { title: 'Creating your first session', src: '/assets/TestingView - Creating the first session.mp4', poster: '/assets/ss1.jpg' },
    { title: 'Opening a position', src: '/assets/TestingView - Opening a position.mp4', poster: '/assets/ss2.jpg' },
    { title: 'Statistics & performance', src: '/assets/TestingView - Statistics.mp4', poster: '/assets/ss3.jpg' },
  ];

  readonly features = [
    { title: 'Risk management', gif: '/assets/testingview-risk-management.gif', text: 'Size entries with stop loss, take profit, and risk controls tied to your session capital.' },
    { title: 'Stable timeframe switching', gif: '/assets/testingview-changing-timeframes.gif', text: 'Switch chart intervals without breaking session integrity or revealing unfinished candles.' },
    { title: 'Adaptive candle playback', gif: '/assets/testingview-skipping-candles.gif', text: 'Fast-forward, skip intervals, and step through candles with controls built for strategy testing.' },
    { title: 'Complete journaling', gif: '/assets/testingview-journaling.gif', text: 'Track trades with notes, snapshots, custom columns, and Excel export on supported plans.' },
  ];

  ngOnInit(): void {
    this.seo.setPage({
      title: 'The TradingView Backtesting Extension',
      description:
        'Backtest your TradingView strategy like it is live. Sessions, simulated trades, journaling, and measurable strategy testing on TradingView.',
      canonical: 'https://testingview.com/',
      jsonLd: [
        {
          '@context': 'https://schema.org',
          '@type': 'SoftwareApplication',
          name: 'TestingView',
          applicationCategory: 'FinanceApplication',
          operatingSystem: 'Web',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
        },
        {
          '@context': 'https://schema.org',
          '@type': 'Organization',
          name: 'TestingView',
          url: 'https://testingview.com',
        },
      ],
    });

    this.api.loadXsrf().subscribe();
    forkJoin({
      site: this.api.getSite(),
      kb: this.api.getKnowledgeBase(),
    }).subscribe({
      next: ({ site, kb }) => {
        if (!site || !kb) return;
        this.site = site;
        this.plans = site.plans;
        const all = kb.categories.flatMap((c) => c.items);
        this.faqItems = HOME_FAQ_QUESTIONS.map((q) => {
          const match = all.find((i) => i.question === q);
          const slug = match?.slug ?? q.toLowerCase().replace(/[^a-z0-9]+/g, '-');
          return { id: slug, question: q, answer: match?.answer ?? '' };
        });
        this.seo.setPage({
          title: 'The TradingView Backtesting Extension',
          description:
            'Backtest your TradingView strategy like it is live. Sessions, simulated trades, and journaled evidence on TradingView.',
          canonical: 'https://testingview.com/',
          jsonLd: {
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: this.faqItems.map((f) => ({
              '@type': 'Question',
              name: f.question,
              acceptedAnswer: { '@type': 'Answer', text: f.answer },
            })),
          },
        });
      },
    });

    this.api.getAccount().subscribe({
      next: (a) => {
        this.loggedIn = true;
        this.planName = a.planName;
      },
      error: () => (this.loggedIn = false),
    });
  }

  selectVideo(index: number): void {
    this.activeVideo = index;
  }
}
