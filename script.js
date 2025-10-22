let currentSlide = 0
const slides = document.querySelectorAll('.slide')
const totalSlides = slides.length

const audioManager = new AudioManager()

function initializeIndicators() {
  const indicatorsContainer = document.getElementById('indicators')
  if (!indicatorsContainer) return

  for (let i = 0; i < totalSlides; i++) {
    const indicator = document.createElement('div')
    indicator.className = 'indicator'
    if (i === 0) indicator.classList.add('active')

    //indicator.onclick = () => goToSlide(i)
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


try {
  audioManager.playSlideAudio(currentSlide)
} catch (error) {
  console.warn('Audio playback error:', error)
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

document.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowLeft') changeSlide(-1)
  if (e.key === 'ArrowRight') changeSlide(1)
})

document.addEventListener('DOMContentLoaded', () => {
  initializeIndicators()
  updateSlideDisplay()

  console.log('Audio Manager State:', audioManager.getState())
})

if (document.readyState !== 'loading') {
  initializeIndicators()
  updateSlideDisplay()
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
  const modal = document.getElementById('faction-modal')
  if (e.target === modal) {
    closeFactionDetails()
  }
})

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeFactionDetails()
  }
})