import prisma from './backend/prismaClient.js'

async function createAdmin() {
  try {
    const admin = await prisma.user.create({
      data: {
        name: 'Admin User',
        email: 'admin@volty.com',
        password: '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // 'password'
        isAdmin: true
      }
    });
    console.log('Admin user created:', admin.email);
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();