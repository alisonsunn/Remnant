const express = require("express");

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service: "remnant-backend",
    time: new Date().toISOString(),
  });
});

app.listen(PORT, () => {
  console.log(`✅ Backend is running on http://localhost:${PORT}`);
});
