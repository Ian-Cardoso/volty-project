const chatFab = document.getElementById('chatFab')
const chatWrapper = document.getElementById('chatWrapper')

chatFab.addEventListener('click', () => {
  chatWrapper.classList.toggle('hidden')
})
