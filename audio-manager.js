class AudioManager {
  constructor() {
    this.currentSlide = null
    this.currentAudio = null
    this.audioElements = new Map()
    this.audioEnabled = false
    this.failedAudioFiles = new Set()
    this.initialize()
  }
  
  initialize() {
    const slides = document.querySelectorAll('.slide')
    const totalSlides = slides.length
    let loadedCount = 0
    
    for (let i = 0; i < totalSlides; i++) {
      const audio = document.getElementById(`audio-${i}`)
      
      if (audio) {
        this.audioElements.set(i, audio)
        audio.volume = 0
  
        audio.addEventListener('loadeddata', () => {
          loadedCount++
          if (loadedCount === 1) {
            this.audioEnabled = true
            console.log('Audio system enabled')
          }
        })
        
        audio.addEventListener('error', (e) => {
          this.failedAudioFiles.add(i)
                console.warn(`Audio file failed to load: audio-${i}`, {
                    error: e,
                    src: audio.src,
                    networkState: audio.networkState,
                    readyState: audio.readyState
                })
            })
        
        audio.addEventListener('ended', () => {
          this.audioStartTimes.set(i, true)
          if (audio === this.currentAudio) {
            audio.currentTime = 0
            audio.play().catch(e => {
                        console.error(`Failed to loop audio-${i}:`, e)
                        this.failedAudioFiles.add(i)
                    })
          }
        })
      }
    }
    
    setTimeout(() => {
      if (!this.audioEnabled) {
            console.log('No audio files found, continuing without audio')
        }
        if (this.failedAudioFiles.size > 0) {
            console.warn(`Failed to load ${this.failedAudioFiles.size} audio files:`, 
                Array.from(this.failedAudioFiles))
        }
    }, 2000)
  }
  
  
  playSlideAudio(slideIndex) {
    if (!this.audioEnabled) return

    if (this.failedAudioFiles.has(slideIndex)) {
        console.warn(`Skipping playback for slide ${slideIndex} - audio file failed to load`)
        if (this.currentAudio) {
            this.currentAudio.pause()
            this.currentAudio.volume = 0
            this.currentAudio = null
        }
        return
    }
    
    this.audioElements.forEach(audio => {
        audio.pause()
        audio.currentTime = 0
        audio.volume = 0
    })
    
    const newAudio = this.audioElements.get(slideIndex)
    if (!newAudio) return
    
    newAudio.volume = 0.3
    newAudio.currentTime = newAudio.duration * 0.3
    newAudio.play().catch(e => console.warn('Audio play failed:', e))
    this.currentAudio = newAudio
  }
  
  getState() {
    return {
      enabled: this.audioEnabled,
        transitioning: this.isTransitioning,
        currentSlide: this.currentSlide,
        totalAudioFiles: this.audioElements.size,
        failedAudioFiles: Array.from(this.failedAudioFiles),
        hasErrors: this.failedAudioFiles.size > 0
    }
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = AudioManager
}
