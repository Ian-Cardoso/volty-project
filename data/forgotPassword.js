// Forgot Password Handler - for login page "Forgot password?" link
// No import - use CDN script tag in HTML
// Swal is global

export async function forgotPassword(email) {
  try {
    const response = await fetch('http://localhost:3000/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to send reset email'); 

        alert('Email enviado! Verifique sua caixa de entrada (e spam)');
  } catch (error) {
    alert('Erro: ' + error.message);
  }

    // if (!response.ok) {
    //   const error = await response.json();
    //   throw new Error(error.error || 'Failed to send reset email');
    // }

  //   Swal.fire({
  //     icon: 'success',
  //     title: 'Email enviado!',
  //     text: 'Verifique sua caixa de entrada (e spam) para o link de redefinição.',
  //     timer: 4000,
  //     timerProgressBar: true
  //   });
  // } catch (error) {
  //   Swal.fire({
  //     icon: 'error',
  //     title: 'Erro',
  //     text: error.message
  //   });
  // }
}