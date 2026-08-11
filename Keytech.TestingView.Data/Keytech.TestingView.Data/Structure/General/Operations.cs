using System.Data;
using Microsoft.Data.SqlClient;
using System.Threading;
using System.Threading.Tasks;
using Keytech.Framework.Data.Extensions;
using Keytech.Framework.Core.Extensions;

namespace Keytech.TestingView.Data
{
    public partial class TestingViewContext
    {
        public partial class GeneralSchema
        {
            public async Task<T> GetParameterValue<T>(Data.General.ParameterId parameterId)
            {
                string parameterValue = await _db.CallFunction<string>("[General].GetParameterValue", CancellationToken.None,
                    new SqlParameter("@ParameterId", SqlDbType.SmallInt).SetValue(parameterId));

                return parameterValue.Convert<T>();
            }
        }
    }
}