using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Keytech.Framework.Core.Extensions;
using Microsoft.Extensions.Logging;
using System.IO;
using OfficeOpenXml;
using Newtonsoft.Json.Linq;
using Keytech.Framework.Core.Helpers;
using Keytech.Framework.JSON.Extensions;

namespace Keytech.TestingView.Data.Services
{
    public class TestingViewJournalingDataService : TestingViewDataService
    {
        static TestingViewJournalingDataService()
        {
        }

        protected TestingViewJournalingDataService(TestingViewContext TestingViewDb) : base(TestingViewDb)
        {
        }

        public async static Task<TestingViewJournalingDataService> CreateService(string TestingViewConnectionString)
        {
            TestingViewContext TestingViewDb = await TestingViewContext.CreateDb(TestingViewConnectionString);
            return new TestingViewJournalingDataService(TestingViewDb);
        }

        public IAsyncEnumerable<Data.Journaling.SessionColumn> GetSessionColumns(Guid sessionId, CancellationToken cancellationToken)
        {
            return _TestingViewDb.Journaling.GetSessionColumns(sessionId, cancellationToken);
        }

        public IAsyncEnumerable<Data.Journaling.SessionColumn> SaveSessionColumns(Guid sessionId, IEnumerable<Data.Journaling.SessionColumn> sessionColumns)
        {
            return _TestingViewDb.Journaling.SaveSessionColumns(sessionId, sessionColumns.Select((s, i) => { s.Priority = (short)(i + 1); return s; }));
        }

        public IAsyncEnumerable<Data.Journaling.PositionColumn> GetPositionColumns(string positionId, CancellationToken cancellationToken)
        {
            return _TestingViewDb.Journaling.GetPositionColumns(positionId, cancellationToken);
        }

        public Task<int> SetPositionColumns(string positionId, IEnumerable<Data.Journaling.PositionColumn> positionColumns)
        {
            return _TestingViewDb.Journaling.SetPositionColumns(positionId, positionColumns);
        }

        public Task<string> GetColumnType(Guid sessionId, string columnName)
        {
            CacheStore<(Guid, string), string>.Expiration = TimeSpan.FromSeconds(10);
            return CacheStore<(Guid, string), string>.GetOrAdd((sessionId, columnName), () => _TestingViewDb.Journaling.GetColumnType(sessionId, columnName));
        }

        public IAsyncEnumerable<Data.Journaling.PositionSnapshot> GetPositionSnapshots(string positionId, CancellationToken cancellationToken)
        {
            return _TestingViewDb.Journaling.GetPositionSnapshots(positionId, cancellationToken);
        }

        public Task<int> SetPositionSnapshots(string positionId, Data.Journaling.PositionSnapshot[] positionSnapshots)
        {
            for (int i = 0; i < positionSnapshots.Length; i++)
            {
                positionSnapshots[i].Priority = (short)(i + 1);
            }

            return _TestingViewDb.Journaling.SetPositionSnapshots(positionId, positionSnapshots);
        }

        public async Task<MemoryStream> JournalToExcel(JObject journalData, CancellationToken cancellationToken)
        {
            ExcelPackage.License.SetNonCommercialPersonal("TestingView");

            var stream = new MemoryStream();
            using (var package = new ExcelPackage(stream))
            {
                ExcelWorksheet worksheet = package.Workbook.Worksheets.Add("Positions");
                JObject[] positionEntries = (journalData["positionEntries"] as JArray).Cast<JObject>().ToArray();

                var header = worksheet.Cells["A1"]
                    .LoadFromArrays([positionEntries[0].Properties().Select(p => p.Name).ToArray()]);

                header.AutoFilter = true;
                header.Style.Font.Bold = true;
                worksheet.View.FreezePanes(2, 1);

                for (int row = 0; row < positionEntries.Length; row++)
                {
                    JObject positionEntry = positionEntries[row];
                    JProperty[] positionColumns = positionEntry.Properties().ToArray();
                    for (int col = 0; col < positionColumns.Length; col++)
                    {
                        JProperty positionColumn = positionColumns[col];
                        ExcelRange cell = worksheet.Cells[row + 2, col + 1];
                        string columnType = await this.GetColumnType(Guid.Parse(journalData.Get("sessionId")), positionColumn.Name);
                        string columnValue = positionColumn.Value.ToString();
                        if (columnType == "datetime" || new[] { "Entry Date", "Exit Date" }.Contains(positionColumn.Name))
                        {
                            if (columnValue.HasValue())
                            {
                                if (DateTime.TryParse(columnValue, out DateTime value))
                                {
                                    cell.Value = value;
                                }
                            }
                            cell.Style.Numberformat.Format = "yyyy-mm-dd";
                        }
                        else if (columnType == "time" || new[] { "Entry Time", "Exit Time", "Analysis Time" }.Contains(positionColumn.Name))
                        {
                            if (columnValue.HasValue())
                            {
                                if (TimeSpan.TryParse(columnValue, out TimeSpan timeSpan))
                                {
                                    cell.Value = timeSpan;
                                }
                            }
                            cell.Style.Numberformat.Format = "hh:mm";
                        }
                        else if (columnType == "number" || new[] { "Entry Price", "Entry Price", "Exit Price", "Lots", "Risk USD", "Risk %", "SL", "TP", "BE", "RR", "Profit USD", "Profit %", "Cumulative profit USD", "Cumulative profit %", "Run-up USD", "Run-up %", "Drawdown USD", "Drawdown %", "BE Run-up USD", "BE Run-up %", "Virtual Run-up USD", "Virtual Run-up %", "Virtual Drawdown USD", "Virtual Drawdown %", "Virtual BE Run-up USD", "Virtual BE Run-up %" }.Contains(positionColumn.Name))
                        {
                            if (columnValue.HasValue())
                            {
                                if (Double.TryParse(columnValue, out double value))
                                {
                                    cell.Value = value;
                                }
                            }
                            cell.Style.Numberformat.Format = "#,##0.00000";
                        }
                        else
                        {
                            cell.Value = columnValue;
                        }
                    }
                }

                await package.SaveAsync(cancellationToken);
                stream.Position = 0;
            }

            return stream;
        }

        protected override void Log(string info, LogLevel logLevel = LogLevel.Trace)
        {
            base.Log($"[{nameof(TestingViewJournalingDataService)}] {info}", logLevel);
        }
    }
}
