import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Hidden test account (NEVER expose these credentials)
  const testPasswordHash = await bcrypt.hash('gN@7i5pMpX', 10)
  await prisma.user.upsert({
    where: { email: 'abacus-94b48a2a@example.com' },
    update: { password: testPasswordHash },
    create: {
      email: 'abacus-94b48a2a@example.com',
      name: 'Test Admin',
      password: testPasswordHash,
      role: 'admin',
    },
  })

  // User-requested admin account: username "admin", password "admin123"
  const adminPasswordHash = await bcrypt.hash('admin123', 10)
  await prisma.user.upsert({
    where: { email: 'admin' },
    update: { password: adminPasswordHash },
    create: {
      email: 'admin',
      name: 'Administrador',
      password: adminPasswordHash,
      role: 'admin',
    },
  })

  // Categories
  const hamburgueres = await prisma.category.upsert({
    where: { id: 'cat-hamburgueres' },
    update: { name: 'Hamb\u00fargueres', displayOrder: 0 },
    create: { id: 'cat-hamburgueres', name: 'Hamb\u00fargueres', active: true, displayOrder: 0 },
  })

  const acompanhamentos = await prisma.category.upsert({
    where: { id: 'cat-acompanhamentos' },
    update: { name: 'Acompanhamentos', displayOrder: 1 },
    create: { id: 'cat-acompanhamentos', name: 'Acompanhamentos', active: true, displayOrder: 1 },
  })

  const bebidas = await prisma.category.upsert({
    where: { id: 'cat-bebidas' },
    update: { name: 'Bebidas', displayOrder: 2 },
    create: { id: 'cat-bebidas', name: 'Bebidas', active: true, displayOrder: 2 },
  })

  // Products
  const products = [
    { id: 'prod-hamburguer', name: 'Hamb\u00farguer', price: 800, categoryId: hamburgueres.id, displayOrder: 0 },
    { id: 'prod-cheeseburger', name: 'Cheeseburger', price: 900, categoryId: hamburgueres.id, displayOrder: 1 },
    { id: 'prod-hotdog', name: 'Hot Dog', price: 600, categoryId: hamburgueres.id, displayOrder: 2 },
    { id: 'prod-batata-p', name: 'Batata Frita (P)', price: 300, categoryId: acompanhamentos.id, displayOrder: 0 },
    { id: 'prod-batata-g', name: 'Batata Frita (G)', price: 450, categoryId: acompanhamentos.id, displayOrder: 1 },
    { id: 'prod-refrigerante', name: 'Refrigerante', price: 200, categoryId: bebidas.id, displayOrder: 0 },
    { id: 'prod-agua', name: '\u00c1gua', price: 150, categoryId: bebidas.id, displayOrder: 1 },
  ]

  for (const p of products) {
    await prisma.product.upsert({
      where: { id: p.id },
      update: { name: p.name, price: p.price, categoryId: p.categoryId, displayOrder: p.displayOrder },
      create: {
        id: p.id,
        name: p.name,
        price: p.price,
        categoryId: p.categoryId,
        active: true,
        displayOrder: p.displayOrder,
      },
    })
  }

  console.log('Seed completed successfully!')
}

main()
  .catch((e) => {
    console.error('Seed error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
