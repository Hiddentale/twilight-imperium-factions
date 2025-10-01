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
  
  
  try {
    audioManager.playSlideAudio(currentSlide)
  } catch (error) {
    console.warn('Audio playback error:', error)
  }
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