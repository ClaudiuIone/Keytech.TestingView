using System;
using System.Threading.Tasks;
using Keytech.Framework.Core.Helpers;
using Microsoft.Extensions.Logging;

namespace Keytech.TestingView.Data
{
    public partial class TestingViewContext
    {
        public GeneralSchema.ParameterValues Settings { get; private set; }

        public partial class GeneralSchema
        {
            public class ParameterValues
            {
                private readonly TestingViewContext _db;

                public ParameterValues(TestingViewContext db)
                {
                    _db = db;
                }

                public Task<LogLevel> GetLogLevel()
                {
                    return this.GetParameterValue<LogLevel>(Data.General.ParameterId.LogLevel);
                }

                private Task<T> GetParameterValue<T>(Data.General.ParameterId parameterId)
                {
                    CacheStore<Data.General.ParameterId, T>.Expiration = TimeSpan.FromMinutes(10);
                    return CacheStore<Data.General.ParameterId, T>.GetOrAdd(parameterId, () => _db.General.GetParameterValue<T>(parameterId));
                }

                private void Log(string info, LogLevel logLevel)
                {
                    _db.Log($"[General.Parameters] {info}", logLevel);
                }
            }
        }
    }
}