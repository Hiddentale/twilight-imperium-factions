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

  FACTION_DIFFICULTIES: [
    1, // Letnev - Beginner
    1, // Sol
    1, // Jol-Nar
    1, // L1Z1X
    1, // Xxcha
    1, // Yin
    1, // Yssaril
    2, // Hacan - Intermediate
    2, // Saar
    2, // Naalu
    2, // Sardakk
    2, // Winnu
    3, // Arborec - Advanced
    3, // Muaat
    3, // Creuss
    3, // Mentak
    3, // Nekro
    1, // Argent
    1, // Empyrean
    3, // Mahact
    2, // Naaz-Rokha
    2, // Nomad
    3, // Titans
    3, // Cabal
    2, // Keleres
    1, // Bastion
    2, // Deepwrought
    3, // Crimson
    2, // Ral Nel
    4  // Obsidian - Expert
  ],

  FACTION_NAMES: [
    'The Barony of Letnev',
    'Federation of Sol',
    'Universities of Jol-Nar',
    'L1Z1X Mindnet',
    'Xxcha Kingdom',
    'Yin Brotherhood',
    'Yssaril Tribes',
    'Emirates of Hacan',
    'Clan of Saar',
    'Naalu Collective',
    'Sardakk N\'orr',
    'The Winnu',
    'The Arborec',
    'Embers of Muaat',
    'Ghosts of Creuss',
    'Mentak Coalition',
    'The Nekro Virus',
    'The Argent Flight',
    'The Empyrean',
    'The Mahact Gene-Sorcerers',
    'The Naaz-Rokha Alliance',
    'The Nomad',
    'The Titans of Ul',
    'The Vuil\'raith Cabal',
    'Council Keleres',
    'Last Bastion',
    'The Deepwrought Scholarate',
    'The Crimson Rebellion',
    'The Ral Nel Consortium',
    'The Firmament / The Obsidian'
  ],

  FACTION_IMAGE_FILES: [
    'r_letnev.jpg',
    'r_sol.jpg',
    'r_jolnar.jpg',
    'r_l1z1x.jpg',
    'r_xxcha.jpg',
    'r_yin.jpg',
    'r_yssaril.jpg',
    'r_hacan.jpg',
    'r_saar.jpg',
    'r_naalu.jpg',
    'r_norr.jpg',
    'r_winnu.jpg',
    'r_arborec.jpg',
    'r_muaat.jpg',
    'r_creuss.jpg',
    'r_mentak.jpg',
    'r_nekro.jpg',
    'r_argent.jpg',
    'r_empyrean.jpg',
    'r_mahact.jpg',
    'r_naaz.jpg',
    'r_nomad.jpg',
    'r_titans.jpg',
    'r_cabal.jpg',
    'r_keleres.jpg',
    'r_bastion.jpg',
    'r_deepwrought.jpg',
    'r_crimson.jpg',
    'r_ralnelconsortium.jpg',
    'r_obsidian.jpg'
  ]
}

/* ============================================
   STATE
   ============================================ */
let currentSlide = 0
let currentDifficulty = CONSTANTS.DIFFICULTY.BEGINNER
let initialized = false

const slides = document.querySelectorAll('.slide')
const totalSlides = slides.length
const audioManager = new AudioManager()

/* ============================================
   UTILITY FUNCTIONS
   ============================================ */
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
   SLIDE MANAGEMENT
   ============================================ */
function initializeIndicators() {
  const indicatorsContainer = getElementById('indicators')
  if (!indicatorsContainer) return

  for (let i = 0; i < totalSlides; i++) {
    const indicator = document.createElement('div')
    indicator.className = 'indicator'
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
  if (prevBtn) prevBtn.disabled = currentSlide === 0
  if (nextBtn) nextBtn.disabled = currentSlide === totalSlides - 1

  document.querySelectorAll('.indicator').forEach((indicator, index) => {
    indicator.classList.toggle('active', index === currentSlide)
  })

  if (currentSlide > 0) {
    const imagePath = `images/${CONSTANTS.FACTION_IMAGE_FILES[currentSlide - 1]}`
    const img = new Image()
    img.src = imagePath
  }

  audioManager.playSlideAudio(currentSlide)
    .catch(error => console.warn('Audio playback error:', error))
}

function changeSlide(direction) {
  const newSlide = currentSlide + direction
  if (newSlide >= 0 && newSlide < totalSlides) {
    currentSlide = newSlide
    updateSlideDisplay()
  }
}

function goToSlide(slideIndex) {
  if (slideIndex >= 0 && slideIndex < totalSlides) {
    currentSlide = slideIndex
    updateSlideDisplay()
  }
}

/* ============================================
   DIFFICULTY SELECTOR
   ============================================ */

function setupDifficultySelector() {
  const upBtn = getElementById('difficultyUp', false)
  const downBtn = getElementById('difficultyDown', false)
  const label = getElementById('difficultyLabel', false)
  const bars = document.querySelectorAll('.difficulty-bar')

  if (!upBtn || !downBtn || !label || bars.length === 0) return

  function updateDisplay() {
    bars.forEach((bar, index) => {
      if (index < currentDifficulty) {
        bar.classList.add('active')
      } else {
        bar.classList.remove('active')
      }
    })
    label.textContent = CONSTANTS.DIFFICULTY_LABELS[currentDifficulty - 1]
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
    if (difficulty <= currentDifficulty) {
      eligibleFactions.push(index + 1) // +1 because slide 0 is intro
    }
  })

  if (eligibleFactions.length === 0) return

  const randomIndex = Math.floor(Math.random() * eligibleFactions.length)
  goToSlide(eligibleFactions[randomIndex])
}

/* ============================================
   FACTION DROPDOWN
   ============================================ */
function populateFactionDropdown() {
  const dropdown = getElementById('factionJump', false)
  if (!dropdown) return

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
  modalImage.alt = 'Detailed faction card'
  modal.classList.add('active')
}

/* ============================================
   EVENT LISTENERS
   ============================================ */
function setupEventListeners() {
  const prevBtn = getElementById('prevBtn', false)
  const nextBtn = getElementById('nextBtn', false)
  if (prevBtn) prevBtn.addEventListener('click', () => changeSlide(-1))
  if (nextBtn) nextBtn.addEventListener('click', () => changeSlide(1))

  const randomFactionBtn = getElementById('randomFactionBtn', false)
  if (randomFactionBtn) {
    randomFactionBtn.addEventListener('click', goToRandomFaction)
  }

  document.querySelectorAll('.modal-close').forEach(close => {
    close.addEventListener('click', (e) => {
      const modal = e.target.closest('.modal')
      if (modal) modal.classList.remove('active')
    })
  })

  document.querySelectorAll('.view-details-btn').forEach((btn, index) => {
    btn.addEventListener('click', () => showFactionDetails(index + 1))
  })

  document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') changeSlide(-1)
    if (e.key === 'ArrowRight') changeSlide(1)
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal.active').forEach(modal => {
        modal.classList.remove('active')
      })
    }
  })

  document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
      e.target.classList.remove('active')
    }
  })
}


function showKeyboardShortcuts() {
  const modal = document.getElementById('shortcuts-modal')
  modal.classList.add('active')
}

function closeShortcutsModal() {
  const modal = document.getElementById('shortcuts-modal')
  modal.classList.remove('active')
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

  initializeIndicators()
  updateSlideDisplay()
  populateFactionDropdown()
  setupDifficultySelector()
  setupEventListeners()

  console.log('Audio Manager State:', audioManager.getState())
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init)
} else {
  init()
}