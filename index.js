import { app } from "./app.js";
import { connectDB } from "./config/mongoConnection.js";
import 'dotenv/config'
import { config } from "./config/config.js";
import http from "http";
import { initSocket } from "./services/socketIo.js";

const server = http.createServer(app);

// initialize socket.io
initSocket(server);

const PORT = config.PORT;

connectDB();

app.get("/api/v1/health", (req, res) => {
  res.send("health is fine!");
});

server.listen(PORT, () => {
  console.log(`Server connected on http://localhost:${PORT}`);
});
