# 📚 Swagger API Documentation

## 🚀 Acessar Documentação Interativa

Abra no navegador:
```
http://localhost:3000/api-docs
```

---

## ✨ O que é Swagger?

**Swagger** (OpenAPI) é uma documentação interativa que permite:

✅ **Visualizar todos os endpoints** da API  
✅ **Testar requisições** diretamente no navegador  
✅ **Ver exemplos** de requisição e resposta  
✅ **Autenticação JWT** integrada  
✅ **Exportar para clientes** (código Python, JavaScript, etc)  

---

## 📖 Estrutura da Documentação

### **1. Health Check** (sem autenticação)
- `GET /` - Verifica se servidor está rodando

### **2. Authentication** (registro e login)
- `POST /register` - Registrar novo usuário
- `POST /login` - Login e gerar tokens JWT
- `POST /refresh-token` - Renovar access token

### **3. User Profile** (protegido - precisa JWT)
- `GET /me/:id` - Obter dados do usuário
- `PUT /me/:id` - Atualizar perfil
- `PUT /me/:id/password` - Mudar senha

### **4. Orders** (protegido)
- `POST /orders` - Criar novo pedido
- `GET /orders/:userId` - Listar pedidos do usuário

### **5. Wishlist** (protegido)
- `POST /wishlist` - Adicionar produto à wishlist
- `GET /wishlist/:userId` - Obter wishlist
- `DELETE /wishlist/:userId/:productId` - Remover da wishlist

### **6. Coupons** (sem autenticação)
- `POST /validate-coupon` - Validar código de cupom
- `GET /coupons` - Listar cupons ativos

---

## 🔐 Como Usar com JWT

### **Passo 1: Fazer Login**

1. Clique no endpoint `POST /login`
2. Preench os dados:
   ```json
   {
     "email": "seu@email.com",
     "password": "SuaSenha123!"
   }
   ```
3. Clique em **"Try it out"** e **"Execute"**
4. Copia o `accessToken` da resposta

### **Passo 2: Autenticar Requisições Protegidas**

1. Clique no botão **"Authorize"** (cadeado no topo)
2. Cole o token no campo:
   ```
   Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```
3. Clique em **"Authorize"**

Pronto! Agora todos os endpoints protegidos funcionam.

### **Passo 3: Testar Endpoint Protegido**

1. Clique em `GET /me/{id}`
2. Preench o ID (1, por exemplo)
3. Clique em **"Try it out"** e **"Execute"**
4. Verá os dados do usuário

---

## 💡 Dicas Úteis

### **Copiar Token Completo**
A resposta mostra o token truncado. Para copiar completo:
1. Clique em **"Response body"**
2. Selecione tudo (Ctrl+A)
3. Copie (Ctrl+C)

### **Testar Endpoints Sem Autenticação**
Endpoints como `/login`, `/register` e `/validate-coupon` não precisam de autenticação.

### **Consultar JSON Schema**
Clique em qualquer `$ref: '#/components/schemas/User'` para ver a estrutura completa.

### **Renovar Token**
Se o token expirar (status 403):
1. Clique em `POST /refresh-token`
2. Preench o `refreshToken`
3. Clique em **"Execute"**
4. Copia o novo `accessToken`
5. Atualize a autenticação com o novo token

---

## 📥 Exportar Documentação

### **Como um Cliente (ex: Python)**
1. Clique em **"Download specifications"** (abaixo do título)
2. Salva o arquivo `swagger.yaml` ou `swagger.json`
3. Use em ferramentas como:
   - OpenAPI Generator
   - Swagger Codegen
   - Postman (importar coleção)

### **Compartilhar com Equipe**
- Link: `http://seu-dominio.com/api-docs`
- JSON: `http://seu-dominio.com/api-docs.json`
- YAML: Disponível em `/api-docs.json` (conversível)

---

## 🎨 Customização

O tema escuro já está configurado, mas você pode customizar em `backend/swagger.js`:

```javascript
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  swaggerOptions: {
    tryItOutEnabled: true,           // Ativar "Try it out"
    deepLinking: true,               // Links profundos
    presets: [swaggerUi.presets.apis, swaggerUi.SwaggerUIBundle.presets.layout]
  },
  customCss: '.seu-css-aqui { ... }' // CSS customizado
}))
```

---

## 🔍 Estrutura da Documentação (Backend)

Cada endpoint é documentado com **JSDoc** no `backend/server.js`:

```javascript
/**
 * @swagger
 * /me/{id}:
 *   get:
 *     summary: Obter dados do usuário
 *     description: Retorna informações do usuário autenticado
 *     tags:
 *       - User
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Dados do usuário
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 */
app.get('/me/:id', authenticateToken, async (req, res) => {
  // Implementação
})
```

---

## ✅ Próximos Passos

- [ ] Acessar `http://localhost:3000/api-docs`
- [ ] Testar endpoint de login
- [ ] Copiar accessToken
- [ ] Testar endpoint protegido (`GET /me/:id`)
- [ ] Experimentar outros endpoints
- [ ] Testar renovação de token

---

## 📚 Referências

- [OpenAPI Specification](https://spec.openapis.org/oas/v3.0.0)
- [Swagger UI Documentation](https://swagger.io/tools/swagger-ui/)
- [Swagger JSDoc](https://github.com/Surnet/swagger-jsdoc)
