import { cart } from '../../data/cart.js'

function formatDeliveryDate(date) {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

function getCartQuantity() {
  let cartQuantity = 0
  cart.forEach((cartItem) => {
    cartQuantity += cartItem.quantity
  })
  return cartQuantity
  // return `${cartQuantity} ${cartQuantity > 1 ? 'items' : 'item'} `
}

document.addEventListener('DOMContentLoaded', () => {
  const trackingData = JSON.parse(localStorage.getItem('tracking'))
  if (!trackingData) return

  const orderDateIso = trackingData.orderDate || trackingData.deliveryDate
  const deliveryDateIso = trackingData.deliveryDate

  const productNameEl = document.querySelectorAll('.product-info')[0]
  const productQtyEl = document.querySelectorAll('.product-info')[1]
  const productImgEl = document.querySelector('.product-image')
  const deliveryDateEl = document.querySelector('.delivery-date')
  const cartQuantityElement = document.querySelector('.cart-quantity')
  const progressBar = document.querySelector('.progress-bar')
  const labels = document.querySelectorAll('.progress-label')

  if (productNameEl) productNameEl.innerText = trackingData.productName
  if (productQtyEl) productQtyEl.innerText = `Quantity: ${trackingData.productQuantity}`
  if (productImgEl) productImgEl.src = trackingData.productImage
  if (deliveryDateEl) deliveryDateEl.innerText = `Arriving on ${new Date(deliveryDateIso).toLocaleDateString()}`
  if (cartQuantityElement) cartQuantityElement.innerHTML = getCartQuantity()

  function percentFor(totalDays, elapsedMs, orderDate, deliveryDate) {
    if (Date.now() >= deliveryDate.getTime()) return 100

    // 7 fluxo de 7 dia
    if (totalDays >= 7) {
      const day = Math.floor(elapsedMs / (24 * 60 * 60 * 1000)) + 1
      if (day <= 1) return 10
      if (day === 2) return 25
      if (day >= 3 && day <= 5) return 50
      if (day === 6) return 75
      return 100
    }

    // 3 fluxo de 3 dia
    if (totalDays >= 3) {
      const day = Math.floor(elapsedMs / (24 * 60 * 60 * 1000)) + 1
      if (day <= 1) return 10
      if (day === 2) return 50
      return 100
    }

    // 1 fluxo de 1 dia
    if (totalDays === 1) {
      const hours = elapsedMs / (60 * 60 * 1000)
      if (hours < 12) return 10
      if (hours >= 12 && hours < 24) return 50
      return 100
    }

    const ratio = Math.max(0, Math.min(1, elapsedMs / (deliveryDate.getTime() - orderDate.getTime())))
    return Math.max(10, Math.round(ratio * 100))
  }

  function updateOnce() {
    const orderDate = new Date(orderDateIso)
    const deliveryDate = new Date(deliveryDateIso)
    const now = Date.now()
    const elapsedMs = now - orderDate.getTime()
    const totalMs = Math.max(1, deliveryDate.getTime() - orderDate.getTime())
    const totalDays = Math.max(1, Math.round(totalMs / (24 * 60 * 60 * 1000)))

    const percent = percentFor(totalDays, elapsedMs, orderDate, deliveryDate)

    if (progressBar) progressBar.style.width = `${percent}%`

    if (labels && labels.length) {
      labels.forEach(l => l.classList.remove('current-status'))
      if (percent >= 100) {
        if (labels[2]) labels[2].classList.add('current-status')
      } else if (percent >= 50) {
        if (labels[1]) labels[1].classList.add('current-status')
      } else {
        if (labels[0]) labels[0].classList.add('current-status')
      }
    }

    if (deliveryDateEl) {
  const deliveryDate = new Date(deliveryDateIso)
  deliveryDateEl.innerText = `Arriving on ${formatDeliveryDate(deliveryDate)}`
}
    // if (deliveryDateEl) deliveryDateEl.innerText = `Arriving on ${deliveryDate.toLocaleDateString()}`
    if (cartQuantityElement) cartQuantityElement.innerHTML = getCartQuantity()

    return percent
  }

  const POLL_INTERVAL_MS = 5000 
  let currentPercent = updateOnce()
  const intervalId = setInterval(() => {
    currentPercent = updateOnce()
    if (currentPercent >= 100) {
      clearInterval(intervalId)
    }
  }, POLL_INTERVAL_MS)
})
