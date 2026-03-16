/**
 * EXEMPLO DE INTEGRAÇÃO - Como usar o módulo auth.js
 * 
 * Este arquivo mostra como usar o módulo de autenticação
 * em páginas que precisam acessar dados protegidos.
 */

import { apiCall, isAuthenticated, getUserId, logout } from './auth.js';

// ============================================================
// 1. VERIFICAR SE ESTÁ LOGADO (na inicialização da página)
// ============================================================

function initNaProducaoDeBrowser() {
  if (!isAuthenticated()) {
    console.log('Não está autenticado, redirecionando...');
    window.location.href = 'html/login.html';
    return;
  }
  
  console.log('Usuário logado:', getUserId());
}

// ============================================================
// 2. CARREGAR DADOS DO USUÁRIO
// ============================================================

async function loadUserProfile() {
  try {
    const userId = getUserId();
    
    // Usar apiCall em vez de fetch direto
    // Ela cuida automaticamente de renovar token se necessário
    const response = await apiCall(`/me/${userId}`);
    const userData = await response.json();
    
    console.log('Dados do usuário carregados:', userData);
    
    // Atualizar UI com dados
    document.querySelector('.user-name').textContent = userData.name;
    document.querySelector('.user-email').textContent = userData.email;
    
  } catch (error) {
    console.error('Erro ao carregar perfil:', error);
    // apiCall automaticamente redireciona se token inválido
  }
}

// ============================================================
// 3. ATUALIZAR DADOS DO USUÁRIO
// ============================================================

async function updateUserProfile(name, cep, street, city, state) {
  try {
    const userId = getUserId();
    
    // POST, PUT, DELETE - tudo com apiCall
    const response = await apiCall(`/me/${userId}`, {
      method: 'PUT',
      body: { name, cep, street, city, state }
    });
    
    const result = await response.json();
    console.log('Perfil atualizado:', result);
    
  } catch (error) {
    console.error('Erro ao atualizar perfil:', error);
  }
}

// ============================================================
// 4. BUSCAR PEDIDOS
// ============================================================

async function loadUserOrders() {
  try {
    const userId = getUserId();
    
    const response = await apiCall(`/orders/${userId}`);
    const orders = await response.json();
    
    console.log('Pedidos carregados:', orders);
    renderOrders(orders);
    
  } catch (error) {
    console.error('Erro ao carregar pedidos:', error);
  }
}

// ============================================================
// 5. CRIAR NOVO PEDIDO
// ============================================================

async function createOrder(cart, couponCode) {
  try {
    const userId = getUserId();
    
    const response = await apiCall('/orders', {
      method: 'POST',
      body: {
        userId,
        cart,
        couponCode
      }
    });
    
    const order = await response.json();
    console.log('Pedido criado:', order);
    
  } catch (error) {
    console.error('Erro ao criar pedido:', error);
  }
}

// ============================================================
// 6. BUSCAR WISHLIST
// ============================================================

async function loadWishlist() {
  try {
    const userId = getUserId();
    
    const response = await apiCall(`/wishlist/${userId}`);
    const wishlist = await response.json();
    
    console.log('Wishlist carregada:', wishlist);
    
  } catch (error) {
    console.error('Erro ao carregar wishlist:', error);
  }
}

// ============================================================
// 7. ADICIONAR À WISHLIST
// ============================================================

async function addToWishlist(productId) {
  try {
    const userId = getUserId();
    
    const response = await apiCall('/wishlist', {
      method: 'POST',
      body: { userId, productId }
    });
    
    console.log('Adicionado à wishlist');
    
  } catch (error) {
    console.error('Erro ao adicionar à wishlist:', error);
  }
}

// ============================================================
// 8. REMOVER DA WISHLIST
// ============================================================

async function removeFromWishlist(productId) {
  try {
    const userId = getUserId();
    
    await apiCall(`/wishlist/${userId}/${productId}`, {
      method: 'DELETE'
    });
    
    console.log('Removido da wishlist');
    
  } catch (error) {
    console.error('Erro ao remover da wishlist:', error);
  }
}

// ============================================================
// 9. FAZER LOGOUT
// ============================================================

function handleLogout() {
  logout(); // Limpa tokens e redireciona para login
}

// ============================================================
// EXEMPLO DE USO EM UMA PÁGINA (como em account.html)
// ============================================================

/*
// No arquivo HTML ou no script carregado na página:

import { loadUserProfile, updateUserProfile, handleLogout } from './authExample.js';

// Quando página carrega
document.addEventListener('DOMContentLoaded', loadUserProfile);

// Quando clica em "Salvar Perfil"
document.getElementById('saveBtn').addEventListener('click', async () => {
  const name = document.getElementById('nameInput').value;
  const cep = document.getElementById('cepInput').value;
  const street = document.getElementById('streetInput').value;
  const city = document.getElementById('cityInput').value;
  const state = document.getElementById('stateInput').value;
  
  await updateUserProfile(name, cep, street, city, state);
});

// Quando clica em "Logout"
document.getElementById('logoutBtn').addEventListener('click', handleLogout);
*/

// ============================================================
// PONTOS-CHAVE
// ============================================================

/**
 * ✅ SEMPRE USE apiCall() em vez de fetch() em páginas protegidas:
 * 
 * ❌ ERRADO:
 * const res = await fetch('/me/1');
 * 
 * ✅ CORRETO:
 * const res = await apiCall('/me/1');
 * 
 * 
 * ✅ BENEFÍCIOS automáticos de apiCall():
 * - Adiciona o token no cabeçalho automaticamente
 * - Detecta token expirado (403)
 * - Renova token automaticamente com refreshToken
 * - Retenta a requisição com novo token
 * - Redireciona para login se tudo falhar
 * - Você não precisa se preocupar com nada disso
 */

export {
  initNaProducaoDeBrowser,
  loadUserProfile,
  updateUserProfile,
  loadUserOrders,
  createOrder,
  loadWishlist,
  addToWishlist,
  removeFromWishlist,
  handleLogout
};
