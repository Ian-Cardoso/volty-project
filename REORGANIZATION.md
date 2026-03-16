# Volty Project - Nova Estrutura Reorganizada

## 📁 Estrutura de Pastas

```
volty-project/
├── html/                          # 📄 Todos os arquivos HTML da aplicação
│   ├── volty.html                # Página principal
│   ├── product.html              # Detalhes do produto
│   ├── account.html              # Conta do usuário
│   ├── checkout.html             # Checkout
│   ├── orders.html               # Pedidos
│   ├── tracking.html             # Rastreamento
│   ├── wishlist.html             # Lista de desejos
│   ├── login.html                # Login
│   ├── register.html             # Registro
│   ├── form.html                 # Formulário alternativo
│   └── clear-storage.html        # Limpar localStorage
│
├── scripts/                       # 🔧 JavaScript - Lógica da aplicação
│   ├── auth-check.js             # Verificação de autenticação
│   ├── checkout.js               # Lógica de checkout
│   ├── orders.js                 # Lógica de pedidos
│   ├── product.js                # Lógica de produtos
│   ├── tracking.js               # Lógica de rastreamento
│   ├── theme.js                  # Toggle tema dark/light
│   ├── volty.js                  # Script principal
│   ├── wishlist-page.js          # Lógica de wishlist
│   ├── checkout/                 # Submódulos de checkout
│   │   ├── orderSummary.js
│   │   └── paymentSummary.js
│   ├── utils/                    # Funções utilitárias
│   │   ├── cartQuantity.js
│   │   └── money.js
│   └── validators/               # Validadores
│       └── userValidator.js
│
├── styles/                       # 🎨 CSS - Estilos
│   ├── shared/                   # Estilos compartilhados
│   │   ├── general.css
│   │   └── volty-header.css
│   └── pages/                    # Estilos por página
│       ├── account.css
│       ├── chat-ai.css
│       ├── forms.css
│       ├── orders.css
│       ├── product.css
│       ├── tracking.css
│       ├── volty.css
│       ├── wishlist.css
│       └── checkout/
│           ├── checkout.css
│           └── checkout-header.css
│
├── data/                         # 💾 Dados e módulos de negócio
│   ├── account.js                # Gestão de conta
│   ├── cart.js                   # Carrinho rápido
│   ├── cart-class.js             # Classe Cart
│   ├── cart-oop.js               # Implementação OOP do carrinho
│   ├── chat-ai.js                # IA de chat
│   ├── chat-toogle.js            # Toggle do chat
│   ├── coupons.js                # Gestão de cupons
│   ├── deliveryOption.js         # Opções de entrega
│   ├── forms.js                  # Lógica de formulários
│   ├── login.js                  # Lógica de login
│   ├── products.js               # Gestão de produtos
│   ├── reviews.js                # Gestão de reviews
│   └── wishlist.js               # Gestão de wishlist
│
├── images/                       # 🖼️ Assets
│   ├── icons/
│   ├── products/
│   │   └── variations/
│   └── ratings/
│
├── backend/                      # 🖥️ Backend Node.js
│   ├── server.js                 # Servidor Express
│   ├── db.js                     # Configuração PostgreSQL
│   ├── checkCoupon.js
│   ├── checkUsers.js
│   ├── products.json
│   ├── create_tables.sql
│   ├── create_eternal_coupon.sql
│   ├── couponTest.js
│   └── registerTest.js
│
├── tests-jasmine/                # 🧪 Testes com Jasmine
│   ├── data/
│   │   └── carTest.js
│   ├── utils/
│   │   └── moneyTest.js
│   ├── checkout/
│   │   └── orderSummaryTest.js
│   └── lib/
│       └── jasmine-5.1.1/
│
├── docs/                         # 📚 Documentação
│   ├── anotacoes.txt
│   └── package.json.bak
│
├── backup_root_before_reorg/    # 🔒 Backup de segurança (pode deletar após)
│
├── package.json                  # Dependências Node.js
├── .env                          # Variáveis de ambiente
├── .gitignore
└── README.md                     # Este arquivo
```

---

## 🎯 Mudanças Realizadas

### ✅ Movido para `html/`:
- Todos os 11 arquivos HTML da raiz
- Referências de assets atualizadas (imagens, CSS, scripts)

### ✅ Referências Atualizadas:
- **HTML files**: Todos os `src=""` e `href=""` atualizados com `../` para navegação de volta
- **JavaScript files**: Navegação entre páginas atualizada (ex: `window.location.href = 'html/login.html'`)

### ✅ Documentação:
- Criada pasta `/docs` com arquivo de anotações
- Backup de `package.json` criado em `/docs`

---

## 🚀 Como Usar

### Desenvolvimento:
```bash
npm install
npm run dev
```

### Testes:
```bash
npm test
```

---

## 📌 Estrutura Recomendada para Novo Código

- **Novos componentes HTML** → `/html/`
- **Novos scripts** → `/scripts/` (ou subpastas como `scripts/checkout/`)
- **Novos estilos** → `/styles/pages/` ou `/styles/shared/`
- **Novos módulos de dados** → `/data/`
- **Testes** → `/tests-jasmine/` (ou criar `/tests/spec/`)

---

## ⚠️ Backup

Um backup automático foi criado em `/backup_root_before_reorg/` com todos os arquivos originais da raiz. Pode ser deletado após verificar que tudo está funcionando.

---

## 📝 Próximos Passos Sugeridos

1. Testar toda a aplicação para garantir que os links funcionam
2. Considerar consolidar `/tests/` e `/tests-jasmine/` em uma única pasta de testes
3. Criar arquivo `.env.example` se não existir
4. Considerar adicionar `/public/` para assets estáticos servidos direto

---

**Data da reorganização**: 4 de Março de 2026
