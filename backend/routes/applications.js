const express = require('express');
const { db } = require('../config/db');
const { authenticateToken, isAdmin } = require('../middlewares/auth');

const router = express.Router();

// API: Nộp hồ sơ xét duyệt điểm tín dụng
router.post('/', authenticateToken, (req, res) => {
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
router.get('/', authenticateToken, isAdmin, (req, res) => {
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
router.put('/:id/status', authenticateToken, isAdmin, (req, res) => {
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

module.exports = router;
