class AudioManager {
  constructor() {
    this.currentSlide = null
    this.currentAudio = null
    this.audioElements = new Map()
    this.loadingAudio = new Map()
    this.audioEnabled = false
    this.failedAudioFiles = new Set()

    const CDN_BASE_URL = 'https://cdn.unsealed.space/music'

    this.audioFiles = new Map([
      [0, `${CDN_BASE_URL}/letnev.m4a`],
      [1, `${CDN_BASE_URL}/sol.m4a`],
      [2, `${CDN_BASE_URL}/jolnar.m4a`],
      [3, `${CDN_BASE_URL}/l1z1x.m4a`],
      [4, `${CDN_BASE_URL}/xxcha.m4a`],
      [5, `${CDN_BASE_URL}/yin.m4a`],
      [6, `${CDN_BASE_URL}/yssaril.m4a`],
      [7, `${CDN_BASE_URL}/hacan.m4a`],
      [8, `${CDN_BASE_URL}/saar.m4a`],
      [9, `${CDN_BASE_URL}/naalu.m4a`],
      [10, `${CDN_BASE_URL}/sardakk.m4a`],
      [11, `${CDN_BASE_URL}/winnu.m4a`],
      [12, `${CDN_BASE_URL}/arborec.m4a`],
      [13, `${CDN_BASE_URL}/muaat.m4a`],
      [14, `${CDN_BASE_URL}/creuss.m4a`],
      [15, `${CDN_BASE_URL}/mentak.m4a`],
      [16, `${CDN_BASE_URL}/nekro.m4a`],
      [17, `${CDN_BASE_URL}/argent.m4a`],
      [18, `${CDN_BASE_URL}/empyrean.m4a`],
      [19, `${CDN_BASE_URL}/mahact.m4a`],
    ])

    this.initialize()
  }

  initialize() {
    this.audioEnabled = true
    console.log('Audio system initialized')
  }

  loadAudioForSlide(slideIndex) {
    if (slideIndex === 0) {
      return Promise.resolve()
    }

    const audioIndex = slideIndex - 1

    if (this.failedAudioFiles.has(audioIndex)) {
      console.warn(`Audio ${audioIndex} previously failed to load`)
      return Promise.reject(new Error('Audio file previously failed'))
    }

    if (this.audioElements.has(audioIndex)) {
      console.log(`Audio ${audioIndex} already loaded`)
      return Promise.resolve()
    }

    if (this.loadingAudio.has(audioIndex)) {
      console.log('Audio ${audioIndex} already loading, reusing promise')
      return this.loadingAudio.get(audioIndex)
    }

    if (!this.audioFiles.has(audioIndex)) {
      console.warn(`No audio file defined for slide ${slideIndex}`)
      return Promise.reject(new Error('No audio file defined'))
    }

    console.log(`Loading audio for slide ${slideIndex}...`)

    const loadPromise = new Promise((resolve, reject) => {
      const audio = document.createElement('audio')
      audio.loop = true
      audio.volume = 0
      audio.preload = 'auto'

      const handleLoaded = () => {
        console.log(`Audio ${audioIndex} loaded successfully`)
        this.audioElements.set(audioIndex, audio)
        this.loadingAudio.delete(audioIndex)
        audio.removeEventListener('canplaythrough', handleLoaded)
        audio.removeEventListener('error', handleError)
        resolve()
      }

      const handleError = (e) => {
        console.error(`Failed to load audio ${audioIndex}:`, e)
        this.failedAudioFiles.add(audioIndex)
        this.loadingAudio.delete(audioIndex)
        audio.removeEventListener('canplaythrough', handleLoaded)
        audio.removeEventListener('error', handleError)
        reject(new Error(`Failed to load audio file`))
      }

      audio.addEventListener('canplaythrough', handleLoaded, { once: true })
      audio.addEventListener('error', handleError, { once: true })

      audio.addEventListener('ended', () => {
        if (audio === this.currentAudio) {
          audio.currentTime = 0
          audio.play().catch(e => {
            console.error(`Failed to loop audio-${audioIndex}:`, e)
          })
        }
      })

      audio.src = this.audioFiles.get(audioIndex)

      const container = document.querySelector('.audio-container')
      if (container) {
        container.appendChild(audio)
      }
    })
    this.loadingAudio.set(audioIndex, loadPromise)
    return loadPromise
  }

  preloadAdjacentSlides(currentSlideIndex) {
    const totalSlides = this.audioFiles.size + 1

    if (currentSlideIndex < totalSlides - 1) {
      this.loadAudioForSlide(currentSlideIndex + 1)
        .catch(e => console.warn(`Preload failed for slide ${currentSlideIndex + 1}`))
    }

    if (currentSlideIndex > 1) {
      this.loadAudioForSlide(currentSlideIndex - 1)
        .catch(e => console.warn(`Preload failed for slide ${currentSlideIndex - 1}`))
    }
  }

  async playSlideAudio(slideIndex) {
    if (!this.audioEnabled) return

    if (slideIndex === 0 || slideIndex === 21) {
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

    await new Promise(resolve => setTimeout(resolve, 1000));
    this.preloadAdjacentSlides(slideIndex)
  }

  getState() {
    return {
      enabled: this.audioEnabled,
      currentSlide: this.currentSlide,
      totalAudioFiles: this.audioElements.size,
      loadedAudioFiles: this.audioElements.size,
      loadingAudioFiles: this.loadingAudio.size,
      failedAudioFiles: Array.from(this.failedAudioFiles),
      hasErrors: this.failedAudioFiles.size > 0
    }
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = AudioManager
}
