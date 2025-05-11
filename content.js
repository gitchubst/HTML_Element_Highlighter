let highlightedElement = null;
let originalOutline = null;
let isSelectionActive = false;

function isExtensionPopup(element) {
  let el = element;
  while (el) {
    if (el.id === 'element-highlighter-popup') {
      return true;
    }
    el = el.parentElement;
  }
  return false;
}

document.addEventListener('mouseover', (e) => {
  if (!isSelectionActive || isExtensionPopup(e.target)) {
    if (highlightedElement && !isExtensionPopup(highlightedElement) && document.body.contains(highlightedElement)) {
        highlightedElement.style.outline = originalOutline;
        highlightedElement = null;
        originalOutline = null;
    }
    return;
  }

  if (highlightedElement && !isExtensionPopup(highlightedElement) && document.body.contains(highlightedElement)) {
    highlightedElement.style.outline = originalOutline;
  }

  highlightedElement = e.target;
  originalOutline = highlightedElement.style.outline;
  highlightedElement.style.outline = '2px solid blue';
}, true);

document.addEventListener('mouseout', (e) => {
  if (!isSelectionActive || !highlightedElement || isExtensionPopup(e.target) || isExtensionPopup(highlightedElement)) {
    return;
  }
  if (highlightedElement && document.body.contains(highlightedElement)) {
    highlightedElement.style.outline = originalOutline;
  }
  highlightedElement = null;
  originalOutline = null;
}, true);

document.addEventListener('click', (e) => {
  if (isExtensionPopup(e.target)) {
    return;
  }

  if (!isSelectionActive) {
    return;
  }

  e.preventDefault();
  e.stopPropagation();

  if (!e.target || e.target === document.body || e.target === document.documentElement) {
    console.log("Element Highlighter: Clicked on body/html or invalid target. Selection not processed.");
    isSelectionActive = false;
    console.log("Element Highlighter: Selection DEACTIVATED due to invalid target click.");
    if (highlightedElement && document.body.contains(highlightedElement)) {
      highlightedElement.style.outline = originalOutline;
    }
    highlightedElement = null;
    originalOutline = null;
    return;
  }

  const element = e.target;
  const htmlCode = element.outerHTML;

  const computedStyles = window.getComputedStyle(element);
  let cssCode = `${element.tagName.toLowerCase()}${element.id ? '#' + element.id : ''}${element.className && typeof element.className === 'string' ? '.' + element.className.trim().replace(/\s+/g, '.') : ''} {\n`;

  const layoutProperties = ['display', 'position', 'top', 'right', 'bottom', 'left', 'float', 'clear', 'z-index', 'overflow', 'visibility'];
  const boxModelProperties = ['width', 'height', 'min-width', 'max-width', 'min-height', 'max-height', 'margin', 'padding', 'border', 'box-sizing'];
  const typographyProperties = ['color', 'font-family', 'font-size', 'font-weight', 'font-style', 'line-height', 'text-align', 'text-decoration', 'text-transform', 'letter-spacing', 'word-spacing'];
  const backgroundProperties = ['background', 'background-color', 'background-image', 'background-repeat', 'background-position', 'background-size'];
  const visualProperties = ['opacity', 'border-radius', 'box-shadow', 'filter', 'transform', 'transition'];
  const relevantProperties = [...layoutProperties, ...boxModelProperties, ...typographyProperties, ...backgroundProperties, ...visualProperties];

  relevantProperties.forEach(prop => {
    const value = computedStyles.getPropertyValue(prop);
    if (value && value !== 'none' && value !== 'auto' && value !== '' && value !== 'normal' && value !== '0px' && value !== 'rgba(0, 0, 0, 0)') {
      cssCode += `  ${prop}: ${value};\n`;
    }
  });
  cssCode += '}';

  const existingPopup = document.getElementById('element-highlighter-popup');
  if (existingPopup) {
    existingPopup.remove();
  }

  const popupDiv = document.createElement('div');
  popupDiv.id = 'element-highlighter-popup';
  popupDiv.innerHTML = `
    <div class="popup-header">
      <span>Element Code</span>
      <button id="close-popup-btn" title="Close">&times;</button>
    </div>
    <div class="popup-section">
      <h3>HTML</h3>
      <pre><code>${htmlCode.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code></pre>
      <button class="copy-btn" data-type="html">Copy HTML</button>
    </div>
    <div class="popup-section">
      <h3>CSS</h3>
      <pre><code>${cssCode}</code></pre>
      <button class="copy-btn" data-type="css">Copy CSS</button>
    </div>
  `;
  document.body.appendChild(popupDiv);

  makeDraggable(popupDiv);

  popupDiv.querySelector('#close-popup-btn').addEventListener('click', (event) => {
    event.stopPropagation();
    popupDiv.remove();
    console.log("Element Highlighter: Code info popup closed. Selection remains DEACTIVATED.");
  });

  popupDiv.querySelectorAll('.copy-btn').forEach(button => {
    button.addEventListener('click', (event) => {
      event.stopPropagation();
      const type = button.getAttribute('data-type');
      const textToCopy = type === 'html' ? htmlCode : cssCode;
      navigator.clipboard.writeText(textToCopy).then(() => {
        button.textContent = 'Copied!';
        setTimeout(() => { button.textContent = `Copy ${type.toUpperCase()}`; }, 2000);
      }).catch(err => {
        console.error('Element Highlighter: Failed to copy text: ', err);
        button.textContent = 'Error';
        setTimeout(() => { button.textContent = `Copy ${type.toUpperCase()}`; }, 2000);
      });
    });
  });

  isSelectionActive = false;
  console.log("Element Highlighter: Element selected, code displayed. Selection DEACTIVATED. Click icon to restart.");

  if (highlightedElement && !isExtensionPopup(highlightedElement) && document.body.contains(highlightedElement)) {
    highlightedElement.style.outline = originalOutline;
  }
  highlightedElement = null;
  originalOutline = null;

}, true);

function makeDraggable(element) {
  let isDragging = false;
  let offsetX, offsetY;
  const header = element.querySelector('.popup-header');

  if (!header) return;

  header.addEventListener('mousedown', (e) => {
    if (e.target.id === 'close-popup-btn') {
        return;
    }
    isDragging = true;

    offsetX = e.clientX - element.getBoundingClientRect().left;
    offsetY = e.clientY - element.getBoundingClientRect().top;

    header.style.cursor = 'grabbing';
    element.style.userSelect = 'none';

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  });

  function onMouseMove(e) {
    if (!isDragging) return;

    let newX = e.clientX - offsetX;
    let newY = e.clientY - offsetY;

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const elementWidth = element.offsetWidth;
    const elementHeight = element.offsetHeight;

    newX = Math.max(0, Math.min(newX, viewportWidth - elementWidth));
    newY = Math.max(0, Math.min(newY, viewportHeight - elementHeight));

    element.style.left = `${newX}px`;
    element.style.top = `${newY}px`;
    element.style.right = 'auto';
    element.style.bottom = 'auto';
  }

  function onMouseUp() {
    if (!isDragging) return;
    isDragging = false;

    header.style.cursor = 'move';
    element.style.userSelect = 'auto';

    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
  }
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.command === "startSelection") {
    isSelectionActive = true;
    console.log("Element Highlighter: Selection ACTIVATED via extension icon click");

    if (highlightedElement && !isExtensionPopup(highlightedElement) && document.body.contains(highlightedElement)) {
        highlightedElement.style.outline = originalOutline;
    }
    highlightedElement = null;
    originalOutline = null;

    const existingInfoPopup = document.getElementById('element-highlighter-popup');
    if (existingInfoPopup) {
        existingInfoPopup.remove();
    }
    sendResponse({ status: "Selection started by icon click. Previous highlights/popups cleared." });
  }
  return true;
});

console.log('Element Highlighter content.js loaded. Selection is initially INACTIVE. Click extension icon to start.');
