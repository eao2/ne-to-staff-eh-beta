import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

export default defineEventHandler(async (event) => {
  try {
    const { barcode } = await readBody(event)

    if (!barcode) {
      throw new Error('Barcode is required')
    }

    // Try to find existing cargo
    const cargo = await prisma.cargoTracking.findUnique({
      where: { trackingNumber: barcode }
    })

    if (!cargo) {
      throw createError({
        statusCode: 404,
        message: 'Cargo not found'
      })
    }

    // Check if already in transit
    if (cargo.currentStatus === 'IN_TRANSIT') {
      throw createError({
        statusCode: 409, // Conflict
        message: 'Энэ карго замд гарсан байна'
      })
    }

    // Only allow transition from RECEIVED_AT_ERENHOT to IN_TRANSIT
    if (cargo.currentStatus !== 'RECEIVED_AT_ERENHOT') {
      // If PRE_REGISTERED, give a more specific message
      if (cargo.currentStatus === 'PRE_REGISTERED') {
        throw createError({
          statusCode: 400,
          message: 'Энэ карго Эрээнд бүртгэгдээгүй байна'
        })
      }
      throw createError({
        statusCode: 400,
        message: 'Can only set IN_TRANSIT status for cargo that is RECEIVED_AT_ERENHOT'
      })
    }

    // Update cargo status to IN_TRANSIT
    const updatedCargo = await prisma.cargoTracking.update({
      where: { trackingNumber: barcode },
      data: {
        currentStatus: 'IN_TRANSIT',
        inTransitDate: new Date().toISOString()
      }
    })

    return {
      success: true,
      message: 'Cargo status updated to IN_TRANSIT',
      cargo: updatedCargo
    }
  } catch (error) {
    console.error('Error updating cargo status:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Failed to update cargo status'
    })
  }
}) 