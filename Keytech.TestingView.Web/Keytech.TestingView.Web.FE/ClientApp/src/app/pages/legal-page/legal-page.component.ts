import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { SiteHeaderComponent } from '../../layout/site-header/site-header.component';
import { SiteFooterComponent } from '../../layout/site-footer/site-footer.component';
import { SeoService } from '../../core/seo.service';

const LEGAL: Record<string, { title: string; description: string; body: string }> = {
  terms: {
    title: 'Terms & Conditions',
    description: 'TestingView.com terms and conditions of use.',
    body: `These Terms govern your use of TestingView.com and the TestingView extension.

TestingView extends TradingView with backtesting sessions, simulated positions, journaling, and analytics. You must maintain a valid TradingView account and comply with TradingView's terms.

Subscriptions are billed through Stripe. Plan features and limits are described on the pricing page and knowledge base.

You are responsible for your TradingView username linked to TestingView. Do not share account credentials.

We may update these Terms; continued use constitutes acceptance.`,
  },
  privacy: {
    title: 'Privacy Policy',
    description: 'How TestingView handles your data, Google Login, Stripe, and cookies.',
    body: `TestingView.com uses Google Login (OAuth) for authentication. We store your Google subject identifier, email, and display name in Web.ExternalLogins linked to Administration.Users.

Payments are processed by Stripe. We do not store card numbers. Stripe customer and subscription IDs are stored in Web.StripeCustomers and Web.StripeSubscriptions.

We store your TradingView username, plan, email, and session-related data in Administration.Users and related product schemas.

We use secure HTTP-only cookies for sessions. We do not sell personal data.

Contact: hello@testingview.com`,
  },
  refund: {
    title: 'Refund Policy',
    description: 'TestingView subscription refund policy.',
    body: `Paid subscriptions are managed through Stripe. You may cancel anytime via the billing portal; access typically continues until the end of the billing period.

Refund requests are reviewed case-by-case for billing errors or duplicate charges. Contact hello@testingview.com with your account email.

Free Starter access does not require payment.`,
  },
  accessibility: {
    title: 'Accessibility Statement',
    description: 'TestingView.com accessibility commitment (WCAG 2.1 AA target).',
    body: `We aim for WCAG 2.1 AA compliance on TestingView.com: semantic HTML, keyboard-accessible navigation and accordions, visible focus states, sufficient contrast, and reduced-motion support.

Videos include descriptive labels; captions are provided where available from product materials.

Report accessibility issues to hello@testingview.com.`,
  },
};

@Component({
  selector: 'app-legal-page',
  standalone: true,
  imports: [SiteHeaderComponent, SiteFooterComponent],
  templateUrl: './legal-page.component.html',
  styleUrl: './legal-page.component.scss',
})
export class LegalPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly seo = inject(SeoService);

  title = '';
  body = '';

  ngOnInit(): void {
    this.route.data.subscribe((data) => {
      const page = LEGAL[data['page'] as string] || LEGAL['terms'];
      this.title = page.title;
      this.body = page.body;
      this.seo.setPage({
        title: page.title,
        description: page.description,
        canonical: `https://testingview.com/${data['page'] === 'refund' ? 'refund-policy' : data['page']}`,
      });
    });
  }
}
