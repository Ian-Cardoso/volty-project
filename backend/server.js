import express from 'express'
import bcrypt from 'bcrypt'
import pkg from 'pg'
import cors from 'cors'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Carregar produtos
const productsData = JSON.parse(fs.readFileSync(path.join(__dirname, 'products.json'), 'utf-8'))

const { Pool } = pkg
const app = express()

app.use(cors())
app.use(express.json())

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'volty',
  password: '1504',
  port: 5432
})

app.post('/register', async (req, res) => {
  const { name, email, password } = req.body

  try {
    const hash = await bcrypt.hash(password, 10)

    await pool.query(
      'INSERT INTO users (name, email, password) VALUES ($1,$2,$3)',
      [name, email, hash]
    )

    res.status(201).json({ message: 'User created' })
  } catch (err) {
    res.status(400).json({ error: 'E-mail already registered' })
  }
})

app.get('/', (req, res) => {
  res.send('API is running')
})

app.get('/me/:id', async (req, res) => {
  const { id } = req.params

  const result = await pool.query(
    'SELECT name, email, cep, street, city, state FROM users WHERE id=$1',
    [id]
  )

  if (!result.rows.length) {
    return res.status(404).json({ error: 'User not found' })
  }

  res.json(result.rows[0])
})

app.put('/me/:id', async (req, res) => {
  const { id } = req.params
  const { name, cep, street, city, state } = req.body

  await pool.query(
    `UPDATE users 
     SET name=$1, cep=$2, street=$3, city=$4, state=$5
     WHERE id=$6`,
    [name, cep, street, city, state, id]
  )

  res.json({ message: 'Account updated' })
})

app.put('/me/:id/password', async (req, res) => {
  const { id } = req.params
  const { password } = req.body

  const hash = await bcrypt.hash(password, 10)

  await pool.query(
    'UPDATE users SET password=$1 WHERE id=$2',
    [hash, id]
  )

  res.json({ message: 'Password updated' })
})

//login route

app.post('/login', async (req, res) => {
  const { email, password } = req.body

  const result = await pool.query(
    'SELECT id, password FROM users WHERE email=$1',
    [email]
  )

  if (!result.rows.length)
    return res.status(401).json({ error: 'User not found' })

  const valid = await bcrypt.compare(password, result.rows[0].password)

  if (!valid)
    return res.status(401).json({ error: 'Invalid password' })

  res.json({ userId: result.rows[0].id })
})

//orders route

app.post('/orders', async (req, res) => {
  const { userId, cart } = req.body

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
    const total = (totalCents / 100).toFixed(2)

    // Inserir pedido
    const order = await pool.query(
      'INSERT INTO orders (user_id, total) VALUES ($1, $2) RETURNING id',
      [userId, parseFloat(total)]
    )

    const orderId = order.rows[0].id

    // Inserir itens do pedido
    for (const item of cart) {
      const product = productsData.find(p => p.id === item.productId)
      
      if (!product) continue
      
      const productPrice = (product.priceCents / 100).toFixed(2)
      
      // console.log(`Inserindo item: productId=${item.productId}, name=${product.name}, price=${productPrice}, qty=${item.quantity}`)

      await pool.query(
        `INSERT INTO order_items (order_id, product_id, name, price, quantity)
         VALUES ($1, $2, $3, $4, $5)`,
        [orderId, item.productId, product.name, parseFloat(productPrice), item.quantity]
      )
    }

    res.status(201).json({ orderId, total })
  } catch (err) {
    console.error('Error creating order:', err)
    res.status(500).json({ error: 'Error creating order', details: err.message })
  }
})

app.get('/orders/:userId', async (req, res) => {
  const { userId } = req.params

  const orders = await pool.query(
    'SELECT * FROM orders WHERE user_id=$1 ORDER BY created_at DESC',
    [userId]
  )

  res.json(orders.rows)
})

// WISHLIST ROUTES

// Adicionar produto à wishlist
app.post('/wishlist', async (req, res) => {
  const { userId, productId } = req.body

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

// Obter wishlist do usuário
app.get('/wishlist/:userId', async (req, res) => {
  const { userId } = req.params

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

// Remover da wishlist
app.delete('/wishlist/:userId/:productId', async (req, res) => {
  const { userId, productId } = req.params

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

app.post('/validate-coupon', async (req, res) => {
  const { code, orderTotal } = req.body

  try {
    const result = await pool.query(
      `SELECT id, discount_type, discount_value, min_order_amount, max_uses, current_uses
       FROM coupons 
       WHERE code=$1 AND is_active=true 
       AND valid_from <= CURRENT_TIMESTAMP 
       AND valid_until >= CURRENT_TIMESTAMP`,
      [code.toUpperCase()]
    )

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

// Listar cupons ativos
app.get('/coupons', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT code, description, discount_type, discount_value, min_order_amount
       FROM coupons 
       WHERE is_active=true 
       AND valid_from <= CURRENT_TIMESTAMP 
       AND valid_until >= CURRENT_TIMESTAMP
       ORDER BY discount_value DESC`
    )
    res.json(result.rows)
  } catch (err) {
    res.status(500).json({ error: 'Error fetching coupons' })
  }
})

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000')
})