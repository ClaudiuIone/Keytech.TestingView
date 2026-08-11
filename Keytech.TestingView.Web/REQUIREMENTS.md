# TestingView.com Presentation Website Requirements

## 1. Purpose

Build a catchy, sales-focused presentation website for `TestingView.com`, implemented as an Angular frontend with an ASP.NET/C# backend.

The website must present TestingView as a TradingView backtesting and chart-based strategy testing product that helps traders find, test, measure, and improve trading strategies.

Primary goals:

- Convert visitors into subscribers.
- Clearly explain TestingView features using existing product behavior from the extension/API.
- Provide account management for TradingView username and subscriptions.
- Replace the existing Wix marketing site with an owned Angular + ASP.NET implementation.
- Preserve the Wix site's visual identity and content structure while renaming `eBacktesting.com` to `TestingView.com`.
- Improve SEO for search intent around backtesting, TradingView testing, chart-based trading practice, finding trading strategies, and testing trading strategies.

## 2. Project Location

The implementation must live in:

`C:\proj\Keytech\Sources\Keytech.TestingView\Keytech.TestingView.Web\Keytech.TestingView.Web.FE`

The project must be independently runnable during development and deployable as the public TestingView.com website.

## 3. Technology Stack

Frontend:

- full Angular app (SSR/prerender for SEO optimization)
- Responsive, accessible, component-based UI.
- Public marketing pages must be SEO-friendly, preferably SSR/prerendered or served with complete crawlable HTML for critical content.
- Use local resources from the Resources folder, but also remote Wix assets where those are not found locally
- ensure there are dedicated pages (+links) for privacy policy and terms of service

Backend:

- ASP.NET Core / C#.
- SQL Server connection to existing TestingView database (SQL1 instance on localhost).
- respect the same pattern and references used throughout all the other codebases in D:\Proj\Keytech\Sources\Keytech.TestingView
- create the stored procedures and/or functions needed for this to work in the same fashion as the other codebases
- Stripe integration for checkout, subscription management, cancellation, upgrades, and webhooks.
- Google Login/OAuth for user sign-in
- Send emails whenever a user needs to receive emails (on payments, cancellations, tradingview username changes, using these email credentials:
	username: hello@admin
	password: (see User Secrets `testingview-web-fe-secrets` / password manager — never commit)
	smtp server: mail.testingview.com
	port: 587
	security type: starttls (accept all certificates)
- Secure cookie/session handling.

Database:

- SQL Server instance: `.\SQL1`.
- Integrated Windows authentication.
- Database: `TestingView`.
- Existing user table: `Administration.Users`.
- Existing plans/permissions should be reused where possible.
- Any new website-specific tables must be created under the `Web` schema.

Existing connection string pattern:

```json
"Server=lpc:.\\SQL1;Database=TestingView;Integrated Security=SSPI;TrustServerCertificate=True;"
```

## 4. Reference Site Requirement

The website must be an exact presentation replacement for:

`https://claudiuin.wixsite.com/ebacktesting`

Required changes from the Wix reference:

- Replace every user-facing instance of `eBacktesting.com`, `eBacktesting`, and related branding with `TestingView.com` or `TestingView`.
- Keep the same overall section order:
  - Header/navigation.
  - Hero.
  - Video/product preview area.
  - Feature section.
  - Pricing section.
  - Questions & Answers.
  - Community/social/footer.
- Keep the same dark red/purple/navy atmosphere, cream typography, large bold hero type, dark chart imagery, and pricing card rhythm.
- Remove Wix-specific branding, banners, scripts, trackers, and generated DOM.
- Replace Wix member/account behavior with the new ASP.NET + database-backed account system.

Acceptance criteria:

- First viewport immediately communicates `TestingView.com`.
- Hero headline is comparable to the Wix reference but uses TestingView naming.
- Main CTA buttons are visible without scrolling on desktop and mobile.
- Pricing plans visually resemble the Wix pricing section.
- Q&A accordion visually resembles the Wix Q&A section.
- The site does not depend on Wix at runtime.

## 5. Visual Assets

Use resources from:

`C:\proj\Keytech\Sources\Keytech.TestingView\Keytech.TestingView.Web\Resources\`

Asset categories:

- Logos: `logo.svg`, `logo-*.png`, `TV-x-TestingView.ico`, `TV-x-TestingView.png`.
- Hero/background: `banner.jpg`, promo tiles, screenshots.
- Pricing plan images: `starter-plan.jpg`, `edge-plan.jpg`, `master-plan.jpg`.
- Feature GIFs/videos:
  - `testingview-risk-management.gif`
  - `testingview-changing-timeframes.gif`
  - `testingview-skipping-candles.gif`
  - `testingview-journaling.gif`
  - `testingview-open-trade.gif`
  - `TestingView - Creating the first session.mp4`
  - `TestingView - Opening a position.mp4`
  - `TestingView - Statistics.mp4`
  - Other matching product videos in Resources.
- SRT files must inform text and captions:
  - Creating first session: practice strategy like live, create session, choose date/time, starting balance/currency, measurable training.
  - Opening a position: chart-based long/short positions, risk, entry, SL/TP.
  - Statistics: win rate, profit factor, average RR, Sharpe, expectancy, drawdown, run-up, clickable charts, forecast, performance by hour/month, optimal SL/TP, trading costs, Excel export.
  - Skipping candles and switching timeframes: candle playback control, skip behavior, timeframe safety.

Best practices:

- Serve assets from the ASP.NET static file pipeline.
- Use optimized image variants for mobile and desktop.
- Use lazy loading below the fold.
- Add poster images for videos.
- Add captions/transcripts where practical for accessibility and SEO.

## 6. Content Source Requirements

Marketing text must be derived from:

- Wix reference structure and visible content.
- SRT files in the Resources folder.
- Extension frontend code in:
  `C:\proj\Keytech\Sources\Keytech.TestingView\Keytech.TestingView.API\wwwroot\js`
- Exclude addon files:
  `addon.*.js`
- Backend/API code in:
  `C:\proj\Keytech\Sources\Keytech.TestingView\Keytech.TestingView.API`
- Knowledge base:
  `C:\proj\Keytech\Sources\Keytech.TestingView\Keytech.TestingView.Web\Resources\TestingView_Knowledge_Base_QA.md`
- throughout all the texts, mentioning of turning replay mode into backtesting/simulation should not be present - That's an implementation choice behind the scenes - The user doesn't have to know it's based on Replay mode. Just mention that it extends TradingView, it adds new features, it's on top of its existing features, but don't mention it's using replay mode.


Extracted product themes to present:

- TradingView-native workflow.
- Testing session creation and resume.
- Session capital, currency, start date/time.
- ChronoShuffle/randomized practice.
- Chart-based long/short position testing and tracking.
- Entry, stop loss, take profit, quantity, risk sizing.
- Automatic and manual trade close handling.
- Break-even rules.
- Spread/slippage/trading cost realism.
- Multi-chart, multi-timeframe, and multi-symbol workflows.
- Prevent candle previews and safe timeframe switching.
- Fast-forward, skip intervals, playback speed, stop lines, predefined stop times, and chart event stops.
- Journaling with default and custom columns.
- Notes and snapshots.
- Excel export.
- Analysis time.
- Review mode.
- Advanced statistics, equity curve, drawdown/run-up, profit factor, expectancy, Sharpe, optimal SL/TP, forecasting, hourly/monthly performance.
- Plan limits and permissions.

## 7. Main Page Requirements

The homepage must be highly sales-oriented and structured for conversion.

Required sections:

1. Header
   - Logo and `TestingView.com`.
   - Navigation: Home, Features, Pricing, Q&A, Knowledge Base, Account/Login.
   - Sticky or persistent enough to support long-page navigation.
   - Account state indicator when logged in.

2. Hero
   - Large headline centered around TradingView backtesting and strategy testing.
   - Example positioning: `The TradingView Backtesting Extension`.
   - Strong subcopy using SEO/search terms naturally:
     - backtesting
     - TradingView testing
     - chart-based trading practice
     - test trading strategy
     - find trading strategy
   - CTA buttons:
     - Get extension.
     - Desktop app / Download.
     - Choose plan.
   - Hero image/video using local resources.

3. Product Preview
   - Video or screenshot carousel inspired by the Wix site.
   - Show at least three product clips:
     - First session.
     - Opening a position.
     - Statistics.
   - Videos should be playable but not intrusive.

4. Feature Summary
   - Sales copy: smart, neat, chart-based testing, made for TradingView.
   - Bullet list explaining why TestingView extends TradingView.
   - Feature cards:
     - Risk management.
     - Stable timeframe switching.
     - Adaptive skipping / playing candles.
     - Complete journaling.
   - Use GIFs/screenshots from Resources.

5. Deep Feature Blocks
   - Session workflow.
   - Trade testing/risk.
   - Journaling and snapshots.
   - Statistics and strategy optimization.
   - Playback safety and candle control.
   - Multi-chart and multi-timeframe testing.

6. Pricing
   - Three plans: Starter, Explorer, Trader.
   - Must connect to Stripe for paid plans.
   - Must reflect existing DB plan IDs and permissions.
   - Each plan card includes image, price, trial text, key benefits, CTA.

7. Top 10 Q&A
   - Main page should include the 10 most important Q&A items.
   - Remaining items go to a separate Knowledge Base page.

8. Community/Footer
   - Discord-focused support/community CTA.
   - Social links.
   - Legal links:
     - Terms & Conditions.
     - Privacy Policy.
     - Refund Policy.
     - Accessibility Statement.

## 8. Top 10 Homepage Q&A

Select these 10 items from `TestingView_Knowledge_Base_QA.md` for the homepage:

1. What is TestingView?
2. Does TestingView replace TradingView?
3. Do I need a TradingView subscription to use TestingView?
4. How do I start a TestingView session?
5. How do I open a position in TestingView?
6. Can I use multiple charts?
7. Will TestingView skip candles when changing timeframes?
8. What playback controls does TestingView add?
9. What statistics are available?
10. Can I change my TradingView username?

Homepage Q&A behavior:

- Accordion UI.
- Keyboard accessible.
- Deep-linkable question IDs.
- Search-visible text.
- Include FAQ structured data for the 10 homepage questions.

## 9. Knowledge Base Page Requirements

Create a separate knowledge base route/page:

- `/knowledge-base`
- Optional detail route:
  `/knowledge-base/{slug}`

Source:

- `TestingView_Knowledge_Base_QA.md`

Requirements:

- Render all Q&A content grouped by category.
- Include search/filter by keyword.
- Include category tabs or side navigation:
  - Platform & Compatibility.
  - Trading Mechanics & Session Logic.
  - Risk & Trade Management.
  - Journaling & Session Management.
  - Plans, Limits & Access.
  - Playing Candles, Skipping & Playback Controls.
- Generate stable slugs for questions.
- Add FAQ schema where appropriate.
- Make content crawlable without requiring client-side interaction.
- Provide links back to pricing and account pages where relevant.

Edge cases:

- Markdown file missing.
- Duplicate question text.
- Unsupported characters/emoji in source Markdown.
- Very long answers.
- Empty category.
- Search returns no results.

## 10. Account Requirements

Users must be able to:

- Log in with Google.
- Log in or link by email where needed.
- View current subscription plan.
- Upgrade subscription.
- Cancel subscription.
- Change TradingView username.
- See current TradingView username.
- See billing/customer portal link when a Stripe customer exists.
- Recover gracefully if no Stripe customer exists yet.

Google Login:

- Use Google OAuth/OpenID Connect.
- Store Google subject and email in a `Web` schema table, linked to `Administration.Users`.
- Do not store Google access tokens unless absolutely necessary.
- If tokens are stored, encrypt at rest.
- Support only verified Google emails for account linking.
- If Google email matches `Administration.Users.Email`, link to that user.
- If no matching user exists, create an `Administration.Users` record with default Starter/None plan behavior and prompt for TradingView username.
- Allow an existing user to link Google login after email-based account creation.
- Client ID: 499773943853-ncggn5gomqri1mirm7h57gjnlrcbtjrt.apps.googleusercontent.com
- Client secret: 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

Suggested new tables:

- `Web.ExternalLogins`
  - `ExternalLoginId`
  - `UserId`
  - `Provider`
  - `ProviderSubject`
  - `Email`
  - `DisplayName`
  - `PictureUrl`
  - `CreatedAt`
  - `UpdatedAt`
  - unique index on `Provider + ProviderSubject`
- `Web.AccountAuditEvents`
  - User changes, login, username change, Stripe events, cancellation requests.

TradingView username changes:

- Update `Administration.Users.TradingViewUsername`.
- Validate not empty.
- Trim whitespace.
- Prevent invalid characters if TradingView username format is known.
- Warn user that extension access is tied to this username.
- Handle duplicate username collisions.
- Confirm change succeeded.
- Show last updated time.

Security:

- Use secure, HTTP-only cookies.
- Use anti-forgery protection for state-changing requests.
- SameSite cookie policy compatible with Google OAuth and Stripe redirects.
- Rate-limit login and account mutation endpoints.
- Log account changes without logging secrets.

## 11. Existing Database Requirements

Use existing database:

- SQL Server: `.\SQL1`
- Database: `TestingView`
- Integrated Windows authentication.

Existing tables to use:

- `Administration.Users`
  - `UserId`
  - `PlanId`
  - `Email`
  - `PlanExpiration`
  - `TradingViewUsername`
  - `LanguageCode`
  - `TradingViewUserJson`
- `Administration.Plans`
  - Existing plan definitions.
- `Administration.PlanPermissions`
  - Existing feature permissions.

Known plan IDs:

- Starter: `926563c2-0644-44a9-b7bb-374ebad41209`
- Explorer: `749fbcef-e865-4f15-9ceb-9d99a02301dd`
- Trader: `1bd92829-0577-4177-9b7a-0a9b0e8dd4ed`
- None: `00000000-0000-0000-0000-000000000000`

Any new tables:

- Must use `Web` schema.
- Must include creation/update timestamps.
- Must include appropriate unique indexes.
- Must not duplicate core user/plan state unnecessarily.

Suggested new `Web` tables:

- `Web.ExternalLogins`
- `Web.StripeCustomers`
- `Web.StripeSubscriptions`
- `Web.StripeEvents`
- `Web.AccountAuditEvents`
- `Web.ContactMessages` if the site includes a contact form.

## 12. Stripe Requirements

Pricing must connect to Stripe.

Important security requirement:

- Do not commit live Stripe secret keys to source control.
- Configure live Stripe keys through deployment secrets, user secrets, environment variables, Azure/App Service settings, or equivalent secure storage.
- The live secret shared during planning should be rotated before production deployment.

Required Stripe features:

- Checkout session creation for paid plans.
- Customer portal session creation for subscription management/cancellation.
- Webhook endpoint for subscription lifecycle events.
- Plan upgrade/downgrade handling.
- Cancellation handling.
- Payment failure handling.
- Trial handling.
- Metadata linking Stripe objects to `Administration.Users.UserId` and plan IDs.


Pricing:

- Starter: `$0`
- Explorer: `$7.99/month`, 7-day free trial.
- Trader: `$9.99/month`, 14-day free trial.

Stripe metadata requirements:

- `userId`
- `planId`
- `planName`
- `tradingViewUsername`
- `email`

Webhook events to handle:

- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_succeeded`
- `invoice.payment_failed`

Subscription state mapping:

- Active subscription maps to correct `Administration.Users.PlanId`.
- Trialing subscription should grant plan access until trial ends.
- Past due may keep or reduce access depending business decision.
- Canceled/expired subscription should set user to Starter/None or keep access until current period end.
- `PlanExpiration` must be updated from Stripe subscription period end.

Edge cases:

- Stripe webhook delivered twice.
- Stripe webhook arrives before checkout redirect completes.
- User changes TradingView username after subscribing.
- User uses a different Google email than Stripe email.
- User starts checkout but abandons it.
- Stripe customer exists but no active subscription.
- User downgrades from Trader to Explorer.
- User cancels during trial.
- Payment fails after trial.
- Subscription metadata missing or malformed.
- Webhook signature invalid.
- Secret key missing in development.

## 13. SEO Requirements

The website must have excellent SEO around:

- backtesting
- TradingView testing
- chart-based trading practice
- find trading strategy
- test trading strategy
- TradingView backtesting extension
- backtesting journal
- trading strategy simulator

Technical SEO:

- Unique `<title>` and meta description per page.
- Canonical URLs.
- OpenGraph and Twitter card metadata.
- JSON-LD structured data:
  - `SoftwareApplication`
  - `Product`
  - `FAQPage`
  - `BreadcrumbList`
  - `Organization`
- Sitemap: `/sitemap.xml`
- Robots: `/robots.txt`
- Clean URLs.
- Crawlable homepage and knowledge base content.
- Server-rendered or prerendered HTML for public content.
- Optimized Core Web Vitals:
  - LCP under 2.5s target.
  - CLS near 0.
  - INP under 200ms target.
- Descriptive alt text for images and videos.
- Transcript/caption content from SRT files where possible.

Content SEO:

- Use target keywords naturally in headings, paragraphs, FAQ, image alt text, and page metadata.
- Avoid keyword stuffing.
- Include copy such as:
  - "Backtest your TradingView strategy like it is live."
  - "Extend TradingView with measurable strategy testing."
  - "Find and test your trading strategy with journaled evidence."
  - "Practice entries, stops, targets, and decision-making inside TradingView."
- Create internal links:
  - Homepage to pricing.
  - Homepage to knowledge base.
  - Knowledge base to pricing/account.
  - Feature sections to relevant Q&A anchors.

Edge cases:

- Angular-only rendering must not hide important SEO text from crawlers.
- Dynamic account routes should be `noindex`.
- Checkout/account pages should be `noindex`.
- Query params from Stripe redirects should canonicalize to clean URLs.

## 14. UI/UX Requirements

Visual style:

- Dark red/purple/navy gradient background inspired by Wix.
- Cream/off-white headline typography.
- Large, bold, confident hero.
- Product imagery is the first-viewport visual signal.
- Salesy but credible tone.
- Use actual TestingView screenshots, GIFs, and videos.
- Avoid generic stock-like imagery.

Modern UX:

- Clear CTAs above the fold.
- Sticky navigation.
- Smooth section anchors.
- Pricing cards with clear plan differences.
- Account panel or account page that feels simple and focused.
- Upgrade/cancel actions must be obvious but safe.
- Q&A categories and search.
- Loading states for API calls.
- Empty states and error states.
- Confirmation states for username update and cancellation.

Accessibility:

- WCAG 2.1 AA target.
- Semantic HTML.
- Keyboard-accessible navigation, modal/panel, accordions, and forms.
- Visible focus states.
- Correct labels for all inputs.
- Sufficient contrast.
- Reduced motion support.
- Captions/transcripts for videos where possible.
- ARIA only where semantic HTML is insufficient.

Responsive behavior:

- Desktop, tablet, and mobile layouts.
- No text overlap.
- Buttons and cards must not resize unpredictably.
- Videos must preserve aspect ratio.
- Pricing cards stack cleanly on mobile.
- Navigation must remain usable on small screens.

Best practices:

- Do not use visible instructional text to explain UI mechanics unless needed.
- Do not nest cards inside cards.
- Keep page sections full-width with constrained inner content.
- Use stable layout dimensions to avoid CLS.
- Use icons where they improve scannability.
- Do not rely on a one-note color palette; keep enough contrast and accent variety.

## 15. Backend/API Requirements

Core endpoints:

- `GET /api/site`
  - Returns site config, plans, public Stripe publishable key.
- `GET /api/account/me`
  - Returns authenticated user account and plan.
- `POST /api/auth/google/start`
  - Starts Google login.
- `GET /api/auth/google/callback`
  - Completes Google login.
- `POST /api/account/tradingview-username`
  - Updates TradingView username.
- `POST /api/billing/checkout`
  - Creates Stripe Checkout session.
- `POST /api/billing/portal`
  - Creates Stripe Customer Portal session.
- `POST /api/billing/cancel`
  - Cancels subscription or redirects to portal cancellation.
- `POST /api/stripe/webhook`
  - Handles Stripe webhooks.
- `GET /knowledge-base`
  - Serves knowledge base page.
- `GET /sitemap.xml`
- `GET /robots.txt`

API best practices:

- Validate all input.
- Return structured JSON errors.
- Never expose secret keys.
- Never trust client-provided plan prices.
- Look up plan IDs server-side.
- Verify Stripe webhook signatures.
- Use idempotency for webhook processing.
- Use correlation IDs/logging.
- Keep authentication and authorization checks server-side.

## 16. Subscription/Plan Requirements

Plan display:

- Show Starter, Explorer, Trader.
- Show price, trial, best-fit copy, and features.
- Highlight recommended plan if desired, likely Trader.
- Clearly show active plan when logged in.

Plan permissions from existing product:

- Starter:
  - Basic backtesting.
  - Limited trades, max 20 in a session.
  - Basic journaling and performance metrics.
  - Limited trade management.
- Explorer:
  - Higher session trade limit, approximately 50 trades.
  - Automatic break-even.
  - Advanced trading/performance metrics.
  - Go to date/time customization.
- Trader:
  - Multiple backtesting sessions.
  - Unlimited trades.
  - Slippage and spreads.
  - Full journaling and export.
  - Broadest access.

Edge cases:

- User selects current plan.
- User selects Starter while on paid plan.
- User upgrades mid-cycle.
- User downgrades mid-cycle.
- Stripe says active but DB is stale.
- DB says active but Stripe says canceled.
- Plan expiration has passed.
- User has no plan.

## 17. Legal, Privacy, and Compliance Requirements

Required legal pages:

- `/terms`
- `/privacy`
- `/refund-policy`
- `/accessibility`

Privacy requirements:

- Explain use of Google Login.
- Explain Stripe as payment processor.
- Explain TradingView username use.
- Explain data stored in `Administration.Users` and `Web` schema tables.
- Explain cookies/session usage.

Payment compliance:

- Do not process card data directly.
- Use Stripe Checkout/Portal (Secret token: sk_org_live_0eF6Iubqe5nkgBtgZt7zccWC9D41hZ6j15EsfK21p83q97u979r8593BL5GK5597Bx80i51x6NZ3pt3lg3Cl7lq5tD4Gr5lz6tT3L03GQ5tq5dn4JX7pc4CJ05F0xg08neoj8lf7286CydJSfVudN6aqe0qp6s37OT4AgbtF4TT1GX60AeJG3yXdG68PH60ve8mg0QbHr4448uufL5gYz9VB5nw5mW03)
- Do not store card numbers.

Security:

- HTTPS required in production.
- Secure cookies.
- HSTS in production.
- CSP recommended.
- No live secrets in repo.
- Sensitive logs redacted.

## 18. Performance Requirements

Targets:

- Public homepage should load quickly even with videos.
- Videos below the fold should lazy-load.
- Use optimized images and dimensions.
- Avoid layout shifts.
- Minify and cache static assets.
- Enable compression.
- Use long cache headers for versioned assets.

Edge cases:

- Slow video download.
- Missing asset.
- Browser blocks autoplay.
- Mobile low bandwidth.
- First load after deployment.

## 19. Testing Requirements

Automated tests:

- Backend unit tests for:
  - Plan lookup.
  - User lookup/update.
  - Google login account linking.
  - Stripe webhook handling.
  - TradingView username validation.
- Integration tests for:
  - SQL Server access where feasible.
  - Checkout session creation with mocked Stripe.
  - Webhook idempotency.
- Frontend tests for:
  - Pricing plan rendering.
  - Account login state.
  - Username update form.
  - Q&A accordion.
  - Knowledge base filtering.

Manual/browser checks:

- Desktop visual parity with Wix reference.
- Mobile visual parity.
- Login with Google.
- Existing user account linkage.
- Change TradingView username.
- Upgrade to paid plan.
- Cancel plan.
- Stripe webhook sync.
- SEO metadata present.
- Sitemap and robots respond.
- Knowledge base renders all Q&A.

Browser verification:

- Use the in-app browser for local checks at `http://localhost:5130`.
- Take screenshots at desktop and mobile breakpoints.
- Check console for runtime errors.

## 20. Acceptance Criteria

The work is complete when:

- The website runs from the required project folder.
- Homepage visually matches the Wix reference structure and tone with TestingView branding.
- All public content uses local TestingView assets.
- Main page includes the top 10 selected Q&A.
- Knowledge base page includes the rest of the Q&A.
- Account login supports Google.
- Account uses `Administration.Users`.
- TradingView username can be changed and persisted.
- Stripe checkout, portal, cancellation, upgrade, and webhook flows are implemented.
- Existing plans and plan IDs are respected.
- New tables, if any, are under `Web` schema.
- SEO metadata, sitemap, robots, structured data, and crawlable content are present.
- The website is responsive, accessible, and visually polished.
- No live secret keys are committed to source.
- Backend and frontend tests/verification pass.