// Content script for ChatGPT - detects NEW answers and sends to notes API

(function() {
  'use strict';

  const API_URL = 'https://api.testingview.com/notes';
  const IMAGE_API_URL = 'https://api.testingview.com/gpt/image';
  const LOG_PREFIX = '[ChatGPTToNotes]';
  const DEFAULT_PROMPT_IMAGE_COUNT = 6;
  const PROMPT_IMAGE_COUNT_SESSION_KEY = 'ebtPromptImageCount';
  
  // Track all sent message hashes to avoid duplicates
  let canStart = false;
  let currentChatUrl = '';
  let isPollingImages = false;
  let extensionContextInvalidated = false;
  let loggedContextInvalidation = false;
  let generationNotified = false;
  let lastFocusMessageAt = 0;
  let lastPromptImageCount = null;
  
  // Pending markdown extraction requests
  const pendingExtractions = new Map();
  let extractionIdCounter = 0;
  
  // Pending image upload requests
  const pendingImageUploads = new Map();
  let imageUploadIdCounter = 0;

  // Inject script into page context using web accessible resource
  function injectPageScript() {
    const script = document.createElement('script');
    script.src = chrome.runtime.getURL('pageScript.js');
    script.async = true;
    script.onload = function() {
      console.log(LOG_PREFIX, 'Page script loaded successfully');
    };
    script.onerror = function(e) {
      console.error(LOG_PREFIX, 'Failed to load page script:', e);
    };
    (document.head || document.documentElement).appendChild(script);
    console.log(LOG_PREFIX, 'Page script injection initiated');
  }
  
  // Listen for results from page script
  window.addEventListener('message', function(event) {
    if (event.source !== window) return;
    
    // Handle markdown extraction results
    if (event.data?.type === 'CHATGPT_MARKDOWN_RESULT') {
      const { id, markdown } = event.data;
      const resolver = pendingExtractions.get(id);
      if (resolver) {
        pendingExtractions.delete(id);
        resolver(markdown);
      }
    }
    
    // Handle image upload results
    if (event.data?.type === 'CHATGPT_IMAGE_UPLOAD_RESULT') {
      const { id, result, error } = event.data;
      const resolver = pendingImageUploads.get(id);
      if (resolver) {
        pendingImageUploads.delete(id);
        resolver({ result, error });
      }
    }
  });
  
  // Request markdown extraction via page script
  function extractMarkdownViaPageScript(selector) {
    return new Promise((resolve) => {
      const id = ++extractionIdCounter;
      pendingExtractions.set(id, resolve);
      
      window.postMessage({
        type: 'CHATGPT_EXTRACT_MARKDOWN',
        id: id,
        selector: selector
      }, '*');
      
      // Timeout after 2 seconds
      setTimeout(() => {
        if (pendingExtractions.has(id)) {
          pendingExtractions.delete(id);
          resolve(null);
        }
      }, 2000);
    });
  }

  function normalizePromptImageCount(value) {
    const parsed = parseInt(value, 10);
    if (!Number.isFinite(parsed) || parsed < 1) {
      return DEFAULT_PROMPT_IMAGE_COUNT;
    }
    return parsed;
  }

  function syncPromptImageCount(value) {
    const normalized = normalizePromptImageCount(value);
    if (normalized === lastPromptImageCount) {
      return;
    }
    lastPromptImageCount = normalized;
    try {
      window.sessionStorage.setItem(PROMPT_IMAGE_COUNT_SESSION_KEY, String(normalized));
    } catch (e) {
      // ignore storage errors
    }
    window.postMessage({
      type: 'CHATGPT_SET_PROMPT_IMAGE_COUNT',
      count: normalized
    }, '*');
  }

  /**
   * Upload an image to ChatGPT's prompt programmatically
   * @param {Blob|File} imageBlob - The image data (Blob or File object)
   * @param {string} [fileName] - Optional filename (defaults to generated name)
   * @param {string} [mimeType] - Optional MIME type (defaults to image/png)
   * @returns {Promise<{fileId: string, width: number, height: number, size: number} | null>}
   */
  async function uploadImageToChatGPT(imageBlob, fileName, mimeType) {
    return new Promise((resolve) => {
      const id = ++imageUploadIdCounter;
      pendingImageUploads.set(id, resolve);
      
      // Convert blob to base64 for transfer via postMessage
      const reader = new FileReader();
      reader.onload = function() {
        const base64Data = reader.result;
        
        window.postMessage({
          type: 'CHATGPT_UPLOAD_IMAGE',
          id: id,
          imageData: base64Data,
          fileName: fileName || `image_${Date.now()}.png`,
          mimeType: mimeType || imageBlob.type || 'image/png'
        }, '*');
      };
      reader.onerror = function() {
        pendingImageUploads.delete(id);
        resolve({ result: null, error: 'Failed to read image blob' });
      };
      reader.readAsDataURL(imageBlob);
      
      // Timeout after 30 seconds (uploads can take time)
      setTimeout(() => {
        if (pendingImageUploads.has(id)) {
          pendingImageUploads.delete(id);
          resolve({ result: null, error: 'Upload timeout' });
        }
      }, 30000);
    });
  }
  
  /**
   * Upload image and attach to ChatGPT prompt (convenience wrapper)
   * This attaches the image to the current prompt input
   * @param {Blob|File} imageBlob - The image data
   * @param {string} [fileName] - Optional filename
   * @returns {Promise<boolean>} - Success status
   */
  async function attachImageToPrompt(imageBlob, fileName) {
    const uploadResult = await uploadImageToChatGPT(imageBlob, fileName);
    if (uploadResult.error) {
      console.error(LOG_PREFIX, 'Image upload failed:', uploadResult.error);
      return false;
    }
    if (uploadResult.result) {
      console.log(LOG_PREFIX, 'Image uploaded successfully:', uploadResult.result.fileId);
      return true;
    }
    return false;
  }
  
  // Expose upload functions globally for external use
  window.ebtUploadImage = uploadImageToChatGPT;
  window.ebtAttachImage = attachImageToPrompt;

  // Poll for images from the API and upload them to ChatGPT
  async function pollForImages() {
    if (isPollingImages) return;
    if (!isContextValid()) return;
    
    isPollingImages = true;
    
    try {
      const settings = await getSettings();

      syncPromptImageCount(settings.promptImageCount);
      
      if (!settings.enabled || !settings.symbol) {
        isPollingImages = false;
        return;
      }
      
      const symbol = settings.symbol;
      
      // Check for new image
      const response = await fetch(`${IMAGE_API_URL}?symbol=${encodeURIComponent(symbol)}`, {
        method: 'GET'
      });
      
      if (response.status === 200) {
        const imageData = await response.json();
        console.log(LOG_PREFIX, 'Received image for analysis:', imageData.fileName);
        
        const now = Date.now();
        if (now - lastFocusMessageAt >= 10 * 60 * 1000) {
          window.postMessage({ __TESTINGVIEW__: true, type: 'FOCUS_ME' }, '*');
          lastFocusMessageAt = now;
        }
        
        // Convert base64 to Blob
        const byteCharacters = atob(imageData.imageBase64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: imageData.mimeType || 'image/png' });
        
        // Upload to ChatGPT
        const success = await attachImageToPrompt(blob, imageData.fileName);
        if (success) {
          console.log(LOG_PREFIX, 'Image attached to ChatGPT prompt successfully');
          if (settings.enabled && settings.symbol) {
            await sendNote(`Analysing ${imageData.fileName || 'image'}`, settings.symbol);
            await fetch(`${IMAGE_API_URL}-remove?symbol=${encodeURIComponent(symbol)}&filename=${encodeURIComponent(imageData.fileName)}`, {
              method: 'POST'
            });
          }
        } else {
          console.error(LOG_PREFIX, 'Failed to attach image to ChatGPT prompt');
        }
      } else if (response.status === 204) {
        // No images in queue, this is normal
      } else {
        console.warn(LOG_PREFIX, 'Unexpected response from image API:', response.status);
      }
    } catch (error) {
      console.error(LOG_PREFIX, 'Error polling for images:', error);
    }
    
    isPollingImages = false;
  }

  // Simple hash function for message content
  function hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString();
  }

  // Get the current chat ID from URL
  function getChatUrl() {
    return window.location.pathname;
  }

  // Reset state when switching chats
  function resetForNewChat() {
    canStart = false;
    currentChatUrl = getChatUrl();
    console.log(LOG_PREFIX, 'Switched to new chat:', currentChatUrl);
  }

  // Check if chat has changed
  function checkChatChanged() {
    const newUrl = getChatUrl();
    if (newUrl !== currentChatUrl) {
      resetForNewChat();
    }
  }

  // Tab-scoped key (stored in sessionStorage so each tab gets its own default symbol)
  const TAB_KEY_STORAGE = 'ebtTabKey';

  function getTabKey() {
    try {
      let tabKey = window.sessionStorage.getItem(TAB_KEY_STORAGE);
      if (!tabKey) {
        const uuid = (typeof crypto !== 'undefined' && crypto.randomUUID)
          ? crypto.randomUUID()
          : `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
        tabKey = uuid;
        window.sessionStorage.setItem(TAB_KEY_STORAGE, tabKey);
      }
      return tabKey;
    } catch (e) {
      return null;
    }
  }

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message?.type === 'EBT_GET_TAB_KEY') {
      sendResponse({ tabKey: getTabKey() });
    }
  });

  function markContextInvalidated(error) {
    extensionContextInvalidated = true;
    if (!loggedContextInvalidation) {
      loggedContextInvalidation = true;
      console.warn(LOG_PREFIX, 'Extension context invalidated', error || '');
    }
  }

  function isContextValid() {
    if (extensionContextInvalidated) return false;
    try {
      return typeof chrome !== 'undefined' && !!chrome.runtime?.id;
    } catch {
      return false;
    }
  }

  function storageGet(keys, timeoutMs = 2000) {
    return new Promise((resolve) => {
      if (!isContextValid()) {
        resolve(null);
        return;
      }

      if (!chrome?.storage?.local?.get) {
        console.warn(LOG_PREFIX, 'chrome.storage.local.get unavailable');
        resolve(null);
        return;
      }

      let settled = false;
      const timer = setTimeout(() => {
        if (!settled) {
          settled = true;
          if (!isContextValid()) {
            markContextInvalidated();
          }
          console.warn(LOG_PREFIX, 'chrome.storage.local.get timed out');
          resolve(null);
        }
      }, timeoutMs);

      try {
        chrome.storage.local.get(keys, (result) => {
          if (settled) return;
          settled = true;
          clearTimeout(timer);

          if (chrome.runtime.lastError) {
            console.warn(LOG_PREFIX, 'chrome.storage.local.get error:', chrome.runtime.lastError);
            resolve(null);
            return;
          }

          resolve(result || {});
        });
      } catch (e) {
        if (!settled) {
          settled = true;
          clearTimeout(timer);
          const msg = String(e?.message || e || '');
          if (msg.toLowerCase().includes('extension context invalidated')) {
            markContextInvalidated(e);
          } else {
            console.warn(LOG_PREFIX, 'chrome.storage.local.get threw:', e);
          }
          resolve(null);
        }
      }
    });
  }

  // Get settings from storage (per-tab default symbol with global mappings)
  async function getSettings() {
    try {
      if (!isContextValid()) {
        return { symbol: '', enabled: false, mappings: [], promptImageCount: DEFAULT_PROMPT_IMAGE_COUNT };
      }

      const tabKey = getTabKey();
      const tabStorageKey = tabKey ? `tab_${tabKey}` : null;
      const urlKey = `url_${window.location.pathname}`;
      const keysToLoad = ['globalEnabled', 'globalMappings', urlKey];
      if (tabStorageKey) {
        keysToLoad.push(tabStorageKey);
      }

      const result = await storageGet(keysToLoad);
      if (!result) {
        return { symbol: '', enabled: false, mappings: [], promptImageCount: DEFAULT_PROMPT_IMAGE_COUNT };
      }

      const enabled = result.globalEnabled || false;
      const tabSettings = (tabStorageKey && result[tabStorageKey])
        ? result[tabStorageKey]
        : (result[urlKey] || {});
      var symbol = tabSettings.symbol || '';
      const promptImageCount = normalizePromptImageCount(tabSettings.promptImageCount);
      const mappings = result.globalMappings || [];

      if (tabStorageKey && result[urlKey] && !result[tabStorageKey] && chrome?.storage?.local?.set) {
        chrome.storage.local.set({ [tabStorageKey]: result[urlKey] });
      }

      if(mappings.length == 1) {
        symbol = mappings[0].symbol;
      }
      
      return { symbol, enabled, mappings, promptImageCount };
    } catch (e) {
      return { symbol: '', enabled: false, mappings: [], promptImageCount: DEFAULT_PROMPT_IMAGE_COUNT };
    }
  }

  // Find mapped symbol based on text content
  function findMappedSymbol(text, mappings, forceSymbol) {
    if(forceSymbol) {
        return forceSymbol;
    }

    if (!mappings || mappings.length === 0) {
      return forceSymbol;
    }
    
    // Check each mapping - first match wins
    for (const mapping of mappings) {
      if (mapping.keyword && mapping.symbol) {
        // Case-insensitive search with word boundary
        const regex = new RegExp(`\\b${escapeRegex(mapping.keyword)}\\b`, 'i');
        if (regex.test(text)) {
          console.log(LOG_PREFIX, `Mapped keyword "${mapping.keyword}" to symbol "${mapping.symbol}"`);
          return mapping.symbol;
        }
      }
    }
    
    return forceSymbol;
  }
  
  // Escape special regex characters
  function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  // Send note to API
  async function sendNote(text, symbol) {
    try {
      const response = await fetch(`${API_URL}?symbol=${encodeURIComponent(symbol)}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain'
        },
        body: text
      });
      
      if (response.ok) {
        console.log(LOG_PREFIX, 'Sent note for symbol:', symbol);
        return true;
      } else {
        console.error(LOG_PREFIX, 'Failed to send note:', response.status);
        return false;
      }
    } catch (error) {
      console.error(LOG_PREFIX, 'Error sending note:', error);
      return false;
    }
  }

  // Get all assistant message elements
  function getAssistantMessages() {
    const selectors = [
      '[data-message-author-role="assistant"]',
      '.agent-turn .markdown',
      '.assistant-message'
    ];

    for (const selector of selectors) {
      const elements = document.querySelectorAll(selector);
      if (elements.length > 0) {
        return Array.from(elements);
      }
    }

    // Fallback
    const proseElements = document.querySelectorAll('.prose, .markdown');
    return Array.from(proseElements).filter(el => {
      const parent = el.closest('[data-message-author-role]');
      return parent && parent.dataset.messageAuthorRole === 'assistant';
    });
  }

  // === Signature-based fiber detection (works even if key names are renamed/Symbol-based) ===
  
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
    // names + symbols (covers hardened builds that stash internals on Symbols)
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

      if (looksLikeFiber(v)) return { kind: "fiber", node, key: k, value: v };
      if (looksLikeFiberRoot(v)) return { kind: "root", node, key: k, value: v };
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

  function fiberName(f) {
    return (
      f?.elementType?.displayName ||
      f?.elementType?.name ||
      f?.type?.displayName ||
      f?.type?.name ||
      (typeof f?.type === "string" ? f.type : null) ||
      `tag:${f?.tag}`
    );
  }

  function fiberPath(fiber, max = 30) {
    const out = [];
    let f = fiber;
    while (f && out.length < max) {
      out.push(fiberName(f));
      f = f.return;
    }
    return out;
  }

  // Get fiber from the hit result (handles both fiber and root cases)
  function getFiberFromHit(hit) {
    if (!hit) return null;
    if (hit.kind === "fiber") return hit.value;
    if (hit.kind === "root") return hit.value.current;
    return null;
  }

  // === Legacy fiber detection methods (kept as fallback) ===

  // Get React fiber from a single DOM element (legacy method)
  function getReactFiberFromDom(dom) {
    if (!dom) return null;
    for (const k in dom) {
      if (k.startsWith("__reactFiber$") || k.startsWith("__reactInternalInstance$")) {
        return dom[k];
      }
    }
    return null;
  }

  // Walk up the DOM tree to find the closest React fiber (legacy method)
  function getClosestReactFiber(dom) {
    let el = dom;
    while (el) {
      const f = getReactFiberFromDom(el);
      if (f) return f;
      el = el.parentElement;
    }
    return null;
  }

  // Get React props from a DOM element
  function getReactPropsFromDom(dom) {
    if (!dom) return null;
    for (const k in dom) {
      if (k.startsWith("__reactProps$")) return dom[k];
    }
    return null;
  }

  // Alias for compatibility
  function getReactFiber(element) {
    return getReactFiberFromDom(element);
  }

  // Find conversation data from ChatGPT's global stores
  function findMessageFromGlobalStore(messageId) {
    try {
      // Try to find conversation data in window objects
      // ChatGPT may store data in various global locations
      
      // Check for __NEXT_DATA__
      if (window.__NEXT_DATA__?.props?.pageProps) {
        const pageProps = window.__NEXT_DATA__.props.pageProps;
        if (pageProps.serverResponse?.data?.messages) {
          for (const msg of pageProps.serverResponse.data.messages) {
            if (msg.id === messageId && msg.content?.parts) {
              return msg;
            }
          }
        }
      }
      
      // Search for conversation stores in window
      for (const key of Object.keys(window)) {
        try {
          const obj = window[key];
          if (obj && typeof obj === 'object') {
            // Look for conversation/message stores
            if (obj.getState && typeof obj.getState === 'function') {
              const state = obj.getState();
              const msg = searchForMessage(state, messageId, 5);
              if (msg) return msg;
            }
          }
        } catch (e) {
          // Skip inaccessible properties
        }
      }
    } catch (error) {
      console.log(LOG_PREFIX, 'Error searching global store:', error);
    }
    return null;
  }

  // Search object recursively for message with given ID
  function searchForMessage(obj, messageId, depth) {
    if (!obj || depth <= 0 || typeof obj !== 'object') return null;
    
    // Check if this is the message
    if (obj.id === messageId && obj.content?.parts) {
      return obj;
    }
    
    // Check common container properties
    if (obj.messages && Array.isArray(obj.messages)) {
      for (const msg of obj.messages) {
        if (msg.id === messageId && msg.content?.parts) {
          return msg;
        }
      }
    }
    
    // Check mapping/dictionary structures
    if (obj.mapping && typeof obj.mapping === 'object') {
      for (const key of Object.keys(obj.mapping)) {
        const item = obj.mapping[key];
        if (item?.message?.id === messageId && item?.message?.content?.parts) {
          return item.message;
        }
      }
    }
    
    // Recurse into object properties
    for (const key of Object.keys(obj).slice(0, 20)) {
      try {
        const result = searchForMessage(obj[key], messageId, depth - 1);
        if (result) return result;
      } catch (e) {
        // Skip
      }
    }
    
    return null;
  }

  // Search all elements for React data containing message content
  function findMessageInDOM(messageElement) {
    // Get message ID if available
    const messageContainer = messageElement.closest('[data-message-id]');
    const messageId = messageContainer?.getAttribute('data-message-id');
    
    // First try global store
    if (messageId) {
      const globalMessage = findMessageFromGlobalStore(messageId);
      if (globalMessage) return globalMessage;
    }
    
    // Search strategy: look for elements with React props containing message data
    const elementsToSearch = [
      messageElement,
      messageContainer,
      messageElement.closest('[data-message-author-role]'),
      messageElement.closest('article'),
      messageElement.closest('[class*="agent"]'),
      ...Array.from(messageElement.querySelectorAll('*')).slice(0, 50),
      ...(messageContainer ? Array.from(messageContainer.querySelectorAll('*')).slice(0, 50) : [])
    ].filter(Boolean);
    
    for (const el of elementsToSearch) {
      const keys = Object.keys(el);
      
      for (const key of keys) {
        if (key.startsWith('__reactProps$') || key.startsWith('__reactFiber$')) {
          const data = el[key];
          const message = extractMessageFromData(data, messageId);
          if (message) return message;
        }
      }
    }
    
    return null;
  }

  // Recursively extract message from React data structure
  function extractMessageFromData(data, targetMessageId, depth = 10) {
    if (!data || depth <= 0) return null;
    if (typeof data !== 'object') return null;
    
    // Check if this is a message object with content.parts
    if (data.content?.parts && Array.isArray(data.content.parts)) {
      // If we have a target message ID, verify it matches
      if (!targetMessageId || data.id === targetMessageId) {
        return data;
      }
    }
    
    // Check message property
    if (data.message?.content?.parts) {
      if (!targetMessageId || data.message.id === targetMessageId) {
        return data.message;
      }
    }
    
    // Check memoizedProps (from fiber)
    if (data.memoizedProps) {
      const result = extractMessageFromData(data.memoizedProps, targetMessageId, depth - 1);
      if (result) return result;
    }
    
    // Check common prop names
    const propsToCheck = ['message', 'data', 'children', 'node', 'item', 'value'];
    for (const prop of propsToCheck) {
      if (data[prop]) {
        const result = extractMessageFromData(data[prop], targetMessageId, depth - 1);
        if (result) return result;
      }
    }
    
    return null;
  }

  // Traverse React fiber tree to find message data with content.parts
  function findMessageData(fiber, maxDepth = 15) {
    if (!fiber || maxDepth <= 0) return null;
    
    // Check memoizedProps for message data
    const props = fiber.memoizedProps;
    if (props) {
      // Direct message object with content.parts
      if (props.message?.content?.parts) {
        return props.message;
      }
      // Check for message in various prop patterns
      if (props.content?.parts) {
        return props;
      }
      // Check children or nested data
      if (props.data?.message?.content?.parts) {
        return props.data.message;
      }
    }
    
    // Check fiber's stateNode
    if (fiber.stateNode?.props?.message?.content?.parts) {
      return fiber.stateNode.props.message;
    }
    
    // Traverse up the fiber tree
    if (fiber.return) {
      const result = findMessageData(fiber.return, maxDepth - 1);
      if (result) return result;
    }
    
    // Also check child fibers
    if (fiber.child) {
      const result = findMessageData(fiber.child, maxDepth - 1);
      if (result) return result;
    }
    
    return null;
  }

  // Extract markdown from ChatGPT's internal message object (content.parts.join(""))
  function extractMarkdownFromReact(messageElement) {
    try {
      // Get the message ID first
      const messageContainer = messageElement.closest('[data-message-id]') ||
                               messageElement.closest('[data-message-author-role="assistant"]');
      const messageId = messageContainer?.getAttribute('data-message-id');
      
      console.log(LOG_PREFIX, 'Looking for message ID:', messageId);
      
      // Method 1: Signature-based fiber detection from copy button (most reliable)
      const copyButton = messageContainer?.querySelector('[data-testid="copy-turn-action-button"]');
      if (copyButton) {
        console.log(LOG_PREFIX, 'Found copy button, using signature-based fiber detection');
        const hit = findClosestFiberOrRoot(copyButton);
        if (hit) {
          console.log(LOG_PREFIX, 'Found hit:', hit.kind, 'key:', String(hit.key));
          const fiber = getFiberFromHit(hit);
          if (fiber) {
            console.log(LOG_PREFIX, 'Fiber path:', fiberPath(fiber).slice(0, 10).join(' -> '));
            const fiberMessageData = findMessageData(fiber, 30);
            if (fiberMessageData?.content?.parts) {
              const markdown = fiberMessageData.content.parts.join('');
              console.log(LOG_PREFIX, 'Extracted markdown from copy button fiber');
              return markdown;
            }
          }
        }
      }
      
      // Method 2: Signature-based fiber detection from message element
      const messageHit = findClosestFiberOrRoot(messageElement);
      if (messageHit) {
        console.log(LOG_PREFIX, 'Found fiber on message element:', messageHit.kind);
        const fiber = getFiberFromHit(messageHit);
        if (fiber) {
          const fiberMessageData = findMessageData(fiber, 30);
          if (fiberMessageData?.content?.parts) {
            const markdown = fiberMessageData.content.parts.join('');
            console.log(LOG_PREFIX, 'Extracted markdown from message element fiber');
            return markdown;
          }
        }
      }
      
      // Method 3: Signature-based fiber detection from message container
      if (messageContainer) {
        const containerHit = findClosestFiberOrRoot(messageContainer);
        if (containerHit) {
          console.log(LOG_PREFIX, 'Found fiber on container:', containerHit.kind);
          const fiber = getFiberFromHit(containerHit);
          if (fiber) {
            const fiberMessageData = findMessageData(fiber, 30);
            if (fiberMessageData?.content?.parts) {
              const markdown = fiberMessageData.content.parts.join('');
              console.log(LOG_PREFIX, 'Extracted markdown from container fiber');
              return markdown;
            }
          }
        }
      }
      
      // Method 4: Legacy - Use getClosestReactFiber (for..in based)
      const legacyFiber = getClosestReactFiber(messageElement);
      if (legacyFiber) {
        console.log(LOG_PREFIX, 'Found fiber via legacy getClosestReactFiber');
        const fiberMessageData = findMessageData(legacyFiber, 20);
        if (fiberMessageData?.content?.parts) {
          const markdown = fiberMessageData.content.parts.join('');
          console.log(LOG_PREFIX, 'Extracted markdown from legacy fiber');
          return markdown;
        }
      }
      
      // Method 5: Search DOM elements for React props
      const messageData = findMessageInDOM(messageElement);
      if (messageData?.content?.parts) {
        const markdown = messageData.content.parts.join('');
        console.log(LOG_PREFIX, 'Extracted markdown from DOM search');
        return markdown;
      }
      
      // Method 6: Deep legacy fiber traversal starting from container
      if (messageContainer) {
        const containerFiber = getReactFiberFromDom(messageContainer);
        if (containerFiber) {
          const fiberMessageData = findMessageData(containerFiber, 25);
          if (fiberMessageData?.content?.parts) {
            const markdown = fiberMessageData.content.parts.join('');
            console.log(LOG_PREFIX, 'Extracted markdown from legacy container fiber');
            return markdown;
          }
        }
      }
      
      // Method 7: Search conversation context from window
      if (messageId) {
        const found = searchConversationStores(messageId);
        if (found?.content?.parts) {
          const markdown = found.content.parts.join('');
          console.log(LOG_PREFIX, 'Extracted markdown from conversation store');
          return markdown;
        }
      }
      
      // Method 8: Try extracting from copy button via legacy method
      const copyButtonMarkdown = extractFromCopyButton(messageElement);
      if (copyButtonMarkdown) {
        console.log(LOG_PREFIX, 'Extracted markdown from copy button legacy');
        return copyButtonMarkdown;
      }
      
      console.log(LOG_PREFIX, 'Message data not found in React internals');
      return null;
    } catch (error) {
      console.error(LOG_PREFIX, 'Error extracting from React:', error);
      return null;
    }
  }
  
  // Deep search for conversation data in window objects
  function searchConversationStores(messageId) {
    // Search common locations for React/Next.js app state
    const possibleStores = [
      () => window.__NEXT_DATA__?.props?.pageProps?.serverResponse?.data,
      () => window.__remixContext?.state?.loaderData,
      () => document.querySelector('#__NEXT_DATA__')?.textContent ? JSON.parse(document.querySelector('#__NEXT_DATA__').textContent) : null
    ];
    
    for (const getStore of possibleStores) {
      try {
        const store = getStore();
        if (store) {
          const msg = searchForMessage(store, messageId, 8);
          if (msg) return msg;
        }
      } catch (e) {}
    }
    
    // Last resort: search for objects containing the message ID
    if (messageId) {
      const scripts = document.querySelectorAll('script:not([src])');
      for (const script of scripts) {
        if (script.textContent.includes(messageId)) {
          try {
            // Try to find JSON containing the message
            const matches = script.textContent.match(/\{[^{}]*"id"\s*:\s*"[^"]+[^{}]*"content"\s*:\s*\{[^{}]*"parts"[^{}]*\}[^{}]*\}/g);
            if (matches) {
              for (const match of matches) {
                try {
                  const obj = JSON.parse(match);
                  if (obj.id === messageId && obj.content?.parts) {
                    return obj;
                  }
                } catch (e) {}
              }
            }
          } catch (e) {}
        }
      }
    }
    
    return null;
  }
  
  // Try to extract markdown from the copy button's React data
  function extractFromCopyButton(messageElement) {
    try {
      // Find the copy button for this message
      const messageContainer = messageElement.closest('[data-message-id]') || messageElement.closest('article');
      if (!messageContainer) return null;
      
      // Look for copy button
      const copyButton = messageContainer.querySelector('button[data-testid="copy-turn-action-button"]') ||
                         messageContainer.querySelector('button[aria-label*="Copy"]') ||
                         messageContainer.querySelector('button[class*="copy"]');
      
      if (!copyButton) return null;
      
      // Get React props from copy button
      const keys = Object.keys(copyButton);
      for (const key of keys) {
        if (key.startsWith('__reactProps$')) {
          const props = copyButton[key];
          // The onClick handler might have closure access to message data
          // Check the props for message content
          const message = extractMessageFromData(props, null, 10);
          if (message?.content?.parts) {
            return message.content.parts.join('');
          }
        }
        if (key.startsWith('__reactFiber$')) {
          const fiber = copyButton[key];
          // Traverse the fiber to find message context
          const message = findMessageData(fiber, 20);
          if (message?.content?.parts) {
            return message.content.parts.join('');
          }
        }
      }
    } catch (e) {
      console.log(LOG_PREFIX, 'Error extracting from copy button:', e);
    }
    return null;
  }

  // Fallback: extract plain text
  function extractPlainText(element) {
    return element.textContent.trim();
  }

  // Extract content from an element (prefer ChatGPT's internal markdown via page script)
  async function extractTextContent(messageElement) {
    // Build a unique selector for this element to pass to page script
    const messageContainer = messageElement.closest('[data-message-id]');
    const messageId = messageContainer?.getAttribute('data-message-id');
    
    if (messageId) {
      // Try the copy button first (most reliable)
      const copyButtonSelector = `[data-message-id="${messageId}"] [data-testid="copy-turn-action-button"]`;
      console.log(LOG_PREFIX, 'Trying to extract via page script with selector:', copyButtonSelector);
      
      let markdown = await extractMarkdownViaPageScript(copyButtonSelector);
      if (markdown && markdown.length > 10) {
        console.log(LOG_PREFIX, 'Got markdown from page script (copy button)');
        return markdown;
      }
      
      // Try the message container itself
      const containerSelector = `[data-message-id="${messageId}"]`;
      markdown = await extractMarkdownViaPageScript(containerSelector);
      if (markdown && markdown.length > 10) {
        console.log(LOG_PREFIX, 'Got markdown from page script (container)');
        return markdown;
      }
    }
    
    // Fallback: try content script methods (may not work due to isolation)
    const legacyMarkdown = extractMarkdownFromReact(messageElement);
    if (legacyMarkdown && legacyMarkdown.length > 10) {
      console.log(LOG_PREFIX, 'Got markdown from legacy content script method');
      return legacyMarkdown;
    }
    
    // Final fallback to plain text
    console.log(LOG_PREFIX, 'Falling back to plain text');
    return extractPlainText(messageElement);
  }

  // Check if the response is still being generated
  function isResponseGenerating() {
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

  // Main monitoring function - only sends NEW messages
  async function checkForNewResponse() {
    if (!isContextValid()) {
      return;
    }

    const execution = async () => {
        checkChatChanged();

        if (isResponseGenerating()) {
            if (!generationNotified) {
                generationNotified = true;
                const settings = await getSettings();
                if (settings.enabled && settings.symbol) {
                    await sendNote('Generating the narrative...', settings.symbol);
                }
            }
            canStart = true;
            return;
        }

        generationNotified = false;

        if(!canStart) {
            return;
        }

        const settings = await getSettings();
        
        if (!settings.enabled) {
            return;
        }

        const messages = getAssistantMessages();
        
        // Wait to ensure the response is complete
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Get the latest message (the new one)
        const latestMessage = messages[messages.length - 1];
        const content = await extractTextContent(latestMessage);
        
        if (!content || content.length < 10) {
        return;
        }
        // Find the symbol to use (check mappings first, then fall back to default)
        const targetSymbol = findMappedSymbol(content, settings.mappings, settings.symbol);
        
        if (!targetSymbol) {
        console.log(LOG_PREFIX, 'No symbol configured and no mapping matched');
        return;
        }
        
        await sendNote(content, targetSymbol);
        canStart = false;
    }

    execution()
      .then(() => new Promise(resolve => setTimeout(resolve, 1000)))
      .then(() => {
        if (!isContextValid()) {
          return;
        }
        return checkForNewResponse();
      });
  }

  // Initialize
  function init() {
    console.log(LOG_PREFIX, 'Extension loaded');
    
    // Inject page script first (needed for React fiber access)
    injectPageScript();
    checkForNewResponse();

    // Poll for images from TestingView API
    setInterval(pollForImages, 500);
  }

  init();
})();
