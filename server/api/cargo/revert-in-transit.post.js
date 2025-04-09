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
        message: '包裹未找到'
      })
    }

    // Only allow reverting if current status is IN_TRANSIT
    if (cargo.currentStatus !== 'IN_TRANSIT') {
      throw createError({
        statusCode: 400,
        message: '只能退回在途中的包裹'
      })
    }

    // Check if cargo was ever received at Erenhot
    if (!cargo.receivedAtErenhotDate) {
      // Delete cargo if it was never received at Erenhot
      const deletedCargo = await prisma.cargoTracking.delete({
        where: { trackingNumber: barcode }
      })

      return {
        success: true,
        message: '未在二连登记的包裹已删除',
        cargo: deletedCargo,
        action: 'DELETED'
      }
    }

    // Update cargo status back to RECEIVED_AT_ERENHOT if it was previously received
    const updatedCargo = await prisma.cargoTracking.update({
      where: { trackingNumber: barcode },
      data: {
        currentStatus: 'RECEIVED_AT_ERENHOT',
        inTransitDate: null // Clear the transit date
      }
    })

    return {
      success: true,
      message: '包裹状态已退回到二连',
      cargo: updatedCargo,
      action: 'REVERTED'
    }
  } catch (error) {
    console.error('Error reverting cargo status:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || '退回包裹失败'
    })
  }
})