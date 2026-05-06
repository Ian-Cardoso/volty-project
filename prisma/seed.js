import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  console.log("Iniciando seed...");

  await prisma.review.deleteMany();
  await prisma.wishlist.deleteMany();
  await prisma.product.deleteMany();
  await prisma.user.deleteMany();

  const admin = await prisma.user.create({
    data: {
      name: "Ian Cardoso",
      email: "ian8975c@gmail.com",
      password: "1234",
      isAdmin: true,
      cep: "74343490",
      street: "Rua da raia",
      city: "Goiania",
      state: "GO",
    },
  });

  const cliente = await prisma.user.create({
    data: {
      name: "João Silva",
      email: "iancardoso964@gmail.com",
      password: "123",
      isAdmin: false,
    },
  });

  const p1 = await prisma.product.create({
    data: {
      name: "Teclado Mecânico RGB",
      description: "Switch Blue, layout ABNT2",
      price: 250.0,
      imageUrl: "teclado.jpg",
      inStock: true,
    },
  });

  const p2 = await prisma.product.create({
    data: {
      name: "Mouse Gamer 12000 DPI",
      description: "Sensor óptico de alta precisão",
      price: 150.0,
      imageUrl: "mouse.jpg",
      inStock: true,
    },
  });

  const cupom = await prisma.coupon.create({
    data: {
      code: "VOLTY10",
      description: "10% de desconto na primeira compra",
      discountType: "percentage",
      discountValue: 10.0,
      isActive: true,
    },
  });

  await prisma.wishlist.create({
    data: {
      userId: cliente.id,
      productId: String(p1.id),
    },
  });

  console.log("Seed finalizado com sucesso!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });