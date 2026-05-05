const form = document.getElementById('registerForm')
const errorMsg = document.getElementById('errorMsg')

const passwordInput = document.getElementById('password')
const confirmPasswordInput = document.getElementById('confirmPassword')
const togglePassword = document.getElementById('togglePassword')
const toggleConfirmPassword = document.getElementById('toggleConfirmPassword')

togglePassword.addEventListener('click', () => {
  const isPassword = passwordInput.type === 'password'

  passwordInput.type = isPassword ? 'text' : 'password'

  togglePassword.classList.toggle('fa-eye')
  togglePassword.classList.toggle('fa-eye-slash')
})

toggleConfirmPassword.addEventListener('click', () => {
  const isPassword = confirmPasswordInput.type === 'password'

  confirmPasswordInput.type = isPassword ? 'text' : 'password'

  toggleConfirmPassword.classList.toggle('fa-eye')
  toggleConfirmPassword.classList.toggle('fa-eye-slash')
})

form.addEventListener('submit', async (e) => {
  e.preventDefault()

  const name = document.getElementById('name').value
  const email = document.getElementById('email').value
  const password = passwordInput.value
  const confirm = confirmPasswordInput.value

  if (password !== confirm) {
    errorMsg.textContent = 'Passwords does not match.'
    return
  }

  try {
    const response = await fetch('http://localhost:3000/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password })
    })

    const data = await response.json()

    if (!response.ok) {
      errorMsg.textContent = data.error
      return
    }

    Swal.fire({
      icon: 'success',
      title: 'Account Created',
      text: 'Your account has been created successfully!',
    }).then(() => {
      window.location.href = 'login.html'
    })

    form.reset()
  } catch (err) {
    errorMsg.textContent = 'Error connecting to the server.'
  }
})
