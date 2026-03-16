import { products } from '../data/products.js'
import { cart, addToCart } from '../data/cart.js'
import { addToWishlist, removeFromWishlist, isInWishlist } from '../data/wishlist.js'
import { createReview, getProductReviews, markReviewHelpful, renderReviews } from '../data/reviews.js'

const urlParams = new URLSearchParams(window.location.search)
const productId = urlParams.get('id')

if (!productId) {
  alert('Product not found')
  window.location.href = 'html/\volty.html'
}

let currentProduct = null
let isInWishlistState = false

document.addEventListener('DOMContentLoaded', async () => {
  await loadProduct()
  await loadReviews()
  updateCartQuantity()
})

async function loadProduct() {
  currentProduct = products.find(p => p.id === productId)

  if (!currentProduct) {
    alert('Product not found')
    window.location.href = 'html/\volty.html'
    return
  }

  document.getElementById('productName').textContent = currentProduct.name
  document.getElementById('productImage').src = currentProduct.image
  document.getElementById('productImage').alt = currentProduct.name
  document.getElementById('productStars').src = currentProduct.getStarsUrl()
  document.getElementById('ratingCount').textContent = `${currentProduct.rating.count} reviews`
  document.getElementById('productPrice').textContent = currentProduct.getPrice()
  document.getElementById('productDescription').textContent = `
    High-quality product with excellent ratings. 
    This item is available in multiple variations and is perfect for your needs.
  `

  isInWishlistState = await isInWishlist(productId)
  updateWishlistButton()

  document.getElementById('addToCartBtn').addEventListener('click', handleAddToCart)
  document.getElementById('addToWishlistBtn').addEventListener('click', handleWishlist)
  document.getElementById('submitReviewBtn').addEventListener('click', handleSubmitReview)
}

function updateWishlistButton() {
  const btn = document.getElementById('addToWishlistBtn')
  if (isInWishlistState) {
    btn.classList.add('in-wishlist')
    btn.textContent = '♥ Remove from Wishlist'
  } else {
    btn.classList.remove('in-wishlist')
    btn.textContent = '♡ Add to Wishlist'
  }
}

async function handleAddToCart() {
  const quantity = parseInt(document.getElementById('quantitySelect').value)

  for (let i = 0; i < quantity; i++) {
    addToCart(productId)
  }

  updateCartQuantity()

  const btn = document.getElementById('addToCartBtn')
  const originalText = btn.textContent
  btn.textContent = '✓ Added to Cart!'
  btn.disabled = true

  setTimeout(() => {
    btn.textContent = originalText
    btn.disabled = false
  }, 1500)
}

async function handleWishlist() {
  if (isInWishlistState) {
    await removeFromWishlist(productId)
    isInWishlistState = false
  } else {
    await addToWishlist(productId)
    isInWishlistState = true
  }

  updateWishlistButton()
}

async function handleSubmitReview() {
  const userId = localStorage.getItem('userId')

  if (!userId) {
    alert('Please login to leave a review')
    window.location.href = 'html/\login.html'
    return
  }

  const rating = document.getElementById('reviewRating').value
  const title = document.getElementById('reviewTitle').value
  const comment = document.getElementById('reviewComment').value
  const messageEl = document.getElementById('reviewMessage')

  if (!rating) {
    messageEl.textContent = '❌ Please select a rating'
    messageEl.style.color = '#d32f2f'
    return
  }

  if (!title.trim()) {
    messageEl.textContent = '❌ Please enter a title'
    messageEl.style.color = '#d32f2f'
    return
  }

  if (!comment.trim()) {
    messageEl.textContent = '❌ Please enter a comment'
    messageEl.style.color = '#d32f2f'
    return
  }

  try {
    const success = await createReview(productId, rating, title, comment)

    if (success) {
      messageEl.textContent = '✓ Review submitted successfully!'
      messageEl.style.color = '#4caf50'

      document.getElementById('reviewRating').value = ''
      document.getElementById('reviewTitle').value = ''
      document.getElementById('reviewComment').value = ''

      setTimeout(() => {
        loadReviews()
        messageEl.textContent = ''
      }, 1500)
    } else {
      messageEl.textContent = '❌ Failed to submit review'
      messageEl.style.color = '#d32f2f'
    }
  } catch (error) {
    messageEl.textContent = '❌ Error submitting review'
    messageEl.style.color = '#d32f2f'
  }
}

async function loadReviews() {
  const reviews = await getProductReviews(productId)
  const reviewsList = document.getElementById('reviewsList')

  if (!reviews || reviews.length === 0) {
    reviewsList.innerHTML = '<p class="no-reviews">No reviews yet. Be the first to review!</p>'
    return
  }

  let html = '<div class="reviews-list">'

  reviews.forEach(review => {
    const stars = '⭐'.repeat(review.rating)
    const date = new Date(review.created_at).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })

    html += `
      <div class="review-card">
        <div class="review-header">
          <div class="review-rating">
            ${stars}
            <span class="rating-text">${review.rating}/5</span>
          </div>
          <div class="review-date">${date}</div>
        </div>

        <h4 class="review-title">${review.title}</h4>
        <p class="review-comment">${review.comment}</p>

        <button class="helpful-btn" onclick="window.markAsHelpful(${review.id})">
          👍 Helpful (${review.helpful_count})
        </button>
      </div>
    `
  })

  html += '</div>'
  reviewsList.innerHTML = html
}

window.markAsHelpful = async (reviewId) => {
  const success = await markReviewHelpful(reviewId)
  if (success) {
    await loadReviews()
  }
}

function updateCartQuantity() {
  let cartQuantity = 0

  cart.forEach((cartItem) => {
    cartQuantity += cartItem.quantity
  })

  document.querySelector('.js-cart-quantity').innerHTML = cartQuantity
}
