const express = require("express");
const cors = require("cors");
const pool = require("./db");

const app = express();
const PORT = process.env.PORT || 3001;

// Enable CORS for all routes
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);

app.use(express.json());

// Health check API
app.get("/health", async (req, res) => {
  res.json({
    status: "ok",
    service: "remnant-backend",
    time: new Date().toISOString(),
  });
});

// Moments post API
app.post("/api/moments", async (req, res) => {
  const { user_id, emotion, note, image_key } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO moments (user_id, emotion, note, image_key)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [user_id, emotion, note, image_key]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to create moment" });
  }
});

// Moments get API
app.get("/api/moments", async (req, res) => {
  const { user_id } = req.query;

  try {
    const result = await pool.query(
      `SELECT * FROM moments
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [user_id]
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch moments" });
  }
});

// Moments delete API
app.delete("/api/moments/:id", async (req, res) => {
  const momentId = Number(req.params.id);

  if (momentId == null || momentId <= 0) {
    return res.status(400).json({ error: "Invalid moment ID or user ID" });
  }

  try {
    const result = await pool.query(
      `DELETE FROM moments
       WHERE id = $1
       RETURNING *`,
      [momentId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Moment not found" });
    }

    res.json({
      message: "Moment deleted successfully",
      moment: result.rows[0],
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to delete moment" });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Backend is running on http://localhost:${PORT}`);
});
