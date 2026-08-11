using Keytech.Framework.Data.Extensions;
using Keytech.Framework.JSON.Extensions;
using Microsoft.Data.SqlClient;
using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace Keytech.TestingView.Data
{
    public partial class TestingViewContext
    {
        public partial class UISchema
        {
            public IAsyncEnumerable<Data.UI.SessionTimeframeResolution> GetSessionTimeframeResolutions(Guid sessionId, CancellationToken cancellationToken)
            {
                IAsyncEnumerable<object[]> rows = _db.Query("[UI].[GetSessionTimeframeResolutions]", cancellationToken,
                    [
                        new SqlParameter("@SessionId", SqlDbType.UniqueIdentifier).SetValue(sessionId)
                    ]);

                return rows.Select((object[] row) => new Data.UI.SessionTimeframeResolution
                {
                    SessionId = row[0].As<Guid>(),
                    TimeframeSeconds = row[1].As<int>(),
                    IsFastForward = row[2].As<bool>(),
                    Resolution = row[3].As<string>(),
                    CreationDate = row[4].As<DateTimeOffset>()
                });
            }

            // Upsert a single resolution for a session/timeframe
            public Task<int> SetSessionTimeframeResolution(Guid sessionId, int timeframeSeconds, string resolution)
            {
                return _db.Exec("[UI].[SetSessionTimeframeResolution]", CancellationToken.None,
                    new SqlParameter("@SessionId", SqlDbType.UniqueIdentifier).SetValue(sessionId),
                    new SqlParameter("@TimeframeSeconds", SqlDbType.Int).SetValue(timeframeSeconds),
                    new SqlParameter("@Resolution", SqlDbType.VarChar, 50).SetValue(resolution));
            }

            public Task<int> SetSessionTimeframeFastForwardResolution(Guid sessionId, int timeframeSeconds, string resolution)
            {
                return _db.Exec("[UI].[SetSessionTimeframeFastForwardResolution]", CancellationToken.None,
                    new SqlParameter("@SessionId", SqlDbType.UniqueIdentifier).SetValue(sessionId),
                    new SqlParameter("@TimeframeSeconds", SqlDbType.Int).SetValue(timeframeSeconds),
                    new SqlParameter("@Resolution", SqlDbType.VarChar, 50).SetValue(resolution));
            }
        }
    }
}