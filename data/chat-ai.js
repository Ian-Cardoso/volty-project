let products = []

fetch('../backend/products.json')
  .then(res => res.json())
  .then(data => {
    products = data

    sendButton.addEventListener('click', handleSendMessage)

    chatInput.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        handleSendMessage()
      }
    })
  })
  .catch(err => console.error('Failed to load products.json', err))

const chatMessages = document.getElementById('chatMessages')
const chatInput = document.getElementById('chatInput')
const sendButton = document.getElementById('sendMessage')

function normalize(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

function addMessage(text, type = 'bot') {
  const div = document.createElement('div')
  div.className = type === 'user' ? 'user-message' : 'bot-message'
  div.innerText = text
  chatMessages.appendChild(div)
  chatMessages.scrollTop = chatMessages.scrollHeight
}

function recommendProducts(message) {
  const terms = normalize(message).split(/\s+/)

  return products.filter(product => {
    const name = normalize(product.name)

    if (terms.some(term => name.includes(term) || term.includes(name))) {
      return true
    }

    if (Array.isArray(product.keywords)) {
      return product.keywords.some(keyword => {
        const key = normalize(keyword)
        return terms.some(term =>
          key.includes(term) || term.includes(key)
        )
      })
    }

    return false
  }).slice(0, 4)
}

function renderProducts(products) {
  products.forEach(product => {
    const div = document.createElement('div')
    div.className = 'bot-message'
    div.innerHTML = `
      <strong>${product.name}</strong><br>
      💰 R$ ${(product.priceCents / 100).toFixed(2)}
    `
    chatMessages.appendChild(div)
  })
}

function handleSendMessage() {
  const message = chatInput.value.trim()
  if (!message) return

  addMessage(message, 'user')
  chatInput.value = ''

  setTimeout(() => {
    const recommendations = recommendProducts(message)

    if (recommendations.length === 0) {
      addMessage("Didn't find any products matching your request. Please try different keywords.")
      return
    }

    addMessage('So here are some products you might like: ')
    renderProducts(recommendations)
  }, 600)
}
