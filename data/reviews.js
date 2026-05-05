export async function createReview(productId, rating, title, comment) {
  const userId = parseInt(localStorage.getItem('userId'))
  const token = localStorage.getItem('accessToken')
  
  if (!userId) {
    alert('Please login to leave a review')
    return false
  }

  if (!rating || rating < 1 || rating > 5) {
    alert('Rating must be between 1 and 5')
    return false
  }

  try {
    const response = await fetch('http://localhost:3000/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json',
                  'Authorization' : `Bearer ${token}`
      },
      body: JSON.stringify({ 
        userId, 
        productId, 
        rating: parseInt(rating), 
        title, 
        comment 
      })
    })

    if (!response.ok) throw new Error('Failed to create review')
    
    console.log('Review created!')
    return true
  } catch (error) {
    console.error('Error:', error)
    return false
  }
}

export async function getProductReviews(productId) {
  try {
    const response = await fetch(`http://localhost:3000/reviews/${productId}`)
    
    if (!response.ok) return []
    
    const reviews = await response.json()
    return reviews
  } catch (error) {
    console.error('Error:', error)
    return []
  }
}

export async function markReviewHelpful(reviewId) {
  try {
    const response = await fetch(
      `http://localhost:3000/reviews/${reviewId}/helpful`,
      { method: 'PUT' }
    )

    if (!response.ok) throw new Error('Failed to mark as helpful')
    
    return true
  } catch (error) {
    console.error('Error:', error)
    return false
  }
}

export function renderReviews(reviews) {
  if (!reviews.length) {
    return '<p>No reviews yet</p>'
  }

  let html = '<div class="reviews-container">'
  
  reviews.forEach(review => {
    const stars = '⭐'.repeat(review.rating)
    html += `
      <div class="review-card">
        <div class="review-header">
          <span class="review-rating">${stars} (${review.rating}/5)</span>
          <span class="review-date">${new Date(review.created_at).toLocaleDateString()}</span>
        </div>
        <h4 class="review-title">${review.title || 'No title'}</h4>
        <p class="review-comment">${review.comment || ''}</p>
        <button class="helpful-btn" onclick="markAsHelpful(${review.id})">
          👍 Helpful (${review.helpful_count})
        </button>
      </div>
    `
  })

  html += '</div>'
  return html
}
