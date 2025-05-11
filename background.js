chrome.action.onClicked.addListener((tab) => {
  if (tab.id) {
    chrome.tabs.sendMessage(tab.id, { command: "startSelection" }, (response) => {
      if (chrome.runtime.lastError) {
        console.warn("Element Highlighter (background.js): Could not send 'startSelection' message to content script.", chrome.runtime.lastError.message);
      } else if (response && response.status) {
        console.log("Element Highlighter (background.js): Content script responded:", response.status);
      }
    });
  } else {
    console.warn("Element Highlighter (background.js): Clicked tab has no ID. Cannot send message.");
  }
});

console.log("Element Highlighter background.js loaded and active");