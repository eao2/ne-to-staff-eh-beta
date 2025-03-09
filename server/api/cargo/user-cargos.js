// server/api/cargo/user-cargos.ts
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { phoneNumber } = body

  if (!phoneNumber) {
    throw createError({
      statusCode: 400,
      message: 'Phone number is required'
    })
  }

  try {
    const user = await prisma.user.findUnique({
      where: { phoneNumber },
      include: {
        cargos: {
          orderBy: {
            updatedAt: 'desc'
          },
          select: {
            id: true,
            trackingNumber: true,
            nickname: true,
            cargoType: true,
            currentStatus: true,
            price: true,
            preRegisteredDate: true,
            receivedAtErenhotDate: true,
            inTransitDate: true,
            deliveredToUBDate: true,
            deliveredDate: true,
            updatedAt: true
          }
        }
      }
    })

    if (!user) {
      return {
        cargos: [],
        name: '',
        message: 'No user found with this phone number'
      }
    }

    return {
      cargos: user.cargos,
      name: user.name,
      message: `Found ${user.cargos.length} cargos for ${user.name || 'unregistered user'}`
    }

  } catch (error) {
    console.error('Error fetching user cargos:', error)
    throw createError({
      statusCode: 500,
      message: 'Error fetching user cargos'
    })
  }
})