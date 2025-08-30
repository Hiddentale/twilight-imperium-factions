let currentSlide = 0;
        const slides = document.querySelectorAll('.slide');
        const totalSlides = slides.length;
        
        let currentAudio = null;
        let audioStartTimes = {};
        let isTransitioning = false;
        let audioEnabled = false;
        
        function initializeAudio() {
            let audioCount = 0;
    
            for (let i = 0; i < totalSlides; i++) {
                const audio = document.getElementById(`audio-${i}`);
                if (audio) {
                    audio.volume = 0;
                    audioStartTimes[i] = false;
            
                    audio.addEventListener('loadeddata', () => {
                        audioCount++;
                        if (audioCount === 1) {
                            audioEnabled = true;
                            console.log('Audio system enabled');
                        }
                    });
            
                    audio.addEventListener('error', (e) => {
                        console.warn(`Audio file not found: audio-${i}`, e);
                    });
                    
                    audio.addEventListener('ended', () => {
                        audioStartTimes[i] = true;
                        if (audio === currentAudio) {
                            audio.currentTime = 0;
                            audio.play().catch(e => console.warn('Audio play failed:', e));
                        }
                    });
                }
            }
    
            setTimeout(() => {
                if (!audioEnabled) {
                    console.log('No audio files found, continuing without audio');
                }
            }, 2000);
        }

        function getThirtyPercentTime(audio) {
            if (!audio.duration) return 0;
            return audio.duration * 0.3;
        }

        async function crossFadeAudio(fromAudio, toAudio, duration = 1000) {
            if (isTransitioning || !audioEnabled) return;
            isTransitioning = true;
    
            try {
                const steps = 20;
                const stepDuration = duration / steps;
                const volumeStep = 1 / steps;
                
                if (toAudio) {
                    const slideIndex = parseInt(toAudio.id.split('-')[1]);
            
                    if (!audioStartTimes[slideIndex] && toAudio.duration) {
                        toAudio.currentTime = getThirtyPercentTime(toAudio);
                    } else {
                        toAudio.currentTime = 0;
                    }
            
                    toAudio.volume = 0;
                    await toAudio.play();
                }
        
                for (let i = 0; i <= steps; i++) {
                    await new Promise(resolve => setTimeout(resolve, stepDuration));
            
                    if (fromAudio) {
                        fromAudio.volume = Math.max(0, 0.3 - (i * volumeStep));
                    }
            
                    if (toAudio) {
                        toAudio.volume = Math.min(0.3, i * volumeStep);
                    }
                }
        
                if (fromAudio) {
                    fromAudio.pause();
                    fromAudio.currentTime = 0;
                    fromAudio.volume = 0;
                }
        
            } catch (error) {
                console.warn('Audio crossfade error:', error);
            }
    
            isTransitioning = false;
        }

        function playSlideAudio(slideIndex) {
            if (!audioEnabled) return;
    
            const newAudio = document.getElementById(`audio-${slideIndex}`);
    
            if (newAudio && newAudio !== currentAudio) {
                if (newAudio.readyState < 1) {
                    newAudio.addEventListener('loadedmetadata', () => {
                        crossFadeAudio(currentAudio, newAudio);
                    }, { once: true });
                } else {
                    crossFadeAudio(currentAudio, newAudio);
                }
        
                currentAudio = newAudio;
            }
        }
