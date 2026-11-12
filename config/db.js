const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const DB_PATH = path.resolve(__dirname, '../database.db');

// Database connection (tự động tạo database.db nếu chưa tồn tại)
const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('Lỗi kết nối cơ sở dữ liệu:', err.message);
  } else {
    console.log('Đã kết nối thành công tới database.db');
    db.run('PRAGMA foreign_keys = ON;');
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

module.exports = {
  db,
  initializeDB
};
