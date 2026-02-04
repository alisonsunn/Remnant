const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");

function loadEnv() {
  const candidates = [
    path.resolve(__dirname, "../../.env.local"),
    path.resolve(__dirname, "../../.env.dev"),
    path.resolve(__dirname, "../../.env"),
  ];

  candidates.forEach((envPath) => {
    if (fs.existsSync(envPath)) {
      dotenv.config({ path: envPath, override: false });
    }
  });
}

loadEnv();

const express = require("express");
const cors = require("cors");
const pool = require("./db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const { GetObjectCommand } = require("@aws-sdk/client-s3");

const app = express();

const PORT = process.env.BACKEND_PORT || 3001;

// Enable CORS for all routes
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  }),
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

const s3EndpointInternal = process.env.S3_ENDPOINT || "http://minio:9000";
const s3EndpointPublic = process.env.S3_PUBLIC_ENDPOINT || s3EndpointInternal;
const s3ForcePathStyle = process.env.S3_FORCE_PATH_STYLE === "true";

const s3 = new S3Client({
  region: process.env.AWS_REGION || "us-east-1",
  endpoint: s3EndpointInternal,
  credentials: {
    accessKeyId: process.env.MINIO_ACCESS_KEY,
    secretAccessKey: process.env.MINIO_SECRET_KEY,
  },
  forcePathStyle: s3ForcePathStyle,
});

const s3Public = new S3Client({
  region: process.env.AWS_REGION || "us-east-1",
  endpoint: s3EndpointPublic,
  credentials: {
    accessKeyId: process.env.MINIO_ACCESS_KEY,
    secretAccessKey: process.env.MINIO_SECRET_KEY,
  },
  forcePathStyle: s3ForcePathStyle,
});

const BUCKET = process.env.S3_BUCKET || "remnant";

// Upload image to S3
app.post("/api/upload", upload.array("files", 4), async (req, res) => {
  try {
    // No files uploaded
    if (!req.files || req.files.length === 0) {
      return res.status(201).json({ image_keys: [] });
    }

    const uploadedKeys = [];

    for (const file of req.files) {
      const ext = file.originalname.split(".").pop() || "jpg";
      const key = `moments/${crypto.randomUUID()}.${ext}`;

      await s3.send(
        new PutObjectCommand({
          Bucket: BUCKET,
          Key: key,
          Body: file.buffer,
          ContentType: file.mimetype,
        }),
      );

      uploadedKeys.push(key);
    }
    return res.status(201).json({ image_keys: uploadedKeys });
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
  const { emotion, note, image_keys } = req.body;
  const user_id = req.userId.id;
  // console.log("user_id:", user_id);
  try {
    const result = await pool.query(
      `INSERT INTO moments (user_id, emotion, note, image_keys)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [user_id, emotion, note, image_keys ?? []],
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to create moment" });
  }
});

// generate s3 image url
async function generateS3ImageUrl(key) {
  const command = new GetObjectCommand({
    Bucket: BUCKET,
    Key: key,
  });
  // expires in 1 hour
  const signedUrl = await getSignedUrl(s3Public, command, {
    expiresIn: 60 * 60,
  });

  return signedUrl;
}

// Moments patch API
app.patch("/api/moments/:id", requireAuth, async (req, res) => {
  const { emotion, note, image_keys } = req.body;
  const momentId = Number(req.params.id);
  const user_id = req.userId.id;

  try {
    const result = await pool.query(
      `UPDATE moments
       SET emotion = $1, note = $2, image_keys = $3
       WHERE id = $4 AND user_id = $5
       RETURNING *`,
      [emotion, note, image_keys ?? [], momentId, user_id],
    );
    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to update moment" });
  }
});

// Moments get API
app.get("/api/moments", requireAuth, async (req, res) => {
  const user_id = req.userId.id;

  // return the total number of moments for the user
  const total_moments = await pool.query(
    `SELECT COUNT(*)::int AS total
    FROM moments
    WHERE user_id = $1`,
    [user_id],
  );

  const total = total_moments.rows[0].total;

  // return all moments for the user, sorted by created_at descending
  try {
    const result = await pool.query(
      `SELECT * FROM moments
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [user_id],
    );

    console.log("result:", result.rows);

    const moments = await Promise.all(
      result.rows.map(async (moment) => {
        const imageUrl =
          moment.image_keys.length > 0
            ? await generateS3ImageUrl(moment.image_keys[0])
            : null;
        return { ...moment, image_url: imageUrl };
      }),
    );

    res.json({ moments, total });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch moments" });
  }
});

// Moment get API - show all the pictures
app.get("/api/moments/:id", requireAuth, async (req, res) => {
  const momentId = Number(req.params.id);
  const user_id = req.userId.id;
  try {
    const moment = await pool.query(
      `SELECT * FROM moments
       WHERE id = $1 AND user_id = $2`,
      [momentId, user_id],
    );

    console.log("moment:", moment.rows[0]);

    const image_urls =
      moment.rows[0].image_keys.length > 0
        ? await Promise.all(
            moment.rows[0].image_keys.map(
              async (image_key) => await generateS3ImageUrl(image_key),
            ),
          )
        : null;

    // console.log("image_urls:", image_urls);

    if (moment.rowCount === 0) {
      return res.status(404).json({ error: "Moment not found" });
    }

    res.json({
      moment: { ...moment.rows[0], image_urls },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch moment" });
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
      [momentId, user_id],
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
      [email.toLowerCase(), password_hash],
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
      [email.toLowerCase()],
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
    path: "/",
  });

  return res.json({ message: "Logged out" });
});

app.listen(PORT, () => {
  console.log(`✅ Backend is running on http://localhost:${PORT}`);
});
