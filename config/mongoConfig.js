import mongoose from "mongoose";
import { Config } from './config.js'; // ✅ correct



export const connectDB = async () => {
    const dbUrl =
    Config.USE_DB === "production" ? Config.DB_CLUSTER : Config.DB_LOCAL;

    await mongoose
      .connect(`${dbUrl}`)
      .then((data) => console.log(`mongoDB connected to ${Config.USE_DB} ✅`))
      .catch((err) => console.log("DB Connection ERROR ::", err.message));
  };