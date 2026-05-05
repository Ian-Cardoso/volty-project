-- 1. TABELA WISHLIST (Lista de Desejos)
-- Permite usuários salvar produtos para depois
-- CREATE TABLE IF NOT EXISTS wishlist (
--   id SERIAL PRIMARY KEY,
--   user_id INTEGER NOT NULL,
--   product_id VARCHAR(255) NOT NULL,
--   created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--   CONSTRAINT fk_wishlist_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
--   UNIQUE(user_id, product_id)
-- );

-- Criar índice para melhorar performance
-- CREATE INDEX IF NOT EXISTS idx_wishlist_user_id ON wishlist(user_id);

-- 2. TABELA REVIEWS (Avaliações e Comentários)
-- Usuários deixam reviews nos produtos
-- CREATE TABLE IF NOT EXISTS reviews (
--   id SERIAL PRIMARY KEY,
--   user_id INTEGER NOT NULL,
--   product_id VARCHAR(255) NOT NULL,
--   rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
--   title VARCHAR(255),
--   comment TEXT,
--   helpful_count INTEGER DEFAULT 0,
--   created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--   updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--   CONSTRAINT fk_reviews_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
--   UNIQUE(user_id, product_id)
-- );

-- Criar índices
-- CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON reviews(product_id);
-- CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews(user_id);
-- CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating);

-- 3. TABELA PROMOÇÕES/CUPONS
-- Gerenciar cupons e promoções
-- CREATE TABLE IF NOT EXISTS coupons (
--   id SERIAL PRIMARY KEY,
--   code VARCHAR(50) NOT NULL UNIQUE,
--   description TEXT,
--   discount_type VARCHAR(20) NOT NULL, -- 'percentage' ou 'fixed'
--   discount_value NUMERIC(10, 2) NOT NULL,
--   max_uses INTEGER,
--   current_uses INTEGER DEFAULT 0,
--   min_order_amount NUMERIC(10, 2) DEFAULT 0,
--   valid_from TIMESTAMP,
--   valid_until TIMESTAMP,
--   is_active BOOLEAN DEFAULT true,
--   created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--   updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
-- );

-- Criar índices
-- CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code);
-- CREATE INDEX IF NOT EXISTS idx_coupons_is_active ON coupons(is_active);

-- 4. TABELA COUPON_USAGE (Histórico de Uso de Cupons)
-- Rastrear quem usou qual cupom
-- CREATE TABLE IF NOT EXISTS coupon_usage (
--   id SERIAL PRIMARY KEY,
--   coupon_id INTEGER NOT NULL,
--   user_id INTEGER NOT NULL,
--   order_id INTEGER NOT NULL,
--   discount_amount NUMERIC(10, 2),
--   used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--   CONSTRAINT fk_coupon_usage_coupon FOREIGN KEY (coupon_id) REFERENCES coupons(id) ON DELETE CASCADE,
--   CONSTRAINT fk_coupon_usage_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
--   CONSTRAINT fk_coupon_usage_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
-- );

-- Criar índices
-- CREATE INDEX IF NOT EXISTS idx_coupon_usage_coupon_id ON coupon_usage(coupon_id);
-- CREATE INDEX IF NOT EXISTS idx_coupon_usage_user_id ON coupon_usage(user_id);

-- 5. ADICIONAR COLUNA DE CUPOM NA TABELA ORDERS
-- Se a tabela orders não tiver ainda
-- ALTER TABLE orders 
-- ADD COLUMN IF NOT EXISTS coupon_id INTEGER,
-- ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(10, 2) DEFAULT 0,
-- ADD COLUMN IF NOT EXISTS final_total NUMERIC(10, 2),
-- ADD CONSTRAINT fk_orders_coupon FOREIGN KEY (coupon_id) REFERENCES coupons(id) ON DELETE SET NULL;

-- Exemplo de cupons
-- INSERT INTO coupons (code, description, discount_type, discount_value, max_uses, min_order_amount, valid_from, valid_until, is_active)
-- VALUES 
--   ('WELCOME10', 'Bem-vindo! 10% de desconto', 'percentage', 10, 100, 50.00, NOW(), NOW() + INTERVAL '30 days', true),
--   ('SUMMER20', 'Desconto de verão - R$ 20 off', 'fixed', 20.00, 50, 100.00, NOW(), NOW() + INTERVAL '60 days', true),
--   ('NEWUSER15', '15% para novos usuários', 'percentage', 15, 200, 30.00, NOW(), NOW() + INTERVAL '45 days', true);

/*
WISHLIST:
- id: Identificador único
- user_id: ID do usuário que salvou
- product_id: ID do produto
- created_at: Data de criação
- UNIQUE(user_id, product_id): Um usuário não pode salvar o mesmo produto duas vezes

REVIEWS:
- id: Identificador único
- user_id: Quem escreveu
- product_id: Qual produto
- rating: 1-5 estrelas
- title: Título da avaliação
- comment: Comentário detalhado
- helpful_count: Quantas pessoas acharam útil
- created_at/updated_at: Timestamps
- UNIQUE(user_id, product_id): Um usuário só pode avaliar um produto uma vez

COUPONS:
- code: Código do cupom (ex: WELCOME10)
- discount_type: 'percentage' (%) ou 'fixed' (valor fixo)
- discount_value: Valor ou percentual de desconto
- max_uses: Limite de quantas vezes pode ser usado
- current_uses: Quantas vezes já foi usado
- min_order_amount: Compra mínima para usar
- valid_from/valid_until: Período de validade
- is_active: Se está ativo ou desativado

COUPON_USAGE:
- Registra cada vez que um cupom é usado
- Ligado com order para rastrear em qual pedido foi usado
*/

-- 6. ADICIONAR IS_ADMIN EM USERS E CRIAR PRODUTOS
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;

CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  price NUMERIC(10,2) NOT NULL,
  image VARCHAR(1024) NOT NULL,
  stock BOOLEAN DEFAULT true,
  rating NUMERIC(3,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);
CREATE INDEX IF NOT EXISTS idx_products_price ON products(price);
