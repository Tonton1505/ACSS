const express = require('express');
const cors = require('cors');
const { initializeDB } = require('./config/db');
const authRoutes = require('./routes/auth');
const applicationRoutes = require('./routes/applications');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());

// Routes
app.use('/api', authRoutes);
app.use('/api/applications', applicationRoutes);

// Khởi tạo bảng dữ liệu
initializeDB();

// Khởi chạy server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
