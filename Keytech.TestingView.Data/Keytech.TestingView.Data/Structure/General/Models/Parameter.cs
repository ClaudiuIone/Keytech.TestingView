using Keytech.Framework.Data;
using System.Collections.Generic;

namespace Keytech.TestingView.Data.General
{
    public enum ParameterId : short
    {
        LogLevel = 1,
    }

    public partial class Parameter : KeytechEntity
    {
        public Data.General.ParameterId ParameterId { get; set; }
        public string Name { get; set; }
        public string ParameterValue { get; set; }
    }
}

namespace TCS.Cinemadad.Data
{
    public partial class TestingViewContext
    {
        public partial class GeneralSchema
        {
            public List<Keytech.TestingView.Data.General.Parameter> Parameters {get; set;}
        }
    }
}
