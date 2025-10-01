class AudioManager {
  constructor() {
    this.currentSlide = null
    this.currentAudio = null
    this.audioElements = new Map()
    this.audioStartTimes = new Map()
    this.audioEnabled = false
    this.isTransitioning = false 
    this.initialize()
  }
  
  initialize() {
    const slides = document.querySelectorAll('.slide')
    const totalSlides = slides.length
    let loadedCount = 0
    
    // Loop through all possible audio elements
    for (let i = 0; i < totalSlides; i++) {
      const audio = document.getElementById(`audio-${i}`)
      
      if (audio) {
        // Store the audio element in our Map
        this.audioElements.set(i, audio)
        this.audioStartTimes.set(i, false)
        
        audio.volume = 0
        
        // Event listeners - notice we use arrow functions to preserve 'this'
        audio.addEventListener('loadeddata', () => {
          loadedCount++
          if (loadedCount === 1) {
            this.audioEnabled = true
            console.log('Audio system enabled')
          }
        })
        
        audio.addEventListener('error', (e) => {
          console.warn(`Audio file not found: audio-${i}`, e)
        })
        
        // Handle looping - restart from beginning after first play
        audio.addEventListener('ended', () => {
          this.audioStartTimes.set(i, true)
          if (audio === this.currentAudio) {
            audio.currentTime = 0
            audio.play().catch(e => console.warn('Audio play failed:', e))
          }
        })
      }
    }
    
     setTimeout(() => {
        if (!this.audioEnabled) {console.log('No audio files found, continuing without audio')}
        }, 2000)
    }
  

    getThirtyPercentTime(audio) {
        if (!audio || !audio.duration) return 0
        return audio.duration * 0.3
    }
  
  async crossFade(fromAudio, toAudio, duration = 1000) {
    if (!this.audioEnabled) return
  
    if (this.abortController) {
    this.abortController.abort()
    }
    this.abortController = new AbortController()
    const signal = this.abortController.signal
  
    this.audioElements.forEach(audio => {
        if (audio !== toAudio) {
        audio.pause()
        audio.volume = 0
        }
    })
  
    this.isTransitioning = true
    
    try {
      const steps = 20
      const stepDuration = duration / steps
      const volumeStep = 0.3 / steps
      
      // Set up the new audio track
      if (toAudio) {
        // Determine starting position based on whether it's looped before
        const slideIndex = parseInt(toAudio.id.split('-')[1])
        
        if (!this.audioStartTimes.get(slideIndex) && toAudio.duration) {
          // First time playing - start at 30%
          toAudio.currentTime = this.getThirtyPercentTime(toAudio)
        } else {
          // Has looped before - start at beginning
          toAudio.currentTime = 0
        }
        
        toAudio.volume = 0
        await toAudio.play()
      }
      
      for (let i = 0; i <= steps; i++) {
        if (signal.aborted) return
      
        await new Promise(resolve => setTimeout(resolve, stepDuration))
        
        if (fromAudio) {
          fromAudio.volume = Math.max(0, 0.3 - (i * volumeStep))
        }
        
        if (toAudio) {
          toAudio.volume = Math.min(0.3, i * volumeStep)
        }
      }
      
      // Clean up old audio
      if (fromAudio) {
        fromAudio.pause()
        fromAudio.currentTime = 0
        fromAudio.volume = 0
      }
      
    } catch (error) {
      console.warn('Audio crossfade error:', error)
    } finally {
      this.isTransitioning = false
    }
  }
  
  playSlideAudio(slideIndex) {
    if (!this.audioEnabled) return
  
    const newAudio = document.getElementById(`audio-${slideIndex}`)
  
    if (!newAudio) {
        if (this.currentAudio) {
        this.currentAudio.pause()
        this.currentAudio.volume = 0
        this.currentAudio.currentTime = 0
        this.currentAudio = null
        }
        return
    }
  
    if (newAudio !== this.currentAudio) {
        if (newAudio.readyState < 1) {
        newAudio.addEventListener('loadedmetadata', () => {
            this.crossFade(this.currentAudio, newAudio)
        }, { once: true })
        } else {
        this.crossFade(this.currentAudio, newAudio)
        }
    
        this.currentAudio = newAudio
    }
    }
  
  getState() {
    return {
      enabled: this.audioEnabled,
      transitioning: this.isTransitioning,
      currentSlide: this.currentSlide,
      totalAudioFiles: this.audioElements.size
    }
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = AudioManager
}