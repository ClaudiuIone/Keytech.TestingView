using Microsoft.AspNetCore.Mvc;

namespace Keytech.TestingView.API.Controllers
{
    [ApiController]
    [Route("backtesting")]
    public class TestingViewBacktestingController : ControllerBase
    {
        [HttpGet("symbol-rule-contract-sizes/{symbolType}")]
        public Task<Data.Backtesting.SymbolRuleContractSize[]> GetSymbolRuleContractSizes(string symbolType, CancellationToken cancellationToken)
        {
            return App.TestingViewBacktestingDataService.GetSymbolRuleContractSizes(symbolType, cancellationToken);
        }

        [HttpGet("symbols/{symbolName}")]
        public Task<Data.Backtesting.Symbol> GetSymbolByName(string symbolName, CancellationToken cancellationToken)
        {
            return App.TestingViewBacktestingDataService.GetSymbolByName(symbolName, cancellationToken);
        }

        [HttpPost("symbols")]
        public Task<Data.Backtesting.Symbol> SaveSymbol([FromBody] Data.Backtesting.Symbol symbol)
        {
            return App.TestingViewBacktestingDataService.SaveSymbol(symbol);
        }

        [HttpGet("sessions")]
        public IAsyncEnumerable<Data.Backtesting.Session> GetSessions(Guid userId, CancellationToken cancellationToken)
        {
            return App.TestingViewBacktestingDataService.GetSessions(userId, false, cancellationToken);
        }

        [HttpGet("sessions/{sessionId}")]
        public Task<Data.Backtesting.Session> GetSession(Guid sessionId, CancellationToken cancellationToken)
        {
            return App.TestingViewBacktestingDataService.GetSession(sessionId, cancellationToken);
        }

        [HttpPost("sessions")]
        public Task<Guid> CreateSession([FromBody] Data.Backtesting.Session session)
        {
            return App.TestingViewBacktestingDataService.CreateSession(session);
        }

        [HttpPut("sessions")]
        public Task<int> UpdateSession([FromBody] Data.Backtesting.Session session, [FromQuery] bool allowPastDate = false)
        {
            return App.TestingViewBacktestingDataService.UpdateSession(session, allowPastDate);
        }

        [HttpDelete("sessions/{sessionId}")]
        public Task<int> DeleteSession(Guid sessionId)
        {
            return App.TestingViewBacktestingDataService.DeleteSession(sessionId);
        }

        [HttpGet("sessions/{sessionId}/parameters")]
        public IAsyncEnumerable<Data.Backtesting.SessionParameter> GetSessionParameters(Guid sessionId, CancellationToken cancellationToken)
        {
            return App.TestingViewBacktestingDataService.GetSessionParameters(sessionId, cancellationToken);
        }

        [HttpPut("sessions/{sessionId}/parameters/{parameterId}")]
        public Task<int> SetSessionParameterValue(Guid sessionId, Data.Backtesting.SessionParameterId parameterId, [FromBody] string parameterValue)
        {
            return App.TestingViewBacktestingDataService.SetSessionParameterValue(sessionId, parameterId, parameterValue);
        }

        [HttpGet("positions/{sessionId}")]
        public IAsyncEnumerable<Data.Backtesting.Position> GetPositions(Guid sessionId, CancellationToken cancellationToken)
        {
            return App.TestingViewBacktestingDataService.GetPositions(sessionId, cancellationToken);
        }

        [HttpPost("positions")]
        public Task<int> CreatePosition([FromBody] Data.Backtesting.Position position)
        {
            return App.TestingViewBacktestingDataService.CreatePosition(position);
        }

        [HttpPut("positions/close")]
        public Task<int> ClosePosition([FromBody] Data.Backtesting.Position position)
        {
            return App.TestingViewBacktestingDataService.ClosePosition(position);
        }

        [HttpPut("positions/be/{positionId}")]
        public Task<int> AddPositionBE(string positionId, [FromBody] Data.Backtesting.PositionBE positionBE)
        {
            return App.TestingViewBacktestingDataService.AddPositionBE(positionId, positionBE);
        }

        [HttpGet("positions/be/{positionId}")]
        public IAsyncEnumerable<Data.Backtesting.PositionBE> GetPositionBEs(string positionId, CancellationToken cancellationToken)
        {
            return App.TestingViewBacktestingDataService.GetPositionBEs(positionId, cancellationToken);
        }

        [HttpPut("positions/risk/{positionId}")]
        public Task<int> AddPositionRisk(string positionId, [FromBody] Data.Backtesting.PositionRisk positionRisk)
        {
            return App.TestingViewBacktestingDataService.AddPositionRisk(positionId, positionRisk);
        }

        [HttpGet("positions/risk/{positionId}")]
        public IAsyncEnumerable<Data.Backtesting.PositionRisk> GetPositionRisks(string positionId, CancellationToken cancellationToken)
        {
            return App.TestingViewBacktestingDataService.GetPositionRisks(positionId, cancellationToken);
        }

        [HttpPut("positions/sl/{positionId}")]
        public Task<int> AddPositionSL(string positionId, [FromBody] Data.Backtesting.PositionSL positionSL)
        {
            return App.TestingViewBacktestingDataService.AddPositionSL(positionId, positionSL);
        }

        [HttpGet("positions/sl/{positionId}")]
        public IAsyncEnumerable<Data.Backtesting.PositionSL> GetPositionSLs(string positionId, CancellationToken cancellationToken)
        {
            return App.TestingViewBacktestingDataService.GetPositionSLs(positionId, cancellationToken);
        }

        [HttpPut("positions/tp/{positionId}")]
        public Task<int> AddPositionTP(string positionId, [FromBody] Data.Backtesting.PositionTP positionTP)
        {
            return App.TestingViewBacktestingDataService.AddPositionTP(positionId, positionTP);
        }

        [HttpGet("positions/tp/{positionId}")]
        public IAsyncEnumerable<Data.Backtesting.PositionTP> GetPositionTPs(string positionId, CancellationToken cancellationToken)
        {
            return App.TestingViewBacktestingDataService.GetPositionTPs(positionId, cancellationToken);
        }

        [HttpGet("positions/shapes/{positionId}")]
        public IAsyncEnumerable<Data.Backtesting.PositionShape> GetPositionShapes(string positionId, CancellationToken cancellationToken)
        {
            return App.TestingViewBacktestingDataService.GetPositionShapes(positionId, cancellationToken);
        }

        [HttpPut("positions/shapes/{positionId}")]
        public Task<int> SetPositionShape(string positionId, Data.Backtesting.PositionShape positionShape)
        {
            return App.TestingViewBacktestingDataService.SetPositionShape(positionId, positionShape);
        }

        [HttpDelete("positions/{positionId}")]
        public Task<int> DeletePosition(string positionId)
        {
            return App.TestingViewBacktestingDataService.DeletePosition(positionId);
        }

        [HttpPut("sessions/{sessionId}/symbols/{symbolId}/last-price")]
        public Task<int> UpdateLastPrice(Guid sessionId, int symbolId, [FromBody] double lastPrice)
        {
            return App.TestingViewBacktestingDataService.UpdateLastPrice(sessionId, symbolId, lastPrice);
        }

        [HttpPut("positions/{positionId}/quantity")]
        public Task<int> UpdatePositionQuantity(string positionId, [FromBody] double quantity, CancellationToken cancellationToken)
        {
            return App.TestingViewBacktestingDataService.UpdatePositionQuantity(positionId, quantity, cancellationToken);
        }

        [HttpPost("sessions/{sessionId}/clone")]
        public Task<Guid> CloneSession(Guid sessionId, [FromQuery] string? newName = null)
        {
            return App.TestingViewBacktestingDataService.CloneSession(sessionId, newName);
        }
    }
}