import { PrismaClient, CargoStatus, CargoType, PaymentStatus } from '@prisma/client'

const prisma = new PrismaClient()

export default defineEventHandler(async (event) => {
    // Get the start of 6 months ago
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5)
    sixMonthsAgo.setDate(1)
    sixMonthsAgo.setHours(0, 0, 0, 0)
  
    // Get all months between now and 6 months ago
    const months = []
    for (let i = 0; i < 6; i++) {
      const monthStart = new Date(sixMonthsAgo)
      monthStart.setMonth(monthStart.getMonth() + i)
      
      const monthEnd = new Date(monthStart)
      monthEnd.setMonth(monthEnd.getMonth() + 1)
  
      const monthData = await prisma.cargoTracking.aggregate({
        where: {
          deliveredDate: {
            gte: monthStart,
            lt: monthEnd
          },
          currentStatus: CargoStatus.DELIVERED,
          paymentStatus: PaymentStatus.PAID,
          price: { not: null }
        },
        _sum: {
          price: true
        },
        _count: true
      })
  
      const revenue = Number(monthData._sum.price || 0)
      const count = monthData._count
      
      months.push({
        month: monthStart.toLocaleDateString('mn-MN', { year: 'numeric', month: 'long' }),
        revenue: revenue,
        count: count,
        averagePrice: count > 0 ? Math.round(revenue / count) : 0
      })
    }
  
    return months.reverse() // Most recent first
  })