import mongoose from 'mongoose';
import {config} from './config.js'


export const connectDB = async () => {
  const dbUrl =
    config.USE_DB === "production" ? config.DB_CLUSTER : config.DB_LOCAL;
   console.log(dbUrl);
   
  await mongoose
    .connect(`${dbUrl}`)
    .then((data) => console.log(`mongoDB connected to ${config.USE_DB} on ${dbUrl} ✅`))
    .catch((err) => console.log("DB Connection ERROR ::", err.message));
};


