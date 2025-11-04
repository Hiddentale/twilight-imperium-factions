/* ============================================
   CONSTANTS
   ============================================ */
const CONSTANTS = {
  DIFFICULTY: {
    BEGINNER: 1,
    INTERMEDIATE: 2,
    ADVANCED: 3,
    EXPERT: 4
  },

  DIFFICULTY_LABELS: ['Beginner', 'Intermediate', 'Advanced', 'Expert'],

  EXPANSIONS: {
    BASE: 'base',
    POK: 'pok',
    THUNDER: 'thunder'
  },

  EXPANSION_RANGES: {
    base: { start: 0, end: 16 },      // Letnev through Nekro
    pok: { start: 17, end: 24 },      // Argent through Cabal
    thunder: { start: 25, end: 29 }   // Keleres through Obsidian
  },

  FACTION_DIFFICULTIES: [
    // Base Game (0-16)
    1, 1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 3, 3, 3, 3, 3,
    // Prophecy of Kings (17-24)
    1, 1, 3, 2, 2, 3, 3, 2,
    // Thunder's Edge (25-29)
    1, 2, 3, 2, 4
  ],

  FACTION_NAMES: [
    'The Barony of Letnev', 'Federation of Sol', 'Universities of Jol-Nar',
    'L1Z1X Mindnet', 'Xxcha Kingdom', 'Yin Brotherhood', 'Yssaril Tribes',
    'Emirates of Hacan', 'Clan of Saar', 'Naalu Collective', 'Sardakk N\'orr',
    'The Winnu', 'The Arborec', 'Embers of Muaat', 'Ghosts of Creuss',
    'Mentak Coalition', 'The Nekro Virus', 'The Argent Flight', 'The Empyrean',
    'The Mahact Gene-Sorcerers', 'The Naaz-Rokha Alliance', 'The Nomad',
    'The Titans of Ul', 'The Vuil\'raith Cabal', 'Council Keleres', 'Last Bastion',
    'The Deepwrought Scholarate', 'The Crimson Rebellion', 'The Ral Nel Consortium',
    'The Firmament / The Obsidian'
  ],

  FACTION_IMAGE_FILES: [
    'r_letnev.jpg', 'r_sol.jpg', 'r_jolnar.jpg', 'r_l1z1x.jpg', 'r_xxcha.jpg',
    'r_yin.jpg', 'r_yssaril.jpg', 'r_hacan.jpg', 'r_saar.jpg', 'r_naalu.jpg',
    'r_norr.jpg', 'r_winnu.jpg', 'r_arborec.jpg', 'r_muaat.jpg', 'r_creuss.jpg',
    'r_mentak.jpg', 'r_nekro.jpg', 'r_argent.jpg', 'r_empyrean.jpg', 'r_mahact.jpg',
    'r_naaz.jpg', 'r_nomad.jpg', 'r_titans.jpg', 'r_cabal.jpg', 'r_keleres.jpg',
    'r_bastion.jpg', 'r_deepwrought.jpg', 'r_crimson.jpg', 'r_ralnelconsortium.jpg',
    'r_obsidian.jpg'
  ],

  DEBOUNCE_DELAY: 150,
  IMAGE_PRELOAD_ADJACENCY: 2
}

/* ============================================
   STATE
   ============================================ */
let currentSlide = 0
let currentDifficulty = CONSTANTS.DIFFICULTY.BEGINNER
let initialized = false
let enabledExpansions = new Set([
  CONSTANTS.EXPANSIONS.BASE,
])

const slides = document.querySelectorAll('.slide')
const totalSlides = slides.length
const audioManager = new AudioManager()
const imageCache = new Set()

/* ============================================
   UTILITY FUNCTIONS
   ============================================ */
function safeExecute(fn, errorContext = 'Operation') {
  try {
    return fn()
  } catch (error) {
    console.error(`${errorContext} failed:`, error)
    return null
  }
}

function debounce(func, wait) {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

function getElementById(id, required = true) {
  const element = document.getElementById(id)
  if (required && !element) {
    console.error(`Required element not found: ${id}`)
  }
  return element
}

function updateElementText(id, text) {
  const element = getElementById(id, false)
  if (element) element.textContent = text
}

/* ============================================
   IMAGE LOADING
   ============================================ */
function preloadImage(src) {
  return new Promise((resolve, reject) => {
    if (imageCache.has(src)) {
      resolve(src)
      return
    }

    const img = new Image()
    img.onload = () => {
      imageCache.add(src)
      resolve(src)
    }
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`))
    img.src = src
  })
}

function preloadAdjacentImages(slideIndex) {
  const adjacency = CONSTANTS.IMAGE_PRELOAD_ADJACENCY

  for (let i = -adjacency; i <= adjacency; i++) {
    const targetSlide = slideIndex + i
    if (targetSlide > 0 && targetSlide < totalSlides) {
      const imageSrc = `images/${CONSTANTS.FACTION_IMAGE_FILES[targetSlide - 1]}`
      safeExecute(
        () => preloadImage(imageSrc).catch(() => { }),
        'Image preload'
      )
    }
  }
}

/* ============================================
   SLIDE MANAGEMENT
   ============================================ */
function initializeIndicators() {
  const indicatorsContainer = getElementById('indicators')
  if (!indicatorsContainer) return

  for (let i = 0; i < totalSlides; i++) {
    const indicator = document.createElement('div')
    indicator.className = 'indicator'
    indicator.setAttribute('role', 'button')
    indicator.setAttribute('aria-label', `Go to slide ${i + 1}`)
    if (i === 0) indicator.classList.add('active')
    indicator.onclick = () => goToSlide(i)
    indicatorsContainer.appendChild(indicator)
  }
}

function updateSlideDisplay() {
  slides.forEach(slide => slide.classList.remove('active'))
  slides[currentSlide].classList.add('active')

  updateElementText('current-slide', currentSlide + 1)
  updateElementText('total-slides', totalSlides)

  const prevBtn = getElementById('prevBtn', false)
  const nextBtn = getElementById('nextBtn', false)
  if (prevBtn) {
    prevBtn.disabled = currentSlide === 0
    prevBtn.setAttribute('aria-disabled', currentSlide === 0)
  }
  if (nextBtn) {
    nextBtn.disabled = currentSlide === totalSlides - 1
    nextBtn.setAttribute('aria-disabled', currentSlide === totalSlides - 1)
  }

  document.querySelectorAll('.indicator').forEach((indicator, index) => {
    indicator.classList.toggle('active', index === currentSlide)
    indicator.setAttribute('aria-current', index === currentSlide ? 'true' : 'false')
  })

  preloadAdjacentImages(currentSlide)

  safeExecute(
    () => audioManager.playSlideAudio(currentSlide),
    'Audio playback'
  )
}

function changeSlide(direction) {
  const newSlide = currentSlide + direction
  if (newSlide >= 0 && newSlide < totalSlides) {
    currentSlide = newSlide
    updateSlideDisplay()
  }
}

const debouncedChangeSlide = debounce(changeSlide, CONSTANTS.DEBOUNCE_DELAY)

function goToSlide(slideIndex) {
  if (slideIndex >= 0 && slideIndex < totalSlides) {
    currentSlide = slideIndex
    updateSlideDisplay()
  }
}

/* ============================================
   EXPANSION SELECTOR
   ============================================ */
function setupExpansionSelector() {
  const expansionBars = document.querySelectorAll('.expansion-bar')
  const labels = document.querySelectorAll('.expansion-label')

  function updateLabel(expansion, isActive) {
    const label = document.querySelector(`.expansion-label.${expansion}`)
    if (label) {
      label.style.color = isActive ? 'var(--beginner)' : 'var(--text-muted)'
    }
  }

  expansionBars.forEach(bar => {
    bar.addEventListener('click', () => {
      const expansion = bar.dataset.expansion
      const isActive = bar.dataset.active === 'true'

      bar.dataset.active = !isActive
      bar.setAttribute('aria-pressed', !isActive)

      updateLabel(expansion, !isActive)

      if (!isActive) {
        enabledExpansions.add(expansion)
      } else {
        enabledExpansions.delete(expansion)
      }

      console.log('Enabled expansions:', Array.from(enabledExpansions))
    })

    bar.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        bar.click()
      }
    })

    const expansion = bar.dataset.expansion
    const isActive = bar.dataset.active === 'true'
    updateLabel(expansion, isActive)
  })
}

/* ============================================
   DIFFICULTY SELECTOR
   ============================================ */
function setupDifficultySelector() {
  const upBtn = getElementById('difficultyUp', false)
  const downBtn = getElementById('difficultyDown', false)
  const label = getElementById('difficultyLabel', false)
  const bars = document.querySelectorAll('.difficulty-bar')
  const display = document.querySelector('.difficulty-display')

  if (!upBtn || !downBtn || !label || bars.length === 0) return

  if (display) {
    display.setAttribute('aria-label', 'Difficulty level')
    display.setAttribute('role', 'meter')
    display.setAttribute('aria-valuemin', '1')
    display.setAttribute('aria-valuemax', '4')
  }

  function updateDisplay() {
    bars.forEach((bar, index) => {
      if (index < currentDifficulty) {
        bar.classList.add('active')
      } else {
        bar.classList.remove('active')
      }
    })
    label.textContent = CONSTANTS.DIFFICULTY_LABELS[currentDifficulty - 1]

    if (display) {
      display.setAttribute('aria-valuenow', currentDifficulty)
      display.setAttribute('aria-valuetext', CONSTANTS.DIFFICULTY_LABELS[currentDifficulty - 1])
    }
  }

  upBtn.addEventListener('click', () => {
    if (currentDifficulty < CONSTANTS.DIFFICULTY.EXPERT) {
      currentDifficulty++
      updateDisplay()
    }
  })

  downBtn.addEventListener('click', () => {
    if (currentDifficulty > CONSTANTS.DIFFICULTY.BEGINNER) {
      currentDifficulty--
      updateDisplay()
    }
  })

  updateDisplay()
}

/* ============================================
   RANDOM FACTION
   ============================================ */
function goToRandomFaction() {
  const eligibleFactions = []

  CONSTANTS.FACTION_DIFFICULTIES.forEach((difficulty, index) => {
    if (difficulty > currentDifficulty) return

    let isEnabled = false
    for (const [expansion, range] of Object.entries(CONSTANTS.EXPANSION_RANGES)) {
      if (index >= range.start && index <= range.end && enabledExpansions.has(expansion)) {
        isEnabled = true
        break
      }
    }

    if (isEnabled) {
      eligibleFactions.push(index + 1)
    }
  })

  if (eligibleFactions.length === 0) {
    alert('No factions match your current difficulty and expansion settings!')
    return
  }

  const randomIndex = Math.floor(Math.random() * eligibleFactions.length)
  goToSlide(eligibleFactions[randomIndex])
}

/* ============================================
   FACTION DROPDOWN
   ============================================ */
function populateFactionDropdown() {
  const dropdown = getElementById('factionJump', false)
  if (!dropdown) return

  dropdown.setAttribute('aria-label', 'Jump to specific faction')

  CONSTANTS.FACTION_NAMES.forEach((name, index) => {
    const option = document.createElement('option')
    option.value = index + 1
    option.textContent = name
    dropdown.appendChild(option)
  })

  dropdown.addEventListener('change', (e) => {
    const slideIndex = parseInt(e.target.value)
    if (slideIndex) goToSlide(slideIndex)
  })
}

/* ============================================
   FACTION DETAILS MODAL
   ============================================ */
function showFactionDetails(factionIndex) {
  const modal = getElementById('faction-modal', false)
  const modalImage = getElementById('modal-faction-image', false)

  if (!modal || !modalImage) return

  modalImage.src = `images/${CONSTANTS.FACTION_IMAGE_FILES[factionIndex - 1]}`
  modalImage.alt = `Detailed faction card for ${CONSTANTS.FACTION_NAMES[factionIndex - 1]}`
  modal.classList.add('active')
  modal.setAttribute('aria-hidden', 'false')
}

function closeModal(modal) {
  if (modal) {
    modal.classList.remove('active')
    modal.setAttribute('aria-hidden', 'true')
  }
}

/* ============================================
   EVENT LISTENERS
   ============================================ */
function setupEventListeners() {
  const prevBtn = getElementById('prevBtn', false)
  const nextBtn = getElementById('nextBtn', false)
  if (prevBtn) prevBtn.addEventListener('click', () => debouncedChangeSlide(-1))
  if (nextBtn) nextBtn.addEventListener('click', () => debouncedChangeSlide(1))

  const randomFactionBtn = getElementById('randomFactionBtn', false)
  if (randomFactionBtn) {
    randomFactionBtn.addEventListener('click', goToRandomFaction)
  }

  document.querySelectorAll('.view-details-btn').forEach((btn, index) => {
    btn.addEventListener('click', () => showFactionDetails(index + 1))
  })

  document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') debouncedChangeSlide(-1)
    if (e.key === 'ArrowRight') debouncedChangeSlide(1)
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal.active').forEach(modal => {
        closeModal(modal)
      })
    }
  })

  document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
      closeModal(e.target)
    }

    if (e.target.classList.contains('modal-close')) {
      const modal = e.target.closest('.modal')
      closeModal(modal)
    }
  })
}

/* ============================================
   INITIALIZATION
   ============================================ */
function init() {
  if (initialized) {
    console.log('Already initialized, skipping')
    return
  }
  initialized = true

  safeExecute(() => {
    initializeIndicators()
    updateSlideDisplay()
    populateFactionDropdown()
    setupDifficultySelector()
    setupExpansionSelector()
    setupEventListeners()

    preloadAdjacentImages(0)

    console.log('Initialization complete')
    console.log('Audio Manager State:', audioManager.getState())
  }, 'Initialization')
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init)
} else {
  init()
}