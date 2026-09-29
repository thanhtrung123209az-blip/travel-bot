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
  if (/\b(lich trinh|3n2d|3 ngay 2 dem|di dau choi gi|goi y chuyen di)\b/.test(queryNorm)) return { intent: 'ASK_ITINERARY', confidence: 0.95 };
  if (/\b(goi y|tu van|dieu gi hay|nen di dau)\b/.test(queryNorm)) return { intent: 'RECOMMEND', confidence: 0.88 };
  return { intent: 'GENERAL', confidence: 0.70 };
}

// =========================================================================
// 2. PHÂN CHIA TIỂU VÙNG ĐỂ CHỨA ĐỦ NÚT BẤM CỦA 63 TỈNH THÀNH
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

const subRegionKeywords = {
  "tay_bac": ["tay bac"],
  "dong_bac": ["dong bac"],
  "dong_bang_sh": ["dong bang song hong", "dong bang sh"],
  "bac_trung_bo": ["bac trung bo"],
  "nam_trung_bo": ["nam trung bo"],
  "tay_nguyen": ["tay nguyen"],
  "dong_nam_bo": ["dong nam bo"],
  "tay_nam_bo": ["tay nam bo", "mien tay"]
};

// =========================================================================
// 3. DATABASE BÁCH KHOA TOÀN THƯ DU LỊCH CHUẨN ĐỦ 63 TỈNH THÀNH VIỆT NAM
// =========================================================================

const duLieu63TinhThanh = {
  // --- MIỀN BẮC (25 TỈNH THÀNH) ---
  "ha noi": {
    ten: "Thủ đô Hà Nội",
    aliases: ["ha noi", "hanoi", "thu do", "ha noi city"],
    subRegion: "dong_bang_sh", mien: "bac",
    anh: "https://images.unsplash.com/photo-1509030450996-93f2e3d84298?w=1000",
    moTa: "Thủ đô ngàn năm văn hiến, trung tâm văn hóa - lịch sử lâu đời của Việt Nam. Nơi đây sở hữu 36 phố phường rêu phong, kiến trúc Pháp cổ tráng lệ cùng nền ẩm thực tinh tế bậc nhất.",
    thoiDiem: "• Tháng 9 - 11: Mùa thu Hà Nội ngợp nắng vàng, gió heo mây và hương hoa sữa nồng nàn.\n• Tháng 3: Mùa hoa sưa, hoa ban nở rực rỡ khắp góc phố.",
    diemDen: "• Hồ Hoàn Kiếm & Đền Ngọc Sơn: Trái tim lịch sử thủ đô.\n• Văn Miếu Quốc Tử Giám: Trường đại học đầu tiên của Việt Nam.\n• Hoàng Thành Thăng Long & Lăng Chủ Tịch Hồ Chí Minh.\n• Phố cổ Hà Nội & Phố đường tàu.",
    hoatDong: "• Ngồi xe xích lô dạo 36 phố phường.\n• Thưởng thức cà phê trứng tại phố cổ.\n• Săn ảnh hoàng hôn tuyệt đẹp trên Hồ Tây.",
    dacSan: "• Phở Hà Nội (Phở Thìn, Phở Bát Đàn) chuẩn vị nước dùng thanh ngọt.\n• Bún chả Hàng Mành, Bún thang Phố Cổ, Chả cá Lăng Vọng.\n• Cà phê trứng Giảng & Bánh cốm Hàng Than.",
    chiPhi: "800.000đ - 1.800.000đ / ngày",
    lichTrinh: "Ngày 1: Lăng Bác - Văn Miếu - Hồ Tây.\nNgày 2: Phố Cổ - Hồ Hoàn Kiếm - Xem múa rối nước.\nNgày 3: Hoàng Thành Thăng Long - Shopping Chợ Đồng Xuân."
  },
  "ha giang": {
    ten: "Tỉnh Hà Giang",
    aliases: ["ha giang", "dong van", "ma pi leng", "meo vac", "quan ba", "yen minh", "nho que"],
    subRegion: "tay_bac", mien: "bac",
    anh: "https://images.unsplash.com/photo-1528127269322-539801943592?w=1000",
    moTa: "Mảnh đất địa đầu cực Bắc Tổ quốc nổi tiếng với Công viên địa chất toàn cầu Cao nguyên đá Đồng Văn, những con đèo hiểm trở và mùa hoa tam giác mạch lãng mạn.",
    thoiDiem: "• Tháng 9 - 10: Mùa lúa chín vàng óng trên ruộng bậc thang Hoàng Su Phì.\n• Tháng 10 - 12: Mùa hoa tam giác mạch phủ hồng khắp sườn núi.",
    diemDen: "• Đèo Mã Pí Lèng: Một trong 'Tứ đại đỉnh đèo' hùng vĩ nhất.\n• Sông Nho Quế & Hẻm Tu Sản: Đi thuyền ngắm hẻm vực sâu nhất Đông Nam Á.\n• Cột cờ Lũng Cú, Dinh thự họ Vương & Phố cổ Đồng Văn.",
    hoatDong: "• Chạy xe máy phượt cung đường hạnh phúc.\n• Đi thuyền SUP/thuyền máy rẽ sóng sông Nho Quế.\n• Trải nghiệm chợ phiên vùng cao rực rỡ sắc màu.",
    dacSan: "• Bánh cuốn canh Đồng Văn thơm phức.\n• Cháo tẩu tẩu giải cảm đắng nhẹ thanh mát.\n• Thịt trâu gác bếp & Rượu ngô men lá.",
    chiPhi: "1.000.000đ - 2.200.000đ / ngày",
    lichTrinh: "Ngày 1: TP Hà Giang - Quản Bạ - Yên Minh.\nNgày 2: Cột cờ Lũng Cú - Đồng Văn - Đèo Mã Pí Lèng.\nNgày 3: Sông Nho Quế - Mèo Vạc - Trở về TP Hà Giang."
  },
  "lao cai": {
    ten: "Tỉnh Lào Cai (Sa Pa)",
    aliases: ["lao cai", "sa pa", "sapa", "fansipan", "cat cat", "ta van", "o quy ho"],
    subRegion: "tay_bac", mien: "bac",
    anh: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1000",
    moTa: "Thị trấn sương mờ Sa Pa nổi tiếng sở hữu đỉnh Fansipan hùng vĩ, thung lũng Mường Hoa xinh đẹp cùng bản sắc văn hóa đặc sắc của đồng bào H'Mông, Dao đỏ.",
    thoiDiem: "• Tháng 9 - 10: Mùa lúa chín vàng ươm thung lũng.\n• Tháng 12 - 1: Săn tuyết rơi và băng giá rực rỡ trên đỉnh núi cao.",
    diemDen: "• Đỉnh Fansipan: Nóc nhà Đông Dương cao 3.143m.\n• Bản Cát Cát, Bản Tả Van, Tả Phìn.\n• Đèo Ô Quy Hồ & Thung lũng Mường Hoa.",
    hoatDong: "• Đi cáp treo chinh phục đỉnh Fansipan.\n• Trekking qua các bản làng thơ mộng.\n• Tắm lá thuốc người Dao đỏ thư giãn.",
    dacSan: "• Lẩu cá hồi, cá tầm tươi ngon Sa Pa.\n• Thắng cố Mường Khương & Thịt lợn cắp nách nướng nguyên con.",
    chiPhi: "900.000đ - 2.500.000đ / ngày",
    lichTrinh: "Ngày 1: Check-in Sa Pa - Bản Cát Cát.\nNgày 2: Chinh phục Fansipan - Đèo Ô Quy Hồ ngắm hoàng hôn.\nNgày 3: Thung lũng Mường Hoa - Mua sắm đặc sản."
  },
  "quang ninh": {
    ten: "Tỉnh Quảng Ninh",
    aliases: ["quang ninh", "ha long", "halong", "co to", "quan lan", "bai chay", "yen tu"],
    subRegion: "dong_bac", mien: "bac",
    anh: "https://images.unsplash.com/photo-1552353617-3bfd679b3bdd?w=1000",
    moTa: "Thủ phủ du lịch biển đảo miền Bắc, sở hữu Vịnh Hạ Long - Kỳ quan thiên nhiên thế giới cùng quần thể danh thắng tâm linh Yên Tử thiêng liêng.",
    thoiDiem: "• Tháng 4 - 8: Nắng đẹp lý tưởng để du thuyền, tắm biển và chèo thuyền Kayak.\n• Tháng 9 - 11: Mùa thu yên bình đi nghỉ dưỡng và tâm linh.",
    diemDen: "• Vịnh Hạ Long & Vịnh Bái Tử Long kỳ ảo.\n• Danh thắng Yên Tử: Đất tổ Phật giáo Trúc Lâm.\n• Đảo Cô Tô, Quan Lạn & Phố cổ Bãi Cháy.",
    hoatDong: "• Ngủ đêm trên du thuyền 5 sao Vịnh Hạ Long.\n• Chèo thuyền Kayak qua các hang động đá vôi.\n• Trải nghiệm công viên giải trí Sun World Bãi Cháy.",
    dacSan: "• Chả mực giã tay Hạ Long giòn sần sật.\n• Cà sáy Tiên Yên & Sam biển nướng mỡ hành.",
    chiPhi: "1.200.000đ - 3.500.000đ / ngày",
    lichTrinh: "Ngày 1: Hà Nội - Hạ Long - Vui chơi Bãi Cháy.\nNgày 2: Tour du thuyền thăm Vịnh Hạ Long - Kayak.\nNgày 3: Mua sắm chả mực - Trở về."
  },
  "ninh binh": {
    ten: "Tỉnh Ninh Bình",
    aliases: ["ninh binh", "trang an", "bai dinh", "tam coc", "hang mua", "hoa lu"],
    subRegion: "dong_bang_sh", mien: "bac",
    anh: "https://images.unsplash.com/photo-1599707303381-807c42749419?w=1000",
    moTa: "Cố đô Hoa Lư lịch sử sở hữu Quần thể danh thắng Tràng An - Di sản văn hóa và thiên nhiên thế giới kép duy nhất tại Đông Nam Á với cảnh quan sơn thủy hữu tình.",
    thoiDiem: "• Tháng 1 - 3: Mùa lễ hội Xuân thanh bình.\n• Tháng 5 - 6: Mùa lúa chín vàng rực hai bên dòng sông Ngô Đồng (Tam Cốc).",
    diemDen: "• Quần thể danh thắng Tràng An & Tam Cốc - Bích Động.\n• Hang Múa: Leo 500 bậc đá ngắm trọn thung lũng.\n• Chùa Bái Đính & Cố đô Hoa Lư.",
    hoatDong: "• Đi thuyền chèo tay khám phá hang động Tràng An.\n• Leo núi Hang Múa check-in ngọn tháp đầm sen.\n• Đạp xe dạo quanh cánh đồng lúa Tam Cốc.",
    dacSan: "• Thịt dê núi Ninh Bình tái chanh, nướng sả.\n• Cơm cháy chà bông giòn tan sốt thịt bò.",
    chiPhi: "700.000đ - 1.500.000đ / ngày",
    lichTrinh: "Ngày 1: Bái Đính - Tràng An.\nNgày 2: Hang Múa - Tam Cốc Bích Động.\nNgày 3: Tuyệt Tình Cốc - Cố đô Hoa Lư."
  },
  "cao bang": {
    ten: "Tỉnh Cao Bằng",
    subRegion: "dong_bac", mien: "bac",
    aliases: ["cao bang", "ban gioc", "pac bo", "nguom ngao"],
    anh: "https://images.unsplash.com/photo-1628155930542-3c7a64e2c833?w=1000",
    moTa: "Vùng đất biên cương phía Bắc nổi tiếng với Thác Bản Giốc - thác nước tự nhiên trên đường biên giới lớn nhất Đông Nam Á cùng suối Lê Nin xanh ngọc bích.",
    thoiDiem: "• Tháng 8 - 10: Mùa nước đổ xanh trong và lúa chín vàng dưới chân thác.",
    diemDen: "• Thác Bản Giốc hùng vĩ.\n• Động Ngườm Ngao: Hang động thạch nhũ kỳ vĩ.\n• Khu di tích Pắc Bó & Suối Lê Nin.",
    hoatDong: "• Đi bè bambu tiếp cận chân thác Bản Giốc.\n• Khám phá mê cung thạch nhũ Động Ngườm Ngao.\n• Thưởng thức ẩm thực dân tộc Tày, Nùng.",
    dacSan: "• Bánh cuốn Cao Bằng ăn kèm nước canh xương.\n• Vịt quay 7 vị & Phở chua Cao Bằng.",
    chiPhi: "700.000đ - 1.600.000đ / ngày",
    lichTrinh: "Ngày 1: TP Cao Bằng - Pắc Bó - Suối Lê Nin.\nNgày 2: Thác Bản Giốc - Động Ngườm Ngao.\nNgày 3: Mua sắm đặc sản bánh khảo - Trở về."
  },
  "dien bien": {
    ten: "Tỉnh Điện Biên",
    subRegion: "tay_bac", mien: "bac",
    aliases: ["dien bien", "dien bien phu", "a pa chai"],
    anh: "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=1000",
    moTa: "Mảnh đất lịch sử lừng lẫy với Chiến thắng Điện Biên Phủ, nơi hội tụ cảnh quan Tây Bắc hoang sơ và sắc hoa ban rực rỡ.",
    thoiDiem: "• Tháng 3: Mùa hoa ban nở trắng xóa sườn đồi.\n• Tháng 5: Lễ kỷ niệm chiến thắng Điện Biên Phủ.",
    diemDen: "• Bảo tàng Chiến thắng Điện Biên Phủ, Đồi A1, Hầm De Castries.\n• Cực Tây A Pa Chải: Điểm ngã ba biên giới Việt - Trung - Lào.",
    hoatDong: "• Tìm hiểu lịch sử hoài niệm chiến trường xưa.\n• Treckking mốc tọa độ cực Tây A Pa Chải.",
    dacSan: "• Pa pỉnh tộp (cá gập nướng kiểu Thái).\n• Thịt trâu gác bếp & Sâu chít Điện Biên.",
    chiPhi: "600.000đ - 1.400.000đ / ngày",
    lichTrinh: "Ngày 1: Tham quan di tích lịch sử Đồi A1 - Hầm De Castries.\nNgày 2: Chinh phục A Pa Chải - Mốc 0.\nNgày 3: Thăm bản múa xòe người Thái - Mua sắm."
  },
  "son la": {
    ten: "Tỉnh Sơn La (Mộc Châu)",
    subRegion: "tay_bac", mien: "bac",
    aliases: ["son la", "moc chau", "ta xua", "bach long"],
    anh: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1000",
    moTa: "Nổi tiếng với Cao nguyên Mộc Châu xanh ngát, đồi chè trái tim bạt ngàn và điểm săn mây Tà Xùa ảo diệu giữa biển mây.",
    thoiDiem: "• Tháng 1 - 2: Mùa hoa mận, hoa đào nở trắng tinh khôi.\n• Tháng 9 - 11: Mùa săn mây Tà Xùa lý tưởng.",
    diemDen: "• Mộc Châu: Đồi chè trái tim, Thác Dải Yếm, Cầu kính Bạch Long.\n• Đỉnh Tà Xùa (Bắc Yên): Thiên đường săn mây.",
    hoatDong: "• Hái dâu tây, hoa mận tại vườn.\n• Săn mây trên 'Sống lưng khủng long' Tà Xùa.\n• Đi cầu kính dài nhất thế giới Bạch Long.",
    dacSan: "• Bê chao Mộc Châu thơm mềm.\n• Sữa tươi Mộc Châu, Bánh sữa & Cá nướng sông Đà.",
    chiPhi: "700.000đ - 1.600.000đ / ngày",
    lichTrinh: "Ngày 1: Hà Nội - Mộc Châu - Đồi chè trái tim.\nNgày 2: Cầu kính Bạch Long - Thác Dải Yếm.\nNgày 3: Di chuyển Tà Xùa săn mây - Về lại Hà Nội."
  },
  "yen bai": {
    ten: "Tỉnh Yên Bái (Mù Cang Chải)",
    subRegion: "tay_bac", mien: "bac",
    aliases: ["yen bai", "mu cang chai", "khau pha", "tram tau", "tu le"],
    anh: "https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=1000",
    moTa: "Sở hữu Ruộng bậc thang Mù Cang Chải - tuyệt tác kiến trúc canh tác mộc mạc do đồng bào H'Mông kiến tạo.",
    thoiDiem: "• Tháng 5 - 6: Mùa nước đổ lấp lánh như gương.\n• Tháng 9 - 10: Mùa vàng lúa chín rực rỡ.",
    diemDen: "• Đồi Mâm Xôi, Đồi Móng Ngựa Mù Cang Chải.\n• Đèo Khau Phạ: 'Bay trên mùa vàng'.\n• Suối nước nóng Trạm Tấu.",
    hoatDong: "• Nhảy dù lượn ngắm toàn cảnh đèo Khau Phạ.\n• Tắm khoáng nóng thiên nhiên Trạm Tấu.",
    dacSan: "• Cốm dẻo Tú Lệ thơm nức.\n• Thịt sấy & Rượu táo mèo nồng nàn.",
    chiPhi: "700.000đ - 1.500.000đ / ngày",
    lichTrinh: "Ngày 1: Nghĩa Lộ - Tú Lệ - Đèo Khau Phạ.\nNgày 2: Săn ảnh đồi Mâm Xôi & Móng Ngựa Mù Cang Chải.\nNgày 3: Tắm khoáng Trạm Tấu - Trở về."
  },
  "hoa binh": {
    ten: "Tỉnh Hòa Bình (Mai Châu)",
    subRegion: "dong_bac", mien: "bac",
    aliases: ["hoa binh", "mai chau", "thung nai", "ban lac"],
    anh: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1000",
    moTa: "Thung lũng Mai Châu bình yên với văn hóa dân tộc Thái đặc sắc cùng lòng hồ thủy điện Hòa Bình xanh biếc.",
    thoiDiem: "• Tháng 10 - Tháng 4: Khí hậu mát mẻ, trong lành.",
    diemDen: "• Bản Lác, Bản Poom Coọng Mai Châu.\n• Hồ thủy điện Hòa Bình & Khu du lịch Thung Nai.",
    hoatDong: "• Đạp xe dạo quanh bản làng người Thái.\n• Đi thuyền thăm viếng lòng hồ Thung Nai.",
    dacSan: "• Cơm lam gà nướng chấm muối vừng.\n• Cá sông Đà nướng lá chuối & Rượu cần Mường.",
    chiPhi: "600.000đ - 1.400.000đ / ngày",
    lichTrinh: "Ngày 1: Hà Nội - Mai Châu - Bản Lác.\nNgày 2: Thung Nai lòng hồ sông Đà.\nNgày 3: Thung Khe - Mua sắm đặc sản."
  },
  "lai chau": {
    ten: "Tỉnh Lai Châu",
    subRegion: "tay_bac", mien: "bac",
    aliases: ["lai chau", "rong may", "sin suoi ho", "pu ta leng"],
    anh: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1000",
    moTa: "Mảnh đất sơn hà kỳ vĩ sở hữu các đỉnh núi cao hàng đầu Việt Nam như Pu Ta Leng, Pu Si Lung thu hút phượt thủ.",
    thoiDiem: "• Tháng 9 - 11: Khô ráo thích hợp trekking chinh phục đỉnh núi.",
    diemDen: "• Cầu kính Rồng May & Đèo Ô Quy Hồ.\n• Bản du lịch cộng đồng Sin Suối Hồ.",
    hoatDong: "• Khám phá cầu kính Rồng May trên vách núi.\n• Trekking chinh phục đỉnh Pu Ta Leng.",
    dacSan: "• Lợn cắp nách quay nguyên con.\n• Măng đắng & Rượu ngô ngâm thảo mộc.",
    chiPhi: "700.000đ - 1.700.000đ / ngày",
    lichTrinh: "Ngày 1: Check-in Cầu Kính Rồng May.\nNgày 2: Tham quan bản Sin Suối Hồ.\nNgày 3: Mua sắm thảo dược vùng cao."
  },
  "lang son": {
    ten: "Tỉnh Lạng Sơn",
    subRegion: "dong_bac", mien: "bac",
    aliases: ["lang son", "mau son", "tam thanh", "to thi", "huu nghi"],
    anh: "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1000",
    moTa: "Nổi tiếng với danh thắng Chùa Tam Thanh, Núi Nàng Tô Thị, đỉnh Mẫu Sơn mây phủ và các chợ cửa khẩu sầm uất.",
    thoiDiem: "• Tháng 12 - 1: Cơ hội săn băng giá tuyết phủ đỉnh Mẫu Sơn.",
    diemDen: "• Động Tam Thanh, Nàng Tô Thị, Thành Nhà Mạc.\n• Đỉnh Mẫu Sơn & Cửa khẩu Hữu Nghị.",
    hoatDong: "• Săn băng giá Mẫu Sơn mùa đông.\n• Mua sắm tại Chợ Đông Kinh.",
    dacSan: "• Vịt quay Lạng Sơn da giòn béo ngậy.\n• Khâu nhục đậm đà & Phở chua Lạng Sơn.",
    chiPhi: "500.000đ - 1.300.000đ / ngày",
    lichTrinh: "Ngày 1: Động Tam Thanh - Nàng Tô Thị - Chợ Đông Kinh.\nNgày 2: Chinh phục đỉnh Mẫu Sơn.\nNgày 3: Thăm cửa khẩu Hữu Nghị - Về."
  },
  "bac kan": {
    ten: "Tỉnh Bắc Kạn",
    subRegion: "dong_bac", mien: "bac",
    aliases: ["bac kan", "bac canh", "ba be", "ho ba be"],
    anh: "https://images.unsplash.com/photo-1439853949127-fa647821eba0?w=1000",
    moTa: "Sở hữu Hồ Ba Bể - một trong 20 hồ nước ngọt tự nhiên lớn nhất thế giới trong khuôn viên Vườn quốc gia Ba Bể nguyên sơ.",
    thoiDiem: "• Tháng 5 - 9: Mát mẻ, nước hồ xanh trong ngọc bích.",
    diemDen: "• Hồ Ba Bể, Động Puông, Thác Đầu Đẳng.\n• Động Hua Mạ & Bản Pac Ngoi.",
    hoatDong: "• Đi thuyền chèo trải nghiệm Hồ Ba Bể.\n• Khám phá Động Puông kỳ vĩ.",
    dacSan: "• Cá nướng Hồ Ba Bể thơm ngon.\n• Tôm chua Ba Bể & Bánh co óc.",
    chiPhi: "500.000đ - 1.200.000đ / ngày",
    lichTrinh: "Ngày 1: Du thuyền Hồ Ba Bể - Động Puông.\nNgày 2: Thác Đầu Đẳng - Bản Pac Ngoi.\nNgày 3: Mua miến đao Bắc Kạn - Trở về."
  },
  "tuyen quang": {
    ten: "Tỉnh Tuyên Quang",
    subRegion: "dong_bac", mien: "bac",
    aliases: ["tuyen quang", "na hang", "tan trao"],
    anh: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=1000",
    moTa: "Thủ đô khu giải phóng Tân Trào lịch sử, sở hữu lòng hồ sinh thái Na Hang - 'Vịnh Hạ Long giữa đại ngàn'.",
    thoiDiem: "• Tháng 8 âm lịch: Đêm hội Trung thu Tuyên Quang hoành tráng nhất cả nước.",
    diemDen: "• Khu di tích lịch sử Tân Trào.\n• Lòng hồ sinh thái Na Hang - Lâm Bình & Thác Mơ.",
    hoatDong: "• Đi thuyền du ngoạn lòng hồ Na Hang.\n• Hòa mình vào đêm hội Trung thu khổng lồ.",
    dacSan: "• Thịt lợn đen Na Hang.\n• Mắm cá ruộng Chiêm Hóa & Cam sành Hàm Yên.",
    chiPhi: "500.000đ - 1.100.000đ / ngày",
    lichTrinh: "Ngày 1: Di tích Tân Trào.\nNgày 2: Du thuyền lòng hồ Na Hang.\nNgày 3: Thăm Thác Mơ - Mua cam sành."
  },
  "thai nguyen": {
    ten: "Tỉnh Thái Nguyên",
    subRegion: "dong_bac", mien: "bac",
    aliases: ["thai nguyen", "tan cuong", "nuoc coc", "ho nui coc"],
    anh: "https://images.unsplash.com/photo-1523712999610-f77fbcfc3843?w=1000",
    moTa: "Đệ nhất danh trà Việt Nam với đồi chè Tân Cương xanh ngát, di tích ATK Định Hóa và Hồ Núi Cốc.",
    thoiDiem: "• Mùa thu từ tháng 9 đến tháng 12.",
    diemDen: "• Đồi chè Tân Cương thơm mát.\n• Khu du lịch Hồ Núi Cốc & ATK Định Hóa.",
    hoatDong: "• Trải nghiệm hái chè và thưởng trà Tân Cương.\n• Đi thuyền quanh Hồ Núi Cốc.",
    dacSan: "• Trà Tân Cương đượm vị ngọt hậu.\n• Bánh chưng Bờm & Tôm cuốn Thừa Lâm.",
    chiPhi: "450.000đ - 1.000.000đ / ngày",
    lichTrinh: "Ngày 1: Check-in Đồi chè Tân Cương.\nNgày 2: Vui chơi Hồ Núi Cốc.\nNgày 3: Thăm chiến khu ATK Định Hóa."
  },
  "phu tho": {
    ten: "Tỉnh Phú Thọ",
    subRegion: "dong_bac", mien: "bac",
    aliases: ["phu tho", "den hung", "long coc", "xuan son"],
    anh: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=1000",
    moTa: "Đất Tổ Hùng Vương thiêng liêng, sở hữu Đồi chè Long Cốc ảo diệu như những bát úp xanh mướt.",
    thoiDiem: "• Tháng 3 âm lịch: Giỗ Tổ Hùng Vương (10/3 âm lịch).",
    diemDen: "• Khu di tích lịch sử Đền Hùng.\n• Đồi chè Long Cốc (Thanh Sơn).\n• Vườn quốc gia Xuân Sơn.",
    hoatDong: "• Dâng hương tưởng niệm các Vua Hùng.\n• Săn ảnh bình minh Đồi chè Long Cốc.",
    dacSan: "• Thịt chua Thanh Sơn đậm đà.\n• Bưởi Đoan Hùng & Bánh tai Phú Thọ.",
    chiPhi: "500.000đ - 1.100.000đ / ngày",
    lichTrinh: "Ngày 1: Dâng hương Đền Hùng.\nNgày 2: Khám phá Đồi chè Long Cốc.\nNgày 3: Trekking VQG Xuân Sơn."
  },
  "bac giang": {
    ten: "Tỉnh Bắc Giang",
    subRegion: "dong_bac", mien: "bac",
    aliases: ["bac giang", "luc ngan", "tay yen tu", "dong cao"],
    anh: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1000",
    moTa: "Thủ phủ vải thiều Lục Ngạn, nơi lưu giữ Quần thể Tây Yên Tử linh thiêng và Chùa Vĩnh Nghiêm mộc bản di sản.",
    thoiDiem: "• Tháng 6: Mùa thu hoạch vải thiều đỏ rực.",
    diemDen: "• Khu du lịch tâm linh Tây Yên Tử.\n• Chùa Vĩnh Nghiêm & Hồ Cấm Sơn.\n• Đồng Cao phượt cắm trại.",
    hoatDong: "• Cắm trại ngắm sao tại thảo nguyên Đồng Cao.\n• Hái vải thiều chín mọng tại vườn Lục Ngạn.",
    dacSan: "• Vải thiều Lục Ngạn chín ngọt mọng nước.\n• Bánh đa Kế giòn rụm & Mỳ Chũ.",
    chiPhi: "400.000đ - 1.000.000đ / ngày",
    lichTrinh: "Ngày 1: Tây Yên Tử - Chùa Vĩnh Nghiêm.\nNgày 2: Đồng Cao cắm trại dã ngoại.\nNgày 3: Tham quan vườn vải Lục Ngạn."
  },
  "vinh phuc": {
    ten: "Tỉnh Vĩnh Phúc (Tam Đảo)",
    subRegion: "dong_bang_sh", mien: "bac",
    aliases: ["vinh phuc", "tam dao", "dai lai", "tay thien"],
    anh: "https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=1000",
    moTa: "Thị trấn Tam Đảo mờ sương ví như 'Đà Lạt thu nhỏ' miền Bắc cùng khu nghỉ dưỡng sinh thái Hồ Đại Lải tươi mát.",
    thoiDiem: "• Quanh năm, cực kỳ lý tưởng cho chuyến nghỉ dưỡng ngắn ngày.",
    diemDen: "• Thị trấn Tam Đảo & Nhà thờ đá cổ.\n• Thiền viện Trúc Lâm Tây Thiên.\n• Khu du lịch Hồ Đại Lải & Flamingo Đại Lải.",
    hoatDong: "• Check-in Cổng trời Tam Đảo.\n• Đi cáp treo ngắm cảnh Thiền viện Tây Thiên.",
    dacSan: "• Ngọn su su Tam Đảo xào tỏi giòn ngọt.\n• Gà đồi nướng bọc đất sét & Bánh hòn Lập Thạch.",
    chiPhi: "600.000đ - 1.600.000đ / ngày",
    lichTrinh: "Ngày 1: Hà Nội - Tam Đảo - Check-in nhà thờ đá.\nNgày 2: Thiền viện Tây Thiên - Flamingo Đại Lải.\nNgày 3: Vui chơi Đại Lải - Trở về."
  },
  "bac ninh": {
    ten: "Tỉnh Bắc Ninh",
    subRegion: "dong_bang_sh", mien: "bac",
    aliases: ["bac ninh", "kinh bac", "dinh bang", "chua dau", "dong ho"],
    anh: "https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?w=1000",
    moTa: "Nôi văn hóa Kinh Bắc trù phú, quê hương của Dân ca Quan họ di sản phi vật thể thế giới.",
    thoiDiem: "• Tháng 1 - 3 âm lịch: Mùa lễ hội xuân Kinh Bắc (Hội Lim).",
    diemDen: "• Chùa Phật Tích, Chùa Dâu cổ kính.\n• Đền Đô (thờ 8 vị vua nhà Lý) & Làng tranh Đông Hồ.",
    hoatDong: "• Nghe hát Quan họ trên thuyền rồng.\n• Trải nghiệm làm tranh Đông Hồ truyền thống.",
    dacSan: "• Bánh phu thê Đình Bảng dẻo ngọt.\n• Nem Bùi Thuận Thành & Bánh tẻ Chờ.",
    chiPhi: "400.000đ - 900.000đ / ngày",
    lichTrinh: "Ngày 1: Đền Đô - Chùa Dâu - Chùa Phật Tích.\nNgày 2: Làng tranh Đông Hồ - Mua bánh phu thê."
  },
  "hai duong": {
    ten: "Tỉnh Hải Dương",
    subRegion: "dong_bang_sh", mien: "bac",
    aliases: ["hai duong", "con son", "kiep bac", "chi lang nam"],
    anh: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=1000",
    moTa: "Vùng đất nhân kiệt lưu giữ quần thể di tích Côn Sơn - Kiếp Bạc cùng đặc sản bánh đậu xanh trứ danh.",
    thoiDiem: "• Tháng 1 - 3 & Tháng 8 âm lịch (Lễ hội Côn Sơn - Kiếp Bạc).",
    diemDen: "• Quần thể Côn Sơn - Kiếp Bạc.\n• Đảo Cò Chi Lăng Nam xanh mát sinh thái.\n• Văn miếu Mao Điền.",
    hoatDong: "• Đi thuyền ngắm hàng ngàn con cò ở Đảo Cò Chi Lăng.\n• Vãng cảnh núi Côn Sơn thanh bình.",
    dacSan: "• Bánh đậu xanh Hải Dương thơm bùi.\n• Bánh gai Ninh Giang & Vải thiều Thanh Hà.",
    chiPhi: "400.000đ - 900.000đ / ngày",
    lichTrinh: "Ngày 1: Danh thắng Côn Sơn Kiếp Bạc.\nNgày 2: Đảo Cò Chi Lăng Nam - Thưởng thức bánh đậu xanh."
  },
  "hai phong": {
    ten: "Thành phố Hải Phòng",
    subRegion: "dong_bang_sh", mien: "bac",
    aliases: ["hai phong", "cat ba", "lan ha", "do son", "hoa phuong do"],
    anh: "https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=1000",
    moTa: "Thành phố Cảng Hoa Phượng Đỏ sôi động, nổi tiếng với Đảo Cát Bà, Vịnh Lan Hạ và trào lưu Foodtour bùng nổ.",
    thoiDiem: "• Tháng 4 - 8: Tắm biển Cát Bà.\n• Quanh năm: Trải nghiệm Foodtour bách khoa ẩm thực.",
    diemDen: "• Đảo Cát Bà & Vịnh Lan Hạ chèo Kayak.\n• Tuyến phố cổ Foodtour Hải Phòng.\n• Bãi biển Đồ Sơn.",
    hoatDong: "• Trải nghiệm Foodtour bằng xe máy qua các ngõ phố.\n• Chèo thuyền Kayak Vịnh Lan Hạ ngắm san hô.",
    dacSan: "• Bánh đa cua Hải Phòng đậm đà riêu cua.\n• Bánh mì que cay & Dừa dầm béo ngậy.",
    chiPhi: "600.000đ - 1.700.000đ / ngày",
    lichTrinh: "Ngày 1: Foodtour trung tâm Hải Phòng.\nNgày 2: Di chuyển Đảo Cát Bà - Vịnh Lan Hạ.\nNgày 3: Tắm biển Cát Cò - Mua hải sản về."
  },
  "hung yen": {
    ten: "Tỉnh Hưng Yên",
    subRegion: "dong_bang_sh", mien: "bac",
    aliases: ["hung yen", "pho hien", "lang nom"],
    anh: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1000",
    moTa: "Mảnh đất 'Thứ nhất Kinh Kỳ, thứ nhì Phố Hiến' lưu giữ Phố Hiến cổ kính cùng đặc sản nhãn lồng tiến vua.",
    thoiDiem: "• Tháng 7 - 8: Mùa nhãn lồng chín mọng ngọt lịm.",
    diemDen: "• Quần thể di tích Phố Hiến cổ, Chùa Chuông.\n• Văn Miếu Xích Đằng & Làng Nôm cổ kính.",
    hoatDong: "• Dạo bước ngôi làng cổ Nôm trầm mặc.\n• Thưởng thức nhãn lồng tươi tại vườn.",
    dacSan: "• Nhãn lồng Hưng Yên tiến vua.\n• Bún thang lợn Phố Hiến & Ếch om Phượng Tường.",
    chiPhi: "350.000đ - 800.000đ / ngày",
    lichTrinh: "Ngày 1: Phố Hiến cổ - Chùa Chuông.\nNgày 2: Làng Nôm cổ - Mua nhãn lồng làm quà."
  },
  "ha nam": {
    ten: "Tỉnh Hà Nam",
    subRegion: "dong_bang_sh", mien: "bac",
    aliases: ["ha nam", "tam chuc", "phu ly", "dia tang phi lai"],
    anh: "https://images.unsplash.com/photo-1518495973542-4542c06a5843?w=1000",
    moTa: "Điểm đến tâm linh bùng nổ sở hữu Chùa Tam Chúc - quần thể chùa lớn bậc nhất thế giới hòa quyện núi hồ.",
    thoiDiem: "• Tháng 1 - 3 âm lịch: Mùa hành hương trẩy hội.",
    diemDen: "• Quần thể tâm linh Chùa Tam Chúc.\n• Chùa Địa Tạng Phi Lai Tự tĩnh lặng.\n• Ngôi nhà Bá Kiến (Làng Đại Hoàng).",
    hoatDong: "• Đi du thuyền trên Hồ Tam Chúc.\n• Tìm lại vết dấu tác phẩm Chí Phèo tại làng Đại Hoàng.",
    dacSan: "• Cá kho làng Vũ Đại kỳ công 16 tiếng.\n• Bánh cuốn Phủ Lý ăn kèm thịt nướng.",
    chiPhi: "500.000đ - 1.200.000đ / ngày",
    lichTrinh: "Ngày 1: Chùa Tam Chúc - Chùa Địa Tạng Phi Lai Tự.\nNgày 2: Làng Vũ Đại - Mua cá kho."
  },
  "nam dinh": {
    ten: "Tỉnh Nam Định",
    subRegion: "dong_bang_sh", mien: "bac",
    aliases: ["nam dinh", "hung nghia", "bui chu", "den tran"],
    anh: "https://images.unsplash.com/photo-1510784722464-77360537ea67?w=1000",
    moTa: "Thánh địa kiến trúc nhà thờ Công giáo tráng lệ, quê hương nhà Trần và nơi khai sinh món Phở Bò trứ danh.",
    thoiDiem: "• Dịp Giáng Sinh (tháng 12) hoành tráng.\n• Đêm 14 rằm tháng Giêng: Lễ khai ấn Đền Trần.",
    diemDen: "• Nhà thờ đổ Hải Lý, Tòa giám mục Bùi Chu, Nhà thờ Hưng Nghĩa.\n• Đền Trần & Vườn quốc gia Xuân Thủy.",
    hoatDong: "• Săn ảnh hoàng hôn tại Nhà thờ đổ Hải Lý.\n• Tour check-in kiến trúc các nhà thờ cổ.",
    dacSan: "• Phở bò Nam Định (Phở Cồ) chuẩn vị gốc.\n• Bánh xíu báo thơm lừng & Kẹo Cầu Dòng.",
    chiPhi: "400.000đ - 1.000.000đ / ngày",
    lichTrinh: "Ngày 1: Đền Trần - Tour kiến trúc Nhà thờ Hưng Nghĩa, Bùi Chu.\nNgày 2: Nhà thờ đổ Hải Lý - Ăn Phở Cồ."
  },
  "thai binh": {
    ten: "Tỉnh Thái Bình",
    subRegion: "dong_bang_sh", mien: "bac",
    aliases: ["thai binh", "quang lang", "chua keo", "bien vo cuc"],
    anh: "https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=1000",
    moTa: "Quê hương lúa nước bình yên nổi tiếng với bãi biển vô cực Quang Lang thơ mộng như chiếc gương soi trời.",
    thoiDiem: "• Tháng 5 - 9: Mùa đón bình minh biển vô cực.",
    diemDen: "• Biển vô cực Quang Lang (Thụy Xuân).\n• Chùa Keo cổ kính hơn 400 năm kiến trúc gỗ.",
    hoatDong: "• Săn ảnh bình minh lội bùn biển vô cực Quang Lang.\n• Chiêm bái Chùa Keo cổ kính.",
    dacSan: "• Bánh cáy Thái Bình đậm đà vị gừng.\n• Canh cá Quỳnh Cừ & Bún bung hoa chuối.",
    chiPhi: "400.000đ - 900.000đ / ngày",
    lichTrinh: "Ngày 1: Chùa Keo - Bãi biển Đồng Châu.\nNgày 2: Săn bình minh biển vô cực Quang Lang - Mua Bánh cáy."
  },

  // --- MIỀN TRUNG & TÂY NGUYÊN (19 TỈNH THÀNH) ---
  "thanh hoa": {
    ten: "Tỉnh Thanh Hóa",
    subRegion: "bac_trung_bo", mien: "trung",
    aliases: ["thanh hoa", "sam son", "pu luong", "thanh nha ho"],
    anh: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=1000",
    moTa: "Sở hữu biển Sầm Sơn nhộn nhịp, thiên đường sinh thái xanh Pù Luông và Di sản thế giới Thành Nhà Hồ.",
    thoiDiem: "• Tháng 5 - 8: Tắm biển Sầm Sơn.\n• Tháng 9 - 10: Ngắm lúa chín Pù Luông.",
    diemDen: "• Biển Sầm Sơn, Bãi Đông Nghi Sơn.\n• Khu bảo tồn Pù Luông & Thành Nhà Hồ.",
    hoatDong: "• Tắm biển và ăn hải sản tươi ở Sầm Sơn.\n• Nghỉ dưỡng resort giữa thung lũng Pù Luông.",
    dacSan: "• Nem chua Thanh Hóa giòn sần sật.\n• Chả tôm nướng & Bánh cuốn Thanh Hóa.",
    chiPhi: "600.000đ - 1.600.000đ / ngày",
    lichTrinh: "Ngày 1: Tắm biển Sầm Sơn - Ăn chả tôm.\nNgày 2: Thành Nhà Hồ - Suối cá thần Cẩm Lương.\nNgày 3: Nghỉ dưỡng Pù Luông - Trở về."
  },
  "nghe an": {
    ten: "Tỉnh Nghệ An",
    subRegion: "bac_trung_bo", mien: "trung",
    aliases: ["nghe an", "cua lo", "nam dan", "vinh", "que bac"],
    anh: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1000",
    moTa: "Quê hương Bác Hồ kính yêu, sở hữu bãi biển Cửa Lò sầm uất và đồi chè Thanh Chương rợp xanh mát.",
    thoiDiem: "• Tháng 5 - 8: Mùa biển Cửa Lò nắng ấm.",
    diemDen: "• Khu di tích Kim Liên (Quê Bác - Nam Đàn).\n• Biển Cửa Lò & Đồi chè ốc đảo Thanh Chương.",
    hoatDong: "• Thăm ngôi nhà tranh Quê Bác Nam Đàn.\n• Đi thuyền thăm đồi chè ốc đảo Thanh Chương.",
    dacSan: "• Súp lươn Nghệ An ăn kèm bánh mì giòn.\n• Nhút Thanh Chương & Tương Nam Đàn.",
    chiPhi: "500.000đ - 1.300.000đ / ngày",
    lichTrinh: "Ngày 1: Thăm Quê Bác Nam Đàn - Biển Cửa Lò.\nNgày 2: Đồi chè Thanh Chương - VQG Pù Mát.\nNgày 3: Thưởng thức súp lươn - Mua quà."
  },
  "ha tinh": {
    ten: "Tỉnh Hà Tĩnh",
    subRegion: "bac_trung_bo", mien: "trung",
    aliases: ["ha tinh", "thien cam", "dong loc", "huong tich"],
    anh: "https://images.unsplash.com/photo-1509233725247-49e657c54213?w=1000",
    moTa: "Mảnh đất lịch sử Ngã ba Đồng Lộc, sở hữu bãi biển Thiên Cầm xanh ngọc êm đềm và Chùa Hương Tích.",
    thoiDiem: "• Tháng 4 - 8: Mùa tắm biển Thiên Cầm.",
    diemDen: "• Khu di tích Ngã ba Đồng Lộc.\n• Biển Thiên Cầm & Chùa Hương Tích.",
    hoatDong: "• Tắm biển Thiên Cầm thưởng thức hải sản.\n• Viếng di tích lịch sử Ngã ba Đồng Lộc.",
    dacSan: "• Kẹo Cu Đơ Hà Tĩnh thơm bùi giòn rụm.\n• Bánh ram mướt & Mực nhảy Vũng Áng.",
    chiPhi: "450.000đ - 1.100.000đ / ngày",
    lichTrinh: "Ngày 1: Ngã ba Đồng Lộc - Biển Thiên Cầm.\nNgày 2: Chùa Hương Tích - Mua kẹo Cu Đơ."
  },
  "quang binh": {
    ten: "Tỉnh Quảng Bình",
    subRegion: "bac_trung_bo", mien: "trung",
    aliases: ["quang binh", "phong nha", "son doong", "dong hoi", "song chay", "thien duong"],
    anh: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1000",
    moTa: "Vương quốc hang động thế giới sở hữu Phong Nha - Kẻ Bàng, Hang Sơn Đoòng cùng bãi biển cát trắng miên man.",
    thoiDiem: "• Tháng 4 - 8: Mùa nắng đẹp lý tưởng thám hiểm hang động.",
    diemDen: "• Động Phong Nha, Động Thiên Đường, Hang Sơn Đoòng.\n• Sông Chày - Hang Tối & Suối Moọc.\n• Biển Nhật Lệ & Đồi cát Quang Phú.",
    hoatDong: "• đu dây Zipline và chèo Kayak ở Sông Chày Hang Tối.\n• Trượt cát trên đồi cát Quang Phú.",
    dacSan: "• Cháo canh Quảng Bình béo ngọt đậm đà.\n• Lẩu cá khoai & Đẻn biển nướng.",
    chiPhi: "900.000đ - 3.000.000đ / ngày",
    lichTrinh: "Ngày 1: Đồng Hới - Đồi cát Quang Phú - Biển Nhật Lệ.\nNgày 2: Động Phong Nha - Động Thiên Đường.\nNgày 3: Suối Moọc/Sông Chày Hang Tối - Về."
  },
  "quang tri": {
    ten: "Tỉnh Quảng Trị",
    subRegion: "bac_trung_bo", mien: "trung",
    aliases: ["quang tri", "vinh moc", "hien luong", "thanh co"],
    anh: "https://images.unsplash.com/photo-1476514525535-ce74f452623d?w=1000",
    moTa: "Ghi dấu lịch sử với Đôi bờ Hiền Lương - Bến Hải, Địa đạo Vịnh Mốc và Đảo Cồn Cỏ hoang sơ.",
    thoiDiem: "• Tháng 4 - 8: Mùa hè khô ráo du lịch hoài niệm.",
    diemDen: "• Thành cổ Quảng Trị, Nghĩa trang Đường 9.\n• Đôi bờ Hiền Lương - Sông Bến Hải.\n• Địa đạo Vịnh Mốc & Đảo Cồn Cỏ.",
    hoatDong: "• Tham quan hệ thống đường hầm Địa đạo Vịnh Mốc.\n• Viếng Thành Cổ Quảng Trị thả hoa hoa đăng.",
    dacSan: "• Thịt trâu lá trơảng đậm đà cay nồng.\n• Bánh lọc Mỹ Chánh & Bún hến Mai Xá.",
    chiPhi: "500.000đ - 1.200.000đ / ngày",
    lichTrinh: "Ngày 1: Thành cổ Quảng Trị - Đôi bờ Hiền Lương.\nNgày 2: Địa đạo Vịnh Mốc - Biển Cửa Tùng.\nNgày 3: Mua sắm đặc sản."
  },
  "thua thien hue": {
    ten: "Tỉnh Thừa Thiên Huế",
    subRegion: "bac_trung_bo", mien: "trung",
    aliases: ["thua thien hue", "hue", "lang co", "dai noi", "song huong"],
    anh: "https://images.unsplash.com/photo-1569154941061-e231b4725ef1?w=1000",
    moTa: "Cố đô dịu dàng bên dòng Sông Hương thơ mộng, nơi lưu giữ Quần thể di tích Cố đô Huế và Nhã nhạc cung đình.",
    thoiDiem: "• Tháng 1 - 4: Tiết trời dịu mát, nắng nhẹ.",
    diemDen: "• Đại Nội Huế, Chùa Thiên Mụ.\n• Lăng vua Nguyễn: Lăng Khải Định, Tự Đức, Minh Mạng.\n• Đầm Lập An & Bãi biển Lăng Cô.",
    hoatDong: "• Đi thuyền dragon nghe Ca Huế trên sông Hương.\n• Mặc cổ phục chụp ảnh tại Đại Nội Huế.",
    dacSan: "• Bún bò Huế chuẩn vị gốc đậm mắm ruốc.\n• Cơm hến, Bánh bèo, Bánh nậm, Bánh lọc & Chè Cung Đình.",
    chiPhi: "500.000đ - 1.400.000đ / ngày",
    lichTrinh: "Ngày 1: Đại Nội Huế - Chùa Thiên Mụ - Nghe ca Huế.\nNgày 2: Tour Lăng Khải Định, Minh Mạng - Chợ Đông Ba.\nNgày 3: Đầm Lập An - Vịnh Lăng Cô."
  },
  "da nang": {
    ten: "Thành phố Đà Nẵng",
    subRegion: "nam_trung_bo", mien: "trung",
    aliases: ["da nang", "danang", "ba na", "ba na hills", "cau vang", "my khe", "son tra"],
    anh: "https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=1000",
    moTa: "Thành phố đáng sống nhất Việt Nam với bãi biển Mỹ Khê, Cầu Vàng Bà Nà Hills chạm mây và Cầu Rồng phun lửa.",
    thoiDiem: "• Tháng 3 - 8: Mùa hè rực rỡ, bãi biển lặng sóng.",
    diemDen: "• Sun World Bà Nà Hills & Cầu Vàng.\n• Bãi biển Mỹ Khê & Bán đảo Sơn Trà.\n• Cầu Rồng, Danh thắng Ngũ Hành Sơn.",
    hoatDong: "• Xem Cầu Rồng phun lửa và phun nước tối cuối tuần.\n• Đi cáp treo Bà Nà Hills check-in Cầu Vàng.",
    dacSan: "• Mì Quảng Đà Nẵng đậm đà nước dùng.\n• Bánh tráng cuốn thịt heo hai đầu da.\n• Hải sản tươi sống nướng mỡ hành.",
    chiPhi: "800.000đ - 2.200.000đ / ngày",
    lichTrinh: "Ngày 1: Tắm biển Mỹ Khê - Bán đảo Sơn Trà - Cầu Rồng.\nNgày 2: Trọn vẹn Bà Nà Hills - Cầu Vàng.\nNgày 3: Ngũ Hành Sơn - Chợ Hàn mua quà."
  },
  "quang nam": {
    ten: "Tỉnh Quảng Nam (Hội An)",
    subRegion: "nam_trung_bo", mien: "trung",
    aliases: ["quang nam", "hoi an", "hoian", "my son", "cu lao cham", "bay mau"],
    anh: "https://images.unsplash.com/photo-1552353617-3bfd679b3bdd?w=1000",
    moTa: "Sở hữu Phố cổ Hội An đèn lồng rực rỡ bên sông Hoài và Thánh địa Mỹ Sơn kiến trúc Chăm Pa cổ kính.",
    thoiDiem: "• Tháng 2 - 7: Tiết trời khô ráo, nắng đẹp.",
    diemDen: "• Phố cổ Hội An & Chùa Cầu.\n• Thánh địa Mỹ Sơn cổ kính.\n• Đảo Cù Lao Chàm & Rừng dừa Bảy Mẫu.",
    hoatDong: "• Thả hoa đăng rực rỡ trên sông Hoài Hội An.\n• Đi thuyền thúng trải nghiệm Rừng dừa Bảy Mẫu.",
    dacSan: "• Cao lầu Hội An dẻo thơm nức tiếng.\n• Bánh mì Phượng, Cơm gà Hội An & Mì Quảng.",
    chiPhi: "700.000đ - 1.800.000đ / ngày",
    lichTrinh: "Ngày 1: Rừng dừa Bảy Mẫu - Dạo phố cổ Hội An đêm.\nNgày 2: Thánh địa Mỹ Sơn - Tắm biển An Bàng.\nNgày 3: Cù Lao Chàm lặn ngắm san hô - Trở về."
  },
  "quang ngai": {
    ten: "Tỉnh Quảng Ngãi",
    subRegion: "nam_trung_bo", mien: "trung",
    aliases: ["quang ngai", "ly son", "dao ly son"],
    anh: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1000",
    moTa: "Thiên đường biển đảo Đảo Lý Sơn được hình thành từ trầm tích núi lửa hàng triệu năm hoang sơ tuyệt đẹp.",
    thoiDiem: "• Tháng 4 - 8: Biển lặng lý tưởng đi tàu ra Đảo Lý Sơn.",
    diemDen: "• Đảo Lý Sơn, Cổng Tụ Vò, Đỉnh Thới Lới.\n• Bãi biển Mỹ Khê Quảng Ngãi.",
    hoatDong: "• Đón bình minh tại Cổng Tụ Vò Đảo Lý Sơn.\n• Chèo thuyền thúng ngắm san hô Đảo Bé.",
    dacSan: "• Don Quảng Ngãi ăn kèm bánh tráng nướng.\n• Tỏi cô đơn Lý Sơn & Xu xoa phong vị biển.",
    chiPhi: "600.000đ - 1.400.000đ / ngày",
    lichTrinh: "Ngày 1: Cảng Sa Kỳ - Ra Đảo Lý Sơn - Cổng Tụ Vò.\nNgày 2: Khám phá Đảo Bé - Đỉnh Thới Lới.\nNgày 3: Về lại đất liền - Mua tỏi Lý Sơn."
  },
  "binh dinh": {
    ten: "Tỉnh Bình Định (Quy Nhơn)",
    subRegion: "nam_trung_bo", mien: "trung",
    aliases: ["binh dinh", "quy nhon", "quynhon", "ky co", "eo gio"],
    anh: "https://images.unsplash.com/photo-1512100356356-de1b84283e18?w=1000",
    moTa: "Đất võ trời văn Quy Nhơn sở hữu Eo Gió ngắm hoàng hôn tuyệt đẹp cùng Bãi biển Kỳ Co trong vắt.",
    thoiDiem: "• Tháng 3 - 8: Nắng đẹp rực rỡ, biển trong như ngọc.",
    diemDen: "• Eo Gió, Bãi biển Kỳ Co.\n• Tháp Bánh Ít, Tháp Đôi Chăm Pa.\n• KDL Trung Lương & Tịnh xá Ngọc Hòa.",
    hoatDong: "• Đi cano ra Bãi Kỳ Co lặn ngắm san hô.\n• Ngắm hoàng hôn kỳ vĩ trên con đường đi bộ Eo Gió.",
    dacSan: "• Bánh hỏi lòng heo Quy Nhơn.\n• Bánh xèo tôm nhảy giòn rụm & Rượu Bầu Đá.",
    chiPhi: "700.000đ - 1.600.000đ / ngày",
    lichTrinh: "Ngày 1: Eo Gió - Bãi biển Kỳ Co - Tịnh xá Ngọc Hòa.\nNgày 2: Tháp Bánh Ít - KDL Trung Lương.\nNgày 3: Ghềnh Ráng Tiên Sa - Mua bánh ít lá gai."
  },
  "phu yen": {
    ten: "Tỉnh Phú Yên",
    subRegion: "nam_trung_bo", mien: "trung",
    aliases: ["phu yen", "tuy hoa", "ghenh da dia", "mui dien", "nghinh phong"],
    anh: "https://images.unsplash.com/photo-1506953823976-52e1fdc0149a?w=1000",
    moTa: "Xứ sở 'Hoa vàng trên cỏ xanh' mê hoặc bởi Ghềnh Đá Đĩa độc nhất vô nhị và Mũi Điện đón bình minh.",
    thoiDiem: "• Tháng 3 - 8: Nắng đẹp khô ráo, sóng nhẹ.",
    diemDen: "• Ghềnh Đá Đĩa, Mũi Điện (Mũi Đại Lãnh).\n• Bãi Xếp, Tháp Nghinh Phong & Đầm O Loan.",
    hoatDong: "• Đón bình minh sớm nhất trên đất liền tại Mũi Điện.\n• Check-in tháp Nghinh Phong biểu tượng hiện đại.",
    dacSan: "• Mắt cá ngừ đại dương hầm thuốc bắc.\n• Sò huyết Đầm O Loan & Bánh hỏi lòng heo.",
    chiPhi: "600.000đ - 1.400.000đ / ngày",
    lichTrinh: "Ngày 1: Tuy Hòa - Tháp Nghinh Phong - Bãi Xếp.\nNgày 2: Mũi Điện đón bình minh - Ghềnh Đá Đĩa - Đầm O Loan.\nNgày 3: Tháp Nhạn - Mua bò một nắng về."
  },
  "khanh hoa": {
    ten: "Tỉnh Khánh Hòa (Nha Trang)",
    subRegion: "nam_trung_bo", mien: "trung",
    aliases: ["khanh hoa", "nha trang", "nhatrang", "cam ranh", "hon tre", "vinwonders"],
    anh: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1000",
    moTa: "Thành phố biển Nha Trang sở hữu vịnh biển đẹp top thế giới, đảo nghỉ dưỡng sang trọng và suối khoáng nóng.",
    thoiDiem: "• Tháng 1 - 8: Mùa khô nắng ấm, biển lặng.",
    diemDen: "• VinWonders Nha Trang & Đảo Hòn Tre.\n• Đảo Hòn Mun, Hòn Tằm.\n• Tháp Bà Ponagar & Đảo Điệp Sơn.",
    hoatDong: "• Tắm bùn khoáng nóng thư giãn.\n• Vui chơi giải trí VinWonders cáp treo qua biển.",
    dacSan: "• Bún cá Nha Trang thanh ngọt.\n• Nem nướng Ninh Hòa & Yến sào Khánh Hòa.",
    chiPhi: "900.000đ - 2.500.000đ / ngày",
    lichTrinh: "Ngày 1: Vãng cảnh Tháp Bà Ponagar - Tắm biển Nha Trang.\nNgày 2: Tour 3 đảo Hòn Mun, Hòn Tằm - Lặn biển.\nNgày 3: Oanh tạc VinWonders - Mua yến sào."
  },
  "ninh thuan": {
    ten: "Tỉnh Ninh Thuận",
    subRegion: "nam_trung_bo", mien: "trung",
    aliases: ["ninh thuan", "vinh hy", "phan rang", "hang rai"],
    anh: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1000",
    moTa: "Nổi tiếng với Vịnh Vĩnh Hy xanh trong kỳ ảo, trang trại đồi cừu, vườn nho trĩu quả và tháp Chăm cổ.",
    thoiDiem: "• Tháng 4 - 8: Mùa nho chín trĩu quả.",
    diemDen: "• Vịnh Vĩnh Hy, Hang Rái kỳ ảo.\n• Đồng cừu An Hòa, Đồi cát Nam Cương.\n• Tháp Po Klong Garai & Vườn nho Thái An.",
    hoatDong: "• Hái nho tươi và uống mật nho tại vườn Thái An.\n• Săn ảnh bình minh thác nước trên biển Hang Rái.",
    dacSan: "• Nho tươi Ninh Thuận & Mật nho.\n• Thịt cừu, thịt dông nướng mỡ hành.",
    chiPhi: "600.000đ - 1.500.000đ / ngày",
    lichTrinh: "Ngày 1: Hang Rái - Vịnh Vĩnh Hy.\nNgày 2: Vườn nho Thái An - Đồng cừu An Hòa - Tháp Chăm.\nNgày 3: Mua mật nho - Trở về."
  },
  "binh thuan": {
    ten: "Tỉnh Bình Thuận (Phan Thiết)",
    subRegion: "nam_trung_bo", mien: "trung",
    aliases: ["binh thuan", "phan thiet", "mui ne", "phu quy", "bau trang"],
    anh: "https://images.unsplash.com/photo-1509233725247-49e657c54213?w=1000",
    moTa: "Thủ phủ Resort Mũi Né nổi tiếng với đồi cát bay mênh mông cùng đảo Phú Quý cực HOT.",
    thoiDiem: "• Quanh năm nắng ấm, đẹp nhất tháng 12 đến tháng 6.",
    diemDen: "• Đồi Cát Bay, Bàu Trắng Mũi Né.\n• Đảo Phú Quý hoang sơ.\n• Hải đăng Keo Gà & Tháp Poshanư.",
    hoatDong: "• Lái xe địa hình ngắm cảnh hồ bãi cát Bàu Trắng.\n• Đi tàu du lịch thám hiểm Đảo Phú Quý.",
    dacSan: "• Lẩu thả Mũi Né ngậy béo.\n• Bánh xèo Phan Thiết & Mực một nắng nướng sa tế.",
    chiPhi: "700.000đ - 1.800.000đ / ngày",
    lichTrinh: "Ngày 1: Phan Thiết - Check-in Bàu Trắng - Mũi Né.\nNgày 2: Trải nghiệm xe địa hình đồi cát - Lược ngắm hoàng hôn.\nNgày 3: Tháp Poshanư - Mua hải sản khô."
  },
  "kon tum": {
    ten: "Tỉnh Kon Tum",
    subRegion: "tay_nguyen", mien: "trung",
    aliases: ["kon tum", "mang den", "nhà thờ gỗ"],
    anh: "https://images.unsplash.com/photo-1511497584788-876761c11969?w=1000",
    moTa: "Sở hữu thị trấn Măng Đen se lạnh - 'Đà Lạt thứ hai' cùng Nhà thờ Gỗ trăm năm tuổi mang đậm nét Tây Nguyên.",
    thoiDiem: "• Tháng 11 - 3: Mùa hoa dã quỳ, hoa mai anh đào nở rộ.",
    diemDen: "• Sinh thái Măng Đen (Hồ Đăk Ke, Thác Pa Sỹ).\n• Nhà thờ Gỗ Kon Tum trăm năm tuổi.\n• Cầu treo Kon Klor.",
    hoatDong: "• Săn mây và chill tại thiên đường Măng Đen.\n• Viếng Nhà thờ Gỗ kiến trúc cổ độc đáo.",
    dacSan: "• Gỏi lá Kon Tum kết hợp 40 loại lá rừng.\n• Cơm lam gà nướng Măng Đen.",
    chiPhi: "500.000đ - 1.200.000đ / ngày",
    lichTrinh: "Ngày 1: TP Kon Tum - Nhà thờ Gỗ - Cầu treo Kon Klor.\nNgày 2: Khám phá thị trấn Măng Đen - Thác Pa Sỹ.\nNgày 3: Hồ Đăk Ke - Mua đặc sản sâm Măng Đen."
  },
  "gia lai": {
    ten: "Tỉnh Gia Lai",
    subRegion: "tay_nguyen", mien: "trung",
    aliases: ["gia lai", "pleiku", "bien ho", "chu dang ya"],
    anh: "https://images.unsplash.com/photo-1448375240586-882707db888b?w=1000",
    moTa: "Phố núi Pleiku lãng mạn sở hữu Biển Hồ T'Nưng xanh veo cùng núi lửa Chư Đăng Ya rực rỡ dã quỳ.",
    thoiDiem: "• Tháng 11 - 2: Mùa hoa dã quỳ nở rực rỡ.",
    diemDen: "• Biển Hồ T'Nưng.\n• Núi lửa Chư Đăng Ya & Chùa Minh Thành.\n• Biển Hồ Chè & Hàng thông trăm tuổi.",
    hoatDong: "• Ngắm cảnh Biển Hồ T'Nưng 'Đôi mắt Pleiku'.\n• Đi dạo dưới hàng thông trăm tuổi tuyệt đẹp.",
    dacSan: "• Phở hai bát Pleiku (Phở khô Gia Lai).\n• Gà sa lửa & Bún mắm nêm Pleiku.",
    chiPhi: "500.000đ - 1.200.000đ / ngày",
    lichTrinh: "Ngày 1: Biển Hồ T'Nưng - Hàng thông trăm tuổi.\nNgày 2: Chùa Minh Thành - Núi lửa Chư Đăng Ya.\nNgày 3: Thưởng thức Phở khô - Trở về."
  },
  "dak lak": {
    ten: "Tỉnh Đắc Lắc",
    subRegion: "tay_nguyen", mien: "trung",
    aliases: ["dak lak", "dac lac", "buon ma thuot", "bmt", "buon don", "dray nur"],
    anh: "https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=1000",
    moTa: "Thủ phủ Cà phê Buôn Ma Thuột đậm bản sắc Tây Nguyên với không gian cồng chiêng và thác nước cuồn cuộn.",
    thoiDiem: "• Tháng 12 - 3: Mùa hoa cà phê nở trắng xóa.",
    diemDen: "• Bảo tàng Thế giới Cà phê.\n• KDL Buôn Đôn & Làng cà phê Trung Nguyên.\n• Cụm thác Dray Nur - Dray Sap.",
    hoatDong: "• Thưởng thức tách cà phê chuẩn vị Buôn Ma Thuột.\n• Chiêm ngưỡng vẻ hùng vĩ của Thác Dray Nur.",
    dacSan: "• Cà phê Buôn Ma Thuột nức tiếng.\n• Bún đỏ Buôn Ma Thuột & Cá lăng sông Sêrêpôk.",
    chiPhi: "600.000đ - 1.400.000đ / ngày",
    lichTrinh: "Ngày 1: Check-in Bảo tàng Cà phê - Buôn Đôn.\nNgày 2: Chinh phục Thác Dray Nur - Dray Sap.\nNgày 3: Làng Cà phê Trung Nguyên - Mua cà phê về."
  },
  "dak nong": {
    ten: "Tỉnh Đắk Nông",
    subRegion: "tay_nguyen", mien: "trung",
    aliases: ["dak nong", "dac nong", "ta dung"],
    anh: "https://images.unsplash.com/photo-1426604966848-d7adac402bff?w=1000",
    moTa: "Sở hữu Hồ Tà Đùng - 'Vịnh Hạ Long trên Tây Nguyên' với hơn 40 đảo lớn nhỏ cùng Hang động núi lửa Krông Nô.",
    thoiDiem: "• Tháng 11 - 4: Mùa tích nước hồ Tà Đùng xanh mướt.",
    diemDen: "• Hồ Tà Đùng ngắm toàn cảnh đảo lớn nhỏ.\n• Thác Liêng Nung hùng vĩ.\n• Công viên địa chất Đắk Nông.",
    hoatDong: "• Ngắm hoàng hôn trên lòng hồ Tà Đùng.\n• Đi thuyền khám phá các hòn đảo nhỏ trên hồ.",
    dacSan: "• Rượu cần Tây Nguyên nồng ấm.\n• Cá lăng nướng than & Lẩu lá rừng.",
    chiPhi: "500.000đ - 1.200.000đ / ngày",
    lichTrinh: "Ngày 1: Check-in Homestay view Hồ Tà Đùng.\nNgày 2: Du thuyền lòng hồ Tà Đùng - Thác Liêng Nung.\nNgày 3: Mua rượu cần - Trở về."
  },
  "lam dong": {
    ten: "Tỉnh Lâm Đồng (Đà Lạt)",
    subRegion: "tay_nguyen", mien: "trung",
    aliases: ["lam dong", "da lat", "dalat", "langbiang", "tuyen lam", "cau dat"],
    anh: "https://images.unsplash.com/photo-1511497584788-876761c11969?w=1000",
    moTa: "Thành phố Đà Lạt mộng mơ - thiên đường nghỉ dưỡng bậc nhất với không khí se lạnh quanh năm, rừng thông và ngàn hoa.",
    thoiDiem: "• Tháng 11 - 3: Mùa mai anh đào, săn mây bồng bềnh.",
    diemDen: "• Hồ Xuân Hương, Hồ Tuyền Lâm.\n• Quảng trường Lâm Viên, Đồi chè Cầu Đất.\n• Thác Datanla & Đỉnh Langbiang.",
    hoatDong: "• Săn mây sáng sớm tại Đồi chè Cầu Đất.\n• Trải nghiệm máng trượt xuyên rừng Datanla.",
    dacSan: "• Lẩu gà lá é thơm nức.\n• Bánh căn xíu mại, Kem bơ béo ngậy & Bánh tráng nướng.",
    chiPhi: "700.000đ - 1.800.000đ / ngày",
    lichTrinh: "Ngày 1: Quảng trường Lâm Viên - Hồ Xuân Hương - Chợ Đêm.\nNgày 2: Săn mây Cầu Đất - Trải nghiệm máng trượt Datanla.\nNgày 3: Thung lũng Tình Yêu - Mua mứt hoa quả về."
  },

  // --- MIỀN NAM (19 TỈNH THÀNH) ---
  "tp.ho chi minh": {
    ten: "Thành phố Hồ Chí Minh",
    subRegion: "dong_nam_bo", mien: "nam",
    aliases: ["tp.ho chi minh", "tp ho chi minh", "ho chi minh", "sai gon", "saigon", "tphcm", "hcm"],
    anh: "https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=1000",
    moTa: "Đô thị 'Thành phố không ngủ' lớn nhất Việt Nam, kết hợp hiện đại sầm uất với các di tích lịch sử và ẩm thực phong phú.",
    thoiDiem: "• Tháng 12 - 4: Mùa khô nắng ấm, rực rỡ.",
    diemDen: "• Tòa nhà Landmark 81, Dinh Độc Lập.\n• Nhà thờ Đức Bà, Bưu điện Thành Phố.\n• Phố đi bộ Nguyễn Huệ & Bus đường sông Waterbus.",
    hoatDong: "• Trải nghiệm xe buýt 2 tầng dạo quanh thành phố.\n• Đi Waterbus ngắm hoàng hôn trên sông Sài Gòn.\n• Quẩy đêm tại Phố Bùi Viện.",
    dacSan: "• Cơm tấm Sài Gòn sườn nướng mật mỡ.\n• Hủ tiếu Nam Vang, Phá lấu vỉa hè & Bánh mì Sài Gòn.",
    chiPhi: "800.000đ - 2.500.000đ / ngày",
    lichTrinh: "Ngày 1: Dinh Độc Lập - Bưu Điện TP - Tối đi Waterbus.\nNgày 2: Landmark 81 - Chợ Bến Thành - Phố Bùi Viện.\nNgày 3: Bảo tàng Chứng tích Chiến tranh - Mua sắm."
  },
  "can tho": {
    ten: "Thành phố Cần Thơ",
    subRegion: "tay_nam_bo", mien: "nam",
    aliases: ["can tho", "cai rang", "ninh kieu", "con son"],
    anh: "https://images.unsplash.com/photo-1528127269322-539801943592?w=1000",
    moTa: "Thủ phủ Miền Tây sông nước nổi tiếng với Chợ nổi Cái Răng, Bến Ninh Kiều lung linh và vườn trái cây trù phú.",
    thoiDiem: "• Tháng 6 - 8: Mùa trái cây chín rộ mọng nước.",
    diemDen: "• Chợ nổi Cái Răng sôi động sáng sớm.\n• Bến Ninh Kiều & Cầu Tình Yêu.\n• Nhà cổ Bình Thủy & Cồn Sơn.",
    hoatDong: "• Đi ghe máy trải nghiệm Chợ nổi Cái Răng lúc 5h sáng.\n• Thưởng thức buffet trái cây tại Cồn Sơn.",
    dacSan: "• Lẩu mắm Cần Thơ thơm ngon chuẩn vị.\n• Bánh xèo củ hủ dừa & Bánh hỏi thịt heo quay.",
    chiPhi: "500.000đ - 1.200.000đ / ngày",
    lichTrinh: "Ngày 1: Bến Ninh Kiều - Nhà cổ Bình Thủy - Tối đi du thuyền Sông Hậu.\nNgày 2: Đi sớm Chợ nổi Cái Răng - Khám phá Cồn Sơn.\nNgày 3: Mua đặc sản Bánh tét lá cẩm - Trở về."
  },
  "ba ria - vung tau": {
    ten: "Tỉnh Bà Rịa - Vũng Tàu",
    subRegion: "dong_nam_bo", mien: "nam",
    aliases: ["ba ria - vung tau", "ba ria vung tau", "vung tau", "con dao"],
    anh: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1000",
    moTa: "Thành phố biển Vũng Tàu nhộn nhịp cùng thiên đường biển ngọc thiêng liêng Côn Đảo hoang sơ.",
    thoiDiem: "• Quanh năm, thuận tiện đi nghỉ dưỡng cuối tuần.",
    diemDen: "• Tượng Chúa Kito Vũng Tàu, Bãi Sau, Bãi Trước.\n• Hải đăng Vũng Tàu & Quần đảo Côn Đảo.",
    hoatDong: "• Leo 1.000 bậc đá lên Tượng Chúa Kito ngắm biển.\n• Đêm viếng Nghĩa trang Hàng Dương Côn Đảo.",
    dacSan: "• Bánh khọt Vũng Tàu giòn rụm tôm tươi.\n• Lẩu cá đuối & Mứt hạt đàng Côn Đảo.",
    chiPhi: "600.000đ - 1.600.000đ / ngày",
    lichTrinh: "Ngày 1: Leo Tượng Chúa Kito - Tắm biển Bãi Sau - Ăn bánh khọt.\nNgày 2: Hải đăng Vũng Tàu - Ngắm hoàng hôn Mũi Nghinh Phong.\nNgày 3: Thưởng thức Lẩu cá đuối - Về lại TP.HCM."
  },
  "binh duong": {
    ten: "Tỉnh Bình Dương",
    subRegion: "dong_nam_bo", mien: "nam",
    aliases: ["binh duong", "dai nam", "lai thieu", "thu dau mot"],
    anh: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1000",
    moTa: "Nổi tiếng với Khu du lịch Đại Nam quy mô hoành tráng, vườn trái cây Lái Thiêu và làng nghề gốm sứ.",
    thoiDiem: "• Tháng 5 - 8: Mùa thu hoạch măng cụt Lái Thiêu.",
    diemDen: "• Khu du lịch Lạc Cảnh Đại Nam Văn Hiến.\n• Chùa Bà Thiên Hậu & Vườn trái cây Lái Thiêu.",
    hoatDong: "• Vui chơi giải trí quy mô tại KDL Đại Nam.\n• Thưởng thức gỏi gà măng cụt tại vườn Lái Thiêu.",
    dacSan: "• Bánh beo bì Chợ Búng thơm bùi.\n• Gỏi gà măng cụt Lái Thiêu & Lẩu bò Bò Tèo.",
    chiPhi: "400.000đ - 1.000.000đ / ngày",
    lichTrinh: "Ngày 1: Tham quan Chùa Bà Thiên Hậu - Ăn Bánh bèo bì.\nNgày 2: Vui chơi cả ngày tại KDL Đại Nam.\nNgày 3: Thưởng thức gỏi gà măng cụt Lái Thiêu."
  },
  "binh phuoc": {
    ten: "Tỉnh Bình Phước",
    subRegion: "dong_nam_bo", mien: "nam",
    aliases: ["binh phuoc", "dong xoai", "ba ra", "bu gia map"],
    anh: "https://images.unsplash.com/photo-1448375240586-882707db888b?w=1000",
    moTa: "Thủ phủ hạt điều Việt Nam với Núi Bà Rá hoang sơ, lòng hồ Thác Mơ lung linh và Vườn quốc gia Bù Gia Mập.",
    thoiDiem: "• Tháng 12 - 4: Mùa khô thích hợp trekking rừng.",
    diemDen: "• Núi Bà Rá đi cáp treo ngoạn cảnh.\n• Vườn quốc gia Bù Gia Mập nguyên sơ.\n• Trảng cỏ Bàu Lách.",
    hoatDong: "• Đi cáp treo lên đỉnh Núi Bà Rá ngắm toàn cảnh.\n• Cắm trại dã ngoại tại Trảng cỏ Bàu Lách.",
    dacSan: "• Hạt điều rang muối Bình Phước.\n• Ve sầu chiên giòn & Đọt mây nướng.",
    chiPhi: "400.000đ - 900.000đ / ngày",
    lichTrinh: "Ngày 1: Cáp treo Núi Bà Rá - Hồ Thác Mơ.\nNgày 2: Cắm trại Trảng cỏ Bàu Lách - Ăn hạt điều."
  },
  "dong nai": {
    ten: "Tỉnh Đồng Nai",
    subRegion: "dong_nam_bo", mien: "nam",
    aliases: ["dong nai", "bien hoa", "tri an", "cat tien", "buu long"],
    anh: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=1000",
    moTa: "Điểm đến trekking Vườn quốc gia Cát Tiên, cắm trại Hồ Trị An chill cùng bãi đá KDL Bửu Long.",
    thoiDiem: "• Tháng 12 - 5: Mùa khô thích hợp trải nghiệm đi rừng.",
    diemDen: "• Vườn quốc gia Cát Tiên ngắm thú đêm.\n• Hồ Trị An & Đảo Ó cắm trại.\n• Khu du lịch Bửu Long (Hạ Long thu nhỏ).",
    hoatDong: "• Xe mui trần đi ngắm thú đêm tại VQG Cát Tiên.\n• Cắm trại chèo SUP ngắm bình minh Hồ Trị An.",
    dacSan: "• Cá lăng sông Đồng Nai nấu lá giang.\n• Gỏi bưởi Tân Triều & Lẩu khổ qua rừng.",
    chiPhi: "400.000đ - 1.000.000đ / ngày",
    lichTrinh: "Ngày 1: KDL Bửu Long - Di chuyển Hồ Trị An cắm trại.\nNgày 2: Trekking Vườn quốc gia Cát Tiên - Xem thú đêm."
  },
  "tay ninh": {
    ten: "Tỉnh Tây Ninh",
    subRegion: "dong_nam_bo", mien: "nam",
    aliases: ["tay ninh", "ba den", "nui ba den", "toa thanh"],
    anh: "https://images.unsplash.com/photo-1519817650390-64a93db51149?w=1000",
    moTa: "Nóc nhà Nam Bộ 'Núi Bà Đen' cao 986m săn mây tuyệt đẹp cùng kiến trúc Tòa Thánh Tây Ninh độc đáo.",
    thoiDiem: "• Tháng 1 - 3 âm lịch: Mùa hội xuân Núi Bà Đen.",
    diemDen: "• Quần thể Cáp treo Núi Bà Đen ngắm tượng Phật Bà.\n• Tòa Thánh Tây Ninh kiến trúc Đạo Cao Đài.\n• Hồ Dầu Tiếng & Ma Thiên Lãnh.",
    hoatDong: "• Đi cáp treo hiện đại lên đỉnh Núi Bà Đen săn mây.\n• Chiêm bái Tòa Thánh Tây Ninh rực rỡ sắc màu.",
    dacSan: "• Bánh tráng phơi sương Trảng Bàng cuốn thịt luộc.\n• Muối tôm Tây Ninh trứ danh & Bánh canh Trảng Bàng.",
    chiPhi: "500.000đ - 1.100.000đ / ngày",
    lichTrinh: "Ngày 1: Đi cáp treo Núi Bà Đen - Tham quan Tòa Thánh.\nNgày 2: Hồ Dầu Tiếng - Mua Bánh tráng & Muối tôm về."
  },
  "an giang": {
    ten: "Tỉnh An Giang",
    subRegion: "tay_nam_bo", mien: "nam",
    aliases: ["an giang", "chau doc", "tra su", "long xuyen", "nui sam"],
    anh: "https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=1000",
    moTa: "Rừng tràm Trà Sư xanh mướt bèo tấm, vùng đất Thất Sơn huyền bí và Miếu Bà Chúa Xứ Núi Sam.",
    thoiDiem: "• Tháng 9 - 11: Mùa nước nổi rừng tràm đẹp nhất.",
    diemDen: "• Rừng tràm Trà Sư đi xuồng ba lá.\n• Miếu Bà Chúa Xứ Núi Sam Châu Đốc.\n• Núi Cấm (Cấm Sơn) & Hồ Tà Pạ.",
    hoatDong: "• Đi xuồng ba lá xuyên rừng tràm Trà Sư xanh mướt.\n• Viếng cầu tài lộc Miếu Bà Chúa Xứ Châu Đốc.",
    dacSan: "• Lẩu mắm Châu Đốc & Các loại mắm cá.\n• Bánh bò thốt nốt béo ngậy & Gà đốt Ô Thum.",
    chiPhi: "500.000đ - 1.200.000đ / ngày",
    lichTrinh: "Ngày 1: Châu Đốc - Miếu Bà Chúa Xứ - Hồ Tà Pạ.\nNgày 2: Rừng tràm Trà Sư - Ăn Gà đốt Ô Thum.\nNgày 3: Mua mắm Châu Đốc - Trở về."
  },
  "bac lieu": {
    ten: "Tỉnh Bạc Liêu",
    subRegion: "tay_nam_bo", mien: "nam",
    aliases: ["bac lieu", "cong ty bac lieu", "quat gio bac lieu"],
    anh: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=1000",
    moTa: "Gắn liền với giai thoại Công tử Bạc Liêu, nhạc sĩ Cao Văn Lầu và Cánh đồng quạt gió ven biển cực Chill.",
    thoiDiem: "• Quanh năm, tiết trời nắng ấm chan hòa.",
    diemDen: "• Nhà Công tử Bạc Liêu cổ kính.\n• Cánh đồng điện gió Bạc Liêu.\n• Chùa Xiêm Cán kiến trúc Khmer.",
    hoatDong: "• Check-in cánh đồng điện gió khổng lồ trên biển.\n• Thăm biệt thự nhà Công tử Bạc Liêu.",
    dacSan: "• Bánh tằm nước cốt dừa Bạc Liêu.\n• Lẩu mắm & Bún nước lèo Bạc Liêu.",
    chiPhi: "450.000đ - 1.000.000đ / ngày",
    lichTrinh: "Ngày 1: Nhà Công tử Bạc Liêu - Cánh đồng điện gió.\nNgày 2: Chùa Xiêm Cán - Khu lưu niệm Cao Văn Lầu."
  },
  "ben tre": {
    ten: "Tỉnh Bến Tre",
    subRegion: "tay_nam_bo", mien: "nam",
    aliases: ["ben tre", "con phung", "lan vuong"],
    anh: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1000",
    moTa: "Xứ sở Dừa xanh rợp bóng mát, mang đậm chất sinh thái miệt vườn với trải nghiệm chèo xuồng rạch dừa nước.",
    thoiDiem: "• Tháng 6 - 8: Mùa trái cây miệt vườn xum xuê.",
    diemDen: "• Cồn Phụng, Cồn Quy.\n• Vườn trái cây Cái Mơn Chợ Lách.\n• Khu du lịch Lan Vương dã ngoại.",
    hoatDong: "• Chèo xuồng ba lá trong rạch dừa nước.\n• Mặc áo bà ba tát mương bắt cá tại KDL Lan Vương.",
    dacSan: "• Kẹo dừa Bến Tre dẻo béo thơm.\n• Cơm hấp trái dừa & Đuông dừa tắm nước mắm.",
    chiPhi: "400.000đ - 900.000đ / ngày",
    lichTrinh: "Ngày 1: Cù lao Cồn Phụng - Chèo xuồng dừa nước.\nNgày 2: KDL Lan Vương trải nghiệm trò chơi dân gian - Mua kẹo dừa."
  },
  "ca mau": {
    ten: "Tỉnh Cà Mau",
    subRegion: "tay_nam_bo", mien: "nam",
    aliases: ["ca mau", "dat mui", "u minh", "u minh ha"],
    anh: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1000",
    moTa: "Mảnh đất Đất Mũi tận cùng cực Nam Tổ quốc, nơi có mốc tọa độ GPS 0001 giữa bạt ngàn rừng đước U Minh.",
    thoiDiem: "• Tháng 12 - 4: Mùa khô di chuyển đường sông nước thuận lợi.",
    diemDen: "• Mũi Cà Mau & Cột cờ Hà Nội tại Đất Mũi.\n• Vườn quốc gia U Minh Hạ.\n• Hòn Đá Bạc & Đầm Thị Tường.",
    hoatDong: "• Check-in cột mốc tọa độ quốc gia GPS 0001 cực Nam.\n• Đi ca nô Xuyên rừng đước Đất Mũi.",
    dacSan: "• Cua Cà Mau chắc thịt gạch son.\n• Cá thòi lòi nướng muối ớt & Mắm ba khía.",
    chiPhi: "600.000đ - 1.300.000đ / ngày",
    lichTrinh: "Ngày 1: TP Cà Mau - Đi ca nô ra Đất Mũi Cà Mau - Mốc GPS 0001.\nNgày 2: VQG U Minh Hạ - Đầm Thị Tường - Ăn Cua Cà Mau."
  },
  "dong thap": {
    ten: "Tỉnh Đồng Tháp",
    subRegion: "tay_nam_bo", mien: "nam",
    aliases: ["dong thap", "sa dec", "cao lanh", "tram chim", "xeo quyt"],
    anh: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=1000",
    moTa: "Đất Sen Hồng rực rỡ với Làng hoa Sa Đéc hàng trăm năm tuổi, Khu sinh thái Xẻo Quýt và Đồng sen Tháp Mười.",
    thoiDiem: "• Tháng 12: Mùa hoa Sa Đéc nở đón Tết.\n• Tháng 9 - 11: Mùa nước nổi ngắm hoa sen.",
    diemDen: "• Làng hoa kiểng Sa Đéc.\n• Khu du lịch sinh thái Xẻo Quýt & Tràm Chim.\n• Đồng sen Tháp Mười.",
    hoatDong: "• Đi xuồng chèo ngắm hoa sen Đồng Tháp Mười.\n• Săn ảnh sếu đầu đỏ tại VQG Tràm Chim.",
    dacSan: "• Hủ tiếu Sa Đéc dai ngọt nước dùng.\n• Nem Lai Vung chua ngọt & Các món chế biến từ Sen.",
    chiPhi: "450.000đ - 1.000.000đ / ngày",
    lichTrinh: "Ngày 1: Làng hoa Sa Đéc - KDL Xẻo Quýt.\nNgày 2: Đồng sen Tháp Mười - VQG Tràm Chim - Mua Nem Lai Vung."
  },
  "hau giang": {
    ten: "Tỉnh Hậu Giang",
    subRegion: "tay_nam_bo", mien: "nam",
    aliases: ["hau giang", "vi thanh", "lung ngoc hoang"],
    anh: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=1000",
    moTa: "Mảnh đất sông nước êm đềm nổi tiếng với Lung Ngọc Hoàng - 'lá phổi xanh' Miền Tây cùng đặc sản Khóm Cầu Đúc.",
    thoiDiem: "• Tháng 9 - 11: Mùa nước nổi sinh thái thanh bình.",
    diemDen: "• Khu bảo tồn thiên nhiên Lung Ngọc Hoàng.\n• Chợ nổi Ngã Bảy (Phụng Hiệp).\n• Công viên Giải trí Kittydangoo.",
    hoatDong: "• Khám phá vùng đất hoang sơ Lung Ngọc Hoàng bằng xuồng.\n• Mua sắm khóm Cầu Đúc ngọt lịm.",
    dacSan: "• Chả cá thát lát Hậu Giang dai ngon.\n• Khóm Cầu Đúc ngọt lịm & Lẩu mắm.",
    chiPhi: "400.000đ - 900.000đ / ngày",
    lichTrinh: "Ngày 1: Lung Ngọc Hoàng - Chợ nổi Ngã Bảy.\nNgày 2: Công viên Kittydangoo - Mua chả cá thát lát."
  },
  "kien giang": {
    ten: "Tỉnh Kiên Giang (Phú Quốc)",
    subRegion: "tay_nam_bo", mien: "nam",
    aliases: ["kien giang", "phu quoc", "phuquoc", "rach gia", "ha tien", "hon thom", "grand world"],
    anh: "https://images.unsplash.com/photo-1540206395-68808572332f?w=1000",
    moTa: "Đảo Ngọc Phú Quốc - Thiên đường nghỉ dưỡng tầm cỡ quốc tế với bãi cát trắng mịn, nước biển trong suốt.",
    thoiDiem: "• Tháng 11 - 4: Mùa khô Phú Quốc biển sóng êm, nắng đẹp.",
    diemDen: "• Bãi Sao, Bãi Kem, Bãi Dài.\n• Grand World, VinWonders, Safari Phú Quốc.\n• Sunset Town & Cáp treo Hòn Thơm vượt biển.",
    hoatDong: "• Ngắm hoàng hôn tuyệt đẹp tại Sunset Sanato / Sunset Town.\n• Đi cáp treo vượt biển dài nhất thế giới sang Hòn Thơm.",
    dacSan: "• Gỏi cá trích Phú Quốc tươi ngon.\n• Bún quậy Kiến Xây & Rượu sim rừng, Nước mắm Phú Quốc.",
    chiPhi: "1.200.000đ - 3.800.000đ / ngày",
    lichTrinh: "Ngày 1: Check-in Grand World 'Thành phố không ngủ'.\nNgày 2: Tour 4 đảo lặn ngắm san hô - Cáp treo Hòn Thơm.\nNgày 3: Safari Phú Quốc - Bãi Sao - Ăn Bún quậy."
  },
  "long an": {
    ten: "Tỉnh Long An",
    subRegion: "tay_nam_bo", mien: "nam",
    aliases: ["long an", "tan an", "tan lap", "phuoc loc tho"],
    anh: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1000",
    moTa: "Cửa ngõ kết nối TP.HCM với Miền Tây sông nước sở hữu Làng nổi Tân Lập rợp bóng rừng tràm ngút ngàn.",
    thoiDiem: "• Tháng 9 - 11: Mùa nước nổi đi thuyền xuyên rừng tràm.",
    diemDen: "• Khu du lịch sinh thái Làng nổi Tân Lập.\n• Làng cổ Phước Lộc Thọ.\n• Cánh đồng thuốc Đồng Tháp Mười.",
    hoatDong: "• Đi bộ trên con đường xuyên rừng tràm Tân Lập dài 5km.\n• Tham quan không gian Làng cổ Phước Lộc Thọ.",
    dacSan: "• Lạp xưởng tươi Long An.\n• Bánh tét Long An & Thanh long Châu Thành.",
    chiPhi: "350.000đ - 800.000đ / ngày",
    lichTrinh: "Ngày 1: Check-in Làng nổi Tân Lập - Đi xuồng xuồng.\nNgày 2: Làng cổ Phước Lộc Thọ - Mua lạp xưởng tươi."
  },
  "soc trang": {
    ten: "Tỉnh Sóc Trăng",
    subRegion: "tay_nam_bo", mien: "nam",
    aliases: ["soc trang", "chua doi", "som rong", "chen kieu"],
    anh: "https://images.unsplash.com/photo-1519817650390-64a93db51149?w=1000",
    moTa: "Xứ sở giao thoa văn hóa Kinh - Khmer - Hoa với những ngôi chùa Khmer kiến trúc dát vàng nguy nga.",
    thoiDiem: "• Tháng 10 - 11 âm lịch: Lễ hội Ok Om Bok & Đua ghe Ngo.",
    diemDen: "• Chùa Dơi (Chùa Mahatup).\n• Chùa Chén Kiểu (Chùa Sà Lôn).\n• Chùa Som Rong dát vàng hoành tráng & Cồn Mỹ Phước.",
    hoatDong: "• Ngắm nhìn hàng ngàn con dơi tự nhiên ở Chùa Dơi.\n• Check-in Tượng Phật nằm khổng lồ Chùa Som Rong.",
    dacSan: "• Bánh pía Sóc Trăng dẻo thơm sầu riêng.\n• Bún nước lèo Sóc Trăng & Bánh cống.",
    chiPhi: "400.000đ - 900.000đ / ngày",
    lichTrinh: "Ngày 1: Chùa Dơi - Chùa Som Rong - Chùa Chén Kiểu.\nNgày 2: Cồn Mỹ Phước - Thưởng thức bún nước lèo & Mua bánh pía."
  },
  "tien giang": {
    ten: "Tỉnh Tiền Giang",
    subRegion: "tay_nam_bo", mien: "nam",
    aliases: ["tien giang", "my tho", "thoi son", "vinh trang"],
    anh: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1000",
    moTa: "Vùng đất miệt vườn trù phú ven Sông Tiền nổi tiếng với Cù lao Thới Sơn và Chùa Vĩnh Tràng cổ kính.",
    thoiDiem: "• Tháng 5 - 8: Mùa trái cây miệt vườn chín rộ.",
    diemDen: "• Cù lao Thới Sơn.\n• Chùa Vĩnh Tràng cổ kính.\n• Chợ nổi Cái Bè & Biển Tân Thành.",
    hoatDong: "• Nghe đờn ca tài tử và ăn trái cây tại Cù Lao Thới Sơn.\n• Trải nghiệm lội mương bắt cá sông nước.",
    dacSan: "• Hủ tiếu Mỹ Tho đậm đà.\n• Vú sữa Lò Rèn Vĩnh Kim & Bánh vá Chợ Gạo.",
    chiPhi: "400.000đ - 950.000đ / ngày",
    lichTrinh: "Ngày 1: Chùa Vĩnh Tràng - Tour Cù Lao Thới Sơn nghe đờn ca tài tử.\nNgày 2: Chợ nổi Cái Bè - Biển Tân Thành ngắm nghêu."
  },
  "tra vinh": {
    ten: "Tỉnh Trà Vinh",
    subRegion: "tay_nam_bo", mien: "nam",
    aliases: ["tra vinh", "ao ba om", "chua hang", "ba dong"],
    anh: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1000",
    moTa: "Thành phố rợp bóng cây cổ thụ trăm năm, danh thắng Ao Bà Om mát rượi và nền văn hóa Khmer độc đáo.",
    thoiDiem: "• Tháng 4 (Tết Chôl Chnăm Thmây) hoặc Tháng 10 âm lịch.",
    diemDen: "• Danh thắng Ao Bà Om rợp bóng cây cổ thụ.\n• Chùa Hang (Chùa Kom Pong Chray).\n• Biển Ba Động & Cù lao Long Trị.",
    hoatDong: "• Trải nghiệm dạo mát dưới rặng cây cổ thụ Ao Bà Om.\n• Thưởng thức Dừa sáp đặc sản hiếm có.",
    dacSan: "• Dừa sáp Cầu Kè béo ngậy.\n• Bún nước lèo Trà Vinh & Bánh tét Trà Cuôn.",
    chiPhi: "400.000đ - 900.000đ / ngày",
    lichTrinh: "Ngày 1: Ao Bà Om - Chùa Hang - Tối ăn bún nước lèo.\nNgày 2: Biển Ba Động - Thưởng thức Dừa sáp Cầu Kè."
  },
  "vinh long": {
    ten: "Tỉnh Vĩnh Long",
    subRegion: "tay_nam_bo", mien: "nam",
    aliases: ["vinh long", "mang thit", "an binh"],
    anh: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=1000",
    moTa: "Nổi tiếng với Vương quốc gạch gốm đỏ Mang Thít trăm năm bên sông và thiên đường miệt vườn Cù lao An Bình.",
    thoiDiem: "• Tháng 5 - 8: Mùa thu hoạch trái cây chôm chôm, nhãn.",
    diemDen: "• Làng gốm đỏ Mang Thít.\n• Cù lao An Bình ghé vườn trái cây.\n• Chùa Tiên Châu cổ kính.",
    hoatDong: "• Tham quan và chụp ảnh làng lò gạch gốm đỏ Mang Thít.\n• Đạp xe dạo quanh miệt vườn Cù Lao An Bình.",
    dacSan: "• Cá tai tượng chiên xù xối mỡ giòn tan.\n• Bưởi Năm Roi Mỹ Hòa & Khoai lang Bình Tân.",
    chiPhi: "400.000đ - 950.000đ / ngày",
    lichTrinh: "Ngày 1: Check-in Làng gốm đỏ Mang Thít - Chùa Tiên Châu.\nNgày 2: Tour Cù lao An Bình hái trái cây tươi - Trở về."
  }
};

// =========================================================================
// 4. DIALOGFLOW WEBHOOK ROUTER THÔNG MINH (XƯNG HÔ TÔI - BẠN CHUYÊN NGHIỆP)
// =========================================================================

app.post('/', (req, res) => {
  const queryResult = req.body.queryResult || {};
  const rawQuery = queryResult.queryText || '';
  const queryNorm = loaiBoDau(rawQuery);

  // 4.1 Menu Chính / Reset / Chào hỏi
  if (/\b(menu|bat dau|reset|xin chao|hi|hello|menu chinh)\b/.test(queryNorm)) {
    return res.json({
      fulfillmentMessages: [
        {
          text: {
            text: [
              `🤖 **TRỢ LÝ DU LỊCH VIỆT NAM (bot_travel)**\n\n` +
              `Xin chào bạn! Tôi là bot_travel - Trợ lý tư vấn du lịch thông minh. Tôi luôn sẵn sàng hỗ trợ bạn tra cứu đầy đủ thông tin về điểm đến, đặc sản ẩm thực, trải nghiệm nổi bật, dự toán chi phí và lịch trình tham quan chi tiết cho trọn bộ **63 tỉnh thành** trên khắp Việt Nam.\n\n` +
              `👉 **Xin vui lòng chọn danh mục hoặc khu vực bạn muốn khám phá bên dưới:**`
            ]
          }
        },
        {
          quickReplies: {
            title: "👇 Chọn danh mục khám phá:",
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

  // 4.2 Nút "Quay lại" (Back Button)
  if (/\b(quay lai|back|tro ve)\b/.test(queryNorm)) {
    return res.json({
      fulfillmentMessages: [
        {
          text: {
            text: [
              `⬅️ **QUAY LẠI MENU KHÁM PHÁ**\n\n` +
              `Xin vui lòng chọn khu vực hoặc chủ đề du lịch tiếp theo mà bạn muốn tra cứu:`
            ]
          }
        },
        {
          quickReplies: {
            title: "👇 Chọn danh mục tiếp theo:",
            quickReplies: [
              "Miền Bắc",
              "Miền Trung",
              "Miền Nam",
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

  // 4.3 Phân chia vùng miền lớn sang tiểu vùng
  if (queryNorm === "mien bac" || queryNorm.includes("mien bac")) {
    return res.json({
      fulfillmentMessages: [
        {
          text: {
            text: [
              `🗺️ **DANH MỤC KHU VỰC MIỀN BẮC (25 TỈNH THÀNH)**\n\n` +
              `Xin vui lòng chọn Tiểu Vùng bên dưới để tra cứu danh sách tỉnh thành tương ứng:`
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
              "⬅️ Quay lại",
              "Menu Chính"
            ]
          }
        }
      ]
    });
  }

  if (queryNorm === "mien trung" || queryNorm.includes("mien trung")) {
    return res.json({
      fulfillmentMessages: [
        {
          text: {
            text: [
              `🗺️ **DANH MỤC KHU VỰC MIỀN TRUNG & TÂY NGUYÊN (19 TỈNH THÀNH)**\n\n` +
              `Xin vui lòng chọn Tiểu Vùng bên dưới để tiếp tục:`
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
              "⬅️ Quay lại",
              "Menu Chính"
            ]
          }
        }
      ]
    });
  }

  if (queryNorm === "mien nam" || queryNorm.includes("mien nam")) {
    return res.json({
      fulfillmentMessages: [
        {
          text: {
            text: [
              `🗺️ **DANH MỤC KHU VỰC MIỀN NAM (19 TỈNH THÀNH)**\n\n` +
              `Xin vui lòng chọn Tiểu Vùng bên dưới để tiếp tục:`
            ]
          }
        },
        {
          quickReplies: {
            title: "👇 Chọn tiểu vùng Miền Nam:",
            quickReplies: [
              "Đông Nam Bộ (6 tỉnh)",
              "Tây Nam Bộ / Miền Tây (13 tỉnh)",
              "⬅️ Quay lại",
              "Menu Chính"
            ]
          }
        }
      ]
    });
  }

  // 4.4 Xử lý nút chọn tiểu vùng
  for (const subKey in subRegionKeywords) {
    const keywords = subRegionKeywords[subKey];
    if (keywords.some(kw => queryNorm.includes(kw))) {
      const provinceList = danhSachSubRegions[subKey];
      return res.json({
        fulfillmentMessages: [
          {
            text: {
              text: [
                `📍 **DỮ LIỆU VÙNG ${subKey.toUpperCase().replace(/_/g, ' ')} (${provinceList.length} TỈNH THÀNH)**\n\n` +
                `Bạn vui lòng chọn tỉnh thành muốn tra cứu thông tin du lịch:`
              ]
            }
          },
          {
            quickReplies: {
              title: "👇 Chọn Tỉnh Thành:",
              quickReplies: [...provinceList, "⬅️ Quay lại", "Menu Chính"]
            }
          }
        ]
      });
    }
  }

  // 4.5 Tìm kiếm Tỉnh/Thành chính xác, qua Aliases hoặc Fuzzy Match
  let matchedProvinceKey = null;
  let highestScore = 0;

  for (const key in duLieu63TinhThanh) {
    const tinhObj = duLieu63TinhThanh[key];
    const keyNorm = loaiBoDau(key);
    const tenNorm = loaiBoDau(tinhObj.ten);
    const aliases = (tinhObj.aliases || []).map(loaiBoDau);

    // Kiểm tra trùng khớp trực tiếp hoặc qua từ khóa viết tắt/địa danh quen thuộc
    const isDirectMatch =
      queryNorm.includes(keyNorm) ||
      keyNorm.includes(queryNorm) ||
      queryNorm.includes(tenNorm) ||
      aliases.some(alias => queryNorm.includes(alias) || alias.includes(queryNorm));

    if (isDirectMatch) {
      matchedProvinceKey = key;
      highestScore = 1.0;
      break;
    }

    // Fuzzy matching dự phòng nếu gõ sai chính tả
    for (const target of [keyNorm, tenNorm, ...aliases]) {
      const distance = levenshteinDistance(queryNorm, target);
      const similarity = 1 - (distance / Math.max(queryNorm.length, target.length));
      if (similarity > highestScore && similarity >= 0.55) {
        highestScore = similarity;
        matchedProvinceKey = key;
      }
    }
  }

  // 4.6 TRẢ VỀ CẨM NANG DU LỊCH CHI TIẾT KHI TÌM THẤY TỈNH/THÀNH
  if (matchedProvinceKey) {
    const province = duLieu63TinhThanh[matchedProvinceKey];
    return res.json({
      fulfillmentMessages: [
        {
          text: {
            text: [
              `🌐 **CẨM NANG DU LỊCH: ${province.ten.toUpperCase()}**\n\n` +
              `✨ **Tổng quan điểm đến:**\n${province.moTa}\n\n` +
              `🗓️ **Thời điểm du lịch lý tưởng:**\n${province.thoiDiem}\n\n` +
              `🏛️ **Địa điểm tham quan nổi bật:**\n${province.diemDen}\n\n` +
              `🎡 **Trải nghiệm không thể bỏ qua:**\n${province.hoatDong}\n\n` +
              `🍲 **Ẩm thực & Đặc sản trứ danh:**\n${province.dacSan}\n\n` +
              `💰 **Dự toán chi phí tham khảo:** ${province.chiPhi}\n\n` +
              `🗺️ **Gợi ý lịch trình chi tiết (3N2Đ):**\n${province.lichTrinh}`
            ]
          }
        },
        {
          image: {
            imageUri: province.anh,
            accessibilityText: `Hình ảnh cảnh đẹp du lịch tại ${province.ten}`
          }
        },
        {
          quickReplies: {
            title: "👇 Bạn có muốn xem thêm gợi ý khác?",
            quickReplies: [
              "Gợi ý Phượt Mạo Hiểm",
              "Gợi ý Nghỉ Dưỡng Biển",
              "Gợi ý Foodtour Ẩm Thực",
              "⬅️ Quay lại",
              "Menu Chính"
            ]
          }
        }
      ]
    });
  }

  // 4.7 Xử lý Nút Gợi Ý Chủ Đề (khi không nhắc đến tỉnh thành cụ thể)
  if (queryNorm.includes("phuot") || queryNorm.includes("mao hiem")) {
    return res.json({
      fulfillmentMessages: [
        {
          text: {
            text: [
              `🏍️ **GỢI Ý PHƯỢT & MẠO HIỂM HÀNG ĐẦU VIỆT NAM**\n\n` +
              `Dưới đây là các điểm đến phượt hàng đầu tôi tổng hợp dành cho bạn:\n\n` +
              `1. **Hà Giang:** Chinh phục đèo Mã Pí Lèng & Chèo thuyền Sông Nho Quế.\n` +
              `2. **Quảng Bình:** Thám hiểm hệ thống hang động Phong Nha - Kẻ Bàng.\n` +
              `3. **Sơn La (Tà Xùa):** Săn mây cuồn cuộn trên sống lưng khủng long.\n` +
              `4. **Yên Bái (Mù Cang Chải):** Nhảy dù lượn 'Bay trên mùa vàng'.\n` +
              `5. **Cao Bằng:** Ngắm thác Bản Giốc hùng vĩ vùng biên cương.\n\n` +
              `👇 Bạn vui lòng chọn tỉnh thành bên dưới để xem cẩm nang chi tiết:`
            ]
          }
        },
        {
          quickReplies: {
            title: "👇 Chọn tỉnh phượt mạo hiểm:",
            quickReplies: ["Hà Giang", "Quảng Bình", "Sơn La", "Yên Bái", "Cao Bằng", "⬅️ Quay lại", "Menu Chính"]
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
              `🏖️ **GỢI Ý THIÊN ĐƯỜNG NGHỈ DƯỠNG BIỂN ĐẢO**\n\n` +
              `Dưới đây là những thiên đường nghỉ dưỡng hàng đầu dành cho bạn:\n\n` +
              `1. **Kiên Giang (Phú Quốc):** Đảo Ngọc biển xanh trong suốt & Sunset Town.\n` +
              `2. **Đà Nẵng:** Bãi biển Mỹ Khê top thế giới & Bà Nà Hills.\n` +
              `3. **Khánh Hòa (Nha Trang):** Vịnh biển thiên đường giải trí & Tắm bùn.\n` +
              `4. **Bình Định (Quy Nhơn):** Biển Kỳ Co & Hoàng hôn Eo Gió.\n` +
              `5. **Lâm Đồng (Đà Lạt):** Nghỉ dưỡng núi rừng không khí se lạnh.\n\n` +
              `👇 Bạn vui lòng chọn tỉnh thành bên dưới để xem cẩm nang chi tiết:`
            ]
          }
        },
        {
          quickReplies: {
            title: "👇 Chọn tỉnh nghỉ dưỡng:",
            quickReplies: ["Kiên Giang", "Đà Nẵng", "Khánh Hòa", "Bình Định", "Lâm Đồng", "⬅️ Quay lại", "Menu Chính"]
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
              `🍲 **GỢI Ý THIÊN ĐƯỜNG FOODTOUR ẨM THỰC**\n\n` +
              `Dưới đây là các tọa độ ẩm thực nổi tiếng tôi gợi ý cho bạn:\n\n` +
              `1. **Hải Phòng:** Bánh đa cua, Bánh mì que, Dừa dầm.\n` +
              `2. **Hà Nội:** Phở Bát Đàn, Bún chả Hàng Mành, Cà phê trứng.\n` +
              `3. **Thừa Thiên Huế:** Bún bò Huế gốc, Bánh bèo, Nậm, Lọc, Cơm hến.\n` +
              `4. **TP. Hồ Chí Minh:** Cơm tấm sườn nướng, Hủ tiếu Nam Vang, Phá lấu.\n` +
              `5. **Cần Thơ:** Lẩu mắm, Bánh xèo củ hủ dừa, Bánh hỏi thịt quay.\n\n` +
              `👇 Bạn vui lòng chọn thành phố bên dưới để xem chi tiết danh mục ẩm thực:`
            ]
          }
        },
        {
          quickReplies: {
            title: "👇 Chọn thành phố ẩm thực:",
            quickReplies: ["Hải Phòng", "Hà Nội", "Thừa Thiên Huế", "TP. Hồ Chí Minh", "Cần Thơ", "⬅️ Quay lại", "Menu Chính"]
          }
        }
      ]
    });
  }

  // 4.8 FALLBACK LỊCH SỰ, CHUYÊN NGHIỆP KÈM GỢI Ý
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
            `🧐 **TRỢ LÝ TƯ VẤN DU LỊCH:**\n\n` +
            `Tôi chưa tìm thấy thông tin chính xác theo từ khóa bạn vừa nhập.\n\n` +
            `Có phải bạn đang quan tâm đến một trong các địa danh nổi tiếng bên dưới không? Xin vui lòng chọn nút bấm nhanh để tôi gửi thông tin chi tiết đến bạn:`
          ]
        }
      },
      {
        quickReplies: {
          title: "👇 Chọn gợi ý hoặc quay lại:",
          quickReplies: [...closestGuesses.slice(0, 3), "Miền Bắc", "Miền Trung", "Miền Nam", "⬅️ Quay lại", "Menu Chính"]
        }
      }
    ]
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 [bot_travel WEBHOOK SERVER READY] Port ${PORT}`);
});
