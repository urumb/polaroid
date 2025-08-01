class RomanticInstantCamera {
    constructor() {
        this.videoElement = document.getElementById('videoElement');
        this.captureCanvas = document.getElementById('captureCanvas');
        this.frameOverlay = document.getElementById('frameOverlay');
        this.captionOverlay = document.getElementById('captionOverlay');
        this.frameSelect = document.getElementById('frameSelect');
        this.captionInput = document.getElementById('captionInput');
        this.captureBtn = document.getElementById('captureBtn');
        this.gallery = document.getElementById('gallery');
        this.galleryEmpty = document.getElementById('galleryEmpty');
        this.errorMessage = document.getElementById('errorMessage');
        
        this.stream = null;
        this.photos = [];
        
        this.init();
    }
    
    async init() {
        console.log('Initializing camera app...');
        this.bindEvents();
        this.updateFrameOverlay();
        await this.initCamera();
    }
    
    async initCamera() {
        try {
            console.log('Requesting camera access...');
            
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error('Camera API not supported in this browser');
            }

            const constraints = {
                video: {
                    width: { ideal: 640, min: 320, max: 1280 },
                    height: { ideal: 640, min: 240, max: 1280 },
                    facingMode: 'user'
                },
                audio: false
            };

            this.stream = await navigator.mediaDevices.getUserMedia(constraints);
            console.log('Camera stream obtained:', this.stream);
            
            this.videoElement.srcObject = this.stream;
            
            // Wait for video to be ready and playing
            return new Promise((resolve, reject) => {
                this.videoElement.onloadedmetadata = () => {
                    console.log('Video metadata loaded');
                    this.videoElement.play()
                        .then(() => {
                            console.log('Video playing successfully');
                            this.captureBtn.disabled = false;
                            this.errorMessage.classList.add('hidden');
                            resolve();
                        })
                        .catch((error) => {
                            console.error('Error playing video:', error);
                            reject(error);
                        });
                };
                
                this.videoElement.onerror = (error) => {
                    console.error('Video error:', error);
                    reject(error);
                };
                
                // Timeout fallback
                setTimeout(() => {
                    if (this.videoElement.videoWidth === 0) {
                        reject(new Error('Video failed to load within timeout'));
                    }
                }, 10000);
            });
            
        } catch (error) {
            console.error('Camera initialization error:', error);
            this.showError(error.message);
        }
    }
    
    showError(message = 'Camera access is needed to capture photos') {
        this.errorMessage.classList.remove('hidden');
        this.errorMessage.querySelector('p').textContent = message;
        this.captureBtn.disabled = true;
        this.videoElement.style.display = 'none';
    }
    
    bindEvents() {
        this.frameSelect.addEventListener('change', () => {
            this.updateFrameOverlay();
        });
        
        this.captionInput.addEventListener('input', () => {
            this.updateCaptionOverlay();
        });
        
        this.captureBtn.addEventListener('click', () => {
            console.log('Capture button clicked');
            this.capturePhoto();
        });
        
        // Add smooth capture button feedback
        this.captureBtn.addEventListener('mousedown', () => {
            this.captureBtn.style.transform = 'scale(0.95)';
        });
        
        this.captureBtn.addEventListener('mouseup', () => {
            this.captureBtn.style.transform = '';
        });
        
        this.captureBtn.addEventListener('mouseleave', () => {
            this.captureBtn.style.transform = '';
        });
    }
    
    updateFrameOverlay() {
        const selectedFrame = this.frameSelect.value;
        this.frameOverlay.className = 'frame-overlay';
        this.frameOverlay.classList.add(selectedFrame);
        console.log('Frame updated to:', selectedFrame);
    }
    
    updateCaptionOverlay() {
        const captionText = this.captionInput.value.trim();
        this.captionOverlay.textContent = captionText;
        this.captionOverlay.style.display = captionText ? 'block' : 'none';
    }
    
    capturePhoto() {
        console.log('Starting photo capture...');
        
        if (!this.stream) {
            console.error('No camera stream available');
            alert('Camera not available. Please allow camera access and refresh the page.');
            return;
        }
        
        if (!this.videoElement || this.videoElement.videoWidth === 0 || this.videoElement.videoHeight === 0) {
            console.error('Video not ready:', {
                videoElement: !!this.videoElement,
                videoWidth: this.videoElement?.videoWidth,
                videoHeight: this.videoElement?.videoHeight,
                readyState: this.videoElement?.readyState
            });
            alert('Camera not ready. Please wait for the camera to load.');
            return;
        }
        
        try {
            // Add capture flash effect
            this.addCaptureEffect();
            
            const canvas = this.captureCanvas;
            const ctx = canvas.getContext('2d');
            
            // Set canvas size for clean square format
            canvas.width = 800;
            canvas.height = 800;
            
            console.log('Canvas dimensions set:', canvas.width, canvas.height);
            
            // Get frame colors
            const frameColors = {
                'clean-white': '#FFFFFF',
                'soft-blush': '#FFB3BA',
                'romantic-cream': '#FFFAF0'
            };
            
            const frameType = this.frameSelect.value;
            const frameColor = frameColors[frameType];
            
            // Fill background with frame color
            ctx.fillStyle = frameColor;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // Create photo area with padding
            const padding = 60;
            const photoSize = canvas.width - (padding * 2);
            
            // Draw the video frame
            ctx.drawImage(
                this.videoElement,
                padding,
                padding,
                photoSize,
                photoSize
            );
            
            console.log('Video frame drawn to canvas');
            
            // Add caption if provided
            const caption = this.captionInput.value.trim();
            if (caption) {
                this.addCaptionToCanvas(ctx, caption, canvas.width, canvas.height);
                console.log('Caption added:', caption);
            }
            
            // Convert to image and add to gallery
            const imageDataUrl = canvas.toDataURL('image/png', 0.95);
            console.log('Image data URL created, length:', imageDataUrl.length);
            
            this.addPhotoToGallery(imageDataUrl, caption);
            
            // Clear caption input
            this.captionInput.value = '';
            this.updateCaptionOverlay();
            
            console.log('Photo capture complete');
            
        } catch (error) {
            console.error('Error during photo capture:', error);
            alert('Failed to capture photo. Please try again.');
        }
    }
    
    addCaptureEffect() {
        // Create a subtle capture flash effect
        const flash = document.createElement('div');
        flash.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(247, 198, 199, 0.3);
            pointer-events: none;
            z-index: 9999;
            opacity: 0;
            transition: opacity 0.15s ease;
        `;
        
        document.body.appendChild(flash);
        
        // Trigger flash
        requestAnimationFrame(() => {
            flash.style.opacity = '1';
            setTimeout(() => {
                flash.style.opacity = '0';
                setTimeout(() => {
                    if (flash.parentNode) {
                        document.body.removeChild(flash);
                    }
                }, 150);
            }, 100);
        });
    }
    
    addCaptionToCanvas(ctx, caption, width, height) {
        ctx.save();
        
        // Set elegant font styling
        ctx.font = '28px Inter, sans-serif';
        ctx.fillStyle = '#333333';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Position caption at bottom
        const captionY = height - 40;
        
        // Add subtle text shadow
        ctx.shadowColor = 'rgba(255, 255, 255, 0.8)';
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 1;
        ctx.shadowBlur = 2;
        
        // Draw caption
        ctx.fillText(caption, width / 2, captionY);
        
        ctx.restore();
    }
    
    addPhotoToGallery(imageDataUrl, caption) {
        console.log('Adding photo to gallery...');
        
        // Remove empty state if present
        if (this.galleryEmpty && this.galleryEmpty.parentNode) {
            this.galleryEmpty.remove();
            this.galleryEmpty = null;
            console.log('Empty gallery state removed');
        }
        
        // Create photo card
        const photoCard = document.createElement('div');
        photoCard.className = 'photo-card';
        
        // Create image
        const img = document.createElement('img');
        img.src = imageDataUrl;
        img.alt = 'Romantic instant photo';
        img.className = 'photo-image';
        
        // Create caption
        const captionDiv = document.createElement('div');
        captionDiv.className = 'photo-caption';
        captionDiv.textContent = caption || '';
        
        // Create download button
        const downloadBtn = document.createElement('button');
        downloadBtn.className = 'download-button';
        downloadBtn.title = 'Download photo';
        downloadBtn.innerHTML = `
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7,10 12,15 17,10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
        `;
        
        // Add download functionality
        downloadBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.downloadPhoto(imageDataUrl, caption);
        });
        
        // Assemble card
        photoCard.appendChild(img);
        photoCard.appendChild(captionDiv);
        photoCard.appendChild(downloadBtn);
        
        // Add to gallery with smooth animation
        this.gallery.appendChild(photoCard);
        console.log('Photo card added to gallery');
        
        // Store photo data
        this.photos.push({
            imageDataUrl,
            caption,
            timestamp: new Date()
        });
        
        // Smooth scroll to new photo
        setTimeout(() => {
            photoCard.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'nearest',
                inline: 'center'
            });
        }, 300);
    }
    
    downloadPhoto(imageDataUrl, caption) {
        try {
            const link = document.createElement('a');
            const timestamp = new Date().toISOString().slice(0, 10);
            
            let filename = 'romantic-moment-' + timestamp;
            if (caption) {
                const cleanCaption = caption
                    .replace(/[^a-z0-9\s]/gi, '')
                    .replace(/\s+/g, '-')
                    .toLowerCase()
                    .slice(0, 20);
                filename = `romantic-moment-${cleanCaption}-${timestamp}`;
            }
            filename += '.png';
            
            link.download = filename;
            link.href = imageDataUrl;
            
            // Trigger download
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            console.log('Photo download triggered:', filename);
            
        } catch (error) {
            console.error('Download error:', error);
            alert('Failed to download photo');
        }
    }
    
    destroy() {
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            console.log('Camera stream stopped');
        }
    }
}

// Initialize the romantic camera app
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing app...');
    
    // Check for camera support
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.error('Camera API not supported');
        const errorMsg = document.getElementById('errorMessage');
        const captureBtn = document.getElementById('captureBtn');
        
        if (errorMsg) {
            errorMsg.classList.remove('hidden');
            errorMsg.querySelector('p').textContent = 'Camera API not supported in this browser';
        }
        if (captureBtn) {
            captureBtn.disabled = true;
        }
        return;
    }

    // Initialize the app
    const camera = new RomanticInstantCamera();
    
    // Store globally for debugging
    window.camera = camera;
    
    // Handle page lifecycle
    window.addEventListener('beforeunload', () => {
        camera.destroy();
    });
    
    // Handle page visibility changes
    document.addEventListener('visibilitychange', () => {
        if (camera.videoElement && camera.stream) {
            if (document.hidden) {
                camera.videoElement.pause();
            } else {
                camera.videoElement.play().catch(console.error);
            }
        }
    });
    
    // Add smooth loading animation
    const appContainer = document.querySelector('.app-container');
    if (appContainer) {
        appContainer.style.opacity = '0';
        appContainer.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
            appContainer.style.transition = 'all 0.6s ease';
            appContainer.style.opacity = '1';
            appContainer.style.transform = 'translateY(0)';
        }, 100);
    }
    
    console.log('App initialization complete');
});