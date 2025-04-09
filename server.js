import { app } from "./app.js";
import dotenv from 'dotenv'
import { connectDB } from "./config/mongoConfig.js";

dotenv.config({ path: './.env' });
connectDB()

// a simple route to check if the server is running
app.get("/", (req, res) => {
    res.send("server is working fine!");
  });

  app.listen(process.env.PORT, () => {
    console.clear();
    console.log(`http://localhost:${process.env.PORT} ✅`);
  });
  