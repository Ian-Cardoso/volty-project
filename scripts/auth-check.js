const accountLink = document.getElementById('accountLink')
const userId = localStorage.getItem('userId')

if (!userId) {
  accountLink.addEventListener('click', (e) => {
    e.preventDefault()
    alert('Log in to access your account.')
    window.location.href = 'html/\login.html'
  })
}

