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

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000')
})