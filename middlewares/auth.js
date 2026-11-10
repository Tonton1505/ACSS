const jwt = require('jsonwebtoken');

const JWT_SECRET = 'secret-mvp-key';

// Middleware: Xác thực JWT token
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Định dạng: Bearer <token>

  if (!token) {
    return res.status(401).json({ message: 'Không tìm thấy token xác thực' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Token không hợp lệ hoặc đã hết hạn' });
    }

    req.user = user;
    next();
  });
}

// Middleware: Kiểm tra quyền ADMIN
function isAdmin(req, res, next) {
  if (req.user && req.user.role === 'ADMIN') {
    return next();
  }
  return res.status(403).json({ message: 'Access Denied' });
}

module.exports = {
  JWT_SECRET,
  authenticateToken,
  isAdmin
};
