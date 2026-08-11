import { Component } from '@angular/core';

interface FeatureCategory {
  icon: string;
  title: string;
  points: string[];
}

@Component({
  selector: 'app-features',
  imports: [],
  templateUrl: './features.component.html',
  styleUrl: './features.component.scss'
})
export class FeaturesComponent {
  readonly introPoints = [
    'Allow all TradingView\'s indicators and features in your backtesting.',
    'Advanced Replay & Backtesting - Extend TradingView\'s built-in replay mode into a professional-grade backtesting suite.',
    'Multi-Pair & Multi-Chart Support - Simultaneously trade and analyze multiple assets.',
    'User-Friendly & Non-Intrusive - Works inside your existing TradingView workflow.'
  ];

  readonly categories: FeatureCategory[] = [
    {
      icon: '??',
      title: 'Core Features (Fundamental Capabilities)',
      points: [
        'TradingView Integration - Directly integrates with TradingView\'s UI and charts.',
        'Multi-Pair & Multi-Chart Trading - Backtest across multiple charts and asset pairs.',
        'Replay Market Conditions - Simulate past price action with TradingView\'s replay mode.',
        'Manual Position Entry - Open, manage, and close positions with adjustable entry, stop loss, and take profit.',
        'Use Any TradingView Indicator - Full access to built-in and custom indicators.',
        'Trade Execution & Management - Open, modify, and close positions directly on chart drawings.',
        'Multi-Timeframe Backtesting - Test strategies on different timeframes simultaneously.',
        'Risk Management Tools - Control stop loss, take profit, and break-even settings.',
        'Use Saved Drawings & Templates - Keep your lines, shapes, and annotations while testing.',
        'Access Pine Script for Backtesting - Run custom TradingView Pine indicators and strategies seamlessly.'
      ]
    },
    {
      icon: '??',
      title: 'Performance Tracking & Analytics',
      points: [
        'Basic Trading Metrics - Track profit/loss, winrate, and risk-to-reward ratio.',
        'Trade History & Analytics - Review past trades with detailed metrics.',
        'Advanced Performance Metrics - Expectancy, max drawdown, optimal SL/TP sizing, and Sharpe-like ratios.',
        'Equity Curve Tracking - Visualize account balance and equity over time.',
        'Trade Categorization - Organize trades by strategy, timeframe, or custom journal columns.',
        'Realistic Capital Growth Simulation - Calculate balance evolution after each trade.'
      ]
    },
    {
      icon: '??',
      title: 'Trade Journaling & Review',
      points: [
        'Basic Trade Journaling - Log entry/exit details and notes.',
        'Enhanced Trade Journaling - Rich text notes with flexible custom columns and checklist fields.',
        'Auto Trade Snapshots - Capture chart screenshots on entry, exit, TP/SL, and BE events.',
        'Trade Review Mode - Replay individual trades from the journal timeline.',
        'Historical Trade Data Export - Export trade logs to Excel/CSV for external analysis.',
        'Advanced Trade Filtering - Sort and filter by any journal field.'
      ]
    },
    {
      icon: '??',
      title: 'Trade Execution & Risk Management',
      points: [
        'Break-Even (BE) Level Settings - Move stop loss to entry automatically when BE is hit.',
        'Risk-Based Entry Sizing - Use lot/quantity sizing tied to risk and contract rules.',
        'Editable SL/TP/BE After Entry - Adjust levels live and keep risk metrics in sync.',
        'Session Currency Handling - Compute risk, PnL, run-up, and drawdown in your account currency.',
        'Auto-Stop Rules - Pause playback at predefined times or when chart events are triggered.'
      ]
    },
    {
      icon: '??',
      title: 'Advanced Backtesting Capabilities',
      points: [
        'Timeframe-Preview Protection - Prevent inaccurate candle previews when switching timeframe.',
        'ChronoShuffle Randomized Sessions - Jump through random days in a configurable date range.',
        'Trading Costs Impact Modeling - Simulate spread/commission drag directly in the stats panel.',
        'Multi-Session Management - Create, clone, and resume multiple backtesting sessions (plan dependent).',
        'Optional Add-ons - MT5 copier sync, extended automation shortcuts, and markdown overlay notes.'
      ]
    }
  ];
}
