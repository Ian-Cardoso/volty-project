import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import { PrismaClient } from '@prisma/client'


const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config({ path: path.resolve(__dirname, '../.env') })

// const prisma = new PrismaClient()
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
})

export default prisma