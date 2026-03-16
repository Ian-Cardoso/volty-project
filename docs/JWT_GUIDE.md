# 🔐 JWT Authentication Guide - Volty Project

## Visão Geral

O JWT (JSON Web Token) é um padrão seguro de autenticação stateless. O servidor gera um token que o cliente armazena e envia em cada requisição.

---

## 📋 Fluxo de Autenticação

```
┌─────────────────────────────────────────────────────────────────┐
│                      1. LOGIN (POST /login)                     │
├─────────────────────────────────────────────────────────────────┤
│ Envia: { email, password }                                      │
│ Recebe: { accessToken, refreshToken, userId }                   │
│ ✓ Token válido por 15 minutos (padrão)                          │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│              2. REQUISIÇÕES PROTEGIDAS (com token)              │
├─────────────────────────────────────────────────────────────────┤
│ Header: Authorization: Bearer {accessToken}                     │
│ ✓ GET /me/1                                                     │
│ ✓ POST /orders                                                  │
│ ✓ DELETE /wishlist/1/product-id                                 │
└─────────────────────────────────────────────────────────────────┘
                              ↓
                    ┌──────────┴──────────┐
                    ↓                     ↓
            ✓ Token Válido        ✗ Token Expirado
                    ↓                     ↓
            Retorna dados        3. REFRESH TOKEN
                                 (POST /refresh-token)
                                 ├─ Envia: { refreshToken }
                                 ├─ Recebe: { accessToken }
                                 ├─ ✓ Novo access token (15 min)
                                 ├─ Retenta requisição original
                                 └─ Se falhar → Redireciona login
```

---

## 🛠️ Como Usar no Thunder Client

### 1️⃣ **Fazer Login**

```
POST http://localhost:3000/login
Content-Type: application/json

Body:
{
  "email": "usuario@email.com",
  "password": "SuaSenha123!"
}
```

**Resposta esperada (Status 200):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "userId": 1
}
```

---

### 2️⃣ **Acessar Rota Protegida**

```
GET http://localhost:3000/me/1
Headers:
  Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Resposta (Status 200):**
```json
{
  "id": 1,
  "name": "João Silva",
  "email": "usuario@email.com",
  "cep": "01234-567",
  "street": "Rua Exemplo",
  "city": "São Paulo",
  "state": "SP"
}
```

---

### 3️⃣ **Token Expirado? Renovar**

Quando receber `401` ou `403`:

```
POST http://localhost:3000/refresh-token
Content-Type: application/json

Body:
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Resposta (Status 200):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

## ⏰ Ciclo de Vida do Token

| Evento | Tempo | Ação |
|--------|-------|------|
| **Login** | T=0 | Gera `accessToken` + `refreshToken` |
| **Requisição** | T=5 min | Token válido ✓ Retorna dados |
| **Requisição** | T=14:59 min | Token ainda válido ✓ |
| **Requisição** | T=15:01 min | Token expirado ✗ Recebe 403 |
| **Refresh Token** | T=15:02 min | Novo `accessToken` gerado ✓ |
| **Requisição** | T=15:03 min | Usa novo token ✓ Retorna dados |
| **Logout** | Manual | Clear tokens (localStorage/sessionStorage) |

---

## 🔑 Diferenças: Access Token vs Refresh Token

| Propriedade | Access Token | Refresh Token |
|-------------|-------------|---------------|
| **Duração** | 15 minutos | 7 dias |
| **Uso** | Em cada requisição | Apenas para renovar |
| **Risco** | Baixo (expira rápido) | Médio (longa duração) |
| **Storage** | sessionStorage | sessionStorage |

---

## 💻 Usando no Frontend (JavaScript)

### ❌ **Forma Manual (sem auto-renovação)**

```javascript
// 1. Login
const loginRes = await fetch('/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password })
});
const { accessToken, refreshToken } = await loginRes.json();
sessionStorage.setItem('accessToken', accessToken);
sessionStorage.setItem('refreshToken', refreshToken);

// 2. Requisição
const res = await fetch('/me/1', {
  headers: {
    'Authorization': `Bearer ${sessionStorage.getItem('accessToken')}`
  }
});

// ⚠️ Se receber 403, precisa renovar manualmente
if (res.status === 403) {
  const refreshRes = await fetch('/refresh-token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      refreshToken: sessionStorage.getItem('refreshToken') 
    })
  });
  const { accessToken: newToken } = await refreshRes.json();
  sessionStorage.setItem('accessToken', newToken);
  // Retenta a requisição...
}
```

---

### ✅ **Forma Automática (recomendado)**

Use um wrapper que cuida disso automaticamente. Veja a documentação em `scripts/auth.js`.

```javascript
// Sempre funciona - auto-renova se necessário
const userData = await apiCall('/me/1', { method: 'GET' });
```

---

## 🚨 Problemas Comuns

### ❓ "Erro 401 Unauthorized"
**Causa:** Token não foi enviado no cabeçalho
**Solução:** Adicione `Authorization: Bearer {token}` no header

### ❓ "Erro 403 Invalid or expired token"  
**Causa:** Token expirou
**Solução:** Use o `refreshToken` com `POST /refresh-token` para gerar novo `accessToken`

### ❓ "Account is undefined"
**Causa:** Token expirou e não foi renovado automaticamente
**Solução:** Implemente o wrapper `apiCall()` que trata auto-renovação (veja `scripts/auth.js`)

### ❓ "Token de refresh também expirou"
**Causa:** Usuario ficou inativo por 7+ dias
**Solução:** Redirecione para página de login para fazer novo login

---

## 🔒 Segurança - Boas Práticas

### ✅ Faça Isso:
- Armazene tokens em `sessionStorage` (limpa ao fechar aba)
- Envie token apenas no cabeçalho `Authorization`
- Implemente auto-renovação com `refreshToken`
- Redirecione para login se refresh falhar
- Use HTTPS em produção

### ❌ Não Faça Isso:
- Armazenar em `localStorage` (persiste mesmo fechando navegador)
- Enviar token na URL (`/me/1?token=xxx`)
- Armazenar senhas em qualquer lugar
- Expor secrets do backend (`JWT_SECRET`) no frontend
- Fazer requisições sem validar token

---

## 📝 Endpoints de Autenticação

### `POST /register`
Registra novo usuário
```json
{
  "name": "João",
  "email": "joao@email.com",
  "password": "Senha123!"
}
```
✓ Response: `{ user: { id, email } }`

---

### `POST /login`
Faz login
```json
{
  "email": "joao@email.com",
  "password": "Senha123!"
}
```
✓ Response: `{ accessToken, refreshToken, userId }`

---

### `POST /refresh-token`
Renova access token expirado
```json
{
  "refreshToken": "..."
}
```
✓ Response: `{ accessToken }`

---

### `GET /me/:id` (PROTEGIDO)
Obtém dados do usuário
```
Header: Authorization: Bearer {accessToken}
```
✓ Response: `{ id, name, email, cep, street, city, state }`

---

### `PUT /me/:id` (PROTEGIDO)
Atualiza dados do usuário
```json
{
  "name": "Novo Nome",
  "cep": "12345-678",
  "street": "Nova Rua",
  "city": "Nova Cidade",
  "state": "NC"
}
```
✓ Response: `{ message: "Account updated" }`

---

### `PUT /me/:id/password` (PROTEGIDO)
Muda senha
```json
{
  "currentPassword": "SenhaAtual123!",
  "newPassword": "NovaSenha456!"
}
```
✓ Response: `{ message: "Password updated" }`

---

## 🧪 Testando no Thunder Client

1. **Registre um usuário:**
   ```
   POST /register
   Body: { name, email, password }
   ```

2. **Faça login:**
   ```
   POST /login
   Body: { email, password }
   → Cooie o accessToken
   ```

3. **Acesse rota protegida:**
   ```
   GET /me/1
   Header: Authorization: Bearer {accessToken}
   ```

4. **Teste expiração (opcional):**
   - Espere 15+ minutos OU
   - Modifique o token (retire um caractere)
   - Tente fazer requisição → Deve receber 403
   - Use refreshToken para renovar

---

## 📚 Referências

- [JWT.io - Debugger](https://jwt.io/) - Decodificar tokens
- [RFC 7519 - JWT Standard](https://tools.ietf.org/html/rfc7519)
- [OWASP - Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
