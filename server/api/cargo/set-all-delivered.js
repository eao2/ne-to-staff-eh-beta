import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { phoneNumber } = body

  if (!phoneNumber) {
    throw createError({
      statusCode: 400,
      message: 'Phone number is required'
    })
  }

  try {
    const user = await prisma.user.findUnique({
      where: { phoneNumber }
    })

    if (!user) {
      throw createError({
        statusCode: 404,
        message: 'User not found'
      })
    }

    const currentTime = new Date().toISOString()
    
    const updatedCargos = await prisma.cargoTracking.updateMany({
      where: {
        userId: user.id,
        currentStatus: 'DELIVERED_TO_UB'
      },
      data: {
        currentStatus: 'DELIVERED',
        paymentStatus: 'PAID',
        deliveredDate: currentTime
      }
    })

    return updatedCargos
  } catch (error) {
    console.error('Error setting all cargos to delivered:', error)
    throw createError({
      statusCode: 500,
      message: 'Error updating cargo statuses'
    })
  }
})