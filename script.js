// ... (existing code)

// DOM elements for new modals
const upscaleModal = document.getElementById('upscale-modal');
const upscaleTargetSizeSelect = document.getElementById('upscale-target');
const confirmUpscaleBtn = document.getElementById('confirm-upscale');
const cancelUpscaleBtn = document.getElementById('cancel-upscale');

const editModal = document.getElementById('edit-modal');
const editModeSelect = document.getElementById('edit-mode');
const editInstructionTextarea = document.getElementById('edit-instruction');
const maskUploadInput = document.getElementById('mask-upload');
const confirmEditBtn = document.getElementById('confirm-edit');
const cancelEditBtn = document.getElementById('cancel-edit');

let currentImageIndex = -1;

// ... (existing code)

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    // ... (existing event listeners)
    
    // Upscale modal controls
    confirmUpscaleBtn.addEventListener('click', () => {
        upscaleTargetSize = upscaleTargetSizeSelect.value;
        confirmUpscale();
    });
    
    cancelUpscaleBtn.addEventListener('click', () => {
        upscaleModal.classList.add('hidden');
    });
    
    // Edit modal controls
    confirmEditBtn.addEventListener('click', () => {
        editMode = editModeSelect.value;
        editInstruction = editInstructionTextarea.value;
        confirmEdit();
    });
    
    cancelEditBtn.addEventListener('click', () => {
        editModal.classList.add('hidden');
    });
    
    maskUploadInput.addEventListener('change', handleMaskUpload);
    
    // Get model traits on load
    if (apiKey) {
        getModelTraits();
    }
});