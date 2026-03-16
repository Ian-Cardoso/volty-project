# 🔐 Como Integrar Autenticação JWT no Projeto

## Problema Resolvido ✅

**Antes (problema):**
```javascript
// Quando token expira:
// 1. Requisição recebe 401/403
// 2. Dados ficam undefined
// 3. Usuário fica preso na página
// 4. Precisa atualizar manualmente
```

**Depois (solução):**
```javascript
// Com o módulo auth.js:
// 1. Requisição recebe 401/403
// 2. Sistema tenta renovar token automaticamente
// 3. Se renovar com sucesso, retenta a requisição
// 4. Se falhar, redireciona para login
// 5. Nenhuma intervenção manual necessária
```

---

## 📦 Arquivos Criados

| Arquivo | Descrição |
|---------|-----------|
| `scripts/auth.js` | Módulo principal de autenticação |
| `scripts/authExample.js` | Exemplos de como usar |
| `docs/JWT_GUIDE.md` | Documentação completa de JWT |

---

## 🚀 Passo 1: Integrar no Login

### Arquivo: `scripts/login.js`

```javascript
import { login } from './auth.js';

// Quando usuário faz login
async function handleLogin(email, password) {
  try {
    const { accessToken, refreshToken, userId } = await login(email, password);
    
    console.log('✓ Login realizado');
    console.log('✓ Tokens armazenados em sessionStorage');
    console.log('✓ Redirecionando para página inicial...');
    
    // Redirecionar para página principal após login
    setTimeout(() => {
      window.location.href = 'volty.html';
    }, 1000);
    
  } catch (error) {
    console.error('✗ Erro no login:', error.message);
    // Mostrar mensagem de erro na UI
    document.getElementById('errorMsg').textContent = error.message;
  }
}

// Ao submeter formulário de login
document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const email = document.getElementById('emailInput').value;
  const password = document.getElementById('passwordInput').value;
  
  await handleLogin(email, password);
});
```

---

## 🚀 Passo 2: Proteger Páginas

### Arquivo: `scripts/auth-check.js` (já existe)

**Coloque este código no início:**

```javascript
import { isAuthenticated, redirectToLogin } from './auth.js';

// Verificar autenticação na inicialização
function checkAuthentication() {
  if (!isAuthenticated()) {
    console.log('⚠️ Usuário não autenticado');
    redirectToLogin();
    return false;
  }
  
  console.log('✓ Usuário autenticado');
  return true;
}

// Executar ao carregar qualquer página protegida
document.addEventListener('DOMContentLoaded', () => {
  if (!checkAuthentication()) {
    return; // Para execução se não autenticado
  }
  
  // Resto do código da página continua apenas se logado
});

export { checkAuthentication };
```

---

## 🚀 Passo 3: Usar em Requisiçõe Protegidas

### Exemplo: Carregar Dados do Usuário

**Antes (problemático):**
```javascript
// Arquivo: scripts/account.js
import { getUserId } from './auth.js';

async function loadProfile() {
  const userId = getUserId();
  
  // ❌ ERRADO - não renovva token
  const response = await fetch(`/me/${userId}`, {
    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
  });
  
  if (response.status === 403) {
    // Usuário fica undefined
    console.log('Token expirou');
    // Precisa renovar manualmente...
  }
}
```

**Depois (com auto-renovação):**
```javascript
// Arquivo: scripts/account.js
import { apiCall, getUserId } from './auth.js';

async function loadProfile() {
  try {
    const userId = getUserId();
    
    // ✅ CORRETO - apiCall cuida de tudo
    const response = await apiCall(`/me/${userId}`);
    const userData = await response.json();
    
    // Se chegou aqui, token é válido (foi renovado se necessário)
    document.querySelector('.user-name').textContent = userData.name;
    document.querySelector('.user-email').textContent = userData.email;
    
  } catch (error) {
    // Se erro ainda persistir, redireciona para login
    console.error('Erro ao carregar perfil:', error);
  }
}

// Executar ao carregar página
document.addEventListener('DOMContentLoaded', loadProfile);
```

---

## 🚀 Passo 4: Exemplos por Endpoint

### Buscar Dados Protegidos (GET)

```javascript
import { apiCall, getUserId } from './auth.js';

// GET /me/:id - Obter profil do usuário
const userId = getUserId();
const response = await apiCall(`/me/${userId}`);
const user = await response.json();

// GET /orders/:userId - Obter pedidos
const response = await apiCall(`/orders/${userId}`);
const orders = await response.json();

// GET /wishlist/:userId - Obter wishlist
const response = await apiCall(`/wishlist/${userId}`);
const wishlist = await response.json();
```

---

### Modificar Dados Protegidos (POST/PUT/DELETE)

```javascript
import { apiCall, getUserId } from './auth.js';

// PUT /me/:id - Atualizar perfil
const userId = getUserId();
const response = await apiCall(`/me/${userId}`, {
  method: 'PUT',
  body: {
    name: 'Novo Nome',
    cep: '12345-678',
    street: 'Rua Nova',
    city: 'São Paulo',
    state: 'SP'
  }
});

// POST /orders - Criar pedido
const response = await apiCall('/orders', {
  method: 'POST',
  body: {
    userId: getUserId(),
    cart: [{ productId: '123', quantity: 2 }],
    couponCode: 'PROMO20'
  }
});

// DELETE /wishlist/:userId/:productId - Remover wishlist
const response = await apiCall(`/wishlist/${userId}/product-123`, {
  method: 'DELETE'
});

// POST /wishlist - Adicionar wishlist
const response = await apiCall('/wishlist', {
  method: 'POST',
  body: {
    userId: getUserId(),
    productId: 'product-456'
  }
});
```

---

## 🚀 Passo 5: Implementar Logout

```javascript
import { logout } from './auth.js';

// Botão de logout na página
document.getElementById('logoutBtn').addEventListener('click', () => {
  if (confirm('Deseja realmente fazer logout?')) {
    logout(); // Limpa tokens e redireciona para login
  }
});
```

---

## 🔄 Fluxo Completo de Autenticação

```
┌──────────────────────────────────────────────────────────────┐
│ 1. PÁGINA DE LOGIN (login.html + login.js)                  │
│    ├─ Usuário preenche email/senha                           │
│    ├─ Clica "Entrar"                                         │
│    └─ Chama: login(email, password)                          │
└──────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────┐
│ 2. AUTENTICAÇÃO (auth.js - função login)                    │
│    ├─ POST /login com email/senha                            │
│    ├─ Recebe: accessToken + refreshToken + userId            │
│    ├─ Salva em sessionStorage                                │
│    └─ Redireciona para volty.html                            │
└──────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────┐
│ 3. PÁGINAS PROTEGIDAS (account.html, checkout.html, etc)    │
│    ├─ Ao carregar, verifica: isAuthenticated()              │
│    ├─ Se false → redirectToLogin()                           │
│    ├─ Se true → Carrega dados com apiCall()                  │
│    └─ apiCall() adiciona token automaticamente               │
└──────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────┐
│ 4. REQUISIÇÕES COM AUTO-RENOVAÇÃO (auth.js - função apiCall)│
│    ├─ Requisição com accessToken OK? ✓ Retorna dados        │
│    ├─ Token expirado (403)? Tenta renovar com refreshToken   │
│    │   ├─ Renovação OK? Retenta requisição original          │
│    │   └─ Renovação falha? Redireciona para login            │
│    └─ Usuário nunca vê undefined ou erro de token            │
└──────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────┐
│ 5. LOGOUT (qualquer página)                                  │
│    ├─ Usuário clica "Sair"                                   │
│    ├─ Chama: logout()                                        │
│    ├─ Limpa sessionStorage (tokens)                          │
│    └─ Redireciona para login.html                            │
└──────────────────────────────────────────────────────────────┘
```

---

## ⚠️ Checklist de Implementação

- [ ] Copiar `scripts/auth.js` para seu projeto
- [ ] Atualizador `scripts/login.js` com função `login()` exportada
- [ ] Adicionar check de autenticação em `scripts/auth-check.js`
- [ ] Substituir `fetch()` por `apiCall()` em páginas protegidas
- [ ] Testar fluxo: login → acesso dados → logout
- [ ] Testar expiração: esperar 15+ min e tentar requisição (deve renovar)
- [ ] Testar refresh token expirado: deve redirecionar para login

---

## 🧪 Testando Auto-Renovação

1. **Fazer login** e copiar o `accessToken`
2. **Decodificar** em https://jwt.io para ver expiração
3. **Restaurar** um `accessToken` expirado no browser console:
   ```javascript
   // Simular token expirado
   const auth = JSON.parse(sessionStorage.getItem('volty_auth'));
   auth.timestamp = Date.now() - (16 * 60 * 1000); // 16 minutos atrás
   sessionStorage.setItem('volty_auth', JSON.stringify(auth));
   ```
4. **Fazer requisição** - deve renovar automaticamente
5. **Verificar console** - deve ver: `[Auth] Token expirado, tentando renovar...`

---

## 🆘 Troubleshooting

| Problema | Causa | Solução |
|----------|-------|---------|
| "Not authenticated" ao carregar | Não fez login | Implementar `login()` primeiro |
| Dados undefined | Token expirou sem renovar | Usar `apiCall()` em vez de `fetch()` |
| Redirecionamento infinito | Refresh token também expirou | Fazer novo login |
| 404 em /login | Servidor não rodando | `npm run dev` |

---

## 📚 Próximos Passos

1. ✅ Integrar autenticação JWT (esta documentação)
2. ⬜ Implementar rate limiting no backend
3. ⬜ Adicionar dois fatores autenticação (2FA)
4. ⬜ Implementar cache de token no Frontend
5. ⬜ Adicionar logs de atividade no Backend
