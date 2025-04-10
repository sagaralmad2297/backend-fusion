require("dotenv").config();
const express = require("express");
const cors = require("cors"); // Import CORS
const connectDB = require("./config/db");
const productRoutes = require("./routes/productRoutes");
const authRoutes = require("./routes/authRoutes");
const cartRoutes = require('./routes/cartRoutes');
const app = express();

// ✅ Enable CORS
const corsOptions = {
  origin: "*", // Allow all origins (for testing)
  methods: "GET, POST, PUT, DELETE",
  allowedHeaders: "Content-Type, Authorization",
};

app.use(cors(corsOptions));

// Middleware
app.use(express.json());

// Connect to MongoDB
connectDB();

// Routes
app.use("/api/products", productRoutes);
app.use('/api/cart', cartRoutes);
app.use("/api/auth", authRoutes);

app.get("/", (req, res) => {
  res.send("Fashion E-commerce Backend is running!");
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
