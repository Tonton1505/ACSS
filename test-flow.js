const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => null);
  return { status: response.status, ok: response.ok, data };
}

async function runTestFlow() {
  console.log('='.repeat(60));
  console.log('🚀 BẮT ĐẦU KIỂM THỬ TỰ ĐỘNG HỆ THỐNG ACSS');
  console.log(`📡 URL máy chủ: ${BASE_URL}`);
  console.log('='.repeat(60));

  let userToken = '';
  let adminToken = '';
  let createdAppId = null;

  try {
    // ----------------------------------------------------
    // BƯỚC 1: Đăng nhập tài khoản user1
    // ----------------------------------------------------
    console.log('\n[Bước 1] Đăng nhập tài khoản "user1" (role: USER)...');
    const userLoginRes = await request('/api/login', {
      method: 'POST',
      body: JSON.stringify({ username: 'user1', password: '123' }),
    });

    if (!userLoginRes.ok || !userLoginRes.data?.token) {
      throw new Error(`Đăng nhập user1 thất bại: ${JSON.stringify(userLoginRes.data)}`);
    }

    userToken = userLoginRes.data.token;
    console.log('✅ Đăng nhập user1 thành công!');
    console.log(`   Token nhận được: ${userToken.slice(0, 25)}...`);

    // ----------------------------------------------------
    // BƯỚC 2: User1 nộp hồ sơ xét duyệt điểm tín dụng
    // ----------------------------------------------------
    console.log('\n[Bước 2] "user1" nộp hồ sơ xét duyệt tín dụng...');
    const applicationPayload = {
      gpa: 3.5,
      income: 4000000,
      expenses: 2000000,
      activities: 2,
    };

    const submitRes = await request('/api/applications', {
      method: 'POST',
      headers: { Authorization: `Bearer ${userToken}` },
      body: JSON.stringify(applicationPayload),
    });

    if (!submitRes.ok) {
      throw new Error(`Nộp hồ sơ thất bại: ${JSON.stringify(submitRes.data)}`);
    }

    createdAppId = submitRes.data.applicationId;
    const score = submitRes.data.creditScore;
    console.log('✅ Nộp hồ sơ thành công!');
    console.log(`   ID hồ sơ: ${createdAppId}`);
    console.log(`   Điểm tín dụng tính được: ${score} điểm (Gốc: 300 + GPA: 50 + Thu nhập: 50 + Ngoại khóa: 20)`);

    // ----------------------------------------------------
    // BƯỚC 3: Đăng nhập tài khoản admin
    // ----------------------------------------------------
    console.log('\n[Bước 3] Đăng nhập tài khoản "admin" (role: ADMIN)...');
    const adminLoginRes = await request('/api/login', {
      method: 'POST',
      body: JSON.stringify({ username: 'admin', password: '123' }),
    });

    if (!adminLoginRes.ok || !adminLoginRes.data?.token) {
      throw new Error(`Đăng nhập admin thất bại: ${JSON.stringify(adminLoginRes.data)}`);
    }

    adminToken = adminLoginRes.data.token;
    console.log('✅ Đăng nhập admin thành công!');
    console.log(`   Token admin: ${adminToken.slice(0, 25)}...`);

    // ----------------------------------------------------
    // BƯỚC 4: Admin lấy danh sách hồ sơ
    // ----------------------------------------------------
    console.log('\n[Bước 4] Admin lấy danh sách toàn bộ hồ sơ...');
    const listRes = await request('/api/applications', {
      method: 'GET',
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    if (!listRes.ok || !Array.isArray(listRes.data)) {
      throw new Error(`Lấy danh sách hồ sơ thất bại: ${JSON.stringify(listRes.data)}`);
    }

    console.log(`✅ Lấy danh sách thành công (${listRes.data.length} hồ sơ):`);
    console.table(listRes.data);

    const targetApp = listRes.data.find((item) => item.id === createdAppId);
    if (!targetApp) {
      throw new Error(`Không tìm thấy hồ sơ ID ${createdAppId} trong danh sách!`);
    }
    console.log(`👉 Đã tìm thấy hồ sơ của user: "${targetApp.username}" với trạng thái ban đầu: "${targetApp.status}"`);

    // ----------------------------------------------------
    // BƯỚC 5: Admin cập nhật trạng thái hồ sơ sang 'APPROVED'
    // ----------------------------------------------------
    console.log(`\n[Bước 5] Admin duyệt hồ sơ ID ${createdAppId} sang trạng thái "APPROVED"...`);
    const updateRes = await request(`/api/applications/${createdAppId}/status`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ status: 'APPROVED' }),
    });

    if (!updateRes.ok) {
      throw new Error(`Cập nhật trạng thái thất bại: ${JSON.stringify(updateRes.data)}`);
    }

    console.log('✅ Duyệt hồ sơ thành công!');
    console.log(`   Kết quả: ${JSON.stringify(updateRes.data)}`);

    // ----------------------------------------------------
    // BƯỚC 6: Kiểm tra lại danh sách để xác nhận trạng thái mới
    // ----------------------------------------------------
    console.log('\n[Bước 6] Kiểm tra lại danh sách để xác nhận trạng thái "APPROVED"...');
    const verifyListRes = await request('/api/applications', {
      method: 'GET',
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    const updatedApp = verifyListRes.data.find((item) => item.id === createdAppId);
    if (!updatedApp || updatedApp.status !== 'APPROVED') {
      throw new Error(`Trạng thái chưa được cập nhật thành APPROVED! Dữ liệu hiện tại: ${JSON.stringify(updatedApp)}`);
    }

    console.log('✅ Xác thực trạng thái thành công!');
    console.log(`   Hồ sơ ID ${createdAppId} của "${updatedApp.username}" hiện có trạng thái: "${updatedApp.status}"`);

    // ----------------------------------------------------
    // TỔNG KẾT
    // ----------------------------------------------------
    console.log('\n' + '='.repeat(60));
    console.log('🎉 TẤT CẢ CÁC BƯỚC KIỂM THỬ ĐÃ PASS 100%! HỆ THỐNG HOẠT ĐỘNG HOÀN HẢO.');
    console.log('='.repeat(60));
  } catch (error) {
    console.error('\n❌ KIỂM THỬ THẤT BẠI TẠI MỘT TRONG CÁC BƯỚC:');
    console.error(`   Lỗi: ${error.message}`);
    console.log('\n💡 Lưu ý: Hãy đảm bảo server đang chạy (node server.js) trước khi chạy test-flow.js!');
  }
}

runTestFlow();
