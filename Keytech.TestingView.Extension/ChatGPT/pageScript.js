// Page script for ChatGPT - runs in page context to access React internals
(function() {
  'use strict';

  const LOG_PREFIX = '[ChatGPTToNotes-PageScript]';
  const CHATGPT_API_BASE = 'https://chatgpt.com/backend-api';
  let lastAuthorizationHeader = null;
  let bootstrapAccessToken = null;

  function extractAuthorization(headers) {
    if (!headers) return null;

    try {
      if (headers instanceof Headers) {
        return headers.get('authorization') || headers.get('Authorization');
      }

      if (Array.isArray(headers)) {
        for (const pair of headers) {
          if (!pair || pair.length < 2) continue;
          const key = String(pair[0]).toLowerCase();
          if (key === 'authorization') return String(pair[1]);
        }
      } else if (typeof headers === 'object') {
        for (const key of Object.keys(headers)) {
          if (key.toLowerCase() === 'authorization') return String(headers[key]);
        }
      }
    } catch (e) {
      // ignore
    }

    return null;
  }

  function captureAuthorization(headers) {
    const auth = extractAuthorization(headers);
    if (auth) {
      lastAuthorizationHeader = auth;
      window._ebtLastAuthorizationHeader = auth;
    }
  }

  function readBootstrapAccessToken() {
    try {
      const el = document.getElementById('client-bootstrap');
      if (!el || !el.textContent) return null;
      const data = JSON.parse(el.textContent);
      const token = data?.session?.accessToken || data?.session?.access_token || null;
      return token || null;
    } catch (e) {
      return null;
    }
  }

  function ensureAuthorizationFromBootstrap() {
    if (lastAuthorizationHeader) {
      return;
    }
    if (!bootstrapAccessToken) {
      bootstrapAccessToken = readBootstrapAccessToken();
    }
    if (bootstrapAccessToken) {
      const bearer = `Bearer ${bootstrapAccessToken}`;
      lastAuthorizationHeader = bearer;
      window._ebtLastAuthorizationHeader = bearer;
    }
  }

  function withAuthorization(headers) {
    ensureAuthorizationFromBootstrap();
    const merged = new Headers(headers || {});
    if (lastAuthorizationHeader && !merged.has('authorization')) {
      merged.set('authorization', lastAuthorizationHeader);
    }
    return merged;
  }

  function fetchChatGPT(path, options = {}) {
    const opts = { ...options };
    opts.headers = withAuthorization(options.headers);
    if (!opts.credentials) {
      opts.credentials = 'include';
    }
    return fetch(`${CHATGPT_API_BASE}${path}`, opts);
  }

  (function monitorNetworkRequests() {
    try {
      const originalFetch = window.fetch;
      if (typeof originalFetch === 'function') {
        window.fetch = function(input, init) {
          try {
            if (init && init.headers) {
              captureAuthorization(init.headers);
            } else if (input instanceof Request) {
              captureAuthorization(input.headers);
            }
          } catch (e) {}
          return originalFetch.apply(this, arguments);
        };
      }
    } catch (e) {}

    try {
      const originalSetRequestHeader = XMLHttpRequest.prototype.setRequestHeader;
      const originalSend = XMLHttpRequest.prototype.send;

      XMLHttpRequest.prototype.setRequestHeader = function(name, value) {
        try {
          if (String(name).toLowerCase() === 'authorization') {
            this._ebtAuthorizationHeader = String(value);
          }
        } catch (e) {}
        return originalSetRequestHeader.apply(this, arguments);
      };

      XMLHttpRequest.prototype.send = function() {
        try {
          if (this._ebtAuthorizationHeader) {
            lastAuthorizationHeader = this._ebtAuthorizationHeader;
            window._ebtLastAuthorizationHeader = this._ebtAuthorizationHeader;
          }
        } catch (e) {}
        return originalSend.apply(this, arguments);
      };
    } catch (e) {}
  })();

  // Seed authorization from bootstrap JSON if available
  ensureAuthorizationFromBootstrap();

  const DEFAULT_PROMPT_IMAGE_COUNT = 6;
  const PROMPT_IMAGE_COUNT_SESSION_KEY = 'ebtPromptImageCount';
  const REDIRECT_SCHEDULE_SESSION_KEY = 'ebtScheduledRedirect';
  const MAX_TIMEOUT_MS = 2147483647;
  let targetPromptImageCount = DEFAULT_PROMPT_IMAGE_COUNT;
  let scheduledRedirectTimeoutId = null;
  const PROMPT_CHECK_INTERVAL_MS = 250;
  const PROMPT_CHECK_MAX_ATTEMPTS = 2000;

  function normalizePromptImageCount(value) {
    const parsed = parseInt(value, 10);
    if (!Number.isFinite(parsed) || parsed < 1) {
      return DEFAULT_PROMPT_IMAGE_COUNT;
    }
    return parsed;
  }

  function readPromptImageCountFromSession() {
    try {
      const stored = window.sessionStorage.getItem(PROMPT_IMAGE_COUNT_SESSION_KEY);
      if (stored === null || stored === undefined || stored === '') {
        return null;
      }
      return normalizePromptImageCount(stored);
    } catch (e) {
      return null;
    }
  }

  function setTargetPromptImageCount(value, source) {
    const normalized = normalizePromptImageCount(value);
    if (normalized === targetPromptImageCount) {
      return;
    }
    targetPromptImageCount = normalized;
    try {
      window.sessionStorage.setItem(PROMPT_IMAGE_COUNT_SESSION_KEY, String(normalized));
    } catch (e) {
      // ignore storage errors
    }
    if (source) {
      console.log(LOG_PREFIX, `Target prompt image count set to ${normalized} (${source})`);
    }
  }

  const storedPromptImageCount = readPromptImageCountFromSession();
  if (storedPromptImageCount !== null) {
    targetPromptImageCount = storedPromptImageCount;
  }

  function normalizeRedirectUrl(value) {
    if (!value) return null;
    const trimmed = String(value).trim();
    if (!trimmed) return null;
    try {
      return new URL(trimmed, window.location.href).href;
    } catch (e) {
      return null;
    }
  }

  function normalizeRedirectMinutes(value) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      return 1;
    }
    return parsed;
  }

  function clearScheduledRedirectTimeout() {
    if (scheduledRedirectTimeoutId) {
      clearTimeout(scheduledRedirectTimeoutId);
      scheduledRedirectTimeoutId = null;
    }
  }

  function clearScheduledRedirectFromSession() {
    try {
      window.sessionStorage.removeItem(REDIRECT_SCHEDULE_SESSION_KEY);
    } catch (e) {
      // ignore storage errors
    }
  }

  function readScheduledRedirectFromSession() {
    try {
      const raw = window.sessionStorage.getItem(REDIRECT_SCHEDULE_SESSION_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      const normalizedUrl = normalizeRedirectUrl(parsed?.url);
      const executeAt = Number(parsed?.executeAt);
      const minutes = normalizeRedirectMinutes(parsed?.minutes);
      if (!normalizedUrl || !Number.isFinite(executeAt) || executeAt <= 0) {
        return null;
      }
      return {
        url: normalizedUrl,
        executeAt: executeAt,
        minutes: minutes
      };
    } catch (e) {
      return null;
    }
  }

  function saveScheduledRedirectToSession(schedule) {
    try {
      window.sessionStorage.setItem(REDIRECT_SCHEDULE_SESSION_KEY, JSON.stringify(schedule));
    } catch (e) {
      // ignore storage errors
    }
  }

  function executeScheduledRedirect(schedule, reason) {
    clearScheduledRedirectTimeout();
    const latestSchedule = readScheduledRedirectFromSession() || schedule;
    const normalizedUrl = normalizeRedirectUrl(latestSchedule?.url);
    if (!normalizedUrl) return;

    const minutes = normalizeRedirectMinutes(latestSchedule?.minutes);
    const nextSchedule = {
      url: normalizedUrl,
      minutes: minutes,
      executeAt: Date.now() + Math.round(minutes * 60 * 1000)
    };

    // Persist next execution before navigation so schedule survives reloads/page transitions.
    saveScheduledRedirectToSession(nextSchedule);
    armScheduledRedirectTimer(nextSchedule, `${reason}:rescheduled`);

    const currentUrl = normalizeRedirectUrl(window.location.href) || window.location.href;
    if (currentUrl === normalizedUrl) {
      console.log(LOG_PREFIX, `Scheduled redirect fired (${reason}) but already on target URL`);
      return;
    }

    console.log(LOG_PREFIX, `Executing scheduled redirect (${reason}) -> ${normalizedUrl}`);
    window.location.assign(normalizedUrl);
  }

  function armScheduledRedirectTimer(schedule, source) {
    clearScheduledRedirectTimeout();
    if (!schedule?.url || !Number.isFinite(schedule.executeAt)) {
      return;
    }

    const remainingMs = schedule.executeAt - Date.now();
    if (remainingMs <= 0) {
      executeScheduledRedirect(schedule, `${source}:expired`);
      return;
    }

    const delayMs = Math.min(remainingMs, MAX_TIMEOUT_MS);
    scheduledRedirectTimeoutId = window.setTimeout(() => {
      const latestSchedule = readScheduledRedirectFromSession();
      if (!latestSchedule) return;
      if ((latestSchedule.executeAt - Date.now()) > 0) {
        armScheduledRedirectTimer(latestSchedule, `${source}:rearm`);
        return;
      }
      executeScheduledRedirect(latestSchedule, `${source}:elapsed`);
    }, delayMs);

    console.log(LOG_PREFIX, `Scheduled redirect armed in ${Math.ceil(remainingMs / 1000)} seconds (${source})`);
  }

  function scheduleRedirect(url, minutes) {
    const normalizedUrl = normalizeRedirectUrl(url);
    if (!normalizedUrl) {
      throw new Error('URL is invalid.');
    }

    const minutesValue = Number(minutes);
    if (!Number.isFinite(minutesValue) || minutesValue <= 0) {
      throw new Error('Minutes must be greater than 0.');
    }

    const schedule = {
      url: normalizedUrl,
      minutes: minutesValue,
      executeAt: Date.now() + Math.round(minutesValue * 60 * 1000)
    };
    saveScheduledRedirectToSession(schedule);
    armScheduledRedirectTimer(schedule, 'shortcut');
    return schedule;
  }

  function getDefaultMinutesForPrompt(existingSchedule) {
    if (!existingSchedule || !Number.isFinite(existingSchedule.executeAt)) {
      return '1';
    }
    const remainingMinutes = Math.max((existingSchedule.executeAt - Date.now()) / 60000, 0);
    if (remainingMinutes <= 0) {
      return '1';
    }
    return (Math.round(remainingMinutes * 100) / 100).toString();
  }

  function promptForScheduledRedirect() {
    const existingSchedule = readScheduledRedirectFromSession();
    const defaultUrl = existingSchedule?.url || window.location.href;
    const urlInput = window.prompt('Enter redirect URL (leave empty to clear)', defaultUrl);
    if (urlInput === null) return;
    const trimmedUrl = urlInput.trim();

    if (!trimmedUrl) {
      clearScheduledRedirectTimeout();
      clearScheduledRedirectFromSession();
      window.alert('Scheduled redirect cleared.');
      return;
    }

    const minutesInput = window.prompt('Enter delay in minutes', getDefaultMinutesForPrompt(existingSchedule));
    if (minutesInput === null) return;

    try {
      const schedule = scheduleRedirect(trimmedUrl, minutesInput.trim());
      window.alert(`Redirect scheduled in ${schedule.minutes} minute(s).`);
    } catch (error) {
      window.alert(error?.message || 'Failed to schedule redirect.');
    }
  }

  function handleRedirectShortcut(event) {
    const key = String(event.key || '').toLowerCase();
    if (!event.altKey || key !== 'r' || event.ctrlKey || event.metaKey) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    promptForScheduledRedirect();
  }

  function initializeScheduledRedirect() {
    const existingSchedule = readScheduledRedirectFromSession();
    if (existingSchedule) {
      armScheduledRedirectTimer(existingSchedule, 'restore');
    }
    window.addEventListener('keydown', handleRedirectShortcut, true);
  }

  initializeScheduledRedirect();

  // Fiber detection functions
  function looksLikeFiber(x) {
    return !!x && typeof x === "object" &&
      typeof x.tag === "number" &&
      "return" in x && "child" in x && "sibling" in x &&
      "memoizedProps" in x && "memoizedState" in x;
  }

  function looksLikeFiberRoot(x) {
    return !!x && typeof x === "object" &&
      "current" in x && looksLikeFiber(x.current);
  }

  function ownKeys(obj) {
    return [
      ...Object.getOwnPropertyNames(obj),
      ...Object.getOwnPropertySymbols(obj),
    ];
  }

  function findFiberOnNode(node) {
    if (!node) return null;
    for (const k of ownKeys(node)) {
      let v;
      try { v = node[k]; } catch { continue; }
      if (looksLikeFiber(v)) return { kind: "fiber", value: v };
      if (looksLikeFiberRoot(v)) return { kind: "root", value: v };
    }
    return null;
  }

  function findClosestFiberOrRoot(start) {
    let el = start;
    while (el) {
      const hit = findFiberOnNode(el);
      if (hit) return hit;
      el = el.parentElement;
    }
    return null;
  }

  function getFiberFromHit(hit) {
    if (!hit) return null;
    if (hit.kind === "fiber") return hit.value;
    if (hit.kind === "root") return hit.value.current;
    return null;
  }

  // Search fiber tree for message data with content.parts
  function findMessageInFiber(fiber, maxDepth = 30) {
    if (!fiber || maxDepth <= 0) return null;

    const props = fiber.memoizedProps;
    if (props) {
      if (props.message?.content?.parts) return props.message;
      if (props.content?.parts) return props;
      if (props.data?.message?.content?.parts) return props.data.message;
      if (props.data?.content?.parts) return props.data;
      
      // Search in children prop
      if (props.children) {
        const result = searchObject(props.children, 5);
        if (result) return result;
      }
    }

    // Traverse fiber tree
    if (fiber.return) {
      const result = findMessageInFiber(fiber.return, maxDepth - 1);
      if (result) return result;
    }
    if (fiber.child) {
      const result = findMessageInFiber(fiber.child, maxDepth - 1);
      if (result) return result;
    }

    return null;
  }

  function searchObject(obj, depth) {
    if (!obj || depth <= 0 || typeof obj !== 'object') return null;
    if (obj.content?.parts && Array.isArray(obj.content.parts)) return obj;
    if (obj.message?.content?.parts) return obj.message;
    
    if (Array.isArray(obj)) {
      for (const item of obj.slice(0, 10)) {
        const result = searchObject(item, depth - 1);
        if (result) return result;
      }
    } else {
      for (const key of Object.keys(obj).slice(0, 20)) {
        try {
          const result = searchObject(obj[key], depth - 1);
          if (result) return result;
        } catch {}
      }
    }
    return null;
  }

  // ======== Image Upload Functions ========
  
  /**
   * Get the current conversation context including model and gizmo info
   */
  function getConversationContext() {
    // Try to get conversation ID from URL
    const urlMatch = window.location.pathname.match(/\/c\/([a-f0-9-]+)/);
    const conversationId = urlMatch ? urlMatch[1] : null;
    
    // Try to get gizmo ID from URL (custom GPT)
    const gizmoMatch = window.location.pathname.match(/\/g\/([a-zA-Z0-9-]+)/);
    const gizmoId = gizmoMatch ? gizmoMatch[1] : null;
    
    // Default context
    let context = {
      conversationId: conversationId,
      parentMessageId: null,
      model: null,
      gizmoId: gizmoId,
      conversationMode: gizmoId 
        ? { kind: 'gizmo_interaction', gizmo_id: `g-p-${gizmoId.replace('g-', '')}` }
        : { kind: 'primary_assistant' }
    };
    
    // Look for conversation data in the page
    try {
      // Search for conversation context in React fiber tree
      const mainElement = document.querySelector('main') || document.querySelector('[role="main"]');
      if (mainElement) {
        const hit = findClosestFiberOrRoot(mainElement);
        if (hit) {
          const fiber = getFiberFromHit(hit);
          const fiberContext = findConversationInFiber(fiber, 30);
          if (fiberContext) {
            context.conversationId = fiberContext.conversationId || context.conversationId;
            context.parentMessageId = fiberContext.parentMessageId || fiberContext.currentNodeId;
            context.model = fiberContext.model || context.model;
            if (fiberContext.gizmoId) {
              context.gizmoId = fiberContext.gizmoId;
              context.conversationMode = { kind: 'gizmo_interaction', gizmo_id: fiberContext.gizmoId };
            }
            if (fiberContext.conversationMode) {
              context.conversationMode = fiberContext.conversationMode;
            }
          }
        }
      }
      
      // Also try to find model from UI elements
      if (!context.model) {
        context.model = findCurrentModel();
      }
    } catch (e) {
      console.log(LOG_PREFIX, 'Error finding conversation context:', e);
    }
    
    // Default model if not found
    if (!context.model) {
      context.model = 'auto';
    }
    
    return context;
  }
  
  /**
   * Try to find the current model from various sources
   */
  function findCurrentModel() {
    // Try to find model selector button text
    const modelButton = document.querySelector('[data-testid="model-selector"]') ||
                        document.querySelector('button[aria-haspopup="menu"]');
    if (modelButton) {
      const text = modelButton.textContent?.toLowerCase() || '';
      if (text.includes('gpt-4')) return 'gpt-4';
      if (text.includes('gpt-5')) return 'gpt-5-2';
      if (text.includes('o1')) return 'o1';
    }
    
    // Search in fiber tree for model info
    try {
      const promptArea = document.querySelector('[id="prompt-textarea"]') || document.querySelector('textarea');
      if (promptArea) {
        const hit = findClosestFiberOrRoot(promptArea);
        if (hit) {
          const fiber = getFiberFromHit(hit);
          const model = findModelInFiber(fiber, 20);
          if (model) return model;
        }
      }
    } catch (e) {}
    
    return null;
  }
  
  function findModelInFiber(fiber, maxDepth) {
    if (!fiber || maxDepth <= 0) return null;
    
    const props = fiber.memoizedProps;
    if (props) {
      if (props.model && typeof props.model === 'string') return props.model;
      if (props.selectedModel) return props.selectedModel;
      if (props.currentModel) return props.currentModel;
    }
    
    const state = fiber.memoizedState;
    if (state) {
      let current = state;
      while (current) {
        const val = current.memoizedState;
        if (val?.model && typeof val.model === 'string') return val.model;
        if (val?.selectedModel) return val.selectedModel;
        current = current.next;
      }
    }
    
    if (fiber.return) {
      const result = findModelInFiber(fiber.return, maxDepth - 1);
      if (result) return result;
    }
    
    return null;
  }
  
  function findConversationInFiber(fiber, maxDepth) {
    if (!fiber || maxDepth <= 0) return null;
    
    const props = fiber.memoizedProps;
    const state = fiber.memoizedState;
    
    // Check props for conversation data
    if (props) {
      if (props.conversationId) {
        return { 
          conversationId: props.conversationId, 
          parentMessageId: props.parentMessageId,
          model: props.model,
          gizmoId: props.gizmoId,
          conversationMode: props.conversationMode
        };
      }
      if (props.conversation?.id) {
        return { 
          conversationId: props.conversation.id, 
          parentMessageId: props.conversation.currentNode,
          model: props.conversation.model || props.model,
          gizmoId: props.conversation.gizmo_id,
          conversationMode: props.conversation.conversation_mode
        };
      }
      // Check for model in various prop names
      if (props.model || props.selectedModel || props.currentModel) {
        return {
          model: props.model || props.selectedModel || props.currentModel
        };
      }
    }
    
    // Check state for conversation data
    if (state) {
      let current = state;
      while (current) {
        const val = current.memoizedState;
        if (val?.conversationId) {
          return val;
        }
        if (val?.conversation?.id) {
          return {
            conversationId: val.conversation.id,
            parentMessageId: val.conversation.currentNode,
            model: val.conversation.model || val.model,
            gizmoId: val.conversation.gizmo_id,
            conversationMode: val.conversation.conversation_mode
          };
        }
        current = current.next;
      }
    }
    
    // Traverse fiber tree
    if (fiber.return) {
      const result = findConversationInFiber(fiber.return, maxDepth - 1);
      if (result) return result;
    }
    
    return null;
  }
  
  /**
   * Get timezone info
   */
  function getTimezoneInfo() {
    const offsetMin = new Date().getTimezoneOffset();
    let timezone;
    try {
      timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch {
      timezone = 'UTC';
    }
    return { timezone, offsetMin };
  }
  
  /**
   * Convert base64 data URL to Blob
   */
  function dataURLtoBlob(dataURL) {
    const arr = dataURL.split(',');
    const mimeMatch = arr[0].match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : 'image/png';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  }
  
  /**
   * Get image dimensions from blob
   */
  async function getImageDimensions(blob) {
    return new Promise((resolve) => {
      const img = new Image();
      const url = URL.createObjectURL(blob);
      img.onload = function() {
        URL.revokeObjectURL(url);
        resolve({ width: img.naturalWidth, height: img.naturalHeight });
      };
      img.onerror = function() {
        URL.revokeObjectURL(url);
        resolve({ width: 0, height: 0 });
      };
      img.src = url;
    });
  }
  
  /**
   * Parse response that might be JSON, SSE, or NDJSON format
   */
  async function parseResponse(response) {
    const text = await response.text();
    
    // Try plain JSON first
    try {
      return JSON.parse(text);
    } catch (e) {
      // Not plain JSON, try other formats
    }
    
    const lines = text.split('\n').filter(line => line.trim());
    let lastData = null;
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      
      // SSE format: "data: {...}"
      if (trimmed.startsWith('data: ')) {
        const jsonStr = trimmed.substring(6);
        if (jsonStr === '[DONE]') continue;
        try {
          lastData = JSON.parse(jsonStr);
        } catch (e) {
          // Skip malformed lines
        }
      } else if (trimmed.startsWith('{')) {
        // NDJSON format: each line is a JSON object
        try {
          const parsed = JSON.parse(trimmed);
          lastData = parsed;
          // For streaming events, look for the "completed" event
          if (parsed.event === 'file.processing.completed') {
            return parsed;
          }
        } catch (e) {
          // Skip malformed lines
        }
      }
    }
    
    if (lastData) return lastData;
    
    // If nothing worked, try to find any JSON object in the text
    const jsonMatch = text.match(/\{[\s\S]*?\}/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch (e) {
        // Still failed
      }
    }
    
    throw new Error(`Could not parse response: ${text.substring(0, 200)}`);
  }
  
  /**
   * Step 1: Register file with ChatGPT backend
   * POST /backend-api/files
   */
  async function registerFile(fileName, fileSize, mimeType) {
    const { timezone, offsetMin } = getTimezoneInfo();
    
    const response = await fetchChatGPT('/files', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        file_name: fileName,
        file_size: fileSize,
        use_case: 'multimodal',
        timezone_offset_min: offsetMin,
        reset_rate_limits: false
      })
    });
    
    if (!response.ok) {
      throw new Error(`Failed to register file: ${response.status} ${response.statusText}`);
    }
    
    return await parseResponse(response);
  }
  
  /**
   * Step 2: Upload file stream to ChatGPT backend
   * POST /backend-api/files/process_upload_stream
   */
  async function uploadFileStream(fileId, fileName, blob) {
    // First, we need to get upload URL or directly upload
    // ChatGPT uses a streaming upload approach
    
    const uploadPayload = {
      file_id: fileId,
      use_case: 'multimodal',
      index_for_retrieval: false,
      file_name: fileName
    };
    
    const response = await fetchChatGPT('/files/process_upload_stream', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(uploadPayload)
    });
    
    if (!response.ok) {
      throw new Error(`Failed to initiate upload stream: ${response.status}`);
    }
    
    const streamResult = await parseResponse(response);
    
    // If there's an upload URL, upload the actual file there
    if (streamResult.upload_url) {
      const uploadResponse = await fetch(streamResult.upload_url, {
        method: 'PUT',
        headers: {
          'Content-Type': blob.type || 'application/octet-stream'
        },
        body: blob
      });
      
      if (!uploadResponse.ok) {
        throw new Error(`Failed to upload file data: ${uploadResponse.status}`);
      }
    }
    
    return streamResult;
  }
  
  /**
   * Step 3: Prepare conversation with attachment info
   * POST /backend-api/f/conversation/prepare (optional, helps ChatGPT know what's coming)
   */
  async function prepareConversation(context, mimeType) {
    const { timezone, offsetMin } = getTimezoneInfo();
    
    const payload = {
      action: 'next',
      fork_from_shared_post: false,
      conversation_id: context.conversationId,
      parent_message_id: context.parentMessageId,
      model: context.model || 'auto',
      timezone_offset_min: offsetMin,
      timezone: timezone,
      conversation_mode: context.conversationMode || { kind: 'primary_assistant' },
      system_hints: [],
      attachment_mime_types: [mimeType],
      supports_buffering: true,
      supported_encodings: ['v1'],
      client_contextual_info: { app_name: 'chatgpt.com' }
    };
    
    // Only include conversation_id if we have one
    if (!context.conversationId) {
      delete payload.conversation_id;
      delete payload.parent_message_id;
    }
    
    try {
      const response = await fetchChatGPT('/f/conversation/prepare', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      
      return response.ok;
    } catch (e) {
      // Prepare is optional, don't fail if it doesn't work
      console.log(LOG_PREFIX, 'Prepare conversation optional step failed:', e);
      return true;
    }
  }
  
  /**
   * Upload actual file data to the provided upload URL (Azure Blob Storage)
   */
  async function uploadToUrl(uploadUrl, blob, mimeType) {
    const response = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': mimeType || 'application/octet-stream',
        'x-ms-blob-type': 'BlockBlob'
      },
      body: blob
    });
    
    return response.ok;
  }
  
  /**
   * Alternative fallback: Register file and upload in separate steps
   */
  async function fallbackUpload(blob, fileName, mimeType) {
    const { timezone, offsetMin } = getTimezoneInfo();
    const fileSize = blob.size;
    
    // Step 1: Register
    const registerResponse = await fetchChatGPT('/files', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        file_name: fileName,
        file_size: fileSize,
        use_case: 'multimodal',
        timezone_offset_min: offsetMin,
        reset_rate_limits: false
      })
    });
    
    if (!registerResponse.ok) {
      console.log(LOG_PREFIX, 'Fallback register failed:', registerResponse.status);
      return null;
    }
    
    const registerData = await parseResponse(registerResponse);
    console.log(LOG_PREFIX, 'Fallback register result:', registerData);
    
    const fileId = registerData.file_id || registerData.id;
    const uploadUrl = registerData.upload_url;
    
    if (!fileId) {
      console.log(LOG_PREFIX, 'No file_id in register response');
      return null;
    }
    
    // Step 2: Upload to URL if provided
    if (uploadUrl) {
      const uploaded = await uploadToUrl(uploadUrl, blob, mimeType);
      if (!uploaded) {
        console.log(LOG_PREFIX, 'Fallback upload to URL failed');
        return null;
      }
      console.log(LOG_PREFIX, 'Fallback uploaded to URL successfully');
    }
    
    return { file_id: fileId, ...registerData };
  }
  
  /**
   * Inject uploaded file into ChatGPT's file attachments state
   * This adds the file to the UI so it appears attached to the prompt
   */
  function injectFileIntoPromptState(fileInfo, blob) {
    console.log(LOG_PREFIX, 'Attempting to inject file into UI state...');
    
    // Method 1: Find ChatGPT's file attachment store (Zustand/internal state)
    try {
      const success = injectViaStore(fileInfo);
      if (success) {
        console.log(LOG_PREFIX, 'Injected via store');
        schedulePromptExecutionCheck('store');
        return true;
      }
    } catch (e) {
      console.log(LOG_PREFIX, 'Store injection failed:', e);
    }
    
    // Method 2: Simulate a drop event with the uploaded file info
    try {
      const success = simulateDropEvent(fileInfo, blob);
      if (success) {
        console.log(LOG_PREFIX, 'Injected via simulated drop');
        return true;
      }
    } catch (e) {
      console.log(LOG_PREFIX, 'Drop simulation failed:', e);
    }
    
    // Method 3: Try to find and call internal add file function via fiber
    try {
      const promptArea = document.querySelector('[id="prompt-textarea"]') || 
                         document.querySelector('textarea') ||
                         document.querySelector('[contenteditable="true"]');
      if (promptArea) {
        const hit = findClosestFiberOrRoot(promptArea);
        if (hit) {
          const fiber = getFiberFromHit(hit);
          const addFileFn = findAddFileFunction(fiber, 30);
          if (addFileFn) {
            console.log(LOG_PREFIX, 'Found addFile function, calling...');
            addFileFn(fileInfo);
            schedulePromptExecutionCheck('fiber');
            return true;
          }
        }
      }
    } catch (e) {
      console.log(LOG_PREFIX, 'Fiber injection failed:', e);
    }
    
    // Method 4: Dispatch events that ChatGPT might listen to
    try {
      const fileAddEvent = new CustomEvent('file-upload-complete', {
        detail: { file: fileInfo, files: [fileInfo] },
        bubbles: true
      });
      document.dispatchEvent(fileAddEvent);
      
      // Also try on the prompt area specifically
      const promptArea = document.querySelector('[id="prompt-textarea"]') || document.querySelector('textarea');
      if (promptArea) {
        promptArea.dispatchEvent(fileAddEvent);
      }
      schedulePromptExecutionCheck('event');
    } catch (e) {}
    
    console.log(LOG_PREFIX, 'Could not inject file into UI - file uploaded but not visible');
    return false;
  }
  
  /**
   * Find and use ChatGPT's internal attachment store
   */
  function injectViaStore(fileInfo) {
    // Method A: Search for Zustand/Redux stores in window
    for (const key of Object.keys(window)) {
      try {
        const obj = window[key];
        if (obj && typeof obj === 'object' && typeof obj.getState === 'function') {
          const state = obj.getState();
          
          // Look for attachment/file related state and setters
          if (state.attachments !== undefined || state.files !== undefined || state.uploads !== undefined) {
            console.log(LOG_PREFIX, 'Found potential store:', key, Object.keys(state));
            
            // Try to find the setter
            if (typeof state.addAttachment === 'function') {
              state.addAttachment(fileInfo);
              return true;
            }
            if (typeof state.setAttachments === 'function') {
              const current = state.attachments || [];
              state.setAttachments([...current, fileInfo]);
              return true;
            }
            if (typeof state.addFile === 'function') {
              state.addFile(fileInfo);
              return true;
            }
            if (typeof obj.setState === 'function') {
              const attachKey = state.attachments !== undefined ? 'attachments' : 
                               state.files !== undefined ? 'files' : 'uploads';
              const current = state[attachKey] || [];
              obj.setState({ [attachKey]: [...current, fileInfo] });
              return true;
            }
          }
        }
      } catch (e) {}
    }
    
    // Method B: Search via React fiber for composer context/state
    try {
      const composer = document.querySelector('[data-testid="composer"]') ||
                       document.querySelector('form[class*="composer"]') ||
                       document.querySelector('[id="prompt-textarea"]')?.closest('form') ||
                       document.querySelector('main form');
      
      if (composer) {
        const hit = findClosestFiberOrRoot(composer);
        if (hit) {
          const fiber = getFiberFromHit(hit);
          const injected = injectViaFiberState(fiber, fileInfo, 40);
          if (injected) return true;
        }
      }
    } catch (e) {
      console.log(LOG_PREFIX, 'Fiber state injection error:', e);
    }
    
    return false;
  }
  
  /**
   * Search fiber tree for attachment state and inject the file
   */
  function injectViaFiberState(fiber, fileInfo, maxDepth) {
    if (!fiber || maxDepth <= 0) return false;
    
    // Check memoizedState for arrays that look like attachments
    const state = fiber.memoizedState;
    if (state) {
      let current = state;
      while (current) {
        const val = current.memoizedState;
        
        // Look for state that's an array (might be attachments)
        if (Array.isArray(val)) {
          // Check if it looks like an attachments array
          if (val.length === 0 || (val[0] && (val[0].file_id || val[0].asset_pointer || val[0].mime_type))) {
            console.log(LOG_PREFIX, 'Found potential attachments array in fiber state');
            // Try to find the setter (usually the next hook)
            if (current.next?.memoizedState && typeof current.next.memoizedState === 'function') {
              console.log(LOG_PREFIX, 'Found setter, injecting file...');
              current.next.memoizedState([...val, fileInfo]);
              return true;
            }
            // Or check queue for dispatch
            if (current.queue?.dispatch) {
              console.log(LOG_PREFIX, 'Found dispatch, injecting via dispatch...');
              current.queue.dispatch([...val, fileInfo]);
              return true;
            }
          }
        }
        
        // Look for object state with attachments property
        if (val && typeof val === 'object' && !Array.isArray(val)) {
          if (val.attachments !== undefined || val.files !== undefined) {
            console.log(LOG_PREFIX, 'Found state object with attachments');
            const key = val.attachments !== undefined ? 'attachments' : 'files';
            const currentArr = val[key] || [];
            
            if (current.queue?.dispatch) {
              current.queue.dispatch({ ...val, [key]: [...currentArr, fileInfo] });
              return true;
            }
          }
        }
        
        current = current.next;
      }
    }
    
    // Traverse up the tree
    if (fiber.return) {
      const result = injectViaFiberState(fiber.return, fileInfo, maxDepth - 1);
      if (result) return result;
    }
    
    return false;
  }

  function getComposerRoot() {
    return document.querySelector('[data-testid="composer"]') ||
           document.querySelector('form[class*="composer"]') ||
           document.querySelector('[id="prompt-textarea"]')?.closest('form') ||
           document.querySelector('textarea')?.closest('form') ||
           document.querySelector('main form') ||
           document.querySelector('main');
  }

  function getPromptAttachmentCount() {
    const root = getComposerRoot();
    if (!root) {
      return { count: 0, detected: false };
    }

    const selectors = [
      '[data-testid="file-chip"]',
      '[data-testid="file-pill"]',
      '[data-testid="file-preview"]',
      '[data-testid="attachment"]',
      '[data-testid="composer-attachment"]',
      '[data-testid="attachment-item"]'
    ];

    const nodes = new Set();
    for (const selector of selectors) {
      root.querySelectorAll(selector).forEach((node) => nodes.add(node));
    }

    if (nodes.size > 0) {
      return { count: nodes.size, detected: true };
    }

    const removeButtons = Array.from(root.querySelectorAll(
      'button[aria-label*="Remove"], button[aria-label*="Delete"], button[aria-label*="remove"], button[aria-label*="delete"]'
    ));

    if (removeButtons.length > 0) {
      const filtered = removeButtons.filter((btn) => {
        if (btn.classList.contains('composer-pill-remove')) return false;
        if (btn.classList.contains('__composer-pill-remove')) return false;
        if (btn.closest('.composer-pill')) return false;
        if (btn.closest('.__composer-pill-remove')) return false;
        if (btn.closest('[data-testid*="composer-pill"]')) return false;
        return true;
      });

      if (filtered.length > 0) {
        return { count: filtered.length, detected: true };
      }
    }

    return { count: 0, detected: false };
  }

  function executePromptIfReady(reason) {
    const { count, detected } = getPromptAttachmentCount();
    if (!detected || count !== targetPromptImageCount) {
      return false;
    }

    if (isGeneratingResponse()) {
      return false;
    }

    const btn = document.querySelector('#composer-submit-button') ||
                document.querySelector('button[data-testid="send-button"]') ||
                document.querySelector('button[aria-label="Send"]');

    if (btn && !btn.hasAttribute('disabled')) {
      console.log(LOG_PREFIX, `Executing prompt (${reason}) with ${count} images`);
      btn.click();
      return true;
    }

    return false;
  }

  function schedulePromptExecutionCheck(reason) {
    if (document.executePromptTimeout) {
      clearTimeout(document.executePromptTimeout);
    }

    let attempts = 0;

    const tick = () => {
      attempts += 1;
      if (executePromptIfReady(reason)) {
        clearTimeout(document.executePromptTimeout);
        document.executePromptTimeout = null;
        return;
      }

      if (attempts >= PROMPT_CHECK_MAX_ATTEMPTS) {
        clearTimeout(document.executePromptTimeout);
        document.executePromptTimeout = null;
        return;
      }

      document.executePromptTimeout = setTimeout(tick, PROMPT_CHECK_INTERVAL_MS);
    };

    document.executePromptTimeout = setTimeout(tick, PROMPT_CHECK_INTERVAL_MS);
  }
  
  /**
   * Simulate dropping a file onto the prompt area
   */
  function simulateDropEvent(fileInfo, blob) {
    const dropTarget = document.querySelector('[id="prompt-textarea"]') ||
                       document.querySelector('textarea') ||
                       document.querySelector('[data-testid="composer"]') ||
                       document.querySelector('main form');
    
    if (!dropTarget) {
      console.log(LOG_PREFIX, 'No drop target found');
      return false;
    }
    
    // Create a minimal File-like object with the uploaded info
    const mockFile = new File([blob || new Blob()], fileInfo.name, { type: fileInfo.mime_type });
    
    // Add the server-side file info that ChatGPT expects
    Object.defineProperty(mockFile, '_uploadedFileInfo', {
      value: fileInfo,
      writable: false
    });
    
    // Create DataTransfer with the file
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(mockFile);
    
    // Simulate dragenter, dragover, drop, dragleave, dragend sequence
    const createDragEvent = (type) => new DragEvent(type, {
      bubbles: true,
      cancelable: true,
      dataTransfer: dataTransfer
    });
    
    dropTarget.dispatchEvent(createDragEvent('dragenter'));
    dropTarget.dispatchEvent(createDragEvent('dragover'));
    dropTarget.dispatchEvent(createDragEvent('drop'));
    
    // Clean up: dispatch events to dismiss the overlay
    setTimeout(() => {
      dropTarget.dispatchEvent(createDragEvent('dragleave'));
      dropTarget.dispatchEvent(createDragEvent('dragend'));
      document.dispatchEvent(createDragEvent('dragleave'));
      document.dispatchEvent(createDragEvent('dragend'));
      
      // Also try to hide the overlay directly if it's still visible
      const overlay = document.querySelector('div[class*="pointer-events-none"][class*="z-50"]') ||
                      document.querySelector('h3')?.closest('div[class*="absolute"]');
      if (overlay && overlay.textContent?.includes('Add anything')) {
        console.log(LOG_PREFIX, 'Hiding overlay directly');
        overlay.style.display = 'none';
      }
    }, 100);
    
    schedulePromptExecutionCheck('drop');
    console.log(LOG_PREFIX, 'Dispatched drop events to:', dropTarget);
    return true;
  }
  
  // Check if the response is still being generated
  function isGeneratingResponse() {
    // Check for the stop button by its reliable attributes
    const stopButton = document.querySelector('button[data-testid="stop-button"], button[aria-label="Stop streaming"], button[aria-label="Stop generating"]');
    if (stopButton && stopButton.offsetParent !== null) {
      return true;
    }

    // Fallback: check for streaming classes
    const streamingIndicators = [
      '[class*="streaming"]',
      '[class*="typing"]',
      '.result-streaming'
    ];

    for (const selector of streamingIndicators) {
      if (document.querySelector(selector)) {
        return true;
      }
    }

    return false;
  }

  function findAddFileFunction(fiber, maxDepth) {
    if (!fiber || maxDepth <= 0) return null;
    
    const props = fiber.memoizedProps;
    if (props) {
      // Look for file-related callbacks - expanded list
      const fnNames = ['onFileAdd', 'addFile', 'onFilesChange', 'setFiles', 
                       'addAttachment', 'setAttachments', 'onAttachmentAdd',
                       'handleFiles', 'handleFileUpload', 'onUpload', 'addUpload'];
      for (const name of fnNames) {
        if (typeof props[name] === 'function') {
          console.log(LOG_PREFIX, `Found ${name} in props`);
          return props[name];
        }
      }
      
      // Check for dispatch functions that might handle file actions
      if (typeof props.dispatch === 'function') {
        console.log(LOG_PREFIX, 'Found dispatch in props');
        return (fileInfo) => props.dispatch({ type: 'ADD_FILE', payload: fileInfo });
      }
    }
    
    // Check memoized state for store functions
    const state = fiber.memoizedState;
    if (state) {
      let current = state;
      while (current) {
        const val = current.memoizedState;
        if (val && typeof val === 'object') {
          const fnNames = ['addFile', 'setFiles', 'addAttachment', 'setAttachments'];
          for (const name of fnNames) {
            if (typeof val[name] === 'function') {
              console.log(LOG_PREFIX, `Found ${name} in memoizedState`);
              return val[name];
            }
          }
        }
        current = current.next;
      }
    }
    
    // Traverse up and to children
    if (fiber.return) {
      const result = findAddFileFunction(fiber.return, maxDepth - 1);
      if (result) return result;
    }
    if (fiber.child) {
      const result = findAddFileFunction(fiber.child, Math.min(maxDepth - 1, 5));
      if (result) return result;
    }
    
    return null;
  }
  
  /**
   * Main upload function: Upload image blob to ChatGPT
   * Returns file info that can be used in a conversation message
   */
  async function uploadImageToChatGPT(imageData, fileName, mimeType) {
    try {
      // Convert base64 to blob if needed
      let blob;
      if (typeof imageData === 'string' && imageData.startsWith('data:')) {
        blob = dataURLtoBlob(imageData);
      } else if (imageData instanceof Blob) {
        blob = imageData;
      } else {
        throw new Error('Invalid image data format');
      }
      
      const fileSize = blob.size;
      const { width, height } = await getImageDimensions(blob);
      
      console.log(LOG_PREFIX, `Uploading image: ${fileName}, ${fileSize} bytes, ${width}x${height}`);
      
      // Get conversation context
      const context = getConversationContext();
      
      // Try method 1: Register + Upload to URL (simpler, more reliable)
      try {
        // Step 1: Register the file
        const registerResult = await registerFile(fileName, fileSize, mimeType);
        console.log(LOG_PREFIX, 'File registered:', registerResult);
        
        const fileId = registerResult.file_id || registerResult.id;
        
        if (fileId) {
          let uploadSuccess = false;
          
          // Step 2: Upload to provided URL if available
          if (registerResult.upload_url) {
            console.log(LOG_PREFIX, 'Uploading to Azure URL...');
            const uploadResponse = await fetch(registerResult.upload_url, {
              method: 'PUT',
              headers: {
                'Content-Type': mimeType,
                'x-ms-blob-type': 'BlockBlob'
              },
              body: blob
            });
            
            uploadSuccess = uploadResponse.ok;
            console.log(LOG_PREFIX, 'Upload to URL result:', uploadSuccess ? 'success' : `failed ${uploadResponse.status}`);
          }
          
          // Step 2b: Process upload stream (notifies ChatGPT the upload is done)
          if (uploadSuccess) {
            try {
              const streamResult = await uploadFileStream(fileId, fileName, blob);
              console.log(LOG_PREFIX, 'Upload stream result:', streamResult);
            } catch (streamErr) {
              // Stream processing is optional if direct upload worked
              console.log(LOG_PREFIX, 'Stream processing failed (non-fatal):', streamErr.message);
            }
          }
          
          // Step 3: Prepare conversation (optional)
          await prepareConversation(context, mimeType);
          
          // Create file info object matching ChatGPT's format
          const fileInfo = {
            id: fileId,
            file_id: fileId,
            name: fileName,
            size: fileSize,
            size_bytes: fileSize,
            mime_type: mimeType,
            width: width,
            height: height,
            source: 'local',
            is_big_paste: false,
            asset_pointer: `sediment://${fileId}`,
            content_type: 'image_asset_pointer'
          };
          
          // Try to inject into prompt state (pass blob for drop simulation)
          injectFileIntoPromptState(fileInfo, blob);
          
          // Store globally so it can be accessed
          window._ebtLastUploadedFile = fileInfo;
          window._ebtLastUploadedBlob = blob;
          
          return {
            success: true,
            fileId: fileId,
            fileName: fileName,
            width: width,
            height: height,
            size: fileSize,
            mimeType: mimeType,
            assetPointer: `sediment://${fileId}`,
            fileInfo: fileInfo
          };
        }
      } catch (e) {
        console.log(LOG_PREFIX, 'Register+Upload method failed:', e);
      }
      
      // Fallback: Try separate register and upload
      try {
        console.log(LOG_PREFIX, 'Trying fallback upload method...');
        const fallbackResult = await fallbackUpload(blob, fileName, mimeType);
        if (fallbackResult && fallbackResult.file_id) {
          const fileInfo = {
            id: fallbackResult.file_id,
            file_id: fallbackResult.file_id,
            name: fileName,
            size: fileSize,
            size_bytes: fileSize,
            mime_type: mimeType,
            width: width,
            height: height,
            source: 'local',
            is_big_paste: false,
            asset_pointer: `sediment://${fallbackResult.file_id}`,
            content_type: 'image_asset_pointer'
          };
          
          injectFileIntoPromptState(fileInfo, blob);
          window._ebtLastUploadedFile = fileInfo;
          window._ebtLastUploadedBlob = blob;
          
          return {
            success: true,
            fileId: fallbackResult.file_id,
            fileName: fileName,
            width: width,
            height: height,
            size: fileSize,
            mimeType: mimeType,
            assetPointer: `sediment://${fallbackResult.file_id}`,
            fileInfo: fileInfo
          };
        }
      } catch (e) {
        console.log(LOG_PREFIX, 'Fallback upload method failed:', e);
      }
      
      return { success: false, error: 'All upload methods failed' };
      
    } catch (error) {
      console.error(LOG_PREFIX, 'Upload error:', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Build message attachment structure for use in conversation API
   * Call this after uploading to get the proper message format
   */
  function buildImageMessagePart(fileInfo) {
    return {
      content_type: 'image_asset_pointer',
      asset_pointer: fileInfo.asset_pointer || `sediment://${fileInfo.file_id}`,
      size_bytes: fileInfo.size_bytes || fileInfo.size,
      width: fileInfo.width,
      height: fileInfo.height
    };
  }
  
  function buildImageAttachment(fileInfo) {
    return {
      id: fileInfo.file_id || fileInfo.id,
      size: fileInfo.size_bytes || fileInfo.size,
      name: fileInfo.name,
      mime_type: fileInfo.mime_type,
      width: fileInfo.width,
      height: fileInfo.height,
      source: 'local',
      is_big_paste: false
    };
  }
  
  // Expose upload utilities globally
  window.ebtChatGPTUpload = {
    uploadImage: uploadImageToChatGPT,
    getConversationContext: getConversationContext,
    buildImageMessagePart: buildImageMessagePart,
    buildImageAttachment: buildImageAttachment,
    getLastUploadedFile: () => window._ebtLastUploadedFile
  };

  // Listen for extraction requests from content script
  window.addEventListener('message', function(event) {
    if (event.source !== window) return;

    if (event.data?.type === 'CHATGPT_SET_PROMPT_IMAGE_COUNT') {
      const { count } = event.data;
      setTargetPromptImageCount(count, 'extension');
    }
    
    // Handle markdown extraction
    if (event.data?.type === 'CHATGPT_EXTRACT_MARKDOWN') {
      const { id, selector } = event.data;
      let markdown = null;

      try {
        const element = document.querySelector(selector);
        if (element) {
          const hit = findClosestFiberOrRoot(element);
          if (hit) {
            const fiber = getFiberFromHit(hit);
            if (fiber) {
              const messageData = findMessageInFiber(fiber, 30);
              if (messageData?.content?.parts) {
                markdown = messageData.content.parts.join('');
              }
            }
          }
        }
      } catch (error) {
        console.error(LOG_PREFIX, 'Markdown extraction error:', error);
      }

      // Send result back to content script
      window.postMessage({
        type: 'CHATGPT_MARKDOWN_RESULT',
        id: id,
        markdown: markdown
      }, '*');
    }
    
    // Handle image upload
    if (event.data?.type === 'CHATGPT_UPLOAD_IMAGE') {
      const { id, imageData, fileName, mimeType } = event.data;
      
      (async () => {
        try {
            clearTimeout(document.executePromptTimeout);
          const result = await uploadImageToChatGPT(imageData, fileName, mimeType);
          
          window.postMessage({
            type: 'CHATGPT_IMAGE_UPLOAD_RESULT',
            id: id,
            result: result.success ? result : null,
            error: result.success ? null : result.error
          }, '*');
        } catch (error) {
          console.error(LOG_PREFIX, 'Image upload error:', error);
          window.postMessage({
            type: 'CHATGPT_IMAGE_UPLOAD_RESULT',
            id: id,
            result: null,
            error: error.message
          }, '*');
        }
      })();
    }
  });

  console.log(LOG_PREFIX, 'Injected and ready (with image upload support)');
})();
