import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { trackingNumber } = body

  try {
    const cargo = await prisma.cargoTracking.findUnique({
      where: { trackingNumber },
      include: { user: true }
    })
    
    return { cargo }
  } catch (error) {
    throw createError({
      statusCode: 500,
      message: 'Error searching cargo'
    })
  }
})