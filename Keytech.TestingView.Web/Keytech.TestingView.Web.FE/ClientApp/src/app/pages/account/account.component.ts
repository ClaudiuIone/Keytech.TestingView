import { Component, OnInit, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { SiteHeaderComponent } from '../../layout/site-header/site-header.component';
import { SiteFooterComponent } from '../../layout/site-footer/site-footer.component';
import { ApiService, AccountInfo, PlanInfo } from '../../core/api.service';
import { SeoService } from '../../core/seo.service';

@Component({
  selector: 'app-account',
  standalone: true,
  imports: [SiteHeaderComponent, SiteFooterComponent, FormsModule, DatePipe],
  templateUrl: './account.component.html',
  styleUrl: './account.component.scss',
})
export class AccountComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly seo = inject(SeoService);
  private readonly route = inject(ActivatedRoute);

  account: AccountInfo | null = null;
  plans: PlanInfo[] = [];
  loading = true;
  error = '';
  success = '';
  username = '';
  saving = false;
  loggingOut = false;
  subscribing = false;
  readonly googleLoginHref = this.api.googleLoginUrl('/account');

  ngOnInit(): void {
    this.seo.setPage({
      title: 'Account',
      description: 'Manage your TestingView subscription and TradingView username.',
      noindex: true,
    });

    this.api.loadXsrf().subscribe();
    this.api.getSite().subscribe((s) => (this.plans = s.plans));
    this.loadAccount();

    this.route.queryParams.subscribe((q) => {
      if (q['checkout'] === 'success') this.success = 'Checkout completed. Your plan will update shortly.';
      if (q['checkout'] === 'cancelled') this.error = 'Checkout was cancelled.';
      if (q['error'] === 'google') this.error = 'Google sign-in failed. Please try again.';
    });
  }

  loadAccount(): void {
    this.loading = true;
    this.api.getAccount().subscribe({
      next: (a) => {
        this.account = a;
        this.username = a.tradingViewUsername || '';
        this.loading = false;
      },
      error: () => {
        this.account = null;
        this.loading = false;
      },
    });
  }

  saveUsername(): void {
    this.saving = true;
    this.error = '';
    this.success = '';
    this.api.updateTradingViewUsername(this.username).subscribe({
      next: () => {
        this.success = 'TradingView username updated.';
        this.loadAccount();
        this.saving = false;
      },
      error: (e) => {
        this.error = e.error?.error || 'Could not update username.';
        this.saving = false;
      },
    });
  }

  planButtonLabel(plan: PlanInfo): string {
    const isCurrent = this.account?.planId === plan.planId;
    const label = plan.monthlyPrice === 0 ? 'Get started' : 'Subscribe';
    return isCurrent ? `${label} (current)` : label;
  }

  choosePlan(plan: PlanInfo): void {
    if (!this.account || this.account.planId === plan.planId) return;
    if (plan.monthlyPrice === 0) return;
    this.subscribe(plan.planId);
  }

  subscribe(planId: string): void {
    this.subscribing = true;
    this.error = '';
    this.api.checkout(planId).subscribe({
      next: (r) => (window.location.href = r.url),
      error: (e) => {
        this.error = e.error?.error || 'Checkout unavailable.';
        this.subscribing = false;
      },
    });
  }

  openPortal(): void {
    this.api.billingPortal().subscribe({
      next: (r) => (window.location.href = r.url),
      error: (e) => (this.error = e.error?.error || 'Billing portal unavailable.'),
    });
  }

  logout(): void {
    this.loggingOut = true;
    this.error = '';
    this.success = '';
    this.api.logout().subscribe({
      next: () => this.finishLogout(),
      error: () => this.finishLogout(),
    });
  }

  private finishLogout(): void {
    this.account = null;
    this.username = '';
    this.loggingOut = false;
    this.success = '';
    this.error = '';
  }
}
