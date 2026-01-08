require("dotenv").config();

const express = require("express");
const cors = require("cors");
const pool = require("./db");
const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });

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

// AWS S3 configuration
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const crypto = require("crypto");
const { CLIENT_RENEG_LIMIT } = require("tls");

const s3 = new S3Client({
  region: "us-east-1",
  endpoint: "http://localhost:9000",
  credentials: {
    accessKeyId: process.env.MINIO_ACCESS_KEY,
    secretAccessKey: process.env.MINIO_SECRET_KEY,
  },
  forcePathStyle: true,
});

const BUCKET = process.env.MINIO_BUCKET || "remnant";

// Upload image to S3
app.post("/api/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const ext = req.file.originalname.split(".").pop() || "jpg";
    const key = `moments/${crypto.randomUUID()}.${ext}`;

    await s3.send(
      new PutObjectCommand({
        Bucket: BUCKET,
        Key: key,
        Body: req.file.buffer,
        ContentType: req.file.mimetype,
      })
    );

    return res.status(201).json({ image_key: key });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Upload failed" });
  }
});

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
      `DELETE FROM momentsgit
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
