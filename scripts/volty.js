import { cart, addToCart, loadFromStorage } from '../data/cart.js'
import { products } from '../data/products.js'
import { formatCurrency } from './utils/money.js'
import { addToWishlist, removeFromWishlist, isInWishlist } from '../data/wishlist.js'

loadFromStorage()

// Extrair categorias únicas dos keywords
function extractCategories() {
  const categoriesSet = new Set()
  products.forEach(product => {
    if (product.keywords && Array.isArray(product.keywords)) {
      product.keywords.forEach(keyword => {
        // Adiciona categorias principais (as mais genéricas)
        const mainCategories = ['apparel', 'sports', 'kitchen', 'bathroom', 'home', 'accessories', 'shoes', 'jewelry']
        if (mainCategories.includes(keyword.toLowerCase())) {
          categoriesSet.add(keyword)
        }
      })
    }
  })
  return Array.from(categoriesSet).sort()
}

let currentFilter = 'all'
const categories = extractCategories()

function updateCartQuantity () {
  let cartQuantity = 0
            
  cart.forEach((cartItem) => {
    cartQuantity += cartItem.quantity
  })

  document.querySelector('.js-cart-quantity')
  .innerHTML = cartQuantity
}

// Renderizar produtos na grid
function renderProducts(productsToRender) {
  let productsHTML = ''
  productsToRender.forEach((product) => {
    productsHTML += `
    <div class="product-container">
      <div class="product-image-container">
        <img class="product-image" src="${product.image}">
        <button class="wishlist-btn js-wishlist-btn" data-product-id="${product.id}" title="Add to wishlist">
          ♡
        </button>
      </div>
      <div class="product-name limit-text-to-2-lines">
        <a href="product.html?id=${product.id}" class="product-name-link">${product.name}</a>
      </div>
      <div class="product-rating-container">
        <img class="product-rating-stars" src="${product.getStarsUrl()}">
        <div class="product-rating-count link-primary">
          ${product.rating.count}
        </div>
      </div>
      <div class="product-price">
        ${product.getPrice()}
      </div>
      <div class="product-quantity-container js-quantity-selector">
        <select>
          <option selected value="1">1</option>
          <option value="2">2</option>
          <option value="3">3</option>
          <option value="4">4</option>
          <option value="5">5</option>
          <option value="6">6</option>
          <option value="7">7</option>
          <option value="8">8</option>
          <option value="9">9</option>
          <option value="10">10</option>
        </select>
      </div>
      <div class="product-spacer"></div>
      <div class="added-to-cart">
        <img src="../images/icons/checkmark.png">
        Added
      </div>
      <button class="add-to-cart-button button-primary js-add-to-cart" data-product-id="${product.id}">
        Add to Cart
      </button>
    </div>`
  })
  document.querySelector('.js-products-grid').innerHTML = productsHTML
  attachProductEventListeners()
}

// Anexar event listeners aos produtos
function attachProductEventListeners() {
  document.querySelectorAll('.js-add-to-cart').forEach((button) => {
    button.addEventListener('click', () => {
      const productId = button.dataset.productId
      const productContainer = button.closest('.product-container')
      const quantitySelect = productContainer.querySelector('select')
      const selectedQuantity = Number(quantitySelect.value)

      for (let i = 0; i < selectedQuantity; i++) {
        addToCart(productId)
      }
      updateCartQuantity()
    })
  })
}

// Atualizar quantidade do carrinho quando a página carrega
updateCartQuantity()

// Função para filtrar produtos
function filterProducts() {
  const query = document.querySelector('.search-bar').value.trim().toLowerCase()
  
  let filteredProducts = currentFilter === 'all' ? products : 
    products.filter(product => 
      product.keywords?.some(keyword => keyword.toLowerCase() === currentFilter.toLowerCase())
    )
  
  if (query) {
    filteredProducts = filteredProducts.filter(product => {
      const nameMatch = product.name.toLowerCase().includes(query)
      const keywordMatch = product.keywords?.some(keyword =>
        keyword.toLowerCase().includes(query)
      )
      return nameMatch || keywordMatch
    })
  }
  
  renderProducts(filteredProducts)
  setupWishlistHandlers()
}

// Setup handlers para wishlist
async function setupWishlistHandlers() {
  const wishlistBtns = document.querySelectorAll('.js-wishlist-btn')
  
  for (let btn of wishlistBtns) {
    const productId = btn.dataset.productId
    const inWishlist = await isInWishlist(productId)
    if (inWishlist) {
      btn.classList.add('in-wishlist')
      btn.textContent = '♥'
    } else {
      btn.classList.remove('in-wishlist')
      btn.textContent = '♡'
    }
  }

  wishlistBtns.forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.preventDefault()
      const productId = btn.dataset.productId
      const isActive = btn.classList.contains('in-wishlist')

      if (isActive) {
        await removeFromWishlist(productId)
        btn.classList.remove('in-wishlist')
        btn.textContent = '♡'
      } else {
        await addToWishlist(productId)
        btn.classList.add('in-wishlist')
        btn.textContent = '♥'
      }
    })
  })
}

// Renderizar barra de categorias
function renderCategoryFilters() {
  const filterList = document.querySelector('.js-filter-list')
  let filterHTML = ''
  
  categories.forEach(category => {
    filterHTML += `
      <button class="filter-btn js-filter-btn" data-category="${category.toLowerCase()}">
        ${category.charAt(0).toUpperCase() + category.slice(1)}
      </button>
    `
  })
  
  filterList.innerHTML = filterHTML
  
  // Adicionar event listeners aos botões de filtro
  document.querySelectorAll('.js-filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      currentFilter = btn.dataset.category
      updateFilterButtons()
      filterProducts()
    })
  })
}

// Atualizar estado dos botões de filtro
function updateFilterButtons() {
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.classList.remove('filter-btn-active')
  })
  
  if (currentFilter === 'all') {
    document.querySelector('.js-filter-all').classList.add('filter-btn-active')
  } else {
    document.querySelector(`[data-category="${currentFilter}"]`).classList.add('filter-btn-active')
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  // Render categorias
  renderCategoryFilters()
  updateFilterButtons()
  
  // Renderizar todos os produtos inicialmente
  filterProducts()
  setupWishlistHandlers()
  
  // Event listener para search
  const searchInput = document.querySelector('.search-bar')
  searchInput.addEventListener('input', () => {
    filterProducts()
  })
  
  // Event listener para botão "All Products"
  document.querySelector('.js-filter-all').addEventListener('click', () => {
    currentFilter = 'all'
    updateFilterButtons()
    filterProducts()
  })
})

