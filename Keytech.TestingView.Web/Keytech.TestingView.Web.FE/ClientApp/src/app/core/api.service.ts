import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, tap } from 'rxjs';

export interface SiteConfig {
  baseUrl: string;
  extensionUrl: string;
  desktopAppUrl: string;
  discordUrl: string;
  stripePublishableKey: string;
  stripe?: {
    checkoutReady: boolean;
    webhooksReady: boolean;
    webhookUrl: string;
    usesInlinePriceData: boolean;
  };
  plans: PlanInfo[];
}

export interface PlanInfo {
  planId: string;
  name: string;
  monthlyPrice: number;
  trialDays: number | null;
  imageUrl: string;
  recommended: boolean;
  benefits: string[];
}

export interface AccountInfo {
  userId: string;
  email: string;
  tradingViewUsername: string;
  planId: string;
  planName: string;
  planExpiration: string;
  billingPortalUrl: string | null;
  hasStripeCustomer: boolean;
}

export interface KnowledgeCategory {
  slug: string;
  title: string;
  items: { slug: string; question: string; answer: string }[];
}

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);
  private xsrfToken = '';
  /** Send auth and antiforgery cookies on API calls (required behind HTTPS / Cloudflare). */
  private readonly credentials = { withCredentials: true };

  loadXsrf(): Observable<{ token: string }> {
    return this.http.get<{ token: string }>('/api/antiforgery/token', this.credentials).pipe(
      tap((r) => (this.xsrfToken = r.token))
    );
  }

  getSite(): Observable<SiteConfig> {
    return this.http.get<SiteConfig>('/api/site');
  }

  getAccount(): Observable<AccountInfo> {
    return this.http.get<AccountInfo>('/api/account/me', this.credentials);
  }

  getKnowledgeBase(): Observable<{ categories: KnowledgeCategory[] }> {
    return this.http.get<{ categories: KnowledgeCategory[] }>('/api/knowledge-base');
  }

  getKnowledgeItem(slug: string): Observable<{ slug: string; question: string; answer: string }> {
    return this.http.get<{ slug: string; question: string; answer: string }>(`/api/knowledge-base/${slug}`);
  }

  updateTradingViewUsername(username: string): Observable<unknown> {
    return this.http.post('/api/account/tradingview-username', { username }, this.postOptions());
  }

  checkout(planId: string): Observable<{ url: string }> {
    return this.http.post<{ url: string }>('/api/billing/checkout', { planId }, this.postOptions());
  }

  billingPortal(): Observable<{ url: string }> {
    return this.http.post<{ url: string }>('/api/billing/portal', {}, this.postOptions());
  }

  googleLoginUrl(returnUrl = '/account'): string {
    return `/api/auth/google/start?returnUrl=${encodeURIComponent(returnUrl)}`;
  }

  logout(): Observable<void> {
    return this.http.post<void>('/api/auth/logout', {}, this.postOptions());
  }

  private postOptions() {
    const headers = new HttpHeaders({ 'X-XSRF-TOKEN': this.xsrfToken });
    return { ...this.credentials, headers };
  }
}
