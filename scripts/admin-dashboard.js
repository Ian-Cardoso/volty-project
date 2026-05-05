const jwtTokenInput = document.getElementById('jwtToken')
const saveTokenBtn = document.getElementById('saveTokenBtn')
const productForm = document.getElementById('productForm')
const clearBtn = document.getElementById('clearBtn')
const messageBox = document.getElementById('messageBox')
const previewImage = document.getElementById('previewImage')
const previewTitle = document.getElementById('previewTitle')
const previewDescription = document.getElementById('previewDescription')
const previewPrice = document.getElementById('previewPrice')
const previewStock = document.getElementById('previewStock')

const inputs = {
  name: document.getElementById('name'),
  price: document.getElementById('price'),
  imageUrl: document.getElementById('imageUrl'),
  description: document.getElementById('description'),
  inStock: document.getElementById('inStock')
}

const ADMIN_TOKEN_KEY = 'volty_admin_token'

function showMessage(message, type = 'success') {
  messageBox.textContent = message
  messageBox.className = `message-box ${type}`
}

function loadToken() {
  const saved = localStorage.getItem(ADMIN_TOKEN_KEY)
  if (saved) {
    jwtTokenInput.value = saved
    showMessage('Token carregado. Pronto para cadastrar produtos.', 'success')
  }
}

function updatePreview() {
  const imageUrl = inputs.imageUrl.value.trim()
  previewImage.style.backgroundImage = imageUrl ? `url('${imageUrl}')` : 'none'
  previewImage.textContent = imageUrl ? '' : 'Preview'
  previewTitle.textContent = inputs.name.value || 'Nome do produto'
  previewDescription.textContent = inputs.description.value || 'A descrição aparecerá aqui conforme você digita.'
  previewPrice.textContent = inputs.price.value ? `R$ ${parseFloat(inputs.price.value).toFixed(2)}` : 'R$ 0,00'
  previewStock.textContent = inputs.inStock.value === 'true' ? 'Em estoque' : 'Fora de estoque'
}

saveTokenBtn.addEventListener('click', () => {
  const token = jwtTokenInput.value.trim()
  if (!token) {
    showMessage('Informe um token JWT válido antes de salvar.', 'error')
    return
  }
  localStorage.setItem(ADMIN_TOKEN_KEY, token)
  showMessage('Token salvo com sucesso.', 'success')
})

productForm.addEventListener('submit', async (event) => {
  event.preventDefault()

  const token = localStorage.getItem(ADMIN_TOKEN_KEY)
  if (!token) {
    showMessage('É preciso salvar o token JWT de administrador.', 'error')
    return
  }

  const payload = {
    name: inputs.name.value.trim(),
    description: inputs.description.value.trim(),
    price: Number(inputs.price.value),
    imageUrl: inputs.imageUrl.value.trim(),
    inStock: inputs.inStock.value === 'true'
  }

  try {
    const response = await fetch('/admin/products', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    })

    const data = await response.json()
    if (!response.ok) {
      throw new Error(data.error || 'Falha ao cadastrar produto')
    }

    showMessage('Produto cadastrado com sucesso!', 'success')
    productForm.reset()
    updatePreview()
  } catch (error) {
    showMessage(error.message, 'error')
  }
})

clearBtn.addEventListener('click', () => {
  productForm.reset()
  updatePreview()
  showMessage('Campos limpos.', 'success')
})

Object.values(inputs).forEach((input) => {
  input.addEventListener('input', updatePreview)
})

loadToken()
updatePreview()
