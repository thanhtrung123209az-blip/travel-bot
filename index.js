/**
 * WEBPACK HOÀN CHỈNH: BOT DU LỊCH VIỆT NAM THÔNG MINH (BÁCH KHOA TOÀN THƯ FULL 63 TỈNH THÀNH)
 * Lệnh cài đặt thư viện: npm install express
 */

const express = require('express');
const app = express();
app.use(express.json());

// =========================================================================
// 1. THUẬT TOÁN XỬ LÝ NGÔN NGỮ & ĐOÁN TỪ THÔNG MINH (FUZZY SUGGEST)
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

function detectUserIntent(queryNorm) {
  if (/\b(an gi|dac san|mon ngon|quan an|uong gi|am thuc|foodtour)\b/.test(queryNorm)) return { intent: 'ASK_FOOD', confidence: 0.95 };
  if (/\b(phuot|mao hiem|leo nui|san may|trekking|kham pha)\b/.test(queryNorm)) return { intent: 'ASK_ADVENTURE', confidence: 0.95 };
  if (/\b(nghi duong|bien|resort|thu relax|tam bien|sang chanh)\b/.test(queryNorm)) return { intent: 'ASK_RESORT', confidence: 0.95 };
  if (/\b(goi y|tu van|dieu gi hay|nen di dau)\b/.test(queryNorm)) return { intent: 'RECOMMEND', confidence: 0.88 };
  return { intent: 'GENERAL', confidence: 0.70 };
}

// =========================================================================
// 2. PHÂN CHIA TIỂU VÙNG ĐỂ CHỨA ĐỦ NÚT BẤM CỦA 63 TỈNH (TRÁNH LỖI QUÁ TẢI NÚT)
// =========================================================================

const danhSachSubRegions = {
  "tay_bac": ["Hà Giang", "Lào Cai", "Yên Bái", "Điện Biên", "Sơn La", "Lai Châu"],
  "dong_bac": ["Cao Bằng", "Bắc Kạn", "Lạng Sơn", "Tuyên Quang", "Thái Nguyên", "Phú Thọ", "Bắc Giang", "Quảng Ninh", "Hòa Bình"],
  "dong_bang_sh": ["Hà Nội", "Hải Phòng", "Vĩnh Phúc", "Bắc Ninh", "Hải Dương", "Hưng Yên", "Hà Nam", "Nam Định", "Thái Bình", "Ninh Bình"],
  "bac_trung_bo": ["Thanh Hóa", "Nghệ An", "Hà Tĩnh", "Quảng Bình", "Quảng Trị", "Thừa Thiên Huế"],
  "nam_trung_bo": ["Đà Nẵng", "Quảng Nam", "Quảng Ngãi", "Bình Định", "Phú Yên", "Khánh Hòa", "Ninh Thuận", "Bình Thuận"],
  "tay_nguyen": ["Kon Tum", "Gia Lai", "Đắc Lắc", "Đắk Nông", "Lâm Đồng"],
  "dong_nam_bo": ["TP. Hồ Chí Minh", "Bà Rịa - Vũng Tàu", "Bình Dương", "Bình Phước", "Đồng Nai", "Tây Ninh"],
  "tay_nam_bo": ["Cần Thơ", "An Giang", "Bạc Liêu", "Bến Tre", "Cà Mau", "Đồng Tháp", "Hậu Giang", "Kiên Giang", "Long An", "Sóc Trăng", "Tiền Giang", "Trà Vinh", "Vĩnh Long"]
};

// =========================================================================
// 3. DATABASE BÁCH KHOA TOÀN THƯ DU LỊCH TRỌN BỘ 63 TỈNH THÀNH VIỆT NAM
// =========================================================================

const duLieu63TinhThanh = {
  // --- MIỀN BẮC (25 TỈNH THÀNH) ---
  "ha noi": {
    ten: "Thủ đô Hà Nội",
    subRegion: "dong_bang_sh", mien: "bac",
    anh: "https://images.unsplash.com/photo-1509030450996-93f2e3d84298?w=1000",
    moTa: "Thủ đô ngàn năm văn hiến, trung tâm chính trị, văn hóa và lịch sử lâu đời của Việt Nam. Nơi đây nổi tiếng với 36 phố phường rêu phong, các công trình kiến trúc Pháp cổ cùng nhịp sống thanh lịch, tinh tế.",
    thoiDiem: "• Tháng 9 - 11: Mùa thu Hà Nội đẹp nhất năm với không khí se lạnh, nắng vàng ươm và hương hoa sữa nồng nàn.\n• Tháng 3: Mùa hoa ban, hoa sưa nở rực rỡ góc phố.",
    diemDen: "• Hồ Hoàn Kiếm & Đền Ngọc Sơn: Trái tim lịch sử văn hóa.\n• Văn Miếu Quốc Tử Giám: Trường đại học đầu tiên lưu giữ truyền thống hiếu học.\n• Hoàng Thành Thăng Long: Di sản văn hóa thế giới.\n• Lăng Chủ tịch Hồ Chí Minh & Phố cổ Hà Nội.",
    dacSan: "• Phở Hà Nội: Nước dùng thanh ngọt ninh từ xương ống.\n• Bún chả Hàng Mành, Bún thang Phố Cổ.\n• Cà phê trứng Giảng & Bánh cốm Hàng Than.",
    chiPhi: "800.000đ - 1.800.000đ / ngày"
  },
  "ha giang": {
    ten: "Tỉnh Hà Giang",
    subRegion: "tay_bac", mien: "bac",
    anh: "https://images.unsplash.com/photo-1528127269322-539801943592?w=1000",
    moTa: "Mảnh đất địa đầu cực Bắc Tổ quốc với Công viên địa chất toàn cầu Cao nguyên đá Đồng Văn hùng vĩ, những dãy núi đá tai mèo trập trùng và bản sắc văn hóa vùng cao vô cùng phong phú.",
    thoiDiem: "• Tháng 9 - 10: Mùa lúa chín vàng óng trên ruộng bậc thang Hoàng Su Phì.\n• Tháng 10 - 12: Mùa hoa tam giác mạch phủ hồng khắp các sườn núi.",
    diemDen: "• Đèo Mã Pí Lèng: Một trong 'Tứ đại đỉnh đèo' hiểm trở nhất.\n• Sông Nho Quế & Hẻm Tu Sản: Đi thuyền ngắm hẻm vực sâu nhất Đông Nam Á.\n• Cột cờ Lũng Cú & Phố cổ Đồng Văn.",
    dacSan: "• Bánh cuốn canh Đồng Văn.\n• Cháo tẩu tẩu giải cảm đắng nhẹ thanh mát.\n• Thịt trâu gác bếp & Rượu ngô men lá.",
    chiPhi: "1.000.000đ - 2.200.000đ / ngày"
  },
  "lao cai": {
    ten: "Tỉnh Lào Cai (Sa Pa)",
    subRegion: "tay_bac", mien: "bac",
    anh: "https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=1000",
    moTa: "Tỉnh biên giới phía Bắc sở hữu thị trấn sương mờ Sa Pa nổi tiếng, đỉnh Fansipan hùng vĩ và cảnh quan thiên nhiên đa dạng bậc nhất vùng Tây Bắc.",
    thoiDiem: "• Tháng 9 - 10: Mùa lúa chín vàng thung lũng Mường Hoa.\n• Tháng 12 - 1: Cơ hội săn tuyết rơi và băng giá trên đỉnh núi cao.",
    diemDen: "• Đỉnh Fansipan: Nóc nhà Đông Dương cao 3.143m.\n• Bản Cát Cát, Tả Van: Bản làng dân tộc H'Mông, Giáy.\n• Đèo Ô Quy Hồ & Thung lũng Mường Hoa.",
    dacSan: "• Lẩu cá hồi, cá tầm Sa Pa tươi ngon.\n• Thắng cố Mường Khương & Thịt lợn cắp nách nướng.",
    chiPhi: "900.000đ - 2.500.000đ / ngày"
  },
  "quang ninh": {
    ten: "Tỉnh Quảng Ninh",
    subRegion: "dong_bac", mien: "bac",
    anh: "https://images.unsplash.com/photo-1552353617-3bfd679b3bdd?w=1000",
    moTa: "Trung tâm du lịch biển đảo lớn hàng đầu miền Bắc, sở hữu Vịnh Hạ Long - Kỳ quan thiên nhiên thế giới cùng quần thể danh thắng tâm linh Yên Tử thiêng liêng.",
    thoiDiem: "• Tháng 4 - 8: Thời tiết nắng đẹp lý tưởng để du thuyền, tắm biển, chèo thuyền Kayak.\n• Tháng 9 - 11: Mùa thu tĩnh lặng cho du lịch tâm linh.",
    diemDen: "• Vịnh Hạ Long, Vịnh Bái Tử Long: Hàng ngàn đảo đá vôi kỳ ảo.\n• Danh thắng Yên Tử: Đất tổ Phật giáo Trúc Lâm.\n• Đảo Cô Tô, Quan Lạn & Phố cổ Bãi Cháy.",
    dacSan: "• Chả mực giã tay Hạ Long giòn sần sật.\n• Cà sáy Tiên Yên & Sam biển nướng mỡ hành.",
    chiPhi: "1.200.000đ - 3.500.000đ / ngày"
  },
  "ninh binh": {
    ten: "Tỉnh Ninh Bình",
    subRegion: "dong_bang_sh", mien: "bac",
    anh: "https://images.unsplash.com/photo-1531908221580-1a166a36fa59?w=1000",
    moTa: "Cố đô Hoa Lư lịch sử sở hữu Quần thể danh thắng Tràng An - Di sản văn hóa và thiên nhiên thế giới kép duy nhất tại Đông Nam Á với cảnh quan sơn thủy hữu tình.",
    thoiDiem: "• Tháng 1 - 3: Mùa lễ hội Xuân thanh bình.\n• Tháng 5 - 6: Mùa lúa chín vàng rực hai bên dòng sông Ngô Đồng (Tam Cốc).",
    diemDen: "• Quần thể danh thắng Tràng An & Tam Cốc - Bích Động.\n• Hang Múa: Leo 500 bậc đá ngắm trọn thung lũng.\n• Chùa Bái Đính & Cố đô Hoa Lư.",
    dacSan: "• Thịt dê núi Ninh Bình chế biến tái chanh, nướng.\n• Cơm cháy chà bông giòn tan sốt thịt bò.",
    chiPhi: "700.000đ - 1.500.000đ / ngày"
  },
  "cao bang": {
    ten: "Tỉnh Cao Bằng",
    subRegion: "dong_bac", mien: "bac",
    anh: "https://images.unsplash.com/photo-1599707303381-807c42749419?w=1000",
    moTa: "Vùng đất biên kim phía Bắc nổi tiếng với Thác Bản Giốc - thác nước tự nhiên trên đường biên giới lớn nhất Đông Nam Á cùng hệ thống di tích lịch sử cách mạng Pắc Bó.",
    thoiDiem: "• Tháng 8 - 10: Mùa nước đổ xanh trong và lúa chín vàng dưới chân thác.",
    diemDen: "• Thác Bản Giốc hùng vĩ.\n• Động Ngườm Ngao: Hang động thạch nhũ tự nhiên tuyệt đẹp.\n• Khu di tích Pắc Bó & Suối Lê Nin xanh như ngọc bích.",
    dacSan: "• Bánh cuốn Cao Bằng ăn kèm nước canh xương đậm đà.\n• Vịt quay 7 vị & Phở chua Cao Bằng.",
    chiPhi: "700.000đ - 1.600.000đ / ngày"
  },
  "dien bien": {
    ten: "Tỉnh Điện Biên",
    subRegion: "tay_bac", mien: "bac",
    anh: "https://images.unsplash.com/photo-1579202673506-ca3ce28943ef?w=1000",
    moTa: "Mảnh đất lịch sử lừng lẫy với Chiến thắng Điện Biên Phủ 'lừng lẫy năm châu, chấn động địa cầu', nơi hội tụ cảnh quan Tây Bắc hoang sơ và sắc hoa ban nở rộ.",
    thoiDiem: "• Tháng 3: Mùa hoa ban nở trắng xóa các sườn đồi.\n• Tháng 5: Dịp kỷ niệm chiến thắng lịch sử Điện Biên Phủ 7/5.",
    diemDen: "• Bảo tàng Chiến thắng Điện Biên Phủ, Đồi A1, Hầm De Castries.\n• Cực Tây A Pa Chải: Điểm ngã ba biên giới Việt - Trung - Lào.",
    dacSan: "• Pa pỉnh tộp (cá gập nướng kiểu Thái).\n• Thịt trâu gác bếp & Sâu chít Điện Biên.",
    chiPhi: "600.000đ - 1.400.000đ / ngày"
  },
  "son la": {
    ten: "Tỉnh Sơn La (Mộc Châu)",
    subRegion: "tay_bac", mien: "bac",
    anh: "https://images.unsplash.com/photo-1628155930542-3c7a64e2c833?w=1000",
    moTa: "Nổi tiếng với Cao nguyên Mộc Châu xanh ngát, đồi chè trái tim bạt ngàn và điểm săn mây Tà Xùa ảo diệu giữa biển mây bồng bềnh.",
    thoiDiem: "• Tháng 1 - 2: Mùa hoa mận, hoa đào nở trắng tinh khôi thung lũng.\n• Tháng 9 - 11: Mùa săn mây Tà Xùa lý tưởng.",
    diemDen: "• Cao nguyên Mộc Châu: Đồi chè trái tim, Thác Dải Yếm, Cầu kính Bạch Long.\n• Đỉnh Tà Xùa (Bắc Yên): Thiên đường săn mây.",
    dacSan: "• Bê chao Mộc Châu thơm mềm.\n• Sữa tươi Mộc Châu, Bánh sữa & Cá nướng sông Đà.",
    chiPhi: "700.000đ - 1.600.000đ / ngày"
  },
  "yen bai": {
    ten: "Tỉnh Yên Bái (Mù Cang Chải)",
    subRegion: "tay_bac", mien: "bac",
    anh: "https://images.unsplash.com/photo-1518684079-3c830dcef090?w=1000",
    moTa: "Sở hữu Danh thắng Quốc gia Ruộng bậc thang Mù Cang Chải - tuyệt tác kiến trúc canh tác mộc mạc do chính đồng bào H'Mông kiến tạo qua hàng trăm năm.",
    thoiDiem: "• Tháng 5 - 6: Mùa nước đổ lấp lánh như gương.\n• Tháng 9 - 10: Mùa vàng lúa chín rực rỡ khắp nẻo đường.",
    diemDen: "• Đồi Mâm Xôi, Đồi Móng Ngựa Mù Cang Chải.\n• Đèo Khau Phạ: Điểm nhảy dù lượn 'Bay trên mùa vàng'.\n• Suối nước nóng Trạm Tấu.",
    dacSan: "• Cốm dẻo Tú Lệ thơm nức.\n• Thịt sấy & Rượu táo mèo nồng nàn.",
    chiPhi: "700.000đ - 1.500.000đ / ngày"
  },
  "hoa binh": {
    ten: "Tỉnh Hòa Bình (Mai Châu)",
    subRegion: "dong_bac", mien: "bac",
    anh: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1000",
    moTa: "Cửa ngõ Tây Bắc thơ mộng với thung lũng Mai Châu bình yên, văn hóa dân tộc Mường, Thái đặc sắc cùng lòng hồ thủy điện Hòa Bình xanh biếc.",
    thoiDiem: "• Tháng 10 - Tháng 4 năm sau: Mùa khô khí hậu mát mẻ, trong lành.",
    diemDen: "• Bản Lác, Bản Poom Coọng Mai Châu.\n• Hồ thủy điện Hòa Bình (Vịnh Hạ Long trên núi).\n• Khu du lịch Thung Nai.",
    dacSan: "• Cơm lam gà nướng chấm muối vừng.\n• Cá sông Đà nướng lá chuối & Rượu cần Mường.",
    chiPhi: "600.000đ - 1.400.000đ / ngày"
  },
  "lai chau": {
    ten: "Tỉnh Lai Châu",
    subRegion: "tay_bac", mien: "bac",
    anh: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1000",
    moTa: "Mảnh đất sơn hà kỳ vĩ sở hữu những đỉnh núi cao hàng đầu Việt Nam như Pu Ta Leng, Pu Si Lung thu hút đông đảo phượt thủ trekking khám phá.",
    thoiDiem: "• Tháng 9 - 11: Thời tiết khô ráo thích hợp trekking chinh phục đỉnh núi.",
    diemDen: "• Đèo Hoàng Liên Sơn (Ô Quy Hồ) & Cầu kính Rồng May.\n• Bản du lịch cộng đồng Sin Suối Hồ.\n• Đỉnh núi Pu Ta Leng.",
    dacSan: "• Lợn cắp nách quay nguyên con.\n• Măng đắng & Rượu ngô ngâm thảo mộc.",
    chiPhi: "700.000đ - 1.700.000đ / ngày"
  },
  "lang son": {
    ten: "Tỉnh Lạng Sơn",
    subRegion: "dong_bac", mien: "bac",
    anh: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1000",
    moTa: "Tỉnh biên giới phía Bắc nổi tiếng với danh thắng Chùa Tam Thanh, Núi Nàng Tô Thị, đỉnh Mẫu Sơn quanh năm mây phủ và các khu chợ cửa khẩu sầm uất.",
    thoiDiem: "• Tháng 12 - 1: Cơ hội săn băng giá tuyết phủ đỉnh Mẫu Sơn.\n• Tháng 1 - 3 âm lịch: Lễ hội xuân Tam Thanh.",
    diemDen: "• Động Tam Thanh, Nàng Tô Thị, Thành Nhà Mạc.\n• Đỉnh Mẫu Sơn & Cửa khẩu quốc tế Hữu Nghị.",
    dacSan: "• Vịt quay Lạng Sơn da giòn béo ngậy.\n• Khâu nhục đậm đà & Phở chua Lạng Sơn.",
    chiPhi: "500.000đ - 1.300.000đ / ngày"
  },
  "bac kan": {
    ten: "Tỉnh Bắc Kạn",
    subRegion: "dong_bac", mien: "bac",
    anh: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=1000",
    moTa: "Sở hữu Hồ Ba Bể - một trong 20 hồ nước ngọt tự nhiên lớn nhất thế giới nằm trong khuôn viên Vườn quốc gia Ba Bể nguyên sơ tĩnh lặng.",
    thoiDiem: "• Tháng 5 - 9: Thời tiết mát mẻ, nước hồ xanh trong ngọc bích.",
    diemDen: "• Hồ Ba Bể, Động Puông, Thác Đầu Đẳng.\n• Động Hua Mạ & Bản Pac Ngoi.",
    dacSan: "• Cá nướng Hồ Ba Bể thơm ngon.\n• Tôm chua Ba Bể & Bánh co óc.",
    chiPhi: "500.000đ - 1.200.000đ / ngày"
  },
  "tuyen quang": {
    ten: "Tỉnh Tuyên Quang",
    subRegion: "dong_bac", mien: "bac",
    anh: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=1000",
    moTa: "Thủ đô khu giải phóng Tân Trào lịch sử, sở hữu danh thắng lòng hồ sinh thái Na Hang - Lâm Bình được mệnh danh là 'Vịnh Hạ Long giữa đại ngàn'.",
    thoiDiem: "• Tháng 8 âm lịch: Đêm hội Trung thu Tuyên Quang hoành tráng nhất cả nước.",
    diemDen: "• Khu di tích lịch sử Tân Trào.\n• Lòng hồ sinh thái Na Hang - Lâm Bình & Thác Mơ.",
    dacSan: "• Thịt lợn đen Na Hang.\n• Mắm cá ruộng Chiêm Hóa & Cam sành Hàm Yên.",
    chiPhi: "500.000đ - 1.100.000đ / ngày"
  },
  "thai nguyen": {
    ten: "Tỉnh Thái Nguyên",
    subRegion: "dong_bac", mien: "bac",
    anh: "https://images.unsplash.com/photo-1586339384886-5383f982eb9d?w=1000",
    moTa: "Đệ nhất danh trà Việt Nam với những vùng chè Tân Cương xanh ngát, kết hợp di tích chiến khu ATK Định Hóa và Khu du lịch Hồ Núi Cốc.",
    thoiDiem: "• Quanh năm, lý tưởng nhất từ tháng 9 đến tháng 12.",
    diemDen: "• Đồi chè Tân Cương thơm mát.\n• Khu du lịch Hồ Núi Cốc & ATK Định Hóa.\n• Bảo tàng Văn hóa các dân tộc Việt Nam.",
    dacSan: "• Trà Tân Cương đượm vị ngọt hậu.\n• Bánh chưng Bờm & Tôm cuốn Thừa Lâm.",
    chiPhi: "450.000đ - 1.000.000đ / ngày"
  },
  "phu tho": {
    ten: "Tỉnh Phú Thọ",
    subRegion: "dong_bac", mien: "bac",
    anh: "https://images.unsplash.com/photo-1511497584788-876761c11969?w=1000",
    moTa: "Đất Tổ Hùng Vương thiêng liêng - cội nguồn dân tộc Việt Nam, sở hữu Đồi chè Long Cốc ảo diệu như những bát úp xanh mướt.",
    thoiDiem: "• Tháng 3 âm lịch: Giỗ Tổ Hùng Vương (10/3 âm lịch) trang nghiêm.",
    diemDen: "• Khu di tích lịch sử Đền Hùng.\n• Đồi chè Long Cốc (Thanh Sơn).\n• Vườn quốc gia Xuân Sơn.",
    dacSan: "• Thịt chua Thanh Sơn đậm đà.\n• Bưởi Đoan Hùng & Bánh tai Phú Thọ.",
    chiPhi: "500.000đ - 1.100.000đ / ngày"
  },
  "bac giang": {
    ten: "Tỉnh Bắc Giang",
    subRegion: "dong_bac", mien: "bac",
    anh: "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=1000",
    moTa: "Thủ phủ vải thiều Lục Ngạn ngọt lịm, nơi lưu giữ Quần thể danh thắng Tây Yên Tử linh thiêng và Chùa Vĩnh Nghiêm lưu giữ mộc bản di sản thế giới.",
    thoiDiem: "• Tháng 6: Mùa thu hoạch vải thiều đỏ rực khắp làng quê.",
    diemDen: "• Khu du lịch tâm linh Tây Yên Tử.\n• Chùa Vĩnh Nghiêm & Hồ Cấm Sơn.\n• Mẫu Sơn & Đồng Cao phượt cắm trại.",
    dacSan: "• Vải thiều Lục Ngạn chín ngọt mọng nước.\n• Bánh đa Kế giòn rụm & Mỳ Chũ.",
    chiPhi: "400.000đ - 1.000.000đ / ngày"
  },
  "vinh phuc": {
    ten: "Tỉnh Vĩnh Phúc (Tam Đảo)",
    subRegion: "dong_bang_sh", mien: "bac",
    anh: "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1000",
    moTa: "Thị trấn Tam Đảo mờ sương được ví như 'Đà Lạt thu nhỏ' của miền Bắc với thời tiết 4 mùa trong 1 ngày, cùng khu nghỉ dưỡng sinh thái Hồ Đại Lải tươi mát.",
    thoiDiem: "• Quanh năm, cực kỳ lý tưởng cho chuyến nghỉ dưỡng ngắn ngày cuối tuần.",
    diemDen: "• Thị trấn Tam Đảo & Nhà thờ đá cổ.\n• Thiền viện Trúc Lâm Tây Thiên.\n• Khu du lịch Hồ Đại Lải & Flamingo Đại Lải.",
    dacSan: "• Ngọn su su Tam Đảo xào tỏi giòn ngọt.\n• Gà đồi nướng bọc đất sét & Bánh hòn Lập Thạch.",
    chiPhi: "600.000đ - 1.600.000đ / ngày"
  },
  "bac ninh": {
    ten: "Tỉnh Bắc Ninh",
    subRegion: "dong_bang_sh", mien: "bac",
    anh: "https://images.unsplash.com/photo-1542224566-6e85f2e6772f?w=1000",
    moTa: "Nôi văn hóa Kinh Bắc trù phú, quê hương của những điệu Dân ca Quan họ di sản phi vật thể thế giới cùng vô số ngôi chùa cổ kính lâu đời.",
    thoiDiem: "• Tháng 1 - 3 âm lịch: Mùa lễ hội xuân Kinh Bắc (Hội Lim 13/1 âm lịch).",
    diemDen: "• Chùa Phật Tích, Chùa Dâu (ngôi chùa cổ nhất Việt Nam).\n• Đền Đô (thờ 8 vị vua nhà Lý) & Làng tranh Đông Hồ.",
    dacSan: "• Bánh phu thê Đình Bảng dẻo ngọt.\n• Nem Bùi Thuận Thành & Bánh tẻ Chờ.",
    chiPhi: "400.000đ - 900.000đ / ngày"
  },
  "hai duong": {
    ten: "Tỉnh Hải Dương",
    subRegion: "dong_bang_sh", mien: "bac",
    anh: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1000",
    moTa: "Vùng đất nhân kiệt lưu giữ quần thể di tích Côn Sơn - Kiếp Bạc gắn liền với anh hùng Nguyễn Trãi, Trần Hưng Đạo và đặc sản bánh đậu xanh trứ danh.",
    thoiDiem: "• Tháng 1 - 3 & Tháng 8 âm lịch (Lễ hội Côn Sơn - Kiếp Bạc).",
    diemDen: "• Quần thể Côn Sơn - Kiếp Bạc.\n• Đảo Cò Chi Lăng Nam xanh mát sinh thái.\n• Văn miếu Mao Điền.",
    dacSan: "• Bánh đậu xanh Hải Dương thơm bùi.\n• Bánh gai Ninh Giang & Vải thiều Thanh Hà.",
    chiPhi: "400.000đ - 900.000đ / ngày"
  },
  "hai phong": {
    ten: "Thành phố Hải Phòng",
    subRegion: "dong_bang_sh", mien: "bac",
    anh: "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=1000",
    moTa: "Thành phố Cảng Hoa Phượng Đỏ sôi động, nổi tiếng với thiên đường du lịch Đảo Cát Bà, Vịnh Lan Hạ và trào lưu Foodtour ẩm thực đường phố bùng nổ.",
    thoiDiem: "• Tháng 4 - 8: Mùa hè rực rỡ tắm biển Cát Bà.\n• Quanh năm: Trải nghiệm Foodtour phố cổ.",
    diemDen: "• Quần đảo Cát Bà & Vịnh Lan Hạ chèo Kayak.\n• Tuyến phố cổ Foodtour Hải Phòng.\n• Bãi biển Đồ Sơn & Biệt thự Bảo Đại.",
    dacSan: "• Bánh đa cua Hải Phòng đậm đà riêu cua.\n• Bánh mì que cay & Dừa dầm béo ngậy.",
    chiPhi: "600.000đ - 1.700.000đ / ngày"
  },
  "hung yen": {
    ten: "Tỉnh Hưng Yên",
    subRegion: "dong_bang_sh", mien: "bac",
    anh: "https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=1000",
    moTa: "Mảnh đất 'Thứ nhất Kinh Kỳ, thứ nhì Phố Hiến' lưu giữ quần thể Phố Hiến cổ kính cùng đặc sản nhãn lồng tiến vua nổi tiếng cả nước.",
    thoiDiem: "• Tháng 7 - 8: Mùa nhãn lồng chín mọng ngọt lịm.",
    diemDen: "• Quần thể di tích Phố Hiến cổ, Chùa Chuông.\n• Văn Miếu Xích Đằng & Làng Nôm cổ kính.",
    dacSan: "• Nhãn lồng Hưng Yên tiến vua.\n• Bún thang lợn Phố Hiến & Ếch om Phượng Tường.",
    chiPhi: "350.000đ - 800.000đ / ngày"
  },
  "ha nam": {
    ten: "Tỉnh Hà Nam",
    subRegion: "dong_bang_sh", mien: "bac",
    anh: "https://images.unsplash.com/photo-1518495973542-4542c06a5843?w=1000",
    moTa: "Điểm đến tâm linh bùng nổ sở hữu Khu du lịch Chùa Tam Chúc - một trong những quần thể chùa lớn nhất thế giới hòa quyện núi hồ hùng vĩ.",
    thoiDiem: "• Tháng 1 - 3 âm lịch: Mùa hành hương trẩy hội đầu năm.",
    diemDen: "• Quần thể du lịch tâm linh Chùa Tam Chúc.\n• Chùa Địa Tạng Phi Lai Tự tĩnh lặng yên bình.\n• Ngôi nhà Bá Kiến (Làng Đại Hoàng).",
    dacSan: "• Cá kho làng Vũ Đại (Đại Hoàng) kỳ công 16 tiếng.\n• Bánh cuốn Phủ Lý ăn kèm thịt nướng than hoa.",
    chiPhi: "500.000đ - 1.200.000đ / ngày"
  },
  "nam dinh": {
    ten: "Tỉnh Nam Định",
    subRegion: "dong_bang_sh", mien: "bac",
    anh: "https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?w=1000",
    moTa: "Vùng đất Thánh địa kiến trúc nhà thờ Công giáo tráng lệ độc đáo, quê hương nhà Trần lịch sử và nơi khai sinh món Phở Bò trứ danh.",
    thoiDiem: "• Dịp Giáng Sinh (tháng 12) vô cùng náo nhiệt hoành tráng.\n• Đêm 14 rằm tháng Giêng: Lễ khai ấn Đền Trần.",
    diemDen: "• Nhà thờ đổ Hải Lý, Tòa giám mục Bùi Chu, Nhà thờ Hưng Nghĩa.\n• Khu di tích Đền Trần & Vườn quốc gia Xuân Thủy.",
    dacSan: "• Phở bò Nam Định (Phở Cồ) chuẩn vị gốc.\n• Bánh xíu báo thơm lừng & Kẹo Cầu Dòng.",
    chiPhi: "400.000đ - 1.000.000đ / ngày"
  },
  "thai binh": {
    ten: "Tỉnh Thái Bình",
    subRegion: "dong_bang_sh", mien: "bac",
    anh: "https://images.unsplash.com/photo-1495567720989-cebdbdd97913?w=1000",
    moTa: "Quê hương lúa nước bình yên nổi tiếng với bãi biển vô cực Quang Lang thơ mộng như chiếc gương khổng lồ soi chiếu trời mây.",
    thoiDiem: "• Tháng 5 - 9: Mùa đón bình minh săn ảnh bãi biển vô cực.",
    diemDen: "• Biển vô cực Quang Lang (Thụy Xuân).\n• Chùa Keo cổ kính hơn 400 năm tuổi kiến trúc gỗ độc đáo.\n• Biển Đồng Châu.",
    dacSan: "• Bánh cáy Thái Bình đậm đà vị gừng thơm.\n• Canh cá Quỳnh Cừ & Bún bung hoa chuối.",
    chiPhi: "400.000đ - 900.000đ / ngày"
  },

  // --- MIỀN TRUNG & TÂY NGUYÊN (19 TỈNH THÀNH) ---
  "thanh hoa": {
    ten: "Tỉnh Thanh Hóa",
    subRegion: "bac_trung_bo", mien: "trung",
    anh: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=1000",
    moTa: "Tỉnh cửa ngõ kết nối Bắc - Trung Bộ sở hữu biển Sầm Sơn nhộn nhịp, thiên đường sinh thái xanh Pù Luông và Di sản thế giới Thành Nhà Hồ.",
    thoiDiem: "• Tháng 5 - 8: Tắm biển Sầm Sơn, Bãi Đông.\n• Tháng 9 - 10: Ngắm ruộng bậc thang lúa chín vàng ở Pù Luông.",
    diemDen: "• Biển Sầm Sơn, Bãi Đông Nghi Sơn hoang sơ.\n• Khu bảo tồn thiên nhiên Pù Luông.\n• Di sản thế giới Thành Nhà Hồ & Suối cá thần Cẩm Lương.",
    dacSan: "• Nem chua Thanh Hóa giòn sần sật, chua ngọt.\n• Chả tôm nướng & Bánh cuốn Thanh Hóa.",
    chiPhi: "600.000đ - 1.600.000đ / ngày"
  },
  "nghe an": {
    ten: "Tỉnh Nghệ An",
    subRegion: "bac_trung_bo", mien: "trung",
    anh: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1000",
    moTa: "Quê hương Bác Hồ kính yêu, sở hữu bãi biển Cửa Lò sầm uất, đồi chè Thanh Chương rợp xanh mát và Vườn quốc gia Pù Mát đa dạng sinh học.",
    thoiDiem: "• Tháng 5 - 8: Mùa biển Cửa Lò nắng ấm, nước trong.",
    diemDen: "• Khu di tích Kim Liên (Quê Bác - Nam Đàn).\n• Biển Cửa Lò & Đồi chè ốc đảo Thanh Chương.\n• Vườn quốc gia Pù Mát.",
    dacSan: "• Súp lươn Nghệ An ăn kèm bánh mì giòn tan.\n• Nhút Thanh Chương & Tương Nam Đàn.",
    chiPhi: "500.000đ - 1.300.000đ / ngày"
  },
  "ha tinh": {
    ten: "Tỉnh Hà Tĩnh",
    subRegion: "bac_trung_bo", mien: "trung",
    anh: "https://images.unsplash.com/photo-1519046904884-53103b34b206?w=1000",
    moTa: "Vùng đất lịch sử thiêng liêng Ngã ba Đồng Lộc, sở hữu bãi biển Thiên Cầm xanh ngọc êm đềm cùng danh thắng Chùa Hương Tích cổ kính.",
    thoiDiem: "• Tháng 4 - 8: Mùa tắm biển Thiên Cầm tuyệt đẹp.",
    diemDen: "• Khu di tích Ngã ba Đồng Lộc.\n• Biển Thiên Cầm & Chùa Hương Tích (Nghi Xuân).\n• Hồ Keo Gỗ.",
    dacSan: "• Kẹo Cu Đơ Hà Tĩnh thơm bùi giòn rụm.\n• Bánh ram mướt & Mực nhảy Vũng Áng.",
    chiPhi: "450.000đ - 1.100.000đ / ngày"
  },
  "quang binh": {
    ten: "Tỉnh Quảng Bình",
    subRegion: "bac_trung_bo", mien: "trung",
    anh: "https://images.unsplash.com/photo-1544644181-1484b3fdfc62?w=1000",
    moTa: "Vương quốc hang động thế giới sở hữu Di sản Phong Nha - Kẻ Bàng, Hang Sơn Đoòng lớn nhất hành tinh cùng những bãi biển cát trắng miên man.",
    thoiDiem: "• Tháng 4 - 8: Mùa nắng đẹp lý tưởng thám hiểm hang động và chèo Kayak.",
    diemDen: "• Động Phong Nha, Động Thiên Đường, Hang Sơn Đoòng.\n• Sông Chày - Hang Tối & Suối Moọc.\n• Biển Nhật Lệ & Đồi cát Quang Phú.",
    dacSan: "• Cháo canh Quảng Bình béo ngọt đậm đà.\n• Lẩu cá khoai & Đẻn biển nướng.",
    chiPhi: "900.000đ - 3.000.000đ / ngày"
  },
  "quang tri": {
    ten: "Tỉnh Quảng Trị",
    subRegion: "bac_trung_bo", mien: "trung",
    anh: "https://images.unsplash.com/photo-1506197603052-3cc9c3a201bd?w=1000",
    moTa: "Mảnh đất anh hùng ghi dấu lịch sử đấu tranh giải phóng dân tộc với Đôi bờ Hiền Lương - Bến Hải, Địa đạo Vịnh Mốc và Đảo Cồn Cỏ hoang sơ.",
    thoiDiem: "• Tháng 4 - 8: Mùa hè khô ráo thích hợp du lịch hoài niệm lịch sử.",
    diemDen: "• Thành cổ Quảng Trị, Nghĩa trang Đường 9.\n• Đôi bờ Hiền Lương - Sông Bến Hải.\n• Địa đạo Vịnh Mốc & Đảo Cồn Cỏ.",
    dacSan: "• Thịt trâu lá trơảng đậm đà cay nồng.\n• Bánh lọc Mỹ Chánh & Bún hến Mai Xá.",
    chiPhi: "500.000đ - 1.200.000đ / ngày"
  },
  "thua thien hue": {
    ten: "Tỉnh Thừa Thiên Huế",
    subRegion: "bac_trung_bo", mien: "trung",
    anh: "https://images.unsplash.com/photo-1569154941061-e231b4725ef1?w=1000",
    moTa: "Cố đô dịu dàng bên dòng Sông Hương thơ mộng, nơi lưu giữ Quần thể di tích Cố đô Huế, Nhã nhạc cung đình và nền ẩm thực hoàng gia tinh tế.",
    thoiDiem: "• Tháng 1 - 4: Tiết trời dịu mát, nắng nhẹ, không mưa rào.",
    diemDen: "• Đại Nội Huế, Chùa Thiên Mụ.\n• Các lăng vua Nguyễn: Lăng Khải Định, Lăng Tự Đức, Lăng Minh Mạng.\n• Đầm Lập An & Bãi biển Lăng Cô.",
    dacSan: "• Bún bò Huế chuẩn vị gốc đậm đà mắm ruốc.\n• Cơm hến, Bánh bèo, Bánh nậm, Bánh lọc & Chè Cung Đình.",
    chiPhi: "500.000đ - 1.400.000đ / ngày"
  },
  "da nang": {
    ten: "Thành phố Đà Nẵng",
    subRegion: "nam_trung_bo", mien: "trung",
    anh: "https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=1000",
    moTa: "Thành phố đáng sống nhất Việt Nam với bãi biển Mỹ Khê top thế giới, Cầu Vàng Bà Nà Hills chạm mây và biểu tượng Cầu Rồng phun lửa.",
    thoiDiem: "• Tháng 3 - 8: Mùa hè rực rỡ, bãi biển lặng sóng, nắng ấm êm dịu.",
    diemDen: "• Sun World Bà Nà Hills & Cầu Vàng chạm mây.\n• Bãi biển Mỹ Khê & Bán đảo Sơn Trà (Chùa Linh Ứng).\n• Cầu Rồng, Danh thắng Ngũ Hành Sơn.",
    dacSan: "• Mì Quảng Đà Nẵng đậm đà nước dùng.\n• Bánh tráng cuốn thịt heo hai đầu da.\n• Hải sản tươi sống nướng mỡ hành.",
    chiPhi: "800.000đ - 2.200.000đ / ngày"
  },
  "quang nam": {
    ten: "Tỉnh Quảng Nam (Hội An)",
    subRegion: "nam_trung_bo", mien: "trung",
    anh: "https://images.unsplash.com/photo-1588668214407-6ea9a6d8c272?w=1000",
    moTa: "Sở hữu 2 Di sản văn hóa thế giới: Phố cổ Hội An đèn lồng rực rỡ bên sông Hoài và Thánh địa Mỹ Sơn kiến trúc Chăm Pa cổ kính.",
    thoiDiem: "• Tháng 2 - 7: Tiết trời khô ráo, nắng đẹp, không mưa.",
    diemDen: "• Phố cổ Hội An & Chùa Cầu.\n• Thánh địa Mỹ Sơn cổ kính.\n• Đảo Cù Lao Chàm lặn ngắm san hô & Rừng dừa Bảy Mẫu.",
    dacSan: "• Cao lầu Hội An dẻo thơm nức tiếng.\n• Bánh mì Phượng, Cơm gà Hội An & Mì Quảng Phú Chùa.",
    chiPhi: "700.000đ - 1.800.000đ / ngày"
  },
  "quang ngai": {
    ten: "Tỉnh Quảng Ngãi",
    subRegion: "nam_trung_bo", mien: "trung",
    anh: "https://images.unsplash.com/photo-1512100356356-de1b84283e18?w=1000",
    moTa: "Thiên đường biển đảo Đảo Lý Sơn được hình thành từ trầm tích núi lửa hàng triệu năm, mang vẻ đẹp hoang sơ tựa thiên đường.",
    thoiDiem: "• Tháng 4 - 8: Biển lặng, trời xanh ngắt lý tưởng đi tàu ra Đảo Lý Sơn.",
    diemDen: "• Đảo Lý Sơn, Cổng Tụ Vò, Đỉnh Thới Lới.\n• Bãi biển Mỹ Khê Quảng Ngãi & Thành cổ Châu Ổ.",
    dacSan: "• Don Quảng Ngãi ăn kèm bánh tráng nướng.\n• Tỏi cô đơn Lý Sơn & Xu xoa phong vị biển.",
    chiPhi: "600.000đ - 1.400.000đ / ngày"
  },
  "binh dinh": {
    ten: "Tỉnh Bình Định (Quy Nhơn)",
    subRegion: "nam_trung_bo", mien: "trung",
    anh: "https://images.unsplash.com/photo-1509233725247-49e657c54213?w=1000",
    moTa: "Đất võ trời văn Quy Nhơn sở hữu những bờ biển trong xanh vắt, Eo Gió ngắm hoàng hôn tuyệt đẹp và Bãi biển Kỳ Co thơ mộng.",
    thoiDiem: "• Tháng 3 - 8: Thời tiết nắng đẹp rực rỡ, biển trong như ngọc Bích.",
    diemDen: "• Eo Gió, Bãi biển Kỳ Co.\n• Tháp Bánh Ít, Tháp Đôi Chăm Pa.\n• KDL Trung Lương & Tịnh xá Ngọc Hòa.",
    dacSan: "• Bánh hỏi lòng heo Quy Nhơn.\n• Bánh xèo tôm nhảy giòn rụm & Rượu Bầu Đá.",
    chiPhi: "700.000đ - 1.600.000đ / ngày"
  },
  "phu yen": {
    ten: "Tỉnh Phú Yên",
    subRegion: "nam_trung_bo", mien: "trung",
    anh: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=1000",
    moTa: "Xứ sở 'Tôi thấy hoa vàng trên cỏ xanh' mê hoặc du khách bởi Ghềnh Đá Đĩa kiệt tác thiên nhiên độc nhất vô nhị cùng Mũi Điện đón ánh bình minh đầu tiên.",
    thoiDiem: "• Tháng 3 - 8: Nắng đẹp khô ráo, sóng nhẹ.",
    diemDen: "• Ghềnh Đá Đĩa độc đáo.\n• Mũi Điện (Mũi Đại Lãnh) đón bình minh.\n• Bãi Xếp, Tháp Nghinh Phong & Đầm O Loan.",
    dacSan: "• Mắt cá ngừ đại dương hầm thuốc bắc béo ngậy.\n• Sò huyết Đầm O Loan & Bánh hỏi lòng heo.",
    chiPhi: "600.000đ - 1.400.000đ / ngày"
  },
  "khanh hoa": {
    ten: "Tỉnh Khánh Hòa (Nha Trang)",
    subRegion: "nam_trung_bo", mien: "trung",
    anh: "https://images.unsplash.com/photo-1506929562872-bb421503ef21?w=1000",
    moTa: "Thành phố biển Nha Trang năng động sở hữu một trong những vịnh biển đẹp nhất hành tinh, các hòn đảo nghỉ dưỡng sang trọng và suối khoáng nóng thư giãn.",
    thoiDiem: "• Tháng 1 - 8: Mùa khô chan hòa nắng ấm, biển lặng trong vắt.",
    diemDen: "• VinWonders Nha Trang & Đảo Hòn Tre.\n• Đảo Hòn Mun, Hòn Tằm lặn ngắm san hô.\n• Tháp Bà Ponagar & Đảo Điệp Sơn đường đi dưới biển.",
    dacSan: "• Bún cá Nha Trang thanh ngọt.\n• Nem nướng Ninh Hòa & Yến sào Khánh Hòa.",
    chiPhi: "900.000đ - 2.500.000đ / ngày"
  },
  "ninh thuan": {
    ten: "Tỉnh Ninh Thuận",
    subRegion: "nam_trung_bo", mien: "trung",
    anh: "https://images.unsplash.com/photo-1510414842594-a61c69b5ae57?w=1000",
    moTa: "Vùng đất nắng gió độc đáo nổi tiếng với Vịnh Vĩnh Hy xanh trong kỳ ảo, những trang trại đồi cừu, vườn nho trĩu quả và tháp Chăm cổ kính.",
    thoiDiem: "• Tháng 4 - 8: Mùa nho chín trĩu quả và biển Vĩnh Hy đẹp nhất.",
    diemDen: "• Vịnh Vĩnh Hy, Hang Rái kỳ ảo.\n• Đồng cừu An Hòa, Đồi cát Nam Cương.\n• Tháp Po Klong Garai & Vườn nho Thái An.",
    dacSan: "• Nho tươi Ninh Thuận & Mật nho.\n• Thịt cừu, thịt dông nướng mỡ hành.",
    chiPhi: "600.000đ - 1.500.000đ / ngày"
  },
  "binh thuan": {
    ten: "Tỉnh Bình Thuận (Phan Thiết)",
    subRegion: "nam_trung_bo", mien: "trung",
    anh: "https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?w=1000",
    moTa: "Thủ phủ Resort Mũi Né nổi tiếng với những đồi cát bay mênh mông như sa mạc thu nhỏ cùng đảo hoang sơ Đảo Phú Quý cực HOT.",
    thoiDiem: "• Quanh năm nắng ấm, tuyệt nhất từ tháng 12 đến tháng 6.",
    diemDen: "• Đồi Cát Bay, Bàu Trắng Mũi Né.\n• Đảo Phú Quý hoang sơ trong vắt.\n• Hải đăng Keo Gà & Tháp Poshanư.",
    dacSan: "• Lẩu thả Mũi Né ngậy béo.\n• Bánh xèo Phan Thiết & Mực một nắng nướng sa tế.",
    chiPhi: "700.000đ - 1.800.000đ / ngày"
  },
  "kon tum": {
    ten: "Tỉnh Kon Tum",
    subRegion: "tay_nguyen", mien: "trung",
    anh: "https://images.unsplash.com/photo-1448375240586-882707db888b?w=1000",
    moTa: "Vùng đất cực Bắc Tây Nguyên sở hữu thị trấn se lạnh Măng Đen - 'Đà Lạt thứ hai', cùng Nhà thờ Gỗ trăm năm tuổi mang đậm dấu ấn Tây Nguyên.",
    thoiDiem: "• Tháng 11 - 3: Mùa hoa dã quỳ, hoa mai anh đào nở rộ khắp núi rừng.",
    diemDen: "• Khu du lịch sinh thái Măng Đen (Hồ Đăk Ke, Thác Pa Sỹ).\n• Nhà thờ Gỗ Kon Tum trăm năm tuổi.\n• Tòa Giám Mục Kon Tum & Cầu treo Kon Klor.",
    dacSan: "• Gỏi lá Kon Tum kết hợp 40 loại lá rừng.\n• Cơm lam gà nướng Măng Đen.",
    chiPhi: "500.000đ - 1.200.000đ / ngày"
  },
  "gia lai": {
    ten: "Tỉnh Gia Lai",
    subRegion: "tay_nguyen", mien: "trung",
    anh: "https://images.unsplash.com/photo-1426604966848-d7adac402bff?w=1000",
    moTa: "Phố núi Pleiku lãng mạn sở hữu 'Đôi mắt Pleiku' Biển Hồ T'Nưng xanh veo phẳng lặng cùng ngọn núi lửa Chư Đăng Ya rực rỡ sắc vàng dã quỳ.",
    thoiDiem: "• Tháng 11 - 2: Mùa hoa dã quỳ nở rực rỡ và mùa cạn đẹp nhất.",
    diemDen: "• Biển Hồ T'Nưng (Hồ Chư Đăng Ya).\n• Núi lửa Chư Đăng Ya & Chùa Minh Thành hoành tráng.\n• Biển Hồ Chè & Hàng cây thông trăm tuổi.",
    dacSan: "• Phở hai bát Pleiku (Phở khô Gia Lai).\n• Gà sa lửa & Bún mắm nêm Pleiku.",
    chiPhi: "500.000đ - 1.200.000đ / ngày"
  },
  "dak lak": {
    ten: "Tỉnh Đắc Lắc",
    subRegion: "tay_nguyen", mien: "trung",
    anh: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1000",
    moTa: "Thủ phủ Cà phê Buôn Ma Thuột đậm đà bản sắc Tây Nguyên với không gian văn hóa cồng chiêng, những ngọn thác cuồn cuộn và văn hóa cưỡi voi Buôn Đôn.",
    thoiDiem: "• Tháng 12 - 3: Mùa hoa cà phê nở trắng xóa đồi núi.",
    diemDen: "• Bảo tàng Thế giới Cà phê hoành tráng.\n• KDL Buôn Đôn & Làng cà phê Trung Nguyên.\n• Cụm thác Dray Nur - Dray Sap.",
    dacSan: "• Cà phê Buôn Ma Thuột nức tiếng bộc lộ hậu vị.\n• Bún đỏ Buôn Ma Thuột & Cá lăng sông Sêrêpôk.",
    chiPhi: "600.000đ - 1.400.000đ / ngày"
  },
  "dak nong": {
    ten: "Tỉnh Đắk Nông",
    subRegion: "tay_nguyen", mien: "trung",
    anh: "https://images.unsplash.com/photo-1439853949127-fa647821eba0?w=1000",
    moTa: "Nơi sở hữu Hồ Tà Đùng - 'Vịnh Hạ Long trên Tây Nguyên' tuyệt đẹp với hơn 40 đảo lớn nhỏ cùng Hệ thống Hang động núi lửa Krông Nô độc đáo.",
    thoiDiem: "• Tháng 11 - 4: Mùa tích nước hồ Tà Đùng xanh mướt ngợp mắt.",
    diemDen: "• Hồ Tà Đùng ngắm toàn cảnh đảo lớn nhỏ.\n• Thác Liêng Nung hùng vĩ.\n• Công viên địa chất toàn cầu Đắk Nông.",
    dacSan: "• Rượu cần Tây Nguyên nồng ấm.\n• Cá lăng nướng than & Lẩu lá rừng.",
    chiPhi: "500.000đ - 1.200.000đ / ngày"
  },
  "lam dong": {
    ten: "Tỉnh Lâm Đồng (Đà Lạt)",
    subRegion: "tay_nguyen", mien: "trung",
    anh: "https://images.unsplash.com/photo-1501854140801-50d01698950b?w=1000",
    moTa: "Thành phố sương mờ Đà Lạt mộng mơ - thiên đường nghỉ dưỡng bậc nhất cả nước với không khí se lạnh quanh năm, rừng thông và ngàn hoa khoe sắc.",
    thoiDiem: "• Tháng 11 - 3: Mùa mai anh đào, săn mây bồng bềnh và tiết trời se lạnh.",
    diemDen: "• Hồ Xuân Hương, Hồ Tuyền Lâm.\n• Quảng trường Lâm Viên, Đồi chè Cầu Đất.\n• Thác Datanla & Langbiang.",
    dacSan: "• Lẩu gà lá é thơm nức.\n• Bánh căn xíu mại, Kem bơ béo ngậy & Bánh tráng nướng.",
    chiPhi: "700.000đ - 1.800.000đ / ngày"
  },

  // --- MIỀN NAM (19 TỈNH THÀNH) ---
  "tp.ho chi minh": {
    ten: "Thành phố Hồ Chí Minh",
    subRegion: "dong_nam_bo", mien: "nam",
    anh: "https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=1000",
    moTa: "Đô thị 'Thành phố không ngủ' lớn và sôi động bậc nhất Việt Nam, kết hợp hoàn hảo giữa nét hiện đại sầm uất với các di tích lịch sử và văn hóa ẩm thực phong phú.",
    thoiDiem: "• Tháng 12 - 4: Mùa khô nắng ấm, rực rỡ, lý tưởng vui chơi dạo phố.",
    diemDen: "• Tòa nhà Landmark 81, Dinh Độc Lập.\n• Nhà thờ Đức Bà, Bưu điện Thành Phố.\n• Phố đi bộ Nguyễn Huệ & Bus đường sông Waterbus.",
    dacSan: "• Cơm tấm Sài Gòn sườn nướng mật mỡ.\n• Hủ tiếu Nam Vang, Phá lấu vỉa hè & Bánh mì Sài Gòn.",
    chiPhi: "800.000đ - 2.500.000đ / ngày"
  },
  "can tho": {
    ten: "Thành phố Cần Thơ",
    subRegion: "tay_nam_bo", mien: "nam",
    anh: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1000",
    moTa: "Thủ phủ Miền Tây sông nước nổi tiếng với trải nghiệm Chợ nổi Cái Răng, Bến Ninh Kiều lung linh và các khu vườn trái cây miệt vườn trù phú.",
    thoiDiem: "• Tháng 6 - 8: Mùa trái cây chín rộ mọng nước.",
    diemDen: "• Chợ nổi Cái Răng sôi động sáng sớm.\n• Bến Ninh Kiều & Cầu Tình Yêu.\n• Nhà cổ Bình Thủy & Cồn Sơn.",
    dacSan: "• Lẩu mắm Cần Thơ thơm ngon chuẩn vị.\n• Bánh xèo củ hủ dừa & Bánh hỏi thịt heo quay Phong Điền.",
    chiPhi: "500.000đ - 1.200.000đ / ngày"
  },
  "ba ria - vung tau": {
    ten: "Tỉnh Bà Rịa - Vũng Tàu",
    subRegion: "dong_nam_bo", mien: "nam",
    anh: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=1000",
    moTa: "Thành phố biển Vũng Tàu nhộn nhịp cùng thiên đường biển ngọc thiêng liêng Côn Đảo hoang sơ xanh trong vắt.",
    thoiDiem: "• Quanh năm, cực kỳ thuận tiện đi nghỉ dưỡng cuối tuần.",
    diemDen: "• Tượng Chúa Kito Vũng Tàu, Bãi Sau, Bãi Trước.\n• Hải đăng Vũng Tàu & Quần đảo Côn Đảo (Nghĩa trang Hàng Dương).",
    dacSan: "• Bánh khọt Vũng Tàu giòn rụm tôm tươi.\n• Lẩu cá đuối & Mứt hạt đàng Côn Đảo.",
    chiPhi: "600.000đ - 1.600.000đ / ngày"
  },
  "binh duong": {
    ten: "Tỉnh Bình Dương",
    subRegion: "dong_nam_bo", mien: "nam",
    anh: "https://images.unsplash.com/photo-1513151233558-d860c5398176?w=1000",
    moTa: "Nổi tiếng với Khu du lịch Đại Nam quy mô hoành tráng, vườn trái cây Lái Thiêu trù phú và làng nghề gốm sứ truyền thống.",
    thoiDiem: "• Tháng 5 - 8: Mùa thu hoạch măng cụt và trái cây Lái Thiêu.",
    diemDen: "• Khu du lịch Lạc Cảnh Đại Nam Văn Hiến.\n• Chùa Bà Thiên Hậu & Vườn trái cây Lái Thiêu.\n• Chùa Tây Tạng.",
    dacSan: "• Bánh beo bì Chợ Búng thơm bùi.\n• Gỏi gà măng cụt Lái Thiêu & Lẩu bò Bò Tèo.",
    chiPhi: "400.000đ - 1.000.000đ / ngày"
  },
  "binh phuoc": {
    ten: "Tỉnh Bình Phước",
    subRegion: "dong_nam_bo", mien: "nam",
    anh: "https://images.unsplash.com/photo-1473448912268-2022ce9509d8?w=1000",
    moTa: "Thủ phủ hạt điều Việt Nam với danh thắng Núi Bà Rá hoang sơ, lòng hồ Thác Mơ lung linh và Vườn quốc gia Bù Gia Mập.",
    thoiDiem: "• Tháng 12 - 4: Mùa khô thích hợp trekking và khám phá rừng.",
    diemDen: "• Núi Bà Rá (Thác Mơ) đi cáp treo ngoạn cảnh.\n• Vườn quốc gia Bù Gia Mập nguyên sơ.\n• Trảng cỏ Bàu Lách.",
    dacSan: "• Hạt điều rang muối Bình Phước.\n• Ve sầu chiên giòn & Đọt mây nướng.",
    chiPhi: "400.000đ - 900.000đ / ngày"
  },
  "dong nai": {
    ten: "Tỉnh Đồng Nai",
    subRegion: "dong_nam_bo", mien: "nam",
    anh: "https://images.unsplash.com/photo-1502082553048-f009c37129b9?w=1000",
    moTa: "Điểm đến trekking Vườn quốc gia Cát Tiên - Di sản khu dự trữ sinh quyển thế giới, cắm trại Hồ Trị An chill cùng bãi đá KDL Bửu Long.",
    thoiDiem: "• Tháng 12 - 5: Mùa khô thích hợp trải nghiệm đi rừng Cát Tiên.",
    diemDen: "• Vườn quốc gia Cát Tiên ngắm thú đêm.\n• Hồ Trị An & Đảo Ó cắm trại.\n• Khu du lịch Bửu Long (Hạ Long thu nhỏ).",
    dacSan: "• Cá lăng sông Đồng Nai nấu lá giang.\n• Gỏi bưởi Tân Triều & Lẩu khổ qua rừng.",
    chiPhi: "400.000đ - 1.000.000đ / ngày"
  },
  "tay ninh": {
    ten: "Tỉnh Tây Ninh",
    subRegion: "dong_nam_bo", mien: "nam",
    anh: "https://images.unsplash.com/photo-1565008447742-97f6f38c985c?w=1000",
    moTa: "Nóc nhà Nam Bộ 'Núi Bà Đen' cao 986m săn mây tuyệt đẹp, kiến trúc Tòa Thánh Tây Ninh độc đáo và không gian Hồ Dầu Tiếng rộng lớn.",
    thoiDiem: "• Tháng 1 - 3 âm lịch: Mùa hội xuân Núi Bà Đen linh thiêng.",
    diemDen: "• Quần thể Cáp treo Núi Bà Đen đi ngắm tượng Phật Bà.\n• Tòa Thánh Tây Ninh kiến trúc Đạo Cao Đài.\n• Hồ Dầu Tiếng & Ma Thiên Lãnh.",
    dacSan: "• Bánh tráng phơi sương Trảng Bàng cuốn thịt luộc.\n• Muối tôm Tây Ninh trứ danh & Bánh canh Trảng Bàng.",
    chiPhi: "500.000đ - 1.100.000đ / ngày"
  },
  "an giang": {
    ten: "Tỉnh An Giang",
    subRegion: "tay_nam_bo", mien: "nam",
    anh: "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=1000",
    moTa: "Rừng tràm Trà Sư xanh mướt bèo tấm, vùng đất Thất Sơn huyền bí và trung tâm tâm linh Miếu Bà Chúa Xứ Núi Sam nức tiếng.",
    thoiDiem: "• Tháng 9 - 11: Mùa nước nổi rừng tràm Trà Sư đẹp nhất.",
    diemDen: "• Rừng tràm Trà Sư đi xuồng ba lá.\n• Miếu Bà Chúa Xứ Núi Sam Châu Đốc.\n• Núi Cấm (Cấm Sơn) & Hồ Tà Pạ.",
    dacSan: "• Lẩu mắm Châu Đốc & Các loại mắm cá.\n• Bánh bò thốt nốt béo ngậy & Gà đốt Ô Thum.",
    chiPhi: "500.000đ - 1.200.000đ / ngày"
  },
  "bac lieu": {
    ten: "Tỉnh Bạc Liêu",
    subRegion: "tay_nam_bo", mien: "nam",
    anh: "https://images.unsplash.com/photo-1466611653911-95081537e5b7?w=1000",
    moTa: "Gắn liền với giai thoại Công tử Bạc Liêu, nhạc sĩ Cao Văn Lầu và Cánh đồng quạt gió ven biển cực Chill thu hút giới trẻ check-in.",
    thoiDiem: "• Quanh năm, tiết trời nắng ấm chan hòa.",
    diemDen: "• Nhà Công tử Bạc Liêu cổ kính.\n• Cánh đồng điện gió Bạc Liêu.\n• Chùa Xiêm Cán kiến trúc Khmer & Khu lưu niệm Cao Văn Lầu.",
    dacSan: "• Bánh tằm nước cốt dừa Bạc Liêu.\n• Lẩu mắm & Bún nước lèo Bạc Liêu.",
    chiPhi: "450.000đ - 1.000.000đ / ngày"
  },
  "ben tre": {
    ten: "Tỉnh Bến Tre",
    subRegion: "tay_nam_bo", mien: "nam",
    anh: "https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=1000",
    moTa: "Xứ sở Dừa xanh rợp bóng mát, mang đậm chất sinh thái miệt vườn với trải nghiệm chèo xuồng rạch dừa nước róc rách.",
    thoiDiem: "• Tháng 6 - 8: Mùa trái cây miệt vườn xum xuê.",
    diemDen: "• Cồn Phụng, Cồn Quy.\n• Vườn trái cây Cái Mơn Chợ Lách.\n• Khu du lịch Lan Vương dã ngoại.",
    dacSan: "• Kẹo dừa Bến Tre dẻo béo thơm.\n• Cơm hấp trái dừa & Đuông dừa tắm nước mắm.",
    chiPhi: "400.000đ - 900.000đ / ngày"
  },
  "ca mau": {
    ten: "Tỉnh Cà Mau",
    subRegion: "tay_nam_bo", mien: "nam",
    anh: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1000",
    moTa: "Mảnh đất Đất Mũi tận cùng cực Nam Tổ quốc, nơi có mốc tọa độ GPS 0001 giữa bạt ngàn rừng đước, rừng tràm U Minh Hạ.",
    thoiDiem: "• Tháng 12 - 4: Mùa khô di chuyển đường sông nước thuận lợi.",
    diemDen: "• Mũi Cà Mau & Cột cờ Hà Nội tại Đất Mũi.\n• Vườn quốc gia U Minh Hạ.\n• Hòn Đá Bạc & Đầm Thị Tường.",
    dacSan: "• Cua Cà Mau chắc thịt gạch son.\n• Cá thòi lòi nướng muối ớt & Mắm ba khía Rạch Gốc.",
    chiPhi: "600.000đ - 1.300.000đ / ngày"
  },
  "dong thap": {
    ten: "Tỉnh Đồng Tháp",
    subRegion: "tay_nam_bo", mien: "nam",
    anh: "https://images.unsplash.com/photo-1508873696983-2df515122519?w=1000",
    moTa: "Đất Sen Hồng rực rỡ với Làng hoa Sa Đéc hàng trăm năm tuổi ngát hương, Khu sinh thái Xẻo Quýt và Đồng sen Tháp Mười.",
    thoiDiem: "• Tháng 12: Mùa hoa Sa Đéc nở rực rỡ nhất chuẩn bị đón Tết.\n• Tháng 9 - 11: Mùa nước nổi ngắm hoa sen.",
    diemDen: "• Làng hoa kiểng Sa Đéc.\n• Khu du lịch sinh thái Xẻo Quýt & Vườn quốc gia Tràm Chim.\n• Đồng sen Tháp Mười.",
    dacSan: "• Hủ tiếu Sa Đéc dai ngọt nước dùng.\n• Nem Lai Vung chua ngọt & Các món chế biến từ Sen.",
    chiPhi: "450.000đ - 1.000.000đ / ngày"
  },
  "hau giang": {
    ten: "Tỉnh Hậu Giang",
    subRegion: "tay_nam_bo", mien: "nam",
    anh: "https://images.unsplash.com/photo-1511556532299-8f662fc26c06?w=1000",
    moTa: "Mảnh đất sông nước êm đềm nổi tiếng với Lung Ngọc Hoàng - 'lá phổi xanh' Miền Tây cùng đặc sản Khóm Cầu Đúc.",
    thoiDiem: "• Tháng 9 - 11: Mùa nước nổi sinh thái xanh thanh bình.",
    diemDen: "• Khu bảo tồn thiên nhiên Lung Ngọc Hoàng.\n• Chợ nổi Ngã Bảy (Phụng Hiệp).\n• Công viên Giải trí Kittydangoo.",
    dacSan: "• Chả cá thát lát Hậu Giang dai ngon.\n• Khóm Cầu Đúc ngọt lịm & Lẩu mắm.",
    chiPhi: "400.000đ - 900.000đ / ngày"
  },
  "kien giang": {
    ten: "Tỉnh Kiên Giang (Phú Quốc)",
    subRegion: "tay_nam_bo", mien: "nam",
    anh: "https://images.unsplash.com/photo-1540206395-68808572332f?w=1000",
    moTa: "Đảo Ngọc Phú Quốc - Thiên đường nghỉ dưỡng biển đảo tầm cỡ quốc tế với bãi cát trắng mịn, nước biển trong suốt và chuỗi siêu quần thể giải trí.",
    thoiDiem: "• Tháng 11 - 4: Mùa khô Phú Quốc biển sóng êm, nắng đẹp rực rỡ.",
    diemDen: "• Bãi Sao, Bãi Kem, Bãi Dài.\n• Grand World, VinWonders, Safari Phú Quốc.\n• Thị trấn Hoàng Hôn Sunset Town & Cáp treo Hòn Thơm vượt biển dài nhất.",
    dacSan: "• Gỏi cá trích Phú Quốc.\n• Bún quậy Kiến Xây & Rượu sim rừng, Nước mắm Phú Quốc.",
    chiPhi: "1.200.000đ - 3.800.000đ / ngày"
  },
  "long an": {
    ten: "Tỉnh Long An",
    subRegion: "tay_nam_bo", mien: "nam",
    anh: "https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?w=1000",
    moTa: "Cửa ngõ kết nối TP.HCM với Miền Tây sông nước sở hữu Làng nổi Tân Lập rợp bóng rừng tràm ngút ngàn tuyệt đẹp.",
    thoiDiem: "• Tháng 9 - 11: Mùa nước nổi đi thuyền xuyên rừng tràm Tân Lập.",
    diemDen: "• Khu du lịch sinh thái Làng nổi Tân Lập.\n• Làng cổ Phước Lộc Thọ.\n• Công viên Bến Lức & Cánh đồng thuốc Đồng Tháp Mười.",
    dacSan: "• Lạp xưởng tươi Long An.\n• Bánh tét Long An & Thanh long Châu Thành.",
    chiPhi: "350.000đ - 800.000đ / ngày"
  },
  "soc trang": {
    ten: "Tỉnh Sóc Trăng",
    subRegion: "tay_nam_bo", mien: "nam",
    anh: "https://images.unsplash.com/photo-1548013146-72479768bbaa?w=1000",
    moTa: "Xứ sở giao thoa văn hóa Kinh - Khmer - Hoa với những ngôi chùa Khmer kiến trúc dát vàng nguy nga lộng lẫy và lễ hội Đua ghe Ngo náo nhiệt.",
    thoiDiem: "• Tháng 10 - 11 âm lịch: Lễ hội Ok Om Bok & Đua ghe Ngo.",
    diemDen: "• Chùa Dơi (Chùa Mahatup).\n• Chùa Chén Kiểu (Chùa Sà Lôn).\n• Chùa Som Rong dát vàng hoành tráng & Cồn Mỹ Phước.",
    dacSan: "• Bánh pía Sóc Trăng dẻo thơm sầu riêng trứng muối.\n• Bún nước lèo Sóc Trăng & Bánh cống.",
    chiPhi: "400.000đ - 900.000đ / ngày"
  },
  "tien giang": {
    ten: "Tỉnh Tiền Giang",
    subRegion: "tay_nam_bo", mien: "nam",
    anh: "https://images.unsplash.com/photo-1526772662000-3f88f10405ff?w=1000",
    moTa: "Vùng đất miệt vườn trù phú ven Sông Tiền nổi tiếng với Cù lao Thới Sơn, Chùa Vĩnh Tràng kiến trúc lai Âu - Á và chợ nổi Cái Bè.",
    thoiDiem: "• Tháng 5 - 8: Mùa trái cây miệt vườn chín rộ ngọt lịm.",
    diemDen: "• Cù lao Thới Sơn (Lội mương bắt cá, nghe đàn ca tài tử).\n• Chùa Vĩnh Tràng cổ kính.\n• Chợ nổi Cái Bè & Biển Tân Thành.",
    dacSan: "• Hủ tiếu Mỹ Tho đậm đà.\n• Vú sữa Lò Rèn Vĩnh Kim & Bánh vá Chợ Gạo.",
    chiPhi: "400.000đ - 950.000đ / ngày"
  },
  "tra vinh": {
    ten: "Tỉnh Trà Vinh",
    subRegion: "tay_nam_bo", mien: "nam",
    anh: "https://images.unsplash.com/photo-1516483638261-f4dbaf036963?w=1000",
    moTa: "Thành phố rợp bóng cây cổ thụ trăm năm tuổi, danh thắng Ao Bà Om mát rượi và nền văn hóa Khmer đậm đà bản sắc.",
    thoiDiem: "• Tháng 4 (Tết Chôl Chnăm Thmây) hoặc Tháng 10 âm lịch (Lễ Ok Om Bok).",
    diemDen: "• Danh thắng Ao Bà Om rợp bóng cây cổ thụ.\n• Chùa Hang (Chùa Kom Pong Chray).\n• Biển Ba Động & Cù lao Long Trị.",
    dacSan: "• Dừa sáp Cầu Kè béo ngậy đặc sản hiếm có.\n• Bún nước lèo Trà Vinh & Bánh tét Trà Cuôn.",
    chiPhi: "400.000đ - 900.000đ / ngày"
  },
  "vinh long": {
    ten: "Tỉnh Vĩnh Long",
    subRegion: "tay_nam_bo", mien: "nam",
    anh: "https://images.unsplash.com/photo-1528164344705-47542687990d?w=1000",
    moTa: "Nổi tiếng với Vương quốc gạch gốm đỏ Mang Thít trăm năm bên dòng sông cổ kính và thiên đường miệt vườn Cù lao An Bình.",
    thoiDiem: "• Tháng 5 - 8: Mùa thu hoạch trái cây chôm chôm, nhãn tại Cù lao An Bình.",
    diemDen: "• Làng gốm đỏ Mang Thít (Di sản đương đại).\n• Cù lao An Bình ghé vườn trái cây.\n• Chùa Tiên Châu cổ kính.",
    dacSan: "• Cá tai tượng chiên xù xối mỡ giòn tan.\n• Bưởi Năm Roi Mỹ Hòa & Khoai lang Bình Tân.",
    chiPhi: "400.000đ - 950.000đ / ngày"
  }
};

// =========================================================================
// 4. DIALOGFLOW WEBHOOK ROUTER THÔNG MINH
// =========================================================================

app.post('/', (req, res) => {
  const queryResult = req.body.queryResult || {};
  const rawQuery = queryResult.queryText || '';
  const queryNorm = loaiBoDau(rawQuery);

  const intentAnalysis = detectUserIntent(queryNorm);

  // 4.1 Menu / Reset / Chào hỏi
  if (/\b(menu|bat dau|reset|quay lai|xin chao|hi|hello)\b/.test(queryNorm)) {
    return res.json({
      fulfillmentMessages: [
        {
          text: {
            text: [
              `[🧠 AI Reasoning]: Intent=WELCOME | Confidence=1.00\n\n` +
              `🌟 **XIN CHÀO! EM LÀ BOT DU LỊCH VIỆT NAM THÔNG MINH** 🌟\n\n` +
              `Em đã sẵn sàng hỗ trợ bạn khám phá trọn bộ **63 Tỉnh Thành** dọc 3 miền Bắc - Trung - Nam với đầy đủ lịch trình, hình ảnh và đặc sản bách khoa toàn thư!\n\n` +
              `👉 Vui lòng chọn Vùng miền hoặc Nhu cầu gợi ý bên dưới:`
            ]
          }
        },
        {
          quickReplies: {
            title: "👇 Chọn vùng miền hoặc chủ đề:",
            quickReplies: [
              "Miền Bắc",
              "Miền Trung",
              "Miền Nam",
              "Gợi ý Phượt Mạo Hiểm",
              "Gợi ý Nghỉ Dưỡng Biển",
              "Gợi ý Foodtour Ẩm Thực"
            ]
          }
        }
      ]
    });
  }

  // 4.2 Xử lý Nút Gợi Ý Chủ Đề Chuyên Sâu
  if (queryNorm.includes("phuot") || queryNorm.includes("mao hiem")) {
    return res.json({
      fulfillmentMessages: [
        {
          text: {
            text: [
              `[🧠 AI Reasoning]: Intent=RECOMMEND_ADVENTURE | Confidence=0.98\n\n` +
              `🏍️ **TOP ĐỊA DIỂM PHƯỢT & KHÁM PHÁ MẠO HIỂM BẬC NHẤT:**\n\n` +
              `1. **Hà Giang:** Chinh phục đèo Mã Pí Lèng & Hẻm Tu Sản.\n` +
              `2. **Quảng Bình:** Thám hiểm hệ thống hang động Phong Nha - Kẻ Bàng.\n` +
              `3. **Sơn La (Tà Xùa):** Săn mây cuồn cuộn trên sống lưng khủng long.\n` +
              `4. **Yên Bái (Mù Cang Chải):** Nhảy dù lượn ngắm ruộng bậc thang lúa chín.\n\n` +
              `👇 Chọn tỉnh thành bên dưới để xem chi tiết:`
            ]
          }
        },
        {
          quickReplies: {
            title: "👇 Chọn tỉnh phượt:",
            quickReplies: ["Hà Giang", "Quảng Bình", "Sơn La", "Yên Bái", "Cao Bằng", "Menu Chính"]
          }
        }
      ]
    });
  }

  if (queryNorm.includes("nghi duong") || queryNorm.includes("bien")) {
    return res.json({
      fulfillmentMessages: [
        {
          text: {
            text: [
              `[🧠 AI Reasoning]: Intent=RECOMMEND_RESORT | Confidence=0.98\n\n` +
              `🏖️ **TOP THIÊN ĐƯỜNG NGHỈ DƯỠNG & BIỂN ĐẢO HÀNG ĐẦU:**\n\n` +
              `1. **Kiên Giang (Phú Quốc):** Đảo Ngọc biển xanh trong suốt.\n` +
              `2. **Đà Nẵng:** Bãi biển Mỹ Khê & Bà Nà Hills.\n` +
              `3. **Khánh Hòa (Nha Trang):** Vịnh biển thiên đường giải trí.\n` +
              `4. **Lâm Đồng (Đà Lạt):** Thành phố ngàn hoa se lạnh mộng mơ.\n\n` +
              `👇 Chọn tỉnh thành bên dưới để xem chi tiết:`
            ]
          }
        },
        {
          quickReplies: {
            title: "👇 Chọn tỉnh nghỉ dưỡng:",
            quickReplies: ["Kiên Giang", "Đà Nẵng", "Khánh Hòa", "Lâm Đồng", "Bình Định", "Menu Chính"]
          }
        }
      ]
    });
  }

  if (queryNorm.includes("foodtour") || queryNorm.includes("am thuc")) {
    return res.json({
      fulfillmentMessages: [
        {
          text: {
            text: [
              `[🧠 AI Reasoning]: Intent=RECOMMEND_FOODTOUR | Confidence=0.98\n\n` +
              `🍲 **TOP THIÊN ĐƯỜNG FOODTOUR ẨM THỰC NỨC TIẾNG:**\n\n` +
              `1. **Hải Phòng:** Bánh đa cua, Bánh mì que, Dừa dầm.\n` +
              `2. **Hà Nội:** Phở, Bún chả, Cà phê trứng Phố Cổ.\n` +
              `3. **Thừa Thiên Huế:** Bún bò Huế, Bánh bèo, Bánh lọc, Cơm hến.\n` +
              `4. **TP. Hồ Chí Minh:** Cơm tấm, Hủ tiếu, Phá lấu.\n\n` +
              `👇 Chọn tỉnh thành bên dưới để xem chi tiết:`
            ]
          }
        },
        {
          quickReplies: {
            title: "👇 Chọn thành phố ẩm thực:",
            quickReplies: ["Hải Phòng", "Hà Nội", "Thừa Thiên Huế", "TP. Hồ Chí Minh", "Cần Thơ", "Menu Chính"]
          }
        }
      ]
    });
  }

  // 4.3 Phân chia vùng miền lớn sang tiểu vùng
  if (queryNorm.includes("mien bac")) {
    return res.json({
      fulfillmentMessages: [
        {
          text: {
            text: [
              `[🧠 AI Reasoning]: Intent=SELECT_REGION | Region=BẮC | Confidence=0.99\n\n` +
              `🗺️ **DANH SÁCH KHU VỰC MIỀN BẮC (25 TỈNH THÀNH)**\n\n` +
              `Do số lượng tỉnh lớn, vui lòng chọn Tiểu Vùng để hiển thị danh sách nút bấm đầy đủ:`
            ]
          }
        },
        {
          quickReplies: {
            title: "👇 Chọn tiểu vùng Miền Bắc:",
            quickReplies: [
              "Tây Bắc (6 tỉnh)",
              "Đông Bắc (9 tỉnh)",
              "Đồng Bằng Sông Hồng (10 tỉnh)",
              "Menu Chính"
            ]
          }
        }
      ]
    });
  }

  if (queryNorm.includes("mien trung")) {
    return res.json({
      fulfillmentMessages: [
        {
          text: {
            text: [
              `[🧠 AI Reasoning]: Intent=SELECT_REGION | Region=TRUNG | Confidence=0.99\n\n` +
              `🗺️ **DANH SÁCH KHU VỰC MIỀN TRUNG & TÂY NGUYÊN (19 TỈNH THÀNH)**\n\n` +
              `Vui lòng chọn Tiểu Vùng bên dưới:`
            ]
          }
        },
        {
          quickReplies: {
            title: "👇 Chọn tiểu vùng Miền Trung:",
            quickReplies: [
              "Bắc Trung Bộ (6 tỉnh)",
              "Nam Trung Bộ (8 tỉnh)",
              "Tây Nguyên (5 tỉnh)",
              "Menu Chính"
            ]
          }
        }
      ]
    });
  }

  if (queryNorm.includes("mien nam")) {
    return res.json({
      fulfillmentMessages: [
        {
          text: {
            text: [
              `[🧠 AI Reasoning]: Intent=SELECT_REGION | Region=NAM | Confidence=0.99\n\n` +
              `🗺️ **DANH SÁCH KHU VỰC MIỀN NAM (19 TỈNH THÀNH)**\n\n` +
              `Vui lòng chọn Tiểu Vùng bên dưới:`
            ]
          }
        },
        {
          quickReplies: {
            title: "👇 Chọn tiểu vùng Miền Nam:",
            quickReplies: [
              "Đông Nam Bộ (6 tỉnh)",
              "Tây Nam Bộ / Miền Tây (13 tỉnh)",
              "Menu Chính"
            ]
          }
        }
      ]
    });
  }

  // Xử lý tiểu vùng -> Xuất nút bấm từng tỉnh
  for (const subKey in danhSachSubRegions) {
    if (queryNorm.includes(subKey.replace(/_/g, ' ')) || queryNorm.includes(subKey)) {
      const provinceList = danhSachSubRegions[subKey];
      return res.json({
        fulfillmentMessages: [
          {
            text: {
              text: [
                `[🧠 AI Reasoning]: Intent=SUBREGION_PROVINCES | SubKey=${subKey.toUpperCase()}\n\n` +
                `📍 **DANH SÁCH CÁC TỈNH THÀNH VÙNG ${subKey.toUpperCase().replace(/_/g, ' ')} (${provinceList.length} TỈNH):**\n\n` +
                `Bấm vào nút bấm tỉnh bạn muốn khám phá bên dưới:`
              ]
            }
          },
          {
            quickReplies: {
              title: "👇 Chọn Tỉnh Thành:",
              quickReplies: [...provinceList, "Menu Chính"]
            }
          }
        ]
      });
    }
  }

  // 4.4 Tìm kiếm Tỉnh/Thành chính xác hoặc Fuzzy Match (Đoán từ)
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

    const distance = levenshteinDistance(queryNorm, keyNorm);
    const similarity = 1 - (distance / Math.max(queryNorm.length, keyNorm.length));
    if (similarity > highestScore && similarity >= 0.55) {
      highestScore = similarity;
      matchedProvinceKey = key;
    }
  }

  // TRẢ VỀ THÔNG TIN TỈNH CHI TIẾT VÀ TRÌNH BÀY TÁCH DÒNG ĐẸP MẮT
  if (matchedProvinceKey) {
    const province = duLieu63TinhThanh[matchedProvinceKey];
    return res.json({
      fulfillmentMessages: [
        {
          text: {
            text: [
              `[🧠 AI Reasoning]: MatchedProvince='${province.ten}' | Score=${highestScore.toFixed(2)} | Intent=${intentAnalysis.intent}\n\n` +
              `📍 **CẨM NANG DU LỊCH BÁCH KHOA: ${province.ten.toUpperCase()}**\n\n` +
              `✨ **Giới thiệu:**\n${province.moTa}\n\n` +
              `🗓️ **Thời điểm lý tưởng:**\n${province.thoiDiem}\n\n` +
              `🏛️ **Địa điểm tham quan nổi bật:**\n${province.diemDen}\n\n` +
              `🍲 **Ẩm thực đặc sản trứ danh:**\n${province.dacSan}\n\n` +
              `💰 **Dự toán chi phí tham khảo:** ${province.chiPhi}`
            ]
          }
        },
        {
          image: {
            imageUri: province.anh,
            accessibilityText: `Ảnh phong cảnh ${province.ten}`
          }
        },
        {
          quickReplies: {
            title: "👇 Bạn muốn làm gì tiếp theo?",
            quickReplies: [
              "Gợi ý Phượt Mạo Hiểm",
              "Gợi ý Nghỉ Dưỡng Biển",
              "Gợi ý Foodtour Ẩm Thực",
              "Menu Chính"
            ]
          }
        }
      ]
    });
  }

  // 4.5 FALLBACK THÔNG MINH KÈM NÚT GỢI Ý
  let closestGuesses = [];
  for (const key in duLieu63TinhThanh) {
    const dist = levenshteinDistance(queryNorm, loaiBoDau(duLieu63TinhThanh[key].ten));
    if (dist <= 4) {
      closestGuesses.push(duLieu63TinhThanh[key].ten);
    }
  }
  if (closestGuesses.length === 0) {
    closestGuesses = ["Hà Giang", "Đà Nẵng", "Phú Quốc", "Đà Lạt"];
  }

  return res.json({
    fulfillmentMessages: [
      {
        text: {
          text: [
            `[🧠 AI Reasoning]: Intent=FALLBACK | Confidence=0.20 | SuggestionEngine=Active\n\n` +
            `💡 **Ối! Câu hỏi này em chưa kịp cập nhật hoặc chưa hiểu rõ.**\n\n` +
            `Có phải bạn đang quan tâm đến một trong những địa danh nổi tiếng dưới đây không? Vui lòng bấm chọn gợi ý nhanh nhé:`
          ]
        }
      },
      {
        quickReplies: {
          title: "👇 Bấm chọn nhanh gợi ý:",
          quickReplies: [...closestGuesses.slice(0, 3), "Miền Bắc", "Miền Trung", "Miền Nam"]
        }
      }
    ]
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 [FULL 63 PROVINCES ENCYCLOPEDIA WEBHOOK SERVER READY] Port ${PORT}`);
});
