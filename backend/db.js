import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import pkg from 'pg'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Carregar .env da raiz do projeto para garantir que as variáveis de ambiente sejam acessíveis
dotenv.config({ path: path.resolve(__dirname, '../.env') })

const { Pool } = pkg

// Validar variáveis de ambiente obrigatórias
const requiredEnvVars = ['DB_USER', 'DB_HOST', 'DB_NAME', 'DB_PASSWORD', 'DB_PORT']
const missingVars = requiredEnvVars.filter(varName => !process.env[varName])

if (missingVars.length > 0) {
  throw new Error(
    `Missing required environment variables: ${missingVars.join(', ')}\n` +
    `Please check your .env file. Example:\n` +
    `  DB_USER=postgres\n` +
    `  DB_HOST=localhost\n` +
    `  DB_NAME=volty\n` +
    `  DB_PASSWORD=your_password\n` +
    `  DB_PORT=5432`
  )
}

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT, 10)
})

export default pool