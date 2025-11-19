const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const path = require('path');
const fs = require('fs');
const connectDB = require("./config/db");

const app = express();
const http = require('http').createServer(app);
const { Server } = require('socket.io');
connectDB();

app.use(cors());
app.use(bodyParser.json());

// Ensure uploads directory exists and serve static files
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}
app.use('/uploads', express.static(uploadsDir));

// Test route to verify database connection
app.get('/api/test-db', async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    const challengeCount = await db.collection('challenges').countDocuments();
    
    res.json({
      success: true,
      dbName: db.databaseName,
      collections: collections.map(c => c.name),
      challengeCount
    });
  } catch (error) {
    console.error('Test DB error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// API Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/workouts", require("./routes/workoutRoutes"));
app.use("/api/progress", require("./routes/progressRoutes"));
app.use("/api/challenges", require("./routes/challengeRoutes"));
app.use("/api/notifications", require("./routes/notificationRoutes"));
app.use("/api/chat", require("./routes/chatRoutes"));
app.use("/api/chatbot", require("./routes/chatBotRoutes"));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!', error: err.message });
});

// Socket.IO
const jwt = require('jsonwebtoken');
const Message = require('./models/Message');
const ChatRoom = require('./models/ChatRoom');
const io = new Server(http, { cors: { origin: '*'} });

io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) return next(new Error('Unauthorized'));
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
    socket.userId = decoded.userId || decoded.id || decoded.user?.id;
    if (!socket.userId) return next(new Error('Unauthorized'));
    next();
  } catch (e) {
    next(new Error('Unauthorized'));
  }
});

io.on('connection', (socket) => {
  socket.on('joinRoom', async (roomId) => {
    socket.join(roomId);
    try {
      await ChatRoom.findByIdAndUpdate(roomId, { $addToSet: { participants: socket.userId } });
    } catch {}
  });

  socket.on('sendMessage', async ({ roomId, text }) => {
    if (!roomId || !text) return;
    try {
      const msg = await Message.create({ room: roomId, sender: socket.userId, text });
      const payload = { _id: msg._id, room: roomId, text, sender: { _id: socket.userId }, createdAt: msg.createdAt };
      io.to(roomId).emit('newMessage', payload);
    } catch {}
  });
});

const PORT = process.env.PORT || 5000;
http.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
