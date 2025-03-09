import { PrismaClient, CargoStatus } from "@prisma/client";

const prisma = new PrismaClient();

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const { trackingNumber } = body;

    if (!trackingNumber) {
      throw new Error("Tracking number is required.");
    }

    // Update cargo status to IN_TRANSIT
    const updatedCargo = await prisma.cargoTracking.update({
      where: {
        trackingNumber,
      },
      data: {
        currentStatus: CargoStatus.IN_TRANSIT,
        inTransitDate: new Date().toISOString(), // Set the transit date
      },
    });

    return { success: true, message: "Cargo set to IN_TRANSIT", cargo: updatedCargo };
  } catch (error) {
    console.error("Error setting cargo to IN_TRANSIT:", error);
    return { success: false, error: error.message };
  }
}); 