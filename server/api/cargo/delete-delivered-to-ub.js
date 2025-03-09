// server/api/cargo/delete-delivered-to-ub.js
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { trackingNumber } = body
 
  if (!trackingNumber) {
    throw createError({
      statusCode: 400,
      message: 'Tracking number is required'
    })
  }
  try {
    // Find the cargo first to verify it has DELIVERED_TO_UB status and no other dates
    const existingCargo = await prisma.cargoTracking.findUnique({
      where: { trackingNumber }
    })
    if (!existingCargo) {
      throw createError({
        statusCode: 404,
        message: 'Cargo not found'
      })
    }
    // Check if the cargo has DELIVERED_TO_UB status and no other dates
    if (existingCargo.currentStatus !== 'DELIVERED_TO_UB') {
      throw createError({
        statusCode: 403,
        message: 'Can only delete cargos with DELIVERED_TO_UB status'
      })
    }
    
    // Check if any other date fields exist
    const hasPreviousDates =
      existingCargo.preRegisteredDate ||
      existingCargo.receivedAtErenhotDate ||
      existingCargo.inTransitDate ||
      existingCargo.deliveredDate
      
    if (hasPreviousDates) {
      throw createError({
        statusCode: 403,
        message: 'Cannot delete cargo with existing history'
      })
    }
    
    // Delete the cargo
    await prisma.cargoTracking.delete({
      where: { trackingNumber }
    })
    return { success: true }
  } catch (error) {
    console.error('Error deleting cargo:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Error deleting cargo information'
    })
  }
})