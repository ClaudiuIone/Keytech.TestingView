import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SiteHeaderComponent } from '../../layout/site-header/site-header.component';
import { SiteFooterComponent } from '../../layout/site-footer/site-footer.component';
import { SeoService } from '../../core/seo.service';

interface FeatureBlock {
  title: string;
  summary: string;
  points: string[];
}

@Component({
  selector: 'app-features',
  standalone: true,
  imports: [SiteHeaderComponent, SiteFooterComponent, RouterLink],
  templateUrl: './features.component.html',
  styleUrl: './features.component.scss',
})
export class FeaturesComponent implements OnInit {
  private readonly seo = inject(SeoService);

  readonly intro =
    'TestingView adds backtesting sessions, simulated trades, risk sizing, journaling, statistics, and playback controls on top of TradingView — using the charts, indicators, and layouts you already work with.';

  readonly blocks: FeatureBlock[] = [
    {
      title: 'Sessions & workflow',
      summary: 'Organize practice into named sessions with capital, currency, and a start date you control.',
      points: [
        'Create, resume, clone, and delete backtesting sessions.',
        'Set starting capital, account currency, and session start date.',
        'ChronoShuffle — random start dates inside a past range for unbiased practice.',
        'Go to Time — jump to a specific date when no trade is open (plan limits apply).',
        'Review mode — revisit closed trades from the journal and return to the active session date.',
        'Multiple concurrent sessions on Trader.',
      ],
    },
    {
      title: 'Trade simulation & risk',
      summary: 'Test entries and exits with TradingView Long/Short Position tools and managed SL/TP/BE lines.',
      points: [
        'Open trades when price reaches your entry; gap-through entries open at the new candle open.',
        'Confirm Entries — optional dialog before a detected position opens.',
        'Risk and lot sizing from the position tool (fixed amount or percent of account).',
        'Move stop loss, take profit, and break-even lines after entry; rules keep levels valid.',
        'Automatic break-even on Explorer and Trader when price hits your BE trigger.',
        'Manual close from journal controls; spread/slippage modeling on Trader.',
        'Contract-size and currency conversion handled per symbol at entry.',
      ],
    },
    {
      title: 'Playback & candle control',
      summary: 'Step through history with controls built for accurate trade management, not just fast skipping.',
      points: [
        'Play/pause, step forward, fast-forward, and configurable minimum step resolution.',
        'Prevent Candle Previews — reduce higher-timeframe preview issues when switching intervals.',
        'Playback stop line, predefined hours (e.g. 09:30), and compatible chart-event stops.',
        'Blocks large steps while a trade is open so SL/TP/BE events are not skipped.',
        'Blocks navigation into future dates.',
        'Keyboard shortcuts on replay controls (shown in tooltips).',
      ],
    },
    {
      title: 'Multi-chart & multi-timeframe',
      summary: 'Use TradingView layouts to watch several symbols or timeframes in one session account.',
      points: [
        'Track trades per symbol with one shared balance, equity, and journal.',
        'Advance multiple charts together during backtesting.',
        'Capture snapshots from each chart in multi-chart layouts.',
        'Use any indicators your TradingView plan allows.',
      ],
    },
    {
      title: 'Journaling & snapshots',
      summary: 'Record what happened, why, and what the chart looked like at each decision.',
      points: [
        'Auto-save sessions, trades, columns, notes, and snapshots.',
        'Default columns: trade, time, price, symbol, lots, RR, risk, profit, run-up, drawdown, notes, and more.',
        'Custom columns on Explorer/Trader — text, numbers, checkboxes, dates, dropdown-style values.',
        'Auto Capture Trade Snapshots on entry, exit, TP/SL, and break-even events.',
        'Snapshot viewer — browse, copy, open, and delete saved chart snapshots.',
        'Excel journal export on Trader.',
        'Analysis Time — track how long you spend reviewing each trade.',
      ],
    },
    {
      title: 'Statistics & performance',
      summary: 'Measure whether a approach is working with session-level metrics and charts.',
      points: [
        'Profit, win rate, profit factor, average RR, expectancy, streaks, and drawdown.',
        'Equity curve and balance tracking in your session currency.',
        'Run-up and drawdown per trade; optimal SL/TP insights on supported plans.',
        'Hourly/monthly performance views where your plan allows.',
        'Filter and sort the journal by any column.',
      ],
    },
    {
      title: 'Accounts & plans',
      summary: 'Starter, Explorer, and Trader tiers match the permissions enforced in the extension.',
      points: [
        'Link TestingView to your Google account and TradingView username.',
        'Starter — resume sessions, up to 20 trades per session, up to 10 Go to Time uses.',
        'Explorer — up to 50 trades, break-even, advanced metrics, custom journal columns, unlimited Go to Time.',
        'Trader — unlimited trades, multiple sessions, Excel export, slippage/spreads, edit lots after entry.',
        'Subscriptions via Stripe; cancel anytime from the billing portal.',
      ],
    },
  ];

  ngOnInit(): void {
    this.seo.setPage({
      title: 'Features',
      description:
        'Explore TestingView backtesting sessions, simulated trades, journaling, statistics, playback controls, and plan capabilities on TradingView.',
      canonical: 'https://testingview.com/features',
    });
  }
}
