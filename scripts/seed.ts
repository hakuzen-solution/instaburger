import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Cria o admin inicial apenas se ainda não existir nenhuma conta admin.
  // Nunca sobrescreve a senha de um usuário já existente (evita resetar
  // silenciosamente a senha de produção ao rodar o seed de novo).
  const existingAdmin = await prisma.user.findFirst({ where: { role: 'admin' } })
  if (!existingAdmin) {
    const seedEmail = process.env.SEED_ADMIN_EMAIL
    const seedPassword = process.env.SEED_ADMIN_PASSWORD
    if (!seedEmail || !seedPassword) {
      throw new Error(
        'Nenhum admin encontrado. Defina SEED_ADMIN_EMAIL e SEED_ADMIN_PASSWORD no ambiente para criar o admin inicial.'
      )
    }
    const adminPasswordHash = await bcrypt.hash(seedPassword, 10)
    await prisma.user.create({
      data: {
        email: seedEmail,
        name: 'Administrador',
        password: adminPasswordHash,
        role: 'admin',
      },
    })
    console.log(`Admin inicial criado: ${seedEmail}`)
  } else {
    console.log('Admin já existe, senha não foi alterada.')
  }

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
