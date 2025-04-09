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
      // Check if already in transit
      if (existingCargo.currentStatus === 'IN_TRANSIT') {
        // Even if in transit, still update cargo type if different
        if (cargoType && existingCargo.cargoType !== cargoType) {
          const updatedCargo = await prisma.cargoTracking.update({
            where: { trackingNumber: barcode },
            data: {
              cargoType: cargoType
            }
          })

          return {
            success: true,
            message: `包裹已在运输中，类型已更改为${cargoType === 'QUICK' ? '加急' : '普通'}`,
            cargo: updatedCargo,
            typeUpdated: true
          }
        }
        
        throw createError({
          statusCode: 409,
          message: '包裹已在运输中'
        })
      }

      // Update both status and type if needed
      const updatedCargo = await prisma.cargoTracking.update({
        where: { trackingNumber: barcode },
        data: {
          currentStatus: 'IN_TRANSIT',
          inTransitDate: new Date().toISOString(),
          cargoType: cargoType || existingCargo.cargoType
        }
      })

      const typeChanged = cargoType && existingCargo.cargoType !== cargoType

      return {
        success: true,
        message: typeChanged 
          ? `包裹已更新为在途状态，类型已更改为${cargoType === 'QUICK' ? '加急' : '普通'}`
          : '包裹已更新为在途状态',
        cargo: updatedCargo,
        typeUpdated: typeChanged
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