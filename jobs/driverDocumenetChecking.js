import cron from "node-cron";
import { DriverDocument } from "../models/driver/driverDocumentModel.js";

// 🔹 Run every day at midnight
cron.schedule("0 0 * * *", async () => {
  console.log("🔄 Running daily driver document expiry check...");

  try {
    const today = new Date();
    const next30Days = new Date();
    next30Days.setDate(today.getDate() + 30);

    // 1️⃣ Expired: expiryDate < today
    await DriverDocument.updateMany(
      { expiryDate: { $lt: today } },
      { $set: { status: "expired" } }
    );

    // 2️⃣ Expiring soon: expiryDate within next 30 days
    await DriverDocument.updateMany(
      {
        expiryDate: { $gte: today, $lte: next30Days },
        status: { $ne: "expired" }, // don’t overwrite expired
      },
      { $set: { status: "expiring-soon" } }
    );

    console.log("✅ Driver document statuses updated");
  } catch (error) {
    console.error("❌ Error updating driver documents:", error.message);
  }
});
