using Microsoft.AspNetCore.Mvc;
using System.Collections.Concurrent;

namespace Keytech.TestingView.API.Controllers
{
    [ApiController]
    [Route("notes")]
    public class TestingViewNotesController : ControllerBase
    {
        // In-memory queue of notes per symbol
        private static readonly ConcurrentDictionary<string, List<string>> NotesQueue = new(StringComparer.OrdinalIgnoreCase);

        /// <summary>
        /// Posts a note to the queue for a specific symbol.
        /// </summary>
        [HttpPost]
        [Consumes("text/plain")]
        public async Task<IActionResult> PostNote([FromQuery] string symbol)
        {
            if (string.IsNullOrWhiteSpace(symbol))
            {
                return BadRequest("Symbol is required");
            }

            string note;
            using (var reader = new StreamReader(Request.Body))
            {
                note = await reader.ReadToEndAsync();
            }

            if (string.IsNullOrWhiteSpace(note))
            {
                return BadRequest("Note content is required");
            }

            var queue = NotesQueue.GetOrAdd(symbol.ToUpper(), _ => new List<string>());
            queue.Add(note);
            
            while (queue.Count > 1000)
            {
                queue.RemoveAt(0);
            }

            return Ok();
        }

        /// <summary>
        /// Gets and removes the latest note from the queue for a specific symbol.
        /// </summary>
        [HttpGet]
        public IActionResult GetNote([FromQuery] string symbol)
        {
            if (string.IsNullOrWhiteSpace(symbol))
            {
                return BadRequest("Symbol is required");
            }

            string note;
            if (NotesQueue.TryGetValue(symbol.ToUpper(), out var queue) && !String.IsNullOrWhiteSpace(note = queue.LastOrDefault()))
            {
                return Ok(note);
            }

            return NoContent();
        }

        [HttpPost("delete")]
        public async Task<IActionResult> DeleteNote([FromQuery] string symbol)
        {
            string note;
            using (var reader = new StreamReader(Request.Body))
            {
                note = await reader.ReadToEndAsync();
            }

            if (string.IsNullOrWhiteSpace(note))
            {
                return BadRequest("Note content is required");
            }

            if (NotesQueue.TryGetValue(symbol.ToUpper(), out var queue) && queue.RemoveAll(n => n == note) > 0)
            {
                return Ok(); 
            }

            return NoContent();
        }

        [HttpGet("all")]
        public ConcurrentDictionary<string, List<string>> GetAll()
        {
            return NotesQueue;
        }
    }
}