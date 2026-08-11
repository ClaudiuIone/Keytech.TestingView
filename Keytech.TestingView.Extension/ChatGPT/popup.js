// Popup script for configuring the extension (per-tab settings with symbol mappings)

const symbolInput = document.getElementById('symbol');
const promptImageCountInput = document.getElementById('promptImageCount');
const enabledCheckbox = document.getElementById('enabled');
const statusDiv = document.getElementById('status');
const mappingsContainer = document.getElementById('mappingsContainer');
const addMappingBtn = document.getElementById('addMapping');

const DEFAULT_PROMPT_IMAGE_COUNT = 6;

let currentTabId = null;
let currentTabUrl = null;
let currentTabKey = null;
let mappings = []; // Array of { keyword, symbol }

function normalizePromptImageCount(value) {
  const parsed = parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return DEFAULT_PROMPT_IMAGE_COUNT;
  }
  return parsed;
}

// Get storage key for URL (used by content script to find its symbol)
function getUrlKey(url) {
  try {
    const urlObj = new URL(url);
    return `url_${urlObj.pathname}`;
  } catch {
    return null;
  }
}

function getTabStorageKey() {
  if (currentTabKey) {
    return `tab_${currentTabKey}`;
  }
  return getUrlKey(currentTabUrl);
}

function resolveTabKey(done) {
  if (!currentTabId) {
    done();
    return;
  }

  const fallbackToScript = () => {
    chrome.scripting.executeScript({
      target: { tabId: currentTabId },
      func: () => {
        try {
          const keyName = 'ebtTabKey';
          let tabKey = sessionStorage.getItem(keyName);
          if (!tabKey) {
            const uuid = (typeof crypto !== 'undefined' && crypto.randomUUID)
              ? crypto.randomUUID()
              : `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
            tabKey = uuid;
            sessionStorage.setItem(keyName, tabKey);
          }
          return tabKey;
        } catch (e) {
          return null;
        }
      }
    }, (results) => {
      if (!chrome.runtime.lastError && results && results[0]?.result) {
        currentTabKey = results[0].result;
      }
      done();
    });
  };

  chrome.tabs.sendMessage(currentTabId, { type: 'EBT_GET_TAB_KEY' }, (response) => {
    if (!chrome.runtime.lastError && response?.tabKey) {
      currentTabKey = response.tabKey;
      done();
      return;
    }
    fallbackToScript();
  });
}

// Initialize: get current tab and load its settings
chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  if (tabs[0]) {
    currentTabId = tabs[0].id;
    currentTabUrl = tabs[0].url;
    resolveTabKey(loadTabSettings);
  }
});

// Load settings for the current tab
function loadTabSettings() {
  const tabKey = getTabStorageKey();
  if (!tabKey) return;

  const urlKey = getUrlKey(currentTabUrl);
  const keysToLoad = [tabKey, 'globalEnabled', 'globalMappings'];
  if (urlKey && urlKey !== tabKey) {
    keysToLoad.push(urlKey);
  }
  
  chrome.storage.local.get(keysToLoad, (result) => {
    const tabSettings = result[tabKey] || (urlKey ? result[urlKey] : {}) || {};
    symbolInput.value = tabSettings.symbol || '';
    promptImageCountInput.value = normalizePromptImageCount(tabSettings.promptImageCount);
    enabledCheckbox.checked = result.globalEnabled || false;
    mappings = result.globalMappings || [];
    renderMappings();
    updateStatus();

    if (urlKey && result[urlKey] && !result[tabKey]) {
      chrome.storage.local.set({ [tabKey]: result[urlKey] });
    }
  });
}

// Render mapping rows
function renderMappings() {
  mappingsContainer.innerHTML = '';
  mappings.forEach((mapping, index) => {
    const row = document.createElement('div');
    row.className = 'mapping-row';
    row.innerHTML = `
      <input type="text" class="keyword" placeholder="Keyword" value="${escapeHtml(mapping.keyword)}" data-index="${index}" data-field="keyword">
      <input type="text" class="symbol" placeholder="Symbol (e.g., CME_MINI:MNQ1!)" value="${escapeHtml(mapping.symbol)}" data-index="${index}" data-field="symbol">
      <button data-index="${index}">×</button>
    `;
    mappingsContainer.appendChild(row);
  });
  
  // Add event listeners
  mappingsContainer.querySelectorAll('input').forEach(input => {
    input.addEventListener('input', handleMappingChange);
  });
  mappingsContainer.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', handleRemoveMapping);
  });
}

function escapeHtml(str) {
  return str.replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function handleMappingChange(e) {
  const index = parseInt(e.target.dataset.index);
  const field = e.target.dataset.field;
  mappings[index][field] = e.target.value.trim();
  saveMappings();
}

function handleRemoveMapping(e) {
  const index = parseInt(e.target.dataset.index);
  mappings.splice(index, 1);
  saveMappings();
  renderMappings();
}

function saveMappings() {
  // Filter out empty mappings
  const validMappings = mappings.filter(m => m.keyword && m.symbol);
  chrome.storage.local.set({ globalMappings: validMappings }, updateStatus);
}

// Add new mapping
addMappingBtn.addEventListener('click', () => {
  mappings.push({ keyword: '', symbol: '' });
  renderMappings();
  // Focus the new keyword input
  const inputs = mappingsContainer.querySelectorAll('.keyword');
  if (inputs.length > 0) {
    inputs[inputs.length - 1].focus();
  }
});

// Save symbol for this tab
symbolInput.addEventListener('input', () => {
  const tabKey = getTabStorageKey();
  if (!tabKey) return;
  
  const symbol = symbolInput.value.trim();
  
  chrome.storage.local.get([tabKey], (result) => {
    const tabSettings = result[tabKey] || {};
    tabSettings.symbol = symbol;
    chrome.storage.local.set({ [tabKey]: tabSettings }, () => {
      updateStatus();
    });
  });
});

// Save prompt image count for this tab
promptImageCountInput.addEventListener('change', () => {
  const tabKey = getTabStorageKey();
  if (!tabKey) return;

  const normalized = normalizePromptImageCount(promptImageCountInput.value);
  promptImageCountInput.value = normalized;

  chrome.storage.local.get([tabKey], (result) => {
    const tabSettings = result[tabKey] || {};
    tabSettings.promptImageCount = normalized;
    chrome.storage.local.set({ [tabKey]: tabSettings }, () => {
      updateStatus();
    });
  });
});

// Save enabled state globally (affects all tabs)
enabledCheckbox.addEventListener('change', () => {
  chrome.storage.local.set({ globalEnabled: enabledCheckbox.checked }, () => {
    updateStatus();
  });
});

function updateStatus() {
  const symbol = symbolInput.value.trim();
  const enabled = enabledCheckbox.checked;
  const validMappings = mappings.filter(m => m.keyword && m.symbol);
  
  if (enabled && (symbol || validMappings.length > 0)) {
    statusDiv.className = 'status active';
    if (validMappings.length > 0) {
      statusDiv.textContent = `✓ Active with ${validMappings.length} mapping(s)`;
    } else {
      statusDiv.textContent = `✓ Active for ${symbol}`;
    }
  } else if (enabled) {
    statusDiv.className = 'status inactive';
    statusDiv.textContent = '⚠ Add a symbol or mapping';
  } else {
    statusDiv.className = 'status inactive';
    statusDiv.textContent = 'Disabled';
  }
}
