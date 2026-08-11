using Newtonsoft.Json;
using NUglify;
using NUglify.JavaScript;

namespace Keytech.TestingView.API.Processing
{
    public class SrcCompilation
    {
        public static async Task CompileJs(string jsFolder, bool minimize)
        {
            IEnumerable<string> jsFiles = SrcCompilation.GetJsFiles(jsFolder);
            string jsCode = await SrcCompilation.ConcatenateJsFilesContent(jsFiles);

            jsCode = await SrcCompilation.PostProcess(jsCode);

            if(minimize) { 
                UglifyResult uglyJs = Uglify.Js(jsCode, new CodeSettings
                {
                    PreserveImportantComments = false,
                    OutputMode = OutputMode.SingleLine,
                    Format = JavaScriptFormat.Normal,
                    LocalRenaming = LocalRenaming.CrunchAll,
                    MinifyCode = true,
                    PreserveFunctionNames = false,
                });

                jsCode = await SrcCompilation.PostProcessMinimized(uglyJs.Code);
            }

            await File.WriteAllTextAsync(Path.Combine(jsFolder, "testingview.js"), jsCode);
        }

        public static async Task MinimizeCss(string cssFolder)
        {
            UglifyResult uglyCss = Uglify.Css(await File.ReadAllTextAsync(Path.Combine(cssFolder, "testingview.raw.css")), new NUglify.Css.CssSettings
            {
                OutputMode = OutputMode.SingleLine,
            });
            
            await File.WriteAllTextAsync(Path.Combine(cssFolder, "testingview.css"), uglyCss.Code);
        }

        public static async Task MinimizeLoc(string locFolder)
        {
            foreach(string locFile in Directory.EnumerateFiles(locFolder, "*.raw.json", SearchOption.TopDirectoryOnly))
            {
                string minimized = "";
                string content = await File.ReadAllTextAsync(locFile);
                content = content.ReplaceLineEndings("\n");
                foreach (string line in content.Split("\n"))
                {
                    if(line.Trim().Length == 0) continue;

                    string[] parts = line.Split(" ", 2);
                    if(parts.Length == 2) { 
                        minimized += parts[0] + "ν" + parts[1] + "υ";
                    } else
                    {
                        minimized += parts[0] + "υ";
                    }
                }
                
                 await File.WriteAllTextAsync(Path.Combine(locFolder, Path.GetFileName(locFile).Replace(".raw.", ".")), minimized);
            }
        }

        private static async Task<string> PostProcess(string jsCode)
        {
            return "" +
                "import { injectContentsquareScript } from 'https://cdn.jsdelivr.net/npm/@contentsquare/tag-sdk@1.1.0/+esm';" +
                "import {createChart} from 'https://unpkg.com/lightweight-charts@4.2.0?module\';" +
                "import html2canvas from 'https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.esm.js';" +
                "(async () => {" + jsCode + "})();";
        }

        private static async Task<string> PostProcessMinimized(string jsCode)
        {
            jsCode = jsCode.ReplaceLineEndings("\n");
            jsCode = jsCode.Replace("\n", " ");
            jsCode = jsCode.Replace("\t", " ");
            while(jsCode.Contains("  "))
            {
                jsCode = jsCode.Replace("  ", " ");
            }
            return jsCode;
        }

        private static IEnumerable<string> GetJsFiles(string jsFolder)
        {
            return Enumerable.Empty<string>()
                .Append(Path.Combine(jsFolder, "testingview.core.js"))
                .Concat(Directory.EnumerateFiles(jsFolder, "*.js", SearchOption.TopDirectoryOnly)
                .Where(f => Path.GetFileName(f) != "testingview.js")
                .Where(f => Path.GetFileName(f) != "testingview.core.js")
                .Where(f => Path.GetFileName(f) != "testingview.exec.js")
                .Where(f => !Path.GetFileName(f).StartsWith("addon."))
                .Append(Path.Combine(jsFolder, "testingview.exec.js")));
        }

        private static async Task<string> ConcatenateJsFilesContent(IEnumerable<string> jsFiles)
        {
            var sb = new System.Text.StringBuilder();

            foreach (string file in jsFiles)
            {
                string content = await File.ReadAllTextAsync(file);
                string name = Path.GetFileName(file);

                sb.AppendLine($"// BEGIN {name}");
                sb.AppendLine(content);
                sb.AppendLine($"// END {name}");
                sb.AppendLine();
            }

            return sb.ToString();
        }
    }
}
