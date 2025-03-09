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

    // Only allow reverting if current status is IN_TRANSIT
    if (cargo.currentStatus !== 'IN_TRANSIT') {
      throw createError({
        statusCode: 400,
        message: 'Can only revert IN_TRANSIT status'
      })
    }

    // Update cargo status back to RECEIVED_AT_ERENHOT
    const updatedCargo = await prisma.cargoTracking.update({
      where: { trackingNumber: barcode },
      data: {
        currentStatus: 'RECEIVED_AT_ERENHOT',
        inTransitDate: null // Clear the transit date
      }
    })

    return {
      success: true,
      message: 'Cargo status reverted to RECEIVED_AT_ERENHOT',
      cargo: updatedCargo
    }
  } catch (error) {
    console.error('Error reverting cargo status:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Failed to revert cargo status'
    })
  }
}) 