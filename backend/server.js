import express from 'express'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import pkg from 'pg'
import cors from 'cors'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'
import swaggerUi from 'swagger-ui-express'
import swaggerSpec from './swagger.js'
import { UserSchema } from '../scripts/validators/userValidator.js'

dotenv.config()

const __filename = fileURLToPath(import.meta.url) //caminho do arquivo atual
const __dirname = path.dirname(__filename) //caminho do diretório atual

// Carregar produtos
const productsData = JSON.parse(fs.readFileSync(path.join(__dirname, 'products.json'), 'utf-8'))

const { Pool } = pkg
const app = express()

const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000,http://127.0.0.1:5500,null').split(',')

app.use(cors({
  origin: (origin, callback) => {
    const cleanOrigin = origin ? origin.trim() : null;
    
    if (!origin || allowedOrigins.map(o => o.trim()).includes(cleanOrigin)) {
      callback(null, true)
    } else {
      console.log('CORS bloqueou a origem:', origin); // Log para debug
      callback(new Error('Not allowed by CORS'))
    }
  },
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 200
}))

app.use((req, res, next) => {
  console.log('HTTP', req.method, req.path)
  next()
})

app.use(express.json())

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  swaggerOptions: {
    tryItOutEnabled: true,
    deepLinking: true
  },
  customCss: '.swagger-ui { background: #0f0f0f; } .swagger-ui .topbar { background: #1a1a1a; }'
}))

app.get('/api-docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json')
  res.send(swaggerSpec)
})

console.log('Setting up Swagger UI route')
console.log('swaggerSpec loaded, paths:', Object.keys(swaggerSpec.paths || {}))

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization']
  console.log('Header recebido:', authHeader);
  const token = authHeader && authHeader.split(' ')[1]

  if (!token) {
    return res.status(401).json({ error: 'Access token required' })
  }

  jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret', (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' })
    }
    req.user = user
    next()
  })
}

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
})

app.post('/register', async (req, res) => {
  try {

    if (!req.body.email || !req.body.password || !req.body.name) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    // Normalização forte do email
    const normalizedEmail = req.body.email.trim().toLowerCase()

    console.log('EMAIL NORMALIZADO:', normalizedEmail)

    // Validação com Zod
    const validatedData = UserSchema.parse({
      name: req.body.name,
      email: normalizedEmail,
      password: req.body.password
    })

    const hash = await bcrypt.hash(validatedData.password, 10)

    const result = await pool.query(
      `INSERT INTO users (name, email, password)
       VALUES ($1, $2, $3)
       RETURNING id, email`,
      [validatedData.name, validatedData.email, hash]
    )

    console.log('USUÁRIO CRIADO:', result.rows[0])

    return res.status(201).json({
      message: 'User created',
      user: result.rows[0]
    })

  } catch (err) {
  console.error('ERRO COMPLETO:', err)

  if (err.code === '23505') {
    return res.status(409).json({ error: 'E-mail already registered' })
  }

  return res.status(400).json({
    error: err.message,
    fullError: err
  })
}
})

app.get('/', (req, res) => {
  res.send('API is running')
})

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
 *         description: ID do usuário
 *     responses:
 *       200:
 *         description: Dados do usuário
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         description: Token de acesso não fornecido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Token inválido ou expirado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
app.get('/me/:id', authenticateToken, async (req, res) => {
  const { id } = req.params

  if (req.user.userId != parseInt(id)) {
    return res.status(403).json({ error: 'Unauthorized' })
  }

 try {
    const result = await pool.query(
      'SELECT id, name, email, cep, street, city, state FROM users WHERE id=$1',
      [id]
    )

    if (!result.rows.length) {
      return res.status(404).json({ error: 'User not found' })
    }

    res.json(result.rows[0])
  } catch (err) {
    res.status(500).json({ error: 'Database error' })
  }
})

/**
 * @swagger
 * /me/{id}:
 *   put:
 *     summary: Atualizar dados do usuário
 *     description: Atualiza informações do perfil do usuário
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               cep:
 *                 type: string
 *               street:
 *                 type: string
 *               city:
 *                 type: string
 *               state:
 *                 type: string
 *     responses:
 *       200:
 *         description: Perfil atualizado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: 'Account updated'
 *       403:
 *         description: Não autorizado
 */
app.put('/me/:id', authenticateToken, async (req, res) => {
  const { id } = req.params
  const { name, cep, street, city, state } = req.body

  // Verify user can only update their own data
  if (req.user.userId !== parseInt(id)) {
    return res.status(403).json({ error: 'Unauthorized' })
  }

  try {
    await pool.query(
      `UPDATE users 
       SET name=$1, cep=$2, street=$3, city=$4, state=$5
       WHERE id=$6`,
      [name, cep, street, city, state, id]
    )

    res.json({ message: 'Account updated' })
  } catch (err) {
    console.error('Update error:', err)
    res.status(500).json({ error: 'Server error' })
  }
})

/**
 * @swagger
 * /me/{id}/password:
 *   put:
 *     summary: Alterar senha
 *     description: Muda a senha do usuário autenticado
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 format: password
 *               newPassword:
 *                 type: string
 *                 format: password
 *     responses:
 *       200:
 *         description: Senha alterada com sucesso
 *       401:
 *         description: Senha atual incorreta
 *       403:
 *         description: Não autorizado
 */
app.put('/me/:id/password', authenticateToken, async (req, res) => {
  const { id } = req.params
  const { currentPassword, newPassword } = req.body

  // Verify user can only update their own password
  if (req.user.userId !== parseInt(id)) {
    return res.status(403).json({ error: 'Unauthorized' })
  }

  try {
    // Verify current password
    const userResult = await pool.query(
      'SELECT password FROM users WHERE id=$1',
      [id]
    )

    if (!userResult.rows.length) {
      return res.status(404).json({ error: 'User not found' })
    }

    const isValid = await bcrypt.compare(currentPassword, userResult.rows[0].password)
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid current password' })
    }

    const hash = await bcrypt.hash(newPassword, 10)

    await pool.query(
      'UPDATE users SET password=$1 WHERE id=$2',
      [hash, id]
    )

    res.json({ message: 'Password updated' })
  } catch (err) {
    console.error('Password update error:', err)
    res.status(500).json({ error: 'Server error' })
  }
})

/**
 * @swagger
 * /login:
 *   post:
 *     summary: Fazer login
 *     description: Autentica um usuário e retorna tokens JWT
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Login realizado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       401:
 *         description: Email ou senha inválida
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
app.post('/login', async (req, res) => {
  const { email, password } = req.body

  try {
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' })
    }

    const result = await pool.query(
      'SELECT id, password, email FROM users WHERE email=$1',
      [email]
    )

    if (!result.rows.length)
      return res.status(401).json({ error: 'Invalid credentials' })

    const valid = await bcrypt.compare(password, result.rows[0].password)

    if (!valid)
      return res.status(401).json({ error: 'Invalid credentials' })

    const userId = result.rows[0].id

    // Generate Access Token (short-lived)
    const accessToken = jwt.sign(
      { userId, email },
      process.env.JWT_SECRET || 'your_jwt_secret',
      { expiresIn: process.env.JWT_EXPIRATION || '15m' }
    )

    // Generate Refresh Token (long-lived)
    const refreshToken = jwt.sign(
      { userId },
      process.env.JWT_REFRESH_SECRET || 'your_refresh_secret',
      { expiresIn: process.env.JWT_REFRESH_EXPIRATION || '7d' }
    )

    res.json({
      accessToken,
      refreshToken,
      userId
    })
  } catch (err) {
    console.error('Login error:', err)
    res.status(500).json({ error: 'Server error' })
  }
})

/**
 * @swagger
 * /refresh-token:
 *   post:
 *     summary: Renovar access token
 *     description: Usa o refresh token para gerar um novo access token
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
 *     responses:
 *       200:
 *         description: Novo token gerado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 accessToken:
 *                   type: string
 *       400:
 *         description: Refresh token não fornecido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Refresh token inválido ou expirado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
app.post('/refresh-token', (req, res) => {
  const { refreshToken } = req.body

  if (!refreshToken) {
    return res.status(400).json({ error: 'Refresh token required' })
  }

  try {
    const decoded = jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET || 'your_refresh_secret'
    )

    // Generate new access token
    const newAccessToken = jwt.sign(
      { userId: decoded.userId },
      process.env.JWT_SECRET || 'your_jwt_secret',
      { expiresIn: process.env.JWT_EXPIRATION || '15m' }
    )

    res.json({ accessToken: newAccessToken })
  } catch (err) {
    res.status(403).json({ error: 'Invalid refresh token' })
  }
})

//orders route

/**
 * @swagger
 * /orders:
 *   post:
 *     summary: Criar novo pedido
 *     description: Cria um novo pedido com itens do carrinho
 *     tags:
 *       - Orders
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: integer
 *               cart:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     productId:
 *                       type: string
 *                     quantity:
 *                       type: integer
 *               couponCode:
 *                 type: string
 *     responses:
 *       201:
 *         description: Pedido criado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 orderId:
 *                   type: integer
 *                 total:
 *                   type: number
 *                 finalTotal:
 *                   type: number
 *       400:
 *         description: Carrinho vazio ou dados inválidos
 *       403:
 *         description: Não autorizado
 */
app.post('/orders', authenticateToken, async (req, res) => {
  let { userId, cart, couponId, couponCode } = req.body

  // Verify user can only create orders for themselves
  if (req.user.userId !== userId) {
    return res.status(403).json({ error: 'Unauthorized' })
  }

  // if couponCode was provided, look up its id
  if (!couponId && couponCode) {
    const cRes = await pool.query(
      'SELECT id FROM coupons WHERE code=$1 AND is_active=true',
      [couponCode.toUpperCase()]
    )
    if (cRes.rows.length) {
      couponId = cRes.rows[0].id
    }
  }

  try {
    // Se carrinho vazio ou inválido
    if (!cart || !Array.isArray(cart) || cart.length === 0) {
      return res.status(400).json({ error: 'Empty cart' })
    }

    // Calcular total corretamente
    const totalCents = cart.reduce((sum, item) => {
      const product = productsData.find(p => p.id === item.productId)
      if (!product) return sum
      return sum + (product.priceCents * item.quantity)
    }, 0)
    const total = parseFloat((totalCents / 100).toFixed(2))

    // Processar cupom se fornecido
    let discountAmount = 0
    let finalTotal = total
    let appliedCouponId = null

    if (couponId) {
      const couponResult = await pool.query(
        `SELECT id, discount_type, discount_value, min_order_amount, max_uses, current_uses
         FROM coupons 
         WHERE id=$1 AND is_active=true 
         AND (valid_from IS NULL OR valid_from <= CURRENT_TIMESTAMP) 
         AND (valid_until IS NULL OR valid_until >= CURRENT_TIMESTAMP)`,
        [couponId]
      )

      if (couponResult.rows.length) {
        const coupon = couponResult.rows[0]

        if (!coupon.max_uses || coupon.current_uses < coupon.max_uses) {
          if (total >= coupon.min_order_amount) {
            if (coupon.discount_type === 'percentage') {
              discountAmount = parseFloat(((total * coupon.discount_value) / 100).toFixed(2))
            } else {
              discountAmount = parseFloat(coupon.discount_value.toFixed(2))
            }
            finalTotal = Math.max(0, parseFloat((total - discountAmount).toFixed(2)))
            appliedCouponId = coupon.id

            // Incrementar uso do cupom
            await pool.query(
              'UPDATE coupons SET current_uses = current_uses + 1 WHERE id=$1',
              [coupon.id]
            )
          }
        }
      }
    }

    // Inserir pedido com desconto e final_total
    const order = await pool.query(
      `INSERT INTO orders (user_id, total, discount_amount, final_total, coupon_id, status) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING id`,
      [userId, total, discountAmount, finalTotal, appliedCouponId, 'confirmed']
    )

    const orderId = order.rows[0].id

    // Inserir itens do pedido
    for (const item of cart) {
      const product = productsData.find(p => p.id === item.productId)
      
      if (!product) continue
      
      const productPrice = (product.priceCents / 100).toFixed(2)

      await pool.query(
        `INSERT INTO order_items (order_id, product_id, name, price, quantity)
         VALUES ($1, $2, $3, $4, $5)`,
        [orderId, item.productId, product.name, parseFloat(productPrice), item.quantity]
      )
    }

    res.status(201).json({ orderId, total, discountAmount, finalTotal })
  } catch (err) {
    console.error('Error creating order:', err)
    res.status(500).json({ error: 'Error creating order', details: err.message })
  }
})

/**
 * @swagger
 * /orders/{userId}:
 *   get:
 *     summary: Listar pedidos do usuário
 *     description: Retorna todos os pedidos do usuário autenticado
 *     tags:
 *       - Orders
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Lista de pedidos
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Order'
 *       403:
 *         description: Não autorizado
 */
app.get('/orders/:userId', authenticateToken, async (req, res) => {
  const { userId } = req.params

  // Verify user can only view their own orders
  if (req.user.userId !== parseInt(userId)) {
    return res.status(403).json({ error: 'Unauthorized' })
  }

  try {
    const orders = await pool.query(
      'SELECT * FROM orders WHERE user_id=$1 ORDER BY created_at DESC',
      [userId]
    )

    res.json(orders.rows)
  } catch (err) {
    console.error('Fetch orders error:', err)
    res.status(500).json({ error: 'Server error' })
  }
})

// Atualizar status do pedido
app.put('/orders/:orderId/status', async (req, res) => {
  const { orderId } = req.params
  const { status } = req.body

  const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled']
  
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid status' })
  }

  try {
    const result = await pool.query(
      'UPDATE orders SET status=$1 WHERE id=$2 RETURNING id, status',
      [status, orderId]
    )

    if (!result.rows.length) {
      return res.status(404).json({ error: 'Order not found' })
    }

    res.json({ message: 'Order status updated', order: result.rows[0] })
  } catch (err) {
    console.error('Error updating order:', err)
    res.status(500).json({ error: 'Error updating order' })
  }
})
// WISHLIST ROUTES

/**
 * @swagger
 * /wishlist:
 *   post:
 *     summary: Adicionar à wishlist
 *     description: Adiciona um produto à lista de desejos do usuário
 *     tags:
 *       - Wishlist
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: integer
 *               productId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Adicionado à wishlist
 *       403:
 *         description: Não autorizado
 */
app.post('/wishlist', authenticateToken, async (req, res) => {
  const { userId, productId } = req.body

  // Verify user can only modify their own wishlist
  if (req.user.userId !== userId) {
    return res.status(403).json({ error: 'Unauthorized' })
  }

  try {
    await pool.query(
      'INSERT INTO wishlist (user_id, product_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [userId, productId]
    )
    res.status(201).json({ message: 'Added to wishlist' })
  } catch (err) {
    res.status(500).json({ error: 'Error adding to wishlist' })
  }
})

/**
 * @swagger
 * /wishlist/{userId}:
 *   get:
 *     summary: Obter wishlist do usuário
 *     description: Retorna todos os produtos na lista de desejos
 *     tags:
 *       - Wishlist
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Lista de produtos na wishlist
 *       403:
 *         description: Não autorizado
 */
app.get('/wishlist/:userId', authenticateToken, async (req, res) => {
  const { userId } = req.params

  // Verify user can only view their own wishlist
  if (req.user.userId !== parseInt(userId)) {
    return res.status(403).json({ error: 'Unauthorized' })
  }

  try {
    const result = await pool.query(
      'SELECT product_id, created_at FROM wishlist WHERE user_id=$1 ORDER BY created_at DESC',
      [userId]
    )
    res.json(result.rows)
  } catch (err) {
    res.status(500).json({ error: 'Error fetching wishlist' })
  }
})

/**
 * @swagger
 * /wishlist/{userId}/{productId}:
 *   delete:
 *     summary: Remover da wishlist
 *     description: Remove um produto da lista de desejos
 *     tags:
 *       - Wishlist
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Removido da wishlist
 *       403:
 *         description: Não autorizado
 */
app.delete('/wishlist/:userId/:productId', authenticateToken, async (req, res) => {
  const { userId, productId } = req.params

  // Verify user can only delete from their own wishlist
  if (req.user.userId !== parseInt(userId)) {
    return res.status(403).json({ error: 'Unauthorized' })
  }

  try {
    await pool.query(
      'DELETE FROM wishlist WHERE user_id=$1 AND product_id=$2',
      [userId, productId]
    )
    res.json({ message: 'Removed from wishlist' })
  } catch (err) {
    res.status(500).json({ error: 'Error removing from wishlist' })
  }
})

// rota reviews
app.post('/reviews', async (req, res) => {
  const { userId, productId, rating, title, comment } = req.body

  try {
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Invalid rating' })
    }

    const result = await pool.query(
      `INSERT INTO reviews (user_id, product_id, rating, title, comment)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (user_id, product_id) DO UPDATE
       SET rating=$3, title=$4, comment=$5, updated_at=CURRENT_TIMESTAMP
       RETURNING id`,
      [userId, productId, rating, title, comment]
    )

    res.status(201).json({ reviewId: result.rows[0].id })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error creating review' })
  }
})

app.get('/reviews/:productId', async (req, res) => {
  const { productId } = req.params

  try {
    const result = await pool.query(
      `SELECT id, user_id, rating, title, comment, helpful_count, created_at
       FROM reviews WHERE product_id=$1 AND (
         SELECT COUNT(*) FROM reviews WHERE product_id=$1
       ) > 0
       ORDER BY helpful_count DESC, created_at DESC`,
      [productId]
    )
    res.json(result.rows)
  } catch (err) {
    res.status(500).json({ error: 'Error fetching reviews' })
  }
})

app.put('/reviews/:reviewId/helpful', async (req, res) => {
  const { reviewId } = req.params

  try {
    await pool.query(
      'UPDATE reviews SET helpful_count = helpful_count + 1 WHERE id=$1',
      [reviewId]
    )
    res.json({ message: 'Review marked as helpful' })
  } catch (err) {
    res.status(500).json({ error: 'Error updating review' })
  }
})

/**
 * @swagger
 * /validate-coupon:
 *   post:
 *     summary: Validar cupom
 *     description: Verifica se um código de cupom é válido e retorna desconto
 *     tags:
 *       - Coupons
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               code:
 *                 type: string
 *               orderTotal:
 *                 type: number
 *     responses:
 *       200:
 *         description: Cupom válido
 *       404:
 *         description: Cupom não encontrado ou expirado
 *       400:
 *         description: Valor mínimo do pedido não atingido
 */
app.post('/validate-coupon', async (req, res) => {
  const { code, orderTotal } = req.body
  console.log('validate-coupon request, code=', code, 'orderTotal=', orderTotal)

  try {
    const result = await pool.query(
      `SELECT id, discount_type, discount_value, min_order_amount, max_uses, current_uses
       FROM coupons 
       WHERE code=$1 AND is_active=true 
       AND (valid_from IS NULL OR valid_from <= CURRENT_TIMESTAMP) 
       AND (valid_until IS NULL OR valid_until >= CURRENT_TIMESTAMP)`,
      [code.toUpperCase()]
    )
    console.log('coupon query returned', result.rows.length, 'rows')

    if (!result.rows.length) {
      return res.status(404).json({ error: 'Invalid or expired coupon' })
    }

    const coupon = result.rows[0]

    if (coupon.max_uses && coupon.current_uses >= coupon.max_uses) {
      return res.status(400).json({ error: 'Coupon usage limit reached' })
    }

    if (orderTotal < coupon.min_order_amount) {
      return res.status(400).json({ 
        error: `Minimum order amount is R$ ${coupon.min_order_amount}` 
      })
    }

    let discountAmount = 0
    if (coupon.discount_type === 'percentage') {
      discountAmount = (orderTotal * coupon.discount_value) / 100
    } else {
      discountAmount = coupon.discount_value
    }

    res.json({ 
      couponId: coupon.id, 
      discountAmount, 
      discountType: coupon.discount_type,
      discountValue: coupon.discount_value 
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error validating coupon' })
  }
})

/**
 * @swagger
 * /coupons:
 *   get:
 *     summary: Listar cupons ativos
 *     description: Retorna todos os cupons disponíveis para o cliente
 *     tags:
 *       - Coupons
 *     responses:
 *       200:
 *         description: Lista de cupons ativos
 */
app.get('/coupons', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, code, description, discount_type, discount_value, min_order_amount, valid_until
       FROM coupons 
       WHERE is_active=true 
       AND (valid_from IS NULL OR valid_from <= CURRENT_TIMESTAMP) 
       AND (valid_until IS NULL OR valid_until >= CURRENT_TIMESTAMP)
       ORDER BY discount_value DESC`
    )
    res.json(result.rows)
  } catch (err) {
    res.status(500).json({ error: 'Error fetching coupons' })
  }
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`)
  console.log(`Swagger documentation http://localhost:${PORT}/api-docs`)
})