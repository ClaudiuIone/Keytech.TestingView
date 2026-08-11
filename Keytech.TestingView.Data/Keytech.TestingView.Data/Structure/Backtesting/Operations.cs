using Keytech.Framework.Data.Extensions;
using Microsoft.Data.SqlClient;
using System.Collections.Generic;
using System.Data;
using System.Threading;
using System.Linq;
using System;
using System.Threading.Tasks;
using Keytech.Framework.JSON.Extensions;

namespace Keytech.TestingView.Data
{
    public partial class TestingViewContext
    {
        public partial class BacktestingSchema
        {
            public IAsyncEnumerable<Data.Backtesting.SymbolRuleContractSize> GetSymbolRuleContractSizes(string symbolType, CancellationToken cancellationToken)
            {
                IAsyncEnumerable<object[]> rows = _db.Query("[Backtesting].GetSymbolRuleContractSizes", cancellationToken,
                        [
                        new SqlParameter("@SymbolType", SqlDbType.VarChar, 50).SetValue(symbolType)
                        ]);

                return rows.Select((object[] row) => new Backtesting.SymbolRuleContractSize
                {
                    SymbolRuleId = row[0].As<int>(),
                    SymbolType = row[1].As<string>(),
                    SymbolNameRegex = row[2].As<string>(),
                    Priority = row[3].As<short>(),
                    ContractSize = row[4].As<double>(),
                    PointSize = row[5].As<double>(),
                    CreationDate = row[6].As<DateTimeOffset>(),
                });
            }

            public async Task<Data.Backtesting.Symbol> GetSymbolById(int symbolId, CancellationToken cancellationToken)
            {
                IAsyncEnumerable<object[]> rows = _db.Query("[Backtesting].GetSymbolById", cancellationToken,
                        [
                        new SqlParameter("@SymbolID", SqlDbType.Int).SetValue(symbolId)
                        ]);

                return await rows.Select((object[] row) => new Backtesting.Symbol
                {
                    SymbolId = row[0].As<int>(),
                    SymbolName = row[1].As<string>(),
                    SymbolType = row[2].As<string>(),
                    CurrencyId = row[3].As<string>(),
                    QuantityPrecision = row[4].As<short>(),
                    PricePrecision = row[5].As<short>()
                }).SingleOrDefaultAsync();
            }

            public async Task<Data.Backtesting.Symbol> GetSymbolByName(string symbolName, CancellationToken cancellationToken)
            {
                IAsyncEnumerable<object[]> rows = _db.Query("[Backtesting].GetSymbolByName", cancellationToken,
                        [
                        new SqlParameter("@SymbolName", SqlDbType.VarChar, 50).SetValue(symbolName)
                        ]);

                return await rows.Select((object[] row) => new Backtesting.Symbol
                {
                    SymbolId = row[0].As<int>(),
                    SymbolName = row[1].As<string>(),
                    SymbolType = row[2].As<string>(),
                    CurrencyId = row[3].As<string>(),
                    QuantityPrecision = row[4].As<short>(),
                    PricePrecision = row[5].As<short>()
                }).SingleOrDefaultAsync();
            }

            public async Task<Data.Backtesting.Symbol> SaveSymbol(Data.Backtesting.Symbol symbol)
            {
                IAsyncEnumerable<object[]> rows = _db.Query("[Backtesting].SaveSymbol", CancellationToken.None,
                        [
                        new SqlParameter("@SymbolName", SqlDbType.VarChar, 50).SetValue(symbol.SymbolName),
                        new SqlParameter("@SymbolType", SqlDbType.VarChar, 50).SetValue(symbol.SymbolType),
                        new SqlParameter("@CurrencyId", SqlDbType.Char, 3).SetValue(symbol.CurrencyId),
                        new SqlParameter("@QuantityPrecision", SqlDbType.SmallInt).SetValue(symbol.QuantityPrecision),
                        new SqlParameter("@PricePrecision", SqlDbType.SmallInt).SetValue(symbol.PricePrecision)
                        ]);

                return await rows.Select((object[] row) => new Backtesting.Symbol
                {
                    SymbolId = row[0].As<int>(),
                    SymbolName = row[1].As<string>(),
                    SymbolType = row[2].As<string>(),
                    CurrencyId = row[3].As<string>(),
                    QuantityPrecision = row[4].As<short>(),
                    PricePrecision = row[5].As<short>()
                }).SingleOrDefaultAsync();
            }

            public IAsyncEnumerable<Data.Backtesting.Session> GetSessions(Guid userId, bool includeDeleted, CancellationToken cancellationToken)
            {
                IAsyncEnumerable<object[]> rows = _db.Query("[Backtesting].GetSessions", cancellationToken,
                        [
                        new SqlParameter("@UserId", SqlDbType.UniqueIdentifier).SetValue(userId),
                        new SqlParameter("@IncludeDeleted", SqlDbType.Bit).SetValue(includeDeleted),
                        ]);

                return rows.Select((object[] row) => new Backtesting.Session
                {
                    SessionId = row[0].As<Guid>(),
                    UserId = row[1].As<Guid>(),
                    Name = row[2].As<string>(),
                    Capital = row[3].As<double>(),
                    Equity = row[4].As<double>(),
                    CurrencyId = row[5].As<string>(),
                    CurrentDate = row[6].As<DateTimeOffset>(),
                    RandomizedStartDate = row[7].As<DateTimeOffset?>(),
                    RandomizedEndDate = row[8].As<DateTimeOffset?>(),
                    Positions = Enumerable.Repeat<Backtesting.Position>(null, row[9].As<int>()).ToList(),
                    CreationDate = row[10].As<DateTimeOffset>(),
                    LastUpdate = row[11].As<DateTimeOffset>()
                });
            }

            public async Task<Data.Backtesting.Session> GetSession(Guid sessionId, CancellationToken cancellationToken)
            {
                IAsyncEnumerable<object[]> rows = _db.Query("[Backtesting].GetSession", cancellationToken,
                        [
                        new SqlParameter("@SessionId", SqlDbType.UniqueIdentifier).SetValue(sessionId)
                        ]);
                return await rows.Select((object[] row) => new Backtesting.Session
                {
                    SessionId = row[0].As<Guid>(),
                    UserId = row[1].As<Guid>(),
                    Name = row[2].As<string>(),
                    Capital = row[3].As<double>(),
                    Equity = row[4].As<double>(),
                    CurrencyId = row[5].As<string>(),
                    CurrentDate = row[6].As<DateTimeOffset>(),
                    RandomizedStartDate = row[7].As<DateTimeOffset?>(),
                    RandomizedEndDate = row[8].As<DateTimeOffset?>(),
                    CreationDate = row[7].As<DateTimeOffset>(),
                    LastUpdate = row[8].As<DateTimeOffset>()
                }).SingleOrDefaultAsync();
            }

            public Task<int> CreateSession(Data.Backtesting.Session session)
            {
                return _db.Exec("[Backtesting].CreateSession", CancellationToken.None,
                    new SqlParameter("@SessionJson", SqlDbType.NVarChar, -1).SetValue(session.ToJson()));
            }

            public Task<int> UpdateSession(Data.Backtesting.Session session, bool allowPastDate)
            {
                return _db.Exec("[Backtesting].UpdateSession", CancellationToken.None,
                    new SqlParameter("@SessionJson", SqlDbType.NVarChar, -1).SetValue(session.ToJson()),
                    new SqlParameter("@AllowPastDate", SqlDbType.Bit).SetValue(allowPastDate));
            }

            public Task<int> DeleteSession(Guid sessionId)
            {
                return _db.Exec("[Backtesting].DeleteSession", CancellationToken.None,
                    new SqlParameter("@SessionId", SqlDbType.UniqueIdentifier).SetValue(sessionId));
            }

            public Task<string> GetSessionParameterValue(Guid sessionId, short parameterId, CancellationToken cancellationToken)
            {
                return _db.CallFunction<string>("[Backtesting].[GetSessionParameterValue]", cancellationToken);
            }

            public IAsyncEnumerable<Data.Backtesting.SessionParameter> GetSessionParameters(Guid sessionId, CancellationToken cancellationToken)
            {
                IAsyncEnumerable<object[]> rows = _db.Query("[Backtesting].[GetSessionParameters]", cancellationToken,
                    [
                        new SqlParameter("@SessionId", SqlDbType.UniqueIdentifier).SetValue(sessionId)
                    ]);

                return rows.Select((object[] row) => new Data.Backtesting.SessionParameter
                {
                    ParameterId = row[0].As<Data.Backtesting.SessionParameterId>(),
                    ParameterValue = row[1].As<string>(),
                    CreationDate = row[2].As<DateTimeOffset>()
                });
            }

            public Task<int> SetSessionParameterValue(Guid sessionId, Data.Backtesting.SessionParameterId parameterId, string parameterValue)
            {
                return _db.Exec("[Backtesting].[SetSessionParameterValue]", CancellationToken.None,
                    new SqlParameter("@SessionId", SqlDbType.UniqueIdentifier).SetValue(sessionId),
                    new SqlParameter("@ParameterId", SqlDbType.SmallInt).SetValue(parameterId),
                    new SqlParameter("@ParameterValue", SqlDbType.NVarChar, -1).SetValue(parameterValue));
            }

            public IAsyncEnumerable<Data.Backtesting.Position> GetPositions(Guid sessionId, CancellationToken cancellationToken)
            {
                IAsyncEnumerable<object[]> rows = _db.Query("[Backtesting].GetPositions", cancellationToken,
                        [
                        new SqlParameter("@SessionId", SqlDbType.UniqueIdentifier).SetValue(sessionId)
                        ]);

                return rows.Select((object[] row) => new Backtesting.Position
                    {
                        PositionId = row[0].As<string>(),
                        SymbolId = row[1].As<int>(),
                        SessionId = row[2].As<Guid>(),
                        Quantity = row[3].As<double>(),
                        EntryPrice = row[4].As<double>(),
                        EntryTime = row[5].As<DateTimeOffset>(),
                        EntryCurrencyRate = row[6].As<double>(),
                        ExitPrice = row[7].As<double?>(),
                        ExitTime = row[8].As<DateTimeOffset?>(),
                        ExitReason = row[9].As<short?>(),
                        CreationDate = row[10].As<DateTimeOffset>(),
                    });
            }

            public Task<int> CreatePosition(Data.Backtesting.Position position)
            {
                return _db.Exec("[Backtesting].CreatePosition", CancellationToken.None,
                    new SqlParameter("@PositionId", SqlDbType.VarChar, 50).SetValue(position.PositionId),
                    new SqlParameter("@SymbolId", SqlDbType.Int).SetValue(position.SymbolId),
                    new SqlParameter("@SessionId", SqlDbType.UniqueIdentifier).SetValue(position.SessionId),
                    new SqlParameter("@Quantity", SqlDbType.Float).SetValue(position.Quantity),
                    new SqlParameter("@EntryPrice", SqlDbType.Float).SetValue(position.EntryPrice),
                    new SqlParameter("@EntryTime", SqlDbType.DateTimeOffset).SetValue(position.EntryTime),
                    new SqlParameter("@EntryCurrencyRate", SqlDbType.Float).SetValue(position.EntryCurrencyRate));
            }

            public Task<int> ClosePosition(Data.Backtesting.Position position)
            {
                return _db.Exec("[Backtesting].ClosePosition", CancellationToken.None,
                    new SqlParameter("@PositionId", SqlDbType.VarChar, 50).SetValue(position.PositionId),
                    new SqlParameter("@ExitPrice", SqlDbType.Float).SetValue(position.ExitPrice),
                    new SqlParameter("@ExitTime", SqlDbType.DateTimeOffset).SetValue(position.ExitTime),
                    new SqlParameter("@ExitReason", SqlDbType.SmallInt).SetValue(position.ExitReason));
            }

            public Task<int> AddPositionBE(string positionId, Data.Backtesting.PositionBE positionBE)
            {
                return _db.Exec("[Backtesting].AddPositionBE", CancellationToken.None,
                    new SqlParameter("@PositionId", SqlDbType.VarChar, 50).SetValue(positionId),
                    new SqlParameter("@BE", SqlDbType.Float).SetValue(positionBE.BE),
                    new SqlParameter("@BarTime", SqlDbType.DateTimeOffset, 0).SetValue(positionBE.BarTime));
            }

            public IAsyncEnumerable<Data.Backtesting.PositionBE> GetPositionBEs(string positionId, CancellationToken cancellationToken)
            {
                IAsyncEnumerable<object[]> rows = _db.Query("[Backtesting].GetPositionBEs", cancellationToken,
                     [
                     new SqlParameter("@PositionId", SqlDbType.VarChar, 50).SetValue(positionId)
                     ]);

                return rows.Select((object[] row) => new Data.Backtesting.PositionBE
                {
                    BE = row[0].As<double>(),
                    BarTime = row[1].As<DateTimeOffset>(),
                    CreationDate = row[2].As<DateTimeOffset>(),
                });
            }

            public Task<int> AddPositionRisk(string positionId, Data.Backtesting.PositionRisk positionRisk)
            {
                return _db.Exec("[Backtesting].AddPositionRisk", CancellationToken.None,
                    new SqlParameter("@PositionId", SqlDbType.VarChar, 50).SetValue(positionId),
                    new SqlParameter("@Risk", SqlDbType.Float).SetValue(positionRisk.Risk),
                    new SqlParameter("@BarTime", SqlDbType.DateTimeOffset, 0).SetValue(positionRisk.BarTime));
            }


            public IAsyncEnumerable<Data.Backtesting.PositionRisk> GetPositionRisks(string positionId, CancellationToken cancellationToken)
            {
                IAsyncEnumerable<object[]> rows = _db.Query("[Backtesting].GetPositionRisks", cancellationToken,
                     [
                     new SqlParameter("@PositionId", SqlDbType.VarChar, 50).SetValue(positionId)
                     ]);

                return rows.Select((object[] row) => new Data.Backtesting.PositionRisk
                {
                    Risk = row[0].As<double>(),
                    BarTime = row[1].As<DateTimeOffset>(),
                    CreationDate = row[2].As<DateTimeOffset>(),
                });
            }

            public Task<int> AddPositionSL(string positionId, Data.Backtesting.PositionSL positionSL)
            {
                return _db.Exec("[Backtesting].AddPositionSL", CancellationToken.None,
                    new SqlParameter("@PositionId", SqlDbType.VarChar, 50).SetValue(positionId),
                    new SqlParameter("@SL", SqlDbType.Float).SetValue(positionSL.SL),
                    new SqlParameter("@BarTime", SqlDbType.DateTimeOffset, 0).SetValue(positionSL.BarTime));
            }

            public IAsyncEnumerable<Data.Backtesting.PositionSL> GetPositionSLs(string positionId, CancellationToken cancellationToken)
            {
                IAsyncEnumerable<object[]> rows = _db.Query("[Backtesting].GetPositionSLs", cancellationToken,
                     [
                     new SqlParameter("@PositionId", SqlDbType.VarChar, 50).SetValue(positionId)
                     ]);

                return rows.Select((object[] row) => new Data.Backtesting.PositionSL
                {
                    SL = row[0].As<double>(),
                    BarTime = row[1].As<DateTimeOffset>(),
                    CreationDate = row[2].As<DateTimeOffset>(),
                });
            }

            public Task<int> AddPositionTP(string positionId, Data.Backtesting.PositionTP positionTP)
            {
                return _db.Exec("[Backtesting].AddPositionTP", CancellationToken.None,
                    new SqlParameter("@PositionId", SqlDbType.VarChar, 50).SetValue(positionId),
                    new SqlParameter("@TP", SqlDbType.Float).SetValue(positionTP.TP),
                    new SqlParameter("@BarTime", SqlDbType.DateTimeOffset, 0).SetValue(positionTP.BarTime));
            }

            public IAsyncEnumerable<Data.Backtesting.PositionTP> GetPositionTPs(string positionId, CancellationToken cancellationToken)
            {
                IAsyncEnumerable<object[]> rows = _db.Query("[Backtesting].GetPositionTPs", cancellationToken,
                     [
                     new SqlParameter("@PositionId", SqlDbType.VarChar, 50).SetValue(positionId)
                     ]);

                return rows.Select((object[] row) => new Data.Backtesting.PositionTP
                {
                    TP = row[0].As<double>(),
                    BarTime = row[1].As<DateTimeOffset>(),
                    CreationDate = row[2].As<DateTimeOffset>(),
                });
            }

            public IAsyncEnumerable<Data.Backtesting.PositionShape> GetPositionShapes(string positionId, CancellationToken cancellationToken)
            {
                IAsyncEnumerable<object[]> rows = _db.Query("[Backtesting].GetPositionShapes", cancellationToken,
                    [
                    new SqlParameter("@PositionId", SqlDbType.VarChar, 50).SetValue(positionId)
                    ]);

                return rows.Select((object[] row) => new Data.Backtesting.PositionShape
                {
                    ShapeId = row[0].As<string>(),
                    Name = row[1].As<string>(),
                    EndTime = row[2].As<DateTimeOffset>(),
                    StopPrice = row[3].As<double>(),
                    TargetPrice = row[4].As<double>()
                });
            }

            public Task<int> SetPositionShape(string positionId, Data.Backtesting.PositionShape positionShape)
            {
                return _db.Exec("[Backtesting].SetPositionShape", CancellationToken.None,
                    new SqlParameter("@PositionId", SqlDbType.VarChar, 50).SetValue(positionId),
                    new SqlParameter("@ShapeId", SqlDbType.VarChar, 50).SetValue(positionShape.ShapeId),
                    new SqlParameter("@Name", SqlDbType.VarChar, 50).SetValue(positionShape.Name),
                    new SqlParameter("@EndTime", SqlDbType.DateTimeOffset).SetValue(positionShape.EndTime),
                    new SqlParameter("@StopPrice", SqlDbType.Float).SetValue(positionShape.StopPrice),
                    new SqlParameter("@TargetPrice", SqlDbType.Float).SetValue(positionShape.TargetPrice));
            }

            public Task<int> DeletePosition(string positionId)
            {
                return _db.Exec("[Backtesting].[DeletePosition]", CancellationToken.None,
                    new SqlParameter("@PositionId", SqlDbType.VarChar, 50).SetValue(positionId));
            }

            public IAsyncEnumerable<Data.Backtesting.SessionSymbolLastPrice> GetSessionSymbolLastPrices(Guid sessionId, CancellationToken cancellationToken)
            {
                IAsyncEnumerable<object[]> rows = _db.Query("[Backtesting].[GetSessionSymbolLastPrices]", cancellationToken,
                    [
                        new SqlParameter("@SessionId", SqlDbType.UniqueIdentifier).SetValue(sessionId)
                    ]);

                return rows.Select((object[] row) => new Data.Backtesting.SessionSymbolLastPrice
                {
                    SymbolId = row[0].As<int>(),
                    LastPrice = row[1].As<double>(),
                    LastUpdate = row[2].As<DateTimeOffset>(),
                    CreationDate = row[3].As<DateTimeOffset>()
                });
            }

            public Task<int> UpdateLastPrice(Guid sessionId, int symbolId, double lastPrice)
            {
                return _db.Exec("[Backtesting].[UpdateLastPrice]", CancellationToken.None,
                    new SqlParameter("@SessionId", SqlDbType.UniqueIdentifier).SetValue(sessionId),
                    new SqlParameter("@SymbolId", SqlDbType.Int).SetValue(symbolId),
                    new SqlParameter("@LastPrice", SqlDbType.Float).SetValue(lastPrice));
            }

            public Task<int> UpdatePositionQuantity(string positionId, double quantity, CancellationToken cancellationToken)
            {
                return _db.Exec("[Backtesting].[UpdatePositionQuantity]", cancellationToken,
                    new SqlParameter("@PositionId", SqlDbType.VarChar, 50).SetValue(positionId),
                    new SqlParameter("@Quantity", SqlDbType.Float).SetValue(quantity));
            }

            public Task<int> CloneSession(Guid sourceSessionId, Guid targetSessionId)
            {
                return _db.Exec("[Backtesting].[CloneSession]", CancellationToken.None,
                    new SqlParameter("@SourceSessionId", SqlDbType.UniqueIdentifier).SetValue(sourceSessionId),
                    new SqlParameter("@TargetSessionId", SqlDbType.UniqueIdentifier).SetValue(targetSessionId));
            }
        }
    }
}