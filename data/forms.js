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

// Form submission

form.addEventListener('submit', (e) => {
  e.preventDefault()

  const password = passwordInput.value
  const confirm = confirmPasswordInput.value

  if (password !== confirm) {
    errorMsg.textContent = 'The passwords do not match.'
    return
  }

  errorMsg.textContent = ''
Swal.fire({
  title: "success",
  text: "Registration completed successfully!",
  icon: "success"
});
})