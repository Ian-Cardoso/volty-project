const form = document.getElementById('loginForm')
const errorMsg = document.getElementById('errorMsg')

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
      return
    }

    localStorage.setItem('userId', data.userId)
    window.location.href = 'volty.html'

  } catch {
    errorMsg.textContent = 'Error connecting to server.'
  }
})
