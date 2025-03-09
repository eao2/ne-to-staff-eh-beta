import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

export default defineEventHandler(async (event) => {
  try {
    const { barcode, cargoType } = await readBody(event)

    if (!barcode) {
      throw new Error('Barcode is required')
    }

    // Try to find existing cargo
    const existingCargo = await prisma.cargoTracking.findUnique({
      where: { trackingNumber: barcode }
    })

    // If cargo exists and already received at Erenhot, prevent duplicate registration
    if (existingCargo && existingCargo.currentStatus === 'RECEIVED_AT_ERENHOT') {
      throw createError({
        statusCode: 409, // Conflict
        message: 'Энэ карго бүртгэгдсэн байна'
      })
    }

    // If cargo exists with PRE_REGISTERED status, update it
    if (existingCargo && existingCargo.currentStatus === 'PRE_REGISTERED') {
      const updatedCargo = await prisma.cargoTracking.update({
        where: { trackingNumber: barcode },
        data: {
          currentStatus: 'RECEIVED_AT_ERENHOT',
          receivedAtErenhotDate: new Date().toISOString(),
          cargoType: cargoType || existingCargo.cargoType,
          // Keep existing user relation
          userId: existingCargo.userId
        }
      })
      return {
        success: true,
        message: 'Pre-registered cargo updated to RECEIVED_AT_ERENHOT',
        cargo: updatedCargo
      }
    }

    // Create new cargo if doesn't exist
    const newCargo = await prisma.cargoTracking.create({
      data: {
        trackingNumber: barcode,
        currentStatus: 'RECEIVED_AT_ERENHOT',
        receivedAtErenhotDate: new Date().toISOString(),
        cargoType: cargoType || 'NORMAL'
      }
    })

    return {
      success: true,
      message: 'New cargo received at Erenhot',
      cargo: newCargo
    }
  } catch (error) {
    console.error('Error receiving cargo:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Failed to receive cargo'
    })
  }
}) 