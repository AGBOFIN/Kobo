import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const existingPacks = await prisma.creditPack.findMany()
  
  if (existingPacks.length === 0) {
    await prisma.creditPack.createMany({
      data: [
        {
          name: 'Pack Débutant',
          price: 500,
          creditsCount: 5,
          active: true,
        },
        {
          name: 'Pack Standard',
          price: 1000,
          creditsCount: 15,
          active: true,
        },
        {
          name: 'Pack Pro',
          price: 2000,
          creditsCount: 50,
          active: true,
        },
      ],
    })

    console.log('Credit packs seeded successfully')
  } else {
    console.log('Credit packs already exist, skipping seed')
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })