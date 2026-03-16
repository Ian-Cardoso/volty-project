import { getWishlist, removeFromWishlist } from '../data/wishlist.js'
import { products } from '../data/products.js'
import { addToCart } from '../data/cart.js'
import { formatCurrency } from './utils/money.js'

const userId = localStorage.getItem('userId')

if (!userId) {
  alert('Please login to view your wishlist')
  window.location.href = 'html/\login.html'
}

document.addEventListener('DOMContentLoaded', async () => {
  await loadWishlist()
  updateCartQuantity()
})

async function loadWishlist() {
  const wishlistItems = await getWishlist()
  const wishlistGrid = document.querySelector('.js-wishlist-grid')
  const emptyMessage = document.getElementById('emptyMessage')

  if (!wishlistItems.length) {
    emptyMessage.style.display = 'block'
    return
  }

  let html = ''

  wishlistItems.forEach(item => {
    const product = products.find(p => p.id === item.product_id)
    
    if (!product) return

    html += `
      <div class="wishlist-item">
        <div class="item-image">
          <img src="${product.image}" alt="${product.name}">
        </div>

        <div class="item-details">
          <h3 class="item-name">${product.name}</h3>
          
          <div class="item-rating">
            <img src="${product.getStarsUrl()}">
            <span>${product.rating.count} reviews</span>
          </div>

          <div class="item-price">
            ${product.getPrice()}
          </div>

          <div class="item-actions">
            <button class="add-to-cart-btn" data-product-id="${product.id}">
              Add to Cart
            </button>
            <button class="remove-btn" data-product-id="${product.id}">
              Remove from Wishlist
            </button>
          </div>
        </div>
      </div>
    `
  })

  wishlistGrid.innerHTML = html

  // Event listeners
  document.querySelectorAll('.add-to-cart-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const productId = btn.dataset.productId
      addToCart(productId)
      updateCartQuantity()
      alert('Added to cart!')
    })
  })

  document.querySelectorAll('.remove-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const productId = btn.dataset.productId
      await removeFromWishlist(productId)
      await loadWishlist()
      updateCartQuantity()
    })
  })
}

function updateCartQuantity() {
  const cart = JSON.parse(localStorage.getItem('cart')) || []
  let quantity = 0
  
  cart.forEach(item => {
    quantity += item.quantity
  })

  const element = document.querySelector('.js-cart-quantity')
  if (element) {
    element.textContent = quantity
  }
}

