const titleInput = document.getElementById("titleInput");
const bodyInput = document.getElementById("bodyInput");
const btnTextInput = document.getElementById("btnTextInput");
const btnLinkInput = document.getElementById("btnLinkInput");
const imageSelect = document.getElementById("imageSelect");

const previewTitle = document.getElementById("previewTitle");
const previewBody = document.getElementById("previewBody");
const previewBtn = document.getElementById("previewBtn");
const previewImage = document.getElementById("previewImage");

titleInput.addEventListener("input", () => {
    previewTitle.textContent = titleInput.value || "Title here";
});

bodyInput.addEventListener("input", () => {
    previewBody.textContent = bodyInput.value || "Body text will appear here";
});

btnTextInput.addEventListener("input", () => {
    previewBtn.textContent = btnTextInput.value || "Click me";
});

btnLinkInput.addEventListener("input", () => {
    previewBtn.href = btnLinkInput.value || "#";
});

imageSelect.addEventListener("change", () => {
    if (imageSelect.value) {
        previewImage.src = imageSelect.value;
        previewImage.style.display = "block";
    } else {
        previewImage.style.display = "none";
    }
});

document.getElementById("saveBtn").addEventListener("click", () => {
    const html = document.getElementById("emailPreview").innerHTML;

    console.log("Saving to database:", html);

    alert("Template saved! Check console output.");
});
