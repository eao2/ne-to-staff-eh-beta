import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

export default defineEventHandler(async (event) => {
  try {
    const { barcode } = await readBody(event)

    if (!barcode) {
      throw new Error('Barcode is required')
    }

    // Try to find existing cargo
    const existingCargo = await prisma.cargoTracking.findUnique({
      where: { trackingNumber: barcode }
    })

    if (existingCargo) {
      // Update existing cargo's receive time if not already received
      if (existingCargo.currentStatus === 'RECEIVED_AT_ERENHOT') {
        throw createError({
          statusCode: 409,
          message: '包裹已经登记'
        })
      }

      const updatedCargo = await prisma.cargoTracking.update({
        where: { trackingNumber: barcode },
        data: {
          currentStatus: 'RECEIVED_AT_ERENHOT',
          receivedAtErenhotDate: new Date().toISOString(),
        }
      })

      return {
        success: true,
        message: '包裹状态已更新',
        cargo: updatedCargo
      }
    }

    // Create new cargo if doesn't exist
    const newCargo = await prisma.cargoTracking.create({
      data: {
        trackingNumber: barcode,
        currentStatus: 'RECEIVED_AT_ERENHOT',
        receivedAtErenhotDate: new Date().toISOString()
      }
    })

    return {
      success: true,
      message: '新包裹已登记',
      cargo: newCargo
    }
  } catch (error) {
    console.error('Error receiving cargo:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || '登记包裹失败'
    })
  }
})