// server/api/cargo/set-delivered.ts
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { trackingNumber, phoneNumber } = body

  if (!trackingNumber || !phoneNumber) {
    throw createError({
      statusCode: 400,
      message: 'Tracking number and phone number are required'
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

    const cargo = await prisma.cargoTracking.findFirst({
      where: { 
        trackingNumber,
        userId: user.id
      }
    })

    if (!cargo) {
      throw createError({
        statusCode: 404,
        message: 'Cargo not found'
      })
    }

    if (cargo.currentStatus !== 'DELIVERED_TO_UB') {
      throw createError({
        statusCode: 400,
        message: 'Cargo must be in DELIVERED_TO_UB status to be delivered'
      })
    }

    const updatedCargo = await prisma.cargoTracking.update({
      where: { trackingNumber },
      data: {
        currentStatus: 'DELIVERED',
        paymentStatus: 'PAID',
        deliveredDate: new Date().toISOString()
      }
    })

    return updatedCargo
  } catch (error) {
    console.error('Error setting delivered status:', error)
    throw createError({
      statusCode: 500,
      message: error.message || 'Error updating cargo status'
    })
  }
})
