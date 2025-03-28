const state = {
  key: null,
};

function init() {
  const buttonReset = document.getElementById('reset');
  const form = document.getElementById('form');
  const textarea = document.getElementById('input-css');

  // AUTO-CLOSE: brackets, quotes
  const pairs = {
    '(': ')',
    '{': '}',
    '[': ']',
    '"': '"',
    "'": "'"
  };

  buttonReset.addEventListener('click', removeAllCustomCSS);

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const css = textarea.value;
    storeCSS(css);
  });

  textarea.addEventListener('keydown', function(e) {
    const start = this.selectionStart;
    const end = this.selectionEnd;
    const value = this.value;
    if (e.key === 'Tab') {
      e.preventDefault();
      this.value = value.substring(0, start) + "\t" + value.substring(end);
      this.selectionStart = this.selectionEnd = start + 1;
    }
    // ENTER: auto-indent next line
    else if (e.key === 'Enter') {
      e.preventDefault();

      const before = value.substring(0, start);
      const after = value.substring(end);

      const lastChar = before.slice(-1);
      const nextChar = after[0];

      const lineStart = before.lastIndexOf('\n') + 1;
      const currentLine = before.slice(lineStart);
      const indentMatch = currentLine.match(/^[ \t]*/);
      const currentIndent = indentMatch ? indentMatch[0] : '';
      const indentUnit = '\t'; // or '  '

      if (lastChar === '{' && nextChar === '}') {
        // Smart auto-indent inside {}
        const insert = `\n${currentIndent}${indentUnit}\n${currentIndent}`;
        this.value = before + insert + after;

        // Set cursor inside the braces, indented
        const cursorPos = start + 1 + currentIndent.length + indentUnit.length;
        this.selectionStart = this.selectionEnd = cursorPos;
      } else {
        // Regular auto-indent
        const insert = `\n${currentIndent}`;
        this.value = before + insert + after;
        this.selectionStart = this.selectionEnd = start + insert.length;
      }
    }

    else if (pairs[e.key] && !e.ctrlKey && !e.metaKey && !e.altKey) {
      e.preventDefault();
      const closeChar = pairs[e.key];
      const insertText = e.key + closeChar;
      this.value = value.substring(0, start) + insertText + value.substring(end);
      this.selectionStart = this.selectionEnd = start + 1;
    }
  });

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tab = tabs[0];

    try {
      const url = new URL(tab.url);
      const key = `ngcCSSInject__${url.hostname}`;
      state.key = key;

      chrome.storage.sync.get([key], function (result) {
        const css = result[key];
        if (css) {
          document.getElementById("input-css").value = css;
        }
      });
    } catch (e) {
      console.warn("Invalid URL in active tab:", tab.url);
    }
  });

  setupToggle();
}

function setupToggle() {
  const toggle = document.getElementById("toggle-css");
  const statusText = document.getElementById("status-text");

  chrome.storage.sync.get("enabled", (data) => {
    const isEnabled = data.enabled !== false;

    console.log("Toggle element:", toggle);
    toggle.checked = isEnabled;
    updateStatus(isEnabled);
  });

  toggle.addEventListener("change", () => {
    const isEnabled = toggle.checked;
    chrome.storage.sync.set({ enabled: isEnabled });
    updateStatus(isEnabled);

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, { setCSS: isEnabled });
    });
  });

  function updateStatus(isEnabled) {
    statusText.textContent = isEnabled ? "Enabled" : "Disabled";
    statusText.classList.toggle("enabled", isEnabled);
    statusText.classList.toggle("disabled", !isEnabled);
  }
}

function removeAllCustomCSS() {
  chrome.storage.sync.remove([state.key], function () {
    const textarea = document.getElementById('input-css');
    textarea.value = '';

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, { setCSS: false }, (response) => {
        window.close();
      });
    });
  });
}

function storeCSS(css) {
  const value = {
    [state.key]: css
  };

  chrome.storage.sync.set(value, function () {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, { setCSS: true }, (response) => {
        window.close();
      });
    });
  });
}

(function () {
  window.addEventListener('DOMContentLoaded', init);
})();