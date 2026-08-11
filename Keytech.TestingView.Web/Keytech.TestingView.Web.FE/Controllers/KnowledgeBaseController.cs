using Keytech.TestingView.Web.FE.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Keytech.TestingView.Web.FE.Controllers;

[ApiController]
[Route("api/knowledge-base")]
[AllowAnonymous]
public class KnowledgeBaseController : ControllerBase
{
    private readonly KnowledgeBaseService _knowledgeBase;

    public KnowledgeBaseController(KnowledgeBaseService knowledgeBase) => _knowledgeBase = knowledgeBase;

    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken cancellationToken)
    {
        var doc = await _knowledgeBase.GetDocumentAsync(cancellationToken);
        return Ok(new
        {
            categories = doc.Categories.Select(c => new
            {
                slug = c.Slug,
                title = c.Title,
                items = c.Items.Select(i => new { slug = i.Slug, question = i.Question, answer = i.Answer }),
            }),
        });
    }

    [HttpGet("{slug}")]
    public async Task<IActionResult> GetBySlug(string slug, CancellationToken cancellationToken)
    {
        var doc = await _knowledgeBase.GetDocumentAsync(cancellationToken);
        var item = doc.AllItems.FirstOrDefault(i => i.Slug.Equals(slug, StringComparison.OrdinalIgnoreCase));
        if (item == null) return NotFound();
        return Ok(item);
    }
}
