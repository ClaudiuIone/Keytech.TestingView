# TestingView - Copilot Instructions

## Project Overview
TestingView is a TradingView-integrated backtesting platform consisting of:
- **API Server** (.NET 8 Web API) - Backend services and data persistence
- **Browser Extension** (JavaScript) - Injects into TradingView for trade simulation
- **Desktop App** (.NET 8 WinExe) - Launches TradingView with proxy support
- **Backoffice** (HTML/JS) - Admin dashboard for analytics and session management

## Architecture

### Project Structure
| Project | Purpose |
|---------|---------|
| `Keytech.TestingView.API` | ASP.NET Core 8 Web API hosting static files and REST endpoints |
| `Keytech.TestingView.Data` | Entity Framework DbContext and data models |
| `Keytech.TestingView.Data.Services` | Business logic layer between controllers and data |
| `Keytech.TestingView.App` | Desktop launcher for TradingView integration |
| `Keytech.TestingView.Extension` | Browser extension manifest and injector scripts |
| `Keytech.TestingView.Backoffice` | Web-based admin interface |

### Service Layer Pattern
Controllers delegate directly to static service instances initialized in [App.cs](Keytech.TestingView.API/App.cs):
```csharp
App.TestingViewBacktestingDataService  // Sessions, positions, symbols
App.TestingViewJournalingDataService   // Custom columns, snapshots
App.TestingViewAdminDataService        // Users, plans, permissions
App.TestingViewUIDataService           // UI-specific settings
```
Services use `CreateService(connectionString)` factory pattern with internal `TestingViewContext` for database access.

---

## Database Structure

SQL Server with schemas matching service domains. Schema file: [TestingView SQL schema.sql](Keytech.TestingView.Data/Keytech.TestingView.Data/Structure/TestingView%20SQL%20schema.sql)

### Schema Overview
| Schema | Tables | Purpose |
|--------|--------|---------|
| `Administration` | Users, Plans, PlanPermissions | User accounts, subscription plans, feature flags |
| `Backtesting` | Sessions, Positions, PositionBEs, PositionSLs, PositionTPs, PositionRisks, PositionShapes, Symbols, SymbolRuleContractSizes, SessionParameters, SessionSymbolLastPrices | Core trading data |
| `Journaling` | SessionColumns, PositionColumns, PositionSnapshots | Custom columns and screenshot storage |
| `UI` | SessionTimeframeResolutions, Languages | UI preferences per session |
| `Processing` | Logs | System logging |
| `General` | Parameters | System-wide settings |

### Key Tables

**Backtesting.Sessions**
- `SessionId` (uniqueidentifier PK)
- `UserId`, `Name`, `Capital`, `CurrencyId`, `CurrentDate`, `LastUpdate`, `CreationDate`

**Backtesting.Positions**
- `PositionId` (varchar(50) PK) - Short alphanumeric ID
- `SessionId`, `SymbolId`, `EntryPrice`, `ExitPrice`, `Quantity`, `EntryTime`, `ExitTime`

**Backtesting.PositionBEs/SLs/TPs/Risks** - History tables tracking changes over time
- `PositionId`, `BarTime`, `BE`/`SL`/`TP`/`Risk`, `CreationDate`

**Backtesting.Symbols**
- `SymbolId` (int IDENTITY PK)
- `SymbolName`, `SymbolType`, `CurrencyId`, `QuantityPrecision`, `PricePrecision`

**Backtesting.SymbolRuleContractSizes** - Regex-based contract size lookup
- `SymbolType`, `SymbolNameRegex`, `Priority`, `ContractSize`

**Journaling.SessionColumns** - Custom column definitions per session
- `SessionId`, `Priority`, `ColumnId` (IDENTITY), `ColumnName`, `ColumnType`, `ColumnEnumValues`, `Sortable`, `Visible`

**Journaling.PositionColumns** - Custom column values per position
- `PositionId`, `ColumnId`, `Value`

**Administration.PlanPermissions** - Feature flags per plan
- `PlanId`, `Permission` (e.g., `AdvancedMetrics`, `CanSetBE`, `JournalCustomization`, `UnlimitedTrades`)

---

## Complete API Endpoint Reference

### Backtesting Controller (`/backtesting/*`)

| Method | Endpoint | Purpose | JS Method |
|--------|----------|---------|-----------|
| GET | `/sessions` | List user sessions | `L.dataOps.getSessions(userId)` |
| GET | `/sessions/{id}` | Get session details | `L.dataOps.getSession(sessionId)` |
| POST | `/sessions` | Create session | `L.dataOps.createSession(session)` |
| PUT | `/sessions?allowPastDate={bool}` | Update session | `L.dataOps.updateSession(session)` |
| DELETE | `/sessions/{id}` | Delete session | `L.dataOps.deleteSession(sessionId)` |
| POST | `/sessions/{id}/clone?newName={name}` | Clone session | `L.dataOps.cloneSession(sessionId, newName)` |
| GET | `/sessions/{id}/parameters` | Get session parameters | `L.dataOps.getSessionParameters(sessionId)` |
| PUT | `/sessions/{id}/parameters/{parameterId}` | Set session parameter | `L.dataOps.setSessionParameterValue(sessionId, parameterId, value)` |
| PUT | `/sessions/{id}/symbols/{symbolId}/last-price` | Update symbol last price | `L.dataOps.updateLastPrice(sessionId, symbolId, price)` |
| GET | `/positions/{sessionId}` | Get session positions | `L.dataOps.getSessionPositions(sessionId)` |
| POST | `/positions` | Create position | `L.dataOps.createPosition(position)` |
| PUT | `/positions/close` | Close position | `L.dataOps.closePosition(position)` |
| DELETE | `/positions/{id}` | Delete position | `L.dataOps.deletePosition(positionId)` |
| PUT | `/positions/{id}/quantity` | Update quantity | `L.dataOps.updatePositionQuantity(positionId, quantity)` |
| PUT | `/positions/be/{id}` | Add BE record | `L.dataOps.addPositionBE(positionId, be)` |
| PUT | `/positions/sl/{id}` | Add SL record | `L.dataOps.addPositionSL(positionId, sl)` |
| PUT | `/positions/tp/{id}` | Add TP record | `L.dataOps.addPositionTP(positionId, tp)` |
| PUT | `/positions/risk/{id}` | Add risk record | `L.dataOps.addPositionRisk(positionId, risk)` |
| GET | `/positions/shapes/{id}` | Get position shapes | `L.dataOps.getPositionShapes(positionId)` |
| PUT | `/positions/shapes/{id}` | Update position shape | `L.dataOps.setPositionShape(positionId, shape)` |
| GET | `/symbols/{name}` | Get/create symbol | `L.dataOps.getOrAddSymbol(symbolName, getSymbolInfo)` |
| POST | `/symbols` | Create symbol | (internal) |
| GET | `/symbol-rule-contract-sizes/{type}` | Get contract sizes | `L.dataOps.getSymbolRuleContractSizes(symbolType)` |

### Journaling Controller (`/journaling/*`)

| Method | Endpoint | Purpose | JS Method |
|--------|----------|---------|-----------|
| GET | `/session-columns/{sessionId}` | Get custom columns | `L.dataOps.getSessionColumns(sessionId)` |
| POST | `/session-columns/{sessionId}` | Save custom columns | `L.dataOps.saveSessionColumns(sessionId, columns)` |
| GET | `/positions/columns/{positionId}` | Get position column values | `L.dataOps.getPositionColumns(positionId)` |
| PUT | `/positions/columns/{positionId}` | Set position column value | `L.dataOps.setPositionColumn(positionId, column)` |
| GET | `/positions/snapshots/{positionId}` | Get position snapshots | `L.dataOps.getPositionSnapshots(positionId)` |
| PUT | `/positions/snapshots/{positionId}` | Save position snapshots | `L.dataOps.setPositionSnapshots(positionId, snapshots)` |
| POST | `/export/excel/{sessionName}` | Export to Excel | `L.dataOps.exportSessionStatistics(sessionName, entries)` |

### Admin Controller (`/admin/*`)

| Method | Endpoint | Purpose | JS Method |
|--------|----------|---------|-----------|
| GET | `/user/{id}` | Get user by ID | `L.dataOps.getUserById(userId)` |
| PUT | `/user` | Get or create user | `L.dataOps.getOrSaveUserId(tradingViewUser)` |
| GET | `/plans/{id}/permissions` | Get plan permissions | `L.dataOps.getPermissions(planId)` |

### UI Controller (`/ui/*`)

| Method | Endpoint | Purpose | JS Method |
|--------|----------|---------|-----------|
| GET | `/sessions/{id}/timeframe-resolutions` | Get timeframe mappings | `L.dataOps.getSessionTimeframeResolutions(sessionId)` |
| PUT | `/sessions/{id}/timeframe-resolutions/{tf}` | Set timeframe resolution | `L.dataOps.setSessionTimeframeResolution(sessionId, tf, res)` |
| GET | `/addons` | Get user addons | `L.dataOps.getAddons()` |

### JS Controller (`/app/*`)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/compile?debug={bool}` | Compile JS/CSS |
| GET | `/proxy?url={url}` | Proxy external requests |

---

## Columns System

### Predefined Columns (built-in)
| Column Name | Type | Description |
|-------------|------|-------------|
| `Trade` | special | Position index with entry/exit row |
| `Date/Time` | datetime | Entry and exit timestamps |
| `Price` | number | Entry and current/exit prices |
| `Symbol` | text | Trading instrument |
| `Lots` | number | Position quantity |
| `RR` | number | Risk/Reward ratio |
| `Risk` | number | Dollar risk amount |
| `Profit` | number | Realized/unrealized P&L |
| `Cumulative profit` | number | Running total P&L |
| `Run-up` | number | Max favorable excursion |
| `Drawdown` | number | Max adverse excursion |
| `BE Run-up` | number | Run-up after break-even hit |
| `Snapshots` | actions | Screenshot viewer |
| `Notes` | text | Free-form notes |
| `Analysis Time` | time | Time spent analyzing |
| `Virtual Run-up` | number | Post-exit run-up tracking |
| `Virtual Drawdown` | number | Post-exit drawdown tracking |
| `Virtual BE Run-up` | number | Post-exit BE run-up |

### Custom Column Types
- `text` - Free text input
- `number` - Numeric input
- `bool` - Checkbox
- `date` - Date picker
- `time` - Time picker
- `datetime` - Date and time
- `enum` - Dropdown (values in `ColumnEnumValues` comma-separated)

### Column Flow
1. `SessionColumns` defines available columns for a session (name, type, visibility, sort order)
2. `PositionColumns` stores actual values per position (PositionId + ColumnId → Value)
3. Frontend: `position.columnValue(name)` gets value, `position.columnValue(name, value)` sets and persists

---

## Frontend (Browser Extension)

Full frontend documentation: [wwwroot/.github/copilot-instructions.md](Keytech.TestingView.API/wwwroot/.github/copilot-instructions.md)

### Key Points
- All functionality attaches to global `L` object
- **String localization** uses `L.s(section, index)` with comments showing values (CRITICAL - preserve these comments)
- Polling-based candle monitoring at 10ms intervals via `L.pollBarActivity()`
- Position entry detection by monitoring TradingView shape crossings

### JS Compilation
Build frontend code via API endpoint:
```bash
curl "https://api.testingview.com/app/compile?debug=true"   # Unminified
curl "https://api.testingview.com/app/compile?debug=false"  # Minified
```
Compiles: `wwwroot/js/*.js` → `wwwroot/js/testingview.js`

JS load order defined in [SrcCompilation.cs](Keytech.TestingView.API/Processing/SrcCompilation.cs):
1. `testingview.core.js` (first)
2. All other JS files (except addons)
3. `testingview.exec.js` (last)

---

## Error Handling Patterns

### Backend (C#)
- Controllers return appropriate HTTP status codes (200, 400, 404, 500)
- Services throw exceptions caught by ASP.NET middleware
- Logging via `Processing.Logs` table

### Frontend (JavaScript)
**`L.tryExec(func, suppressError)`** - Synchronous try/catch wrapper:
```javascript
L.tryExec(() => riskyOperation(), false);  // Logs warning on error
L.tryExec(() => riskyOperation(), true);   // Silently ignores errors
```

**`L.tryExecAsync(func, suppressError)`** - Async try/catch wrapper:
```javascript
await L.tryExecAsync(async () => await riskyAsyncOperation(), false);
```

**Common usage patterns**:
```javascript
// TradingView API calls that may fail due to state
L.tryExec(() => L.r.replayTimingMode().setValue("manual"));
L.tryExec(() => shape.setPoints(points), true);

// Clipboard operations
await L.tryExecAsync(() => navigator.clipboard.writeText(url), true);

```

**API Response Handling**: `L.dataOps.get/post/put/delete` only return data on HTTP 200:
```javascript
L.dataOps.get = function(url) {
    return fetch(url).then(response => {
        if (response.status === 200) {
            return response.json();
        }
        // Returns undefined on error - callers must handle
    });
}
```

---

## TradingView API Quirks

### Accessing TradingView Objects
- `L.t` = `TradingViewApi` (main API)
- `L.r` = `TradingViewApi.replayApi()` (replay controller)
- Chart access: `L.c()` (active chart), `L.getCharts()` (all charts)

### Common Issues
1. **State timing**: TradingView operations are async; use `L.waitUntil()` to wait for state changes
2. **Shape manipulation**: Always wrap in `L.tryExec()` - shapes may be deleted mid-operation
3. **Replay resolution changes**: May trigger chart reloads; handle with `PreventCandlePreviews` logic
4. **Symbol changes**: `chart.changingSymbol` flag tracks in-progress changes

### Throttling
TradingView property subscriptions fire rapidly. Use debounce pattern:
```javascript
if (!L.session.meta.lastSyncTime || L.session.meta.lastSyncTime + 1000 < Date.now()) {
    L.session.meta.lastSyncTime = Date.now();
    // Perform operation
}
```

---

## Development Workflow

### Building
```bash
dotnet build Keytech.TestingView.API.sln
```

### Running API
```bash
dotnet run --project Keytech.TestingView.API
```
- Listens on HTTPS 443 with certificate from `cert/certificate.pfx`
- Swagger UI available at `/swagger`

### Configuration
Connection strings in [appsettings.json](Keytech.TestingView.API/appsettings.json):
```json
{
  "ConnectionStrings": {
    "TestingView": "Server=lpc:.\\SQL1;Database=TestingView;..."
  }
}
```

## Code Conventions

### C# Backend
- Async/await throughout with `CancellationToken` support
- Services use `IAsyncEnumerable<T>` for streaming results
- Static service instances (not DI) - initialized once at startup
- `Keytech.Framework.*` libraries provide base functionality (Data, IO, JSON, Core)

### JavaScript Frontend
- Attach to `L` namespace: `L.myFeature = function() { ... }`
- Use events: `L.subscribe(L.events.onFastForward, handler)`
- Async patterns: `L.waitUntil()`, `L.asyncInterval()`, `L.delay()`
- Always add localization comment: `L.s(0, 6) /* true */`

### Data Models
- Position tracking: Entry/Exit prices, SL/TP/BE history tables
- Custom columns: User-defined per-session columns for journaling
- Session parameters: Key-value config (PreventCandlePreviews, AutoSnapshot, etc.)

## External Dependencies
- **TradingView API** - Accessed via `L.t` (chart operations) and `L.r` (replay operations)
- **Keytech.Framework** - Shared library with Core, Data, IO, JSON, Net, Services components
- **NUglify** - JS/CSS minification for production builds
