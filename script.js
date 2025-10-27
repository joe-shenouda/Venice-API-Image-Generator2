// Global variables
let apiKey = localStorage.getItem('veniceApiKey') || '';
let currentImages = [];
let currentScale = 1;

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
            throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
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
        imageItem.innerHTML = `<img src="data:image/${format};base64,${image}" alt="Generated image ${index + 1}">`;
        imageItem.addEventListener('click', () => openModal(image, format));
        imagesContainer.appendChild(imageItem);
    });
}

// Modal functions
const modal = document.getElementById('modal');
const modalImg = document.getElementById('modal-img');
const zoomInBtn = document.getElementById('zoom-in');
const zoomOutBtn = document.getElementById('zoom-out');
const resetBtn = document.getElementById('reset');
const downloadBtn = document.getElementById('download');
const closeModalBtn = document.getElementById('close-modal');
let currentImage = '';
let currentFormat = '';

function openModal(image, format) {
    currentImage = image;
    currentFormat = format;
    modalImg.src = `data:image/${format};base64,${image}`;
    modalImg.style.transform = `scale(${currentScale})`;
    modal.classList.remove('hidden');
}

function closeModal() {
    modal.classList.add('hidden');
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

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    // Check if API key exists in localStorage
    if (apiKey) {
        showMainSection();
    }
    
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
    
    // Close modal when clicking outside the image
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });
});