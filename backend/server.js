const express = require('express');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const authRouter = require('./routes/auth/auth-routes');
const adminProductsRouter = require('./routes/admin/products-routes');
const shopProductsRouter = require('./routes/shop/products-routes');
const messageRoutes = require('./routes/chat/message-routes');
const http = require('http');
const { initializeKhaltiPayment, verifyKhaltiPayment } = require("./khalti");
const Product = require("./models/Product");
const eProduct = require("./models/Exchange");
const adminRoutes = require('./routes/admin/admin-routes');
const PaymentTransaction = require('./models/paymentTransaction');

require('dotenv').config();

const app = express();
const server = http.createServer(app);

// Validate critical environment variables
if (!process.env.KHALTI_SECRET_KEY || !process.env.KHALTI_GATEWAY_URL) {
  console.error("FATAL ERROR: Khalti environment variables missing!");
  process.exit(1);
}

// Trust proxy for Railway deployment
const isProduction = process.env.NODE_ENV === 'production';
if (isProduction) {
  app.set('trust proxy', 1); // Trust first proxy
}

const allowedOrigins = [
  "http://localhost:5173",
  "https://tradeabook.vercel.app",
  "https://tradeabook-git-main-bhattaraikrish478vercel-gmailcoms-projects.vercel.app",
  "https://tradeabook-ldjrnapat-bhattaraikrish478vercel-gmailcoms-projects.vercel.app",
  "https://tradeabook-7445mtljf-bhattaraikrish478vercel-gmailcoms-projects.vercel.app",
  /\.vercel\.app$/,
  /\.railway\.app$/,
  "https://tradeabook-production.up.railway.app",
  // Add ngrok support
  /\.ngrok\.io$/,
  /\.ngrok-free\.app$/,
  /\.ngrok\.app$/,
  /\.ngrok\.dev$/,
  /\.ngrok\.com$/,
  /\.ngrok\.net$/,
  /\.ngrok\.org$/
];

// Socket.io setup
const io = require("socket.io")(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
    methods: ["GET", "POST"]
  },
  transports: ['websocket', 'polling']
});

// Socket.io connection handling
io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  // Join chat room
  socket.on('join_chat', (chatId) => {
    socket.join(chatId);
    console.log(`User ${socket.id} joined chat ${chatId}`);
  });

  // Leave chat room
  socket.on('leave_chat', (chatId) => {
    socket.leave(chatId);
    console.log(`User ${socket.id} left chat ${chatId}`);
  });

  // Typing indicator
  socket.on('typing', (chatId) => {
    socket.to(chatId).emit('typing', chatId);
  });

  // Stop typing indicator
  socket.on('stop_typing', (chatId) => {
    socket.to(chatId).emit('stop_typing', chatId);
  });

  socket.on('disconnect', () => {
    console.log("User disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 5000;

mongoose
  .connect('mongodb+srv://dbuser:test123@cluster0.nwtjx.mongodb.net/')
  .then(() => console.log('MongoDB Connected'))
  .catch((error) => console.log(error));

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Check against allowed origins and regex patterns
    const allowed = allowedOrigins.some(allowedOrigin => {
      if (typeof allowedOrigin === 'string') {
        return origin === allowedOrigin;
      } else if (allowedOrigin instanceof RegExp) {
        return allowedOrigin.test(origin);
      }
      return false;
    });
    
    if (allowed) {
      callback(null, true);
    } else {
      console.log(`Blocked by CORS: ${origin}`);
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  credentials: true,
  exposedHeaders: ['Authorization'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Cache-Control']
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());

// Enhanced request logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

// Add CORS error handling middleware
app.use((err, req, res, next) => {
  if (err.name === 'CorsError') {
    return res.status(403).json({
      success: false,
      message: "Not allowed by CORS policy"
    });
  }
  next(err);
});

// Preflight handling for payment routes
app.options("/initialize-product-payment", cors(corsOptions));
app.options("/complete-khalti-payment", cors(corsOptions));

// Initialize Khalti payment for products
app.post("/initialize-product-payment", async (req, res) => {
  try {
    // Database connection check
    if (mongoose.connection.readyState !== 1) {
      return res.status(500).json({
        success: false,
        message: "Database connection not ready"
      });
    }

    const { productId, productType, website_url } = req.body;
    const PROCESSING_FEE = 5;
    const DELIVERY_FEE = 25;
    const EXCHANGE_FEE = 55;
    
    let productData;
    let productName;
    let baseAmount;
    let totalAmount;

    if (productType === 'Product') {
      productData = await Product.findById(productId);
      if (!productData) {
        return res.status(404).json({
          success: false,
          message: "Product not found"
        });
      }
      
      // Validate bid amount
      if (!productData.currentBid && !productData.minBid) {
        return res.status(400).json({
          success: false,
          message: "Product has no valid bid amount"
        });
      }
      
      productName = productData.title;
      baseAmount = Number(productData.currentBid || productData.minBid);
      totalAmount = baseAmount + PROCESSING_FEE + DELIVERY_FEE;

    } else if (productType === 'eProduct') {
      productData = await eProduct.findById(productId);
      if (!productData) {
        return res.status(404).json({
          success: false,
          message: "Exchange product not found"
        });
      }
      
      const originalProduct = await Product.findById(productData.productId);
      if (!originalProduct) {
        return res.status(404).json({
          success: false,
          message: "Original product not found"
        });
      }
      
      productName = originalProduct.title;
      // Exchange processing fee only
      baseAmount = 0;
      totalAmount = EXCHANGE_FEE;
    }

    // Convert to paisa with rounding and validation
    const amountInPaisa = Math.round(totalAmount * 100);
    if (amountInPaisa < 100) { // Minimum 1 NPR
      return res.status(400).json({
        success: false,
        message: "Amount too small (minimum 1 NPR)"
      });
    }
    
    // Create payment record
    const paymentRecord = await PaymentTransaction.create({
      productId: productId,
      productModel: productType,
      baseAmount: baseAmount,
      processingFee: PROCESSING_FEE,
      deliveryFee: productType === 'Product' ? DELIVERY_FEE : 0,
      amount: totalAmount,
      paymentMethod: "khalti"
    });
    
    // Initialize payment with Khalti
    const backendBase = process.env.BACKEND_URI.endsWith('/') 
      ? process.env.BACKEND_URI.slice(0, -1) 
      : process.env.BACKEND_URI;

    const paymentInitiate = await initializeKhaltiPayment({
      amount: amountInPaisa,
      purchase_order_id: paymentRecord._id.toString(),
      purchase_order_name: productName,
      return_url: `${backendBase}/complete-khalti-payment`, // Fixed URL
      website_url,
    });

    // Update payment record with pidx
    await PaymentTransaction.findByIdAndUpdate(
      paymentRecord._id,
      { pidx: paymentInitiate.pidx }
    );

    res.json({
      success: true,
      payment: paymentInitiate,
      paymentRecord,
      feeBreakdown: {
        baseAmount,
        processingFee: PROCESSING_FEE,
        deliveryFee: productType === 'Product' ? DELIVERY_FEE : 0
      }
    });
  } catch (error) {
    console.error("Payment initialization error:", {
      message: error.message,
      stack: error.stack,
      body: req.body
    });
    res.status(500).json({
      success: false,
      message: "Failed to initialize payment",
      error: error.message
    });
  }
});

// Handle Khalti payment verification callback
app.get("/complete-khalti-payment", async (req, res) => {
  try {
    const { pidx } = req.query;
    
    if (!pidx) {
      console.error("Missing pidx in callback");
      return res.redirect(`${process.env.FRONTEND_URL}/payment-failed?reason=missing_pidx`);
    }
    
    console.log("Verifying payment with pidx:", pidx);
    
    // Verify the payment with Khalti
    const verificationResponse = await verifyKhaltiPayment(pidx);
    console.log("Khalti verification response:", JSON.stringify(verificationResponse, null, 2));
    
    // Find the payment record by pidx
    const paymentRecord = await PaymentTransaction.findOne({ pidx: pidx });

    if (!paymentRecord) {
      console.error("Payment record not found for pidx:", pidx);
      return res.redirect(`${process.env.FRONTEND_URL}/payment-failed?reason=record_not_found`);
    }
    
    // Update the payment record
    paymentRecord.status = "completed";
    paymentRecord.transactionDetails = verificationResponse;
    await paymentRecord.save();
    
    // Update product or eProduct status based on payment
    if (paymentRecord.productModel === 'Product') {
      await Product.findByIdAndUpdate(paymentRecord.productId, {
        $set: {
          paymentStatus: "paid",
          paymentDate: new Date(),
          paymentId: paymentRecord._id
        }
      });
    } else if (paymentRecord.productModel === 'eProduct') {
      await eProduct.findByIdAndUpdate(paymentRecord.productId, {
        $set: {
          offerStatus: "accepted",
          paymentStatus: "paid",
          paymentDate: new Date(),
          paymentId: paymentRecord._id
        }
      });
    }
    
    // Redirect to success page
    return res.redirect(`${process.env.FRONTEND_URL}/payment-success?purchase_order_id=${paymentRecord._id}`);
  } catch (error) {
    console.error("Payment verification error:", {
      message: error.message,
      stack: error.stack,
      query: req.query
    });
    return res.redirect(`${process.env.FRONTEND_URL}/payment-failed?reason=verification_error`);
  }
});

// Get payment status
app.get("/payment/:paymentId", async (req, res) => {
  try {
    const { paymentId } = req.params;
    const payment = await PaymentTransaction.findById(paymentId);
    
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found"
      });
    }
    
    res.json({
      success: true,
      payment
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to get payment details",
      error: error.message
    });
  }
});

// Mount routers
app.use("/auth", authRouter);
app.use('/admin/products', adminProductsRouter);
app.use('/shop/products', shopProductsRouter);
app.use('/admin', adminRoutes);
app.use('/chat', messageRoutes);

// Make io accessible to routes
app.set('io', io);
app.options('*', cors(corsOptions));

// Add a simple health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'UP',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    dbStatus: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
    socketConnections: io.engine.clientsCount
  });
});

// Add 404 handler for unmatched routes
app.use((req, res) => {
  console.error(`404: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    success: false,
    message: "Endpoint not found"
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', {
    message: err.message,
    stack: err.stack,
    url: req.originalUrl
  });
  res.status(500).json({
    success: false,
    message: "Internal server error",
    error: err.message
  });
});

server.listen(PORT, () => console.log(`Server running on port ${PORT} in ${isProduction ? 'production' : 'development'} mode`));