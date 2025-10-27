// Global variables
let apiKey = localStorage.getItem('veniceApiKey') || '';
let currentImages = [];
let currentScale = 1;
let upscaleTargetSize = '4x'; // default upscale factor
let editingMode = false;
let editMode = 'inpaint'; // default edit mode
let editMask = ''; // Base64 encoded mask for inpainting
let editInstruction = ''; // Instruction for editing
let currentImageIndex = -1;

// DOM elements
const apiKeySection = document.getElementById('api-key-section');
const mainSection = document.getElementById('main-section');
const apiKeyInput = document.getElementById('api-key');
const saveApiKeyBtn = document.getElementById('save-api-key');
const changeApiKeyBtn = document.getElementById('change-api-key');
const promptTextarea = document.getElementById('prompt');
const negativePromptTextarea = document.getElementById('negative-prompt');
const modelSelect = document.getElementById('model');
const stylePresetSelect = document.getElementById('style-preset');
const widthSlider = document.getElementById('width');
const heightSlider = document.getElementById('height');
const stepsSlider = document.getElementById('steps');
const cfgSlider = document.getElementById('cfg');
const seedInput = document.getElementById('seed');
const variantsSlider = document.getElementById('variants');
const formatSelect = document.getElementById('format');
const loraSlider = document.getElementById('lora');
const safeModeCheckbox = document.getElementById('safe-mode');
const hideWatermarkCheckbox = document.getElementById('hide-watermark');
const embedMetadataCheckbox = document.getElementById('embed-metadata');
const generateBtn = document.getElementById('generate-btn');
const imagesContainer = document.getElementById('images-container');

// Modal elements
const modal = document.getElementById('modal');
const modalImg = document.getElementById('modal-img');
const zoomInBtn = document.getElementById('zoom-in');
const zoomOutBtn = document.getElementById('zoom-out');
const resetBtn = document.getElementById('reset');
const downloadBtn = document.getElementById('download');
const closeModalBtn = document.getElementById('close-modal');

// Upscale modal elements
const upscaleModal = document.getElementById('upscale-modal');
const upscaleTargetSizeSelect = document.getElementById('upscale-target');
const confirmUpscaleBtn = document.getElementById('confirm-upscale');
const cancelUpscaleBtn = document.getElementById('cancel-upscale');

// Edit modal elements
const editModal = document.getElementById('edit-modal');
const editModeSelect = document.getElementById('edit-mode');
const editInstructionTextarea = document.getElementById('edit-instruction');
const maskUploadInput = document.getElementById('mask-upload');
const confirmEditBtn = document.getElementById('confirm-edit');
const cancelEditBtn = document.getElementById('cancel-edit');

let currentImage = '';
let currentFormat = '';
let isModalOpen = false;

// UI update functions
function updateSliderValue(slider, valueElement) {
    valueElement.textContent = slider.value;
}

// Initialize slider value displays
function initializeSliderDisplays() {
    document.getElementById('width-value').textContent = widthSlider.value;
    document.getElementById('height-value').textContent = heightSlider.value;
    document.getElementById('steps-value').textContent = stepsSlider.value;
    document.getElementById('cfg-value').textContent = cfgSlider.value;
    document.getElementById('variants-value').textContent = variantsSlider.value;
    document.getElementById('lora-value').textContent = loraSlider.value;
}

// Set up event listeners for sliders
function setupSliderListeners() {
    widthSlider.addEventListener('input', () => updateSliderValue(widthSlider, document.getElementById('width-value')));
    heightSlider.addEventListener('input', () => updateSliderValue(heightSlider, document.getElementById('height-value')));
    stepsSlider.addEventListener('input', () => updateSliderValue(stepsSlider, document.getElementById('steps-value')));
    cfgSlider.addEventListener('input', () => updateSliderValue(cfgSlider, document.getElementById('cfg-value')));
    variantsSlider.addEventListener('input', () => updateSliderValue(variantsSlider, document.getElementById('variants-value')));
    loraSlider.addEventListener('input', () => updateSliderValue(loraSlider, document.getElementById('lora-value')));
}

// Toast notification function
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const toastContent = document.getElementById('toast-content');
    
    toastContent.textContent = message;
    toast.className = `toast ${type}`;
    toast.classList.remove('hidden');
    
    setTimeout(() => {
        toast.classList.add('hidden');
    }, 3000);
}

// API key management functions
function saveApiKey() {
    const newApiKey = apiKeyInput.value.trim();
    if (newApiKey) {
        apiKey = newApiKey;
        localStorage.setItem('veniceApiKey', apiKey);
        showMainSection();
        showToast('API key saved successfully', 'success');
    } else {
        showToast('Please enter a valid API key', 'error');
    }
}

function changeApiKey() {
    apiKey = '';
    localStorage.removeItem('veniceApiKey');
    apiKeyInput.value = '';
    apiKeySection.classList.remove('hidden');
    mainSection.classList.add('hidden');
}

function showMainSection() {
    apiKeySection.classList.add('hidden');
    mainSection.classList.remove('hidden');
}

// Image generation function
async function generateImage() {
    if (!apiKey) {
        showToast('API key is required', 'error');
        return;
    }
    
    const prompt = promptTextarea.value.trim();
    if (!prompt) {
        showToast('Please enter a prompt', 'error');
        return;
    }
    
    // Get all form values
    const requestData = {
        prompt: prompt,
        negative_prompt: negativePromptTextarea.value.trim(),
        model: modelSelect.value,
        width: parseInt(widthSlider.value),
        height: parseInt(heightSlider.value),
        steps: parseInt(stepsSlider.value),
        cfg_scale: parseFloat(cfgSlider.value),
        seed: parseInt(seedInput.value) || undefined,
        variants: parseInt(variantsSlider.value),
        format: formatSelect.value,
        safe_mode: safeModeCheckbox.checked,
        hide_watermark: hideWatermarkCheckbox.checked,
        embed_exif_metadata: embedMetadataCheckbox.checked,
        lora_strength: parseInt(loraSlider.value),
    };
    
    // Only add style_preset if it's not "none"
    if (stylePresetSelect.value !== 'none') {
        requestData.style_preset = stylePresetSelect.value;
    }
    
    // Show loading state
    generateBtn.disabled = true;
    generateBtn.textContent = 'Generating...';
    
    try {
        const response = await fetch('https://api.venice.ai/api/v1/image/generate', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestData),
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            let errorMessage = '';
            
            // Handle specific Venice API error codes
            switch (response.status) {
                case 400:
                    errorMessage = 'Bad Request: ' + (errorData.message || 'Invalid parameters provided');
                    // Reset to a default model if model error
                    if (errorData.message && errorData.message.includes('model')) {
                        modelSelect.value = 'hidream';
                    }
                    break;
                case 401:
                    errorMessage = 'Unauthorized: Invalid API key';
                    break;
                case 402:
                    errorMessage = 'Payment Required: Account billing issue';
                    break;
                case 415:
                    errorMessage = 'Unsupported Media Type: Invalid content type';
                    break;
                case 429:
                    errorMessage = 'Too Many Requests: Rate limit exceeded';
                    break;
                case 500:
                    errorMessage = 'Internal Server Error: Server issue';
                    break;
                case 503:
                    errorMessage = 'Service Unavailable: API temporarily unavailable';
                    break;
                default:
                    errorMessage = `Error: ${response.status} - ${errorData.message || 'Unknown error'}`;
            }
            
            throw new Error(errorMessage);
        }
        
        const data = await response.json();
        displayImages(data.images, formatSelect.value);
        showToast(`Generated ${data.images.length} image(s)`, 'success');
        
    } catch (error) {
        console.error('Error generating image:', error);
        showToast(error.message || 'Failed to generate image', 'error');
    } finally {
        generateBtn.disabled = false;
        generateBtn.textContent = 'Generate Image';
    }
}

// Display generated images
function displayImages(images, format) {
    currentImages = images;
    imagesContainer.innerHTML = '';
    
    if (images.length === 0) {
        imagesContainer.innerHTML = '<div class="empty-state"><p>No images generated</p></div>';
        return;
    }
    
    images.forEach((image, index) => {
        const imageItem = document.createElement('div');
        imageItem.className = 'image-item';
        imageItem.innerHTML = `
            <img src="data:image/${format};base64,${image}" alt="Generated image ${index + 1}">
            <div class="image-actions">
                <button class="action-btn upscale-btn" data-index="${index}">Upscale</button>
                <button class="action-btn edit-btn" data-index="${index}">Edit</button>
            </div>
        `;
        imageItem.addEventListener('click', (e) => {
            // Don't trigger modal if clicking on action buttons
            if (!e.target.classList.contains('action-btn')) {
                openModal(image, format);
            }
        });
        imagesContainer.appendChild(imageItem);
    });
    
    // Add event listeners to action buttons
    document.querySelectorAll('.upscale-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const index = parseInt(e.target.getAttribute('data-index'));
            openUpscaleModal(index, format);
        });
    });
    
    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const index = parseInt(e.target.getAttribute('data-index'));
            openEditModal(index, format);
        });
    });
}

// Image upscaling function
async function upscaleImage(imageData, format) {
    if (!apiKey) {
        showToast('API key is required', 'error');
        return;
    }
    
    try {
        const response = await fetch('https://api.venice.ai/api/v1/image/upscale', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                image: imageData,
                scale: upscaleTargetSize,
                format: format
            }),
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        displayImages([data.image], format);
        showToast('Image upscaled successfully', 'success');
        
    } catch (error) {
        console.error('Error upscaling image:', error);
        showToast(error.message || 'Failed to upscale image', 'error');
    }
}

// Image editing function
async function editImage(imageData, format) {
    if (!apiKey) {
        showToast('API key is required', 'error');
        return;
    }
    
    if (!editMask) {
        showToast('Please upload a mask for editing', 'error');
        return;
    }
    
    try {
        const response = await fetch('https://api.venice.ai/api/v1/image/edit', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                image: imageData,
                mask: editMask,
                mode: editMode,
                instruction: editInstruction,
                format: format
            }),
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        displayImages([data.image], format);
        showToast('Image edited successfully', 'success');
        
    } catch (error) {
        console.error('Error editing image:', error);
        showToast(error.message || 'Failed to edit image', 'error');
    }
}

// Get list of models with their traits
async function getModelTraits() {
    if (!apiKey) {
        showToast('API key is required', 'error');
        return;
    }
    
    try {
        const response = await fetch('https://api.venice.ai/api/v1/models/traits', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
            },
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Available models and their traits:', data);
        
    } catch (error) {
        console.error('Error fetching model traits:', error);
        showToast(error.message || 'Failed to fetch model traits', 'error');
    }
}

// Modal functions
function openModal(image, format) {
    currentImage = image;
    currentFormat = format;
    modalImg.src = `data:image/${format};base64,${image}`;
    modalImg.style.transform = `scale(${currentScale})`;
    modal.classList.add('show');
    isModalOpen = true;
}

function closeModal() {
    modal.classList.remove('show');
    isModalOpen = false;
    currentScale = 1;
    modalImg.style.transform = `scale(${currentScale})`;
}

function zoomIn() {
    currentScale = Math.min(currentScale + 0.2, 5);
    modalImg.style.transform = `scale(${currentScale})`;
}

function zoomOut() {
    currentScale = Math.max(currentScale - 0.2, 0.2);
    modalImg.style.transform = `scale(${currentScale})`;
}

function resetView() {
    currentScale = 1;
    modalImg.style.transform = `scale(${currentScale})`;
}

function downloadImage() {
    const link = document.createElement('a');
    link.href = `data:image/${currentFormat};base64,${currentImage}`;
    link.download = `venice-generated-image.${currentFormat}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Upscale modal functions
function openUpscaleModal(index, format) {
    currentImageIndex = index;
    currentFormat = format;
    upscaleTargetSizeSelect.value = upscaleTargetSize;
    upscaleModal.classList.add('show');
    isModalOpen = true;
}

function closeUpscaleModal() {
    upscaleModal.classList.remove('show');
    isModalOpen = false;
}

function confirmUpscale() {
    const imageData = currentImages[currentImageIndex];
    upscaleImage(imageData, currentFormat);
    closeUpscaleModal();
}

// Edit modal functions
function openEditModal(index, format) {
    currentImageIndex = index;
    currentFormat = format;
    editModeSelect.value = editMode;
    editInstructionTextarea.value = editInstruction;
    editModal.classList.add('show');
    isModalOpen = true;
}

function closeEditModal() {
    editModal.classList.remove('show');
    isModalOpen = false;
}

function confirmEdit() {
    const imageData = currentImages[currentImageIndex];
    editImage(imageData, currentFormat);
    closeEditModal();
}

function handleMaskUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
        // Remove data URL prefix to get base64 data
        const base64Data = event.target.result.split(',')[1];
        editMask = base64Data;
        showToast('Mask uploaded successfully', 'success');
    };
    reader.readAsDataURL(file);
}

// Close modal when clicking outside of it
function handleModalBackgroundClick(e) {
    if (e.target.classList.contains('modal') || e.target.classList.contains('upscale-modal') || e.target.classList.contains('edit-modal')) {
        // Check which modal is open and close it
        if (modal.classList.contains('show')) {
            closeModal();
        } else if (upscaleModal.classList.contains('show')) {
            closeUpscaleModal();
        } else if (editModal.classList.contains('show')) {
            closeEditModal();
        }
    }
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    // Check if API key exists in localStorage
    if (apiKey) {
        showMainSection();
    } else {
        apiKeySection.classList.remove('hidden');
        mainSection.classList.add('hidden');
    }
    
    // Ensure all modals are hidden initially
    modal.classList.remove('show');
    upscaleModal.classList.remove('show');
    editModal.classList.remove('show');
    
    // Initialize slider displays
    initializeSliderDisplays();
    
    // Set up slider listeners
    setupSliderListeners();
    
    // API key management
    saveApiKeyBtn.addEventListener('click', saveApiKey);
    changeApiKeyBtn.addEventListener('click', changeApiKey);
    
    // Generate image
    generateBtn.addEventListener('click', generateImage);
    
    // Modal controls
    zoomInBtn.addEventListener('click', zoomIn);
    zoomOutBtn.addEventListener('click', zoomOut);
    resetBtn.addEventListener('click', resetView);
    downloadBtn.addEventListener('click', downloadImage);
    closeModalBtn.addEventListener('click', closeModal);
    
    // Close modals when clicking outside
    document.addEventListener('click', handleModalBackgroundClick);
    
    // Upscale modal controls
    confirmUpscaleBtn.addEventListener('click', confirmUpscale);
    cancelUpscaleBtn.addEventListener('click', closeUpscaleModal);
    
    // Edit modal controls
    confirmEditBtn.addEventListener('click', confirmEdit);
    cancelEditBtn.addEventListener('click', closeEditModal);
    
    maskUploadInput.addEventListener('change', handleMaskUpload);
    
    // Get model traits on load
    if (apiKey) {
        getModelTraits();
    }
});