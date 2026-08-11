import { Component } from '@angular/core';

interface QaItem {
  question: string;
  answer: string;
}

interface QaCategory {
  id: string;
  icon: string;
  title: string;
  items: QaItem[];
}

interface VisibleQaItem extends QaItem {
  index: number;
}

@Component({
  selector: 'app-qa',
  imports: [],
  templateUrl: './qa.component.html',
  styleUrl: './qa.component.scss'
})
export class QaComponent {
  readonly categoryWindowSize = 3;

  readonly categories: QaCategory[] = [
    {
      id: 'platform',
      icon: '??',
      title: 'Platform & Compatibility',
      items: [
        {
          question: 'What is TestingView and how does it work?',
          answer:
            '<p>TestingView is a Chrome extension or desktop app that turns TradingView\'s Bar Replay into a full-featured backtesting tool. It lets you simulate trades, journal positions, and manage multiple pairs directly on your chart.</p>'
        },
        {
          question: 'How do I open a position in TestingView?',
          answer:
            '<p>Draw a <strong>Long Position</strong> or <strong>Short Position</strong> tool on chart, set your risk/quantity, then play candles until entry gets hit. TestingView detects the shape and opens the trade in the journal automatically.</p>'
        },
        {
          question: 'Will it skip candles when changing timeframes?',
          answer:
            '<p>It can, depending on your settings. With <strong>Prevent candle previews when changing timeframes</strong> enabled, TestingView re-aligns replay to avoid inaccurate candle previews, then advances cleanly to your replay point.</p>'
        },
        {
          question: 'Do I need a TradingView subscription to use it?',
          answer:
            '<p>You can use TestingView on supported TradingView plans, but replay resolution limits follow your TradingView subscription. If your plan lacks lower-timeframe replay, TestingView automatically falls back to supported intervals.</p>'
        },
        {
          question: 'Can I use multiple charts on TestingView?',
          answer:
            '<p>Yes. TestingView is built for <strong>multi-chart</strong> workflows, including synchronized session tracking, multi-symbol journaling, and per-chart snapshot capture.</p>'
        }
      ]
    },
    {
      id: 'mechanics',
      icon: '??',
      title: 'Trading Mechanics & Session Logic',
      items: [
        {
          question: 'How does timeframe switching work in TestingView?',
          answer:
            '<p>To avoid previewing a higher timeframe candle\'s close, TestingView will <strong>step back one bar</strong> on the higher timeframe and then <strong>advance forward minute by minute (or hour by hour)</strong> to your last replay point.</p><p>This smart behavior can be turned off from the session\'s settings if you prefer manual control.</p>'
        },
        {
          question: 'What\'s the minimum skip-by interval?',
          answer:
            '<p>The minimum skip interval is tied to your available replay resolutions and session timeframe settings. You can pick your preferred <strong>Minimum step forward</strong> in Settings, and fast-forward uses that base granularity.</p>'
        },
        {
          question: 'What are “predefined hours” and how do they work?',
          answer:
            '<p>You can configure a list of specific times (e.g., 09:30, 12:00, 15:30) where candle skipping will <strong>automatically pause</strong>.</p><p>This feature is perfect for:</p><ul><li>Stopping at market open or close</li><li>Reviewing price behavior at key session times</li><li>Practicing timing-based entries</li></ul><p>Go to <strong>Settings &gt; Options &gt; Stop at Hours (HH:mm)</strong> and add preferred markers.</p>'
        },
        {
          question: 'Can I backtest multiple pairs at once?',
          answer:
            '<p>Yes. You can open multiple charts and <strong>backtest multiple symbols in parallel</strong>, tracking trades and journaling them separately per symbol.</p>'
        },
        {
          question: 'Does TestingView account for Daylight Saving Time (DST)?',
          answer:
            '<p>Yes. Session-time and go-to-date logic relies on timezone-aware calculations, including UTC offset shifts across DST changes, so predefined stops and replay jumps remain aligned with exchange local time.</p>'
        }
      ]
    },
    {
      id: 'risk',
      icon: '??',
      title: 'Risk & Trade Management',
      items: [
        {
          question: 'How is risk and lot size calculated?',
          answer:
            '<p>Risk is derived from entry-to-stop distance, quantity, contract size, point size, and currency conversion at entry. TestingView reads symbol contract rules and computes position risk in your selected session currency.</p>'
        },
        {
          question: 'Is PnL displayed in my session\'s currency?',
          answer:
            '<p>Yes. Each position\'s profit or loss is shown in your selected <strong>account currency</strong>, and conversions are handled from the symbol quote currency.</p><p>TestingView fetches the exchange rate at position entry and reuses it consistently for risk, profit, run-up, and drawdown.</p>'
        },
        {
          question: 'Can I move my stop loss or take profit after the trade is placed?',
          answer:
            '<p>Yes. You can move SL/TP directly on chart after entry. TestingView validates invalid levels (e.g., SL above current price on longs), stores each change in position history, and updates risk metrics in the journal.</p>'
        },
        {
          question: 'Can I set automatic Break-Even (BE) levels?',
          answer:
            '<p>Yes. If your plan includes auto-BE, once BE is hit TestingView can move SL to entry automatically, capture BE run-up, and optionally trigger an auto snapshot.</p>'
        },
        {
          question: 'How does skipping candles work when using fast-forward?',
          answer:
            '<p>Fast-forward moves candle-by-candle using valid replay intervals and stops automatically on configured events (predefined times, chart-event plots, user stop lines, or risk events). This prioritizes consistent backtest state over blind jumps.</p>'
        }
      ]
    },
    {
      id: 'journaling',
      icon: '??',
      title: 'Journaling & Session Management',
      items: [
        {
          question: 'Can TestingView capture snapshots automatically?',
          answer:
            '<p>Yes. Enable <strong>Auto capture trade snapshots</strong> to store chart images on entry, TP/SL hit, BE hit, and manual close. Snapshots are linked to each position in the journal.</p>'
        },
        {
          question: 'Can I customize the journal columns?',
          answer:
            '<p>Yes (plan dependent). You can reorder, hide, rename, and add custom columns with text, numbers, date/time, rich text, or enum values.</p>'
        },
        {
          question: 'Can I clone sessions with positions included?',
          answer:
            '<p>Yes. Sessions can be cloned (including positions), renamed, and resumed from the sessions dialog.</p>'
        },
        {
          question: 'Can I export my trading journal data?',
          answer:
            '<p>Yes (plan dependent). Session stats and position tables can be exported to Excel/CSV using the Statistics panel export action.</p>'
        },
        {
          question: 'What is review mode?',
          answer:
            '<p>Review mode lets you inspect past trades by jumping to trade dates from the journal and replaying position context without opening new trades.</p>'
        }
      ]
    },
    {
      id: 'accounts',
      icon: '??',
      title: 'Accounts Licensing',
      items: [
        {
          question: 'How is my subscription linked to TradingView?',
          answer:
            '<p>Your TestingView plan is validated against your TradingView username. Make sure the username on your TestingView account matches the one currently logged in on TradingView.</p>'
        },
        {
          question: 'Are my backtested trades linked to my account?',
          answer:
            '<p>Yes. Sessions, positions, journal fields, and snapshots are stored per account, so you can resume where you left off across devices.</p>'
        },
        {
          question: 'Can I change my TradingView username?',
          answer:
            '<p>If your TradingView username changes, update it in your TestingView account so plan permissions and session access remain synced.</p>'
        },
        {
          question: 'Can I cancel my plan anytime?',
          answer:
            '<p>Yes. You can stop renewal at any time from your billing dashboard. Access usually remains active through the end of your paid period.</p>'
        },
        {
          question: 'Is there a refund policy?',
          answer:
            '<p>We offer a <strong>7-day refund</strong> on new purchases. After that, all sales are final. Renewals and promo purchases are non-refundable.</p>'
        }
      ]
    },
    {
      id: 'playback',
      icon: '?',
      title: 'Playing Candles & Skipping Behavior',
      items: [
        {
          question: 'What is “Warmup Start”?',
          answer:
            '<p>Warmup Start is the initial stabilization phase right after loading/repositioning replay. TestingView aligns chart state, indicators, and replay controls before normal skipping resumes.</p>'
        },
        {
          question: 'Can TestingView play candles faster?',
          answer:
            '<p>Yes, but speed is bounded by replay resolution integrity. The engine can fast-forward using valid intervals while still processing each required candle transition safely.</p>'
        },
        {
          question: 'Why does playing candles prioritize stability?',
          answer:
            '<p>Because missing intermediate states can invalidate SL/TP/BE detection and indicator events. TestingView favors consistent, deterministic playback over unsafe jumps.</p>'
        },
        {
          question: 'Are there issues when playing candles?',
          answer:
            '<p>Rarely, but if symbol/timeframe data has gaps or replay resolution is too coarse, TestingView will warn and ask for a lower step size to protect result quality.</p>'
        },
        {
          question: 'Can I skip directly to a future time without playing every candle?',
          answer:
            '<p>Not yet.</p><p>Currently, TestingView replays candles one by one to ensure full chart consistency and prevent inaccuracies. Direct jumps without sequential playback are planned for future improvements once they can be done safely.</p>'
        }
      ]
    }
  ];

  searchTerm = '';
  categoryStart = 0;
  activeCategoryId = this.categories[0].id;

  private readonly openByCategory: Record<string, number | null> = {
    platform: 0,
    mechanics: 0,
    risk: 1,
    journaling: 0,
    accounts: 4,
    playback: 4
  };

  get activeCategory(): QaCategory {
    return this.categories.find((category) => category.id === this.activeCategoryId) ?? this.categories[0];
  }

  get visibleCategories(): QaCategory[] {
    return this.categories.slice(this.categoryStart, this.categoryStart + this.categoryWindowSize);
  }

  get visibleItems(): VisibleQaItem[] {
    const query = this.searchTerm.trim().toLowerCase();

    return this.activeCategory.items
      .map((item, index) => ({ ...item, index }))
      .filter((item) => {
        if (!query) {
          return true;
        }

        const plainAnswer = this.stripHtml(item.answer).toLowerCase();
        return item.question.toLowerCase().includes(query) || plainAnswer.includes(query);
      });
  }

  get canShiftLeft(): boolean {
    return this.categoryStart > 0;
  }

  get canShiftRight(): boolean {
    return this.categoryStart + this.categoryWindowSize < this.categories.length;
  }

  setSearchTerm(value: string): void {
    this.searchTerm = value;
  }

  selectCategory(categoryId: string): void {
    this.activeCategoryId = categoryId;

    const categoryIndex = this.categories.findIndex((category) => category.id === categoryId);
    if (categoryIndex === -1) {
      return;
    }

    if (categoryIndex < this.categoryStart) {
      this.categoryStart = categoryIndex;
    } else if (categoryIndex >= this.categoryStart + this.categoryWindowSize) {
      this.categoryStart = categoryIndex - this.categoryWindowSize + 1;
    }
  }

  shiftCategories(direction: -1 | 1): void {
    const nextStart = this.categoryStart + direction;
    const maxStart = Math.max(0, this.categories.length - this.categoryWindowSize);
    this.categoryStart = Math.max(0, Math.min(nextStart, maxStart));
  }

  toggleItem(item: VisibleQaItem): void {
    const current = this.openByCategory[this.activeCategoryId] ?? null;
    this.openByCategory[this.activeCategoryId] = current === item.index ? null : item.index;
  }

  isOpen(item: VisibleQaItem): boolean {
    return this.openByCategory[this.activeCategoryId] === item.index;
  }

  formatIndex(index: number): string {
    return String(index + 1).padStart(2, '0');
  }

  private stripHtml(value: string): string {
    return value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  }
}
