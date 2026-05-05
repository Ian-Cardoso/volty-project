import * as auth from '../scripts/auth.js'

// Get URL params
function getUrlParams() {
  const params = new URLSearchParams(window.location.search);
  return {
    token: params.get('token'),
    userId: params.get('userId')
  };
}

function initPasswordToggles() {
  const togglePassword = document.getElementById('togglePassword');
  const toggleConfirmPassword = document.getElementById('toggleConfirmPassword');
  const newPasswordInput = document.getElementById('newPassword');
  const confirmPasswordInput = document.getElementById('confirmPassword');

  togglePassword?.addEventListener('click', () => {
    const type = newPasswordInput.type === 'password' ? 'text' : 'password';
    newPasswordInput.type = type;
    togglePassword.classList.toggle('fa-eye');
    togglePassword.classList.toggle('fa-eye-slash');
  });

  toggleConfirmPassword?.addEventListener('click', () => {
    const type = confirmPasswordInput.type === 'password' ? 'text' : 'password';
    confirmPasswordInput.type = type;
    toggleConfirmPassword.classList.toggle('fa-eye');
    toggleConfirmPassword.classList.toggle('fa-eye-slash');
  });
}

export async function forgotPassword(email) {
  try {
    const response = await fetch('/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to send reset email');
    }

    return await response.json();
  } catch (error) {
    console.error('Forgot password error:', error);
    throw error;
  }
}

// Reset password using token
export async function resetPassword(token, userId, newPassword) {
  try {
    const response = await fetch('/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, userId, newPassword })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Reset failed');
    }

    return await response.json();
  } catch (error) {
    console.error('Reset password error:', error);
    throw error;
  }
}

// Main form handler
document.addEventListener('DOMContentLoaded', async () => {
  const form = document.getElementById('resetForm');
  const errorMsg = document.getElementById('errorMsg');
  const statusMsg = document.getElementById('statusMsg');
  const resetBtn = document.getElementById('resetBtn');

  initPasswordToggles();

  const { token, userId } = getUrlParams();

  if (!token || !userId) {
    errorMsg.textContent = 'Invalid reset link. Please request a new one.';
    resetBtn.disabled = true;
    return;
  }

  statusMsg.textContent = 'Link válido por 15 minutos';

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (newPassword !== confirmPassword) {
      errorMsg.textContent = 'Senhas não coincidem';
      return;
    }

    if (newPassword.length < 8) {
      errorMsg.textContent = 'Senha deve ter pelo menos 8 caracteres';
      return;
    }

    try {
      resetBtn.disabled = true;
      resetBtn.textContent = 'Resetando...';
      errorMsg.textContent = '';

      const result = await resetPassword(token, userId, newPassword);

      Swal.fire({
        icon: 'success',
        title: 'Senha Alterada!',
        text: 'Sua senha foi redefinida com sucesso.',
        timer: 2000,
        timerProgressBar: true
      }).then(() => {
        window.location.href = 'login.html';
      });
    } catch (error) {
      errorMsg.textContent = error.message;
    } finally {
      resetBtn.disabled = false;
      resetBtn.textContent = 'Reset Password';
    }
  });
});