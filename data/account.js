

const userId = localStorage.getItem('userId')

if (!userId) {
  alert('User not logged in')
  window.location.href = 'login.html'
}

const name = document.getElementById('name')
const email = document.getElementById('email')
const cep = document.getElementById('cep')
const street = document.getElementById('street')
const city = document.getElementById('city')
const state = document.getElementById('state')
const newPassword = document.getElementById('newPassword')

const saveProfile = document.getElementById('saveProfile')
const saveAddress = document.getElementById('saveAddress')
const changePassword = document.getElementById('changePassword')

fetch(`http://localhost:3000/me/${userId}`)
  .then(res => res.json())
  .then(user => {
    name.value = user.name
    email.value = user.email
    cep.value = user.cep || ''
    street.value = user.street || ''
    city.value = user.city || ''
    state.value = user.state || ''
  })

saveProfile.onclick = saveAddress.onclick = () => {
  fetch(`http://localhost:3000/me/${userId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: name.value,
      cep: cep.value,
      street: street.value,
      city: city.value,
      state: state.value
    })
  })
  .then(res => res.json())
  .then(() => 
  Swal.fire({
  title: "Profile Updated",
  text: "Your profile has been updated successfully!",
  icon: "success"
}))
}

changePassword.onclick = () => {
  fetch(`http://localhost:3000/me/${userId}/password`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      password: newPassword.value
    })
  })
  .then(res => res.json())
  .then(() => {
   Swal.fire({
  title: "Password Updated",
  text: "Password updated",
  icon: "success"
})
    newPassword.value = ''
  })
}