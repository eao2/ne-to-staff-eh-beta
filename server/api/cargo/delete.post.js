import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

export default defineEventHandler(async (event) => {
  try {
    const { barcode } = await readBody(event)

    if (!barcode) {
      throw new Error('Barcode is required')
    }

    // Try to find the cargo first
    const cargo = await prisma.cargoTracking.findUnique({
      where: { trackingNumber: barcode }
    })

    if (!cargo) {
      throw createError({
        statusCode: 404,
        message: 'Cargo not found'
      })
    }

    // Check if cargo was pre-registered
    if (cargo.preRegisteredDate) {
      throw createError({
        statusCode: 403,
        message: 'Cannot delete pre-registered cargo'
      })
    }

    // Only allow deletion of RECEIVED_AT_ERENHOT status
    if (cargo.currentStatus !== 'RECEIVED_AT_ERENHOT') {
      throw createError({
        statusCode: 400,
        message: 'Can only delete cargo in RECEIVED_AT_ERENHOT status'
      })
    }

    // Delete the cargo
    const deletedCargo = await prisma.cargoTracking.delete({
      where: { trackingNumber: barcode }
    })

    return {
      success: true,
      message: 'Cargo tracking deleted successfully',
      cargo: deletedCargo
    }
  } catch (error) {
    console.error('Error deleting cargo:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Failed to delete cargo'
    })
  }
}) 