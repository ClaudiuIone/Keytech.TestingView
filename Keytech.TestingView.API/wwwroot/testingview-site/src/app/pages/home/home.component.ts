import { Component } from '@angular/core';

@Component({
  selector: 'app-home',
  imports: [],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent {
  readonly highlights = [
    'Allow all TradingView\'s indicators and features in your backtesting',
    'Advanced Replay & Backtesting - Extend TradingView into a pro backtesting suite.',
    'Multi-Pair & Multi-Chart Support - Simultaneously work on multiple assets and timeframes.',
    'User-Friendly & Non-Intrusive - Works within your existing TradingView ecosystem'
  ];

  readonly galleryCards = [
    {
      title: 'Execution & Journal',
      subtitle: 'Open positions, tag notes, and sync snapshots in one flow.',
      tone: 'tone-a'
    },
    {
      title: 'Risk Overlay',
      subtitle: 'SL/TP/BE handling with account-currency calculations.',
      tone: 'tone-b'
    },
    {
      title: 'Playback Engine',
      subtitle: 'Stable candle-by-candle replay for accurate simulation.',
      tone: 'tone-c'
    }
  ];
}
