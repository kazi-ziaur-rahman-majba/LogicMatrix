// DOM Elements
const subjectInput = document.getElementById("subjectInput");
const titleInput = document.getElementById("titleInput");
const bodyInput = document.getElementById("bodyInput");
const btnTextInput = document.getElementById("btnTextInput");
const btnLinkInput = document.getElementById("btnLinkInput");
const imageSelect = document.getElementById("imageSelect");
const templateNameInput = document.getElementById("templateName");
const saveBtn = document.getElementById("saveBtn");
const saveStatus = document.getElementById("saveStatus");
const savedTemplates = document.getElementById("savedTemplates");

// Preview Elements
const previewSubject = document.getElementById("previewSubject");
const previewTitle = document.getElementById("previewTitle");
const previewBody = document.getElementById("previewBody");
const previewBtn = document.getElementById("previewBtn");
const previewImage = document.getElementById("previewImage");

// Menu Items
const menuItems = document.querySelectorAll(".menu-item");
const contentSections = document.querySelectorAll(".content-section");

// Initialize
document.addEventListener("DOMContentLoaded", () => {
  initializeNavigation();
  initializeEventListeners();
  loadSavedTemplates();
});

// Navigation System
function initializeNavigation() {
  menuItems.forEach((item) => {
    item.addEventListener("click", (e) => {
      e.preventDefault();
      const targetSection = item.getAttribute("data-section");

      // Update active menu item
      menuItems.forEach((mi) => mi.classList.remove("active"));
      item.classList.add("active");

      // Show target section
      contentSections.forEach((section) => {
        section.classList.remove("active");
      });

      const targetElement = document.getElementById(targetSection);
      if (targetElement) {
        targetElement.classList.add("active");
      }
    });
  });
}

// Real-time Preview Updates
function initializeEventListeners() {
  // Subject Input
  subjectInput.addEventListener("input", () => {
    previewSubject.textContent = subjectInput.value || "Your Email Subject";
  });

  // Title Input
  titleInput.addEventListener("input", () => {
    previewTitle.textContent = titleInput.value || "Your Title Here";
  });

  // Body Input
  bodyInput.addEventListener("input", () => {
    const bodyText = bodyInput.value || "Your body text will appear here...";
    // Preserve line breaks and format text
    previewBody.innerHTML = bodyText.replace(/\n/g, "<br>");
  });

  // Button Text Input
  btnTextInput.addEventListener("input", () => {
    previewBtn.textContent = btnTextInput.value || "Button Text";
  });

  // Button Link Input
  btnLinkInput.addEventListener("input", () => {
    previewBtn.href = btnLinkInput.value || "#";
  });

  // Image Select
  imageSelect.addEventListener("change", () => {
    if (imageSelect.value) {
      previewImage.src = imageSelect.value;
      previewImage.style.display = "block";
    } else {
      previewImage.style.display = "none";
    }
  });

  // Save Button
  saveBtn.addEventListener("click", saveTemplate);
}

// Database Simulation (using localStorage)
function getDatabase() {
  const templates = localStorage.getItem("emailTemplates");
  return templates ? JSON.parse(templates) : [];
}

function saveToDatabase(template) {
  const templates = getDatabase();
  templates.push(template);
  localStorage.setItem("emailTemplates", JSON.stringify(templates));
}

// Save Template Function
function saveTemplate() {
  const templateName = templateNameInput.value.trim();

  if (!templateName) {
    showStatus("Please enter a template name", "error");
    return;
  }

  // Get the complete HTML structure of the email preview
  const emailPreview = document.getElementById("emailPreview");
  const emailHTML = emailPreview.innerHTML;

  // Create template object
  const template = {
    id: Date.now(),
    name: templateName,
    html: emailHTML,
    subject: subjectInput.value,
    title: titleInput.value,
    body: bodyInput.value,
    buttonText: btnTextInput.value,
    buttonLink: btnLinkInput.value,
    imageUrl: imageSelect.value,
    createdAt: new Date().toISOString(),
    timestamp: new Date().toLocaleString(),
  };

  // Save to database (localStorage)
  try {
    saveToDatabase(template);
    showStatus(`Template "${templateName}" saved successfully!`, "success");
    templateNameInput.value = "";
    loadSavedTemplates();

    // Auto-hide success message after 3 seconds
    setTimeout(() => {
      saveStatus.style.display = "none";
    }, 3000);
  } catch (error) {
    showStatus("Error saving template. Please try again.", "error");
    console.error("Save error:", error);
  }
}

// Show Status Message
function showStatus(message, type) {
  saveStatus.textContent = message;
  saveStatus.className = `save-status ${type}`;
  saveStatus.style.display = "block";
}

// Load and Display Saved Templates
function loadSavedTemplates() {
  const templates = getDatabase();

  if (templates.length === 0) {
    savedTemplates.innerHTML =
      "<p style='color: #7f8c8d;'>No saved templates yet.</p>";
    return;
  }

  let html = "<h4>📋 Saved Templates</h4>";

  templates.reverse().forEach((template) => {
    html += `
            <div class="template-item">
                <div class="template-item-info">
                    <div class="template-item-name">${escapeHtml(
                      template.name
                    )}</div>
                    <div class="template-item-date">Saved: ${
                      template.timestamp
                    }</div>
                </div>
                <div class="template-item-actions">
                    <button class="btn-view" onclick="viewTemplate(${
                      template.id
                    })">View</button>
                    <button class="btn-delete" onclick="deleteTemplate(${
                      template.id
                    })">Delete</button>
                </div>
            </div>
        `;
  });

  savedTemplates.innerHTML = html;
}

// View Template
function viewTemplate(id) {
  const templates = getDatabase();
  const template = templates.find((t) => t.id === id);

  if (!template) {
    alert("Template not found!");
    return;
  }

  // Populate form fields
  subjectInput.value = template.subject || "";
  titleInput.value = template.title || "";
  bodyInput.value = template.body || "";
  btnTextInput.value = template.buttonText || "";
  btnLinkInput.value = template.buttonLink || "";
  imageSelect.value = template.imageUrl || "";

  // Update preview
  previewSubject.textContent = template.subject || "Your Email Subject";
  previewTitle.textContent = template.title || "Your Title Here";
  previewBody.innerHTML = (
    template.body || "Your body text will appear here..."
  ).replace(/\n/g, "<br>");
  previewBtn.textContent = template.buttonText || "Button Text";
  previewBtn.href = template.buttonLink || "#";

  if (template.imageUrl) {
    previewImage.src = template.imageUrl;
    previewImage.style.display = "block";
  } else {
    previewImage.style.display = "none";
  }

  // Navigate to preview section
  const previewMenuItem = document.querySelector(
    '[data-section="preview-section"]'
  );
  if (previewMenuItem) {
    previewMenuItem.click();
  }

  showStatus(`Template "${template.name}" loaded!`, "success");
  setTimeout(() => {
    saveStatus.style.display = "none";
  }, 2000);
}

// Delete Template
function deleteTemplate(id) {
  if (!confirm("Are you sure you want to delete this template?")) {
    return;
  }

  const templates = getDatabase();
  const filteredTemplates = templates.filter((t) => t.id !== id);
  localStorage.setItem("emailTemplates", JSON.stringify(filteredTemplates));

  loadSavedTemplates();
  showStatus("Template deleted successfully!", "success");
  setTimeout(() => {
    saveStatus.style.display = "none";
  }, 2000);
}

// Utility: Escape HTML to prevent XSS
function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

// Make functions globally available for onclick handlers
window.viewTemplate = viewTemplate;
window.deleteTemplate = deleteTemplate;
