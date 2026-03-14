/* ============================================
   CONSTANTS
   ============================================ */
const DIFFICULTY_LEVELS = { beginner: 1, intermediate: 2, advanced: 3, expert: 4 }
const DIFFICULTY_LABELS = ['Beginner', 'Intermediate', 'Advanced', 'Expert']

const EXPANSION_RANGES = {
  base: { start: 0, end: 16 },
  pok: { start: 17, end: 24 },
  thunder: { start: 25, end: 29 }
}

const DEBOUNCE_DELAY = 150
const IMAGE_PRELOAD_ADJACENCY = 2

/* ============================================
   STATE
   ============================================ */
let factions = []
let currentSlide = 0
let currentDifficulty = 1
let initialized = false
let enabledExpansions = new Set(['base'])
let slides = []
let totalSlides = 0

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

function escapeHtml(text) {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}

/* ============================================
   SLIDE RENDERING
   ============================================ */
function renderFactionSlide(faction, index) {
  const difficultyLabel = faction.difficulty.toUpperCase()
  const strengthsHtml = faction.strengths.map(s => `<li>${escapeHtml(s)}</li>`).join('\n')
  const weaknessesHtml = faction.weaknesses.map(w => `<li>${escapeHtml(w)}</li>`).join('\n')

  const slide = document.createElement('div')
  slide.className = 'slide'
  slide.innerHTML = `
    <div class="faction-header">
      <div class="faction-image">
        <div><img src="${escapeHtml(faction.image)}" alt="${escapeHtml(faction.name)}"></div>
      </div>
      <div class="faction-title">
        <h2 class="faction-name">${escapeHtml(faction.name)}</h2>
        <div class="difficulty-badge ${faction.difficulty}"> ${difficultyLabel}</div>
        <p class="faction-identity">${escapeHtml(faction.identity)}</p>
      </div>
      <div class="faction-buttons">
        <button class="view-details-btn" data-index="${index}">View Detailed Info</button>
        <button class="view-lore-btn" data-index="${index}">View Lore</button>
      </div>
    </div>
    <div class="content-grid">
      <div class="content-section">
        <h3> Special Abilities</h3>
        <p>${escapeHtml(faction.abilities)}</p>
      </div>
      <div class="content-section">
        <h3> Playstyle</h3>
        <p>${escapeHtml(faction.playstyle)}</p>
      </div>
      <div class="content-section">
        <h3> Why It's Fun</h3>
        <p>${escapeHtml(faction.fun)}</p>
      </div>
      <div class="content-section">
        <h3> Starting Assets</h3>
        <p>${escapeHtml(faction.assets)}</p>
      </div>
      <div class="strengths-weaknesses">
        <div class="content-section strengths">
          <h3> Strengths</h3>
          <ul>${strengthsHtml}</ul>
        </div>
        <div class="content-section weaknesses">
          <h3> Weaknesses</h3>
          <ul>${weaknessesHtml}</ul>
        </div>
      </div>
    </div>
  `
  return slide
}

function renderAllSlides() {
  const container = document.querySelector('.main-content')
  if (!container) return

  factions.forEach((faction, index) => {
    container.appendChild(renderFactionSlide(faction, index))
  })

  slides = document.querySelectorAll('.slide')
  totalSlides = slides.length
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
  for (let i = -IMAGE_PRELOAD_ADJACENCY; i <= IMAGE_PRELOAD_ADJACENCY; i++) {
    const factionIdx = slideIndex + i - 1
    if (factionIdx >= 0 && factionIdx < factions.length) {
      safeExecute(
        () => preloadImage(factions[factionIdx].detailImage).catch(() => {}),
        'Image preload'
      )
    }
  }
}

/* ============================================
   SLIDE MANAGEMENT
   ============================================ */
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

  const dropdown = getElementById('factionJump', false)
  if (dropdown) {
    dropdown.value = currentSlide === 0 ? '' : currentSlide
  }

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

const debouncedChangeSlide = debounce(changeSlide, DEBOUNCE_DELAY)

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
    label.textContent = DIFFICULTY_LABELS[currentDifficulty - 1]

    if (display) {
      display.setAttribute('aria-valuenow', currentDifficulty)
      display.setAttribute('aria-valuetext', DIFFICULTY_LABELS[currentDifficulty - 1])
    }
  }

  upBtn.addEventListener('click', () => {
    if (currentDifficulty < 4) {
      currentDifficulty++
      updateDisplay()
    }
  })

  downBtn.addEventListener('click', () => {
    if (currentDifficulty > 1) {
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

  factions.forEach((faction, index) => {
    const difficultyNum = DIFFICULTY_LEVELS[faction.difficulty]
    if (difficultyNum > currentDifficulty) return

    let isEnabled = false
    for (const [expansion, range] of Object.entries(EXPANSION_RANGES)) {
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

  factions.forEach((faction, index) => {
    const option = document.createElement('option')
    option.value = index + 1
    option.textContent = faction.name
    dropdown.appendChild(option)
  })

  dropdown.addEventListener('change', (e) => {
    const slideIndex = parseInt(e.target.value)
    if (slideIndex) {
      goToSlide(slideIndex)
    } else if (e.target.value === '' && currentSlide !== 0) {
      goToSlide(0)
    }
  })
}

/* ============================================
   FACTION DETAILS MODAL
   ============================================ */
function showFactionDetails(factionIndex) {
  const modal = getElementById('faction-modal', false)
  const modalImage = getElementById('modal-faction-image', false)

  if (!modal || !modalImage) return

  const faction = factions[factionIndex - 1]
  if (!faction) return

  modalImage.src = faction.detailImage
  modalImage.alt = `Detailed faction card for ${faction.name}`
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

  document.addEventListener('click', (e) => {
    if (e.target.classList.contains('view-details-btn')) {
      showFactionDetails(parseInt(e.target.dataset.index) + 1)
    }

    if (e.target.classList.contains('view-lore-btn')) {
      showLoreModal(parseInt(e.target.dataset.index))
    }

    if (e.target.classList.contains('modal')) {
      closeModal(e.target)
    }

    if (e.target.classList.contains('modal-close')) {
      closeModal(e.target.closest('.modal'))
    }
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
}

/* ============================================
   LORE LOADING SYSTEM
   ============================================ */
const loreCache = new Map()
let currentlyLoadingLore = null

function sanitizeMarkdownHtml(html) {
  const div = document.createElement('div')
  div.innerHTML = html

  const allowedTags = ['P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'UL', 'OL', 'LI',
    'STRONG', 'EM', 'CODE', 'PRE', 'BLOCKQUOTE', 'A', 'BR', 'HR']

  const allElements = div.getElementsByTagName('*')
  for (let i = allElements.length - 1; i >= 0; i--) {
    const element = allElements[i]

    if (!allowedTags.includes(element.tagName)) {
      element.remove()
      continue
    }

    Array.from(element.attributes).forEach(attr => {
      if (attr.name.startsWith('on')) {
        element.removeAttribute(attr.name)
      }
    })

    if (element.tagName === 'A') {
      const href = element.getAttribute('href')
      if (href && !href.startsWith('http://') && !href.startsWith('https://')) {
        element.removeAttribute('href')
      }
      element.setAttribute('target', '_blank')
      element.setAttribute('rel', 'noopener noreferrer')
    }
  }

  return div.innerHTML
}

async function loadLoreFile(factionIndex) {
  if (loreCache.has(factionIndex)) {
    return loreCache.get(factionIndex)
  }

  try {
    const response = await fetch(`lore/${factionIndex}.md`)

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('LORE_NOT_FOUND')
      }
      throw new Error(`Failed to load lore: ${response.status}`)
    }

    const markdown = await response.text()

    let html
    if (typeof marked !== 'undefined' && marked.parse) {
      html = marked.parse(markdown)
    } else {
      console.warn('marked.js not loaded, displaying as plain text')
      html = `<pre>${escapeHtml(markdown)}</pre>`
    }

    const sanitizedHtml = sanitizeMarkdownHtml(html)
    loreCache.set(factionIndex, sanitizedHtml)
    return sanitizedHtml
  } catch (error) {
    console.error(`Error loading lore for faction ${factionIndex}:`, error)
    throw error
  }
}

function showLoreLoading(loreBody) {
  loreBody.innerHTML = `
    <div class="lore-state">
      <div class="lore-state-icon">⏳</div>
      <p>Loading lore...</p>
    </div>
  `
}

function showLoreError(loreBody, message) {
  loreBody.innerHTML = `
    <div class="lore-state">
      <div class="lore-state-icon"></div>
      <p>${escapeHtml(message)}</p>
    </div>
  `
}

async function showLoreModal(factionIndex) {
  const modal = getElementById('lore-modal', false)
  const loreTitle = getElementById('lore-faction-name', false)
  const loreBody = getElementById('lore-text', false)

  if (!modal || !loreTitle || !loreBody) {
    console.error('Lore modal elements not found')
    return
  }

  if (currentlyLoadingLore === factionIndex) return

  const faction = factions[factionIndex]
  loreTitle.textContent = faction ? faction.name : 'Unknown Faction'

  modal.classList.add('active')
  modal.setAttribute('aria-hidden', 'false')
  showLoreLoading(loreBody)
  loreBody.scrollTop = 0

  currentlyLoadingLore = factionIndex

  try {
    const loreHtml = await loadLoreFile(factionIndex)

    if (currentlyLoadingLore === factionIndex && modal.classList.contains('active')) {
      loreBody.innerHTML = loreHtml
      loreBody.scrollTop = 0
    }
  } catch (error) {
    if (currentlyLoadingLore === factionIndex && modal.classList.contains('active')) {
      if (error.message === 'LORE_NOT_FOUND') {
        showLoreError(loreBody, 'Lore for this faction is coming soon!')
      } else {
        showLoreError(loreBody, 'Failed to load lore. Please try again.')
        console.error('Lore loading error:', error)
      }
    }
  } finally {
    if (currentlyLoadingLore === factionIndex) {
      currentlyLoadingLore = null
    }
  }
}

function closeLoreModal() {
  const modal = getElementById('lore-modal', false)
  if (modal) {
    closeModal(modal)
    currentlyLoadingLore = null
  }
}

/* ============================================
   INITIALIZATION
   ============================================ */
async function init() {
  if (initialized) return
  initialized = true

  try {
    const response = await fetch('data/factions.json')
    factions = await response.json()
  } catch (error) {
    console.error('Failed to load faction data:', error)
    return
  }

  safeExecute(() => {
    renderAllSlides()
    updateSlideDisplay()
    populateFactionDropdown()
    setupDifficultySelector()
    setupExpansionSelector()
    setupEventListeners()
    preloadAdjacentImages(0)
  }, 'Initialization')
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init)
} else {
  init()
}
