const express = require('express');
const jwt = require('jsonwebtoken');
const { db } = require('../config/db');
const { JWT_SECRET } = require('../middlewares/auth');

const router = express.Router();

// API: Đăng nhập
router.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Vui lòng cung cấp đầy đủ username và password' });
  }

  const query = 'SELECT * FROM Users WHERE username = ? AND password = ?';
  db.get(query, [username, password], (err, user) => {
    if (err) {
      return res.status(500).json({ message: 'Lỗi máy chủ khi truy vấn database', error: err.message });
    }

    if (!user) {
      return res.status(401).json({ message: 'Sai tên đăng nhập hoặc mật khẩu' });
    }

    const payload = {
      id: user.id,
      role: user.role
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1d' });

    return res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role
      }
    });
  });
});

module.exports = router;
