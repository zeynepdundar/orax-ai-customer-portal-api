import dotenv from "dotenv";
dotenv.config();

import { createApp } from "./app";

const PORT = Number(process.env.PORT) || 4000;

createApp()
  .then((app) => {
    app.listen(PORT, () => {
      console.log(`🚀 Orax AI Customer Portal running at http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Failed to start server:", err);
    process.exit(1);
  });
