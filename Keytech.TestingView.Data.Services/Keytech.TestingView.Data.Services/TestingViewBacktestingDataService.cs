using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Keytech.Framework.Core.Extensions;
using Keytech.Framework.Core.Helpers;
using Keytech.Framework.Data.Extensions;
using Microsoft.Extensions.Logging;

namespace Keytech.TestingView.Data.Services
{
    public class TestingViewBacktestingDataService : TestingViewDataService
    {
        private readonly TestingViewJournalingDataService _TestingViewJournalingDataService;
        private readonly TestingViewUIDataService _TestingViewUIDataService;

        static TestingViewBacktestingDataService()
        {
            CacheStore<string, Data.Backtesting.Symbol>.Expiration = TimeSpan.FromMinutes(1);
            CacheStore<int, Data.Backtesting.Symbol>.Expiration = TimeSpan.FromMinutes(1);
            CacheStore<string, Data.Backtesting.SymbolRuleContractSize[]>.Expiration = TimeSpan.FromMinutes(1);
        }

        protected TestingViewBacktestingDataService(TestingViewContext TestingViewDb, TestingViewJournalingDataService TestingViewJournalingDataService, TestingViewUIDataService TestingViewUIDataService) : base(TestingViewDb)
        {
            _TestingViewJournalingDataService = TestingViewJournalingDataService;
            _TestingViewUIDataService = TestingViewUIDataService;
        }

        public async static Task<TestingViewBacktestingDataService> CreateService(string TestingViewConnectionString, TestingViewJournalingDataService TestingViewJournalingDataService, TestingViewUIDataService TestingViewUIDataService)
        {
            TestingViewContext TestingViewDb = await TestingViewContext.CreateDb(TestingViewConnectionString);
            return new TestingViewBacktestingDataService(TestingViewDb, TestingViewJournalingDataService, TestingViewUIDataService);
        }

        public Task<Data.Backtesting.SymbolRuleContractSize[]> GetSymbolRuleContractSizes(string symbolType, CancellationToken cancellationToken)
        {
            return CacheStore<string, Data.Backtesting.SymbolRuleContractSize[]>.GetOrAdd(symbolType, async () => await _TestingViewDb.Backtesting.GetSymbolRuleContractSizes(symbolType, cancellationToken).ToArrayAsync());
        }

        public Task<Data.Backtesting.Symbol> GetSymbolById(int symbolId, CancellationToken cancellationToken)
        {
            return CacheStore<int, Data.Backtesting.Symbol>.GetOrAdd(symbolId, () => _TestingViewDb.Backtesting.GetSymbolById(symbolId, cancellationToken));
        }

        public Task<Data.Backtesting.Symbol> GetSymbolByName(string symbolName, CancellationToken cancellationToken)
        {
            return CacheStore<string, Data.Backtesting.Symbol>.GetOrAdd(symbolName, () => _TestingViewDb.Backtesting.GetSymbolByName(symbolName, cancellationToken));
        }

        public Task<Data.Backtesting.Symbol> SaveSymbol(Data.Backtesting.Symbol symbol)
        {
            return _TestingViewDb.Backtesting.SaveSymbol(symbol);
        }

        public IAsyncEnumerable<Data.Backtesting.Session> GetSessions(Guid userId, bool includeDeleted, CancellationToken cancellationToken)
        {
            return _TestingViewDb.Backtesting.GetSessions(userId, includeDeleted, cancellationToken);
        }

        public async Task<Data.Backtesting.Session> GetSession(Guid sessionId, CancellationToken cancellationToken)
        {
            Data.Backtesting.Session session = await _TestingViewDb.Backtesting.GetSession(sessionId, cancellationToken);
            async Task SetSessionColumns()
            {
                session.SessionColumns = await _TestingViewJournalingDataService.GetSessionColumns(sessionId, cancellationToken).ToListAsync();
            }
            async Task SetSessionParameters()
            {
                session.SessionParameters = await this.GetSessionParameters(sessionId, cancellationToken).ToListAsync();
            }
            async Task SetSessionSymbolLastPrices()
            {
                session.SessionSymbolLastPrices = await this.GetSessionSymbolLastPrices(sessionId, cancellationToken).ToListAsync();
            }

            await Task.WhenAll(
                SetSessionColumns(),
                SetSessionParameters(),
                SetSessionSymbolLastPrices()
            );

            return session;
        }

        public async Task<Guid> CreateSession(Data.Backtesting.Session session)
        {
            session.SessionId = Guid.NewGuid();
            await _TestingViewDb.Backtesting.CreateSession(session);

            Data.Backtesting.Session lastSession = await this.GetSessions(session.UserId, true, CancellationToken.None)
                .Where(s => s.SessionId != session.SessionId)
                .OrderByDescending(s => s.LastUpdate)
                .FirstOrDefaultAsync();

            if(lastSession != null) { 
                await Task.WhenAll(await this.GetSessionParameters(lastSession.SessionId, CancellationToken.None)
                                .Select(sessionParameter => this.SetSessionParameterValue(session.SessionId, sessionParameter.ParameterId, sessionParameter.ParameterValue))
                    .Concat(_TestingViewUIDataService.GetSessionTimeframeResolutions(lastSession.SessionId, CancellationToken.None)
                                .Select(sessionTimeframeResolution => sessionTimeframeResolution.IsFastForward 
                                ? _TestingViewUIDataService.SetSessionTimeframeFastForwardResolution(session.SessionId, sessionTimeframeResolution.TimeframeSeconds, sessionTimeframeResolution.Resolution) 
                                : _TestingViewUIDataService.SetSessionTimeframeResolution(session.SessionId, sessionTimeframeResolution.TimeframeSeconds, sessionTimeframeResolution.Resolution)))
                    .ToArrayAsync());
            }
            else { 
                await Task.WhenAll(Enum.GetValues(typeof(Data.Backtesting.SessionParameterId))
                       .Cast<Data.Backtesting.SessionParameterId>()
                       .Select(paramId => this.SetSessionParameterValue(session.SessionId, paramId, GetDefaultSessionParameterValue(paramId))));
            }

            static string GetDefaultSessionParameterValue(Data.Backtesting.SessionParameterId sessionParameterId)
            {
                return sessionParameterId switch
                {
                    Data.Backtesting.SessionParameterId.FirstTradeInfo => "true",
                    Data.Backtesting.SessionParameterId.PreventHTFCandlePreviews => "false",
                    Data.Backtesting.SessionParameterId.EnablePredefinedTimes => "true",
                    Data.Backtesting.SessionParameterId.PredefinedTimes => "09:30, 12:30, 15:30",
                    Data.Backtesting.SessionParameterId.ConfirmEntries => "false",
                    Data.Backtesting.SessionParameterId.ShowOpenPositionTip => "true",
                    Data.Backtesting.SessionParameterId.AutoSnapshot => "true",
                    Data.Backtesting.SessionParameterId.CanModifyQty => "false",
                    Data.Backtesting.SessionParameterId.AutoOpenPanel => "true",
                    Data.Backtesting.SessionParameterId.WatchIntegrationPlots => "true",
                    _ => null
                };
            }

            return session.SessionId;
        }

        public Task<int> UpdateSession(Data.Backtesting.Session session, bool allowPastDate)
        {
            return _TestingViewDb.Backtesting.UpdateSession(session, allowPastDate);
        }

        public Task<int> DeleteSession(Guid sessionId)
        {
            return _TestingViewDb.Backtesting.DeleteSession(sessionId);
        }
        
        public IAsyncEnumerable<Data.Backtesting.SessionParameter> GetSessionParameters(Guid sessionId, CancellationToken cancellationToken)
        {
            return _TestingViewDb.Backtesting.GetSessionParameters(sessionId, cancellationToken);
        }

        public Task<int> SetSessionParameterValue(Guid sessionId, Data.Backtesting.SessionParameterId parameterId, string parameterValue)
        {
            return _TestingViewDb.Backtesting.SetSessionParameterValue(sessionId, parameterId, parameterValue);
        }

        public IAsyncEnumerable<Data.Backtesting.Position> GetPositions(Guid sessionId, CancellationToken cancellationToken)
        {
            return _TestingViewDb.Backtesting.GetPositions(sessionId, cancellationToken).SelectAwait(async (Data.Backtesting.Position position) =>
            {
                async Task SetBEs()
                {
                    position.PositionBEs = await this.GetPositionBEs(position.PositionId, cancellationToken).ToListAsync();
                }
                async Task SetRisks()
                {
                    position.PositionRisks = await this.GetPositionRisks(position.PositionId, cancellationToken).ToListAsync();
                }
                async Task SetSLs()
                {
                    position.PositionSLs = await this.GetPositionSLs(position.PositionId, cancellationToken).ToListAsync();
                }
                async Task SetTPs()
                {
                    position.PositionTPs = await this.GetPositionTPs(position.PositionId, cancellationToken).ToListAsync();
                }
                async Task SetShapes()
                {
                    position.PositionShapes = await this.GetPositionShapes(position.PositionId, cancellationToken).ToListAsync();
                }
                async Task SetSnapshots()
                {
                    position.PositionSnapshots = await _TestingViewJournalingDataService.GetPositionSnapshots(position.PositionId, cancellationToken).ToListAsync();
                }
                async Task SetColumns()
                {
                    position.PositionColumns = await _TestingViewJournalingDataService.GetPositionColumns(position.PositionId, cancellationToken).ToListAsync();
                }
                async Task SetSymbol()
                {
                    position.Symbol = await this.GetSymbolById(position.SymbolId, cancellationToken);
                }

                await Task.WhenAll(
                    SetBEs(),
                    SetRisks(),
                    SetSLs(),
                    SetTPs(),
                    SetShapes(),
                    SetSnapshots(),
                    SetColumns(),
                    SetSymbol()
                );

                return position;
            });
        }

        public async Task<int> CreatePosition(Data.Backtesting.Position position)
        {
            int result = await _TestingViewDb.Backtesting.CreatePosition(position);

            async Task AddPositionSLs()
            {
                if (position.PositionSLs != null)
                {
                    foreach (var sl in position.PositionSLs)
                    {
                        await this.AddPositionSL(position.PositionId, sl);
                    }
                }
            }
            async Task AddPositionTPs()
            {
                if (position.PositionTPs != null)
                {
                    foreach (var tp in position.PositionTPs)
                    {
                        await this.AddPositionTP(position.PositionId, tp);
                    }
                }
            }
            async Task AddPositionBEs()
            {
                if (position.PositionBEs != null)
                {
                    foreach (var be in position.PositionBEs)
                    {
                        await this.AddPositionBE(position.PositionId, be);
                    }
                }
            }
            async Task AddPositionRisks()
            {
                if (position.PositionRisks != null)
                {
                    foreach (var risk in position.PositionRisks)
                    {
                        await this.AddPositionRisk(position.PositionId, risk);
                    }
                }
            }
            async Task AddPositionShapes()
            {
                if (position.PositionShapes != null)
                {
                    foreach (var shape in position.PositionShapes)
                    {
                        await this.SetPositionShape(position.PositionId, shape);
                    }
                }
            }
            async Task AddPositionColumns()
            {
                if (position.PositionColumns != null)
                {
                    await _TestingViewJournalingDataService.SetPositionColumns(position.PositionId, position.PositionColumns);
                }
            }

            await Task.WhenAll(
                AddPositionSLs(),
                AddPositionTPs(),
                AddPositionBEs(),
                AddPositionRisks(),
                AddPositionShapes(),
                AddPositionColumns()
            );

            return result;
        }

        public Task<int> ClosePosition(Data.Backtesting.Position position)
        {
            return _TestingViewDb.Backtesting.ClosePosition(position);
        }

        public Task<int> AddPositionBE(string positionId, Data.Backtesting.PositionBE positionBE)
        {
            return _TestingViewDb.Backtesting.AddPositionBE(positionId, positionBE);
        }

        public IAsyncEnumerable<Data.Backtesting.PositionBE> GetPositionBEs(string positionId, CancellationToken cancellationToken)
        {
            return _TestingViewDb.Backtesting.GetPositionBEs(positionId, cancellationToken);
        }

        public Task<int> AddPositionRisk(string positionId, Data.Backtesting.PositionRisk positionRisk)
        {
            return _TestingViewDb.Backtesting.AddPositionRisk(positionId, positionRisk);
        }

        public IAsyncEnumerable<Data.Backtesting.PositionRisk> GetPositionRisks(string positionId, CancellationToken cancellationToken)
        {
            return _TestingViewDb.Backtesting.GetPositionRisks(positionId, cancellationToken);
        }

        public Task<int> AddPositionSL(string positionId, Data.Backtesting.PositionSL positionSL)
        {
            return _TestingViewDb.Backtesting.AddPositionSL(positionId, positionSL);
        }

        public IAsyncEnumerable<Data.Backtesting.PositionSL> GetPositionSLs(string positionId, CancellationToken cancellationToken)
        {
            return _TestingViewDb.Backtesting.GetPositionSLs(positionId, cancellationToken);
        }

        public Task<int> AddPositionTP(string positionId, Data.Backtesting.PositionTP positionTP)
        {
            return _TestingViewDb.Backtesting.AddPositionTP(positionId, positionTP);
        }

        public IAsyncEnumerable<Data.Backtesting.PositionTP> GetPositionTPs(string positionId, CancellationToken cancellationToken)
        {
            return _TestingViewDb.Backtesting.GetPositionTPs(positionId, cancellationToken);
        }

        public IAsyncEnumerable<Data.Backtesting.PositionShape> GetPositionShapes(string positionId, CancellationToken cancellationToken)
        {
            return _TestingViewDb.Backtesting.GetPositionShapes(positionId, cancellationToken);
        }

        public Task<int> SetPositionShape(string positionId, Data.Backtesting.PositionShape positionShape)
        {
            return _TestingViewDb.Backtesting.SetPositionShape(positionId, positionShape);
        }

        public Task<int> DeletePosition(string positionId)
        {
            return _TestingViewDb.Backtesting.DeletePosition(positionId);
        }

        public IAsyncEnumerable<Data.Backtesting.SessionSymbolLastPrice> GetSessionSymbolLastPrices(Guid sessionId, CancellationToken cancellationToken)
        {
            return _TestingViewDb.Backtesting.GetSessionSymbolLastPrices(sessionId, cancellationToken);
        }

        public Task<int> UpdateLastPrice(Guid sessionId, int symbolId, double lastPrice)
        {
            return _TestingViewDb.Backtesting.UpdateLastPrice(sessionId, symbolId, lastPrice);
        }

        public Task<int> UpdatePositionQuantity(string positionId, double quantity, CancellationToken cancellationToken)
        {
            return _TestingViewDb.Backtesting.UpdatePositionQuantity(positionId, quantity, cancellationToken);
        }

        public async Task<Guid> CloneSession(Guid sessionId, string newName = null)
        {
            // Create the new session row first with the provided name
            var source = await _TestingViewDb.Backtesting.GetSession(sessionId, CancellationToken.None);
            var clone = new Data.Backtesting.Session
            {
                SessionId = Guid.NewGuid(),
                UserId = source.UserId,
                Name = newName ?? source.Name,
                Capital = source.Capital,
                Equity = source.Equity,
                CurrencyId = source.CurrencyId,
                CurrentDate = source.CurrentDate,
                RandomizedStartDate = source.RandomizedStartDate,
                RandomizedEndDate = source.RandomizedEndDate
            };

            await _TestingViewDb.Backtesting.CreateSession(clone);

            // Now copy all related data via proc
            await _TestingViewDb.Backtesting.CloneSession(sessionId, clone.SessionId);
            return clone.SessionId;
        }

        protected override void Log(string info, LogLevel logLevel = LogLevel.Trace)
        {
            base.Log($"[{nameof(TestingViewBacktestingDataService)}] {info}", logLevel);
        }
    }
}
