using Keytech.Framework.Data.Extensions;
using Microsoft.Data.SqlClient;
using System.Collections.Generic;
using System.Data;
using System.Threading;
using System.Linq;
using System;
using System.Diagnostics;
using System.Threading.Tasks;
using Keytech.Framework.JSON.Extensions;

namespace Keytech.TestingView.Data
{
    public partial class TestingViewContext
    {
        public partial class JournalingSchema
        {
            public IAsyncEnumerable<Data.Journaling.SessionColumn> GetSessionColumns(Guid sessionId, CancellationToken cancellationToken)
            {
                IAsyncEnumerable<object[]> rows = _db.Query("[Journaling].GetSessionColumns", cancellationToken,
                        [
                        new SqlParameter("@SessionId", SqlDbType.UniqueIdentifier).SetValue(sessionId)
                        ]);

                return rows.Select((object[] row) => new Journaling.SessionColumn
                {
                    Priority = row[0].As<short>(),
                    ColumnId = row[1].As<int>(),
                    ColumnName = row[2].As<string>(),
                    ColumnType = row[3].As<string>(),
                    ColumnEnumValues = row[4].As<string>(),
                    Sortable = row[5].As<bool>(),
                    Visible = row[6].As<bool>(),
                    CreationDate = row[7].As<DateTimeOffset>(),
                });
            }

            public IAsyncEnumerable<Data.Journaling.SessionColumn> SaveSessionColumns(Guid sessionId, IEnumerable<Data.Journaling.SessionColumn> sessionColumns)
            {
                IAsyncEnumerable<object[]> rows = _db.Query("[Journaling].SaveSessionColumns", CancellationToken.None,
                        [
                        new SqlParameter("@SessionId", SqlDbType.UniqueIdentifier).SetValue(sessionId),
                        new SqlParameter("@SessionColumnsJson", SqlDbType.NVarChar, -1).SetValue(sessionColumns.ToJson())
                        ]);

                return rows.Select((object[] row) => new Journaling.SessionColumn
                {
                    Priority = row[0].As<short>(),
                    ColumnId = row[1].As<int>(),
                    ColumnName = row[2].As<string>(),
                    ColumnType = row[3].As<string>(),
                    ColumnEnumValues = row[4].As<string>(),
                    Sortable = row[5].As<bool>(),
                    Visible = row[6].As<bool>(),
                    CreationDate = row[7].As<DateTimeOffset>(),
                });
            }

            public IAsyncEnumerable<Data.Journaling.PositionColumn> GetPositionColumns(string positionId, CancellationToken cancellationToken)
            {
                IAsyncEnumerable<object[]> rows = _db.Query("[Journaling].GetPositionColumns", cancellationToken,
                    [
                    new SqlParameter("@PositionId", SqlDbType.VarChar, 50).SetValue(positionId)
                    ]);

                return rows.Select((object[] row) => new Data.Journaling.PositionColumn
                {
                    ColumnId = row[0].As<int>(),
                    Value = row[1].As<string>(),
                    LastUpdate = row[2].As<DateTimeOffset>()
                });
            }

            public Task<int> SetPositionColumns(string positionId, IEnumerable<Data.Journaling.PositionColumn> positionColumns)
            {
                return _db.Exec("[Journaling].SetPositionColumns", CancellationToken.None,
                    new SqlParameter("@PositionId", SqlDbType.VarChar, 50).SetValue(positionId),
                    new SqlParameter("@PositionColumnsJson", SqlDbType.NVarChar, -1).SetValue(positionColumns.ToJson()));
            }

            public Task<string> GetColumnType(Guid sessionId, string columnName)
            {
                return _db.CallFunction<string>("[Journaling].GetColumnType", CancellationToken.None,
                    new SqlParameter("@SessionId", SqlDbType.UniqueIdentifier).SetValue(sessionId),
                    new SqlParameter("@ColumnName", SqlDbType.NVarChar, 50).SetValue(columnName));
            }

            public IAsyncEnumerable<Data.Journaling.PositionSnapshot> GetPositionSnapshots(string positionId, CancellationToken cancellationToken)
            {
                IAsyncEnumerable<object[]> rows = _db.Query("[Journaling].GetPositionSnapshots", cancellationToken,
                    [
                    new SqlParameter("@PositionId", SqlDbType.VarChar, 50).SetValue(positionId)
                    ]);

                return rows.Select((object[] row) => new Data.Journaling.PositionSnapshot
                {
                    Priority = row[0].As<short>(),
                    SnapshotUrl = row[1].As<string>(),
                    SessionTime = row[2].As<DateTimeOffset>()
                });
            }

            public Task<int> SetPositionSnapshots(string positionId, Data.Journaling.PositionSnapshot[] positionSnapshots)
            {
                return _db.Exec("[Journaling].[SetPositionSnapshots]", CancellationToken.None,
                    new SqlParameter("@PositionId", SqlDbType.VarChar, 50).SetValue(positionId),
                    new SqlParameter("@Snapshots", SqlDbType.NVarChar, -1).SetValue(positionSnapshots.ToJson()));
            }
        }
    }
}