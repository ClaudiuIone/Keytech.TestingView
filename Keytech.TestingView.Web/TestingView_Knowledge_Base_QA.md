# TestingView Knowledge Base Q&A

Last updated: June 3, 2026

This is a user-facing knowledge base for TestingView. It only includes features, settings, limits, and behavior that a TestingView user can see, use, configure, or be directly affected by.

## Platform & Compatibility

### Q: What is TestingView?

TestingView is a backtesting tool that runs on top of TradingView. It adds backtesting session management, simulated position tracking, risk sizing, journaling, snapshots, statistics, and safer candle playback controls.

### Q: Do I need a TradingView subscription to use TestingView?

TestingView can work with the TradingView replay features available on your TradingView account. If your TradingView plan does not allow replay on lower timeframes, TestingView cannot unlock that limitation.

### Q: Does TestingView unlock TradingView paid features?

No. TestingView does not unlock TradingView plan limits such as lower-timeframe replay, extra indicators, more charts per layout, or additional historical data.

### Q: What happens if my TradingView plan does not support lower-timeframe replay?

TestingView may warn you and switch the chart to a higher supported timeframe, such as the daily timeframe, so the session can still run with the historical playback access TradingView allows.

### Q: Which browsers are supported?

TestingView is built for browser-based TradingView use through the supported extension flow. Install links are browser-specific: Chrome and other Chromium browsers use the Chrome Web Store, Microsoft Edge uses the Edge Add-ons store, and Firefox uses [addons.mozilla.org](https://addons.mozilla.org/en-US/firefox/addon/testingview/). From testingview.com, use **Get extension** or open `/extension` for an automatic redirect.

### Q: How do I install the desktop app?

You must already have TradingView Desktop installed. TestingView is an add-on that runs inside that app. Download **TradingView x TestingView.exe** from testingview.com (**Download desktop app** on the home page, or `/setup`).

### Q: Can I use multiple charts?

Yes. TestingView supports TradingView multi-chart layouts. This is useful for watching multiple timeframes side by side instead of constantly switching chart intervals.

### Q: Can I backtest multiple symbols or pairs at once?

Yes, if your TradingView layout supports multiple charts and symbols. TestingView tracks trades by symbol, while the session keeps one shared account balance, equity, and journal.

### Q: Can I use different timeframes side by side?

Yes. A common workflow is to open several charts in the same TradingView layout, set each chart to a different timeframe, and let TestingView advance them together during backtesting.

### Q: Can I use indicators while backtesting?

Yes, within your TradingView plan limits. TestingView does not increase the number of indicators your TradingView account can use.

### Q: Can TestingView stop playback from an indicator signal?

Yes, if the indicator is built to expose compatible TestingView event signals. Ordinary indicators are not automatically treated as stop events.

### Q: Which markets can I backtest?

TestingView can work with TradingView symbols across common asset classes such as forex, stocks, futures, indexes, commodities, crypto, and CFDs, as long as TradingView replay data is available for the symbol.

### Q: Does TestingView handle different contract sizes?

Yes. TestingView uses symbol and market information to account for differences such as forex lots, commodities, futures point values, indexes, stocks, and other symbol types.

### Q: Does TestingView account for Daylight Saving Time?

Yes. TestingView uses the timezone shown on your TradingView chart. If that timezone observes Daylight Saving Time, chart times and journal times follow the chart timezone.

### Q: Should I keep the same chart timezone during a session?

Yes. Keeping the chart timezone consistent makes replay times, journal entries, screenshots, and exports easier to compare.

### Q: Can I replay into the future?

No. TestingView blocks navigation into future dates.

### Q: Can I resume a session on another device?

Yes, your session and journal data are tied to your TestingView account. You still need to be logged in with the correct TradingView/TestingView account and have access to the needed TradingView chart data.

### Q: Does TestingView need my TradingView password?

No. TestingView uses your TradingView identity for linking access, but it does not ask for or store your TradingView password.

## Trading Mechanics & Session Logic

### Q: How do I start a TestingView session?

Open TradingView, click the TestingView toolbar button, then create a new session or resume an existing one.

### Q: What do I choose when creating a new session?

You choose a session name, starting capital, account currency, and start date. The session then becomes the account and journal container for your backtest.

### Q: What account currencies are available?

The session currency list includes common fiat and crypto currencies such as USD, EUR, GBP, AUD, CAD, CHF, JPY, NZD, SEK, SGD, ZAR, BTC, ETH, USDT, and others.

### Q: What is ChronoShuffle?

ChronoShuffle starts a session at a random date inside a past date range. It is useful when you want to practice without knowing exactly what market period comes next.

### Q: How do I open a position in TestingView?

Start or resume a session, draw a TradingView Long Position or Short Position tool, set entry, stop loss, take profit, and risk/size, then play candles. When price reaches the entry, TestingView opens and tracks the simulated trade.

### Q: Does the trade open exactly at my entry?

Usually yes. If price gaps through your entry between candles, TestingView opens the trade at the new candle open instead.

### Q: Can I confirm entries before they open?

Yes. Enable the Confirm Entries setting to show a confirmation dialog before a detected position is opened.

### Q: What happens if the position drawing has no quantity?

TestingView will not open the trade. It shows a warning and removes the invalid position drawing.

### Q: How does TestingView know a trade should open?

TestingView watches TradingView Long Position and Short Position drawings. When price reaches during backtesting the entry level, the drawing becomes a tracked TestingView position.

### Q: How does TestingView close trades?

TestingView closes trades when price reaches stop loss or take profit, when a user manually closes the trade, or when trade-management logic such as break-even changes the active stop.

### Q: What happens if stop loss and take profit are both inside the same candle?

On a candle where both levels are touched, the exact order can be ambiguous unless lower-timeframe price movement is available. For best accuracy, use the smallest practical playback step when managing active trades.

### Q: Can I close a trade manually?

Yes. Active trades can be closed manually from the journal/trade controls.

### Q: Can I move a trade drawing after it opens?

TestingView replaces the original setup drawing with managed entry, stop, target, and break-even lines. Use those managed lines to adjust the active trade.

### Q: Can I change the session date when resuming?

Yes, but only when there are no open positions and the requested date does not conflict with existing closed trades.

### Q: What is review mode?

Review mode lets you revisit previous trades from the journal. You can jump to a trade, inspect it, and then return to the active session date.

### Q: When is review mode available?

Review mode is available only when the session has enough trade history and no active open position.

### Q: Can I stop playback at a specific price?

Yes. You can add a playback stop line on the chart. When price reaches or crosses the line, TestingView stops playback.

### Q: What are predefined hours?

Predefined hours are specific times, such as `09:30`, `12:30`, or `15:30`, where TestingView can automatically pause playback.

### Q: What are chart events?

Chart events are compatible indicator or integration signals that can tell TestingView to stop playback when a specific plotted event appears.

### Q: What happens if TradingView replay is turned off?

TestingView exits its active session flow because it needs TradingView replay to remain active for accurate tracking.

## Risk & Trade Management

### Q: How is risk calculated?

TestingView calculates risk from entry price, stop price, quantity, contract size, point value, and the position tool's currency conversion at entry.

### Q: How is lot size calculated?

Lot size comes from the Long/Short Position tool and the selected risk settings. TestingView then normalizes the quantity for the symbol being traded.

### Q: Can I risk a fixed amount?

Yes. Use the TradingView position tool to set a fixed money risk amount before the trade opens.

### Q: Can I risk a percentage of my account?

Yes. Use the TradingView position tool to set percentage-based risk before the trade opens.

### Q: Is PnL shown in my session currency?

Yes. Risk, profit, balance, equity, run-up, drawdown, and statistics are shown in the session's account currency.

### Q: How is currency conversion handled?

TestingView stores the conversion rate from the position setup at trade entry and uses that saved value for risk and PnL calculations.

### Q: Can I move stop loss after the trade opens?

Yes. Move the managed stop-loss line on the chart. TestingView updates the trade and journal values.

### Q: Can I move take profit after the trade opens?

Yes. Move the managed take-profit line on the chart. TestingView updates the active trade and journal values.

### Q: Are there stop-loss placement rules?

Yes. Stop loss must remain on the valid side of the current price and cannot cross an active break-even level.

### Q: Are there take-profit placement rules?

Yes. Take profit must remain on the valid side of the current price and cannot cross an active break-even level.

### Q: Can I set automatic break-even?

Yes, on plans that include break-even. When price reaches the configured BE level, TestingView moves stop loss to entry.

### Q: What happens when break-even is hit?

TestingView removes the BE trigger, moves SL to entry if your plan allows it, updates the journal, and can capture an automatic snapshot if snapshots are enabled.

### Q: What if my plan does not include break-even?

TestingView shows a warning and does not automatically move the stop to entry.

### Q: Can I choose where the BE trigger sits?

Yes. The BE line must be placed between entry and target, on the profitable side of entry, and must not conflict with the current SL or TP.

### Q: Can I modify lots after entry?

Yes, if your plan allows quantity editing and the session setting for modifying quantity is enabled.

### Q: What happens when I modify lots?

TestingView recalculates risk, profit, balance/equity impact, and journal metrics based on the new quantity.

### Q: Does TestingView support slippage, spread, or trading costs?

Yes, on plans that include slippage/spread tools. These values are used in statistics and performance analysis.

### Q: What is run-up?

Run-up is the maximum favorable movement reached by a trade while it was open.

### Q: What is drawdown?

Drawdown is the maximum unfavorable movement reached by a trade while it was open.

### Q: What is RR?

RR is the reward-to-risk relationship between the trade's target and stop. TestingView stores and updates it with the trade.

## Journaling & Session Management

### Q: Is my journal saved automatically?

Yes. TestingView automatically saves sessions, trades, journal values, snapshots, and settings while you work.

### Q: What default journal columns are included?

Default columns include Trade, Date/Time, Price, Symbol, Lots, RR, Risk, Profit, Cumulative Profit, Run-up, Drawdown, BE Run-up, Snapshots, Notes, and Analysis Time.

### Q: Can I customize journal columns?

Yes, on plans that include journal customization. You can add, rename, reorder, show, hide, and remove custom columns.

### Q: Which column types can I use?

Supported column types include text, rich text, number, checkbox, date, time, datetime, dropdown-style values, and action columns.

### Q: Can I create dropdown values?

Yes. Custom columns can use predefined values such as setup type, confidence, grade, market condition, or mistake category.

### Q: Can I edit system columns?

System columns are protected so TestingView can keep trade calculations and actions working correctly. You can still choose which columns are visible where supported.

### Q: Can I export the journal?

Yes, on plans that include journal export. The export creates an Excel workbook from your session journal.

### Q: Are snapshots saved with trades?

Yes. TestingView can save TradingView snapshot links to the trade journal.

### Q: Can snapshots be captured automatically?

Yes. Enable Auto Capture Trade Snapshots to automatically capture snapshots around important trade events such as entry and exit.

### Q: Can I capture snapshots from multiple charts?

Yes. In multi-chart layouts, TestingView can capture separate snapshots from each chart when requested.

### Q: Can I view, copy, or delete snapshots?

Yes. The snapshot viewer lets you browse, copy, open, and delete saved snapshots.

### Q: Can I write notes for each trade?

Yes. The journal includes a Notes column for trade notes.

### Q: What is Analysis Time?

Analysis Time tracks how long you actively spend reviewing a trade/chart during the session.

### Q: Can I duplicate a session?

Yes. TestingView supports cloning a session, including trades, journal values, snapshots, and settings.

### Q: Can I delete a session?

Yes. You can delete a session from the session list. If you delete the active session, TestingView exits that session.

### Q: Are my journal columns copied to new sessions?

Yes. New sessions can reuse your most recent journal column setup so you do not have to rebuild the same journal structure every time.

### Q: Can I open a trade from the journal?

Yes. Selecting or double-clicking journal rows can focus the related trade, redraw the trade shape when needed, or navigate to the trade in review mode.

### Q: What statistics are available?

TestingView can show metrics such as profit, win rate, profit factor, average RR, drawdown, run-up, expectancy, streaks, equity curve, returns, and other performance charts. Some advanced statistics depend on your plan.

### Q: Is there a live trading journal?

The current user-facing journal is for TestingView backtesting sessions. Live trading journaling is not part of this core backtesting workflow.

## Accounts & Licensing

### Q: How is my TestingView access linked?

TestingView links access to your TestingView account and TradingView username.

### Q: Can I change my TradingView username?

Yes. If your account page allows username changes, update the TradingView username there so access is linked to the correct TradingView identity.

### Q: What plans are available?

The current product plans are Starter, Explorer, and Trader.

### Q: What does Starter include?

Starter lets you resume saved sessions and run core backtesting on TradingView. You can place up to 20 trades per session and use Go to Time up to 10 times per session. You keep one backtesting session at a time, with basic journaling and standard statistics. Automatic break-even, custom journal columns, Excel export, slippage/spread tools, and editing lots after entry are not included.

### Q: What does Explorer include?

Explorer includes everything in Starter, plus up to 50 trades per session, automatic break-even, advanced performance metrics, custom journal columns, and unlimited Go to Time per session. It does not include unlimited trades, multiple concurrent sessions, journal export, slippage/spread modeling, or editing position quantity after entry.

### Q: What does Trader include?

Trader includes everything in Explorer, plus unlimited trades per session, multiple backtesting sessions at once, Excel journal export, slippage and spread modeling in statistics, and the ability to edit position quantity after entry (when enabled in session settings).

### Q: Are there trade limits?

Yes. Starter is capped at 20 trades per session. Explorer raises the cap to 50. Trader has no trade cap.

### Q: Which plan includes automatic break-even?

Explorer and Trader include automatic break-even.

### Q: Which plan includes advanced statistics?

Explorer and Trader include advanced statistics.

### Q: Which plan includes journal customization?

Explorer and Trader include journal customization.

### Q: Which plan includes journal export?

Trader includes journal export.

### Q: Which plan includes slippage and spread tools?

Trader includes slippage and spread tools.

### Q: Which plan allows modifying lots after entry?

Trader allows modifying lots after entry, as long as the session setting is also enabled.

### Q: Is Go to Time limited?

Yes. On Starter, each session allows up to 10 Go to Time / custom date jumps. Explorer and Trader include unlimited Go to Time usage per session.

### Q: Can I have multiple sessions?

Only Trader allows more than one backtesting session at a time. Starter and Explorer are limited to a single session; the app blocks creating another until you upgrade or delete the existing session.

### Q: What happens if my plan expires?

If access expires, plan-gated features become unavailable until the account is renewed or updated.

### Q: Can I cancel my plan?

Yes. Subscription cancellation is handled through the account/billing area when billing is active.

### Q: Does TestingView affect my TradingView subscription?

No. TestingView and TradingView subscriptions are separate. TestingView does not change, upgrade, or cancel your TradingView plan.

## Playing Candles & Skipping Behavior

### Q: What playback controls does TestingView add?

TestingView adds play/pause, step forward, fast-forward, skip interval selection, Go to Time, review mode, settings, statistics, and session balance/equity controls.

### Q: What is the minimum skip interval?

The minimum skip interval depends on the replay resolutions TradingView makes available for your account, symbol, and chart. TestingView uses the smallest practical available replay resolution unless you choose another supported setting.

### Q: Can I choose the replay step resolution?

Yes. You can set the minimum step-forward resolution in TestingView settings.

### Q: What happens if I choose tick or second-based replay?

Tick and second-based playback depend on TradingView's available recorded ticks. If ticks are missing, playback may jump to the next available tick.

### Q: How does fast-forward work?

Fast-forward repeatedly advances candles until it reaches the next valid target time or until something important stops playback.

### Q: Why does fast-forward stop at rounded times?

TestingView aligns larger skips with natural candle close times. For example, skipping by one hour from `09:47` targets `10:00`, then `11:00`, then `12:00`.

### Q: Why can fast-forward feel slow?

TestingView prioritizes accuracy and chart stability. It advances candles carefully so entries, exits, break-even triggers, predefined times, and stop events are not missed.

### Q: Can TestingView skip directly to a future time?

Yes, through Go to Time/custom date when allowed. It is not available while a trade is open, because jumping over candles could miss trade-management events.

### Q: Can I use Go to Time with an open position?

No. Go to Time is blocked while a position is open.

### Q: What is Prevent Candle Previews?

Prevent Candle Previews is a setting designed to reduce higher-timeframe candle preview issues when changing timeframes or navigating replay.

### Q: Is Prevent Candle Previews enabled by default?

Not always. New sessions may start with it disabled, and your previous session settings may carry forward. You can change it in settings.

### Q: Will TestingView skip candles when changing timeframes?

TestingView tries to keep the session date stable. If Prevent Candle Previews is enabled, it may navigate to a safer completed candle and advance forward to avoid revealing unfinished higher-timeframe candle information.

### Q: What happened to Warmup Start?

Warmup Start is not a separate visible setting in the current workflow. The related behavior is handled by Prevent Candle Previews and controlled playback navigation.

### Q: What can automatically stop playback?

Playback can stop for entries, exits, break-even triggers, predefined hours, compatible chart events, a user stop line, future-date protection, or unsafe step size while a trade is open.

### Q: How do predefined-hour stops work?

Add times such as `09:30`, `12:00`, or `15:30`. TestingView pauses when playback reaches those chart-timezone times.

### Q: Do predefined-hour stops work on every replay resolution?

No. They are intended for smaller playback steps and are disabled on very large step sizes such as four hours or higher.

### Q: How do chart-event stops work?

When enabled, TestingView watches compatible indicator events and pauses when a matching event appears.

### Q: How does the price stop line work?

Add a stop line at a price. TestingView stops playback when price reaches or crosses that line.

### Q: Why does TestingView block large steps with an open trade?

Large steps can skip over stop loss, take profit, or break-even events. TestingView asks you to use a smaller step when needed to protect trade accuracy.

### Q: What happens if the chart jumps backward unexpectedly?

TestingView treats unexpected backward jumps as unsafe and may exit or reload the session flow to avoid saving inaccurate state.

### Q: What happens if the chart jumps forward too far?

TestingView may warn you and stop trusting automatic current-date tracking, because too much playback movement may have been skipped.

### Q: Are there known limitations when playing candles?

Yes. Large skips can feel slow, lower-timeframe replay depends on TradingView access, tick data may be incomplete, open trades require smaller step sizes, and a single OHLC candle cannot always prove whether SL or TP was hit first.

### Q: What keyboard shortcuts are available?

TestingView exposes shortcuts such as play/pause, step forward, and fast-forward from the replay controls. The exact shortcut is shown in each control's tooltip.