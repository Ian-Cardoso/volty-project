const form = document.getElementById('loginForm')
const errorMsg = document.getElementById('errorMsg')

import * as forgotPassword from './forgotPassword.js'

form.addEventListener('submit', async (e) => {
  e.preventDefault()

  const email = document.getElementById('email').value
  const password = document.getElementById('password').value

  try {
    const res = await fetch('http://localhost:3000/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    })

    const data = await res.json()

    if (!res.ok) {
      errorMsg.textContent = data.error
      if (res.status === 401 && data.error && data.error.toLowerCase().includes('not found')) {
        setTimeout(() => {
          window.location.href = 'register.html'
        }, 1500)
      }
      return
    }
  
    localStorage.removeItem('cart')
    localStorage.removeItem('wishlist')
    localStorage.setItem('userId', data.userId)
    localStorage.setItem('accessToken', data.accessToken)
    window.location.href = 'volty.html'

  } catch {
    errorMsg.textContent = 'Error connecting to server.'
  }
})

// Forgot password handler
document.getElementById('forgotPasswordLink')?.addEventListener('click', async (e) => {
  e.preventDefault()
  const email = document.getElementById('email').value.trim()
  if (!email) {
    errorMsg.textContent = 'Enter your email first'
    return
  }
  try {
    await forgotPassword.forgotPassword(email)
    errorMsg.textContent = ''
  } catch (error) {
    errorMsg.textContent = error.message
  }
})
