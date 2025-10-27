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
            let errorMessage = `Error: ${response.status}`;
            
            if (response.status === 400 && errorData.message && errorData.message.includes('model')) {
                errorMessage = 'Invalid model selected. Please try a different model.';
                // Reset to a default model
                modelSelect.value = 'hidream';
            }
            
            throw new Error(errorData.message || errorMessage);
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