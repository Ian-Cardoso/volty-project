import express from 'express'
import nodemailer from 'nodemailer'
import crypto from 'crypto'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { Prisma } from '@prisma/client'
import cors from 'cors'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'
import swaggerUi from 'swagger-ui-express'
import swaggerSpec from './swagger.js'
import { UserSchema } from '../scripts/validators/userValidator.js'
import { z } from 'zod'
import prisma from './prismaClient.js'

dotenv.config()

const __filename = fileURLToPath(import.meta.url) //caminho do arquivo atual
const __dirname = path.dirname(__filename) //caminho do diretório atual

// Carregar produtos
const productsData = JSON.parse(fs.readFileSync(path.join(__dirname, 'products.json'), 'utf-8'))
const app = express()

const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000,http://127.0.0.1:5501,null').split(',')

app.use(cors({
  origin: '*', 
  methods: ['GET', 'POST', 'PUT', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// app.use(cors({
//   origin: (origin, callback) => {
//     const cleanOrigin = origin ? origin.trim() : null;
    
//     if (!origin || allowedOrigins.map(o => o.trim()).includes(cleanOrigin)) {
//       callback(null, true)
//     } else {
//       console.log('CORS bloqueou a origem:', origin); // Log para debug
//       callback(new Error('Not allowed by CORS'))
//     }
//   },
//   credentials: true,
//   methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
//   allowedHeaders: ['Content-Type', 'Authorization'],
//   optionsSuccessStatus: 200
// }))

app.use((req, res, next) => {
  console.log('HTTP', req.method, req.path)
  next()
})

app.use(express.json())
app.use('/assets', express.static(path.join(__dirname, '../html')))
app.use('/scripts', express.static(path.join(__dirname, '../scripts')))
app.use('/styles', express.static(path.join(__dirname, '../styles')))
app.get('/admin-dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, '../html/admin-dashboard.html'))
})

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  swaggerOptions: {
    tryItOutEnabled: true,
    deepLinking: true
  },
  customCss: ` .swagger-ui { background: #0f0f0f; } 
              .swagger-ui .topbar { background: #1a1a1a; } 
              .swagger-ui .topbar .topbar-wrapper { justify-content: space-between !important }
              .dark-mode-toggle { display: none }`
}))

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT),
  secure: true,
  auth:{
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD
  }, 
  tls: {
    rejectUnauthorized: false,
    // minVersion: 'TLSv1.2'
  }
})

transporter.verify(function (error, success) {
  if (error) {
    console.log("Erro na configuração do SMTP:", error);
  } else {
    console.log("Servidor pronto para enviar mensagens!");
  }
});

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

const requireAdmin = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId }
    })

    if (!user || !user.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' })
    }

    next()
  } catch (err) {
    console.error('Admin verification error:', err)
    res.status(500).json({ error: 'Unable to verify admin privileges' })
  }
}

const ProductSchema = z.object({
  name: z.string().min(3, 'O nome deve ter pelo menos 3 caracteres'),
  description: z.string().min(10, 'A descrição deve ter pelo menos 10 caracteres'),
  price: z.number().positive('O preço deve ser um valor positivo'),
  imageUrl: z.string().url('A imagem deve ser uma URL válida'),
  inStock: z.boolean()
})

// async function sendOrderConfirmation(user, orderId, orderData, items) {
//   const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${token}&userId=${user.id}`
  
//   // HTML template with order details, items list, total, etc.
  
//   await transporter.sendMail({
//     from: process.env.FROM_EMAIL,
//     to: user.email,
//     subject: `Pedido #${generateOrderDisplayId(orderId)} confirmado!`,
//     html: orderEmailTemplate
//   })
// }

async function sendPasswordResetEmail(user, token) {
  const resetLink = `${process.env.FRONTEND_URL || 'http://127.0.0.1:5501'}/html/reset-password.html?token=${token}&userId=${user.id}`
  
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Redefinir Senha - Volty</title>
</head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h2>Oi ${user.name},</h2>
  <p>Você solicitou redefinição de senha.</p>
  
  <a href="${resetLink}" style="background: #183480; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">🔑  Redefinir Senha</a>
  
  <p style="margin-top: 20px;"><small>Link válido por 15 minutos. Se você não solicitou, ignore este email.</small></p>
  
  <hr>
  <p>Atenciosamente,<br>Equipe Volty</p>
</body>
</html>`;

  await transporter.sendMail({
    from: process.env.FROM_EMAIL || '"Volty" <ian8975c@gmail.com>',
    to: user.email,
    subject: 'Redefinir sua senha - Volty',
    html
  })
}


const generateOrderDisplayId = (dbId) => {
  const offset = 10000; 
  return `ORD-${(dbId + offset).toString(36).toUpperCase()}`;
};

app.post('/register', async (req, res) => {
  try {

    if (!req.body.email || !req.body.password || !req.body.name) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    const normalizedEmail = req.body.email.trim().toLowerCase()

    console.log('EMAIL NORMALIZADO:', normalizedEmail)

    // Validação com Zod
    const validatedData = UserSchema.parse({
      name: req.body.name,
      email: normalizedEmail,
      password: req.body.password
    })

    const hash = await bcrypt.hash(validatedData.password, 10)

    const user = await prisma.user.create({
      data: {
        name: validatedData.name,
        email: validatedData.email,
        password: hash
      },
      select: { id: true, email: true }
    })

    console.log('USUÁRIO CRIADO:', user)

    return res.status(201).json({
      message: 'User created',
      user
    })

  } catch (err) {
  console.error('ERRO COMPLETO:', err)

  if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
    return res.status(409).json({ error: 'E-mail already registered' })
  }

  return res.status(400).json({
    error: err.message,
    // fullError: err
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
    const user = await prisma.user.findUnique({
      where: { id: parseInt(id) },
      select: { id: true, name: true, email: true, cep: true, street: true, city: true, state: true }
    })

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    res.json(user)
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
    await prisma.user.update({
      where: { id: parseInt(id) },
      data: { name, cep, street, city, state }
    })

    res.json({ message: 'Account updated' })
  } catch (err) {
    console.error('Update error:', err)
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
      return res.status(404).json({ error: 'User not found' })
    }
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
    const existingUser = await prisma.user.findUnique({
      where: { id: parseInt(id) },
      select: { password: true }
    })

    if (!existingUser) {
      return res.status(404).json({ error: 'User not found' })
    }

    const isValid = await bcrypt.compare(currentPassword, existingUser.password)
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid current password' })
    }

    const hash = await bcrypt.hash(newPassword, 10)

    await prisma.user.update({
      where: { id: parseInt(id) },
      data: { password: hash }
    })

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

    const user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user)
      return res.status(401).json({ error: 'Invalid credentials' })

    const valid = await bcrypt.compare(password, user.password)

    if (!valid)
      return res.status(401).json({ error: 'Invalid credentials' })

    const userId = user.id

    // Generate Access Token 15 min
    const accessToken = jwt.sign(
      { userId, email },
      process.env.JWT_SECRET || 'your_jwt_secret',
      { expiresIn: process.env.JWT_EXPIRATION || '15m' }
    )

    // Generate Refresh Token 
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

app.post('/admin/products', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const validatedData = ProductSchema.parse(req.body)

    const product = await prisma.product.create({
      data: {
        name: validatedData.name,
        description: validatedData.description,
        price: validatedData.price,
        imageUrl: validatedData.imageUrl,
        inStock: validatedData.inStock
      }
    })

    res.status(201).json({ message: 'Product created', product })
  } catch (err) {
    console.error('Create product error:', err)

    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.errors.map(e => e.message).join(', ') })
    }

    res.status(500).json({ error: 'Error creating product' })
  }
})

app.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, name: true }
    })

    if (!user) return res.status(404).json({ error: 'User not found' })

    const token = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000)

    await prisma.resetToken.create({
      data: {
        userId: user.id,
        token,
        expiresAt,
        used: false
      }
    })

    await sendPasswordResetEmail(user, token)
    res.json({ message: 'Password reset email sent' })

  } catch (error) {
    console.error('Erro ao enviar e-mail:', error)
    res.json({ message: 'Token gerado no banco, mas o e-mail falhou.', token: token });
  }
})

app.post('/reset-password', async (req, res) => {
  const { token, userId, newPassword } = req.body

  const resetToken = await prisma.resetToken.findFirst({
    where: {
      userId: parseInt(userId),
      token,
      expiresAt: { gt: new Date() },
      used: false
    }
  })

  if (!resetToken) return res.status(400).json({ error: 'Invalid/expired token' })
  
  const hash = await bcrypt.hash(newPassword, 10)
  await prisma.user.update({
    where: { id: parseInt(userId) },
    data: { password: hash }
  })
  await prisma.resetToken.update({
    where: { id: resetToken.id },
    data: { used: true }
  })

  res.json({ message: 'Password reset successful' })
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

  if (req.user.userId !== userId) {
    return res.status(403).json({ error: 'Unauthorized' })
  }

  if (!couponId && couponCode) {
    const couponByCode = await prisma.coupon.findUnique({
      where: { code: couponCode.toUpperCase() },
      select: { id: true }
    })
    if (couponByCode) {
      couponId = couponByCode.id
    }
  }

  try {
    if (!cart || !Array.isArray(cart) || cart.length === 0) {
      return res.status(400).json({ error: 'Empty cart' })
    }

    const totalCents = cart.reduce((sum, item) => {
      const product = productsData.find(p => p.id === item.productId)
      if (!product) return sum
      return sum + (product.priceCents * item.quantity)
    }, 0)
    const total = parseFloat((totalCents / 100).toFixed(2))

    let discountAmount = 0
    let finalTotal = total
    let appliedCouponId = null

    if (couponId) {
      const coupon = await prisma.coupon.findUnique({
        where: { id: couponId }
      })

      if (coupon && coupon.isActive) {
        const now = new Date()
        const validFromOk = !coupon.validFrom || coupon.validFrom <= now
        const validUntilOk = !coupon.validUntil || coupon.validUntil >= now

        if (validFromOk && validUntilOk && (!coupon.maxUses || coupon.currentUses < coupon.maxUses)) {
          if (total >= Number(coupon.minOrderAmount)) {
            if (coupon.discountType === 'percentage') {
              discountAmount = parseFloat(((total * Number(coupon.discountValue)) / 100).toFixed(2))
            } else {
              discountAmount = parseFloat(Number(coupon.discountValue).toFixed(2))
            }
            finalTotal = Math.max(0, parseFloat((total - discountAmount).toFixed(2)))
            appliedCouponId = coupon.id
          }
        }
      }
    }

    const orderItems = cart.map(item => {
      const product = productsData.find(p => p.id === item.productId)
      if (!product) return null

      const productPrice = parseFloat((product.priceCents / 100).toFixed(2))
      return {
        productId: item.productId,
        name: product.name,
        price: productPrice,
        quantity: item.quantity
      }
    }).filter(Boolean)

    const transactionSteps = []
    if (appliedCouponId) {
      transactionSteps.push(
        prisma.coupon.update({
          where: { id: appliedCouponId },
          data: { currentUses: { increment: 1 } }
        })
      )
    }

    transactionSteps.push(
      prisma.order.create({
        data: {
          userId,
          total,
          discountAmount,
          finalTotal,
          couponId: appliedCouponId,
          status: 'confirmed',
          orderItems: {
            create: orderItems
          }
        },
        select: { id: true }
      })
    )

    const transactionResult = await prisma.$transaction(transactionSteps)
    const orderRecord = transactionResult[transactionResult.length - 1]

    res.status(201).json({ orderId: orderRecord.id, total, discountAmount, finalTotal })
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

  if (req.user.userId !== parseInt(userId)) {
    return res.status(403).json({ error: 'Unauthorized' })
  }

  try {
    const orders = await prisma.order.findMany({
      where: { userId: parseInt(userId) },
      orderBy: { createdAt: 'desc' }
    })

    const ordersWithDisplayId = orders.map(order => ({
      ...order,
      displayId: generateOrderDisplayId(order.id)
    }))

    res.json(ordersWithDisplayId)
  } catch (err) {
    console.error('Fetch orders error:', err)
    res.status(500).json({ error: 'Server error' })
  }
})

app.put('/orders/:orderId/status', async (req, res) => {
  const { orderId } = req.params
  const { status } = req.body

  const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled']
  
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid status' })
  }

  try {
    const updatedOrder = await prisma.order.update({
      where: { id: parseInt(orderId) },
      data: { status },
      select: { id: true, status: true }
    })

    res.json({ message: 'Order status updated', order: updatedOrder })
  } catch (err) {
    console.error('Error updating order:', err)
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
      return res.status(404).json({ error: 'Order not found' })
    }
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

  if (req.user.userId !== userId) {
    return res.status(403).json({ error: 'Unauthorized' })
  }

  try {
    await prisma.wishlist.createMany({
      data: [{ userId, productId }],
      skipDuplicates: true
    })
    res.status(201).json({ message: 'Added to wishlist' })
  } catch (err) {
    console.error('Wishlist create error:', err)
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
    const wishlist = await prisma.wishlist.findMany({
      where: { userId: parseInt(userId) },
      select: { productId: true, createdAt: true },
      orderBy: { createdAt: 'desc' }
    })
    res.json(wishlist)
  } catch (err) {
    console.error('Wishlist fetch error:', err)
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
    await prisma.wishlist.deleteMany({
      where: { userId: parseInt(userId), productId }
    })
    res.json({ message: 'Removed from wishlist' })
  } catch (err) {
    console.error('Wishlist delete error:', err)
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

    const review = await prisma.review.upsert({
      where: {
        userId_productId: {
          userId: parseInt(userId),
          productId
        }
      },
      update: {
        rating,
        title,
        comment,
        updatedAt: new Date()
      },
      create: {
        userId: parseInt(userId),
        productId,
        rating,
        title,
        comment
      },
      select: { id: true }
    })

    res.status(201).json({ reviewId: review.id })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error creating review' })
  }
})

app.get('/reviews/:productId', async (req, res) => {
  const { productId } = req.params

  try {
    const reviews = await prisma.review.findMany({
      where: { productId },
      select: { id: true, userId: true, rating: true, title: true, comment: true, helpfulCount: true, createdAt: true },
      orderBy: [{ helpfulCount: 'desc' }, { createdAt: 'desc' }]
    })
    res.json(reviews)
  } catch (err) {
    console.error('Reviews fetch error:', err)
    res.status(500).json({ error: 'Error fetching reviews' })
  }
})

app.put('/reviews/:reviewId/helpful', async (req, res) => {
  const { reviewId } = req.params

  try {
    await prisma.review.update({
      where: { id: parseInt(reviewId) },
      data: { helpfulCount: { increment: 1 } }
    })
    res.json({ message: 'Review marked as helpful' })
  } catch (err) {
    console.error('Review helpful update error:', err)
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
    const coupon = await prisma.coupon.findUnique({
      where: { code: code.toUpperCase() }
    })

    if (!coupon || !coupon.isActive) {
      return res.status(404).json({ error: 'Invalid or expired coupon' })
    }

    const now = new Date()
    const validFromOk = !coupon.validFrom || coupon.validFrom <= now
    const validUntilOk = !coupon.validUntil || coupon.validUntil >= now

    if (!validFromOk || !validUntilOk) {
      return res.status(404).json({ error: 'Invalid or expired coupon' })
    }

    if (coupon.maxUses && coupon.currentUses >= coupon.maxUses) {
      return res.status(400).json({ error: 'Coupon usage limit reached' })
    }

    if (orderTotal < Number(coupon.minOrderAmount)) {
      return res.status(400).json({ 
        error: `Minimum order amount is R$ ${coupon.minOrderAmount}` 
      })
    }

    let discountAmount = 0
    if (coupon.discountType === 'percentage') {
      discountAmount = (orderTotal * Number(coupon.discountValue)) / 100
    } else {
      discountAmount = Number(coupon.discountValue)
    }

    res.json({ 
      couponId: coupon.id, 
      discountAmount, 
      discountType: coupon.discountType,
      discountValue: Number(coupon.discountValue) 
    })
  } catch (err) {
    console.error('Coupon validation error:', err)
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
    const now = new Date()
    const coupons = await prisma.coupon.findMany({
      where: {
        isActive: true,
        AND: [
          { OR: [{ validFrom: null }, { validFrom: { lte: now } }] },
          { OR: [{ validUntil: null }, { validUntil: { gte: now } }] }
        ]
      },
      select: { id: true, code: true, description: true, discountType: true, discountValue: true, minOrderAmount: true, validUntil: true },
      orderBy: { discountValue: 'desc' }
    })
    res.json(coupons)
  } catch (err) {
    console.error('Coupons fetch error:', err)
    res.status(500).json({ error: 'Error fetching coupons' })
  }
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`)
  console.log(`Swagger documentation http://localhost:${PORT}/api-docs`)
})