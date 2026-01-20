// ========================================
// EXEMPLO DE INTEGRAÇÃO DE REVIEWS
// Adicione isso na página de detalhes do produto
// ========================================

import { getProductReviews, createReview, renderReviews } from '../data/reviews.js'

// Exemplo de função para carregar reviews de um produto
export async function loadProductReviews(productId) {
  const reviewsContainer = document.getElementById('product-reviews')
  
  if (!reviewsContainer) return

  // Carregar reviews existentes
  const reviews = await getProductReviews(productId)
  
  // Renderizar reviews
  reviewsContainer.innerHTML = renderReviews(reviews)

  // Adicionar formulário para novo review (se logado)
  const userId = localStorage.getItem('userId')
  if (userId) {
    addReviewForm(productId)
  }
}

function addReviewForm(productId) {
  const form = document.createElement('div')
  form.className = 'review-form'
  form.innerHTML = `
    <h4>Leave a Review</h4>
    
    <div class="form-group">
      <label>Rating</label>
      <div class="star-rating">
        <button class="star" data-rating="1">⭐</button>
        <button class="star" data-rating="2">⭐</button>
        <button class="star" data-rating="3">⭐</button>
        <button class="star" data-rating="4">⭐</button>
        <button class="star" data-rating="5">⭐</button>
      </div>
    </div>

    <div class="form-group">
      <label>Title</label>
      <input type="text" id="reviewTitle" placeholder="Brief summary" maxlength="100">
    </div>

    <div class="form-group">
      <label>Comment</label>
      <textarea id="reviewComment" placeholder="Share your experience..." rows="4" maxlength="500"></textarea>
    </div>

    <button id="submitReview" class="submit-review-btn">Submit Review</button>
  `

  document.getElementById('product-reviews').appendChild(form)

  let selectedRating = 0

  document.querySelectorAll('.star').forEach(star => {
    star.addEventListener('click', (e) => {
      selectedRating = e.target.dataset.rating
      document.querySelectorAll('.star').forEach(s => s.classList.remove('active'))
      for (let i = 0; i < selectedRating; i++) {
        document.querySelectorAll('.star')[i].classList.add('active')
      }
    })
  })

  document.getElementById('submitReview').addEventListener('click', async () => {
    const title = document.getElementById('reviewTitle').value
    const comment = document.getElementById('reviewComment').value

    if (!selectedRating || !title || !comment) {
      alert('Please fill all fields')
      return
    }

    const success = await createReview(productId, selectedRating, title, comment)
    
    if (success) {
      alert('Review submitted successfully!')
      // Recarregar reviews
      loadProductReviews(productId)
    }
  })
}

// ========================================
// CSS PARA REVIEWS
// ========================================

const reviewStyles = `
.review-form {
  margin-top: 30px;
  padding: 20px;
  border: 1px solid #ddd;
  border-radius: 8px;
  background: #f9f9f9;
}

.review-form h4 {
  margin-top: 0;
  color: #222;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  font-weight: 500;
  margin-bottom: 8px;
  color: #333;
}

.star-rating {
  display: flex;
  gap: 5px;
}

.star {
  background: none;
  border: none;
  font-size: 28px;
  cursor: pointer;
  opacity: 0.3;
  transition: opacity 0.2s;
}

.star:hover,
.star.active {
  opacity: 1;
}

#reviewTitle,
#reviewComment {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-family: inherit;
  font-size: 14px;
}

#reviewTitle:focus,
#reviewComment:focus {
  outline: none;
  border-color: #ff9900;
  box-shadow: 0 0 0 2px rgba(255, 153, 0, 0.1);
}

.submit-review-btn {
  padding: 10px 20px;
  background: #ff9900;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  transition: background 0.3s;
}

.submit-review-btn:hover {
  background: #e68a00;
}

.reviews-container {
  margin-top: 20px;
}

.review-card {
  padding: 15px;
  border: 1px solid #eee;
  border-radius: 4px;
  margin-bottom: 15px;
  background: white;
}

.review-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
  font-size: 12px;
  color: #666;
}

.review-rating {
  font-weight: 500;
}

.review-title {
  margin: 10px 0;
  color: #222;
  font-size: 16px;
}

.review-comment {
  color: #555;
  line-height: 1.5;
  margin: 10px 0;
}

.helpful-btn {
  padding: 8px 12px;
  background: #f0f0f0;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s;
}

.helpful-btn:hover {
  background: #e0e0e0;
}
`

// Injetar estilos
const styleEl = document.createElement('style')
styleEl.textContent = reviewStyles
document.head.appendChild(styleEl)

// ========================================
// COMO USAR EM UMA PÁGINA DE PRODUTO
// ========================================

/*
Em uma página de produto (ex: product.html):

1. Adicione um container para reviews:
   <div id="product-reviews"></div>

2. Importe e chame a função:
   import { loadProductReviews } from './modules/reviews-integration.js'
   
   const productId = 'seu-product-id'
   loadProductReviews(productId)

3. Pronto! Reviews vão carregar e exibir
*/
