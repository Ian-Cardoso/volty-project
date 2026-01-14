import express from 'express'
import bcrypt from 'bcrypt'
import pkg from 'pg'
import cors from 'cors'

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


// app.get('/me/:id', async (req, res) => {
//   const { id } = req.params

//   const result = await pool.query(
//     'SELECT name, email, cep, street, city, state FROM users WHERE id=$1',
//     [id]
//   )

//   res.json(result.rows[0])
// })

app.get('/me/:id', async (req, res) => {
  const { id } = req.params

  const result = await pool.query(
    'SELECT name, email, cep, street, city, state FROM users WHERE id=$1',
    [id]
  )

  if (!result.rows.length) {
    return res.status(404).json({ error: 'Usuário não encontrado' })
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
    return res.status(401).json({ error: 'Usuário não encontrado' })

  const valid = await bcrypt.compare(password, result.rows[0].password)

  if (!valid)
    return res.status(401).json({ error: 'Senha inválida' })

  res.json({ userId: result.rows[0].id })
})


app.listen(3000, () => {
  console.log('Server running on http://localhost:3000')
})
