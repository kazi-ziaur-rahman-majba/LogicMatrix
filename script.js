// Email Template Builder - Advanced
// Comprehensive email builder with rich text editing, sections, undo/redo, and more

const STORAGE_KEY = "emailTemplateBlocks_v2";
const TEMPLATES_KEY = "emailTemplates_v2";
const IMAGE_LIBRARY_KEY = "imageLibrary_v1";
const HISTORY_MAX_SIZE = 50;

// Block types
const BLOCK_TYPES = {
  // Predefined
  header: "header",
  hero: "hero",
  cta: "cta",
  footer: "footer",
  // Content
  title: "title",
  subtitle: "subtitle",
  paragraph: "paragraph",
  image: "image",
  button: "button",
  // Layout
  section: "section",
  twoColumn: "two-column",
};

// State
let blocks = [];
let selectedBlockId = null;
let dragState = { sourceId: null };
let history = [];
let historyIndex = -1;
let copiedBlock = null;
let imageLibrary = [];
let autoSaveTimer = null;

// DOM references
const canvasEl = document.getElementById("canvas");
const emptyStateEl = document.getElementById("emptyState");
const settingsContentEl = document.getElementById("settingsContent");
const settingsSubtitleEl = document.getElementById("settingsSubtitle");
const exportButton = document.getElementById("btnExportHtml");
const clearButton = document.getElementById("btnClear");
const undoButton = document.getElementById("btnUndo");
const redoButton = document.getElementById("btnRedo");
const codeViewButton = document.getElementById("btnCodeView");
const codeEditorView = document.getElementById("codeEditorView");
const htmlCodeEditor = document.getElementById("htmlCodeEditor");
const closeCodeViewButton = document.getElementById("btnCloseCodeView");
const applyCodeButton = document.getElementById("btnApplyCode");
const resetCodeButton = document.getElementById("btnResetCode");
const saveTemplateButton = document.getElementById("btnSaveTemplate");
const autoSaveIndicator = document.getElementById("autoSaveIndicator");
const imageLibraryModal = document.getElementById("imageLibraryModal");
const imageUploadInput = document.getElementById("imageUploadInput");
const btnUploadImage = document.getElementById("btnUploadImage");
const imageUrlInput = document.getElementById("imageUrlInput");
const btnAddUrlImage = document.getElementById("btnAddUrlImage");
const imageLibraryGrid = document.getElementById("imageLibraryGrid");
const templateSaveModal = document.getElementById("templateSaveModal");
const templateNameInput = document.getElementById("templateNameInput");
const btnConfirmSave = document.getElementById("btnConfirmSave");
const savedTemplatesList = document.getElementById("savedTemplatesList");

// Initialize
document.addEventListener("DOMContentLoaded", () => {
  loadFromStorage();
  loadImageLibrary();
  renderBlocks();
  renderSettings();
  setupEventListeners();
  updateHistoryButtons();
});

// ==================== Block Creation ====================

function createBlock(type) {
  const id = `b_${Date.now()}_${Math.random().toString(16).slice(2)}`;
  const baseStyle = {
    color: "#111827",
    fontSize: type === "title" ? 22 : type === "subtitle" ? 16 : 14,
    align: "left",
    marginTop: 6,
    marginBottom: 6,
    padding: 0,
    backgroundColor: "",
    backgroundImage: "",
  };

  const defaults = {
    title: {
      text: "Main headline for your email",
      isRichText: false,
      html: "",
    },
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
  };

  return {
    id,
    type,
    content: defaults[type] || {},
    style: { ...baseStyle },
  };
}

// ==================== History Management (Undo/Redo) ====================

function saveToHistory() {
  // Remove any history after current index (when user makes new change after undo)
  history = history.slice(0, historyIndex + 1);

  // Add current state to history
  history.push(JSON.parse(JSON.stringify(blocks)));

  // Limit history size
  if (history.length > HISTORY_MAX_SIZE) {
    history.shift();
  } else {
    historyIndex++;
  }

  updateHistoryButtons();
}

function undo() {
  if (historyIndex > 0) {
    historyIndex--;
    blocks = JSON.parse(JSON.stringify(history[historyIndex]));
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
    blocks = JSON.parse(JSON.stringify(history[historyIndex]));
    selectedBlockId = blocks[0]?.id || null;
    saveToStorage();
    renderBlocks();
    renderSettings();
    updateHistoryButtons();
  }
}

function updateHistoryButtons() {
  if (undoButton) {
    undoButton.disabled = historyIndex <= 0;
  }
  if (redoButton) {
    redoButton.disabled = historyIndex >= history.length - 1;
  }
}

// ==================== Storage Management ====================

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
      // Starter template with header, hero, and footer
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

    setTimeout(() => {
      autoSaveIndicator.classList.remove("show");
    }, 2000);
  }, 300);
}

// Auto-save on changes
function autoSave() {
  if (autoSaveTimer) {
    clearTimeout(autoSaveTimer);
  }
  autoSaveTimer = setTimeout(() => {
    saveToStorage();
  }, 1000);
}

// ==================== Image Library ====================

function loadImageLibrary() {
  try {
    const stored = localStorage.getItem(IMAGE_LIBRARY_KEY);
    if (stored) {
      imageLibrary = JSON.parse(stored);
    }
    renderImageLibrary();
  } catch (e) {
    console.error("Failed to load image library:", e);
    imageLibrary = [];
  }
}

function saveImageLibrary() {
  try {
    localStorage.setItem(IMAGE_LIBRARY_KEY, JSON.stringify(imageLibrary));
  } catch (e) {
    console.error("Failed to save image library:", e);
  }
}

function addImageToLibrary(src, isUrl = false) {
  const image = {
    id: `img_${Date.now()}_${Math.random().toString(16).slice(2)}`,
    src: src,
    addedAt: new Date().toISOString(),
    isUrl: isUrl,
  };
  imageLibrary.push(image);
  saveImageLibrary();
  renderImageLibrary();
  return image.id;
}

function removeImageFromLibrary(imageId) {
  imageLibrary = imageLibrary.filter((img) => img.id !== imageId);
  saveImageLibrary();
  renderImageLibrary();
}

function renderImageLibrary() {
  if (!imageLibraryGrid) return;

  imageLibraryGrid.innerHTML = "";

  if (imageLibrary.length === 0) {
    imageLibraryGrid.innerHTML =
      '<div style="text-align: center; padding: 20px; color: #6b7280;">No images in library. Upload or add images to get started.</div>';
    return;
  }

  imageLibrary.forEach((image) => {
    const item = document.createElement("div");
    item.className = "image-library-item";
    item.dataset.imageId = image.id;

    const img = document.createElement("img");
    img.src = image.src;
    img.alt = "Library image";
    img.onerror = () => {
      item.style.display = "none";
    };

    const removeBtn = document.createElement("button");
    removeBtn.className = "remove-image";
    removeBtn.textContent = "×";
    removeBtn.onclick = (e) => {
      e.stopPropagation();
      removeImageFromLibrary(image.id);
    };

    item.appendChild(img);
    item.appendChild(removeBtn);

    item.onclick = () => {
      // Use callback if available (from image upload component)
      if (window.currentImageCallback) {
        window.currentImageCallback(image.src);
        window.currentImageCallback = null;
        closeModal(imageLibraryModal);
        return;
      }

      // Otherwise, set image for selected block
      if (selectedBlockId) {
        const block = blocks.find((b) => b.id === selectedBlockId);
        if (block) {
          if (block.type === "image") {
            block.content.src = image.src;
          } else if (block.type === "header") {
            block.content.logo = image.src;
          } else if (
            block.type === "hero" ||
            block.type === "section" ||
            block.type === "two-column"
          ) {
            block.content.backgroundImage = image.src;
          }
          saveToStorage();
          renderBlocks();
          renderSettings();
        }
      }
      closeModal(imageLibraryModal);
    };

    imageLibraryGrid.appendChild(item);
  });
}

// ==================== Modal Management ====================

function openModal(modal) {
  if (modal) {
    modal.style.display = "flex";
  }
}

function closeModal(modal) {
  if (modal) {
    modal.style.display = "none";
  }
}

// ==================== Block Operations ====================

function selectBlock(id) {
  selectedBlockId = id;
  renderBlocks();
  renderSettings();
}

function deleteBlock(id) {
  const index = blocks.findIndex((b) => b.id === id);
  if (index === -1) return;

  blocks.splice(index, 1);
  if (selectedBlockId === id) {
    selectedBlockId = blocks[0]?.id || null;
  }
  saveToHistory();
  saveToStorage();
  renderBlocks();
  renderSettings();
}

function copyBlock(id) {
  const block = blocks.find((b) => b.id === id);
  if (block) {
    copiedBlock = JSON.parse(JSON.stringify(block));
    copiedBlock.id = `b_${Date.now()}_${Math.random().toString(16).slice(2)}`;
  }
}

function pasteBlock(afterId = null) {
  if (!copiedBlock) return;

  const newBlock = JSON.parse(JSON.stringify(copiedBlock));
  newBlock.id = `b_${Date.now()}_${Math.random().toString(16).slice(2)}`;

  if (afterId) {
    const index = blocks.findIndex((b) => b.id === afterId);
    if (index !== -1) {
      blocks.splice(index + 1, 0, newBlock);
    } else {
      blocks.push(newBlock);
    }
  } else {
    blocks.push(newBlock);
  }

  saveToHistory();
  saveToStorage();
  renderBlocks();
  selectBlock(newBlock.id);
}

// ==================== Rich Text Editing ====================

function createRichTextEditor(content, onChange) {
  const container = document.createElement("div");

  const toolbar = document.createElement("div");
  toolbar.className = "rich-text-toolbar";

  const editor = document.createElement("div");
  editor.className = "rich-text-editor";
  editor.contentEditable = true;
  editor.innerHTML = content.html || content.text || "";

  // Toolbar buttons
  const commands = [
    { cmd: "bold", label: "B", title: "Bold" },
    { cmd: "italic", label: "I", title: "Italic" },
    { cmd: "underline", label: "U", title: "Underline" },
    { separator: true },
    { cmd: "justifyLeft", label: "◀", title: "Align Left" },
    { cmd: "justifyCenter", label: "▣", title: "Align Center" },
    { cmd: "justifyRight", label: "▶", title: "Align Right" },
    { separator: true },
    { cmd: "foreColor", label: "A", title: "Text Color", isColor: true },
  ];

  commands.forEach((cmd) => {
    if (cmd.separator) {
      const sep = document.createElement("div");
      sep.style.width = "1px";
      sep.style.height = "20px";
      sep.style.background = "#d1d5db";
      sep.style.margin = "0 4px";
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
    const html = editor.innerHTML;
    content.html = html;
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

// ==================== Rendering ====================

function renderBlocks() {
  if (!canvasEl) return;

  canvasEl.innerHTML = "";

  if (!blocks.length) {
    if (emptyStateEl) emptyStateEl.style.display = "block";
    return;
  }

  if (emptyStateEl) emptyStateEl.style.display = "none";

  blocks.forEach((block) => {
    const card = createBlockCard(block);
    canvasEl.appendChild(card);
  });
}

function createBlockCard(block) {
  const card = document.createElement("div");
  card.className = "block-card";
  card.draggable = true;
  card.dataset.id = block.id;

  if (block.id === selectedBlockId) {
    card.classList.add("selected");
  }

  // Header
  const header = document.createElement("div");
  header.className = "block-header";

  const typeLabel = document.createElement("div");
  typeLabel.className = "block-type";
  typeLabel.textContent = block.type.toUpperCase().replace("-", " ");

  const actions = document.createElement("div");
  actions.className = "block-actions";

  const editBtn = document.createElement("button");
  editBtn.type = "button";
  editBtn.className = "block-action-btn";
  editBtn.textContent = "Edit";
  editBtn.onclick = (e) => {
    e.stopPropagation();
    selectBlock(block.id);
  };

  const copyBtn = document.createElement("button");
  copyBtn.type = "button";
  copyBtn.className = "block-action-btn";
  copyBtn.textContent = "Copy";
  copyBtn.onclick = (e) => {
    e.stopPropagation();
    copyBlock(block.id);
  };

  const deleteBtn = document.createElement("button");
  deleteBtn.type = "button";
  deleteBtn.className = "block-action-btn";
  deleteBtn.textContent = "Delete";
  deleteBtn.onclick = (e) => {
    e.stopPropagation();
    if (confirm("Delete this block?")) {
      deleteBlock(block.id);
    }
  };

  actions.appendChild(editBtn);
  actions.appendChild(copyBtn);
  actions.appendChild(deleteBtn);
  header.appendChild(typeLabel);
  header.appendChild(actions);

  // Preview
  const preview = document.createElement("div");
  preview.className = "block-preview";
  renderBlockPreview(block, preview);

  card.appendChild(header);
  card.appendChild(preview);

  card.onclick = () => selectBlock(block.id);

  // Drag & drop
  setupDragAndDrop(card, block.id);

  return card;
}

function renderBlockPreview(block, container) {
  const style = block.style || {};

  if (block.type === "title" || block.type === "subtitle") {
    const el = document.createElement("div");
    if (block.content.isRichText && block.content.html) {
      el.innerHTML = block.content.html;
    } else {
      el.textContent = block.content.text || "";
    }
    el.style.fontSize = style.fontSize + "px";
    el.style.fontWeight = block.type === "title" ? "600" : "500";
    el.style.color = style.color;
    el.style.textAlign = style.align;
    el.style.marginTop = style.marginTop + "px";
    el.style.marginBottom = style.marginBottom + "px";
    container.appendChild(el);
  } else if (block.type === "paragraph") {
    const p = document.createElement("div");
    if (block.content.isRichText && block.content.html) {
      p.innerHTML = block.content.html;
    } else {
      p.textContent = block.content.text || "";
    }
    p.style.fontSize = style.fontSize + "px";
    p.style.color = style.color;
    p.style.textAlign = style.align;
    p.style.marginTop = style.marginTop + "px";
    p.style.marginBottom = style.marginBottom + "px";
    p.style.lineHeight = "1.6";
    container.appendChild(p);
  } else if (block.type === "image") {
    container.classList.add("block-preview-image");
    const tag = document.createElement("div");
    tag.className = "block-preview-tag";
    tag.textContent = "Image";
    const info = document.createElement("div");
    info.textContent = block.content.src || "No image URL set";
    info.style.fontSize = "12px";
    info.style.color = "#4b5563";
    info.style.wordBreak = "break-all";
    container.appendChild(tag);
    container.appendChild(info);
  } else if (block.type === "button") {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = block.content.text || "Button";
    btn.style.backgroundColor = block.content.backgroundColor;
    btn.style.color = block.content.textColor;
    btn.style.borderRadius = (block.content.borderRadius || 0) + "px";
    btn.style.padding = "8px 16px";
    btn.style.border = "none";
    btn.style.cursor = "default";
    container.appendChild(btn);
  } else if (block.type === "header") {
    const headerDiv = document.createElement("div");
    headerDiv.className = "header-block";
    headerDiv.style.backgroundColor =
      block.content.backgroundColor || "#ffffff";
    headerDiv.style.padding = "16px 24px";

    const logo = block.content.logo
      ? `<img src="${block.content.logo}" alt="Logo" style="max-height: 40px;">`
      : "<span>Logo</span>";
    headerDiv.innerHTML = `<div>${logo}</div><div>Nav Links</div>`;
    container.appendChild(headerDiv);
  } else if (block.type === "hero") {
    const heroDiv = document.createElement("div");
    heroDiv.className = "hero-block";
    heroDiv.style.backgroundColor = block.content.backgroundColor || "#f3f4f6";
    heroDiv.style.backgroundImage = block.content.backgroundImage
      ? `url(${block.content.backgroundImage})`
      : "";
    heroDiv.style.padding = "48px 24px";
    heroDiv.style.textAlign = "center";
    heroDiv.innerHTML = `
      <h2>${block.content.title || "Hero Title"}</h2>
      <p>${block.content.subtitle || "Hero Subtitle"}</p>
      <button style="margin-top: 16px; padding: 10px 20px; background: #2563EB; color: white; border: none; border-radius: 4px;">
        ${block.content.buttonText || "Button"}
      </button>
    `;
    container.appendChild(heroDiv);
  } else if (block.type === "cta") {
    const ctaDiv = document.createElement("div");
    ctaDiv.className = "cta-block";
    ctaDiv.style.backgroundColor = block.content.backgroundColor || "#2563EB";
    ctaDiv.style.color = block.content.textColor || "#ffffff";
    ctaDiv.style.padding = "32px 24px";
    ctaDiv.style.textAlign = "center";
    ctaDiv.innerHTML = `
      <h3>${block.content.title || "CTA Title"}</h3>
      <p>${block.content.text || "CTA Text"}</p>
      <button style="margin-top: 16px; padding: 10px 20px; background: white; color: #2563EB; border: none; border-radius: 4px;">
        ${block.content.buttonText || "Button"}
      </button>
    `;
    container.appendChild(ctaDiv);
  } else if (block.type === "footer") {
    const footerDiv = document.createElement("div");
    footerDiv.className = "footer-block";
    footerDiv.style.backgroundColor =
      block.content.backgroundColor || "#f9fafb";
    footerDiv.style.color = block.content.textColor || "#6b7280";
    footerDiv.style.padding = "24px";
    footerDiv.style.fontSize = "12px";
    footerDiv.innerHTML = `
      <div>${block.content.contactInfo || "Contact info"}</div>
      <div style="margin-top: 12px;">
        <a href="${block.content.unsubscribeUrl || "#"}">${
      block.content.unsubscribeText || "Unsubscribe"
    }</a>
      </div>
    `;
    container.appendChild(footerDiv);
  } else if (block.type === "section") {
    const sectionDiv = document.createElement("div");
    sectionDiv.className = "section-block";
    if (block.content.backgroundColor || block.content.backgroundImage) {
      sectionDiv.classList.add("has-background");
      sectionDiv.style.backgroundColor = block.content.backgroundColor || "";
      sectionDiv.style.backgroundImage = block.content.backgroundImage
        ? `url(${block.content.backgroundImage})`
        : "";
    }
    sectionDiv.style.padding = (block.content.padding || 16) + "px";
    sectionDiv.textContent = "Section (add blocks here)";
    container.appendChild(sectionDiv);
  } else if (block.type === "two-column") {
    const twoColDiv = document.createElement("div");
    twoColDiv.className = "two-column-layout";
    if (block.content.backgroundColor || block.content.backgroundImage) {
      twoColDiv.classList.add("has-background");
      twoColDiv.style.backgroundColor = block.content.backgroundColor || "";
      twoColDiv.style.backgroundImage = block.content.backgroundImage
        ? `url(${block.content.backgroundImage})`
        : "";
    }
    twoColDiv.style.padding = (block.content.padding || 16) + "px";
    twoColDiv.style.gap = (block.content.gap || 16) + "px";
    twoColDiv.innerHTML = `
      <div class="column-block">Left Column</div>
      <div class="column-block">Right Column</div>
    `;
    container.appendChild(twoColDiv);
  }
}

// ==================== Drag & Drop ====================

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
  document.querySelectorAll(".drop-indicator").forEach((el) => {
    if (el.parentNode) el.parentNode.removeChild(el);
  });
}

function showDropIndicator(card, pointerY) {
  removeDropIndicators();
  const rect = card.getBoundingClientRect();
  const before = pointerY < rect.top + rect.height / 2;
  const indicator = document.createElement("div");
  indicator.className = "drop-indicator";
  if (before) {
    card.parentNode.insertBefore(indicator, card);
  } else {
    card.parentNode.insertBefore(indicator, card.nextSibling);
  }
}

function handleDrop(targetId, pointerY) {
  const sourceId = dragState.sourceId;
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
  if (!insertBefore && targetIndex < blocks.length) {
    newIndex = targetIndex + (sourceIndex < targetIndex ? 0 : 1);
  } else if (insertBefore && targetIndex > sourceIndex) {
    newIndex = targetIndex - 1;
  }
  blocks.splice(newIndex, 0, moved);

  removeDropIndicators();
  saveToHistory();
  saveToStorage();
  renderBlocks();
  selectBlock(moved.id);
}

// ==================== Settings Panel ====================

function renderSettings() {
  if (!settingsContentEl) return;

  const block = blocks.find((b) => b.id === selectedBlockId);
  settingsContentEl.innerHTML = "";

  if (!block) {
    if (settingsSubtitleEl) {
      settingsSubtitleEl.textContent = "Select a block to edit its properties.";
    }
    const empty = document.createElement("div");
    empty.className = "settings-empty";
    empty.textContent =
      "No block selected. Click a block in the email preview to start editing.";
    settingsContentEl.appendChild(empty);
    return;
  }

  if (settingsSubtitleEl) {
    settingsSubtitleEl.textContent = `Editing ${block.type} block`;
  }

  const style = block.style || {};

  // Content fields per block type
  if (block.type === "title" || block.type === "subtitle") {
    const richTextContainer = createRichTextEditor(block.content, () => {
      saveToStorage();
      renderBlocks();
    });
    settingsContentEl.appendChild(richTextContainer);
  } else if (block.type === "paragraph") {
    const richTextContainer = createRichTextEditor(block.content, () => {
      saveToStorage();
      renderBlocks();
    });
    settingsContentEl.appendChild(richTextContainer);
  } else if (block.type === "image") {
    settingsContentEl.appendChild(
      createImageUpload(
        "Image",
        block.content.src,
        (val) => {
          block.content.src = val || "";
          saveToStorage();
          renderBlocks();
        },
        true
      )
    );

    settingsContentEl.appendChild(
      createInput("Alt text", block.content.alt, (val) => {
        block.content.alt = val || "";
        saveToStorage();
      })
    );

    settingsContentEl.appendChild(
      createInput(
        "Width (%)",
        block.content.width,
        (val) => {
          const n = parseInt(val, 10);
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
    settingsContentEl.appendChild(
      createInput("Button text", block.content.text, (val) => {
        block.content.text = val || "";
        saveToStorage();
        renderBlocks();
      })
    );
    settingsContentEl.appendChild(
      createInput("URL", block.content.url, (val) => {
        block.content.url = val || "";
        saveToStorage();
      })
    );

    const colorRow = document.createElement("div");
    colorRow.className = "form-row";
    colorRow.appendChild(
      createColorInput("Background", block.content.backgroundColor, (val) => {
        block.content.backgroundColor = val;
        saveToStorage();
        renderBlocks();
      })
    );
    colorRow.appendChild(
      createColorInput("Text color", block.content.textColor, (val) => {
        block.content.textColor = val;
        saveToStorage();
        renderBlocks();
      })
    );
    settingsContentEl.appendChild(colorRow);

    settingsContentEl.appendChild(
      createInput(
        "Border radius (px)",
        block.content.borderRadius,
        (val) => {
          const n = parseInt(val, 10);
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
    settingsContentEl.appendChild(
      createImageUpload(
        "Logo",
        block.content.logo,
        (val) => {
          block.content.logo = val || "";
          saveToStorage();
          renderBlocks();
        },
        true
      )
    );
    settingsContentEl.appendChild(
      createColorInput(
        "Background color",
        block.content.backgroundColor,
        (val) => {
          block.content.backgroundColor = val;
          saveToStorage();
          renderBlocks();
        }
      )
    );
  } else if (block.type === "hero") {
    settingsContentEl.appendChild(
      createInput("Title", block.content.title, (val) => {
        block.content.title = val || "";
        saveToStorage();
        renderBlocks();
      })
    );
    settingsContentEl.appendChild(
      createInput("Subtitle", block.content.subtitle, (val) => {
        block.content.subtitle = val || "";
        saveToStorage();
        renderBlocks();
      })
    );
    settingsContentEl.appendChild(
      createInput("Button text", block.content.buttonText, (val) => {
        block.content.buttonText = val || "";
        saveToStorage();
        renderBlocks();
      })
    );
    settingsContentEl.appendChild(
      createInput("Button URL", block.content.buttonUrl, (val) => {
        block.content.buttonUrl = val || "";
        saveToStorage();
      })
    );
    settingsContentEl.appendChild(
      createImageUpload(
        "Background Image",
        block.content.backgroundImage,
        (val) => {
          block.content.backgroundImage = val || "";
          saveToStorage();
          renderBlocks();
        },
        false
      )
    );
    settingsContentEl.appendChild(
      createColorInput(
        "Background color",
        block.content.backgroundColor,
        (val) => {
          block.content.backgroundColor = val;
          saveToStorage();
          renderBlocks();
        }
      )
    );
  } else if (block.type === "cta") {
    settingsContentEl.appendChild(
      createInput("Title", block.content.title, (val) => {
        block.content.title = val || "";
        saveToStorage();
        renderBlocks();
      })
    );
    settingsContentEl.appendChild(
      createInput("Text", block.content.text, (val) => {
        block.content.text = val || "";
        saveToStorage();
        renderBlocks();
      })
    );
    settingsContentEl.appendChild(
      createInput("Button text", block.content.buttonText, (val) => {
        block.content.buttonText = val || "";
        saveToStorage();
        renderBlocks();
      })
    );
    settingsContentEl.appendChild(
      createInput("Button URL", block.content.buttonUrl, (val) => {
        block.content.buttonUrl = val || "";
        saveToStorage();
      })
    );
    settingsContentEl.appendChild(
      createColorInput(
        "Background color",
        block.content.backgroundColor,
        (val) => {
          block.content.backgroundColor = val;
          saveToStorage();
          renderBlocks();
        }
      )
    );
    settingsContentEl.appendChild(
      createColorInput("Text color", block.content.textColor, (val) => {
        block.content.textColor = val;
        saveToStorage();
        renderBlocks();
      })
    );
  } else if (block.type === "footer") {
    settingsContentEl.appendChild(
      createTextarea("Contact info", block.content.contactInfo, (val) => {
        block.content.contactInfo = val || "";
        saveToStorage();
        renderBlocks();
      })
    );
    settingsContentEl.appendChild(
      createInput("Unsubscribe text", block.content.unsubscribeText, (val) => {
        block.content.unsubscribeText = val || "";
        saveToStorage();
        renderBlocks();
      })
    );
    settingsContentEl.appendChild(
      createInput("Unsubscribe URL", block.content.unsubscribeUrl, (val) => {
        block.content.unsubscribeUrl = val || "";
        saveToStorage();
      })
    );
    settingsContentEl.appendChild(
      createColorInput(
        "Background color",
        block.content.backgroundColor,
        (val) => {
          block.content.backgroundColor = val;
          saveToStorage();
          renderBlocks();
        }
      )
    );
    settingsContentEl.appendChild(
      createColorInput("Text color", block.content.textColor, (val) => {
        block.content.textColor = val;
        saveToStorage();
        renderBlocks();
      })
    );
  } else if (block.type === "section" || block.type === "two-column") {
    settingsContentEl.appendChild(
      createInput(
        "Padding (px)",
        block.content.padding,
        (val) => {
          const n = parseInt(val, 10);
          if (!isNaN(n)) {
            block.content.padding = Math.max(0, n);
            saveToStorage();
            renderBlocks();
          }
        },
        { type: "number", min: 0 }
      )
    );
    settingsContentEl.appendChild(
      createImageUpload(
        "Background Image",
        block.content.backgroundImage,
        (val) => {
          block.content.backgroundImage = val || "";
          saveToStorage();
          renderBlocks();
        },
        false
      )
    );
    settingsContentEl.appendChild(
      createColorInput(
        "Background color",
        block.content.backgroundColor,
        (val) => {
          block.content.backgroundColor = val;
          saveToStorage();
          renderBlocks();
        }
      )
    );
    if (block.type === "two-column") {
      settingsContentEl.appendChild(
        createInput(
          "Gap (px)",
          block.content.gap,
          (val) => {
            const n = parseInt(val, 10);
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
  const divider = document.createElement("div");
  divider.className = "section-divider";
  settingsContentEl.appendChild(divider);

  // Shared style controls
  if (
    block.type !== "image" &&
    block.type !== "section" &&
    block.type !== "two-column" &&
    block.type !== "header" &&
    block.type !== "hero" &&
    block.type !== "cta" &&
    block.type !== "footer"
  ) {
    // Alignment
    const alignGroup = createAlignmentControl(style.align || "left", (val) => {
      block.style.align = val;
      saveToStorage();
      renderBlocks();
      renderSettings();
    });
    settingsContentEl.appendChild(alignGroup);

    // Font size and color
    const row = document.createElement("div");
    row.className = "form-row";
    row.appendChild(
      createInput(
        "Font size (px)",
        style.fontSize,
        (val) => {
          const n = parseInt(val, 10);
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
      createColorInput("Text color", style.color, (val) => {
        block.style.color = val;
        saveToStorage();
        renderBlocks();
      })
    );
    settingsContentEl.appendChild(row);
  }

  // Spacing
  const spacingRow = document.createElement("div");
  spacingRow.className = "form-row";
  spacingRow.appendChild(
    createInput(
      "Top space (px)",
      style.marginTop,
      (val) => {
        const n = parseInt(val, 10);
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
      (val) => {
        const n = parseInt(val, 10);
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

  const help = document.createElement("div");
  help.className = "help-text";
  help.textContent = "Changes are applied instantly and auto-saved.";
  settingsContentEl.appendChild(help);
}

// Helper functions for form controls
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

// Create image upload component with file upload and URL input
function createImageUpload(label, value, onChange, showLibraryButton = true) {
  const group = document.createElement("div");
  group.className = "form-group";

  const labelEl = document.createElement("label");
  labelEl.className = "form-label";
  labelEl.textContent = label;

  // Image preview container
  const previewDiv = document.createElement("div");
  previewDiv.className = "image-preview-container";
  previewDiv.style.marginTop = "8px";
  previewDiv.style.display = value ? "block" : "none";

  // Function to update preview
  const updatePreview = (imgSrc) => {
    if (imgSrc) {
      previewDiv.style.display = "block";
      previewDiv.innerHTML = "";
      const previewImg = document.createElement("img");
      previewImg.src = imgSrc;
      previewImg.style.maxWidth = "100%";
      previewImg.style.maxHeight = "150px";
      previewImg.style.borderRadius = "4px";
      previewImg.style.border = "1px solid #d1d5db";
      previewImg.style.display = "block";
      previewImg.style.margin = "0 auto";
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

  // Initialize preview if value exists
  if (value) {
    updatePreview(value);
  }

  // File upload input (hidden)
  const fileInput = document.createElement("input");
  fileInput.type = "file";
  fileInput.accept = "image/*";
  fileInput.style.display = "none";

  fileInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file");
      fileInput.value = "";
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("Image size should be less than 5MB");
      fileInput.value = "";
      return;
    }

    // Read file as data URL
    const reader = new FileReader();
    reader.onload = (event) => {
      const imageDataUrl = event.target.result;
      onChange(imageDataUrl);
      updatePreview(imageDataUrl);
      addImageToLibrary(imageDataUrl, false);
      fileInput.value = ""; // Reset input
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

  // URL input
  const urlInput = document.createElement("input");
  urlInput.type = "url";
  urlInput.className = "form-control";
  urlInput.placeholder = "Or enter image URL";
  if (value != null && value) urlInput.value = value;
  urlInput.style.marginBottom = "8px";

  // Debounced preview update for URL input
  let urlInputTimeout;
  urlInput.addEventListener("input", () => {
    clearTimeout(urlInputTimeout);
    urlInputTimeout = setTimeout(() => {
      if (urlInput.value.trim()) {
        updatePreview(urlInput.value.trim());
      } else {
        previewDiv.style.display = "none";
      }
    }, 500);
  });

  // Add URL button
  const addUrlBtn = document.createElement("button");
  addUrlBtn.type = "button";
  addUrlBtn.className = "btn btn-ghost";
  addUrlBtn.textContent = "Add from URL";
  addUrlBtn.style.width = "100%";
  addUrlBtn.style.marginBottom = "8px";
  addUrlBtn.onclick = () => {
    const url = urlInput.value.trim();
    if (url) {
      // Validate URL format
      try {
        new URL(url);
        onChange(url);
        updatePreview(url);
        addImageToLibrary(url, true);
      } catch (e) {
        alert(
          "Please enter a valid image URL (e.g., https://example.com/image.jpg)"
        );
      }
    } else {
      alert("Please enter an image URL");
    }
  };

  // Image library button (optional)
  if (showLibraryButton) {
    const libraryBtn = document.createElement("button");
    libraryBtn.type = "button";
    libraryBtn.className = "btn btn-ghost";
    libraryBtn.textContent = "Choose from Library";
    libraryBtn.style.width = "100%";
    libraryBtn.style.marginBottom = "8px";
    libraryBtn.onclick = () => {
      openModal(imageLibraryModal);
      // Store callback to use selected image
      window.currentImageCallback = (imageSrc) => {
        onChange(imageSrc);
        urlInput.value = imageSrc;
        updatePreview(imageSrc);
      };
    };
    group.appendChild(libraryBtn);
  }

  group.appendChild(labelEl);
  group.appendChild(uploadBtn);
  group.appendChild(fileInput);
  group.appendChild(urlInput);
  group.appendChild(addUrlBtn);
  group.appendChild(previewDiv);

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

  group.appendChild(labelEl);
  group.appendChild(textarea);
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

  group.appendChild(labelEl);
  group.appendChild(input);
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
    if (value === pos) btn.classList.add("active");
    btn.textContent =
      pos === "left" ? "Left" : pos === "center" ? "Center" : "Right";
    btn.addEventListener("click", () => {
      onChange(pos);
      autoSave();
    });
    alignRow.appendChild(btn);
  });

  group.appendChild(labelEl);
  group.appendChild(alignRow);
  return group;
}

// ==================== HTML Code Editor ====================

function openCodeEditor() {
  if (!codeEditorView || !htmlCodeEditor) return;

  const html = generateExportHtml();
  htmlCodeEditor.value = html;
  codeEditorView.style.display = "flex";
  canvasEl.closest(".canvas-wrap").style.display = "none";
}

function closeCodeEditor() {
  if (!codeEditorView) return;
  codeEditorView.style.display = "none";
  canvasEl.closest(".canvas-wrap").style.display = "block";
}

function applyCodeChanges() {
  if (!htmlCodeEditor) return;
  const html = htmlCodeEditor.value;
  // Parse HTML and update blocks (simplified - in production, use proper HTML parser)
  alert(
    "HTML code editing is read-only in this version. Use the visual editor to make changes."
  );
}

// ==================== Export HTML ====================

function generateExportHtml() {
  const escape = (str) => {
    const div = document.createElement("div");
    div.textContent = str ?? "";
    return div.innerHTML;
  };

  const rowsHtml = blocks
    .map((block) => {
      const s = block.style || {};
      const align = s.align || "left";
      const color = s.color || "#111827";
      const fontSize = s.fontSize || 14;
      const mt = s.marginTop ?? 6;
      const mb = s.marginBottom ?? 6;

      if (block.type === "title") {
        const content =
          block.content.isRichText && block.content.html
            ? block.content.html
            : escape(block.content.text);
        return `<tr>
  <td align="${align}" style="padding:${mt}px 20px ${mb}px 20px;">
    <h1 style="margin:0;font-size:${fontSize}px;line-height:1.3;font-weight:600;color:${color};font-family:Arial,Helvetica,sans-serif;">${content}</h1>
  </td>
</tr>`;
      }

      if (block.type === "subtitle") {
        const content =
          block.content.isRichText && block.content.html
            ? block.content.html
            : escape(block.content.text);
        return `<tr>
  <td align="${align}" style="padding:${mt}px 20px ${mb}px 20px;">
    <h2 style="margin:0;font-size:${fontSize}px;line-height:1.4;font-weight:500;color:${color};font-family:Arial,Helvetica,sans-serif;">${content}</h2>
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
            )}" alt="Logo" style="max-height:40px;width:auto;">`
          : '<span style="font-weight:600;color:#1f2937;">Logo</span>';
        const bg = block.content.backgroundColor || "#ffffff";
        return `<tr>
  <td style="background-color:${bg};padding:16px 24px;border-bottom:1px solid #e5e7eb;">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
      <tr>
        <td>${logo}</td>
        <td align="right" style="vertical-align:middle;">
          <a href="#" style="color:#3b82f6;text-decoration:none;margin-left:16px;font-size:14px;">Link 1</a>
          <a href="#" style="color:#3b82f6;text-decoration:none;margin-left:16px;font-size:14px;">Link 2</a>
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
    <a href="${btnUrl}" style="display:inline-block;background-color:#2563EB;color:#ffffff;padding:12px 24px;border-radius:6px;font-size:14px;font-weight:500;font-family:Arial,Helvetica,sans-serif;text-decoration:none;">${btnText}</a>
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
    <a href="${btnUrl}" style="display:inline-block;background-color:#ffffff;color:${bg};padding:12px 24px;border-radius:6px;font-size:14px;font-weight:500;font-family:Arial,Helvetica,sans-serif;text-decoration:none;">${btnText}</a>
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

      return "";
    })
    .join("\n");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Email template</title>
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

function exportHtmlFile() {
  const html = generateExportHtml();
  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "email-template.html";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ==================== Template Management ====================

function saveTemplate() {
  openModal(templateSaveModal);
  loadSavedTemplates();
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

    templates.reverse().forEach((template) => {
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
    const template = {
      id: `t_${Date.now()}_${Math.random().toString(16).slice(2)}`,
      name: name,
      blocks: JSON.parse(JSON.stringify(blocks)),
      date: new Date().toLocaleString(),
    };
    templates.push(template);
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

    blocks = JSON.parse(JSON.stringify(template.blocks));
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

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

// ==================== Event Listeners Setup ====================

function setupEventListeners() {
  // Sidebar buttons
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

  // Toolbar buttons
  if (exportButton) {
    exportButton.addEventListener("click", exportHtmlFile);
  }
  if (clearButton) {
    clearButton.addEventListener("click", clearTemplate);
  }
  if (undoButton) {
    undoButton.addEventListener("click", undo);
  }
  if (redoButton) {
    redoButton.addEventListener("click", redo);
  }
  if (codeViewButton) {
    codeViewButton.addEventListener("click", openCodeEditor);
  }
  if (closeCodeViewButton) {
    closeCodeViewButton.addEventListener("click", closeCodeEditor);
  }
  if (applyCodeButton) {
    applyCodeButton.addEventListener("click", applyCodeChanges);
  }
  if (resetCodeButton) {
    resetCodeButton.addEventListener("click", () => {
      if (htmlCodeEditor) {
        htmlCodeEditor.value = generateExportHtml();
      }
    });
  }
  if (saveTemplateButton) {
    saveTemplateButton.addEventListener("click", saveTemplate);
  }
  if (btnConfirmSave) {
    btnConfirmSave.addEventListener("click", confirmSaveTemplate);
  }

  // Image library
  if (btnUploadImage) {
    btnUploadImage.addEventListener("click", () => {
      if (imageUploadInput) imageUploadInput.click();
    });
  }
  if (imageUploadInput) {
    imageUploadInput.addEventListener("change", (e) => {
      const files = Array.from(e.target.files);
      files.forEach((file) => {
        if (file.type.startsWith("image/")) {
          if (file.size > 5 * 1024 * 1024) {
            alert(`Image ${file.name} is too large (max 5MB)`);
            return;
          }
          const reader = new FileReader();
          reader.onload = (event) => {
            addImageToLibrary(event.target.result, false);
          };
          reader.readAsDataURL(file);
        }
      });
    });
  }
  if (btnAddUrlImage) {
    btnAddUrlImage.addEventListener("click", () => {
      const url = imageUrlInput.value.trim();
      if (url) {
        addImageToLibrary(url, true);
        imageUrlInput.value = "";
      }
    });
  }

  // Modal close buttons
  document.querySelectorAll(".modal-close").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const modal = e.target.closest(".modal");
      if (modal) closeModal(modal);
    });
  });

  // Close modals on outside click
  document.querySelectorAll(".modal").forEach((modal) => {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        closeModal(modal);
      }
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

// Make functions globally available
window.loadTemplate = loadTemplate;
window.deleteTemplate = deleteTemplate;
