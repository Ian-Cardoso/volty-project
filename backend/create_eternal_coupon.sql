-- Cupom com desconto sem data de expiração
-- Este cupom será válido indefinidamente (até is_active ser setado para false)

INSERT INTO coupons (code, description, discount_type, discount_value, min_order_amount, max_uses, current_uses, is_active, valid_from, valid_until)
VALUES (
  'INDEFINIDO',
  'Cupom com desconto de 10% válido indefinidamente',
  'percentage',
  10,
  0,
  NULL,
  0,
  true,
  CURRENT_TIMESTAMP,
  NULL
);

-- Cupom com desconto fixo em reais:
INSERT INTO coupons (code, description, discount_type, discount_value, min_order_amount, max_uses, current_uses, is_active, valid_from, valid_until)
VALUES (
  'DESCONTO10',
  'Cupom com desconto de R$ 10,00 válido indefinidamente',
  'fixed',
  10,
  20,
  NULL,
  0,
  true,
  CURRENT_TIMESTAMP,
  NULL
);

-- Verificar os cupons criados
SELECT id, code, description, discount_type, discount_value, min_order_amount, max_uses, current_uses, is_active, valid_from, valid_until 
FROM coupons 
WHERE code IN ('INDEFINIDO', 'DESCONTO10');