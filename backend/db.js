import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import prisma from './prismaClient.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config({ path: path.resolve(__dirname, '../.env') })

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

export default prisma