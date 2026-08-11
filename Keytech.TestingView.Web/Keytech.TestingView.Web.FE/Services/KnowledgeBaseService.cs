using System.Text;
using System.Text.RegularExpressions;

namespace Keytech.TestingView.Web.FE.Services;

public partial class KnowledgeBaseService
{
    private readonly IWebHostEnvironment _env;
    private KnowledgeBaseDocument? _cache;

    public KnowledgeBaseService(IWebHostEnvironment env) => _env = env;

    public async Task<KnowledgeBaseDocument> GetDocumentAsync(CancellationToken cancellationToken = default)
    {
        if (_cache != null) return _cache;

        var path = ResolveKnowledgeBasePath();
        if (path == null)
        {
            return _cache = new KnowledgeBaseDocument([], []);
        }

        var markdown = await File.ReadAllTextAsync(path, Encoding.UTF8, cancellationToken);
        _cache = Parse(markdown);
        return _cache;
    }

    public static KnowledgeBaseDocument Parse(string markdown)
    {
        var categories = new List<KnowledgeCategory>();
        var allItems = new List<KnowledgeItem>();
        KnowledgeCategory? current = null;
        string? currentQuestion = null;
        var answerBuilder = new StringBuilder();

        foreach (var rawLine in markdown.Split('\n'))
        {
            var line = rawLine.TrimEnd('\r');
            if (line.StartsWith("## "))
            {
                FlushQuestion();
                var title = NormalizeCategoryTitle(line[3..].Trim());
                current = new KnowledgeCategory(Slugify(title), title, []);
                categories.Add(current);
                continue;
            }

            if (line.StartsWith("### Q:"))
            {
                FlushQuestion();
                currentQuestion = line[6..].Trim();
                continue;
            }

            if (currentQuestion != null && current != null)
            {
                if (!string.IsNullOrWhiteSpace(line) || answerBuilder.Length > 0)
                    answerBuilder.AppendLine(line);
            }
        }

        FlushQuestion();
        return new KnowledgeBaseDocument(categories, allItems);

        void FlushQuestion()
        {
            if (currentQuestion == null || current == null) return;
            var answer = answerBuilder.ToString().Trim();
            answerBuilder.Clear();
            var slug = Slugify(currentQuestion);
            var item = new KnowledgeItem(slug, currentQuestion, answer, current.Slug, current.Title);
            current.Items.Add(item);
            allItems.Add(item);
            currentQuestion = null;
        }
    }

    private string? ResolveKnowledgeBasePath()
    {
        var fileName = "TestingView_Knowledge_Base_QA.md";
        foreach (var candidate in new[]
        {
            Path.Combine(_env.ContentRootPath, "Resources", fileName),
            Path.GetFullPath(Path.Combine(_env.ContentRootPath, "..", "Resources", fileName)),
            Path.GetFullPath(Path.Combine(_env.ContentRootPath, "..", fileName)),
            Path.GetFullPath(Path.Combine(_env.ContentRootPath, "..", "..", fileName)),
        })
        {
            if (File.Exists(candidate)) return candidate;
        }

        return null;
    }

    public static string Slugify(string text)
    {
        var normalized = NormalizeCategoryTitle(text).ToLowerInvariant();
        normalized = CategorySlugRegex().Replace(normalized, "-");
        normalized = Regex.Replace(normalized, @"[^a-z0-9\-]", "-");
        normalized = Regex.Replace(normalized, @"-+", "-").Trim('-');
        return string.IsNullOrEmpty(normalized) ? "item" : normalized;
    }

    public static string NormalizeCategoryTitle(string text)
    {
        if (string.IsNullOrWhiteSpace(text)) return string.Empty;

        var cleaned = Regex.Replace(text, @"\p{Cs}", "", RegexOptions.None, TimeSpan.FromSeconds(1));
        cleaned = Regex.Replace(cleaned, @"[\u2600-\u27BF\uFE0F\u200D]", "", RegexOptions.None, TimeSpan.FromSeconds(1));

        var letter = Regex.Match(cleaned, @"[A-Za-z]", RegexOptions.None, TimeSpan.FromSeconds(1));
        if (letter.Success && letter.Index > 0)
            cleaned = cleaned[letter.Index..];

        return cleaned.Trim();
    }

    [GeneratedRegex(@"[^\w\s-]", RegexOptions.None)]
    private static partial Regex CategorySlugRegex();
}

public record KnowledgeBaseDocument(IReadOnlyList<KnowledgeCategory> Categories, IReadOnlyList<KnowledgeItem> AllItems);

public class KnowledgeCategory
{
    public KnowledgeCategory(string slug, string title, List<KnowledgeItem> items)
    {
        Slug = slug;
        Title = title;
        Items = items;
    }

    public string Slug { get; }
    public string Title { get; }
    public List<KnowledgeItem> Items { get; }
}

public record KnowledgeItem(string Slug, string Question, string Answer, string CategorySlug, string CategoryTitle);
