import { marked } from "https://cdn.jsdelivr.net/npm/marked/lib/marked.esm.js";

const L = TradingViewApi.L;

(() => {
  if (window.TransparentNotes && window.TransparentNotes.__installed) return;

  function installTransparentNotesPersistent(opts = {}) {
    const config = {
      scope: "page", // "page" | "origin"
      hotkey: { ctrl: true, alt: true, key: "n" }, // Ctrl+Alt+N

      zIndex: 2147483647,

      defaultColor: "#ffeb3b",
      defaultOpacityPct: 100,
      defaultFontSize: 18,

      defaultBgEnabled: false,
      defaultBgColor: "#000000",
      defaultBgOpacityPct: 0,

      defaultHoverHlEnabled: true,
      defaultHoverHlColor: "#3E87FB",

      defaultWidth: 320,
      minWidth: 90,
      minHeight: 50,

      defaultText:
        "**New note**\n\nDouble-click to edit.\n\n" +
        "- Drag to move\n" +
        "- Scroll to resize width\n" +
        "- Ctrl/Cmd + Scroll = font size\n" +
        "- Right-click toggles selection mode\n" +
        "- Middle-click deletes hovered block (Ctrl/Cmd+Z undo)\n" +
        "- Markdown supported: **bold**, *italic*, headings (#), lists (-), `inline code`, code fences (```)\n",

      storageKeyPrefix: "tn_notes_v9::",
      defaultsKeySuffix: "::defaults",
      saveDebounceMs: 200,

      widthStepPx: 14,
      flashMs: 260,

      undoMax: 50,

      ...opts,
    };

    // ---------------------------
    // Storage
    // ---------------------------
    const baseKey =
      config.storageKeyPrefix +
      (config.scope === "origin"
        ? location.origin
        : location.origin + location.pathname + location.search);

    const notesKey = baseKey;
    const defaultsKey = baseKey + config.defaultsKeySuffix;

    const readJson = (key, fallback) => {
      try {
        const raw = localStorage.getItem(key);
        if (!raw) return fallback;
        const data = JSON.parse(raw);
        return data ?? fallback;
      } catch {
        return fallback;
      }
    };

    const writeJson = (key, data) => {
      try {
        localStorage.setItem(key, JSON.stringify(data));
      } catch {}
    };

    const readStore = () => {
      const data = readJson(notesKey, { notes: [] });
      return data && Array.isArray(data.notes) ? data : { notes: [] };
    };

    // ---------------------------
    // Defaults persistence
    // ---------------------------
    const hardDefaults = {
      colorHex: config.defaultColor,
      opacityPct: config.defaultOpacityPct,
      fontSize: config.defaultFontSize,

      bgEnabled: config.defaultBgEnabled,
      bgColorHex: config.defaultBgColor,
      bgOpacityPct: config.defaultBgOpacityPct,

      hoverHlEnabled: config.defaultHoverHlEnabled,
      hoverHlColorHex: config.defaultHoverHlColor,
    };

    let globalDefaults = (() => {
      const d = readJson(defaultsKey, null);
      if (!d || typeof d !== "object") return { ...hardDefaults };
      return {
        colorHex: typeof d.colorHex === "string" ? d.colorHex : hardDefaults.colorHex,
        opacityPct: typeof d.opacityPct === "number" ? d.opacityPct : hardDefaults.opacityPct,
        fontSize: typeof d.fontSize === "number" ? d.fontSize : hardDefaults.fontSize,

        bgEnabled: typeof d.bgEnabled === "boolean" ? d.bgEnabled : hardDefaults.bgEnabled,
        bgColorHex: typeof d.bgColorHex === "string" ? d.bgColorHex : hardDefaults.bgColorHex,
        bgOpacityPct:
          typeof d.bgOpacityPct === "number" ? d.bgOpacityPct : hardDefaults.bgOpacityPct,

        hoverHlEnabled:
          typeof d.hoverHlEnabled === "boolean" ? d.hoverHlEnabled : hardDefaults.hoverHlEnabled,
        hoverHlColorHex:
          typeof d.hoverHlColorHex === "string" ? d.hoverHlColorHex : hardDefaults.hoverHlColorHex,
      };
    })();

    let defaultsSaveTimer = null;
    const scheduleDefaultsSave = () => {
      clearTimeout(defaultsSaveTimer);
      defaultsSaveTimer = setTimeout(
        () => writeJson(defaultsKey, globalDefaults),
        config.saveDebounceMs
      );
    };

    const setGlobalDefaults = (patch) => {
      globalDefaults = { ...globalDefaults, ...patch };
      scheduleDefaultsSave();
    };

    // ---------------------------
    // Styles
    // ---------------------------
    const styleId = "tn-transparent-notes-style-v20";
    document
      .querySelectorAll('style[id^="tn-transparent-notes-style-"]')
      .forEach((s) => s.id !== styleId && s.remove());

    if (!document.getElementById(styleId)) {
      const style = document.createElement("style");
      style.id = styleId;
      style.textContent = `
        .tn-note{
          position:absolute; left:0; top:0;
          background:transparent !important;
          border:none !important;
          box-shadow:none !important;
          padding:0; margin:0;
          z-index:${config.zIndex};
          font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Arial,"Apple Color Emoji","Segoe UI Emoji";
          line-height:1.2;
          cursor:grab;
          user-select:text;
          min-height:${config.minHeight}px;

          --tn-text-color: rgba(255,235,59,1);
          --tn-bg-color: rgba(0,0,0,0);
          --tn-hl-color: rgba(62,135,251,0.22);
        }
        .tn-note:active{cursor:grabbing;}

        .tn-view{
          width:100%;
          height:auto;
          border:none; outline:none;
          overflow:visible;
          border-radius:10px;
          position:relative;
          background: var(--tn-bg-color);
          box-sizing:border-box;
          padding:10px;

          color: var(--tn-text-color);
          text-shadow: 0px 0px 5px rgba(0, 0, 0, 1), 0px 0px 3px rgba(0, 0, 0, 1), 1px 1px 0 rgba(0, 0, 0, 1);
          text-align: justify;
        }
        .tn-view * {
            transition: padding 0.3s, background 0.3s;
        }
        .tn-view::after{
          content:"";
          position:absolute;
          inset:0;
          border-radius:10px;
          pointer-events:none;
          background:transparent;
          box-shadow:none;
        }
        .tn-note.tn-flash:not(.tn-editing) .tn-view::after{
          background:rgba(0,0,0,0.16);
          box-shadow:0 0 0 1px rgba(255,255,255,0.18) inset;
        }

        .tn-view h1,.tn-view h2,.tn-view h3,.tn-view h4,.tn-view h5,.tn-view h6{margin:0 0 6px 0; text-align: left;}
        .tn-view h1 {font-size: 1.6em;}
        .tn-view h2 {font-size: 1.3em;}
        .tn-view h3 {font-size: 1.1em;}
        .tn-view p{margin:0 0 6px 0;}
        .tn-view ul,.tn-view ol{margin:0 0 6px 18px; padding:0;}
        .tn-view ul + *,.tn-view ol + *{margin-top:10px;}
        .tn-view ul ul,tn-view ol ul,tn-view ul ol,tn-view ol ol{margin-left:18px;}
        .tn-view li{margin:0 0 3px 0;}
        .tn-view code{padding:0 4px;border-radius:4px;background:rgba(255,255,255,0.08);}
        .tn-view pre{margin:0 0 6px 0;padding:8px;border-radius:8px;background:rgba(255,255,255,0.08);overflow:auto;}
        .tn-view a{text-decoration:underline;color:inherit;}

        .tn-note .tn-hoverhl{
          background: var(--tn-hl-color);
          border-radius:8px;
          box-shadow: 0 0 0 1px rgba(255,255,255,0.10) inset;
          padding:3px;
        }

        .tn-note.tn-select,
        .tn-note.tn-select .tn-view{
          cursor:text !important;
        }

        .tn-note.tn-editing{
          outline:1px dashed rgba(255,255,255,0.35);
          outline-offset:6px;
          cursor:default;
        }
        .tn-edit{
          display:none;
          width:100%;
          height:auto;
          box-sizing:border-box;

          background:
            linear-gradient(rgba(0,0,0,0.18), rgba(0,0,0,0.18)),
            var(--tn-bg-color);

          border:none; outline:none;
          padding:8px 10px;
          border-radius:10px;
          overflow:hidden;
          font:inherit;
          line-height:inherit;
          resize:none;

          color: var(--tn-text-color);
          text-shadow: 0 1px 0 rgba(0,0,0,0.90);
        }
        .tn-note.tn-editing .tn-edit{display:block;}
        .tn-note.tn-editing .tn-view{display:none;}

        .tn-toolbar{
          position:absolute;
          left:0;
          top:0;
          transform: translateY(calc(-100% - 8px));
          display:none;
          width:100%;
          max-width:100%;
          box-sizing:border-box;

          padding:8px 10px;
          border-radius:12px;
          background:rgba(0,0,0,0.55);
          backdrop-filter:blur(8px); -webkit-backdrop-filter:blur(8px);
          color:#fff;
          user-select:none;
          cursor:default;
          white-space:normal;
        }
        .tn-note.tn-editing .tn-toolbar{display:block;}

        .tn-row{
          display:flex;
          align-items:center;
          flex-wrap:wrap;
          gap:6px;
        }
        .tn-row.actions{
          margin-top:8px;
          padding-top:8px;
          border-top:1px solid rgba(255,255,255,0.14);
        }

        .tn-toolbar input[type="range"]{width:72px;}
        .tn-toolbar input[type="color"]{
          width:34px; height:22px; padding:0;
          border:none; background:transparent;
        }

        .tn-btn{
          border:none;
          border-radius:10px;
          padding:6px 10px;
          background:rgba(255,255,255,0.14);
          color:#fff;
          cursor:pointer;
          display:flex;
          align-items:center;
          justify-content:center;
          line-height:1;
        }
        .tn-btn:hover{background:rgba(255,255,255,0.22);}

        .tn-btn.tn-toggle{ padding:6px 9px; }
        .tn-btn.tn-toggle.tn-on{
          background:rgba(62,135,251,0.28);
          box-shadow:0 0 0 1px rgba(255,255,255,0.14) inset;
        }
        .tn-btn.tn-toggle.tn-off{
          background:rgba(255,255,255,0.10);
          box-shadow:0 0 0 1px rgba(255,255,255,0.08) inset;
          opacity:0.85;
        }

        .tn-ico{
          display:inline-flex;
          align-items:center;
          justify-content:center;
          width:18px;
          height:18px;
          font-size:18px;
          line-height:1;
          user-select:none;
        }

        /* specific icon sizing */
        .tn-ico.tn-ico-done{ font-size:22px; }
        .tn-ico.tn-ico-del { font-size:22px; filter:hue-rotate(235deg); }

        .tn-group{
          display:flex;
          align-items:center;
          gap:6px;
        }
        .tn-muted{ opacity:0.55; }

        .tn-handle{ display:none; position:absolute; width:10px; height:10px;
          background:rgba(255,255,255,0.70);
          border-radius:3px;
          box-shadow:0 0 0 1px rgba(0,0,0,0.25);
          z-index:${config.zIndex + 1};
        }
        .tn-note.tn-editing .tn-handle{ display:block; }
        .tn-handle.r { right:-6px; top:50%; transform:translateY(-50%); cursor:e-resize; }

        .tn-placement-hint{
          position:fixed;
          left:50%; top:14px;
          transform:translateX(-50%);
          padding:8px 12px;
          border-radius:999px;
          background:rgba(0,0,0,0.55);
          color:#fff;
          font:14px/1.2 ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Arial;
          z-index:${config.zIndex};
          user-select:none;
          pointer-events:none;
        }
        .tn-placement-crosshair{cursor:crosshair !important;}
      `;
      document.head.appendChild(style);
    }

    // ---------------------------
    // Markdown (Marked + block mapping)
    // ---------------------------
    const escapeHtml = (s) =>
      String(s).replace(/[&<>"']/g, (ch) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      }[ch]));

    const safeLink = (url) => {
      try {
        const u = new URL(String(url), location.href);
        return ["http:", "https:", "mailto:"].includes(u.protocol) ? u.href : "#";
      } catch {
        return "#";
      }
    };

    const MARKED_OPTIONS = {
      gfm: true,
      breaks: true,
      headerIds: false,
      mangle: false,
    };

    const countLines = (raw) => {
      if (raw == null) return 0;
      const text = String(raw).replace(/\r\n?/g, "\n");
      if (!text) return 0;
      let lines = text.split("\n").length;
      if (text.endsWith("\n")) lines -= 1;
      return Math.max(lines, 1);
    };

    const buildMarkdownRenderer = () => {
      const renderer = new marked.Renderer();
      const blockAttr = (token) =>
        token && token._tnBlockId ? ` data-tn-block="${token._tnBlockId}"` : "";

      renderer.html = () => "";

      renderer.paragraph = function (token) {
        const text = this.parser.parseInline(token.tokens);
        return `<p${blockAttr(token)}>${text}</p>\n`;
      };

      renderer.heading = function (token) {
        const text = this.parser.parseInline(token.tokens);
        const level = token.depth;
        return `<h${level}${blockAttr(token)}>${text}</h${level}>\n`;
      };

      renderer.listitem = function (token) {
        const body = this.parser.parse(token.tokens);
        return `<li${blockAttr(token)}>${body}</li>\n`;
      };

      renderer.blockquote = function (token) {
        const body = this.parser.parse(token.tokens);
        return `<blockquote${blockAttr(token)}>\n${body}</blockquote>\n`;
      };

      renderer.code = function (token) {
        const text = escapeHtml((token.text ?? "").replace(/\n$/, "")) + "\n";
        const lang = (token.lang || "").match(/^\S*/)?.[0] ?? "";
        const langClass = lang ? ` class="language-${escapeHtml(lang)}"` : "";
        return `<pre${blockAttr(token)}><code${langClass}>${text}</code></pre>\n`;
      };

      renderer.link = function (token) {
        const href = escapeHtml(safeLink(token.href));
        const title = token.title ? ` title="${escapeHtml(token.title)}"` : "";
        const text = this.parser.parseInline(token.tokens);
        return `<a href="${href}" target="_blank" rel="noopener noreferrer"${title}>${text}</a>`;
      };

      renderer.image = function (token) {
        return escapeHtml(token.raw ?? "");
      };

      return renderer;
    };

    function renderMarkdownWithMap(mdRaw) {
      const md = String(mdRaw ?? "").replace(/\r\n?/g, "\n");
      const tokens = marked.lexer(md, MARKED_OPTIONS);

      const blockMap = Object.create(null);
      let blockCounter = 0;
      let lineCursor = 0;

      const newBlockId = () => `b${++blockCounter}`;

      const consume = (raw) => {
        const span = countLines(raw);
        const start = lineCursor;
        const end = span ? start + span - 1 : start;
        lineCursor += span;
        return { start, end, span };
      };

      const assignBlock = (token, kind) => {
        const { start, end, span } = consume(token.raw);
        if (!span) return;
        const bid = newBlockId();
        token._tnBlockId = bid;
        blockMap[bid] = { startLine: start, endLine: end, kind };
      };

      const walk = (list) => {
        for (const token of list || []) {
          if (!token) continue;
          switch (token.type) {
            case "list":
              walk(token.items);
              break;
            case "list_item":
              assignBlock(token, "li");
              break;
            case "heading":
              assignBlock(token, `h${token.depth}`);
              break;
            case "paragraph":
              assignBlock(token, "p");
              break;
            case "code":
              assignBlock(token, "pre");
              break;
            case "blockquote":
              assignBlock(token, "blockquote");
              break;
            case "space":
            case "def":
            case "html":
            case "hr":
            case "table":
              consume(token.raw);
              break;
            default:
              if (token.raw) consume(token.raw);
              else if (token.tokens) walk(token.tokens);
              break;
          }
        }
      };

      walk(tokens);

      const html = marked.parser(tokens, {
        ...MARKED_OPTIONS,
        renderer: buildMarkdownRenderer(),
      });

      return { html, blockMap };
    }

    // ---------------------------
    // Undo deleted note (5-second window)
    // ---------------------------
    let deletedNoteData = null;
    let deletedNoteTimer = null;

    function storeDeletedNote(noteEl) {
      if (deletedNoteTimer) clearTimeout(deletedNoteTimer);
      deletedNoteData = {
        id: noteEl.dataset.tnId,
        x: parseInt(noteEl.style.left) || 120,
        y: parseInt(noteEl.style.top) || 120,
        text: noteEl._md,
        colorHex: noteEl._colorHex,
        opacityPct: noteEl._opacityPct,
        fontSize: noteEl._fontSize,
        bgEnabled: noteEl._bgEnabled,
        bgColorHex: noteEl._bgColorHex,
        bgOpacityPct: noteEl._bgOpacityPct,
        hoverHlEnabled: noteEl._hoverHlEnabled,
        hoverHlColorHex: noteEl._hoverHlColorHex,
        width: noteEl._width,
      };
      deletedNoteTimer = setTimeout(() => {
        deletedNoteData = null;
        deletedNoteTimer = null;
      }, 5000);
    }

    function restoreDeletedNote() {
      if (!deletedNoteData) return false;
      if (deletedNoteTimer) clearTimeout(deletedNoteTimer);
      createNote(deletedNoteData);
      deletedNoteData = null;
      deletedNoteTimer = null;
      return true;
    }

    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && deletedNoteData) {
        e.preventDefault();
        e.stopPropagation();
        restoreDeletedNote();
      }
    }, true);

    // ---------------------------
    // Helpers
    // ---------------------------
    const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
    const isBlankText = (value) => !String(value ?? "").trim();

    function hexToRgb(hex) {
      const h = String(hex || "").trim().replace("#", "");
      if (![3, 6].includes(h.length)) return { r: 255, g: 255, b: 255 };
      const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
      const n = parseInt(full, 16);
      return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
    }

    function clearSelection() {
      const sel = window.getSelection?.();
      if (sel) sel.removeAllRanges();
    }

    function removeNote(noteEl, { allowUndo = false } = {}) {
      if (!noteEl) return false;
      if (allowUndo) storeDeletedNote(noteEl);
      const id = noteEl.dataset.tnId;
      noteEl.remove();
      notes.delete(id);
      removeFromStore(id);
      if (lastActiveNote === noteEl) lastActiveNote = null;
      return true;
    }

    function enterSelectionMode(noteEl) {
      noteEl._selectionMode = true;
      noteEl.classList.add("tn-select");
      noteEl._clearHoverHighlight?.();
    }

    function exitSelectionMode(noteEl) {
      noteEl._selectionMode = false;
      noteEl.classList.remove("tn-select");
    }

    function toggleSelectionMode(noteEl) {
      if (noteEl._selectionMode) {
        clearSelection();
        exitSelectionMode(noteEl);
      } else {
        enterSelectionMode(noteEl);
      }
    }

    function applyStyles(noteEl) {
      const { r, g, b } = hexToRgb(noteEl._colorHex);
      const a = clamp((noteEl._opacityPct ?? 100) / 100, 0, 1);
      noteEl.style.setProperty("--tn-text-color", `rgba(${r},${g},${b},${a})`);

      const bgOn = !!noteEl._bgEnabled;
      const bgA = bgOn ? clamp((noteEl._bgOpacityPct ?? 0) / 100, 0, 1) : 0;
      const bgRgb = hexToRgb(noteEl._bgColorHex);
      noteEl.style.setProperty("--tn-bg-color", `rgba(${bgRgb.r},${bgRgb.g},${bgRgb.b},${bgA})`);

      const hlRgb = hexToRgb(noteEl._hoverHlColorHex);
      noteEl.style.setProperty("--tn-hl-color", `rgba(${hlRgb.r},${hlRgb.g},${hlRgb.b},0.22)`);
    }

    function fitTextareaToContent(noteEl) {
      const ta = noteEl.querySelector(".tn-edit");
      if (!ta || !noteEl.classList.contains("tn-editing")) return;
      ta.style.height = "auto";
      ta.style.height = `${Math.max(config.minHeight, ta.scrollHeight)}px`;
    }

    function flashBackground(noteEl) {
      if (noteEl.classList.contains("tn-editing")) return;
      noteEl.classList.add("tn-flash");
      clearTimeout(noteEl._flashTimer);
      noteEl._flashTimer = setTimeout(() => noteEl.classList.remove("tn-flash"), config.flashMs);
    }

    // icon factory with optional extra class
    const ico = (glyph, title, extraClass = "") => {
      const s = document.createElement("span");
      s.className = `tn-ico${extraClass ? " " + extraClass : ""}`;
      s.textContent = glyph;
      if (title) s.title = title;
      return s;
    };

    // ---------------------------
    // Hover highlight wiring
    // ---------------------------
    function setupHoverHighlight(noteEl, viewEl) {
      const CANDIDATES = "li,p,h1,h2,h3,h4,h5,h6,pre,blockquote";
      let current = null;

      const clear = () => {
        if (current) current.classList.remove("tn-hoverhl");
        current = null;
        noteEl._hoveredBlockId = null;
      };

      const pick = (target) => {
        if (!(target instanceof Element)) return null;
        let el = target;
        while (el && el !== viewEl) {
          if (el.matches(CANDIDATES) && el.getAttribute("data-tn-block")) return el;
          el = el.parentElement;
        }
        return null;
      };

      const onMove = (e) => {
        if (noteEl.classList.contains("tn-editing")) return;
        if (noteEl._selectionMode) return clear();
        if (!noteEl._hoverHlEnabled) return clear();
        if (e.buttons && (e.buttons & 1)) return;

        const next = pick(e.target);
        if (next === current) return;

        if (current) current.classList.remove("tn-hoverhl");
        current = next;
        if (current) {
          current.classList.add("tn-hoverhl");
          noteEl._hoveredBlockId = current.getAttribute("data-tn-block");
        } else {
          noteEl._hoveredBlockId = null;
        }
      };

      viewEl.addEventListener("mousemove", onMove, true);
      viewEl.addEventListener("mouseleave", clear, true);

      noteEl._clearHoverHighlight = clear;
    }

    // ---------------------------
    // Runtime state + saving
    // ---------------------------
    const notes = new Map();
    let placementMode = false;
    let hintEl = null;
    let lastActiveNote = null;

    const genId = () => `tn_${Math.random().toString(16).slice(2)}_${Date.now()}`;

    function serializeNote(el) {
      return {
        id: el.dataset.tnId,
        x: parseFloat(el.style.left) || 0,
        y: parseFloat(el.style.top) || 0,
        width: parseFloat(el.style.width) || config.defaultWidth,
        text: el._md ?? "",

        colorHex: el._colorHex ?? config.defaultColor,
        opacityPct: el._opacityPct ?? config.defaultOpacityPct,
        fontSize: el._fontSize ?? config.defaultFontSize,

        bgEnabled: !!el._bgEnabled,
        bgColorHex: el._bgColorHex ?? config.defaultBgColor,
        bgOpacityPct: el._bgOpacityPct ?? config.defaultBgOpacityPct,

        hoverHlEnabled: !!el._hoverHlEnabled,
        hoverHlColorHex: el._hoverHlColorHex ?? config.defaultHoverHlColor,
      };
    }

    function saveAll() {
      writeJson(notesKey, { notes: Array.from(notes.values()).map(serializeNote) });
    }

    let saveTimer = null;
    function scheduleSave() {
      clearTimeout(saveTimer);
      saveTimer = setTimeout(saveAll, config.saveDebounceMs);
    }

    function removeFromStore(id) {
      const data = readStore();
      data.notes = (data.notes || []).filter((n) => n && n.id !== id);
      writeJson(notesKey, data);
    }

    function renderNoteView(noteEl) {
      const view = noteEl.querySelector(".tn-view");
      if (!view) return;
      const { html, blockMap } = renderMarkdownWithMap(noteEl._md ?? "");
      view.innerHTML = html;
      noteEl._blockMap = blockMap;
      noteEl._clearHoverHighlight?.();
      
      if(!L.events.onNoteChange) {
        L.events.onNoteChange = [];
      }

      L.trigger(L.events.onNoteChange, noteEl)
    }

    // ---------------------------
    // Undo + delete hovered block
    // ---------------------------
    function pushUndo(noteEl) {
      if (!noteEl._undoStack) noteEl._undoStack = [];
      noteEl._undoStack.push(noteEl._md ?? "");
      if (noteEl._undoStack.length > config.undoMax) noteEl._undoStack.shift();
    }

    function undo(noteEl) {
      if (!noteEl || !noteEl._undoStack || !noteEl._undoStack.length) return false;
      noteEl._md = noteEl._undoStack.pop();
      if (isBlankText(noteEl._md)) {
        removeNote(noteEl);
        return true;
      }
      renderNoteView(noteEl);
      scheduleSave();
      flashBackground(noteEl);
      return true;
    }

    function deleteHoveredBlock(noteEl) {
      const bid = noteEl._hoveredBlockId;
      const map = noteEl._blockMap || null;
      if (!bid || !map || !map[bid]) return;

      const { startLine, endLine } = map[bid];
      if (typeof startLine !== "number" || typeof endLine !== "number") return;

      pushUndo(noteEl);

      const lines = String(noteEl._md ?? "").replace(/\r\n/g, "\n").split("\n");
      const count = Math.max(0, endLine - startLine + 1);
      if (!count) return;

      lines.splice(startLine, count);
      noteEl._md = lines.join("\n").replace(/\n{3,}/g, "\n\n").trimEnd();

      if (isBlankText(noteEl._md)) {
        removeNote(noteEl);
        return;
      }

      renderNoteView(noteEl);
      scheduleSave();
      flashBackground(noteEl);
    }

    document.addEventListener(
      "keydown",
      (e) => {
        const isUndo =
          (e.ctrlKey || e.metaKey) &&
          !e.shiftKey &&
          (e.key || "").toLowerCase() === "z";

        if (!isUndo) return;

        const t = e.target;
        const isTyping =
          t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable);
        if (isTyping) return;

        if (lastActiveNote && !lastActiveNote.classList.contains("tn-editing")) {
          if (undo(lastActiveNote)) {
            e.preventDefault();
            e.stopPropagation();
          }
        }
      },
      true
    );

    // ---------------------------
    // Drag
    // ---------------------------
    function enableDrag(noteEl, handleEl, { onlyWhenView = false, ignoreSelector = "" } = {}) {
      let dragging = false;
      let startX = 0,
        startY = 0,
        startLeft = 0,
        startTop = 0;

      const onMove = (e) => {
        if (!dragging) return;
        noteEl.style.left = `${startLeft + (e.pageX - startX)}px`;
        noteEl.style.top = `${startTop + (e.pageY - startY)}px`;
      };

      const onEnd = () => {
        if (!dragging) return;
        dragging = false;
        window.removeEventListener("pointermove", onMove, true);
        window.removeEventListener("pointerup", onEnd, true);
        window.removeEventListener("pointercancel", onEnd, true);
        scheduleSave();
      };

      handleEl.addEventListener("pointerdown", (e) => {
        if (e.button !== 0) return;
        if (onlyWhenView && noteEl.classList.contains("tn-editing")) return;
        if (ignoreSelector && e.target.closest(ignoreSelector)) return;
        if (noteEl._selectionMode) return;

        dragging = true;
        startX = e.pageX;
        startY = e.pageY;
        startLeft = parseFloat(noteEl.style.left) || 0;
        startTop = parseFloat(noteEl.style.top) || 0;

        try {
          handleEl.setPointerCapture?.(e.pointerId);
        } catch {}

        window.addEventListener("pointermove", onMove, true);
        window.addEventListener("pointerup", onEnd, true);
        window.addEventListener("pointercancel", onEnd, true);
        e.preventDefault();
      });
    }

    // ---------------------------
    // Width-only handle
    // ---------------------------
    function addWidthHandle(noteEl) {
      const h = document.createElement("div");
      h.className = "tn-handle r";
      noteEl.appendChild(h);

      h.addEventListener("pointerdown", (e) => {
        e.preventDefault();
        e.stopPropagation();

        const startW = parseFloat(noteEl.style.width) || noteEl.getBoundingClientRect().width;
        const startX = e.pageX;

        const onMove = (ev) => {
          noteEl.style.width = `${clamp(
            startW + (ev.pageX - startX),
            config.minWidth,
            100000
          )}px`;
          fitTextareaToContent(noteEl);
        };

        const onEnd = () => {
          window.removeEventListener("pointermove", onMove, true);
          window.removeEventListener("pointerup", onEnd, true);
          window.removeEventListener("pointercancel", onEnd, true);
          scheduleSave();
        };

        try {
          h.setPointerCapture?.(e.pointerId);
        } catch {}

        window.addEventListener("pointermove", onMove, true);
        window.addEventListener("pointerup", onEnd, true);
        window.addEventListener("pointercancel", onEnd, true);
      });
    }

    // ---------------------------
    // Toolbar
    // ---------------------------
    function makeToolbar(noteEl) {
      const bar = document.createElement("div");
      bar.className = "tn-toolbar";

      const row1 = document.createElement("div");
      row1.className = "tn-row settings";

      const row2 = document.createElement("div");
      row2.className = "tn-row actions";

      const textColor = document.createElement("input");
      textColor.type = "color";
      textColor.value = noteEl._colorHex;

      const textOpacity = document.createElement("input");
      textOpacity.type = "range";
      textOpacity.min = "0";
      textOpacity.max = "100";
      textOpacity.step = "1";
      textOpacity.value = String(noteEl._opacityPct);

      const bgColor = document.createElement("input");
      bgColor.type = "color";
      bgColor.value = noteEl._bgColorHex;
      bgColor.title = "Background color";

      const bgOpacity = document.createElement("input");
      bgOpacity.type = "range";
      bgOpacity.min = "0";
      bgOpacity.max = "100";
      bgOpacity.step = "1";
      bgOpacity.value = String(noteEl._bgOpacityPct);

      const hlColor = document.createElement("input");
      hlColor.type = "color";
      hlColor.value = noteEl._hoverHlColorHex;
      hlColor.title = "Highlight color";

      const btnTextColor = document.createElement("button");
      btnTextColor.type = "button";
      btnTextColor.className = "tn-btn";
      btnTextColor.title = "Text color";
      btnTextColor.append(ico("🗚", "Text color"));
      btnTextColor.addEventListener("click", (e) => {
        e.preventDefault();
        textColor.click();
      });

      const btnTextOpacityIcon = document.createElement("button");
      btnTextOpacityIcon.type = "button";
      btnTextOpacityIcon.className = "tn-btn";
      btnTextOpacityIcon.title = "Text opacity";
      btnTextOpacityIcon.append(ico("🔆", "Text opacity"));
      btnTextOpacityIcon.addEventListener("click", (e) => e.preventDefault());

      const btnBgToggle = document.createElement("button");
      btnBgToggle.type = "button";
      btnBgToggle.className = "tn-btn tn-toggle";
      btnBgToggle.title = "Background";
      btnBgToggle.append(ico("🖼️", "Background"));

      const btnBgOpacityIcon = document.createElement("button");
      btnBgOpacityIcon.type = "button";
      btnBgOpacityIcon.className = "tn-btn";
      btnBgOpacityIcon.title = "Background opacity";
      btnBgOpacityIcon.append(ico("🔅", "Background opacity"));
      btnBgOpacityIcon.addEventListener("click", (e) => e.preventDefault());

      const btnHlToggle = document.createElement("button");
      btnHlToggle.type = "button";
      btnHlToggle.className = "tn-btn tn-toggle";
      btnHlToggle.title = "Hover highlight";
      btnHlToggle.append(ico("🖍️", "Hover highlight"));

      const done = document.createElement("button");
      done.type = "button";
      done.className = "tn-btn";
      done.title = "Done";
      done.append(ico("✅", "Done", "tn-ico-done"));

      const del = document.createElement("button");
      del.type = "button";
      del.className = "tn-btn";
      del.title = "Delete";
      del.append(ico("❎", "Delete", "tn-ico-del"));

      const gTextColor = document.createElement("div");
      gTextColor.className = "tn-group";
      gTextColor.append(btnTextColor, textColor);

      const gTextOp = document.createElement("div");
      gTextOp.className = "tn-group";
      gTextOp.append(btnTextOpacityIcon, textOpacity);

      const gBgColor = document.createElement("div");
      gBgColor.className = "tn-group";
      gBgColor.append(bgColor);

      const gBgOp = document.createElement("div");
      gBgOp.className = "tn-group";
      gBgOp.append(btnBgOpacityIcon, bgOpacity);

      const gHlColor = document.createElement("div");
      gHlColor.className = "tn-group";
      gHlColor.append(hlColor);

      row1.append(gTextColor, gTextOp, btnBgToggle, gBgColor, gBgOp, btnHlToggle, gHlColor);
      row2.append(done, del);
      bar.append(row1, row2);

      const syncToggleStyles = () => {
        btnBgToggle.classList.toggle("tn-on", !!noteEl._bgEnabled);
        btnBgToggle.classList.toggle("tn-off", !noteEl._bgEnabled);

        btnHlToggle.classList.toggle("tn-on", !!noteEl._hoverHlEnabled);
        btnHlToggle.classList.toggle("tn-off", !noteEl._hoverHlEnabled);
      };

      const syncBgUI = () => {
        const enabled = !!noteEl._bgEnabled;
        bgColor.disabled = !enabled;
        bgOpacity.disabled = !enabled;
        gBgColor.classList.toggle("tn-muted", !enabled);
        gBgOp.classList.toggle("tn-muted", !enabled);
      };

      const syncHlUI = () => {
        const enabled = !!noteEl._hoverHlEnabled;
        hlColor.disabled = !enabled;
        gHlColor.classList.toggle("tn-muted", !enabled);
        if (!enabled) noteEl._clearHoverHighlight?.();
      };

      syncToggleStyles();
      syncBgUI();
      syncHlUI();

      btnBgToggle.addEventListener("click", (e) => {
        e.preventDefault();
        noteEl._bgEnabled = !noteEl._bgEnabled;
        syncToggleStyles();
        syncBgUI();
        applyStyles(noteEl);
        setGlobalDefaults({ bgEnabled: noteEl._bgEnabled });
        scheduleSave();
      });

      btnHlToggle.addEventListener("click", (e) => {
        e.preventDefault();
        noteEl._hoverHlEnabled = !noteEl._hoverHlEnabled;
        syncToggleStyles();
        syncHlUI();
        applyStyles(noteEl);
        setGlobalDefaults({ hoverHlEnabled: noteEl._hoverHlEnabled });
        scheduleSave();
      });

      textColor.addEventListener("input", () => {
        noteEl._colorHex = textColor.value;
        applyStyles(noteEl);
        setGlobalDefaults({ colorHex: noteEl._colorHex });
        scheduleSave();
      });

      textOpacity.addEventListener("input", () => {
        noteEl._opacityPct = Number(textOpacity.value);
        applyStyles(noteEl);
        setGlobalDefaults({ opacityPct: noteEl._opacityPct });
        scheduleSave();
      });

      bgColor.addEventListener("input", () => {
        noteEl._bgColorHex = bgColor.value;
        applyStyles(noteEl);
        setGlobalDefaults({ bgColorHex: noteEl._bgColorHex });
        scheduleSave();
      });

      bgOpacity.addEventListener("input", () => {
        noteEl._bgOpacityPct = Number(bgOpacity.value);
        applyStyles(noteEl);
        setGlobalDefaults({ bgOpacityPct: noteEl._bgOpacityPct });
        scheduleSave();
      });

      hlColor.addEventListener("input", () => {
        noteEl._hoverHlColorHex = hlColor.value;
        applyStyles(noteEl);
        setGlobalDefaults({ hoverHlColorHex: noteEl._hoverHlColorHex });
        scheduleSave();
      });

      done.addEventListener("click", () => exitEdit(noteEl));

      del.addEventListener("click", () => {
        removeNote(noteEl, { allowUndo: true });
      });

      enableDrag(noteEl, bar, { ignoreSelector: "button,input" });
      return bar;
    }

    // ---------------------------
    // Note lifecycle
    // ---------------------------
    function createNote({
      id = genId(),
      x = window.scrollX + 120,
      y = window.scrollY + 120,
      text,

      colorHex,
      opacityPct,
      fontSize,

      bgEnabled,
      bgColorHex,
      bgOpacityPct,

      hoverHlEnabled,
      hoverHlColorHex,

      width = config.defaultWidth,
      persist = true,
    } = {}) {
      if (notes.has(id)) return notes.get(id);

      const resolved = {
        colorHex: typeof colorHex === "string" ? colorHex : globalDefaults.colorHex,
        opacityPct: typeof opacityPct === "number" ? opacityPct : globalDefaults.opacityPct,
        fontSize: typeof fontSize === "number" ? fontSize : globalDefaults.fontSize,

        bgEnabled: typeof bgEnabled === "boolean" ? bgEnabled : globalDefaults.bgEnabled,
        bgColorHex: typeof bgColorHex === "string" ? bgColorHex : globalDefaults.bgColorHex,
        bgOpacityPct:
          typeof bgOpacityPct === "number" ? bgOpacityPct : globalDefaults.bgOpacityPct,

        hoverHlEnabled:
          typeof hoverHlEnabled === "boolean" ? hoverHlEnabled : globalDefaults.hoverHlEnabled,
        hoverHlColorHex:
          typeof hoverHlColorHex === "string" ? hoverHlColorHex : globalDefaults.hoverHlColorHex,
      };

      const initialText = text ?? config.defaultText;
      if (isBlankText(initialText)) return null;

      const noteEl = document.createElement("div");
      noteEl.className = "tn-note";
      noteEl.dataset.tnId = id;

      noteEl.style.left = `${x}px`;
      noteEl.style.top = `${y}px`;
      noteEl.style.width = `${clamp(width, config.minWidth, 100000)}px`;
      noteEl.style.height = "auto";
      noteEl.style.minHeight = `${config.minHeight}px`;

      noteEl._md = String(initialText);

      noteEl._colorHex = resolved.colorHex;
      noteEl._opacityPct = Number(resolved.opacityPct);

      noteEl._fontSize = Number(resolved.fontSize);
      noteEl.style.fontSize = `${noteEl._fontSize}px`;

      noteEl._bgEnabled = !!resolved.bgEnabled;
      noteEl._bgColorHex = resolved.bgColorHex;
      noteEl._bgOpacityPct = Number(resolved.bgOpacityPct);

      noteEl._hoverHlEnabled = !!resolved.hoverHlEnabled;
      noteEl._hoverHlColorHex = resolved.hoverHlColorHex;

      noteEl._selectionMode = false;
      noteEl._undoStack = [];

      applyStyles(noteEl);

      const toolbar = makeToolbar(noteEl);

      const view = document.createElement("div");
      view.className = "tn-view";

      const edit = document.createElement("textarea");
      edit.className = "tn-edit";
      edit.spellcheck = false;

      noteEl.append(toolbar, view, edit);
      addWidthHandle(noteEl);

      document.body.appendChild(noteEl);
      notes.set(id, noteEl);

      renderNoteView(noteEl);
      setupHoverHighlight(noteEl, view);

      noteEl.addEventListener("mouseenter", () => (lastActiveNote = noteEl), true);

      noteEl.addEventListener("dblclick", (e) => {
        if (noteEl.classList.contains("tn-editing")) return;
        if (e.target.closest && e.target.closest(".tn-toolbar")) return;
        e.preventDefault();
        e.stopPropagation();
        enterEdit(noteEl);
      });

      // move in view mode
      enableDrag(noteEl, noteEl, { onlyWhenView: true });

      // right click toggles selection; middle click deletes hovered
      noteEl.addEventListener(
        "pointerdown",
        (e) => {
          if (noteEl.classList.contains("tn-editing")) return;
          lastActiveNote = noteEl;

          if (e.button === 2) {
            e.preventDefault();
            e.stopPropagation();
            toggleSelectionMode(noteEl);
            return;
          }

          if (e.button === 1) {
            e.preventDefault();
            e.stopPropagation();
            deleteHoveredBlock(noteEl);
            return;
          }
        },
        true
      );

      noteEl.addEventListener(
        "contextmenu",
        (e) => {
          if (noteEl.classList.contains("tn-editing")) return;
          e.preventDefault();
        },
        true
      );

      // wheel (view): resize width; ctrl/cmd+wheel: font size
      const onWheel = (e) => {
        const step = config.widthStepPx;

        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          e.stopPropagation();
          lastActiveNote = noteEl;

          const dir = Math.sign(e.deltaY || 0);
          if (dir !== 0) {
            const next = clamp(noteEl._fontSize - dir, 10, 96);
            if (next !== noteEl._fontSize) {
              noteEl._fontSize = next;
              noteEl.style.fontSize = `${noteEl._fontSize}px`;
              setGlobalDefaults({ fontSize: noteEl._fontSize });

              if (!noteEl.classList.contains("tn-editing")) flashBackground(noteEl);
              else fitTextareaToContent(noteEl);

              scheduleSave();
            }
          }
          return;
        }

        if (noteEl.classList.contains("tn-editing")) return;
        if (noteEl._selectionMode) return;

        const dx = typeof e.deltaX === "number" ? e.deltaX : 0;
        const dy = typeof e.deltaY === "number" ? e.deltaY : 0;
        const dominant = Math.abs(dx) > Math.abs(dy) ? dx : dy;
        const delta = Math.sign(dominant);
        if (delta === 0) return;

        e.preventDefault();
        lastActiveNote = noteEl;

        const rect = noteEl.getBoundingClientRect();
        noteEl.style.width = `${clamp(rect.width - delta * step, config.minWidth, 100000)}px`;

        flashBackground(noteEl);
        scheduleSave();
      };

      noteEl.addEventListener("wheel", onWheel, { passive: false });
      noteEl.addEventListener("mousewheel", onWheel, { passive: false });

      edit.addEventListener("input", () => fitTextareaToContent(noteEl));
      edit.addEventListener("keydown", (e) => {
        if (e.key === "Escape") exitEdit(noteEl);
        if ((e.ctrlKey || e.metaKey) && e.key === "Enter") exitEdit(noteEl);
      });

      if (persist) scheduleSave();
      return noteEl;
    }

    function enterEdit(noteEl) {
      noteEl.classList.add("tn-editing");
      exitSelectionMode(noteEl);
      noteEl._clearHoverHighlight?.();
      lastActiveNote = noteEl;

      const edit = noteEl.querySelector(".tn-edit");
      if (edit) {
        edit.value = noteEl._md ?? "";
        edit.focus();
        edit.selectionStart = edit.selectionEnd = edit.value.length;
        fitTextareaToContent(noteEl);
      }
    }

    function exitEdit(noteEl) {
      const edit = noteEl.querySelector(".tn-edit");
      if (edit) noteEl._md = edit.value;
      noteEl.classList.remove("tn-editing");
      if (isBlankText(noteEl._md)) {
        removeNote(noteEl);
        return;
      }
      renderNoteView(noteEl);
      scheduleSave();
    }

    // ---------------------------
    // Placement mode
    // ---------------------------
    function setPlacementMode(on) {
      placementMode = !!on;
      if (placementMode) {
        document.documentElement.classList.add("tn-placement-crosshair");
        if (!hintEl) {
          hintEl = document.createElement("div");
          hintEl.className = "tn-placement-hint";
          hintEl.textContent = "Click anywhere to place a note • Esc to cancel";
          document.body.appendChild(hintEl);
        }
      } else {
        document.documentElement.classList.remove("tn-placement-crosshair");
        if (hintEl) {
          hintEl.remove();
          hintEl = null;
        }
      }
    }

    document.addEventListener(
      "click",
      (e) => {
        if (!placementMode) return;
        if (e.target.closest && e.target.closest(".tn-note")) return;
        createNote({ x: e.pageX, y: e.pageY });
        setPlacementMode(false);
      },
      true
    );

    document.addEventListener(
      "keydown",
      (e) => {
        const keyMatch = (e.key || "").toLowerCase() === String(config.hotkey.key).toLowerCase();
        const hotkeyOk =
          keyMatch && e.ctrlKey === !!config.hotkey.ctrl && e.altKey === !!config.hotkey.alt;

        if (hotkeyOk) {
          const t = e.target;
          const isTyping =
            t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable);
          if (isTyping) return;

          e.preventDefault();
          startPollRemoteNotes();
          setPlacementMode(!placementMode);
          return;
        }

        if (placementMode && e.key === "Escape") setPlacementMode(false);
      },
      true
    );

    let pollRemoteNotesStarted = false;
    function startPollRemoteNotes() {
      if (pollRemoteNotesStarted) return;
      if (typeof L === "undefined" || typeof user === "undefined") return;
      if (!['BacktestingMaestro'].includes(user.username)) return;
      pollRemoteNotesStarted = true;

      let lastNoteText = null;
      setInterval(async () => {
        try {
          const symbol = L.c().symbol();
          const response = await fetch(
            `https://api.testingview.com/notes?symbol=${encodeURIComponent(symbol)}`
          );
          if (response.status === 200) {
            const text = await response.text();
            if (text && text.trim() && text !== lastNoteText) {
              lastNoteText = text;
              const nextText = text.trim();
              const existing = Array.from(notes.values()).find(
                (note) => String(note._md ?? "").trim().length > 10
              );
              if (existing) {
                existing._md = nextText;
                if (existing.classList.contains("tn-editing")) {
                  const edit = existing.querySelector(".tn-edit");
                  if (edit) {
                    edit.value = nextText;
                    fitTextareaToContent(existing);
                  }
                }
                renderNoteView(existing);
                scheduleSave();
                flashBackground(existing);
              } else {
                createNote({
                  x: window.scrollX + 120,
                  y: window.scrollY + 120,
                  text: nextText,
                });
              }
            }

              await fetch(`https://api.testingview.com/notes/delete?symbol=${encodeURIComponent(symbol)}`, {
              method: 'POST',
              body: text
            });
          }
        } catch (e) {
          // Ignore errors
        }
      }, 2000);
    }

    // ---------------------------
    // Load persisted notes
    // ---------------------------
    (function loadAll() {
      const data = readStore();
      let loadedAny = false;
      for (const n of data.notes || []) {
        if (!n || !n.id) continue;
        if (isBlankText(n.text)) {
          removeFromStore(n.id);
          continue;
        }
        const created = createNote({
          id: n.id,
          x: n.x,
          y: n.y,
          width: n.width,
          text: n.text,

          colorHex: n.colorHex ?? config.defaultColor,
          opacityPct: typeof n.opacityPct === "number" ? n.opacityPct : config.defaultOpacityPct,
          fontSize: typeof n.fontSize === "number" ? n.fontSize : config.defaultFontSize,

          bgEnabled: typeof n.bgEnabled === "boolean" ? n.bgEnabled : config.defaultBgEnabled,
          bgColorHex: typeof n.bgColorHex === "string" ? n.bgColorHex : config.defaultBgColor,
          bgOpacityPct:
            typeof n.bgOpacityPct === "number" ? n.bgOpacityPct : config.defaultBgOpacityPct,

          hoverHlEnabled:
            typeof n.hoverHlEnabled === "boolean"
              ? n.hoverHlEnabled
              : config.defaultHoverHlEnabled,
          hoverHlColorHex:
            typeof n.hoverHlColorHex === "string"
              ? n.hoverHlColorHex
              : config.defaultHoverHlColor,

          persist: false,
        });
        if (created) loadedAny = true;
      }
      if (loadedAny) startPollRemoteNotes();
    })();

    // API
    window.TransparentNotes = {
      __installed: true,
      notesKey,
      defaultsKey,
      getDefaults: () => ({ ...globalDefaults }),
      setDefaults: (d) => setGlobalDefaults(d || {}),
      create: (p) => createNote(p),
      list: () => Array.from(notes.values()),
      save: () => saveAll(),
      clearAll: () => {
        for (const el of notes.values()) el.remove();
        notes.clear();
        writeJson(notesKey, { notes: [] });
        setPlacementMode(false);
      },
      togglePlacement: () => setPlacementMode(!placementMode),
      undo: () => lastActiveNote && undo(lastActiveNote),
    };

    return window.TransparentNotes;
  }

  function boot() {
    try {
      installTransparentNotesPersistent();
    } catch (e) {
      L.dbg("TransparentNotes boot failed:", "error", e);
    }
  }

  if (document.body) boot();
  else window.addEventListener("DOMContentLoaded", boot, { once: true });
})();

