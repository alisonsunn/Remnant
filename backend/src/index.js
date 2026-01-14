require("dotenv").config();

const express = require("express");
const cors = require("cors");
const pool = require("./db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
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
app.use(cookieParser());

// requireAuth middleware
const requireAuth = (req, res, next) => {
  const token = req.cookies?.token;
  if (!token) {
    return res.status(401).json({ ok: false, error: "Not logged in" });
  }
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = { id: payload.userId };
    return next();
  } catch (error) {
    return res.status(401).json({ ok: false, error: "Invalid token" });
  }
};

// test auth middleware
app.get("/auth/me", requireAuth, (req, res) => {
  return res.json({ ok: true, userId: req.userId });
});

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
app.post("/api/moments", requireAuth, async (req, res) => {
  const { emotion, note, image_key } = req.body;
  const user_id = req.userId.id;
  // console.log("user_id:", user_id);
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
app.get("/api/moments", requireAuth, async (req, res) => {
  const user_id = req.userId.id;
  try {
    const result = await pool.query(
      `SELECT * FROM moments
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [user_id]
    );

    console.log("result:", result.rows);

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch moments" });
  }
});

// Moments delete API
app.delete("/api/moments/:id", requireAuth, async (req, res) => {
  const momentId = Number(req.params.id);
  const user_id = req.userId.id;
  console.log("momentId:", momentId);

  if (momentId == null || momentId <= 0) {
    return res.status(400).json({ error: "Invalid moment ID or user ID" });
  }

  try {
    // Verify the moment belongs to the user before deleting
    const result = await pool.query(
      `DELETE FROM moments
       WHERE id = $1 AND user_id = $2
       RETURNING *`,
      [momentId, user_id]
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

// generate token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

// signup API
app.post("/auth/signup", async (req, res) => {
  const { email, password } = req.body;

  // check if email and password are provided
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }
  // check if password is at least 6 characters
  if (password.length < 6) {
    return res
      .status(400)
      .json({ error: "Password must be at least 6 characters" });
  }

  try {
    // hash password
    const password_hash = await bcrypt.hash(password, 10);

    // insert user into database
    const result = await pool.query(
      `INSERT INTO users (email, password_hash)
       VALUES ($1, $2)
       RETURNING id, email, created_at`,
      [email.toLowerCase(), password_hash]
    );

    const user = result.rows[0];

    // generate token and set it in cookie
    const token = generateToken(user.id);
    res.cookie("token", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    // return user information
    return res.status(201).json({ user });
  } catch (err) {
    // email already exists or invalid
    return res.status(400).json({
      error: { error: err.message, code: err.code, detail: err.detail },
    });
  }
});

// login API
app.post("/auth/login", async (req, res) => {
  const { email, password } = req.body;

  // check if email and password are provided
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  try {
    // get user from database
    const result = await pool.query(
      `SELECT id, email, password_hash FROM users WHERE email = $1`,
      [email.toLowerCase()]
    );

    const user = result.rows[0];
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // compare password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // generate token and set it in cookie
    const token = generateToken(user.id);
    res.cookie("token", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(201).json({ user: { id: user.id, email: user.email } });
  } catch (error) {
    return res.status(400).json({ error: "Invalid email or password" });
  }
});

// logout API
app.post("/auth/logout", (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });

  return res.json({ message: "Logged out" });
});

app.listen(PORT, () => {
  console.log(`✅ Backend is running on http://localhost:${PORT}`);
});
