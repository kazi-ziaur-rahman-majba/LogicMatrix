// Constants
const STORAGE_KEY = "emailTemplateBlocks_v2";
const TEMPLATES_KEY = "emailTemplates_v2";
const HISTORY_MAX_SIZE = 50;

const BLOCK_TYPES = Object.freeze({
  header: "header",
  hero: "hero",
  cta: "cta",
  footer: "footer",
  title: "title",
  subtitle: "subtitle",
  paragraph: "paragraph",
  image: "image",
  button: "button",
  section: "section",
  twoColumn: "two-column",
});

// State
let blocks = [],
  selectedBlockId = null,
  dragState = { sourceId: null },
  history = [],
  historyIndex = -1,
  copiedBlock = null,
  autoSaveTimer = null;

// DOM references
const $ = (id) => document.getElementById(id);
const canvasEl = $("canvas"),
  emptyStateEl = $("emptyState"),
  settingsContentEl = $("settingsContent"),
  settingsSubtitleEl = $("settingsSubtitle"),
  clearButton = $("btnClear"),
  saveTemplateButton = $("btnSaveTemplate"),
  autoSaveIndicator = $("autoSaveIndicator"),
  templateSaveModal = $("templateSaveModal"),
  templateNameInput = $("templateNameInput"),
  btnConfirmSave = $("btnConfirmSave"),
  savedTemplatesList = $("savedTemplatesList"),
  btnSaveToDatabase = $("btnSaveToDatabase"),
  saveToDatabaseModal = $("saveToDatabaseModal"),
  databaseTemplateName = $("databaseTemplateName"),
  apiEndpoint = $("apiEndpoint"),
  btnConfirmDatabaseSave = $("btnConfirmDatabaseSave"),
  databaseSaveStatus = $("databaseSaveStatus");

// Utilities
const uniqId = (prefix = "b") =>
  `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
const deepClone = (obj) => JSON.parse(JSON.stringify(obj));
const escapeHtml = (txt) =>
  Object.assign(document.createElement("div"), { textContent: txt }).innerHTML;

// Block defaults
const blockDefaults = Object.freeze({
  title: { text: "Main headline for your email", isRichText: false, html: "" },
  subtitle: {
    text: "Optional subtitle with supporting context",
    isRichText: false,
    html: "",
  },
  paragraph: {
    text: "Write the main body of your email here. You can keep this short and scannable for better engagement.",
    isRichText: false,
    html: "",
  },
  image: {
    src: "https://via.placeholder.com/600x220/2563EB/FFFFFF?text=Email+Image",
    alt: "Email image",
    width: 100,
    height: "auto",
  },
  button: {
    text: "Call to action",
    url: "https://example.com",
    backgroundColor: "#2563EB",
    textColor: "#FFFFFF",
    borderRadius: 999,
    fontSize: 14,
  },
  header: {
    logo: "",
    logoWidth: 120,
    navLinks: [],
    socialIcons: [],
    backgroundColor: "#ffffff",
  },
  hero: {
    title: "Welcome to our newsletter",
    subtitle: "Stay updated with our latest news and offers",
    buttonText: "Get Started",
    buttonUrl: "https://example.com",
    backgroundImage: "",
    backgroundColor: "#f3f4f6",
    overlay: false,
  },
  cta: {
    title: "Ready to get started?",
    text: "Join thousands of satisfied customers today.",
    buttonText: "Sign Up Now",
    buttonUrl: "https://example.com",
    backgroundColor: "#2563EB",
    textColor: "#ffffff",
  },
  footer: {
    contactInfo: "Contact us at support@example.com",
    socialLinks: [],
    unsubscribeText: "Unsubscribe",
    unsubscribeUrl: "#",
    backgroundColor: "#f9fafb",
    textColor: "#6b7280",
  },
  section: {
    backgroundColor: "",
    backgroundImage: "",
    padding: 16,
    margin: 0,
    blocks: [],
  },
  "two-column": {
    backgroundColor: "",
    backgroundImage: "",
    padding: 16,
    gap: 16,
    leftColumn: [],
    rightColumn: [],
  },
});

// Initialize
document.addEventListener("DOMContentLoaded", () => {
  loadFromStorage();
  renderBlocks();
  renderSettings();
  setupEventListeners();
  updateHistoryButtons();
});

// Block creation
function createBlock(type) {
  const id = uniqId("b");
  const style = {
    color: "#111827",
    fontSize: type === "title" ? 22 : type === "subtitle" ? 16 : 14,
    align: "left",
    marginTop: 6,
    marginBottom: 6,
    padding: 0,
    backgroundColor: "",
    backgroundImage: "",
  };
  return {
    id,
    type,
    content: deepClone(blockDefaults[type] || {}),
    style: { ...style },
  };
}

// History management
function saveToHistory() {
  history = history.slice(0, historyIndex + 1);
  history.push(deepClone(blocks));
  if (history.length > HISTORY_MAX_SIZE) history.shift();
  else historyIndex++;
  updateHistoryButtons();
}
function undo() {
  if (historyIndex > 0) {
    historyIndex--;
    blocks = deepClone(history[historyIndex]);
    selectedBlockId = blocks[0]?.id || null;
    saveToStorage();
    renderBlocks();
    renderSettings();
    updateHistoryButtons();
  }
}
function redo() {
  if (historyIndex < history.length - 1) {
    historyIndex++;
    blocks = deepClone(history[historyIndex]);
    selectedBlockId = blocks[0]?.id || null;
    saveToStorage();
    renderBlocks();
    renderSettings();
    updateHistoryButtons();
  }
}
function updateHistoryButtons() {}

// Storage
function saveToStorage() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(blocks));
    showAutoSaveIndicator();
  } catch (e) {
    console.error("Failed to save to localStorage:", e);
  }
}
function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      // Starter template
      blocks = [
        createBlock("header"),
        createBlock("hero"),
        createBlock("footer"),
      ];
      selectedBlockId = blocks[0]?.id || null;
      saveToHistory();
      return;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      blocks = parsed;
      selectedBlockId = blocks[0]?.id || null;
      saveToHistory();
    }
  } catch (e) {
    console.error("Failed to load from localStorage:", e);
    blocks = [];
  }
}
function showAutoSaveIndicator() {
  if (!autoSaveIndicator) return;
  autoSaveIndicator.classList.add("show", "saving");
  autoSaveIndicator.textContent = "Saving...";
  setTimeout(() => {
    autoSaveIndicator.textContent = "Saved";
    autoSaveIndicator.classList.remove("saving");
    setTimeout(() => autoSaveIndicator.classList.remove("show"), 2000);
  }, 300);
}
function autoSave() {
  if (autoSaveTimer) clearTimeout(autoSaveTimer);
  autoSaveTimer = setTimeout(saveToStorage, 1000);
}

// Modal helpers
const openModal = (modal) => modal && (modal.style.display = "flex");
const closeModal = (modal) => modal && (modal.style.display = "none");

// Block operations
function selectBlock(id) {
  selectedBlockId = id;
  renderBlocks();
  renderSettings();
}
function deleteBlock(id) {
  const idx = blocks.findIndex((b) => b.id === id);
  if (idx === -1) return;
  blocks.splice(idx, 1);
  if (selectedBlockId === id) selectedBlockId = blocks[0]?.id || null;
  saveToHistory();
  saveToStorage();
  renderBlocks();
  renderSettings();
}
function copyBlock(id) {
  const blk = blocks.find((b) => b.id === id);
  if (blk) {
    copiedBlock = deepClone(blk);
    copiedBlock.id = uniqId("b");
  }
}
function pasteBlock(afterId = null) {
  if (!copiedBlock) return;
  const newBlk = deepClone(copiedBlock);
  newBlk.id = uniqId("b");
  if (afterId) {
    const idx = blocks.findIndex((b) => b.id === afterId);
    idx !== -1 ? blocks.splice(idx + 1, 0, newBlk) : blocks.push(newBlk);
  } else blocks.push(newBlk);
  saveToHistory();
  saveToStorage();
  renderBlocks();
  selectBlock(newBlk.id);
}

// Rich text editor
function createRichTextEditor(content, onChange) {
  const container = document.createElement("div");
  const toolbar = document.createElement("div");
  toolbar.className = "rich-text-toolbar";
  const editor = document.createElement("div");
  editor.className = "rich-text-editor";
  editor.contentEditable = true;
  editor.innerHTML = content.html || content.text || "";

  const commands = [
    { cmd: "bold", label: "B", title: "Bold" },
    { cmd: "italic", label: "I", title: "Italic" },
    { cmd: "underline", label: "U", title: "Underline" },
    { separator: true },
    { cmd: "justifyLeft", label: "L", title: "Align Left" },
    { cmd: "justifyCenter", label: "C", title: "Align Center" },
    { cmd: "justifyRight", label: "R", title: "Align Right" },
    { separator: true },
    { cmd: "foreColor", label: "A", title: "Text Color", isColor: true },
  ];

  commands.forEach((cmd) => {
    if (cmd.separator) {
      const sep = document.createElement("div");
      Object.assign(sep.style, {
        width: "1px",
        height: "20px",
        background: "#d1d5db",
        margin: "0 4px",
      });
      toolbar.appendChild(sep);
      return;
    }
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "toolbar-btn";
    btn.textContent = cmd.label;
    btn.title = cmd.title;

    if (cmd.isColor) {
      const colorInput = document.createElement("input");
      colorInput.type = "color";
      colorInput.value = content.color || "#111827";
      colorInput.style.display = "none";
      colorInput.onchange = (e) => {
        document.execCommand("foreColor", false, e.target.value);
        editor.focus();
        updateContent();
      };
      btn.onclick = () => colorInput.click();
      container.appendChild(colorInput);
    } else {
      btn.onclick = (e) => {
        e.preventDefault();
        document.execCommand(cmd.cmd, false, null);
        editor.focus();
        updateContent();
      };
    }
    toolbar.appendChild(btn);
  });

  function updateContent() {
    content.html = editor.innerHTML;
    content.text = editor.textContent || editor.innerText || "";
    content.isRichText = true;
    onChange();
    autoSave();
  }
  editor.oninput = updateContent;
  editor.onblur = updateContent;

  container.appendChild(toolbar);
  container.appendChild(editor);
  return container;
}

// Rendering
function renderBlocks() {
  if (!canvasEl) return;
  canvasEl.innerHTML = "";
  if (!blocks.length) {
    if (emptyStateEl) emptyStateEl.style.display = "block";
    return;
  }
  if (emptyStateEl) emptyStateEl.style.display = "none";
  blocks.forEach((block) => canvasEl.appendChild(createBlockCard(block)));
}

function createBlockCard(block) {
  const card = document.createElement("div");
  card.className = "block-card";
  card.draggable = true;
  card.dataset.id = block.id;
  if (block.id === selectedBlockId) card.classList.add("selected");

  // Header + actions
  const header = document.createElement("div");
  header.className = "block-header";
  const typeLabel = document.createElement("div");
  typeLabel.className = "block-type";
  typeLabel.textContent = block.type.toUpperCase().replace("-", " ");
  header.appendChild(typeLabel);

  const actions = document.createElement("div");
  actions.className = "block-actions";
  [["Edit", selectBlock], ["Copy", copyBlock], ["Delete"]].forEach(
    ([text, handler], idx) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "block-action-btn";
      btn.textContent = text;
      btn.onclick = (e) => {
        e.stopPropagation();
        if (text === "Delete") {
          if (confirm("Delete this block?")) deleteBlock(block.id);
        } else handler && handler(block.id);
      };
      actions.appendChild(btn);
    }
  );
  header.appendChild(actions);

  // Preview
  const preview = document.createElement("div");
  preview.className = "block-preview";
  renderBlockPreview(block, preview);

  card.appendChild(header);
  card.appendChild(preview);
  card.onclick = () => selectBlock(block.id);
  setupDragAndDrop(card, block.id);

  return card;
}

function renderBlockPreview(block, container) {
  const style = block.style || {};
  if (["title", "subtitle"].includes(block.type)) {
    const el = document.createElement("div");
    el.innerHTML =
      block.content.isRichText && block.content.html
        ? block.content.html
        : escapeHtml(block.content.text || "");
    Object.assign(el.style, {
      fontSize: style.fontSize + "px",
      fontWeight: block.type === "title" ? "600" : "500",
      color: style.color,
      textAlign: style.align,
      marginTop: style.marginTop + "px",
      marginBottom: style.marginBottom + "px",
    });
    container.appendChild(el);
  } else if (block.type === "paragraph") {
    const p = document.createElement("div");
    p.innerHTML =
      block.content.isRichText && block.content.html
        ? block.content.html
        : escapeHtml(block.content.text || "");
    Object.assign(p.style, {
      fontSize: style.fontSize + "px",
      color: style.color,
      textAlign: style.align,
      marginTop: style.marginTop + "px",
      marginBottom: style.marginBottom + "px",
      lineHeight: "1.6",
    });
    container.appendChild(p);
  } else if (block.type === "image") {
    container.classList.add("block-preview-image");
    if (block.content.src) {
      const img = document.createElement("img");
      Object.assign(img, {
        src: block.content.src,
        alt: block.content.alt || "Image",
      });
      Object.assign(img.style, {
        maxWidth: "100%",
        maxHeight: "200px",
        borderRadius: "6px",
        border: "1px solid #e2e8f0",
        display: "block",
        margin: "0 auto",
        objectFit: "contain",
      });
      img.onerror = () => {
        img.style.display = "none";
        const errorDiv = document.createElement("div");
        Object.assign(errorDiv.style, {
          padding: "12px",
          textAlign: "center",
          color: "#dc2626",
          fontSize: "12px",
        });
        errorDiv.textContent = "Failed to load image";
        container.appendChild(errorDiv);
      };
      container.appendChild(img);
      if (block.content.alt) {
        const altText = document.createElement("div");
        Object.assign(altText.style, {
          fontSize: "11px",
          color: "#6b7280",
          marginTop: "4px",
          textAlign: "center",
        });
        altText.textContent = `Alt: ${block.content.alt}`;
        container.appendChild(altText);
      }
    } else {
      const emptyDiv = document.createElement("div");
      Object.assign(emptyDiv.style, {
        padding: "24px",
        textAlign: "center",
        color: "#9ca3af",
        fontSize: "13px",
        border: "2px dashed #d1d5db",
        borderRadius: "6px",
        background: "#f9fafb",
      });
      emptyDiv.textContent =
        "No image selected. Click to edit and add an image.";
      container.appendChild(emptyDiv);
    }
  } else if (block.type === "button") {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = block.content.text || "Button";
    Object.assign(btn.style, {
      backgroundColor: block.content.backgroundColor,
      color: block.content.textColor,
      borderRadius: (block.content.borderRadius || 0) + "px",
      padding: "8px 16px",
      border: "none",
      cursor: "default",
    });
    container.appendChild(btn);
  } else if (block.type === "header") {
    const div = document.createElement("div");
    div.className = "header-block";
    Object.assign(div.style, {
      backgroundColor: block.content.backgroundColor || "#ffffff",
      padding: "16px 24px",
    });
    const logo = block.content.logo
      ? `<img src="${block.content.logo}" alt="Logo" style="max-height: 40px;">`
      : "<span>Logo</span>";
    div.innerHTML = `<div>${logo}</div><div>Nav Links</div>`;
    container.appendChild(div);
  } else if (block.type === "hero") {
    const heroDiv = document.createElement("div");
    heroDiv.className = "hero-block";
    Object.assign(heroDiv.style, {
      backgroundColor: block.content.backgroundColor || "#f3f4f6",
      backgroundImage: block.content.backgroundImage
        ? `url(${block.content.backgroundImage})`
        : "",
      padding: "48px 24px",
      textAlign: "center",
    });
    heroDiv.innerHTML = `<h2>${block.content.title || "Hero Title"}</h2>
      <p>${block.content.subtitle || "Hero Subtitle"}</p>
      <button style="margin-top: 16px; padding: 10px 20px; background: #2563EB; color: white; border: none; border-radius: 4px;">
        ${block.content.buttonText || "Button"}
      </button>`;
    container.appendChild(heroDiv);
  } else if (block.type === "cta") {
    const ctaDiv = document.createElement("div");
    ctaDiv.className = "cta-block";
    Object.assign(ctaDiv.style, {
      backgroundColor: block.content.backgroundColor || "#2563EB",
      color: block.content.textColor || "#ffffff",
      padding: "32px 24px",
      textAlign: "center",
    });
    ctaDiv.innerHTML = `<h3>${block.content.title || "CTA Title"}</h3>
      <p>${block.content.text || "CTA Text"}</p>
      <button style="margin-top: 16px; padding: 10px 20px; background: white; color: #2563EB; border: none; border-radius: 4px;">
        ${block.content.buttonText || "Button"}
      </button>`;
    container.appendChild(ctaDiv);
  } else if (block.type === "footer") {
    const div = document.createElement("div");
    div.className = "footer-block";
    Object.assign(div.style, {
      backgroundColor: block.content.backgroundColor || "#f9fafb",
      color: block.content.textColor || "#6b7280",
      padding: "24px",
      fontSize: "12px",
    });
    div.innerHTML = `<div>${block.content.contactInfo || "Contact info"}</div>
      <div style="margin-top: 12px;">
        <a href="${block.content.unsubscribeUrl || "#"}">${
      block.content.unsubscribeText || "Unsubscribe"
    }</a></div>`;
    container.appendChild(div);
  } else if (block.type === "section") {
    const div = document.createElement("div");
    div.className = "section-block";
    if (block.content.backgroundColor || block.content.backgroundImage) {
      div.classList.add("has-background");
      div.style.backgroundColor = block.content.backgroundColor || "";
      div.style.backgroundImage = block.content.backgroundImage
        ? `url(${block.content.backgroundImage})`
        : "";
    }
    div.style.padding = (block.content.padding || 16) + "px";
    div.textContent = "Section (add blocks here)";
    container.appendChild(div);
  } else if (block.type === "two-column") {
    const div = document.createElement("div");
    div.className = "two-column-layout";
    if (block.content.backgroundColor || block.content.backgroundImage) {
      div.classList.add("has-background");
      div.style.backgroundColor = block.content.backgroundColor || "";
      div.style.backgroundImage = block.content.backgroundImage
        ? `url(${block.content.backgroundImage})`
        : "";
    }
    div.style.padding = (block.content.padding || 16) + "px";
    div.style.gap = (block.content.gap || 16) + "px";
    div.innerHTML = `<div class="column-block">Left Column</div>
      <div class="column-block">Right Column</div>`;
    container.appendChild(div);
  }
}

// Drag and drop
function setupDragAndDrop(card, blockId) {
  card.addEventListener("dragstart", (e) => {
    dragState.sourceId = blockId;
    card.classList.add("dragging");
    e.dataTransfer.effectAllowed = "move";
  });
  card.addEventListener("dragend", () => {
    dragState.sourceId = null;
    card.classList.remove("dragging");
    removeDropIndicators();
  });
  card.addEventListener("dragover", (e) => {
    e.preventDefault();
    const targetId = card.dataset.id;
    if (!dragState.sourceId || dragState.sourceId === targetId) return;
    showDropIndicator(card, e.clientY);
  });
  card.addEventListener("drop", (e) => {
    e.preventDefault();
    const targetId = card.dataset.id;
    handleDrop(targetId, e.clientY);
  });
}
function removeDropIndicators() {
  document
    .querySelectorAll(".drop-indicator")
    .forEach((el) => el.parentNode && el.parentNode.removeChild(el));
}
function showDropIndicator(card, pointerY) {
  removeDropIndicators();
  const rect = card.getBoundingClientRect();
  const before = pointerY < rect.top + rect.height / 2;
  const indicator = document.createElement("div");
  indicator.className = "drop-indicator";
  before
    ? card.parentNode.insertBefore(indicator, card)
    : card.parentNode.insertBefore(indicator, card.nextSibling);
}
function handleDrop(targetId, pointerY) {
  const { sourceId } = dragState;
  if (!sourceId || sourceId === targetId) return;
  const sourceIndex = blocks.findIndex((b) => b.id === sourceId);
  const targetIndex = blocks.findIndex((b) => b.id === targetId);
  if (sourceIndex === -1 || targetIndex === -1) return;

  const targetCard = Array.from(canvasEl.children).find(
    (el) => el.dataset && el.dataset.id === targetId
  );
  let insertBefore = false;
  if (targetCard) {
    const rect = targetCard.getBoundingClientRect();
    insertBefore = pointerY < rect.top + rect.height / 2;
  }

  const [moved] = blocks.splice(sourceIndex, 1);
  let newIndex = targetIndex;
  if (!insertBefore && targetIndex < blocks.length)
    newIndex = targetIndex + (sourceIndex < targetIndex ? 0 : 1);
  else if (insertBefore && targetIndex > sourceIndex)
    newIndex = targetIndex - 1;
  blocks.splice(newIndex, 0, moved);

  removeDropIndicators();
  saveToHistory();
  saveToStorage();
  renderBlocks();
  selectBlock(moved.id);
}

// Settings panel
function renderSettings() {
  if (!settingsContentEl) return;
  const block = blocks.find((b) => b.id === selectedBlockId);
  settingsContentEl.innerHTML = "";

  if (!block) {
    settingsSubtitleEl &&
      (settingsSubtitleEl.textContent =
        "Select a block to edit its properties.");
    const empty = document.createElement("div");
    empty.className = "settings-empty";
    empty.textContent =
      "No block selected. Click a block in the email preview to start editing.";
    settingsContentEl.appendChild(empty);
    return;
  }
  settingsSubtitleEl &&
    (settingsSubtitleEl.textContent = `Editing ${block.type} block`);
  const style = block.style || {};

  // Type-specific controls
  const ctl = (fn) => settingsContentEl.appendChild(fn);
  if (
    block.type === "title" ||
    block.type === "subtitle" ||
    block.type === "paragraph"
  ) {
    ctl(
      createRichTextEditor(block.content, () => {
        saveToStorage();
        renderBlocks();
      })
    );
  } else if (block.type === "image") {
    ctl(
      createImageUpload("Image", block.content.src, (v) => {
        block.content.src = v || "";
        saveToStorage();
        renderBlocks();
      })
    );
    ctl(
      createInput("Alt text", block.content.alt, (v) => {
        block.content.alt = v || "";
        saveToStorage();
      })
    );
    ctl(
      createInput(
        "Width (%)",
        block.content.width,
        (v) => {
          const n = parseInt(v, 10);
          if (!isNaN(n)) {
            block.content.width = Math.max(10, Math.min(100, n));
            saveToStorage();
            renderBlocks();
          }
        },
        { type: "number", min: 10, max: 100 }
      )
    );
  } else if (block.type === "button") {
    ctl(
      createInput("Button text", block.content.text, (v) => {
        block.content.text = v || "";
        saveToStorage();
        renderBlocks();
      })
    );
    ctl(
      createInput("URL", block.content.url, (v) => {
        block.content.url = v || "";
        saveToStorage();
      })
    );
    const colorRow = document.createElement("div");
    colorRow.className = "form-row";
    colorRow.appendChild(
      createColorInput("Background", block.content.backgroundColor, (v) => {
        block.content.backgroundColor = v;
        saveToStorage();
        renderBlocks();
      })
    );
    colorRow.appendChild(
      createColorInput("Text color", block.content.textColor, (v) => {
        block.content.textColor = v;
        saveToStorage();
        renderBlocks();
      })
    );
    ctl(colorRow);
    ctl(
      createInput(
        "Border radius (px)",
        block.content.borderRadius,
        (v) => {
          const n = parseInt(v, 10);
          if (!isNaN(n)) {
            block.content.borderRadius = Math.max(0, Math.min(60, n));
            saveToStorage();
            renderBlocks();
          }
        },
        { type: "number", min: 0, max: 60 }
      )
    );
  } else if (block.type === "header") {
    ctl(
      createImageUpload("Logo", block.content.logo, (v) => {
        block.content.logo = v || "";
        saveToStorage();
        renderBlocks();
      })
    );
    ctl(
      createColorInput(
        "Background color",
        block.content.backgroundColor,
        (v) => {
          block.content.backgroundColor = v;
          saveToStorage();
          renderBlocks();
        }
      )
    );
  } else if (block.type === "hero") {
    ctl(
      createInput("Title", block.content.title, (v) => {
        block.content.title = v || "";
        saveToStorage();
        renderBlocks();
      })
    );
    ctl(
      createInput("Subtitle", block.content.subtitle, (v) => {
        block.content.subtitle = v || "";
        saveToStorage();
        renderBlocks();
      })
    );
    ctl(
      createInput("Button text", block.content.buttonText, (v) => {
        block.content.buttonText = v || "";
        saveToStorage();
        renderBlocks();
      })
    );
    ctl(
      createInput("Button URL", block.content.buttonUrl, (v) => {
        block.content.buttonUrl = v || "";
        saveToStorage();
      })
    );
    ctl(
      createImageUpload(
        "Background Image",
        block.content.backgroundImage,
        (v) => {
          block.content.backgroundImage = v || "";
          saveToStorage();
          renderBlocks();
        }
      )
    );
    ctl(
      createColorInput(
        "Background color",
        block.content.backgroundColor,
        (v) => {
          block.content.backgroundColor = v;
          saveToStorage();
          renderBlocks();
        }
      )
    );
  } else if (block.type === "cta") {
    ctl(
      createInput("Title", block.content.title, (v) => {
        block.content.title = v || "";
        saveToStorage();
        renderBlocks();
      })
    );
    ctl(
      createInput("Text", block.content.text, (v) => {
        block.content.text = v || "";
        saveToStorage();
        renderBlocks();
      })
    );
    ctl(
      createInput("Button text", block.content.buttonText, (v) => {
        block.content.buttonText = v || "";
        saveToStorage();
        renderBlocks();
      })
    );
    ctl(
      createInput("Button URL", block.content.buttonUrl, (v) => {
        block.content.buttonUrl = v || "";
        saveToStorage();
      })
    );
    ctl(
      createColorInput(
        "Background color",
        block.content.backgroundColor,
        (v) => {
          block.content.backgroundColor = v;
          saveToStorage();
          renderBlocks();
        }
      )
    );
    ctl(
      createColorInput("Text color", block.content.textColor, (v) => {
        block.content.textColor = v;
        saveToStorage();
        renderBlocks();
      })
    );
  } else if (block.type === "footer") {
    ctl(
      createTextarea("Contact info", block.content.contactInfo, (v) => {
        block.content.contactInfo = v || "";
        saveToStorage();
        renderBlocks();
      })
    );
    ctl(
      createInput("Unsubscribe text", block.content.unsubscribeText, (v) => {
        block.content.unsubscribeText = v || "";
        saveToStorage();
        renderBlocks();
      })
    );
    ctl(
      createInput("Unsubscribe URL", block.content.unsubscribeUrl, (v) => {
        block.content.unsubscribeUrl = v || "";
        saveToStorage();
      })
    );
    ctl(
      createColorInput(
        "Background color",
        block.content.backgroundColor,
        (v) => {
          block.content.backgroundColor = v;
          saveToStorage();
          renderBlocks();
        }
      )
    );
    ctl(
      createColorInput("Text color", block.content.textColor, (v) => {
        block.content.textColor = v;
        saveToStorage();
        renderBlocks();
      })
    );
  } else if (block.type === "section" || block.type === "two-column") {
    ctl(
      createInput(
        "Padding (px)",
        block.content.padding,
        (v) => {
          const n = parseInt(v, 10);
          if (!isNaN(n)) {
            block.content.padding = Math.max(0, n);
            saveToStorage();
            renderBlocks();
          }
        },
        { type: "number", min: 0 }
      )
    );
    ctl(
      createImageUpload(
        "Background Image",
        block.content.backgroundImage,
        (v) => {
          block.content.backgroundImage = v || "";
          saveToStorage();
          renderBlocks();
        }
      )
    );
    ctl(
      createColorInput(
        "Background color",
        block.content.backgroundColor,
        (v) => {
          block.content.backgroundColor = v;
          saveToStorage();
          renderBlocks();
        }
      )
    );
    if (block.type === "two-column") {
      ctl(
        createInput(
          "Gap (px)",
          block.content.gap,
          (v) => {
            const n = parseInt(v, 10);
            if (!isNaN(n)) {
              block.content.gap = Math.max(0, n);
              saveToStorage();
              renderBlocks();
            }
          },
          { type: "number", min: 0 }
        )
      );
    }
  }

  // Divider
  (() => {
    const div = document.createElement("div");
    div.className = "section-divider";
    settingsContentEl.appendChild(div);
  })();

  // Shared style controls
  if (
    ![
      "image",
      "section",
      "two-column",
      "header",
      "hero",
      "cta",
      "footer",
    ].includes(block.type)
  ) {
    settingsContentEl.appendChild(
      createAlignmentControl(style.align || "left", (v) => {
        block.style.align = v;
        saveToStorage();
        renderBlocks();
        renderSettings();
      })
    );
    const row = document.createElement("div");
    row.className = "form-row";
    row.appendChild(
      createInput(
        "Font size (px)",
        style.fontSize,
        (v) => {
          const n = parseInt(v, 10);
          if (!isNaN(n)) {
            block.style.fontSize = Math.max(10, Math.min(40, n));
            saveToStorage();
            renderBlocks();
          }
        },
        { type: "number", min: 10, max: 40 }
      )
    );
    row.appendChild(
      createColorInput("Text color", style.color, (v) => {
        block.style.color = v;
        saveToStorage();
        renderBlocks();
      })
    );
    settingsContentEl.appendChild(row);
  }

  // Spacing
  (() => {
    const spacingRow = document.createElement("div");
    spacingRow.className = "form-row";
    spacingRow.appendChild(
      createInput(
        "Top space (px)",
        style.marginTop,
        (v) => {
          const n = parseInt(v, 10);
          if (!isNaN(n)) {
            block.style.marginTop = Math.max(0, Math.min(80, n));
            saveToStorage();
            renderBlocks();
          }
        },
        { type: "number", min: 0, max: 80 }
      )
    );
    spacingRow.appendChild(
      createInput(
        "Bottom space (px)",
        style.marginBottom,
        (v) => {
          const n = parseInt(v, 10);
          if (!isNaN(n)) {
            block.style.marginBottom = Math.max(0, Math.min(80, n));
            saveToStorage();
            renderBlocks();
          }
        },
        { type: "number", min: 0, max: 80 }
      )
    );
    settingsContentEl.appendChild(spacingRow);
  })();

  // Help
  (() => {
    const help = document.createElement("div");
    help.className = "help-text";
    help.textContent = "Changes are applied instantly and auto-saved.";
    settingsContentEl.appendChild(help);
  })();
}

// Form helpers
function createInput(label, value, onChange, options = {}) {
  const group = document.createElement("div");
  group.className = "form-group";
  const labelEl = document.createElement("label");
  labelEl.className = "form-label";
  labelEl.textContent = label;
  const input = document.createElement("input");
  input.type = options.type || "text";
  input.className = "form-control";
  if (value != null) input.value = value;
  if (options.min != null) input.min = options.min;
  if (options.max != null) input.max = options.max;
  input.addEventListener("input", () => {
    onChange(input.value);
    autoSave();
  });
  group.appendChild(labelEl);
  group.appendChild(input);
  return group;
}
function createImageUpload(label, value, onChange) {
  const group = document.createElement("div");
  group.className = "form-group";
  const labelEl = document.createElement("label");
  labelEl.className = "form-label";
  labelEl.textContent = label;
  const previewDiv = document.createElement("div");
  previewDiv.className = "image-preview-container";
  previewDiv.style.marginTop = "8px";
  previewDiv.style.display = value ? "block" : "none";

  // Update preview helper
  const updatePreview = (imgSrc) => {
    if (imgSrc) {
      previewDiv.style.display = "block";
      previewDiv.innerHTML = "";
      const previewImg = document.createElement("img");
      Object.assign(previewImg, { src: imgSrc });
      Object.assign(previewImg.style, {
        maxWidth: "100%",
        maxHeight: "150px",
        borderRadius: "4px",
        border: "1px solid #d1d5db",
        display: "block",
        margin: "0 auto",
      });
      previewImg.onerror = () => {
        previewDiv.innerHTML =
          '<div style="color: #dc2626; font-size: 12px; padding: 8px; text-align: center;">Failed to load image</div>';
      };
      previewDiv.appendChild(previewImg);
    } else {
      previewDiv.style.display = "none";
      previewDiv.innerHTML = "";
    }
  };
  value && updatePreview(value);

  // File input
  const fileInput = document.createElement("input");
  Object.assign(fileInput, {
    type: "file",
    accept: "image/*",
  });
  fileInput.style.display = "none";
  fileInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file");
      fileInput.value = "";
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert("Image size should be less than 5MB");
      fileInput.value = "";
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const imageDataUrl = event.target.result;
      onChange(imageDataUrl);
      updatePreview(imageDataUrl);
      fileInput.value = "";
    };
    reader.onerror = () => {
      alert("Failed to read image file");
      fileInput.value = "";
    };
    reader.readAsDataURL(file);
  });

  // Upload button
  const uploadBtn = document.createElement("button");
  uploadBtn.type = "button";
  uploadBtn.className = "btn btn-primary";
  uploadBtn.textContent = "Upload Image";
  uploadBtn.style.width = "100%";
  uploadBtn.style.marginBottom = "8px";
  uploadBtn.onclick = () => fileInput.click();

  // URL input and Add button
  const urlInput = document.createElement("input");
  urlInput.type = "url";
  urlInput.className = "form-control";
  urlInput.placeholder = "Or enter image URL";
  if (value) urlInput.value = value;
  urlInput.style.marginBottom = "8px";
  let urlInputTimeout;
  urlInput.addEventListener("input", () => {
    clearTimeout(urlInputTimeout);
    urlInputTimeout = setTimeout(() => {
      urlInput.value.trim()
        ? updatePreview(urlInput.value.trim())
        : (previewDiv.style.display = "none");
    }, 500);
  });
  const addUrlBtn = document.createElement("button");
  addUrlBtn.type = "button";
  addUrlBtn.className = "btn btn-ghost";
  addUrlBtn.textContent = "Add from URL";
  addUrlBtn.style.width = "100%";
  addUrlBtn.style.marginBottom = "8px";
  addUrlBtn.onclick = () => {
    const url = urlInput.value.trim();
    if (url) {
      try {
        new URL(url);
        onChange(url);
        updatePreview(url);
      } catch {
        alert(
          "Please enter a valid image URL (e.g., https://example.com/image.jpg)"
        );
      }
    } else alert("Please enter an image URL");
  };

  group.append(labelEl, uploadBtn, fileInput, urlInput, addUrlBtn, previewDiv);
  return group;
}
function createTextarea(label, value, onChange) {
  const group = document.createElement("div");
  group.className = "form-group";
  const labelEl = document.createElement("label");
  labelEl.className = "form-label";
  labelEl.textContent = label;
  const textarea = document.createElement("textarea");
  textarea.className = "form-control";
  textarea.rows = 3;
  if (value != null) textarea.value = value;
  textarea.addEventListener("input", () => {
    onChange(textarea.value);
    autoSave();
  });
  group.append(labelEl, textarea);
  return group;
}
function createColorInput(label, value, onChange) {
  const group = document.createElement("div");
  group.className = "form-group";
  const labelEl = document.createElement("label");
  labelEl.className = "form-label";
  labelEl.textContent = label;
  const input = document.createElement("input");
  input.type = "color";
  input.className = "form-control";
  input.value = value || "#111827";
  input.addEventListener("input", () => {
    onChange(input.value);
    autoSave();
  });
  group.append(labelEl, input);
  return group;
}
function createAlignmentControl(value, onChange) {
  const group = document.createElement("div");
  group.className = "form-group";
  const labelEl = document.createElement("label");
  labelEl.className = "form-label";
  labelEl.textContent = "Alignment";
  const alignRow = document.createElement("div");
  alignRow.className = "alignment-options";
  ["left", "center", "right"].forEach((pos) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "align-btn";
    pos === value && btn.classList.add("active");
    btn.textContent = pos.charAt(0).toUpperCase() + pos.slice(1);
    btn.addEventListener("click", () => {
      onChange(pos);
      autoSave();
    });
    alignRow.appendChild(btn);
  });
  group.append(labelEl, alignRow);
  return group;
}

// Export HTML - Generate fully email-safe HTML with inline styles and table-based layout
function generateExportHtml() {
  const escape = (str) => escapeHtml(str ?? "");
  const rowsHtml = blocks
    .map((block) => {
      const s = block.style || {};
      const align = s.align || "left";
      const color = s.color || "#111827";
      const fontSize = s.fontSize || 14;
      const mt = s.marginTop ?? 6,
        mb = s.marginBottom ?? 6;
      if (block.type === "title" || block.type === "subtitle") {
        const tag = block.type === "title" ? "h1" : "h2";
        const weight = block.type === "title" ? 600 : 500;
        const content =
          block.content.isRichText && block.content.html
            ? block.content.html
            : escape(block.content.text);
        return `<tr>
  <td align="${align}" style="padding:${mt}px 20px ${mb}px 20px;">
    <${tag} style="margin:0;font-size:${fontSize}px;line-height:1.3;font-weight:${weight};color:${color};font-family:Arial,Helvetica,sans-serif;">${content}</${tag}>
  </td>
</tr>`;
      }
      if (block.type === "paragraph") {
        const content =
          block.content.isRichText && block.content.html
            ? block.content.html.replace(/\n/g, "<br>")
            : escape(block.content.text).replace(/\n/g, "<br>");
        return `<tr>
  <td align="${align}" style="padding:${mt}px 20px ${mb}px 20px;">
    <p style="margin:0;font-size:${fontSize}px;line-height:1.6;color:${color};font-family:Arial,Helvetica,sans-serif;">${content}</p>
  </td>
</tr>`;
      }
      if (block.type === "image") {
        const widthPercent = block.content.width || 100;
        const src = escape(block.content.src);
        const alt = escape(block.content.alt || "");
        return `<tr>
  <td align="${align}" style="padding:${mt}px 20px ${mb}px 20px;">
    <img src="${src}" alt="${alt}" style="display:block;width:${widthPercent}%;max-width:100%;height:auto;border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic;">
  </td>
</tr>`;
      }
      if (block.type === "button") {
        const url = escape(block.content.url || "#");
        const text = escape(block.content.text || "Click");
        const bg = block.content.backgroundColor || "#2563EB";
        const tc = block.content.textColor || "#FFFFFF";
        const radius = block.content.borderRadius ?? 999;
        return `<tr>
  <td align="${align}" style="padding:${mt}px 20px ${mb}px 20px;">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td>
          <a href="${url}" style="display:inline-block;background-color:${bg};color:${tc};padding:10px 20px;border-radius:${radius}px;font-size:14px;font-weight:500;font-family:Arial,Helvetica,sans-serif;text-decoration:none;">${text}</a>
        </td>
      </tr>
    </table>
  </td>
</tr>`;
      }
      if (block.type === "header") {
        const logo = block.content.logo
          ? `<img src="${escape(
              block.content.logo
            )}" alt="Logo" style="max-height:40px;width:auto;border:0;outline:none;text-decoration:none;">`
          : '<span style="font-weight:600;color:#1f2937;font-family:Arial,Helvetica,sans-serif;">Logo</span>';
        const bg = block.content.backgroundColor || "#ffffff";
        return `<tr>
  <td style="background-color:${bg};padding:16px 24px;border-bottom:1px solid #e5e7eb;">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
      <tr>
        <td style="vertical-align:middle;">${logo}</td>
        <td align="right" style="vertical-align:middle;">
          <a href="#" style="color:#3b82f6;text-decoration:none;margin-left:16px;font-size:14px;font-family:Arial,Helvetica,sans-serif;">Link 1</a>
          <a href="#" style="color:#3b82f6;text-decoration:none;margin-left:16px;font-size:14px;font-family:Arial,Helvetica,sans-serif;">Link 2</a>
        </td>
      </tr>
    </table>
  </td>
</tr>`;
      }
      if (block.type === "hero") {
        const title = escape(block.content.title || "");
        const subtitle = escape(block.content.subtitle || "");
        const btnText = escape(block.content.buttonText || "");
        const btnUrl = escape(block.content.buttonUrl || "#");
        const bg = block.content.backgroundColor || "#f3f4f6";
        const bgImage = block.content.backgroundImage
          ? `background-image:url(${escape(
              block.content.backgroundImage
            )});background-size:cover;background-position:center;`
          : "";
        return `<tr>
  <td style="background-color:${bg};${bgImage}padding:48px 24px;text-align:center;">
    <h2 style="margin:0 0 12px 0;font-size:28px;font-weight:600;color:#111827;font-family:Arial,Helvetica,sans-serif;">${title}</h2>
    <p style="margin:0 0 20px 0;font-size:16px;color:#4b5563;font-family:Arial,Helvetica,sans-serif;">${subtitle}</p>
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;">
      <tr>
        <td>
          <a href="${btnUrl}" style="display:inline-block;background-color:#2563EB;color:#ffffff;padding:12px 24px;border-radius:6px;font-size:14px;font-weight:500;font-family:Arial,Helvetica,sans-serif;text-decoration:none;">${btnText}</a>
        </td>
      </tr>
    </table>
  </td>
</tr>`;
      }
      if (block.type === "cta") {
        const title = escape(block.content.title || "");
        const text = escape(block.content.text || "");
        const btnText = escape(block.content.buttonText || "");
        const btnUrl = escape(block.content.buttonUrl || "#");
        const bg = block.content.backgroundColor || "#2563EB";
        const tc = block.content.textColor || "#ffffff";
        return `<tr>
  <td style="background-color:${bg};padding:32px 24px;text-align:center;">
    <h3 style="margin:0 0 12px 0;font-size:22px;font-weight:600;color:${tc};font-family:Arial,Helvetica,sans-serif;">${title}</h3>
    <p style="margin:0 0 20px 0;font-size:14px;color:${tc};font-family:Arial,Helvetica,sans-serif;">${text}</p>
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;">
      <tr>
        <td>
          <a href="${btnUrl}" style="display:inline-block;background-color:#ffffff;color:${bg};padding:12px 24px;border-radius:6px;font-size:14px;font-weight:500;font-family:Arial,Helvetica,sans-serif;text-decoration:none;">${btnText}</a>
        </td>
      </tr>
    </table>
  </td>
</tr>`;
      }
      if (block.type === "footer") {
        const contact = escape(block.content.contactInfo || "");
        const unsubscribe = escape(
          block.content.unsubscribeText || "Unsubscribe"
        );
        const unsubscribeUrl = escape(block.content.unsubscribeUrl || "#");
        const bg = block.content.backgroundColor || "#f9fafb";
        const tc = block.content.textColor || "#6b7280";
        return `<tr>
  <td style="background-color:${bg};padding:24px;text-align:center;font-size:12px;color:${tc};font-family:Arial,Helvetica,sans-serif;">
    <div style="margin-bottom:8px;">${contact}</div>
    <div><a href="${unsubscribeUrl}" style="color:${tc};text-decoration:underline;">${unsubscribe}</a></div>
  </td>
</tr>`;
      }
      if (block.type === "section" || block.type === "two-column") {
        // Sections and two-column layouts are not fully implemented in export yet
        // For now, return empty or placeholder
        return "";
      }
      return "";
    })
    .filter((row) => row.trim() !== "")
    .join("\n");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Email template</title>
  <!--[if mso]>
  <style type="text/css">
    body, table, td {font-family: Arial, Helvetica, sans-serif !important;}
  </style>
  <![endif]-->
</head>
<body style="margin:0;padding:0;background-color:#f3f4f6;">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#f3f4f6;">
    <tr>
      <td align="center" style="padding:24px 12px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:600px;background-color:#ffffff;border-radius:4px;">
          <tbody>
${rowsHtml}
          </tbody>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// Save to Database functions
function openSaveToDatabaseModal() {
  if (!blocks.length) {
    alert("No blocks to save. Please add some blocks first.");
    return;
  }
  if (databaseTemplateName) {
    databaseTemplateName.value = "";
  }
  if (databaseSaveStatus) {
    databaseSaveStatus.style.display = "none";
    databaseSaveStatus.innerHTML = "";
  }
  openModal(saveToDatabaseModal);
}

async function saveToDatabase() {
  const templateName = databaseTemplateName?.value.trim();
  const endpoint = apiEndpoint?.value.trim();

  if (!templateName) {
    alert("Please enter a template name");
    return;
  }

  if (!endpoint) {
    alert("Please enter an API endpoint URL");
    return;
  }

  try {
    new URL(endpoint); // Validate URL
  } catch {
    alert("Please enter a valid API endpoint URL");
    return;
  }

  const html = generateExportHtml();
  const payload = {
    name: templateName,
    html: html,
    blocks: deepClone(blocks),
    createdAt: new Date().toISOString(),
  };

  if (databaseSaveStatus) {
    databaseSaveStatus.style.display = "block";
    databaseSaveStatus.style.background = "#dbeafe";
    databaseSaveStatus.style.color = "#1e40af";
    databaseSaveStatus.textContent = "Saving to database...";
  }

  if (btnConfirmDatabaseSave) {
    btnConfirmDatabaseSave.disabled = true;
    btnConfirmDatabaseSave.textContent = "Saving...";
  }

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json().catch(() => ({}));

    if (databaseSaveStatus) {
      databaseSaveStatus.style.background = "#d1fae5";
      databaseSaveStatus.style.color = "#065f46";
      databaseSaveStatus.textContent = `✓ Successfully saved to database! ${
        result.id ? `ID: ${result.id}` : ""
      }`;
    }

    setTimeout(() => {
      closeModal(saveToDatabaseModal);
      if (databaseTemplateName) {
        databaseTemplateName.value = "";
      }
    }, 2000);
  } catch (error) {
    console.error("Error saving to database:", error);
    if (databaseSaveStatus) {
      databaseSaveStatus.style.background = "#fee2e2";
      databaseSaveStatus.style.color = "#991b1b";
      databaseSaveStatus.textContent = `✗ Error: ${error.message}. Please check your API endpoint and try again.`;
    }
  } finally {
    if (btnConfirmDatabaseSave) {
      btnConfirmDatabaseSave.disabled = false;
      btnConfirmDatabaseSave.textContent = "Save to Database";
    }
  }
}

// Template management
function saveTemplate() {
  const name = prompt("Enter template name:");
  if (!name || !name.trim()) {
    name !== null && alert("Please enter a template name");
    return;
  }
  try {
    const templates = JSON.parse(localStorage.getItem(TEMPLATES_KEY) || "[]");
    templates.push({
      id: uniqId("t"),
      name: name.trim(),
      blocks: deepClone(blocks),
      date: new Date().toLocaleString(),
    });
    localStorage.setItem(TEMPLATES_KEY, JSON.stringify(templates));
    alert("Template saved successfully!");
  } catch (e) {
    console.error("Failed to save template:", e);
    alert("Failed to save template");
  }
}
function loadSavedTemplates() {
  if (!savedTemplatesList) return;
  try {
    const templates = JSON.parse(localStorage.getItem(TEMPLATES_KEY) || "[]");
    savedTemplatesList.innerHTML = "";
    if (templates.length === 0) {
      savedTemplatesList.innerHTML =
        '<div style="text-align: center; padding: 20px; color: #6b7280;">No saved templates yet.</div>';
      return;
    }
    templates
      .slice()
      .reverse()
      .forEach((template) => {
        const item = document.createElement("div");
        item.className = "template-item";
        item.innerHTML = `
          <div class="template-item-name">${escapeHtml(template.name)}</div>
          <div class="template-item-date">${template.date || "No date"}</div>
          <div class="template-item-actions">
            <button class="btn btn-primary" onclick="loadTemplate('${
              template.id
            }')">Load</button>
            <button class="btn btn-ghost" onclick="deleteTemplate('${
              template.id
            }')">Delete</button>
          </div>
        `;
        savedTemplatesList.appendChild(item);
      });
  } catch (e) {
    console.error("Failed to load templates:", e);
  }
}
function confirmSaveTemplate() {
  const name = templateNameInput.value.trim();
  if (!name) {
    alert("Please enter a template name");
    return;
  }
  try {
    const templates = JSON.parse(localStorage.getItem(TEMPLATES_KEY) || "[]");
    templates.push({
      id: uniqId("t"),
      name,
      blocks: deepClone(blocks),
      date: new Date().toLocaleString(),
    });
    localStorage.setItem(TEMPLATES_KEY, JSON.stringify(templates));
    templateNameInput.value = "";
    closeModal(templateSaveModal);
    alert("Template saved successfully!");
    loadSavedTemplates();
  } catch (e) {
    console.error("Failed to save template:", e);
    alert("Failed to save template");
  }
}
function loadTemplate(templateId) {
  try {
    const templates = JSON.parse(localStorage.getItem(TEMPLATES_KEY) || "[]");
    const template = templates.find((t) => t.id === templateId);
    if (!template) {
      alert("Template not found");
      return;
    }
    blocks = deepClone(template.blocks);
    selectedBlockId = blocks[0]?.id || null;
    saveToHistory();
    saveToStorage();
    renderBlocks();
    renderSettings();
    closeModal(templateSaveModal);
    alert("Template loaded successfully!");
  } catch (e) {
    console.error("Failed to load template:", e);
    alert("Failed to load template");
  }
}
function deleteTemplate(templateId) {
  if (!confirm("Delete this template?")) return;
  try {
    const templates = JSON.parse(localStorage.getItem(TEMPLATES_KEY) || "[]");
    const filtered = templates.filter((t) => t.id !== templateId);
    localStorage.setItem(TEMPLATES_KEY, JSON.stringify(filtered));
    loadSavedTemplates();
  } catch (e) {
    console.error("Failed to delete template:", e);
  }
}
function clearTemplate() {
  if (!confirm("Clear the current template? This cannot be undone.")) return;
  blocks = [];
  selectedBlockId = null;
  saveToHistory();
  saveToStorage();
  renderBlocks();
  renderSettings();
}

// Event listeners
function setupEventListeners() {
  // Sidebar block add
  document.querySelectorAll(".sidebar-block-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const type = btn.getAttribute("data-block-type");
      if (!type) return;
      const block = createBlock(type);
      blocks.push(block);
      selectedBlockId = block.id;
      saveToHistory();
      saveToStorage();
      renderBlocks();
      renderSettings();
    });
  });
  clearButton && clearButton.addEventListener("click", clearTemplate);
  saveTemplateButton &&
    saveTemplateButton.addEventListener("click", saveTemplate);
  btnConfirmSave &&
    btnConfirmSave.addEventListener("click", confirmSaveTemplate);
  btnSaveToDatabase &&
    btnSaveToDatabase.addEventListener("click", openSaveToDatabaseModal);
  btnConfirmDatabaseSave &&
    btnConfirmDatabaseSave.addEventListener("click", saveToDatabase);

  // Modal close
  document.querySelectorAll(".modal-close").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const modal = e.target.closest(".modal");
      modal && closeModal(modal);
    });
  });
  // Modal outside click
  document.querySelectorAll(".modal").forEach((modal) => {
    modal.addEventListener("click", (e) => {
      e.target === modal && closeModal(modal);
    });
  });

  // Keyboard shortcuts
  document.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
      e.preventDefault();
      undo();
    } else if (
      (e.ctrlKey || e.metaKey) &&
      (e.key === "y" || (e.key === "z" && e.shiftKey))
    ) {
      e.preventDefault();
      redo();
    } else if ((e.ctrlKey || e.metaKey) && e.key === "s") {
      e.preventDefault();
      saveTemplate();
    } else if ((e.ctrlKey || e.metaKey) && e.key === "c" && selectedBlockId) {
      const block = blocks.find((b) => b.id === selectedBlockId);
      if (block) {
        e.preventDefault();
        copyBlock(selectedBlockId);
      }
    } else if ((e.ctrlKey || e.metaKey) && e.key === "v" && copiedBlock) {
      e.preventDefault();
      pasteBlock();
    }
  });
}

// Expose some methods for template actions
window.loadTemplate = loadTemplate;
window.deleteTemplate = deleteTemplate;
