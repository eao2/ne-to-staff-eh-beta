import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

export default defineEventHandler(async (event) => {
  try {
    const { barcode, cargoType } = await readBody(event)

    if (!barcode) {
      throw new Error('请输入跟踪号码')
    }

    // Try to find existing cargo
    const existingCargo = await prisma.cargoTracking.findUnique({
      where: { trackingNumber: barcode }
    })

    if (existingCargo) {
      // Check if cargo type is different and an update is needed
      if (cargoType && existingCargo.cargoType !== cargoType) {
        const updatedCargo = await prisma.cargoTracking.update({
          where: { trackingNumber: barcode },
          data: {
            cargoType: cargoType // Only update the cargo type
          }
        })

        return {
          success: true,
          message: `包裹类型已更改为${cargoType === 'QUICK' ? '加急' : '普通'}`,
          cargo: updatedCargo,
          typeUpdated: true
        }
      }

      // If cargo type is the same, just return success
      return {
        success: true,
        message: '包裹类型未变更',
        cargo: existingCargo,
        typeUpdated: false
      }
    }

    // Create new cargo if doesn't exist
    const newCargo = await prisma.cargoTracking.create({
      data: {
        trackingNumber: barcode,
        currentStatus: 'IN_TRANSIT',
        cargoType: cargoType || 'NORMAL',
        inTransitDate: new Date().toISOString()
      }
    })

    return {
      success: true,
      message: '新包裹已创建并设为在途状态',
      cargo: newCargo,
      isNew: true
    }

  } catch (error) {
    console.error('Error updating cargo status:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || '更新包裹状态失败'
    })
  }
})