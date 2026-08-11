using System;
using System.Data;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using System.Threading;
using Microsoft.Data.SqlClient;
using Keytech.Framework.Data.Extensions;

namespace Keytech.TestingView.Data
{
    public partial class TestingViewContext
    {
        public partial class ProcessingSchema
        {
            public async Task ClearLogs()
            {
                await _db.Exec("[Processing].ClearLogs", CancellationToken.None,
                    new SqlParameter("@MaxDate", SqlDbType.DateTimeOffset, 0).SetValue(DateTimeOffset.Now));
            }

            public async Task InsertLog(string info, LogLevel logLevel)
            {
                await _db.Exec("[Processing].Log", CancellationToken.None,
                    new SqlParameter("@Info", SqlDbType.NVarChar, -1).SetValue(info),
                    new SqlParameter("@LogLevel", SqlDbType.SmallInt).SetValue(logLevel));
            }
        }
    }
}