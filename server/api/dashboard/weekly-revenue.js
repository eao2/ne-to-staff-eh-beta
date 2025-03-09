import { PrismaClient, CargoStatus, CargoType, PaymentStatus } from '@prisma/client'

const prisma = new PrismaClient()

export default defineEventHandler(async (event) => {
    const dates = []
    const revenues = []
    
    // Get last 7 days
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      date.setHours(0, 0, 0, 0)
      
      const nextDay = new Date(date)
      nextDay.setDate(nextDay.getDate() + 1)
  
      const dayRevenue = await prisma.cargoTracking.aggregate({
        where: {
          deliveredDate: {
            gte: date,
            lt: nextDay
          },
          currentStatus: CargoStatus.DELIVERED,
          paymentStatus: PaymentStatus.PAID,
          price: { not: null }
        },
        _sum: {
          price: true
        }
      })
  
      dates.push(date.toLocaleDateString('mn-MN', { month: 'short', day: 'numeric' }))
      revenues.push(Number(dayRevenue._sum.price || 0))
    }
  
    return { dates, revenues }
  })