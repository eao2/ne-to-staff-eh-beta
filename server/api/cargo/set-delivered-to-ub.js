// server/api/cargo/set-delivered-to-ub.js
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { trackingNumber, cargo, user } = body
 
  if (!trackingNumber) {
    throw createError({
      statusCode: 400,
      message: 'Tracking number is required'
    })
  }
  try {
    return await prisma.$transaction(async (tx) => {
      // Find existing cargo
      const existingCargo = await tx.cargoTracking.findUnique({
        where: { trackingNumber }
      })
     
      // Process user data
      let userId = existingCargo?.userId || null
     
      if (user?.phoneNumber) {
        const dbUser = await tx.user.findUnique({
          where: { phoneNumber: user.phoneNumber }
        })
       
        if (dbUser) {
          userId = dbUser.id
        } else if (user.name) {
          const newUser = await tx.user.create({
            data: {
              phoneNumber: user.phoneNumber,
              name: user.name,
              userType: 'TEMPORARY'
            }
          })
          userId = newUser.id
        }
      }
      // Hard code status and set current time
      const currentTime = new Date().toISOString()
     
      const updateData = {
        currentStatus: 'DELIVERED_TO_UB',
        deliveredToUBDate: currentTime,
        userId
      }
      // Update fields only if provided
      if (cargo.price !== undefined) {
        updateData.price = Number(cargo.price)
      }
     
      if (cargo.cargoType) {
        updateData.cargoType = cargo.cargoType
      }
     
      if (cargo.nickname) {
        updateData.nickname = cargo.nickname
      }
     
      // Create or update cargo
      return await tx.cargoTracking.upsert({
        where: { trackingNumber },
        update: updateData,
        create: {
          trackingNumber: trackingNumber.trim(),
          ...updateData,
          cargoType: cargo.cargoType || 'NORMAL',
          nickname: cargo.nickname || null,
          price: cargo.price !== undefined ? Number(cargo.price) : null,
        }
      })
    })
  } catch (error) {
    console.error('Error saving cargo:', error)
    throw createError({
      statusCode: 500,
      message: 'Error saving cargo information'
    })
  }
})