const AUDIO_CDN_BASE_URL = 'https://cdn.unsealed.space/music'
const PLAYBACK_VOLUME = 0.3
const SKIP_INTRO_RATIO = 0.3
const RETRY_DELAY_MS = 1000
const PRELOAD_DELAY_MS = 1000
const HISTORY_MAX_SIZE = 3

class AudioManager {
  constructor() {
    this.currentSlide = null
    this.currentAudio = null
    this.audioElements = new Map()
    this.loadingAudio = new Map()
    this.audioEnabled = false
    this.failedAudioFiles = new Set()
    this.isMobile = false
    this.userInteracted = false
    this.streamingMode = false
    this.streamingButton = null
    this.recentlyPlayedHistory = []
    this.historyMaxSize = HISTORY_MAX_SIZE

    this.audioFiles = new Map([
      [0, `${AUDIO_CDN_BASE_URL}/letnev.m4a`],
      [1, `${AUDIO_CDN_BASE_URL}/sol.m4a`],
      [2, `${AUDIO_CDN_BASE_URL}/jolnar.m4a`],
      [3, `${AUDIO_CDN_BASE_URL}/l1z1x.m4a`],
      [4, `${AUDIO_CDN_BASE_URL}/xxcha.m4a`],
      [5, `${AUDIO_CDN_BASE_URL}/yin.m4a`],
      [6, `${AUDIO_CDN_BASE_URL}/yssaril.m4a`],
      [7, `${AUDIO_CDN_BASE_URL}/hacan.m4a`],
      [8, `${AUDIO_CDN_BASE_URL}/saar.m4a`],
      [9, `${AUDIO_CDN_BASE_URL}/naalu.m4a`],
      [10, `${AUDIO_CDN_BASE_URL}/sardakk.m4a`],
      [11, `${AUDIO_CDN_BASE_URL}/winnu.m4a`],
      [12, `${AUDIO_CDN_BASE_URL}/arborec.m4a`],
      [13, `${AUDIO_CDN_BASE_URL}/muaat.m4a`],
      [14, `${AUDIO_CDN_BASE_URL}/creuss.m4a`],
      [15, `${AUDIO_CDN_BASE_URL}/mentak.m4a`],
      [16, `${AUDIO_CDN_BASE_URL}/nekro.m4a`],
      [17, `${AUDIO_CDN_BASE_URL}/argent.m4a`],
      [18, `${AUDIO_CDN_BASE_URL}/empyrean.m4a`],
      [19, `${AUDIO_CDN_BASE_URL}/mahact.m4a`],
      [20, `${AUDIO_CDN_BASE_URL}/naaz.m4a`],
      [21, `${AUDIO_CDN_BASE_URL}/nomad.m4a`],
      [22, `${AUDIO_CDN_BASE_URL}/titans.m4a`],
      [23, `${AUDIO_CDN_BASE_URL}/vuilrath.m4a`],
      [24, `${AUDIO_CDN_BASE_URL}/keleres.m4a`],
      [25, `${AUDIO_CDN_BASE_URL}/bastion.m4a`],
      [26, `${AUDIO_CDN_BASE_URL}/deepwrought.m4a`],
      [27, `${AUDIO_CDN_BASE_URL}/crimson.m4a`],
      [28, `${AUDIO_CDN_BASE_URL}/ralnel.m4a`],
      [29, `${AUDIO_CDN_BASE_URL}/firmament.m4a`],
    ])

    this.initialize()
  }

  async initialize() {
    const userAgent = navigator.userAgent.toLowerCase()
    const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent)

    if (isMobileDevice) {
      this.isMobile = true
      this.createAudioEnableButton()
    } else {
      const testAudio = new Audio()
      testAudio.volume = 0.01
      testAudio.src = this.audioFiles.get(0) || this.audioFiles.values().next().value

      try {
        await testAudio.play()
        testAudio.pause()
        testAudio.src = ''
        this.audioEnabled = true
        this.isMobile = false
      } catch (e) {
        this.isMobile = true
        this.createAudioEnableButton()
      }
    }
  }

  createAudioEnableButton() {
    if (document.getElementById('enable-audio-btn')) return

    const button = document.createElement('button')
    button.id = 'enable-audio-btn'
    button.className = 'audio-control-btn audio-enable-btn'
    button.textContent = 'Enable Audio'

    button.addEventListener('click', async () => {
      await this.enableAudio()
      button.remove()
    })

    const container = document.querySelector('.audio-controls-container') || document.querySelector('.header')
    if (container) {
      container.appendChild(button)
    } else {
      document.body.appendChild(button)
    }
  }

  async enableAudio() {
    this.audioEnabled = true
    this.userInteracted = true

    if (!this.streamingButton) {
      this.createStreamingButton()
      this.createSkipButton()
    }

    if (this.currentSlide !== null && this.currentSlide > 0) {
      await this.playSlideAudio(this.currentSlide)
    }
  }

  async toggleAudio(button) {
    if (this.audioEnabled) {
      this.audioEnabled = false
      if (this.currentAudio) {
        this.currentAudio.pause()
        this.currentAudio.volume = 0
      }
      button.textContent = 'Enable Audio'
    } else {
      await this.enableAudio()
      button.textContent = 'Disable Audio'
    }
  }

  createStreamingButton() {
    if (document.getElementById('streaming-audio-btn')) return

    const button = document.createElement('button')
    button.id = 'streaming-audio-btn'
    button.className = 'audio-control-btn streaming-audio-btn'
    button.textContent = 'Random Music Mode'

    button.addEventListener('click', () => this.toggleStreaming(button))
    this.streamingButton = button

    const container = document.querySelector('.audio-controls-container') || document.querySelector('.header')
    if (container) {
      container.appendChild(button)
    }
  }

  createSkipButton() {
    if (document.getElementById('skip-audio-btn')) return

    const button = document.createElement('button')
    button.id = 'skip-audio-btn'
    button.className = 'audio-control-btn skip-audio-btn'
    button.textContent = 'Skip'
    button.style.display = 'none'

    button.addEventListener('click', () => {
      if (this.streamingMode) {
        this.playRandomMusic()
      }
    })

    const container = document.querySelector('.audio-controls-container') || document.querySelector('.header')
    if (container) {
      container.appendChild(button)
    }
  }

  async toggleStreaming(button) {
    const skipButton = document.getElementById('skip-audio-btn')

    if (this.streamingMode) {
      this.streamingMode = false
      this.recentlyPlayedHistory = []
      button.textContent = 'Random Music'
      button.classList.remove('streaming-active')

      if (skipButton) skipButton.style.display = 'none'

      if (this.currentAudio) {
        this.currentAudio.pause()
        this.currentAudio.volume = 0
        this.currentAudio = null
      }

    } else {
      if (!this.audioEnabled) {
        this.audioEnabled = true
        this.userInteracted = true
      }

      this.streamingMode = true
      button.textContent = 'Stop Random Music'
      button.classList.add('streaming-active')

      if (skipButton) skipButton.style.display = 'inline-block'

      await this.playRandomMusic()
    }
  }

  async playRandomMusic() {
    if (!this.streamingMode) return

    const totalSongs = this.audioFiles.size
    const availableIndices = []

    for (let i = 0; i < totalSongs; i++) {
      if (!this.recentlyPlayedHistory.includes(i)) {
        availableIndices.push(i)
      }
    }

    if (availableIndices.length === 0) {
      const lastPlayed = this.recentlyPlayedHistory[this.recentlyPlayedHistory.length - 1]
      this.recentlyPlayedHistory = lastPlayed !== undefined ? [lastPlayed] : []

      for (let i = 0; i < totalSongs; i++) {
        if (!this.recentlyPlayedHistory.includes(i)) {
          availableIndices.push(i)
        }
      }
    }

    const randomIndex = availableIndices[Math.floor(Math.random() * availableIndices.length)]
    const randomSlide = randomIndex + 1

    this.recentlyPlayedHistory.push(randomIndex)
    if (this.recentlyPlayedHistory.length > this.historyMaxSize) {
      this.recentlyPlayedHistory.shift()
    }

    try {
      await this.loadAudioForSlide(randomSlide)
    } catch (e) {
      setTimeout(() => this.playRandomMusic(), RETRY_DELAY_MS)
      return
    }

    this.audioElements.forEach(audio => {
      audio.pause()
      audio.currentTime = 0
      audio.volume = 0
    })

    const newAudio = this.audioElements.get(randomIndex)
    if (!newAudio) {
      setTimeout(() => this.playRandomMusic(), RETRY_DELAY_MS)
      return
    }

    newAudio.loop = false
    newAudio.volume = PLAYBACK_VOLUME
    newAudio.currentTime = 0

    newAudio.onended = () => {
      if (this.streamingMode) {
        this.playRandomMusic()
      }
    }

    try {
      await newAudio.play()
      this.currentAudio = newAudio
    } catch (e) {
      setTimeout(() => this.playRandomMusic(), RETRY_DELAY_MS)
    }
  }

  loadAudioForSlide(slideIndex) {
    if (slideIndex === 0) {
      return Promise.resolve()
    }

    const audioIndex = slideIndex - 1

    if (this.failedAudioFiles.has(audioIndex)) {
      return Promise.reject(new Error('Audio file previously failed'))
    }

    if (this.audioElements.has(audioIndex)) {
      return Promise.resolve()
    }

    if (this.loadingAudio.has(audioIndex)) {
      return this.loadingAudio.get(audioIndex)
    }

    if (!this.audioFiles.has(audioIndex)) {
      return Promise.reject(new Error('No audio file defined'))
    }

    const loadPromise = new Promise((resolve, reject) => {
      const audio = document.createElement('audio')
      audio.loop = true
      audio.volume = 0
      audio.preload = 'auto'

      const handleLoaded = () => {
        this.audioElements.set(audioIndex, audio)
        this.loadingAudio.delete(audioIndex)
        audio.removeEventListener('canplaythrough', handleLoaded)
        audio.removeEventListener('error', handleError)
        resolve()
      }

      const handleError = () => {
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
          audio.play().catch(() => {})
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
      this.loadAudioForSlide(currentSlideIndex + 1).catch(() => {})
    }

    if (currentSlideIndex > 1) {
      this.loadAudioForSlide(currentSlideIndex - 1).catch(() => {})
    }
  }

  async playSlideAudio(slideIndex) {
    this.currentSlide = slideIndex

    if (this.streamingMode) return

    if (!this.audioEnabled) return

    if (this.isMobile && !this.userInteracted) return

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
      return
    }

    this.audioElements.forEach(audio => {
      audio.pause()
      audio.currentTime = 0
      audio.volume = 0
    })

    const newAudio = this.audioElements.get(audioIndex)
    if (!newAudio) return

    newAudio.volume = PLAYBACK_VOLUME
    newAudio.currentTime = Math.min(newAudio.duration * SKIP_INTRO_RATIO, newAudio.duration)
    try {
      await newAudio.play()
      this.currentAudio = newAudio
    } catch (e) {
      // Autoplay blocked or audio unavailable — non-critical
    }

    setTimeout(() => {
      this.preloadAdjacentSlides(slideIndex)
    }, PRELOAD_DELAY_MS)
  }

  getState() {
    return {
      enabled: this.audioEnabled,
      currentSlide: this.currentSlide,
      totalAudioFiles: this.audioElements.size,
      loadedAudioFiles: this.audioElements.size,
      loadingAudioFiles: this.loadingAudio.size,
      failedAudioFiles: Array.from(this.failedAudioFiles),
      hasErrors: this.failedAudioFiles.size > 0,
      isMobile: this.isMobile,
      userInteracted: this.userInteracted,
    }
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = AudioManager
}
