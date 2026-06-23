require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const cookieParser = require('cookie-parser');
const axios = require('axios');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');

const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const userRoutes = require('./routes/userRoutes');
const paypalRoutes = require('./routes/paypalRoutes');
const orderRoutes = require('./routes/orderRoutes');
const reviewRoutes = require('./routes/reviewRoutes');

const app = express();
connectDB();
app.set('trust proxy', 1);


app.use(helmet());
app.use(mongoSanitize());

// --- Rate Limiting ---
const generalLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 100,
  message: 'Too many requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(generalLimiter);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: 'Too many login attempts, please try again later.'
});
app.use('/api/auth', authLimiter);

// --- Allowed Origins ---
const allowedOrigins = [
  'http://localhost:3000',
  'onehundredone.vercel.app',
  'https://onehundredone.vercel.app',
];

// --- CORS ---
app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);

    const allowed = allowedOrigins.some(o => origin.startsWith(o));

    if (allowed) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

// --- Body & Cookie Parser ---
app.use(express.json());
app.use(cookieParser());

// --- GitHub Image Proxy ---
const GITHUB_REPO = "Arm-yan-coder/product-images";
const GITHUB_BRANCH = "main";

app.get("/products/:productId/:fileName", async (req, res) => {
  const { productId, fileName } = req.params;
  const referer = req.get("referer") || "";

  const isAllowed = allowedOrigins.some(origin => referer.startsWith(origin));
  if (!isAllowed) {
    return res.status(403).send("Forbidden");
  }

  const githubFileUrl = `https://raw.githubusercontent.com/${GITHUB_REPO}/${GITHUB_BRANCH}/${productId}/${fileName}`;

  try {
    const response = await axios.get(githubFileUrl, { responseType: "stream" });
    res.setHeader('Cache-Control', 'public, max-age=86400');
    response.data.pipe(res);
  } catch (err) {
    res.status(404).send("File not found");
  }
});

// --- API Routes ---
app.use('/api/reviews', reviewRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/user', userRoutes);
app.use('/api/paypal', paypalRoutes);
app.use('/api/orders', orderRoutes);

// --- 404 Handler ---
app.use((req, res) => {
  res.status(404).json({ message: "Endpoint not found" });
});

// --- Global Error Handler ---
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Something went wrong!" });
});

// --- Start Server ---
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
