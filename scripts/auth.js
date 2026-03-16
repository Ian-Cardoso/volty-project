/**
 * Authentication Module - Gerenciamento de JWT com auto-renovação
 * 
 * Este módulo intercepta requisições e cuida automaticamente de:
 * - Enviar o accessToken em cada requisição
 * - Renovar token quando expires (usando refreshToken)
 * - Redirecionar para login se tudo falhar
 * - Limpar dados ao fazer logout
 */

const AUTH_CONFIG = {
  storageKey: 'volty_auth',
  tokenRefreshBuffer: 60000, // 1 minuto antes de expirar, já renova
};

// Recuperar dados de autenticação do sessionStorage
function getAuthData() {
  const data = sessionStorage.getItem(AUTH_CONFIG.storageKey);
  return data ? JSON.parse(data) : null;
}

// Salvar dados de autenticação
function setAuthData(accessToken, refreshToken, userId) {
  sessionStorage.setItem(
    AUTH_CONFIG.storageKey,
    JSON.stringify({ accessToken, refreshToken, userId, timestamp: Date.now() })
  );
}

// Limpar dados de autenticação (logout)
function clearAuthData() {
  sessionStorage.removeItem(AUTH_CONFIG.storageKey);
}

// Verificar se está logado
function isAuthenticated() {
  return getAuthData() !== null;
}

// Obter ID do usuário autenticado
function getUserId() {
  const auth = getAuthData();
  return auth?.userId || null;
}

// Renovar token usando refreshToken
async function refreshAccessToken() {
  const auth = getAuthData();
  if (!auth?.refreshToken) {
    console.warn('[Auth] No refresh token available');
    return false;
  }

  try {
    const response = await fetch('/refresh-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: auth.refreshToken })
    });

    if (!response.ok) {
      console.warn('[Auth] Refresh token failed:', response.status);
      clearAuthData();
      redirectToLogin();
      return false;
    }

    const { accessToken } = await response.json();
    setAuthData(accessToken, auth.refreshToken, auth.userId);
    console.log('[Auth] Token renovado com sucesso');
    return true;
  } catch (error) {
    console.error('[Auth] Erro ao renovar token:', error);
    clearAuthData();
    redirectToLogin();
    return false;
  }
}

// Redirecionar para login
function redirectToLogin() {
  console.log('[Auth] Redirecionando para login...');
  window.location.href = 'html/login.html';
}

// ============================================================
// FUNÇÃO PRINCIPAL: wrapper para fetch com auth automático
// ============================================================

/**
 * Fazer requisição HTTP com autenticação JWT automática
 * 
 * @param {string} url - URL relativa da API (ex: '/me/1')
 * @param {object} options - Opções do fetch (method, body, etc)
 * @returns {Promise<Response>}
 * 
 * @example
 * // Requisição simples
 * const user = await apiCall('/me/1');
 * 
 * @example
 * // Requisição com body
 * await apiCall('/orders', {
 *   method: 'POST',
 *   body: { cart: [...], couponCode: 'PROMO20' }
 * });
 */
async function apiCall(url, options = {}) {
  const auth = getAuthData();

  // Se não está autenticado, redireciona
  if (!auth?.accessToken) {
    console.warn('[Auth] No access token. Redirecting to login');
    redirectToLogin();
    throw new Error('Not authenticated');
  }

  // Preparar headers com token
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${auth.accessToken}`,
    ...options.headers
  };

  // Preparar body se fornecido
  let body = options.body;
  if (body && typeof body === 'object') {
    body = JSON.stringify(body);
  }

  // Fazer requisição
  let response = await fetch(url, {
    ...options,
    headers,
    body
  });

  // Se token expirou (403 ou 401), tentar renovar
  if (response.status === 403 || response.status === 401) {
    console.log('[Auth] Token expirado, tentando renovar...');
    
    const renewed = await refreshAccessToken();
    if (!renewed) {
      throw new Error('Failed to refresh token');
    }

    // Pegar novo token renovado
    const newAuth = getAuthData();
    headers['Authorization'] = `Bearer ${newAuth.accessToken}`;

    // Retentrar requisição com novo token
    response = await fetch(url, {
      ...options,
      headers,
      body
    });
  }

  // Se ainda assim falhar, pode ser erro de autorização real
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    console.error(`[Auth] Request failed: ${response.status}`, error);
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response;
}

// ============================================================
// FUNÇÕES DE LOGIN/LOGOUT
// ============================================================

/**
 * Fazer login
 * @param {string} email 
 * @param {string} password 
 * @returns {Promise<{accessToken, refreshToken, userId}>}
 */
async function login(email, password) {
  try {
    const response = await fetch('/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Login failed');
    }

    const { accessToken, refreshToken, userId } = await response.json();
    setAuthData(accessToken, refreshToken, userId);
    console.log('[Auth] Login successful');
    return { accessToken, refreshToken, userId };
  } catch (error) {
    console.error('[Auth] Login error:', error);
    throw error;
  }
}

/**
 * Fazer logout
 */
function logout() {
  clearAuthData();
  console.log('[Auth] Logged out');
  redirectToLogin();
}

/**
 * Registrar novo usuário
 * @param {string} name 
 * @param {string} email 
 * @param {string} password 
 * @returns {Promise}
 */
async function register(name, email, password) {
  try {
    const response = await fetch('/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Registration failed');
    }

    const data = await response.json();
    console.log('[Auth] Registration successful');
    return data;
  } catch (error) {
    console.error('[Auth] Registration error:', error);
    throw error;
  }
}

// ============================================================
// EXPORTAR PARA USO EM OUTROS MÓDULOS
// ============================================================

export {
  isAuthenticated,
  getUserId,
  getAuthData,
  setAuthData,
  clearAuthData,
  login,
  logout,
  register,
  apiCall,
  redirectToLogin,
  refreshAccessToken
};
