# 📋 Instruções de Implementação - Tabelas Adicionais

## 🎯 Resumo das Funcionalidades Novas

### 1. **WISHLIST** (Lista de Desejos)
- Usuários podem salvar produtos para comprar depois
- Um usuário não pode salvar o mesmo produto 2x
- Armazenado no banco para persistência

### 2. **REVIEWS** (Avaliações)
- Usuários deixam avaliações (1-5 estrelas) nos produtos
- Incluem título e comentário
- Um usuário avalia cada produto uma única vez
- Pode ser marcado como "útil" por outros usuários

### 3. **COUPONS** (Cupons/Promoções)
- Criar cupons com desconto em percentual ou valor fixo
- Limite de uso por cupom
- Compra mínima obrigatória
- Datas de validade
- Rastrear uso de cupons nos pedidos

---

## 🗄️ Instruções de Setup

### Passo 1: Executar o Script SQL

1. Abra **DBeaver**, **pgAdmin** ou seu cliente PostgreSQL
2. Conecte ao banco `volty`
3. Copie e execute todo o conteúdo do arquivo: `backend/create_tables.sql`

```sql
-- Será criado automaticamente:
- wishlist
- reviews
- coupons
- coupon_usage
- Índices de performance
- Dados de exemplo (3 cupons)
```

### Passo 2: Reiniciar o Servidor

```bash
node .\backend\server.js
```

---

## 📡 Endpoints da API

### **WISHLIST**

#### Adicionar à wishlist
```
POST /wishlist
Body: { userId, productId }
Response: { message: "Added to wishlist" }
```

#### Obter wishlist
```
GET /wishlist/:userId
Response: Array de { product_id, created_at }
```

#### Remover da wishlist
```
DELETE /wishlist/:userId/:productId
Response: { message: "Removed from wishlist" }
```

---

### **REVIEWS**

#### Criar review
```
POST /reviews
Body: { userId, productId, rating, title, comment }
Response: { reviewId }
```

#### Obter reviews do produto
```
GET /reviews/:productId
Response: Array de { id, user_id, rating, title, comment, helpful_count, created_at }
```

#### Marcar como útil
```
PUT /reviews/:reviewId/helpful
Response: { message: "Review marked as helpful" }
```

---

### **COUPONS**

#### Validar cupom
```
POST /validate-coupon
Body: { code, orderTotal }
Response: { 
  couponId, 
  discountAmount, 
  discountType, 
  discountValue 
}
```

#### Listar cupons ativos
```
GET /coupons
Response: Array de cupons válidos
```

---

## 🛠️ Exemplos de Uso no Frontend

### Adicionar à Wishlist
```javascript
import { addToWishlist } from './data/wishlist.js'

// Chamar quando usuário clica no ❤️
await addToWishlist('product-id-123')
```

### Deixar Review
```javascript
import { createReview } from './data/reviews.js'

await createReview(
  'product-id', 
  5, 
  'Excelente produto!', 
  'Superou minhas expectativas. Recomendo!'
)
```

### Aplicar Cupom
```javascript
import { validateCoupon } from './data/coupons.js'

const result = await validateCoupon('WELCOME10', 150.00)

if (result.success) {
  console.log(`Desconto: R$ ${result.coupon.discountAmount}`)
} else {
  console.error(result.error)
}
```

---

## 💡 Próximos Passos

1. **Integrar wishlist na página de produtos**
   - Adicionar botão ❤️ para salvar
   - Mostrar página de desejos

2. **Integrar reviews na página do produto**
   - Exibir avaliações existentes
   - Formulário para deixar review

3. **Integrar cupons no checkout**
   - Campo para inserir código
   - Validação automática
   - Recalcular total com desconto

4. **Painel Admin** (futuro)
   - Criar/editar cupons
   - Ver estatísticas
   - Gerenciar reviews

---

## 🔍 Dados de Exemplo (Cupons Já Criados)

| Código | Tipo | Valor | Válido por |
|--------|------|-------|-----------|
| WELCOME10 | Percentual | 10% | 30 dias |
| SUMMER20 | Fixo | R$ 20 | 60 dias |
| NEWUSER15 | Percentual | 15% | 45 dias |

---

## ⚠️ Notas Importantes

- Todos os endpoints requerem `userId` válido
- Cupons têm limite de uso e datas de validade
- Reviews são únicos por usuário/produto (atualizam se repetir)
- Wishlist permite duplicatas automaticamente (UNIQUE constraint)
- Os dados de exemplo podem ser deletados/modificados

---

## 🐛 Troubleshooting

**Erro: "Syntax error in SQL"**
- Verifique se o PostgreSQL está rodando
- Tente executar o script novamente

**Erro: "Foreign key violation"**
- Certifique-se que a tabela `users` existe
- O `userId` deve ser válido

**Cupom não funciona**
- Verifique se é VÁLIDO (`is_active = true`)
- Verifique datas (`valid_from` e `valid_until`)
- Verifique limite de uso (`current_uses < max_uses`)
