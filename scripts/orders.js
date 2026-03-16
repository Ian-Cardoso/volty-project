import { products, getProduct } from '../data/products.js'
import { addToCart, loadFromStorage } from '../data/cart.js'
import { formatCurrency } from "./utils/money.js";

function renderOrders() {
  const ordersGrid = document.querySelector('.orders-grid')
  const orders = JSON.parse(localStorage.getItem('orders')) || []

  let ordersHTML = ''
  orders.forEach(order => {
    let orderItemsHTML = ''
    order.cart.forEach(cartItem => {
      const product = getProduct(cartItem.productId)
      const deliveryDateIso = cartItem.deliveryDate
      const deliveryDisplay = deliveryDateIso
        ? new Date(deliveryDateIso).toLocaleDateString()
        : new Date(order.date).toLocaleDateString()
      orderItemsHTML += `
        <div class="product-image-container">
          <img src="${product.image}">
        </div>
        <div class="product-details">
          <div class="product-name">${product.name}</div>
          <div class="product-delivery-date">Arriving on: ${deliveryDisplay}</div>
          <div class="product-quantity">Quantity: ${cartItem.quantity}</div>
          <button class="buy-again-button button-primary button-order" data-product-id="${cartItem.productId}">
            <img class="buy-again-icon" src="../images/icons/buy-again.png">
            <span class="buy-again-message">Buy it again</span>
          </button>
        </div>
        <div class="product-actions">
          <button class="track-package-button button-secondary"
            data-product-id="${cartItem.productId}"
            data-product-name="${product.name}"
            data-product-image="${product.image}"
            data-product-quantity="${cartItem.quantity}"
            data-order-date="${order.date}"
            data-delivery-date="${cartItem.deliveryDate || order.date}">
            Track package
          </button>
        </div>
      `
    })

    ordersHTML += `
      <div class="order-container">
        <div class="order-header">
          <div class="order-header-left-section">
            <div class="order-date">
              <div class="order-header-label">Order Placed:</div>
              <div>${new Date(order.date).toLocaleDateString()}</div>
            </div>
            <div class="order-total">
              <div class="order-header-label">Total</div>
              <div>
                ${order.couponCode ? `<span style="text-decoration: line-through; color: #999;">$${formatCurrency(order.subtotal || order.totalCents)}</span> ` : ''}
                <span style="font-weight: bold; color: #167a45;">$${formatCurrency(order.totalCents)}</span>
                ${order.couponCode ? `<span style="color: #4caf50; font-size: 12px;"> (Coupon: ${order.couponCode})</span>` : ''}
              </div>
            </div>
          </div>
          <div class="order-header-right-section">
            <div class="order-header-label">Order ID:</div>
            <div>${Math.random().toString(36).substring(2, 18)}</div>
          </div>
        </div>
        <div class="order-details-grid">
          ${orderItemsHTML}
        </div>
      </div>
    `
    
      console.log(`${formatCurrency(order.totalCents)}`);
  })

  ordersGrid.innerHTML = ordersHTML

  document.querySelectorAll('.track-package-button').forEach((button) => {
  button.addEventListener('click', () => {
    const trackingData = {
      productId: button.dataset.productId,
      productName: button.dataset.productName,
      productImage: button.dataset.productImage,
      productQuantity: button.dataset.productQuantity,
      deliveryDate: button.dataset.deliveryDate,
      orderDate: button.dataset.orderDate
    }
    localStorage.setItem('tracking', JSON.stringify(trackingData))
    window.location.href = 'tracking.html'
  })
})

    document.querySelectorAll('.buy-again-button').forEach((button) => {
    button.addEventListener('click', () => {
      const productId = button.dataset.productId
      addToCart(productId)
      loadFromStorage() 
      updateCartQuantity()
    })
  })
}

function updateCartQuantity() {
  const cart = JSON.parse(localStorage.getItem('cart')) || []
  let cartQuantity = 0
  cart.forEach((cartItem) => {
    cartQuantity += cartItem.quantity
  })
  const cartQuantityElement = document.querySelector('.cart-quantity')
  if (cartQuantityElement) {
    cartQuantityElement.innerText = cartQuantity
  }
}

renderOrders()
updateCartQuantity()
