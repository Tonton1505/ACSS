const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = 'secret-mvp-key';

// Middleware
app.use(cors());
app.use(express.json());

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

// Database connection (tự động tạo database.db nếu chưa tồn tại)
const db = new sqlite3.Database('./database.db', (err) => {
  if (err) {
    console.error('Lỗi kết nối cơ sở dữ liệu:', err.message);
  } else {
    console.log('Đã kết nối thành công tới database.db');
    initializeDB();
  }
});

// Hàm khởi tạo các bảng nếu chưa tồn tại
function initializeDB() {
  db.serialize(() => {
    // Bảng Users
    db.run(`
      CREATE TABLE IF NOT EXISTS Users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE,
        password TEXT,
        role TEXT
      )
    `, (err) => {
      if (err) {
        console.error('Lỗi tạo bảng Users:', err.message);
        return;
      }

      // Kiểm tra xem bảng Users đã có dữ liệu chưa
      db.get('SELECT COUNT(*) AS count FROM Users', (err, row) => {
        if (err) {
          console.error('Lỗi kiểm tra dữ liệu bảng Users:', err.message);
          return;
        }

        if (row.count === 0) {
          const insertStmt = db.prepare('INSERT INTO Users (username, password, role) VALUES (?, ?, ?)');
          insertStmt.run('admin', '123', 'ADMIN');
          insertStmt.run('user1', '123', 'USER');
          insertStmt.finalize((err) => {
            if (err) {
              console.error('Lỗi thêm tài khoản mẫu:', err.message);
            } else {
              console.log('Đã thêm 2 tài khoản mẫu (admin/123 - ADMIN, user1/123 - USER)');
            }
          });
        }
      });
    });

    // Bảng Applications
    db.run(`
      CREATE TABLE IF NOT EXISTS Applications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        form_data_json TEXT,
        credit_score INTEGER,
        status TEXT DEFAULT 'PENDING',
        FOREIGN KEY (user_id) REFERENCES Users(id)
      )
    `, (err) => {
      if (err) console.error('Lỗi tạo bảng Applications:', err.message);
    });
  });
}

// API: Đăng nhập
app.post('/api/login', (req, res) => {
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

// API: Nộp hồ sơ xét duyệt điểm tín dụng
app.post('/api/applications', authenticateToken, (req, res) => {
  const { gpa, income, expenses, activities } = req.body;

  // 1. Điểm gốc = 300
  let creditScore = 300;

  const parsedGpa = parseFloat(gpa) || 0;
  const parsedIncome = parseFloat(income) || 0;
  const parsedExpenses = parseFloat(expenses) || 0;
  const parsedActivities = parseInt(activities, 10) || 0;

  // 2. Xét GPA: >= 3.6 (+100 điểm), >= 3.2 (+50 điểm)
  if (parsedGpa >= 3.6) {
    creditScore += 100;
  } else if (parsedGpa >= 3.2) {
    creditScore += 50;
  }

  // 3. Xét dòng tiền: (income - expenses) > 1.000.000 (+50 điểm)
  if (parsedIncome - parsedExpenses > 1000000) {
    creditScore += 50;
  }

  // 4. Xét hoạt động ngoại khóa: activities >= 2 (+20 điểm)
  if (parsedActivities >= 2) {
    creditScore += 20;
  }

  // Lưu vào database
  const formDataJson = JSON.stringify(req.body);
  const query = 'INSERT INTO Applications (user_id, form_data_json, credit_score) VALUES (?, ?, ?)';

  db.run(query, [req.user.id, formDataJson, creditScore], function (err) {
    if (err) {
      return res.status(500).json({ message: 'Lỗi khi lưu hồ sơ', error: err.message });
    }

    return res.status(201).json({
      message: 'Nộp hồ sơ thành công',
      applicationId: this.lastID,
      creditScore: creditScore
    });
  });
});

// API: Lấy danh sách hồ sơ kèm thông tin người nộp (Admin only)
app.get('/api/applications', authenticateToken, isAdmin, (req, res) => {
  const query = `
    SELECT 
      Applications.id,
      Users.username,
      Applications.credit_score,
      Applications.status
    FROM Applications
    JOIN Users ON Applications.user_id = Users.id
    ORDER BY Applications.id DESC
  `;

  db.all(query, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ message: 'Lỗi khi lấy danh sách hồ sơ', error: err.message });
    }

    return res.json(rows);
  });
});

// API: Cập nhật trạng thái hồ sơ (Admin only)
app.put('/api/applications/:id/status', authenticateToken, isAdmin, (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status || !['APPROVED', 'REJECTED'].includes(status)) {
    return res.status(400).json({ message: "Trạng thái không hợp lệ, chỉ chấp nhận 'APPROVED' hoặc 'REJECTED'" });
  }

  const query = 'UPDATE Applications SET status = ? WHERE id = ?';
  db.run(query, [status, id], function (err) {
    if (err) {
      return res.status(500).json({ message: 'Lỗi khi cập nhật trạng thái', error: err.message });
    }

    // Nếu không có dòng nào được cập nhật => id không tồn tại
    if (this.changes === 0) {
      return res.status(404).json({ message: `Không tìm thấy hồ sơ có id ${id}` });
    }

    return res.json({
      message: 'Cập nhật trạng thái hồ sơ thành công',
      id: Number(id),
      status: status
    });
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

