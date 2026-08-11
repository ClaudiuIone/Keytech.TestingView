using Keytech.TestingView.Data.Journaling;
using Keytech.Framework.IO;
using Microsoft.AspNetCore.Mvc;
using Newtonsoft.Json.Linq;

namespace Keytech.TestingView.API.Controllers
{
    [ApiController]
    [Route("journaling")]
    public class TestingViewJournalingController : ControllerBase
    {
        [HttpGet("session-columns/{sessionId}")]
        public IAsyncEnumerable<Data.Journaling.SessionColumn> GetSessionColumns(Guid sessionId, CancellationToken cancellationToken)
        {
            return App.TestingViewJournalingDataService.GetSessionColumns(sessionId, cancellationToken);
        }

        [HttpPost("session-columns/{sessionId}")]
        public IAsyncEnumerable<Data.Journaling.SessionColumn> SaveSessionColumns(Guid sessionId, [FromBody] IEnumerable<Data.Journaling.SessionColumn> sessionColumns)
        {
            return App.TestingViewJournalingDataService.SaveSessionColumns(sessionId, sessionColumns);
        }


        [HttpGet("positions/columns/{positionId}")]
        public IAsyncEnumerable<PositionColumn> GetPositionColumns(string positionId, CancellationToken cancellationToken)
        {
            return App.TestingViewJournalingDataService.GetPositionColumns(positionId, cancellationToken);
        }

        [HttpPut("positions/columns/{positionId}")]
        public Task<int> SetPositionColumns(string positionId, [FromBody] IEnumerable<PositionColumn> positionColumns)
        {
            return App.TestingViewJournalingDataService.SetPositionColumns(positionId, positionColumns);
        }

        [HttpGet("positions/snapshots/{positionId}")]
        public IAsyncEnumerable<PositionSnapshot> GetPositionSnapshots(string positionId, CancellationToken cancellationToken)
        {
            return App.TestingViewJournalingDataService.GetPositionSnapshots(positionId, cancellationToken);
        }

        [HttpPut("positions/snapshots/{positionId}")]
        public Task<int> SetPositionSnapshots(string positionId, [FromBody] PositionSnapshot[] positionSnapshots)
        {
            return App.TestingViewJournalingDataService.SetPositionSnapshots(positionId, positionSnapshots);
        }

        [HttpPost("export/excel/{sessionName}")]
        public async Task<IActionResult> JournalToExcel(string sessionName, [FromBody] JObject journalData, CancellationToken cancellationToken)
        {
            MemoryStream stream = await App.TestingViewJournalingDataService.JournalToExcel(journalData, cancellationToken);
            return File(stream, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", $"TestingView Session - {FileSystem.EscapeFileName(sessionName)}.xlsx");
        }
    }
}