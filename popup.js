const state = {
  key: null,
};

function init() {
  const buttonReset = document.getElementById('reset');
  const form = document.getElementById('form');
  const textarea = document.getElementById('input-css');

  buttonReset.addEventListener('click', removeAllCustomCSS);

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const css = textarea.value;
    storeCSS(css);
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