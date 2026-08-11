using Keytech.TestingView.Web.FE.Services;
using Xunit;

namespace Keytech.TestingView.Web.FE.Tests;

public class KnowledgeBaseServiceTests
{
    [Fact]
    public void Parse_extracts_questions()
    {
        const string md = """
            ## Platform

            ### Q: What is TestingView?

            Answer line one.

            ### Q: Second question?

            Second answer.
            """;

        var doc = KnowledgeBaseService.Parse(md);
        Assert.Single(doc.Categories);
        Assert.Equal(2, doc.AllItems.Count);
        Assert.Equal("What is TestingView?", doc.AllItems[0].Question);
    }

    [Fact]
    public void Slugify_normalizes_text()
    {
        var slug = KnowledgeBaseService.Slugify("What is TestingView?");
        Assert.DoesNotContain("?", slug);
        Assert.Contains("testingview", slug);
    }

    [Fact]
    public void NormalizeCategoryTitle_strips_mojibake_prefix()
    {
        var title = KnowledgeBaseService.NormalizeCategoryTitle("âš™ï¸ Platform & Compatibility");
        Assert.Equal("Platform & Compatibility", title);
    }
}
