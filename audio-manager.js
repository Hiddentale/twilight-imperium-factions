class AudioManager {
  constructor() {
    this.currentSlide = null
    this.currentAudio = null
    this.audioElements = new Map()
    this.audioEnabled = false
    this.failedAudioFiles = new Set()

    this.audioFiles = new Map([
      [0, 'music/letnev.m4a'],
      [1, 'music/sol.m4a'],
      [2, 'music/jolnar.m4a'],
      [3, 'music/l1z1x.m4a'],
      [4, 'music/xxcha.m4a'],
      [5, 'music/yin.m4a'],
      [6, 'music/yssaril.m4a'],
      [7, 'music/hacan.m4a'],
      [8, 'music/saar.m4a'],
      [9, 'music/naalu.m4a'],
      [10, 'music/sardakk.m4a'],
      [11, 'music/winnu.m4a'],
      [12, 'music/arborec.m4a'],
      [13, 'music/muaat.m4a'],
      [14, 'music/creuss.m4a'],
      [15, 'music/mentak.m4a'],
      [16, 'music/nekro.m4a']
    ])

    this.initialize()
  }

  initialize() {
    this.audioEnabled = true
    console.log('Audio system initialized')
  }

  /*
    * Loads audio for a specific slide index
    * Returns a Promise that resolves when audio is ready to play
  */

  loadAudioForSlide(slideIndex) {
    // Slide 0 (intro) has no audio
    if (slideIndex === 0) {
      return Promise.resolve()
    }

    const audioIndex = slideIndex - 1

    // Check if already failed - don't retry
    if (this.failedAudioFiles.has(audioIndex)) {
      console.warn(`Audio ${audioIndex} previously failed to load`)
      return Promise.reject(new Error('Audio file previously failed'))
    }

    // Check if already loaded
    if (this.audioElements.has(audioIndex)) {
      console.log(`Audio ${audioIndex} already loaded`)
      return Promise.resolve()
    }

    // Check if we have a file path for this slide
    if (!this.audioFiles.has(audioIndex)) {
      console.warn(`No audio file defined for slide ${slideIndex}`)
      return Promise.reject(new Error('No audio file defined'))
    }

    console.log(`Loading audio for slide ${slideIndex}...`)

    return new Promise((resolve, reject) => {
      // Create new audio element
      const audio = document.createElement('audio')
      audio.loop = true
      audio.volume = 0

      // Set up success handler
      const handleLoaded = () => {
        console.log(`Audio ${audioIndex} loaded successfully`)
        this.audioElements.set(audioIndex, audio)
        audio.removeEventListener('loadeddata', handleLoaded)
        audio.removeEventListener('error', handleError)
        resolve()
      }

      // Set up error handler
      const handleError = (e) => {
        console.error(`Failed to load audio ${audioIndex}:`, e)
        this.failedAudioFiles.add(audioIndex)
        audio.removeEventListener('loadeddata', handleLoaded)
        audio.removeEventListener('error', handleError)
        reject(new Error(`Failed to load audio file`))
      }

      // Attach event listeners
      audio.addEventListener('loadeddata', handleLoaded)
      audio.addEventListener('error', handleError)

      // Set up loop behavior
      audio.addEventListener('ended', () => {
        if (audio === this.currentAudio) {
          audio.currentTime = 0
          audio.play().catch(e => {
            console.error(`Failed to loop audio-${audioIndex}:`, e)
          })
        }
      })

      // Start loading by setting the source
      const filePath = this.audioFiles.get(audioIndex)
      audio.src = filePath

      // Append to container (keeps DOM organized)
      const container = document.querySelector('.audio-container')
      if (container) {
        container.appendChild(audio)
      }

      // Trigger load
      audio.load()
    })
  }

  /**
   * Preloads audio for adjacent slides to ensure smooth transitions
   */
  preloadAdjacentSlides(currentSlideIndex) {
    const totalSlides = this.audioFiles.size + 1 // +1 for intro slide

    // Preload next slide
    if (currentSlideIndex < totalSlides - 1) {
      this.loadAudioForSlide(currentSlideIndex + 1)
        .catch(e => console.warn(`Preload failed for slide ${currentSlideIndex + 1}`))
    }

    // Preload previous slide
    if (currentSlideIndex > 1) { // Skip intro (0) and first faction (1)
      this.loadAudioForSlide(currentSlideIndex - 1)
        .catch(e => console.warn(`Preload failed for slide ${currentSlideIndex - 1}`))
    }
  }

  async playSlideAudio(slideIndex) {
    if (!this.audioEnabled) return

    if (slideIndex === 0) {
      if (this.currentAudio) {
        this.currentAudio.pause()
        this.currentAudio.volume = 0
        this.currentAudio = null
      }
      return
    }

    const audioIndex = slideIndex - 1

    if (this.failedAudioFiles.has(audioIndex)) {
      console.warn(`Skipping playback for slide ${audioIndex} - audio file failed to load`)
      if (this.currentAudio) {
        this.currentAudio.pause()
        this.currentAudio.volume = 0
        this.currentAudio = null
      }
      return
    }

    try {
      await this.loadAudioForSlide(slideIndex)
    } catch (e) {
      console.error(`Could not load audio for slide ${slideIndex}:`, e)
      return
    }

    this.audioElements.forEach(audio => {
      audio.pause()
      audio.currentTime = 0
      audio.volume = 0
    })

    const newAudio = this.audioElements.get(audioIndex)
    if (!newAudio) {
      console.warn(`Audio element not found for slide ${slideIndex}`)
      return
    }

    newAudio.volume = 0.3
    newAudio.currentTime = newAudio.duration * 0.3
    newAudio.play().catch(e => console.warn('Audio play failed:', e))
    this.currentAudio = newAudio

    this.preloadAdjacentSlides(slideIndex)
  }

  getState() {
    return {
      enabled: this.audioEnabled,
      currentSlide: this.currentSlide,
      totalAudioFiles: this.audioElements.size,
      loadedAudioFiles: this.audioElements.size,
      failedAudioFiles: Array.from(this.failedAudioFiles),
      hasErrors: this.failedAudioFiles.size > 0
    }
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = AudioManager
}
