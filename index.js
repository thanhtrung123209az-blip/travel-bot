/**
 * SERVER BOT DU LỊCH VIỆT NAM FULL 63 TỈNH THÀNH (1 FILE INDEX.JS DUY NHẤT)
 * Lệnh cài đặt: npm install express
 */

const express = require('express');
const app = express();
app.use(express.json());

// =========================================================================
// 1. CÁC THUẬT TOÁN XỬ LÝ NGÔN NGỮ VÀ TÌM KIẾM NÂNG CAO
// =========================================================================

function loaiBoDau(str) {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function levenshteinDistance(a, b) {
  const matrix = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1)
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

function jaccardSimilarity(textA, textB) {
  const setA = new Set(textA.split(' '));
  const setB = new Set(textB.split(' '));
  const intersection = new Set([...setA].filter(x => setB.has(x)));
  const union = new Set([...setA, ...setB]);
  return intersection.size / union.size;
}

function detectUserIntent(queryNorm) {
  if (/\b(an gi|dac san|mon ngon|quan an|uong gi|am thuc)\b/.test(queryNorm)) return 'ASK_FOOD';
  if (/\b(choi gi|hoat dong|trai nghiem|lam gi|di dau|diem den|tham quan)\b/.test(queryNorm)) return 'ASK_ACTIVITIES';
  if (/\b(chi phi|gia ca|ton bao nhieu|bao nhieu tien|ngan sach)\b/.test(queryNorm)) return 'ASK_BUDGET';
  if (/\b(khi nao|thoi diem|thang may|mua nao|thoi tiet|dep nhat)\b/.test(queryNorm)) return 'ASK_BEST_TIME';
  if (/\b(goi y|tu van|thich|goi y cho|nen di dau)\b/.test(queryNorm)) return 'RECOMMEND';
  return 'GENERAL';
}

// =========================================================================
// 2. BỘ NHỚ BỐ CỤC NGỮ CẢNH (CONTEXT MEMORY ENGINE)
// =========================================================================
const userSessions = new Map();

function getSessionState(sessionId) {
  if (!userSessions.has(sessionId)) {
    userSessions.set(sessionId, {
      lastProvinceKey: null,
      lastRegion: null,
      history: []
    });
  }
  return userSessions.get(sessionId);
}

// =========================================================================
// 3. CƠ SỞ DỮ LIỆU ĐẦY ĐỦ 63 TỈNH THÀNH VIỆT NAM (BẮC - TRUNG - NAM)
// =========================================================================

const duLieu63TinhThanh = {
  // ----------------------- MIỀN BẮC (25 TỈNH THÀNH) -----------------------
  "ha noi": {
    ten: "Thủ đô Hà Nội", mien: "bac", tags: ["van hoa", "am thuc", "lich su", "pho co"],
    anh: "https://images.unsplash.com/photo-1509030450996-93f2e3d84298?w=800",
    moTa: "Thủ đô nghìn năm văn hiến cổ kính, sở hữu 36 phố phường rêu phong và nền văn hóa lâu đời.",
    hoatDong: "1. Uống cà phê trứng ngắm Hồ Gươm sáng sớm.\n2. Vi vu xe máy đường Phan Đình Phùng mùa lá rơi.\n3. Thưởng thức bia hơi Tạ Hiện đêm về.\n4. Xem múa rối nước tại Nhà hát Thăng Long.",
    diemDen: "Hồ Hoàn Kiếm, Văn Miếu, Hoàng Thành Thăng Long, Chùa Một Cột, Lăng Bác.",
    dacSan: "Phở Hà Nội, Bún chả, Chả cá Lã Vọng, Bún thang, Cốm làng Vòng.",
    chiPhi: "800.000đ - 1.800.000đ/ngày.", thoiDiem: "Tháng 9 - 11 (Mùa thu vàng se lạnh) hoặc tháng 3 - 4."
  },
  "ha giang": {
    ten: "Hà Giang", mien: "bac", tags: ["phuot", "nui cao", "san may", "mao hiem"],
    anh: "https://images.unsplash.com/photo-1599707303381-807c42749419?w=800",
    moTa: "Mảnh đất địa đầu Tổ quốc với cao nguyên đá hùng vĩ và những cung đường đèo hiểm trở.",
    hoatDong: "1. Lái xe phượt đèo Mã Pí Lèng.\n2. Đi thuyền trên sông Nho Quý qua Hẻm Tu Sản.\n3. Check-in Cột cờ Lũng Cú.\n4. Dự chợ phiên Đồng Văn.",
    diemDen: "Đèo Mã Pí Lèng, Hẻm Tu Sản, Cột cờ Lũng Cú, Dinh họ Vương, Cổng trời Quản Bạ.",
    dacSan: "Cháo tẩu tẩu, Bánh tam giác mạch, Thịt trâu gác bếp, Rượu ngô.",
    chiPhi: "2.000.000đ - 3.500.000đ/chuyến 3N2Đ.", thoiDiem: "Tháng 10 - 12 (Hoa tam giác mạch) hoặc tháng 1 - 3 (Mùa hoa đào mận)."
  },
  "lao cai": {
    ten: "Lào Cai (Sa Pa)", mien: "bac", tags: ["nghi duong", "nui cao", "san may", "tuyet rơi"],
    anh: "https://images.unsplash.com/photo-1528127269322-539801943592?w=800",
    moTa: "Thị trấn sương mờ mộng mơ nơi có đỉnh Fansipan - Nóc nhà Đông Dương.",
    hoatDong: "1. Săn mây trên đỉnh Fansipan.\n2. Trekking bản Cát Cát, Tả Van.\n3. Ngắm hoàng hôn Đèo Ô Quy Hồ.\n4. Tắm lá thuốc Dao Đỏ.",
    diemDen: "Đỉnh Fansipan, Bản Cát Cát, Đèo Ô Quy Hồ, Thung lũng Mường Hoa, Nhà thờ Đá.",
    dacSan: "Lẩu cá hồi cá tầm, Rau mầm đá, Thịt lợn cắp nách, Đồ nướng Sa Pa.",
    chiPhi: "900.000đ - 2.500.000đ/ngày.", thoiDiem: "Tháng 9 - 10 (Lúa chín) hoặc tháng 12 - 1 (Săn tuyết)."
  },
  "quang ninh": {
    ten: "Quảng Ninh", mien: "bac", tags: ["bien", "du thuyen", "tam linh", "giai tri"],
    anh: "https://images.unsplash.com/photo-1528127269322-539801943592?w=800",
    moTa: "Thủ phủ du lịch sở hữu Kỳ quan thiên nhiên thế giới Vịnh Hạ Long.",
    hoatDong: "1. Trải nghiệm du thuyền ngủ đêm Vịnh Hạ Long.\n2. Chèo thuyền Kayak Hang Luồn.\n3. Vui chơi Sun World Hạ Long.\n4. Hành hương đất Phật Yên Tử.",
    diemDen: "Vịnh Hạ Long, Đảo Cô Tô, Đảo Quan Lạn, Danh thắng Yên Tử, Bảo tàng Quảng Ninh.",
    dacSan: "Chả mực giã tay, Cà sáy Tiên Yên, Ngán biển, Bún hải sản.",
    chiPhi: "1.000.000đ - 3.500.000đ/ngày.", thoiDiem: "Tháng 4 đến tháng 8 (Mùa hè tắm biển)."
  },
  "ninh binh": {
    ten: "Ninh Bình", mien: "bac", tags: ["tam linh", "thien nhien", "checkin", "song nuoc"],
    anh: "https://images.unsplash.com/photo-1509030450996-93f2e3d84298?w=800",
    moTa: "Cố đô Hoa Lư cổ kính sở hữu quần thể Di sản thế giới Tràng An hùng vĩ.",
    hoatDong: "1. Đi thuyền đò tham quan các hang động Tràng An.\n2. Leo 500 bậc đá đỉnh Hang Múa.\n3. Bái Phật Chùa Bái Đính.\n4. Đạp xe quanh thung lũng lúa Tam Cốc.",
    diemDen: "Tràng An, Tam Cốc - Bích Động, Hang Múa, Chùa Bái Đính, Tuyệt Tình Cốc.",
    dacSan: "Cơm cháy Ninh Bình, Thịt dê núi, Bún mọc Tố Như, Rượu Kim Sơn.",
    chiPhi: "600.000đ - 1.300.000đ/ngày.", thoiDiem: "Tháng 1 - 3 (Mùa lễ hội) hoặc tháng 5 - 6 (Mùa lúa chín)."
  },
  "cao bang": {
    ten: "Cao Bằng", mien: "bac", tags: ["phuot", "thien nhien", "thac nuoc", "lich su"],
    anh: "https://images.unsplash.com/photo-1599707303381-807c42749419?w=800",
    moTa: "Mảnh đất vùng biên giới nổi tiếng với Thác Bản Giốc - thác nước tự nhiên đẹp nhất Việt Nam.",
    hoatDong: "1. Đi thuyền ngắm Thác Bản Giốc.\n2. Khám phá Động Ngườm Ngao kỳ ảo.\n3. Viếng di tích Hang Pắc Bó - Suối Lê Nin.\n4. Săn mây đỉnh Phia Oắc.",
    diemDen: "Thác Bản Giốc, Động Ngườm Ngao, Pắc Bó, Hồ Thăng Hen, Núi Mắt Thần.",
    dacSan: "Bánh cuốn Cao Bằng, Phở chua, Vịt quay 7 vị, Hạt dẻ Trùng Khánh.",
    chiPhi: "700.000đ - 1.500.000đ/ngày.", thoiDiem: "Tháng 8 - 10 (Thác Bản Giốc nhiều nước xanh trong)."
  },
  "dien bien": {
    ten: "Điện Biên", mien: "bac", tags: ["lich su", "van hoa", "nui cao"],
    anh: "https://images.unsplash.com/photo-1599707303381-807c42749419?w=800",
    moTa: "Vùng đất lịch sử lừng lẫy chiến công Điện Biên Phủ và đèo A Pa Chải mạo hiểm.",
    hoatDong: "1. Thăm bảo tàng và Đồi A1.\n2. Chinh phục cực Tây A Pa Chải.\n3. Tắm khoáng nóng U Va.\n4. Thưởng thức điệu xòe Thái.",
    diemDen: "Đồi A1, Hầm De Castries, Cột mốc A Pa Chải, Hồ Pá Khoang, Đèo Pha Đín.",
    dacSan: "Thịt trâu gác bếp, Pa pỉnh tộp (Cá nướng), Gà đen Tủa Chùa, Xôi nếp nương.",
    chiPhi: "600.000đ - 1.400.000đ/ngày.", thoiDiem: "Tháng 3 (Mùa hoa ban nở) hoặc tháng 5 (Kỷ niệm chiến thắng)."
  },
  "son la": {
    ten: "Sơn La (Mộc Châu)", mien: "bac", tags: ["nghi duong", "nui cao", "checkin", "hoa dep"],
    anh: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800",
    moTa: "Cao nguyên Mộc Châu xanh mướt mát lành với đồi chè trái tim và muôn hoa khoe sắc.",
    hoatDong: "1. Hái dâu tây và chè xanh Mộc Châu.\n2. Băng qua Cầu kính Bạch Long dài nhất thế giới.\n3. Săn mây Tà Xùa.\n4. Thăm Thác Dải Yếm.",
    diemDen: "Đồi chè Mộc Châu, Cầu kính Bạch Long, Thác Dải Yếm, Đỉnh Tà Xùa, Bản Thung Cuông.",
    dacSan: "Bê chao Mộc Châu, Ô mai mơ, Sữa tươi Mộc Châu, Cá stream nướng.",
    chiPhi: "700.000đ - 1.500.000đ/ngày.", thoiDiem: "Tháng 1 - 2 (Hoa cải, hoa mận) hoặc tháng 9 - 11 (Tà Xùa săn mây)."
  },
  "yen bai": {
    ten: "Yên Bái (Mù Cang Chải)", mien: "bac", tags: ["phuot", "nui cao", "ruong bac thang", "san may"],
    anh: "https://images.unsplash.com/photo-1528127269322-539801943592?w=800",
    moTa: "Thiên đường ruộng bậc thang Mù Cang Chải đẹp danh bất hư truyền.",
    hoatDong: "1. Trải nghiệm Nhảy dù dù lượn 'Bay trên mùa vàng' đèo Khau Phạ.\n2. Check-in Đồi Mâm Xôi, Đồi Móng Ngựa.\n3. Tắm khoáng Trạm Tấu.",
    diemDen: "Đèo Khau Phạ, Đồi Mâm Xôi, Đồi Móng Ngựa, Suối khoáng nóng Trạm Tấu, Hồ Thác Bà.",
    dacSan: "Cốm Tu Lệ, Thịt sấy, Táo mèo, Nhót nướng.",
    chiPhi: "600.000đ - 1.300.000đ/ngày.", thoiDiem: "Tháng 9 - 10 (Mùa lúa chín vàng óng) hoặc tháng 5 - 6 (Mùa nước đổ)."
  },
  "hoa binh": {
    ten: "Hòa Bình (Mai Châu)", mien: "bac", tags: ["nghi duong", "van hoa", "thien nhien", "sinh thai"],
    anh: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800",
    moTa: "Cửa ngõ Tây Bắc thơ mộng với thung lũng Mai Châu bình yên và Hồ Hòa Bình xanh mát.",
    hoatDong: "1. Chèo sub lòng hồ Hòa Bình.\n2. Đạp xe quanh bản Lác Mai Châu.\n3. Thưởng thức múa xòe bên lửa trại.\n4. Thăm thủy điện Hòa Bình.",
    diemDen: "Thung lũng Mai Châu, Bản Lác, Lòng hồ Hòa Bình, Suối khoáng Kim Bôi, Thung Nai.",
    dacSan: "Cơm lam gà nướng, Cơm nếp nương, Cá sông Đà nướng, Lợn mán thui luộc.",
    chiPhi: "600.000đ - 1.400.000đ/ngày.", thoiDiem: "Tháng 10 đến tháng 4 năm sau."
  },
  "lai chau": {
    ten: "Lai Châu", mien: "bac", tags: ["phuot", "mao hiem", "nui cao"],
    anh: "https://images.unsplash.com/photo-1599707303381-807c42749419?w=800",
    moTa: "Vùng đất hùng vĩ nơi sở hữu các đỉnh núi cao bậc nhất Việt Nam như Pusilung, Putaleng.",
    hoatDong: "1. Leo đỉnh Putaleng, Pusilung.\n2. Đi cầu kính Rồng May Đèo Ô Quy Hồ.\n3. Thăm bản Sin Suối Hồ.",
    diemDen: "Đèo Ô Quy Hồ, Cầu kính Rồng May, Bản Sin Suối Hồ, Peak Putaleng.",
    dacSan: "Lợn cắp nách, Rượu ngô Sùng Phài, Măng nứa, Cánh kiến đỏ.",
    chiPhi: "700.000đ - 1.600.000đ/ngày.", thoiDiem: "Tháng 9 - 11 hoặc tháng 3 - 4."
  },
  "lang son": {
    ten: "Lạng Sơn", mien: "bac", tags: ["mua sam", "tam linh", "lich su"],
    anh: "https://images.unsplash.com/photo-1509030450996-93f2e3d84298?w=800",
    moTa: "Mảnh đất biên giới nổi tiếng với các chợ cửa khẩu sôi động và di tích Động Tam Thanh.",
    hoatDong: "1. Mua sắm chợ Đông Kinh, Tân Thanh.\n2. Thăm chùa Tam Thanh, Núi Nàng Tô Thị.\n3. Trải nghiệm đỉnh Mẫu Sơn.",
    diemDen: "Động Tam Thanh, Đỉnh Mẫu Sơn, Ải Chi Lăng, Chợ Tân Thanh.",
    dacSan: "Vịt quay Lạng Sơn, Khâu nhục, Phở chua, Bánh áp chao.",
    chiPhi: "500.000đ - 1.200.000đ/ngày.", thoiDiem: "Tháng 12 - 1 (Ngắm băng tuyết Mẫu Sơn) hoặc mùa xuân."
  },
  "bac kan": {
    ten: "Bắc Kạn", mien: "bac", tags: ["song nuoc", "thien nhien", "nghi duong"],
    anh: "https://images.unsplash.com/photo-1509030450996-93f2e3d84298?w=800",
    moTa: "Nơi sở hữu Hồ Ba Bể - một trong những hồ nước ngọt tự nhiên lớn nhất thế giới.",
    hoatDong: "1. Trôi thuyền dạo lòng Hồ Ba Bể.\n2. Thăm Động Puông và Thác Đầu Đẳng.\n3. Khám phá ATK Chợ Đồn.",
    diemDen: "Hồ Ba Bể, Động Puông, Thác Đầu Đẳng, Động Hua Mạ, ATK Chợ Đồn.",
    dacSan: "Cá nướng Hồ Ba Bể, Tôm chua, Bánh tày, Miến dong Na Rì.",
    chiPhi: "500.000đ - 1.100.000đ/ngày.", thoiDiem: "Tháng 5 - 9 (Mùa hè nước hồ xanh trong)."
  },
  "tuyen quang": {
    ten: "Tuyên Quang", mien: "bac", tags: ["lich su", "van hoa", "thien nhien"],
    anh: "https://images.unsplash.com/photo-1509030450996-93f2e3d84298?w=800",
    moTa: "Thủ đô khu giải phóng ATK Tân Trào và lễ hội Trung thu lớn nhất Việt Nam.",
    hoatDong: "1. Thăm Cây đa Tân Trào, Lán Nà Nưa.\n2. Xem rước đèn Trung thu Tuyên Quang.\n3. Tắm khoáng nóng Mỹ Lâm.",
    diemDen: "Khu di tích Tân Trào, Hồ Na Hang, Suối khoáng Mỹ Lâm, Thác Mơ.",
    dacSan: "Thịt lợn đen Na Hang, Cam sành Hàm Yên, Rượu ngô Na Hang, Mắm cá ruộng.",
    chiPhi: "500.000đ - 1.100.000đ/ngày.", thoiDiem: "Tháng 8 âm lịch (Lễ hội Trung Thu hoành tráng)."
  },
  "thai nguyen": {
    ten: "Thái Nguyên", mien: "bac", tags: ["sinh thai", "tra", "lich su"],
    anh: "https://images.unsplash.com/photo-1509030450996-93f2e3d84298?w=800",
    moTa: "Đệ nhất danh trà Việt Nam với những đồi chè Tân Cương xanh ngút ngàn.",
    hoatDong: "1. Thưởng trà & hái chè Tân Cương.\n2. Vui chơi Hồ Núi Cốc.\n3. Tham quan Bảo tàng Văn hóa các dân tộc.",
    diemDen: "Đồi chè Tân Cương, Hồ Núi Cốc, Hang Phượng Hoàng, ATK Định Hóa.",
    dacSan: "Trà Tân Cương, Trám đen, Bánh chưng Bờm, Tôm cuốn Thừa Lâm.",
    chiPhi: "400.000đ - 1.000.000đ/ngày.", thoiDiem: "Tháng 9 - 12 (Trà ngon nhất) hoặc mùa hè."
  },
  "phu tho": {
    ten: "Phú Thọ", mien: "bac", tags: ["tam linh", "lich su", "van hoa"],
    anh: "https://images.unsplash.com/photo-1509030450996-93f2e3d84298?w=800",
    moTa: "Đất Tổ Hùng Vương thiêng liêng, cội nguồn của dân tộc Việt Nam.",
    hoatDong: "1. Dâng hương Đền Hùng trảy hội Giỗ Tổ.\n2. Nghe Hát Xoan Phú Thọ.\n3. Dạo quanh Đồi chè Long Cốc ảo diệu.",
    diemDen: "Khu di tích Đền Hùng, Đồi chè Long Cốc, Vườn quốc gia Xuân Sơn, Đầm Vân Luông.",
    dacSan: "Thịt chua Thanh Sơn, Bưởi Đoan Hùng, Rêu đá, Bánh tai.",
    chiPhi: "500.000đ - 1.100.000đ/ngày.", thoiDiem: "Tháng 3 âm lịch (Lễ hội Đền Hùng 10/3)."
  },
  "bac giang": {
    ten: "Bắc Giang", mien: "bac", tags: ["trai cay", "sinh thai", "tam linh"],
    anh: "https://images.unsplash.com/photo-1509030450996-93f2e3d84298?w=800",
    moTa: "Thủ phủ vải thiều Lục Ngạn và chốn thiền tự Tây Yên Tử thanh bình.",
    hoatDong: "1. Bái Phật Tây Yên Tử.\n2. Vào vườn hái vải thiều Lục Ngạn chín đỏ.\n3. Cắm trại Hồ Cấm Sơn.",
    diemDen: "Chùa Vĩnh Nghiêm, Khu du lịch Tây Yên Tử, Hồ Cấm Sơn, Đồng Cao.",
    dacSan: "Vải thiều Lục Ngạn, Bánh đa Kế, Mỳ Chũ, Gà đồi Yên Thế.",
    chiPhi: "400.000đ - 1.000.000đ/ngày.", thoiDiem: "Tháng 6 (Mùa vải thiều chín rực đỏ)."
  },
  "vinh phuc": {
    ten: "Vĩnh Phúc (Tam Đảo)", mien: "bac", tags: ["nghi duong", "san may", "tam linh"],
    anh: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800",
    moTa: "Đà Lạt thu nhỏ của miền Bắc với thị trấn sương mờ Tam Đảo và Thiền viện Tây Thiên.",
    hoatDong: "1. Săn mây và uống cà phê Quán Gió Tam Đảo.\n2. Hành hương Thiền viện Trúc Lâm Tây Thiên.\n3. Nghỉ dưỡng Resort Đại Lải.",
    diemDen: "Thị trấn Tam Đảo, Hồ Đại Lải, Thiền viện Trúc Lâm Tây Thiên, Nhà thờ đá Tam Đảo.",
    dacSan: "Ngọn su su xào, Gà đồi bọc đất nướng, Lợn mán Tam Đảo, Bánh hòn.",
    chiPhi: "600.000đ - 1.500.000đ/ngày.", thoiDiem: "Quanh năm (Thời tiết luôn mát mẻ)."
  },
  "bac ninh": {
    ten: "Bắc Ninh", mien: "bac", tags: ["van hoa", "quan ho", "tam linh"],
    anh: "https://images.unsplash.com/photo-1509030450996-93f2e3d84298?w=800",
    moTa: "Nôi văn hóa Kinh Bắc xứ sở câu quan họ đùa duyên và nhiều ngôi chùa cổ kính.",
    hoatDong: "1. Lắng nghe Dân ca Quan họ Bắc Ninh.\n2. Vãn cảnh Chùa Dâu, Chùa Phật Tích.\n3. Thăm làng nghề gốm Phù Lãng.",
    diemDen: "Chùa Dâu, Chùa Phật Tích, Đền Đô, Làng gốm Phù Lãng, Làng tranh Đông Hồ.",
    dacSan: "Bánh phu thê Đình Bảng, Nem Bùi, Bánh tẻ Chờ, Rượu Làng Vân.",
    chiPhi: "400.000đ - 900.000đ/ngày.", thoiDiem: "Tháng 1 - 3 (Mùa lễ hội Xuân Kinh Bắc)."
  },
  "hai duong": {
    ten: "Hải Dương", mien: "bac", tags: ["van hoa", "lich su", "am thuc"],
    anh: "https://images.unsplash.com/photo-1509030450996-93f2e3d84298?w=800",
    moTa: "Xứ Đông văn hiến với danh thắng Côn Sơn - Kiếp Bạc gắn liền tên tuổi Nguyễn Trãi.",
    hoatDong: "1. Viếng danh thắng Côn Sơn - Kiếp Bạc.\n2. Xem múa rối nước Hồng Phong.\n3. Thưởng thức bánh đậu xanh trà xanh.",
    diemDen: "Côn Sơn Kiếp Bạc, Đảo Cò Chi Lăng Nam, Giếng Ngọc, Chùa Kính Chủ.",
    dacSan: "Bánh đậu xanh, Bánh gai Ninh Giang, Bún cá rô đồng, Vải thiều Thanh Hà.",
    chiPhi: "400.000đ - 900.000đ/ngày.", thoiDiem: "Tháng 1 - 3 hoặc tháng 8 âm lịch."
  },
  "hai phong": {
    ten: "Hải Phòng", mien: "bac", tags: ["bien", "foodtour", "du thuyen", "checkin"],
    anh: "https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=800",
    moTa: "Thành phố Hoa Phượng Đỏ sôi động nổi tiếng với thiên đường Food Tour và Đảo Cát Bà.",
    hoatDong: "1. Oanh tạc Food Tour Hải Phòng 20 món ngon.\n2. Đi cáp treo & tắm biển Cát Bà.\n3. Chèo thuyền Kayak Vịnh Lan Hạ.",
    diemDen: "Quần đảo Cát Bà, Vịnh Lan Hạ, Bãi biển Đồ Sơn, Tuyệt Tình Cốc, Chợ Cát Bi.",
    dacSan: "Bánh đa cua, Bánh mì que, Dừa dầm, Bánh đúc tàu, Hải sản Cát Bà.",
    chiPhi: "600.000đ - 1.600.000đ/ngày.", thoiDiem: "Tháng 4 - 8 (Tắm biển Cát Bà) hoặc đi Foodtour quanh năm."
  },
  "hung yen": {
    ten: "Hưng Yên", mien: "bac", tags: ["van hoa", "co kinh", "am thuc"],
    anh: "https://images.unsplash.com/photo-1509030450996-93f2e3d84298?w=800",
    moTa: "Thương cảng Phố Hiến xưa nổi danh 'Thứ nhất Kinh Kỳ, thứ nhì Phố Hiến'.",
    hoatDong: "1. Thăm di tích Phố Hiến cổ kính.\n2. Thưởng thức nhãn lồng chính gốc.\n3. Tham quan Văn Miếu Xích Đằng.",
    diemDen: "Phố Hiến, Văn Miếu Xích Đằng, Chùa Chuông, Đền Chử Đồng Tử.",
    dacSan: "Nhãn lồng Hưng Yên, Bún thang lợn, Chè hạt sen nhãn lồng, Ếch om Phượng Tường.",
    chiPhi: "350.000đ - 800.000đ/ngày.", thoiDiem: "Tháng 7 - 8 (Mùa nhãn lồng chín rộ)."
  },
  "ha nam": {
    ten: "Hà Nam", mien: "bac", tags: ["tam linh", "nghi duong", "checkin"],
    anh: "https://images.unsplash.com/photo-1509030450996-93f2e3d84298?w=800",
    moTa: "Điểm đến tâm linh mới nổi với Ngôi chùa Tam Chúc lớn nhất thế giới.",
    hoatDong: "1. Đi du thuyền ngoạn cảnh Quần thể Chùa Tam Chúc.\n2. Vãn cảnh Chùa Địa Tạng Phi Lai Tự thanh tịnh.\n3. Thăm làng Cổ Vũ Đại.",
    diemDen: "Chùa Tam Chúc, Chùa Địa Tạng Phi Lai Tự, Làng Vũ Đại, Đền Trần Thương.",
    dacSan: "Cá kho làng Vũ Đại, Bánh cuốn chả nướng Phủ Lý, Chuối ngự Đại Hoàng.",
    chiPhi: "500.000đ - 1.200.000đ/ngày.", thoiDiem: "Tháng 1 - 3 (Lễ chùa đầu năm)."
  },
  "nam dinh": {
    ten: "Nam Định", mien: "bac", tags: ["tam linh", "kiien truc", "am thuc"],
    anh: "https://images.unsplash.com/photo-1509030450996-93f2e3d84298?w=800",
    moTa: "Đất Nam Định cổ kính với các nhà thờ Công giáo kiến trúc châu Âu tráng lệ.",
    hoatDong: "1. Check-in các nhà thờ cổ Đền Thánh Hưng Nghĩa, Nhà thờ Đổ.\n2. Xin ấn Đền Trần đêm Rằm.\n3. Thưởng thức phở bò gốc Nam Định.",
    diemDen: "Đền Trần, Nhà thờ đổ Hải Lý, Đền Thánh Hưng Nghĩa, Vườn quốc gia Xuân Thủy.",
    dacSan: "Phở bò Nam Định, Bánh xíu báo, Kẹo Sưu Phố, Nem nắm Giao Thủy.",
    chiPhi: "400.000đ - 1.000.000đ/ngày.", thoiDiem: "Tháng 1 - 3 (Mùa lễ hội Đền Trần)."
  },
  "thai binh": {
    ten: "Thái Bình", mien: "bac", tags: ["bien", "dong que", "tam linh"],
    anh: "https://images.unsplash.com/photo-1509030450996-93f2e3d84298?w=800",
    moTa: "Xứ sở lúa nước bình yên với bãi biển vô cực Cồn Đen độc đáo.",
    hoatDong: "1. Trải nghiệm bãi biển vô cực Quang Lang chụp ảnh phản chiếu phản gương.\n2. Thăm Chùa Keo kiến trúc gỗ cổ nhất Việt Nam.",
    diemDen: "Biển vô cực Quang Lang, Chùa Keo, Bãi biển Cồn Đen, Làng vườn Bách Thuận.",
    dacSan: "Bánh cáy Thái Bình, Canh cá quỳnh cừ, Bún bung hoa chuối, Nộm gỏi biển.",
    chiPhi: "400.000đ - 900.000đ/ngày.", thoiDiem: "Tháng 5 - 9 (Đón bình minh biển vô cực)."
  },

  // ----------------------- MIỀN TRUNG & TÂY NGUYÊN (19 TỈNH THÀNH) -----------------------
  "thanh hoa": {
    ten: "Thanh Hóa", mien: "trung", tags: ["bien", "nghi duong", "lich su", "nui cao"],
    anh: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800",
    moTa: "Cửa ngõ Miền Trung với bãi biển Sầm Sơn nhộn nhịp và Bãi Đông hoang sơ.",
    hoatDong: "1. Tắm biển Sầm Sơn, Bãi Đông Nghi Sơn.\n2. Khám phá khu bảo tồn Pù Luông ngắm ruộng bậc thang.\n3. Thăm Di sản Thành Nhà Hồ.",
    diemDen: "Biển Sầm Sơn, Pù Luông, Bãi Đông Nghi Sơn, Di sản Thành Nhà Hồ, Suối cá thần Cẩm Lương.",
    dacSan: "Nem chua Thanh Hóa, Chả tôm, Bánh răng bừa, Mắm tép Bè Kẻ.",
    chiPhi: "600.000đ - 1.500.000đ/ngày.", thoiDiem: "Tháng 5 - 8 (Tắm biển) hoặc tháng 9 - 10 (Pù Luông lúa chín)."
  },
  "nghe an": {
    ten: "Nghệ An", mien: "trung", tags: ["bien", "lich su", "tam linh"],
    anh: "https://images.unsplash.com/photo-1552353617-3bfd679b3bdd?w=800",
    moTa: "Quê hương Chủ tịch Hồ Chí Minh vĩ đại và bãi biển Cửa Lộ trải dài.",
    hoatDong: "1. Thăm Làng Sen Quê Bác Nam Đàn.\n2. Tắm biển Cửa Lò và bãi Lăng Cửa Hội.\n3. Săn mây miền Tây Nghệ An Pù Mát.",
    diemDen: "Khu di tích Kim Liên (Quê Bác), Biển Cửa Lò, Đồi chè Thanh Chương, Vườn quốc gia Pù Mát.",
    dacSan: "Cháo lươn / Súp lươn Nghệ An, Nhút Thanh Chương, Tương Nam Đàn, Mực nhảy Cửa Lò.",
    chiPhi: "500.000đ - 1.300.000đ/ngày.", thoiDiem: "Tháng 5 - 8 (Du lịch biển)."
  },
  "ha tinh": {
    ten: "Hà Tĩnh", mien: "trung", tags: ["lich su", "bien", "tam linh"],
    anh: "https://images.unsplash.com/photo-1552353617-3bfd679b3bdd?w=800",
    moTa: "Mảnh đất kiên cường với Di tích Ngã ba Đồng Lộc và biển Thiên Cầm trong xanh.",
    hoatDong: "1. Dâng hương di tích Ngã ba Đồng Lộc.\n2. Tắm biển Thiên Cầm hoang sơ.\n3. Vãn cảnh Chùa Hương Tích.",
    diemDen: "Ngã ba Đồng Lộc, Biển Thiên Cầm, Chùa Hương Tích, Hồ Kẻ Gỗ.",
    dacSan: "Kẹo Cu Đơ Hà Tĩnh, Bánh mì ram mướt, Mực nhảy Vũng Áng.",
    chiPhi: "450.000đ - 1.100.000đ/ngày.", thoiDiem: "Tháng 4 - 8."
  },
  "quang binh": {
    ten: "Quảng Bình", mien: "trung", tags: ["mao hiem", "hang dong", "thien nhien"],
    anh: "https://images.unsplash.com/photo-1599707303381-807c42749419?w=800",
    moTa: "Vương quốc hang động thế giới sở hữu Hang Sơn Đoòng và Động Phong Nha.",
    hoatDong: "1. Thám hiểm Vườn quốc gia Phong Nha - Kẻ Bàng.\n2. Chèo Kayak Sông Chày - Hang Tối.\n3. Đu Zipline và trượt cát Quang Phú.",
    diemDen: "Động Phong Nha, Động Thiên Đường, Hang Sơn Đoòng, Sông Chày Hang Tối, Đồi cát Quang Phú.",
    dacSan: "Cháo canh Quảng Bình, Lẩu cá khoai, Bánh lọc lá tôm thịt, Đẻn biển.",
    chiPhi: "900.000đ - 3.000.000đ/ngày.", thoiDiem: "Tháng 4 đến tháng 8 (Mùa khô ráo)."
  },
  "quang tri": {
    ten: "Quảng Trị", mien: "trung", tags: ["lich su", "hoai niem", "bien"],
    anh: "https://images.unsplash.com/photo-1552353617-3bfd679b3bdd?w=800",
    moTa: "Tỉnh thành lịch sử với Thành Cổ Quảng Trị, Đôi bờ Hiền Lương - Bến Hải.",
    hoatDong: "1. Về thăm Thành cổ Quảng Trị & Nghĩa trang Đường 9.\n2. Khám phá Địa đạo Vịnh Mốc.\n3. Du lịch Đảo Cồn Cỏ.",
    diemDen: "Thành cổ Quảng Trị, Địa đạo Vịnh Mốc, Cầu Hiền Lương - Sông Bến Hải, Đảo Cồn Cỏ.",
    dacSan: "Thịt trâu lá trơảng, Bánh lọc Mỹ Chánh, Bún hến Mai Xá, Rượu Kim Long.",
    chiPhi: "500.000đ - 1.200.000đ/ngày.", thoiDiem: "Tháng 4 - 8."
  },
  "thua thien hue": {
    ten: "Thừa Thiên Huế", mien: "trung", tags: ["van hoa", "lich su", "am thuc", "co kinh"],
    anh: "https://images.unsplash.com/photo-1552353617-3bfd679b3bdd?w=800",
    moTa: "Cố đô hoài cổ dịu dàng bên sông Hương với di sản Cung điện lăng tẩm triều Nguyễn.",
    hoatDong: "1. Thăm Đại Nội Huế & Lăng tẩm vua Nguyễn.\n2. Nghe Ca Huế trên Sông Hương đêm.\n3. Thưởng thức Bún bò Huế chính gốc.\n4. Đón hoàng hôn Đầm Lập An.",
    diemDen: "Đại Nội Huế, Chùa Thiên Mụ, Lăng Khải Định, Đồi Vọng Cảnh, Bãi biển Lăng Cô.",
    dacSan: "Bún bò Huế, Cơm hến, Bánh bèo - nậm - lọc, Chè Cung Đình Huế.",
    chiPhi: "500.000đ - 1.300.000đ/ngày.", thoiDiem: "Tháng 1 - 4 (Thời tiết mát mẻ se lạnh)."
  },
  "da nang": {
    ten: "Đà Nẵng", mien: "trung", tags: ["bien", "nghi duong", "hien dai", "checkin"],
    anh: "https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=800",
    moTa: "Thành phố đáng sống nhất Việt Nam sở hữu Cầu Vàng Bà Nà Hills và biển Mỹ Khê quyến rũ.",
    hoatDong: "1. Check-in Cầu Vàng Bà Nà Hills.\n2. Xem Cầu Rồng phun lửa đêm T7/CN.\n3. Tắm biển Mỹ Khê.\n4. Vi vu Bán đảo Sơn Trà.",
    diemDen: "Bà Nà Hills, Cầu Vàng, Bãi biển Mỹ Khê, Bán đảo Sơn Trà, Ngũ Hành Sơn, Cầu Rồng.",
    dacSan: "Mì Quảng, Bánh tráng thịt heo 2 đầu da, Bún chả cá, Hải sản tươi sống.",
    chiPhi: "800.000đ - 2.000.000đ/ngày.", thoiDiem: "Tháng 3 - 8 (Biển đẹp nắng trong)."
  },
  "quang nam": {
    ten: "Quảng Nam (Hội An)", mien: "trung", tags: ["co kinh", "van hoa", "bien", "checkin"],
    anh: "https://images.unsplash.com/photo-1552353617-3bfd679b3bdd?w=800",
    moTa: "Phố cổ Hội An đèn lồng rực rỡ bên sông Hoài và Thánh địa Mỹ Sơn cổ kính.",
    hoatDong: "1. Đi thuyền thả đèn hoa đăng Phố cổ Hội An.\n2. Đi cano lặn ngắm san hô Cù Lao Chàm.\n3. Trải nghiệm chèo thuyền thúng Rừng dừa Bảy Mẫu.",
    diemDen: "Phố cổ Hội An, Thánh địa Mỹ Sơn, Đảo Cù Lao Chàm, Rừng dừa Bảy Mẫu, VinWonders Nam Hội An.",
    dacSan: "Cao lầu Hội An, Mì Quảng, Bánh mì Phượng, Cơm gà Hội An.",
    chiPhi: "700.000đ - 1.800.000đ/ngày.", thoiDiem: "Tháng 2 - 7 (Mùa khô nắng ấm)."
  },
  "quang ngai": {
    ten: "Quảng Ngãi", mien: "trung", tags: ["bien", "dao", "hoang so"],
    anh: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800",
    moTa: "Mảnh đất thiên đường biển đảo hoang sơ Cù Lao Re (Đảo Lý Sơn).",
    hoatDong: "1. Đón bình minh Cổng Tụ Vò Đảo Lý Sơn.\n2. Chinh phục đỉnh Thới Lới.\n3. Tắm biển đảo An Bình.",
    diemDen: "Đảo Lý Sơn, Cổng Tụ Vò, Đỉnh Thới Lới, Biển Mỹ Khê Quảng Ngãi, Ba Làng An.",
    dacSan: "Tỏi cô đơn Lý Sơn, Don Quảng Ngãi, Kẹo gương, Cúm núm nướng.",
    chiPhi: "600.000đ - 1.400.000đ/ngày.", thoiDiem: "Tháng 4 - 8 (Biển lặng sóng êm)."
  },
  "binh dinh": {
    ten: "Bình Định (Quy Nhơn)", mien: "trung", tags: ["bien", "nghi duong", "checkin", "vo thuat"],
    anh: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800",
    moTa: "Quy Nhơn - Thiên đường biển xanh Kỳ Co, Eo Gió hùng vĩ bậc nhất.",
    hoatDong: "1. Đi cano lặn biển ngắm san hô Kỳ Co.\n2. Dạo con đường đi bộ ven biển Eo Gió.\n3. Check-in Tháp Chăm Bánh Ít.",
    diemDen: "Eo Gió, Bãi biển Kỳ Co, Tháp Bánh Ít, Khu dã ngoại Trung Lương, Đồi cát Phương Mai.",
    dacSan: "Bánh hỏi lòng heo, Bánh xèo tôm nhảy, Chả trĩu rạm, Rượu Bàu Đá.",
    chiPhi: "700.000đ - 1.600.000đ/ngày.", thoiDiem: "Tháng 3 - 8 (Nắng đẹp biển xanh ngọc)."
  },
  "phu yen": {
    ten: "Phú Yên", mien: "trung", tags: ["bien", "hoang so", "checkin", "phim truong"],
    anh: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800",
    moTa: "Xứ sở hoa vàng trên cỏ xanh với Ghềnh Đá Đĩa địa chất độc nhất vô nhị.",
    hoatDong: "1. Check-in Ghềnh Đá Đĩa kỳ ảo.\n2. Đón bình minh đầu tiên Tổ quốc tại Mũi Điện.\n3. Ngắm cảnh Bãi Xếp.",
    diemDen: "Ghềnh Đá Đĩa, Mũi Điện (Cap Varella), Bãi Xếp, Đầm O Loan, Cầu gỗ Ông Tỉnh.",
    dacSan: "Mắt cá ngừ đại dương, Sò huyết Đầm O Loan, Bánh hòa tấu ốc, Cháo hàu.",
    chiPhi: "600.000đ - 1.400.000đ/ngày.", thoiDiem: "Tháng 3 - 8."
  },
  "khanh hoa": {
    ten: "Khánh Hòa (Nha Trang)", mien: "trung", tags: ["bien", "nghi duong", "sang chanh", "giai tri"],
    anh: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800",
    moTa: "Thành phố biển Nha Trang sôi động, sở hữu vịnh biển đẹp top thế giới và VinWonders.",
    hoatDong: "1. Quậy tưng bừng công viên giải trí VinWonders Nha Trang.\n2. Đi tour 4 đảo lặn bình khí Đảo Hòn Mun.\n3. Tắm bùn khoáng nóng thư giãn.",
    diemDen: "VinWonders Nha Trang, Đảo Hòn Mun, Tháp Bà Ponagar, Đảo Điệp Sơn, Bãi Dài Cam Ranh.",
    dacSan: "Bún cá Nha Trang, Nem nướng Nhất Trang, Bánh căn hải sản, Yến sào Khánh Hòa.",
    chiPhi: "900.000đ - 2.500.000đ/ngày.", thoiDiem: "Tháng 1 - 8 (Mùa nắng rực rỡ)."
  },
  "ninh thuan": {
    ten: "Ninh Thuận", mien: "trung", tags: ["bien", "hoang mạc", "trai cay", "van hoa"],
    anh: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800",
    moTa: "Vùng đất của nắng và gió với Vịnh Vĩnh Hy tuyệt đẹp và các hòn tiểu sa mạc.",
    hoatDong: "1. Đi tàu đáy kính ngắm san hô Vịnh Vĩnh Hy.\n2. Hái nho tươi tại vườn nho Thái An.\n3. Trải nghiệm xe địa hình Đồng cát Nam Cương.",
    diemDen: "Vịnh Vĩnh Hy, Hang Rái, Đồng Cừu An Hòa, Đồi cát Nam Cương, Tháp Po Klong Garai.",
    dacSan: "Nho tươi Ninh Thuận, Thịt dông nướng sa mạc, Cừu nướng Ninh Thuận, Bánh căn Bánh xèo.",
    chiPhi: "600.000đ - 1.500.000đ/ngày.", thoiDiem: "Tháng 4 - 8."
  },
  "binh thuan": {
    ten: "Bình Thuận (Phan Thiết)", mien: "trung", tags: ["bien", "nghi duong", "the thao nuoc", "sa mac"],
    anh: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800",
    moTa: "Thủ phủ Resort Mũi Né nổi tiếng với đồi cát bay dài tít tắp và thể thao lướt ván dù.",
    hoatDong: "1. Trượt cát & lái xe địa hình Đồi Cát Trắng (Bàu Trắng).\n2. Lướt sóng biển Mũi Né.\n3. Tắm biển Đảo Phú Quý hoang sơ.",
    diemDen: "Đồi Cát Bay, Bàu Trắng, Đảo Phú Quý, Suối Tiên, Làng chài Mũi Né, Hải đăng Ke Kê.",
    dacSan: "Bánh xèo Phan Thiết, Lẩu thả, Mực một nắng Mũi Né, Bánh căn, Thanh long.",
    chiPhi: "700.000đ - 1.800.000đ/ngày.", thoiDiem: "Tháng 10 - 4 (Phú Quý biển êm) hoặc đi Mũi Né quanh năm."
  },
  "kon tum": {
    ten: "Kon Tum", mien: "trung", tags: ["tay nguyen", "van hoa", "nui rung", "co kinh"],
    anh: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800",
    moTa: "Mảnh đất đại ngàn Tây Nguyên thơ mộng sở hữu Nhà thờ Gỗ cổ kính và Măng Đen lạnh giá.",
    hoatDong: "1. Tận hưởng không khí se lạnh tại Măng Đen (Đà Lạt thứ 2).\n2. Thăm Nhà thờ Gỗ Kon Tum.\n3. Check-in Ngã ba Đông Dương.",
    diemDen: "Măng Đen, Nhà thờ Gỗ Kon Tum, Ngã ba Đông Dương, Cầu treo Kon Klor, Chùa Khánh Lâm.",
    dacSan: "Gỏi lá Kon Tum, Cơm lam gà nướng, Rượu cần Tây Nguyên, Thịt hun khói.",
    chiPhi: "500.000đ - 1.200.000đ/ngày.", thoiDiem: "Tháng 11 - 3 (Mùa hoa dã quỳ và mai anh đào)."
  },
  "gia lai": {
    ten: "Gia Lai", mien: "trung", tags: ["tay nguyen", "thien nhien", "ca phe"],
    anh: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800",
    moTa: "Phố núi Pleiku thanh bình nổi tiếng với Biển Hồ T'Nưng 'Đôi mắt Pleiku'.",
    hoatDong: "1. Ngắm bình minh Biển Hồ T'Nưng.\n2. Săn hoa dã quỳ Núi lửa Chư Đăng Ya.\n3. Thưởng thức cà phê Tây Nguyên.",
    diemDen: "Biển Hồ T'Nưng, Núi lửa Chư Đăng Ya, Biển Hồ Chè, Thác Phú Cường, Chùa Minh Thành.",
    dacSan: "Phở hai bát (Phở khô Pleiku), Bún mắm nêm, Gà sa lửa, Cà phê Pleiku.",
    chiPhi: "500.000đ - 1.200.000đ/ngày.", thoiDiem: "Tháng 11 - 2 (Mùa hoa dã quỳ rực rỡ)."
  },
  "dak lak": {
    ten: "Đắk Lắk", mien: "trung", tags: ["tay nguyen", "voi", "ca phe", "van hoa"],
    anh: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800",
    moTa: "Thủ phủ cà phê Buôn Ma Thuột hùng vĩ với dòng Sêrêpôk và trải nghiệm thân thiện với Voi.",
    hoatDong: "1. Tham quan Bảo tàng Thế giới Cà phê.\n2. Trải nghiệm du lịch thân thiện với Voi tại Bản Đôn.\n3. Ngắm Thác Dray Nur, Dray Sap.",
    diemDen: "Bảo tàng Cà phê, Buôn Đôn, Thác Dray Nur, Hồ Lắk, Đá Voi Mẹ.",
    dacSan: "Cà phê Buôn Ma Thuột, Bún đỏ, Gà nướng cơm lam, Lẩu rau rừng.",
    chiPhi: "600.000đ - 1.400.000đ/ngày.", thoiDiem: "Tháng 12 - 3 (Mùa hoa cà phê nở trắng rừng)."
  },
  "dak nong": {
    ten: "Đắk Nông", mien: "trung", tags: ["tay nguyen", "thac nuoc", "hang dong", "hoang so"],
    anh: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800",
    moTa: "Nơi sở hữu Công viên Địa chất Toàn cầu và Vịnh Hạ Long Tây Nguyên - Hồ Tà Đùng.",
    hoatDong: "1. Ngắm toàn cảnh 40 hòn đảo lớn nhỏ trên Hồ Tà Đùng.\n2. Khám phá hệ thống Hang động núi lửa Volcanic Cave.\n3. Săn Thác Liêng Nung.",
    diemDen: "Hồ Tà Đùng, Thác Liêng Nung, Hang động núi lửa Krông Nô, Thác Đray Sáp.",
    dacSan: "Rượu cần, Cơm lam, Cá lăng sông Sêrêpôk, Cà đắng.",
    chiPhi: "500.000đ - 1.200.000đ/ngày.", thoiDiem: "Tháng 11 - 4 (Mùa khô Tà Đùng trong xanh)."
  },
  "lam dong": {
    ten: "Lâm Đồng (Đà Lạt)", mien: "trung", tags: ["nghi duong", "san may", "checkin", "lang man"],
    anh: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800",
    moTa: "Thành phố ngàn hoa Đà Lạt mộng mơ trên cao nguyên Lâm Viên se lạnh quanh năm.",
    hoatDong: "1. Thức dậy 4h sáng săn mây Đồi chè Cầu Đất.\n2. Chơi trò trượt máng Thác Datanla.\n3. Uống sữa đậu nành nóng Chợ Đêm Đà Lạt.",
    diemDen: "Hồ Xuân Hương, Quảng trường Lâm Viên, Đồi chè Cầu Đất, Thác Datanla, Langbiang.",
    dacSan: "Lẩu gà lá é, Bánh căn lòng đào, Bánh tráng nướng, Kem bơ Thanh Thảo.",
    chiPhi: "700.000đ - 1.800.000đ/ngày.", thoiDiem: "Tháng 11 - 3 (Mùa hoa dã quỳ, hoa mai anh đào)."
  },

  // ----------------------- MIỀN NAM (19 TỈNH THÀNH) -----------------------
  "tp.ho chi minh": {
    ten: "TP. Hồ Chí Minh", mien: "nam", tags: ["hien dai", "am thuc", "giai tri", "mua sam"],
    anh: "https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=800",
    moTa: "Hòn ngọc Viễn Đông - Trung tâm kinh tế, thành phố không ngủ sôi động bậc nhất Việt Nam.",
    hoatDong: "1. Lên Landmark 81 ngắm toàn cảnh thành phố.\n2. Đi Bus đường sông Saigon Waterbus ngắm hoàng hôn.\n3. Vui chơi Phố đi bộ Bùi Viện đêm.",
    diemDen: "Landmark 81, Dinh Độc Lập, Bưu điện Thành phố, Phố đi bộ Nguyễn Huệ, Chợ Bến Thành.",
    dacSan: "Cơm tấm Sài Gòn, Hủ tiếu Nam Vang, Phá lấu, Bánh mì Sài Gòn, Cà phê sữa đá.",
    chiPhi: "800.000đ - 2.500.000đ/ngày.", thoiDiem: "Tháng 12 - 4 (Mùa khô nắng đẹp)."
  },
  "can tho": {
    ten: "Cần Thơ", mien: "nam", tags: ["song nuoc", "miet vuon", "van hoa", "am thuc"],
    anh: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800",
    moTa: "Thủ phủ Miền Tây sông nước với Chợ nổi Cái Răng và Bến Ninh Kiều thơ mộng.",
    hoatDong: "1. Đón ghe sáng sớm đi Chợ nổi Cái Răng ăn hủ tiếu.\n2. Thăm Nhà cổ Bình Thủy.\n3. Trải nghiệm hái trái cây bao bụng tại Cồn Sơn.",
    diemDen: "Chợ nổi Cái Răng, Bến Ninh Kiều, Nhà cổ Bình Thủy, Cồn Sơn, Chùa Ông.",
    dacSan: "Lẩu mắm Cần Thơ, Bánh xèo củ hủ dừa, Nem nướng Cái Răng, Bánh tét lá cẩm.",
    chiPhi: "500.000đ - 1.200.000đ/ngày.", thoiDiem: "Tháng 6 - 8 (Mùa trái cây chín rộ)."
  },
  "ba ria - vung tau": {
    ten: "Bà Rịa - Vũng Tàu", mien: "nam", tags: ["bien", "nghi duong", "phuot", "am thuc"],
    anh: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800",
    moTa: "Thành phố biển nghỉ dưỡng quen thuộc sát Sài Gòn và Côn Đảo linh thiêng.",
    hoatDong: "1. Chinh phục Tượng Chúa Kito ngắm biển.\n2. Tắm biển Bãi Sau, Bãi Trụ Vũng Tàu.\n3. Bay ra Côn Đảo viếng Mộ Cô Sáu đêm.",
    diemDen: "Tượng Chúa Kito, Mũi Nghinh Phong, Bãi Sau, Côn Đảo, Hồ Tràm.",
    dacSan: "Bánh khọt Gốc Vú Sữa, Lẩu cá đuối, Bánh bông lan trứng muối, Hải sản.",
    chiPhi: "600.000đ - 1.500.000đ/ngày.", thoiDiem: "Quanh năm."
  },
  "binh duong": {
    ten: "Bình Dương", mien: "nam", tags: ["giai tri", "tam linh", "miet vuon"],
    anh: "https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=800",
    moTa: "Thủ phủ công nghiệp năng động sở hữu Khu du lịch Lạc Cảnh Đại Nam Văn Hiến.",
    hoatDong: "1. Vui chơi thả ga Khu du lịch Đại Nam.\n2. Ăn trái cây vườn Lái Thiêu.\n3. Viếng Chùa Bà Thiên Hậu.",
    diemDen: "Khu du lịch Đại Nam, Chùa Bà Thiên Hậu, Làng nghề gốm sứ Minh Sáng, Vườn trái cây Lái Thiêu.",
    dacSan: "Bánh beo bì Chợ Búng, Gỏi ngó sen tôm thịt, Măng cụt Lái Thiêu.",
    chiPhi: "400.000đ - 1.000.000đ/ngày.", thoiDiem: "Tháng 5 - 8 (Mùa măng cụt, trái cây Lái Thiêu)."
  },
  "binh phuoc": {
    ten: "Bình Phước", mien: "nam", tags: ["sinh thai", "dieu", "phuot"],
    anh: "https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=800",
    moTa: "Thủ phủ hạt điều Việt Nam với không gian rừng nguyên sinh Núi Bà Rá.",
    hoatDong: "1. Leo 1.500 bậc đá chinh phục Núi Bà Rá.\n2. Chèo đò Hồ Thủy điện Thác Mơ.\n3. Thăm Vườn quốc gia Bù Gia Mập.",
    diemDen: "Núi Bà Rá, Hồ Thác Mơ, Vườn quốc gia Bù Gia Mập, Trảng cỏ Bù Lạch.",
    dacSan: "Hạt điều rang muối, Hạt điều tươi nấu canh, Ve sầu sữa chiên giòn.",
    chiPhi: "400.000đ - 900.000đ/ngày.", thoiDiem: "Tháng 12 - 4."
  },
  "dong nai": {
    ten: "Đồng Nai", mien: "nam", tags: ["sinh thai", "cam trai", "trai cay"],
    anh: "https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=800",
    moTa: "Điểm cắm trại xanh tươi sát Sài Gòn với Vườn quốc gia Cát Tiên.",
    hoatDong: "1. Trekking ngắm thú ban đêm Vườn quốc gia Cát Tiên.\n2. Cắm trại Hồ Trị An / Thác Giang Điền.\n3. Hái chôm chôm Long Khánh.",
    diemDen: "Vườn quốc gia Cát Tiên, Hồ Trị An, Khu du lịch Bửu Long, Thác Giang Điền.",
    dacSan: "Cá lăng sông Đồng Nai, Dưa tơ Long Khánh, Gỏi bưởi Tân Triều.",
    chiPhi: "400.000đ - 1.000.000đ/ngày.", thoiDiem: "Tháng 5 - 8 (Mùa trái cây Long Khánh)."
  },
  "tay ninh": {
    ten: "Tây Ninh", mien: "nam", tags: ["tam linh", "phuot", "checkin", "nui cao"],
    anh: "https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=800",
    moTa: "Nơi có Nóc nhà Nam Bộ - Núi Bà Đen hùng vĩ và Tòa Thánh Cao Đài độc đáo.",
    hoatDong: "1. Đi cáp treo săn mây trên đỉnh Núi Bà Đen 986m.\n2. Viếng Tòa Thánh Tây Ninh rực rỡ kiến trúc.\n3. Thưởng thức bánh tráng phơi sương.",
    diemDen: "Núi Bà Đen, Tòa Thánh Tây Ninh, Hồ Dầu Tiếng, Ma Thiên Lãnh.",
    dacSan: "Bánh tráng phơi sương cuốn thịt luộc, Muối tôm Tây Ninh, Bánh canh Trảng Bàng.",
    chiPhi: "500.000đ - 1.100.000đ/ngày.", thoiDiem: "Tháng 1 - 3 âm lịch (Lễ hội Núi Bà Đen)."
  },
  "an giang": {
    ten: "An Giang", mien: "nam", tags: ["tam linh", "song nuoc", "checkin"],
    anh: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800",
    moTa: "Vùng đất Thất Sơn kỳ bí với Rừng tràm Trà Sư xanh mướt bèo dạt.",
    hoatDong: "1. Đi tắc ráng đâm xuyên Rừng tràm Trà Sư.\n2. Viếng Miếu Bà Chúa Xứ Núi Sam.\n3. Check-in Cổng trời Chùa Koh Kas.",
    diemDen: "Rừng tràm Trà Sư, Miếu Bà Chúa Xứ Núi Sam, Núi Cấm, Chùa Lầu, Chợ Mắm Châu Đốc.",
    dacSan: "Lẩu mắm Châu Đốc, Bánh bò thốt nốt, Gà đốt Mơ Ô, Bún cá Long Xuyên.",
    chiPhi: "500.000đ - 1.200.000đ/ngày.", thoiDiem: "Tháng 9 - 11 (Mùa nước nổi Miền Tây)."
  },
  "bac lieu": {
    ten: "Bạc Liêu", mien: "nam", tags: ["van hoa", "checkin", "song nuoc"],
    anh: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800",
    moTa: "Quê hương Công tử Bạc Liêu lừng lẫy và Cánh đồng quạt gió khổng lồ.",
    hoatDong: "1. Thăm Nhà Công tử Bạc Liêu.\n2. Sống ảo tại Cánh đồng Điện gió Bạc Liêu.\n3. Viếng Chùa Xiêm Cán kiến trúc Khmer.",
    diemDen: "Nhà Công tử Bạc Liêu, Cánh đồng điện gió, Chùa Xiêm Cán, Nhà thờ Tắc Sậy (Cha Diệp).",
    dacSan: "Lẩu mắm Bạc Liêu, Bánh tằm Nước cốt dừa, Bún nước lèo, Đuông dừa.",
    chiPhi: "450.000đ - 1.000.000đ/ngày.", thoiDiem: "Quanh năm."
  },
  "ben tre": {
    ten: "Bến Tre", mien: "nam", tags: ["dua", "miet vuon", "song nuoc", "sinh thai"],
    anh: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800",
    moTa: "Xứ sở Dừa Bến Tre xanh rợp bóng râm với các khu du lịch sinh thái miệt vườn.",
    hoatDong: "1. Đi xuồng chèo trong rạch dừa nước.\n2. Thăm lò làm kẹo dừa truyền thống.\n3. Thưởng thức củ hủ dừa tươi.",
    diemDen: "Cồn Phụng, Cồn Quy, Sân chim Vàm Hồ, Vườn trái cây Cái Mơn.",
    dacSan: "Kẹo dừa Bến Tre, Cơm hấp trái dừa, Đuông dừa tắm mắm, Bánh xèo hến.",
    chiPhi: "400.000đ - 900.000đ/ngày.", thoiDiem: "Tháng 6 - 8 (Mùa trái cây Cái Mơn)."
  },
  "ca mau": {
    ten: "Cà Mau", mien: "nam", tags: ["sinh thai", "cuc nam", "song nuoc"],
    anh: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800",
    moTa: "Mảnh đất Đất Mũi - Điểm cực Nam tận cùng thiêng liêng trên đất liền Tổ quốc.",
    hoatDong: "1. Check-in Mốc tọa độ GPS 0001 Đất Mũi Cà Mau.\n2. Đi vỏ lãi xuyên Vườn quốc gia U Minh Hạ.\n3. Thưởng thức cua Cà Mau ngon nhất cả nước.",
    diemDen: "Cột mốc Đất Mũi Cà Mau, Vườn quốc gia U Minh Hạ, Hòn Đá Bạc, Đầm Thị Tường.",
    dacSan: "Cua Cà Mau gạch son, Lẩu u minh lá rừng, Cá thòi lòi nướng muối ớt, Vọp nướng.",
    chiPhi: "600.000đ - 1.300.000đ/ngày.", thoiDiem: "Tháng 12 - 4 (Mùa khô đi lại thuận tiện)."
  },
  "dong thap": {
    ten: "Đồng Tháp", mien: "nam", tags: ["hoa sen", "song nuoc", "sinh thai"],
    anh: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800",
    moTa: "Đất Sen Hồng nổi tiếng với Đầm sen Sa Đéc rực rỡ và Làng hoa kiểng lâu đời.",
    hoatDong: "1. Ngắm hoa rực rỡ tại Làng hoa Sa Đéc.\n2. Đi xuồng tham quan Khu sinh thai Xẻo Quýt.\n3. Check-in Đồng sen Tháp Mười.",
    diemDen: "Làng hoa Sa Đéc, Khu sinh thái Xẻo Quýt, Đồng sen Tháp Mười, Vườn quốc gia Tràm Chim.",
    dacSan: "Hủ tiếu Sa Đéc, Nem Lai Vung, Cá lóc nướng trui cuốn lá sen non, Bánh tằm.",
    chiPhi: "450.000đ - 1.000.000đ/ngày.", thoiDiem: "Tháng 9 - 11 (Mùa nước nổi Tràm Chim) hoặc Tháng 12 (Làng hoa Tết)."
  },
  "hau giang": {
    ten: "Hậu Giang", mien: "nam", tags: ["song nuoc", "chot noi", "yen binh"],
    anh: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800",
    moTa: "Miền đất sông nước bình yên gắn liền với Chợ nổi Ngã Bảy rực rỡ sắc màu.",
    hoatDong: "1. Thăm Chợ nổi Ngã Bảy Phụng Hiệp.\n2. Khám phá Khu bảo tồn Lung Ngọc Hoàng.\n3. Ăn khóm Cầu Đúc ngọt lịm.",
    diemDen: "Khu bảo tồn Lung Ngọc Hoàng, Chợ nổi Ngã Bảy, Công viên Giải trí Kittydang, Đền Bác Hồ.",
    dacSan: "Cá thát lát rút xương chiên giòn, Khóm Cầu Đúc, Chả cá thát lát, Sữa khóm.",
    chiPhi: "400.000đ - 900.000đ/ngày.", thoiDiem: "Tháng 9 - 11."
  },
  "kien giang": {
    ten: "Kiên Giang (Phú Quốc)", mien: "nam", tags: ["bien", "nghi duong", "sang chanh", "giai tri"],
    anh: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800",
    moTa: "Đảo Ngọc Phú Quốc thiên đường biển đảo quốc tế với các siêu quần thể giải trí.",
    hoatDong: "1. Đi cáp treo Hòn Thơm vượt biển dài nhất thế giới.\n2. Tour 4 đảo lặn ngắm san hô Phú Quốc.\n3. Vui chơi VinWonders & Safari ngắm động vật.",
    diemDen: "Đảo Ngọc Phú Quốc, Grand World, Bãi Sao, Vinpearl Safari, Quần đảo Nam Du, Đảo Hải Tặc.",
    dacSan: "Bún quậy Kiến Xây, Gỏi cá trích, Rượu sim, Nước mắm Phú Quốc, Còi biên mai.",
    chiPhi: "1.200.000đ - 4.000.000đ/ngày.", thoiDiem: "Tháng 11 - 4 (Mùa biển đẹp nhất)."
  },
  "long an": {
    ten: "Long An", mien: "nam", tags: ["sinh thai", "song nuoc", "checkin"],
    anh: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800",
    moTa: "Cửa ngõ nối liền TP.HCM và Miền Tây với Làng nổi Tân Lập độc đáo.",
    hoatDong: "1. Đi bộ trên con đường xuyên rừng tràm Làng nổi Tân Lập.\n2. Vui chơi Công viên Cát Tường Phú Sinh.\n3. Thăm Làng cổ Phước Lộc Thọ.",
    diemDen: "Làng nổi Tân Lập, Công viên Cát Tường Phú Sinh, Làng cổ Phước Lộc Thọ, Nhà 120 cột.",
    dacSan: "Lạp xưởng tươi Long An, Thanh long Châu Thành, Rượu đế Gò Đen, Bánh tét.",
    chiPhi: "350.000đ - 800.000đ/ngày.", thoiDiem: "Tháng 9 - 11."
  },
  "soc trang": {
    ten: "Sóc Trăng", mien: "nam", tags: ["van hoa", "tam linh", "khmer"],
    anh: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800",
    moTa: "Xứ sở chùa Vàng Nam Bộ hòa quyện 3 dân tộc Kinh - Hoa - Khmer.",
    hoatDong: "1. Chiêm ngưỡng kiến trúc Chùa Dơi, Chùa Chén Kiểu.\n2. Xem Lễ hội đua ghe Ngo rực rỡ.\n3. Thưởng thức bánh pía béo ngậy.",
    diemDen: "Chùa Dơi, Chùa Chén Kiểu (Chùa Sà Lôn), Chùa Som Rong, Chùa Đất Sét.",
    dacSan: "Bánh pía Sóc Trăng, Bún nước lèo, Bánh cóong, Lạp xưởng Mai Quế Lộ.",
    chiPhi: "400.000đ - 900.000đ/ngày.", thoiDiem: "Tháng 10 - 11 âm lịch (Lễ hội Oóc Om Bóc & Đua ghe Ngo)."
  },
  "tien giang": {
    ten: "Tiền Giang", mien: "nam", tags: ["miet vuon", "song nuoc", "am thuc"],
    anh: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800",
    moTa: "Vùng đất miệt vườn sông nước trù phú với Chợ nổi Cái Bè nổi tiếng.",
    hoatDong: "1. Đi du thuyền ngoạn cảnh Cù lao Thới Sơn.\n2. Viếng Chùa Vĩnh Tràng đồ sộ.\n3. Thưởng thức hủ tiếu Mỹ Tho.",
    diemDen: "Cù lao Thới Sơn, Chùa Vĩnh Tràng, Chợ nổi Cái Bè, Trại rắn Đồng Tâm.",
    dacSan: "Hủ tiếu Mỹ Tho, Vú sữa Lò Rèn, Bánh vá Chợ Gạo, Mắm còng Go Công.",
    chiPhi: "400.000đ - 950.000đ/ngày.", thoiDiem: "Tháng 5 - 8 (Mùa trái cây trĩu quả)."
  },
  "tra vinh": {
    ten: "Trà Vinh", mien: "nam", tags: ["van hoa", "khmer", "tam linh", "yen binh"],
    anh: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800",
    moTa: "Thành phố rợp bóng cây cổ thụ với vô số ngôi chùa Khmer cổ kính.",
    hoatDong: "1. Dạo quanh Ao Bà Om mát rượi bóng cây cổ thụ.\n2. Thăm Chùa Hang kiến trúc độc đáo.\n3. Tắm biển Ba Động hoang sơ.",
    diemDen: "Ao Bà Om, Chùa Hang, Chùa Âng, Biển Ba Động, Cù lao Long Trị.",
    dacSan: "Bún nước lèo Trà Vinh, Dừa sáp Cầu Kè, Bánh tét Trà Cuôn, Trái quách.",
    chiPhi: "400.000đ - 900.000đ/ngày.", thoiDiem: "Tháng 4 (Tết Chốt Chnăm Thmây) hoặc tháng 10 âm lịch."
  },
  "vinh long": {
    ten: "Vĩnh Long", mien: "nam", tags: ["miet vuon", "song nuoc", "lang nghe"],
    anh: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800",
    moTa: "Mảnh đất cù lao trù phú nổi tiếng với Làng gạch gốm đỏ Mang Thít.",
    hoatDong: "1. Đi thuyền tham quan Vương quốc gạch gốm đỏ Mang Thít.\n2. Hái trái cây bao bụng tại Cù lao An Bình.\n3. Tát mương bắt cá.",
    diemDen: "Cù lao An Bình, Làng gốm đỏ Mang Thít, Chùa Tiên Châu, Khu du lịch Vinh Sang.",
    dacSan: "Cá tai tượng chiên xù, Bưởi năm roi Bình Minh, Khoai lang nướng cuốn mắm hành.",
    chiPhi: "400.000đ - 950.000đ/ngày.", thoiDiem: "Tháng 5 - 8 (Mùa trái cây chín rộ)."
  }
};

// =========================================================================
// 4. DIALOGFLOW WEBHOOK & CORE ROUTING ENGINE
// =========================================================================

app.post('/', (req, res) => {
  const queryResult = req.body.queryResult || {};
  const rawQuery = queryResult.queryText || '';
  const queryNorm = loaiBoDau(rawQuery);
  const sessionId = req.body.session || 'default_session';
  const sessionState = getSessionState(sessionId);

  // 4.1 Lệnh Reset / Quay về Menu
  if (/\b(menu|quay lai|bat dau|reset)\b/.test(queryNorm)) {
    sessionState.lastProvinceKey = null;
    return res.json(buildMenuResponse("🎩 **XIN CHÀO! BOT DU LỊCH ĐÃ SẴN SÀNG TRA CỨU TRỌN BỘ 63 TỈNH THÀNH.**\n\nHãy bấm chọn vùng miền bên dưới hoặc gõ tên tỉnh thành / câu hỏi bất kỳ!"));
  }

  // 4.2 Recommendation Engine (Gợi ý theo sở thích)
  const detectedIntent = detectUserIntent(queryNorm);
  if (detectedIntent === 'RECOMMEND') {
    const matchedProvinces = [];
    for (const key in duLieu63TinhThanh) {
      const tinh = duLieu63TinhThanh[key];
      tinh.tags.forEach(tag => {
        if (queryNorm.includes(tag)) {
          if (!matchedProvinces.includes(tinh.ten)) matchedProvinces.push(tinh.ten);
        }
      });
    }

    if (matchedProvinces.length > 0) {
      return res.json({
        fulfillmentMessages: [
          {
            text: {
              text: [
                `💡 **GỢI Ý ĐIỂM ĐẾN PHÙ HỢP VỚI GU CỦA BẠN:**\n\nDựa trên sở thích của bạn, em đề xuất các địa danh cực xịn sau:\n\n👉 **${matchedProvinces.slice(0, 8).join(' | ')}**\n\nBạn muốn tìm hiểu chi tiết điểm đến nào ở trên?`
              ]
            }
          },
          {
            quickReplies: {
              title: "👇 Bấm chọn nhanh:",
              quickReplies: matchedProvinces.slice(0, 5)
            }
          }
        ]
      });
    }
  }

  // 4.3 Tìm kiếm Tỉnh/Thành bằng thuật toán Hybrid Fuzzy Matching
  let matchedProvinceKey = null;
  let highestScore = 0;

  for (const key in duLieu63TinhThanh) {
    const tinhObj = duLieu63TinhThanh[key];
    const keyNorm = loaiBoDau(key);
    const tenNorm = loaiBoDau(tinhObj.ten);

    if (queryNorm.includes(keyNorm) || queryNorm.includes(tenNorm)) {
      matchedProvinceKey = key;
      highestScore = 1.0;
      break;
    }

    const similarity = jaccardSimilarity(queryNorm, keyNorm);
    if (similarity > highestScore && similarity >= 0.4) {
      highestScore = similarity;
      matchedProvinceKey = key;
    }
  }

  if (matchedProvinceKey) {
    sessionState.lastProvinceKey = matchedProvinceKey;
  }

  // 4.4 Lấy thông tin tỉnh đang truy vấn (từ hiện tại hoặc ngữ cảnh trước đó)
  const activeProvince = matchedProvinceKey 
    ? duLieu63TinhThanh[matchedProvinceKey] 
    : (sessionState.lastProvinceKey ? duLieu63TinhThanh[sessionState.lastProvinceKey] : null);

  // 4.5 Trả lời chuyên sâu theo từng Ý định (Intent)
  if (activeProvince) {
    if (detectedIntent === 'ASK_FOOD') {
      return res.json(buildQuickResponse(
        `🍲 **ĐẶC SẢN & ẨM THỰC NỔI TIẾNG TẠI ${activeProvince.ten.toUpperCase()}**\n\n` +
        `${activeProvince.dacSan}\n\n` +
        `💡 *Mẹo: Bạn có thể hỏi thêm về "Hoạt động chơi gì", "Chi phí" hoặc "Thời điểm du lịch đẹp nhất" tại đây!*`,
        [`Chơi gì ở ${activeProvince.ten}`, `Chi phí ${activeProvince.ten}`, `Thời điểm đi`, "Menu Chính"]
      ));
    }

    if (detectedIntent === 'ASK_ACTIVITIES') {
      return res.json(buildQuickResponse(
        `🎯 **CÁC HOẠT ĐỘNG & TRẢI NGHIỆM PHẢI THỬ TẠI ${activeProvince.ten.toUpperCase()}**\n\n` +
        `${activeProvince.hoatDong}\n\n` +
        `🏛️ **Danh thắng tiêu biểu:** ${activeProvince.diemDen}`,
        [`Ăn gì ở ${activeProvince.ten}`, `Chi phí ${activeProvince.ten}`, `Thời điểm đẹp`, "Menu Chính"]
      ));
    }

    if (detectedIntent === 'ASK_BUDGET') {
      return res.json(buildQuickResponse(
        `💰 **DỰ TOÁN CHI PHÍ DU LỊCH TẠI ${activeProvince.ten.toUpperCase()}**\n\n` +
        `${activeProvince.chiPhi}`,
        [`Chơi gì ở ${activeProvince.ten}`, `Đặc sản ngon`, "Menu Chính"]
      ));
    }

    if (detectedIntent === 'ASK_BEST_TIME') {
      return res.json(buildQuickResponse(
        `🌤️ **THỜI ĐIỂM DU LỊCH ĐẸP NHẤT TẠI ${activeProvince.ten.toUpperCase()}**\n\n` +
        `${activeProvince.thoiDiem}`,
        [`Chơi gì ở ${activeProvince.ten}`, `Đặc sản ${activeProvince.ten}`, "Menu Chính"]
      ));
    }

    // Nếu hỏi chung hoặc gõ tên Tỉnh -> Trả về Thông tin TỔNG HỢP SIÊU CHI TIẾT
    if (matchedProvinceKey) {
      return res.json({
        fulfillmentMessages: [
          {
            text: {
              text: [
                `📍 **THÔNG TIN DU LỊCH: ${activeProvince.ten.toUpperCase()}**\n\n` +
                `✨ **Mô tả:** ${activeProvince.moTa}\n\n` +
                `🎯 **HOẠT ĐỘNG PHẢI TRẢI NGHIỆM:**\n${activeProvince.hoatDong}\n\n` +
                `🏛️ **Danh thắng nổi tiếng:** ${activeProvince.diemDen}\n\n` +
                `🍲 **Đặc sản ẩm thực:** ${activeProvince.dacSan}\n\n` +
                `🌤️ **Thời điểm đẹp nhất:** ${activeProvince.thoiDiem}\n\n` +
                `💰 **Dự toán chi phí:** ${activeProvince.chiPhi}`
              ]
            }
          },
          {
            image: {
              imageUri: activeProvince.anh,
              accessibilityText: `Ảnh phong cảnh ${activeProvince.ten}`
            }
          },
          {
            quickReplies: {
              title: "👇 Chọn mục bạn quan tâm:",
              quickReplies: [
                `Ăn gì ở ${activeProvince.ten}`,
                `Chơi gì ở ${activeProvince.ten}`,
                `Chi phí ${activeProvince.ten}`,
                "Menu Chính"
              ]
            }
          }
        ]
      });
    }
  }

  // 4.6 Lọc theo Miền (Bắc / Trung / Nam)
  if (/\b(mien bac|mien trung|mien nam)\b/.test(queryNorm)) {
    let mienCode = queryNorm.includes('bac') ? 'bac' : (queryNorm.includes('trung') ? 'trung' : 'nam');
    const listTinh = Object.values(duLieu63TinhThanh)
      .filter(t => t.mien === mienCode)
      .map(t => t.ten);

    return res.json({
      fulfillmentMessages: [
        {
          text: {
            text: [
              `🗺️ **DANH SÁCH TẤT CẢ TỈNH THÀNH NỔI BẬT TẠI ${mienCode.toUpperCase()} (${listTinh.length} TỈNH THÀNH)**\n\nBấm vào tên bên dưới hoặc nhập trực tiếp câu hỏi (VD: "Tôi thích đi phượt mạo hiểm", "Thời điểm đi Phú Quốc"):`
            ]
          }
        },
        {
          quickReplies: {
            title: "👇 Bấm chọn nhanh tỉnh thành:",
            quickReplies: [...listTinh.slice(0, 10), "Menu Chính"]
          }
        }
      ]
    });
  }

  // 4.7 Fallback khi không khớp
  return res.json(buildMenuResponse("🤔 Em chưa hiểu rõ ý bạn lắm. Bạn vui lòng gõ tên Tỉnh/Thành phố bất kỳ (VD: Cà Mau, Yên Bái, Đà Nẵng) hoặc chọn gợi ý bên dưới:"));
});

// =========================================================================
// 5. HELPER FUNCTIONS TẠO PHẢN HỒI QUICK REPLIES
// =========================================================================

function buildQuickResponse(textMessage, quickRepliesList) {
  return {
    fulfillmentMessages: [
      { text: { text: [textMessage] } },
      { quickReplies: { title: "👇 Lựa chọn nhanh:", quickReplies: quickRepliesList } }
    ]
  };
}

function buildMenuResponse(welcomeText) {
  return {
    fulfillmentMessages: [
      { text: { text: [welcomeText] } },
      {
        quickReplies: {
          title: "👇 Chọn vùng miền hoặc nhu cầu:",
          quickReplies: ["Miền Bắc", "Miền Trung", "Miền Nam", "Gợi ý phượt mạo hiểm", "Gợi ý nghỉ dưỡng biển"]
        }
      }
    ]
  };
}

// Khởi chạy Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 [SERVER RUNNING] Bot Du Lịch Trọn Bộ 63 Tỉnh Thành Việt Nam đang chạy tại Port ${PORT}`);
});
