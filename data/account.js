const userId = localStorage.getItem('userId')
const token = localStorage.getItem('accessToken')

// if (!userId || !token) {
//   alert('User not logged in')
//   window.location.href = 'login.html'
// }

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

fetch(`http://localhost:3000/me/${userId}`, {
  method: 'GET',
  headers: { 'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json'
}
})
  .then(res => {
    if (res.status === 401 || res.status === 403) {
      throw new Error('Session expired. Please log in again')
    }
    return res.json()
  })
  .then(user => {
    name.value = user.name || ''
    email.value = user.email || ''
    cep.value = user.cep || ''
    street.value = user.street || ''
    city.value = user.city || ''
    state.value = user.state || ''
  })
  // .catch(err => {
  //   console.error(err);
  //   window.location.href = 'login.html'
  // })

saveProfile.onclick = saveAddress.onclick = () => {
  fetch(`http://localhost:3000/me/${userId}`, {
    method: 'PUT',
    headers: { 
      'Content-Type': 'application/json' ,
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      name: name.value,
      cep: cep.value,
      street: street.value,
      city: city.value,
      state: state.value
    })
  })
  .then(res => res.json())
 .then(() => {
    Swal.fire({
      title: "Profile Updated",
      text: "Your profile has been updated successfully!",
      icon: "success"
    });
  })
  .catch(err => console.error('Erro ao atualizar:', err));
}

changePassword.onclick = () => {
  fetch(`http://localhost:3000/me/${userId}/password`, {
    method: 'PUT',
    headers: { 
      'Content-Type': 'application/json' ,
      'Authorization' : `Bearer ${token}`
    },
    body: JSON.stringify({
      currentPassword: prompt('Enter your current password:'),
      newPassword: newPassword.value
    })
  })
  .then(() => {
    Swal.fire({
      title: "Password Updated",
      text: "Password updated successfully",
      icon: "success"
    });
    newPassword.value = '';
  })
  .catch(err => {
    Swal.fire("Error", err.message, "error");
  });
};