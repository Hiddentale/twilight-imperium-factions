let currentSlide = 0
const slides = document.querySelectorAll('.slide')
const totalSlides = slides.length

const audioManager = new AudioManager()
let initialized = false

function initializeIndicators() {
  const indicatorsContainer = document.getElementById('indicators')
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

  const currentSlideEl = document.getElementById('current-slide')
  const totalSlidesEl = document.getElementById('total-slides')
  if (currentSlideEl) currentSlideEl.textContent = currentSlide + 1
  if (totalSlidesEl) totalSlidesEl.textContent = totalSlides

  const prevBtn = document.getElementById('prevBtn')
  const nextBtn = document.getElementById('nextBtn')
  if (prevBtn) prevBtn.disabled = currentSlide === 0
  if (nextBtn) nextBtn.disabled = currentSlide === totalSlides - 1

  document.querySelectorAll('.indicator').forEach((indicator, index) => {
    indicator.classList.toggle('active', index === currentSlide)
  })

  if (currentSlide > 0) {
    const factionImages = [
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

    const imagePath = `images/${factionImages[currentSlide - 1]}`
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

let currentDifficulty = 1

function setupDifficultySelector() {
  const upBtn = document.getElementById('difficultyUp')
  const downBtn = document.getElementById('difficultyDown')
  const label = document.getElementById('difficultyLabel')
  const bars = document.querySelectorAll('.difficulty-bar')

  const labels = ['Beginner', 'Intermediate', 'Advanced', 'Expert']

  function updateDisplay() {
    bars.forEach((bar, index) => {
      if (index < currentDifficulty) {
        bar.classList.add('active')
      } else {
        bar.classList.remove('active')
      }
    })
    label.textContent = labels[currentDifficulty - 1]
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

function goToRandomFaction() {
  const factionDifficulties = [
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
  ]

  const eligibleFactions = []
  factionDifficulties.forEach((difficulty, index) => {
    if (difficulty <= currentDifficulty) {
      eligibleFactions.push(index + 1)
    }
  })

  const randomIndex = Math.floor(Math.random() * eligibleFactions.length)
  goToSlide(eligibleFactions[randomIndex])
}

function showKeyboardShortcuts() {
  const modal = document.getElementById('shortcuts-modal')
  modal.classList.add('active')
}

function closeShortcutsModal() {
  const modal = document.getElementById('shortcuts-modal')
  modal.classList.remove('active')
}

function populateFactionDropdown() {
  const dropdown = document.getElementById('factionJump')
  if (!dropdown) return

  const factionNames = [
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
  ]

  factionNames.forEach((name, index) => {
    const option = document.createElement('option')
    option.value = index + 1
    option.textContent = name
    dropdown.appendChild(option)
  })

  dropdown.addEventListener('change', (e) => {
    const slideIndex = parseInt(e.target.value)
    if (slideIndex) {
      goToSlide(slideIndex)
    }
  })
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowLeft') changeSlide(-1)
  if (e.key === 'ArrowRight') changeSlide(1)
})

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

  const prevBtn = document.getElementById('prevBtn')
  const nextBtn = document.getElementById('nextBtn')
  if (prevBtn) prevBtn.addEventListener('click', () => changeSlide(-1))
  if (nextBtn) nextBtn.addEventListener('click', () => changeSlide(1))

  const randomFactionBtn = document.getElementById('randomFactionBtn')
  if (randomFactionBtn) {
    randomFactionBtn.addEventListener('click', goToRandomFaction)
  }

  const shortcutsBtn = document.getElementById('shortcutsBtn')
  if (shortcutsBtn) {
    shortcutsBtn.addEventListener('click', showKeyboardShortcuts)
  }

  const modalCloses = document.querySelectorAll('.modal-close')
  modalCloses.forEach(close => {
    close.addEventListener('click', (e) => {
      const modal = e.target.closest('.modal')
      modal.classList.remove('active')
    })
  })

  document.querySelectorAll('.view-details-btn').forEach((btn, index) => {
    btn.addEventListener('click', () => showFactionDetails(index + 1))
  })

  console.log('Audio Manager State:', audioManager.getState())
}

if (document.readyState == 'loading') {
  document.addEventListener('DOMContentLoaded', init)
} else {
  init()
}

function showFactionDetails(factionIndex) {
  const modal = document.getElementById('faction-modal')
  const modalImage = document.getElementById('modal-faction-image')

  const factionImages = [
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

  modalImage.src = `images/${factionImages[factionIndex - 1]}`
  modalImage.alt = `Detailed faction card`
  modal.classList.add('active')
}

function closeFactionDetails() {
  const modal = document.getElementById('faction-modal')
  modal.classList.remove('active')
}

document.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal')) {
    e.target.classList.remove('active')
  }
})

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal.active').forEach(modal => {
      modal.classList.remove('active')
    })
  }
})