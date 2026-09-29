/**
 * WEBPACK HOÀN CHỈNH: BOT DU LỊCH VIỆT NAM THÔNG MINH (FULL 63 TỈNH THÀNH)
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
  "tay_nguyen": ["Kon Tum", "Gia Lai", "Đắk Lắk", "Đắk Nông", "Lâm Đồng"],
  "dong_nam_bo": ["TP. Hồ Chí Minh", "Bà Rịa - Vũng Tàu", "Bình Dương", "Bình Phước", "Đồng Nai", "Tây Ninh"],
  "tay_nam_bo": ["Cần Thơ", "An Giang", "Bạc Liêu", "Bến Tre", "Cà Mau", "Đồng Tháp", "Hậu Giang", "Kiên Giang", "Long An", "Sóc Trăng", "Tiền Giang", "Trà Vinh", "Vĩnh Long"]
};

// =========================================================================
// 3. DATABASE TRỌN BỘ 63 TỈNH THÀNH (NỘI DUNG CHI TIẾT - HÌNH ĐẸP KHÔNG CHỮ)
// =========================================================================

const duLieu63TinhThanh = {
  // --- MIỀN BẮC (25 TỈNH) ---
  "ha noi": {
    ten: "Thủ đô Hà Nội",
    subRegion: "dong_bang_sh", mien: "bac",
    anh: "https://images.unsplash.com/photo-1509030450996-93f2e3d84298?w=1000",
    moTa: "Mảnh đất nghìn năm văn hiến cổ kính, nơi đan xen giữa nét bình yên thơ mộng của 36 phố phường rêu phong và nhịp sống hiện đại, tinh tế.",
    thoiDiem: "• Tháng 9 - 11: Mùa thu Hà Nội đẹp nhất năm với nắng vàng dịu, gió heo mây và hương hoa sữa nồng nàn.\n• Tháng 3: Mùa hoa sưa, hoa ban nở rộ khắp các góc phố.",
    diemDen: "• Hồ Hoàn Kiếm & Đền Ngọc Sơn: Trái tim tâm linh giữa lòng thủ đô.\n• Văn Miếu Quốc Tử Giám: Trường đại học đầu tiên lưu giữ tinh hoa đạo học.\n• Hoàng Thành Thăng Long: Di sản thế giới mang dấu ấn lịch sử hàng nghìn năm.\n• Phố cổ Hà Nội: Cung đường lưu giữ kiến trúc Pháp cổ và ẩm thực vỉa hè độc đáo.",
    dacSan: "• Phở Hà Nội: Nước dùng thanh ngọt ninh từ xương, quyện hương vị thảo mộc.\n• Bún chả Hàng Mành: Chả nướng than hoa thơm lừng chấm nước mắm chua ngọt.\n• Cà phê trứng Giảng: Vị béo ngậy của trứng đánh bông hòa quyện cà phê đậm đà.",
    chiPhi: "800.000đ - 1.800.000đ / ngày"
  },
  "ha giang": {
    ten: "Tỉnh Hà Giang",
    subRegion: "tay_bac", mien: "bac",
    anh: "https://images.unsplash.com/photo-1528127269322-539801943592?w=1000",
    moTa: "Thiên đường hoang sơ nơi địa đầu Tổ quốc, mê hoặc du khách bởi những dãy núi đá tai mèo sừng sững, các con đèo hiểm trở và sắc hoa rực rỡ.",
    thoiDiem: "• Tháng 9 - 10: Mùa lúa chín vàng óng rực rỡ trên ruộng bậc thang Hoàng Su Phì.\n• Tháng 10 - 12: Mùa hoa tam giác mạch phủ hồng khắp các sườn núi cao nguyên đá.",
    diemDen: "• Đèo Mã Pí Lèng: Một trong 'Tứ đại đỉnh đèo' hùng vĩ bậc nhất Việt Nam.\n• Sông Nho Quế & Hẻm Tu Sản: Trải nghiệm đi thuyền trên dòng nước xanh ngọc bích chẻ đôi vách đá.\n• Cột cờ Lũng Cú: Điểm cực Bắc thiêng liêng với lá cờ đỏ sao vàng tung bay trên đỉnh núi Rồng.\n• Phố cổ Đồng Văn: Không gian trình tường cổ kính của đồng bào H'Mông, Tày, Hoa.",
    dacSan: "• Bánh cuốn canh Đồng Văn: Bánh tráng mỏng mềm chấm nước dùng ninh xương ngọt thanh.\n• Cháo tẩu tẩu: Món cháo giải cảm bổ dưỡng với vị đắng nhẹ đặc trưng.\n• Thịt trâu gác bếp & Rượu ngô Men Lá: Hương vị đậm đà nguyên bản vùng cao.",
    chiPhi: "1.000.000đ - 2.200.000đ / ngày"
  },
  "lao cai": {
    ten: "Tỉnh Lào Cai (Sa Pa)",
    subRegion: "tay_bac", mien: "bac",
    anh: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1000",
    moTa: "Thị trấn sương mờ bồng bềnh giữa mây ngàn, nơi sở hữu đỉnh Fansipan hoành tráng và bản làng mộc mạc.",
    thoiDiem: "• Tháng 9 - 10: Mùa lúa chín vàng rực trên thung lũng Mường Hoa.\n• Tháng 12 - 1: Cơ hội săn tuyết rơi và băng giá hiếm có.",
    diemDen: "• Đỉnh Fansipan: Nóc nhà Đông Dương hùng vĩ ngập tràn mây trắng.\n• Bản Cát Cát: Bản làng dân tộc H'Mông thơ mộng bên suối chảy róc rách.\n• Đèo Ô Quy Hồ: Điểm ngắm hoàng hôn rực rỡ nhất vùng núi Tây Bắc.",
    dacSan: "• Lẩu cá hồi, cá tầm Sa Pa: Hải sản vùng lạnh tươi ngon ngọt thịt.\n• Thắng cố Mường Khuương: Món ăn truyền thống đậm đà gia vị núi rừng.",
    chiPhi: "900.000đ - 2.500.000đ / ngày"
  },
  "quang ninh": {
    ten: "Tỉnh Quảng Ninh",
    subRegion: "dong_bac", mien: "bac",
    anh: "https://images.unsplash.com/photo-1552353617-3bfd679b3bdd?w=1000",
    moTa: "Kỳ quan thiên nhiên thế giới Vịnh Hạ Long với hàng ngàn đảo đá vôi kỳ vĩ soi bóng xuống làn nước xanh ngọc bích.",
    thoiDiem: "• Tháng 4 - 8: Mùa hè rực rỡ, hoàn hảo cho du thuyền, tắm biển và chèo thuyền Kayak.",
    diemDen: "• Vịnh Hạ Long & Vịnh Bái Tử Long: Kỳ quan thế giới với hang Sửng Sốt, đảo Ti Tốp.\n• Danh thắng Yên Tử: Đất tổ Phật giáo Trúc Lâm không gian tĩnh lặng, linh thiêng.\n• Đảo Cô Tô & Quan Lạn: Những bãi biển hoang sơ, cát trắng mịn tuyệt đẹp.",
    dacSan: "• Chả mực giã tay Hạ Long: Giòn sần sật, đậm đà hương vị biển.\n• Cà sáy Tiên Yên & Gật gù Tiên Yên: Món ăn dân dã nức tiếng vùng đông bắc.",
    chiPhi: "1.200.000đ - 3.500.000đ / ngày"
  },
  "ninh binh": {
    ten: "Tỉnh Ninh Bình",
    subRegion: "dong_bang_sh", mien: "bac",
    anh: "https://images.unsplash.com/photo-1509030450996-93f2e3d84298?w=1000",
    moTa: "Cố đô Hoa Lư cổ kính, nơi có quần thể di sản thế giới Tràng An với những dòng sông uốn lượn qua lòng hang đá vôi.",
    thoiDiem: "• Tháng 1 - 3: Mùa lễ hội Xuân thanh bình, tiết trời mát mẻ.\n• Tháng 5 - 6: Mùa lúa chín vàng rực hai bên dòng sông Ngô Đồng (Tam Cốc).",
    diemDen: "• Quần thể danh thắng Tràng An: Đi thuyền xuyên qua các hang động kỳ ảo.\n• Hang Múa: Leo 500 bậc đá ngắm trọn vẹn thung lũng lúa Tam Cốc từ trên cao.\n• Chùa Bái Đính: Ngôi chùa lớn nhất Việt Nam sở hữu nhiều kỷ lục kỷ niệm.",
    dacSan: "• Thịt dê núi Ninh Bình: Thịt săn chắc, thơm ngon chế biến tái chanh hay nướng.\n• Cơm cháy chà bông: Giòn tan chấm cùng sốt thịt sóng sánh.",
    chiPhi: "700.000đ - 1.500.000đ / ngày"
  },
  "cao bang": {
    ten: "Tỉnh Cao Bằng",
    subRegion: "dong_bac", mien: "bac",
    anh: "https://images.unsplash.com/photo-1599707303381-807c42749419?w=1000",
    moTa: "Vùng đất biên kim sở hữu Thác Bản Giốc - Thác nước tự nhiên đường biên giới đẹp nhất Đông Nam Á.",
    thoiDiem: "• Tháng 8 - 10: Mùa nước đổ xanh trong và lúa chín vàng rực dưới chân thác.",
    diemDen: "• Thác Bản Giốc: Bức tranh thiên nhiên ngút ngàn dòng nước trắng xóa.\n• Động Ngườm Ngao: Hang động vôi kỳ ảo với muôn hình thạch nhũ tự nhiên.\n• Khu di tích Pắc Bó & Suối Lê Nin: Dòng suối xanh trong như ngọc bích.",
    dacSan: "• Bánh cuốn Cao Bằng: Ăn kèm nước canh ninh xương thơm mùi hành phi.\n• Vịt quay 7 vị & Phở chua: Hương vị đặc trưng đậm đà khó quên.",
    chiPhi: "700.000đ - 1.600.000đ / ngày"
  },
  "dien bien": {
    ten: "Tỉnh Điện Biên",
    subRegion: "tay_bac", mien: "bac",
    anh: "https://images.unsplash.com/photo-1599707303381-807c42749419?w=1000",
    moTa: "Mảnh đất lịch sử lừng lẫy chiến công Điện Biên Phủ và vẻ đẹp núi rừng Tây Bắc mùa hoa ban.",
    thoiDiem: "• Tháng 3: Mùa hoa ban nở trắng xóa các sườn đồi.\n• Tháng 5: Dịp kỷ niệm chiến thắng lịch sử Điện Biên Phủ.",
    diemDen: "• Bảo tàng Chiến thắng Điện Biên Phủ & Đồi A1, Hầm De Castries.\n• Cực Tây A Pa Chải: Nơi một tiếng gà gáy cả ba nước đều nghe.",
    dacSan: "• Pa pỉnh tộp (Cá gập nướng): Món ăn truyền thống của người Thái.\n• Thịt trâu gác bếp & Sâu chít Điện Biên.",
    chiPhi: "600.000đ - 1.400.000đ / ngày"
  },
  "son la": {
    ten: "Tỉnh Sơn La (Mộc Châu)",
    subRegion: "tay_bac", mien: "bac",
    anh: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1000",
    moTa: "Cao nguyên Mộc Châu xanh ngát đồi chè, nơi có khí hậu mát mẻ quanh năm và đỉnh Tà Xùa săn mây huyền ảo.",
    thoiDiem: "• Tháng 1 - 2: Mùa hoa mận, hoa đào nở trắng muốt thung lũng.\n• Tháng 9 - 11: Mùa săn mây Tà Xùa bồng bềnh tuyệt đẹp.",
    diemDen: "• Cao nguyên Mộc Châu: Đồi chè trái tim, Thác Dải Yếm, Cầu kính Bạch Long.\n• Đỉnh Tà Xùa: Thiên đường săn mây bồng bềnh quanh năm.",
    dacSan: "• Bê chao Mộc Châu: Thịt bê mềm ngọt thơm lừng hương gừng tỏi.\n• Sữa tươi Mộc Châu & Bánh sữa ngậy béo.",
    chiPhi: "700.000đ - 1.600.000đ / ngày"
  },
  "yen bai": {
    ten: "Tỉnh Yên Bái (Mù Cang Chải)",
    subRegion: "tay_bac", mien: "bac",
    anh: "https://images.unsplash.com/photo-1528127269322-539801943592?w=1000",
    moTa: "Danh thắng quốc gia Mù Cang Chải với những công trình kiến trúc ruộng bậc thang đẹp như bức tranh vẽ.",
    thoiDiem: "• Tháng 9 - 10: Mùa vàng lúa chín mộng mơ khắp nẻo đường danh thắng.",
    diemDen: "• Đồi Mâm Xôi & Đồi Móng Ngựa: Những khuôn hình ruộng bậc thang đỉnh cao.\n• Đèo Khau Phạ: Trải nghiệm nhảy dù lượn 'Bay trên mùa vàng'.",
    dacSan: "• Cốm Tú Lệ: Hạt cốm dẻo thơm ngậy vị nếp nương.\n• Thịt sấy & Rượu táo mèo thơm nức.",
    chiPhi: "700.000đ - 1.500.000đ / ngày"
  },
  "hoa binh": {
    ten: "Tỉnh Hòa Bình (Mai Châu)",
    subRegion: "dong_bac", mien: "bac",
    anh: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1000",
    moTa: "Thung lũng Mai Châu bình yên, nơi hòa quyện nét văn hóa Thái đặc sắc và lòng hồ Hòa Bình xanh mát.",
    thoiDiem: "• Tháng 10 - Tháng 4 năm sau: Mùa khô mát mẻ, lý tưởng nghỉ dưỡng.",
    diemDen: "• Bản Lác & Bản Poom Coọng: Trải nghiệm lưu trú nhà sàn truyền thống.\n• Hồ Hòa Bình: Chèo sub, đi thuyền ngoạn cảnh vịnh trên núi.",
    dacSan: "• Cơm lam gà nướng: Cơm nếp nương thơm dẻo chấm muối vừng.\n• Cá sông Đà nướng lá chuối thơm nức.",
    chiPhi: "600.000đ - 1.400.000đ / ngày"
  },
  "lai chau": {
    ten: "Tỉnh Lai Châu",
    subRegion: "tay_bac", mien: "bac",
    anh: "https://images.unsplash.com/photo-1599707303381-807c42749419?w=1000",
    moTa: "Mảnh đất sở hữu những đỉnh núi cao bậc nhất Việt Nam như Putaleng, Pusilung dành cho dân trekking.",
    thoiDiem: "• Tháng 9 - 11: Mùa trekking núi cao săn mây rực rỡ.",
    diemDen: "• Cầu kính Rồng May & Đèo Ô Quy Hồ đỉnh cao phiêu lưu.\n• Bản Sin Suối Hồ: Bản du lịch cộng đồng tuyệt đẹp.",
    dacSan: "• Lợn cắp nách nướng nguyên con & Rượu ngô ngâm thảo mộc.",
    chiPhi: "700.000đ - 1.700.000đ / ngày"
  },
  "lang son": {
    ten: "Tỉnh Lạng Sơn",
    subRegion: "dong_bac", mien: "bac",
    anh: "https://images.unsplash.com/photo-1509030450996-93f2e3d84298?w=1000",
    moTa: "Mảnh đất biên giới nổi tiếng với danh thắng Chùa Tam Thanh, đỉnh Mẫu Sơn tuyết phủ và mua sắm cửa khẩu.",
    thoiDiem: "• Tháng 12 - 1: Săn băng giá trên đỉnh Mẫu Sơn.",
    diemDen: "• Động Tam Thanh, Đỉnh Mẫu Sơn, Ải Chi Lăng lịch sử.",
    dacSan: "• Vịt quay Lạng Sơn da giòn béo ngậy & Khâu nhục đậm đà.",
    chiPhi: "500.000đ - 1.300.000đ / ngày"
  },
  "bac kan": {
    ten: "Tỉnh Bắc Kạn",
    subRegion: "dong_bac", mien: "bac",
    anh: "https://images.unsplash.com/photo-1509030450996-93f2e3d84298?w=1000",
    moTa: "Sở hữu Hồ Ba Bể - Một trong 20 hồ nước ngọt tự nhiên lớn nhất thế giới giữa rừng nguyên sinh.",
    thoiDiem: "• Tháng 5 - 9: Thời tiết mát mẻ, hồ nước trong xanh.",
    diemDen: "• Hồ Ba Bể, Động Puông, Thác Đầu Đẳng hoang sơ.",
    dacSan: "• Cá nướng Hồ Ba Bể & Tôm chua béo ngậy.",
    chiPhi: "500.000đ - 1.200.000đ / ngày"
  },
  "tuyen quang": {
    ten: "Tỉnh Tuyên Quang",
    subRegion: "dong_bac", mien: "bac",
    anh: "https://images.unsplash.com/photo-1509030450996-93f2e3d84298?w=1000",
    moTa: "Thủ đô khu giải phóng ATK lịch sử và Lễ hội Trung thu quy mô nhất Việt Nam.",
    thoiDiem: "• Tháng 8 âm lịch: Đêm hội Trung thu rực rỡ sắc màu.",
    diemDen: "• Khu di tích Tân Trào, Hồ Na Hang - Lâm Bình thơ mộng.",
    dacSan: "• Thịt lợn đen Na Hang & Mắm cá ruộng Chiêm Hóa.",
    chiPhi: "500.000đ - 1.100.000đ / ngày"
  },
  "thai nguyen": {
    ten: "Tỉnh Thái Nguyên",
    subRegion: "dong_bac", mien: "bac",
    anh: "https://images.unsplash.com/photo-1509030450996-93f2e3d84298?w=1000",
    moTa: "Đệ nhất danh trà Việt Nam với những đồi chè Tân Cương xanh mút tầm mắt.",
    thoiDiem: "• Quanh năm, đẹp nhất tháng 9 - 12.",
    diemDen: "• Đồi chè Tân Cương, Hồ Núi Cốc, Khu di tích ATK Định Hóa.",
    dacSan: "• Trà Tân Cương thơm đượm hậu ngọt & Bánh chưng Bờm.",
    chiPhi: "450.000đ - 1.000.000đ / ngày"
  },
  "phu tho": {
    ten: "Tỉnh Phú Thọ",
    subRegion: "dong_bac", mien: "bac",
    anh: "https://images.unsplash.com/photo-1509030450996-93f2e3d84298?w=1000",
    moTa: "Đất Tổ Hùng Vương thiêng liêng cội nguồn dân tộc và Đồi chè Long Cốc ảo diệu.",
    thoiDiem: "• Tháng 3 âm lịch: Giỗ Tổ Hùng Vương trang nghiêm.",
    diemDen: "• Khu di tích lịch sử Đền Hùng, Đồi chè Long Cốc nức tiếng.",
    dacSan: "• Thịt chua Thanh Sơn & Bưởi Đoan Hùng ngọt thanh.",
    chiPhi: "500.000đ - 1.100.000đ / ngày"
  },
  "bac giang": {
    ten: "Tỉnh Bắc Giang",
    subRegion: "dong_bac", mien: "bac",
    anh: "https://images.unsplash.com/photo-1509030450996-93f2e3d84298?w=1000",
    moTa: "Thủ phủ vải thiều Lục Ngạn ngọt lịm và danh thắng Tây Yên Tử thanh tịnh.",
    thoiDiem: "• Tháng 6: Mùa thu hoạch vải thiều đỏ rực.",
    diemDen: "• Tây Yên Tử, Chùa Vĩnh Nghiêm lưu giữ mộc bản di sản.",
    dacSan: "• Vải thiều Lục Ngạn & Bánh đa Kế giòn rụm.",
    chiPhi: "400.000đ - 1.000.000đ / ngày"
  },
  "vinh phuc": {
    ten: "Tỉnh Vĩnh Phúc (Tam Đảo)",
    subRegion: "dong_bang_sh", mien: "bac",
    anh: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1000",
    moTa: "Thị trấn Tam Đảo trong mây - Đà Lạt thu nhỏ của miền Bắc với không khí 4 mùa trong 1 ngày.",
    thoiDiem: "• Quanh năm, lý tưởng đi trốn cuối tuần.",
    diemDen: "• Thị trấn Tam Đảo, Hồ Đại Lải, Thiền viện Trúc Lâm Tây Thiên.",
    dacSan: "• Ngọn su su xào tỏi giòn ngọt & Gà đồi nướng đất sét.",
    chiPhi: "600.000đ - 1.600.000đ / ngày"
  },
  "bac ninh": {
    ten: "Tỉnh Bắc Ninh",
    subRegion: "dong_bang_sh", mien: "bac",
    anh: "https://images.unsplash.com/photo-1509030450996-93f2e3d84298?w=1000",
    moTa: "Nôi văn hóa Kinh Bắc xao xuyến những điệu Dân ca Quan họ ngọt ngào.",
    thoiDiem: "• Tháng 1 - 3 âm lịch: Mùa lễ hội xuân Kinh Bắc.",
    diemDen: "• Chùa Phật Tích, Chùa Dâu cổ nhất Việt Nam, Đền Đô.",
    dacSan: "• Bánh phu thê Đình Bảng & Nem Bùi truyền thống.",
    chiPhi: "400.000đ - 900.000đ / ngày"
  },
  "hai duong": {
    ten: "Tỉnh Hải Dương",
    subRegion: "dong_bang_sh", mien: "bac",
    anh: "https://images.unsplash.com/photo-1509030450996-93f2e3d84298?w=1000",
    moTa: "Xứ Đông văn hiến nơi lưu giữ quần thể di tích danh thắng Côn Sơn - Kiếp Bạc.",
    thoiDiem: "• Tháng 1 - 3 & Tháng 8 âm lịch hội xuân, hội thu.",
    diemDen: "• Côn Sơn - Kiếp Bạc, Đảo Cò Chi Lăng Nam xanh mát.",
    dacSan: "• Bánh đậu xanh Hải Dương & Bánh gai Ninh Giang.",
    chiPhi: "400.000đ - 900.000đ / ngày"
  },
  "hai phong": {
    ten: "Thành phố Hải Phòng",
    subRegion: "dong_bang_sh", mien: "bac",
    anh: "https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=1000",
    moTa: "Thành phố Hoa Phượng Đỏ sôi động nổi tiếng với thiên đường Foodtour và Đảo Cát Bà xanh mát.",
    thoiDiem: "• Tháng 4 - 8: Tắm biển Cát Bà.\n• Quanh năm: Foodtour ẩm thực phố phường.",
    diemDen: "• Quần đảo Cát Bà & Vịnh Lan Hạ: Lặn san hô, chèo kayak.\n• Tuyến Foodtour phố cổ Hải Phòng rực rỡ món ngon.",
    dacSan: "• Bánh đa cua Hải Phòng đậm đà vị riêu cua đồng.\n• Bánh mì que cay & Dừa dầm béo ngậy.",
    chiPhi: "600.000đ - 1.700.000đ / ngày"
  },
  "hung yen": {
    ten: "Tỉnh Hưng Yên",
    subRegion: "dong_bang_sh", mien: "bac",
    anh: "https://images.unsplash.com/photo-1509030450996-93f2e3d84298?w=1000",
    moTa: "Thương cảng Phố Hiến sầm uất nổi tiếng một thời 'Thứ nhất Kinh Kỳ, thứ nhì Phố Hiến'.",
    thoiDiem: "• Tháng 7 - 8: Mùa nhãn lồng chín rộ.",
    diemDen: "• Phố Hiến cổ kính, Chùa Chuông, Văn Miếu Xích Đằng.",
    dacSan: "• Nhãn lồng Hưng Yên ngọt mọng & Bún thang lợn Phố Hiến.",
    chiPhi: "350.000đ - 800.000đ / ngày"
  },
  "ha nam": {
    ten: "Tỉnh Hà Nam",
    subRegion: "dong_bang_sh", mien: "bac",
    anh: "https://images.unsplash.com/photo-1509030450996-93f2e3d84298?w=1000",
    moTa: "Điểm đến tâm linh nổi tiếng sở hữu Quần thể du lịch Chùa Tam Chúc lớn nhất thế giới.",
    thoiDiem: "• Tháng 1 - 3 âm lịch mùa hành hương.",
    diemDen: "• Chùa Tam Chúc, Chùa Địa Tạng Phi Lai Tự tĩnh lặng.",
    dacSan: "• Cá kho làng Vũ Đại & Bánh cuốn Phủ Lý nóng hổi.",
    chiPhi: "500.000đ - 1.200.000đ / ngày"
  },
  "nam dinh": {
    ten: "Tỉnh Nam Định",
    subRegion: "dong_bang_sh", mien: "bac",
    anh: "https://images.unsplash.com/photo-1509030450996-93f2e3d84298?w=1000",
    moTa: "Vùng đất thánh đường kiến trúc nhà thờ Công giáo tráng lệ và ẩm thực Phở Bò gốc.",
    thoiDiem: "• Quanh năm, đặc biệt dịp Giáng Sinh náo nhiệt.",
    diemDen: "• Nhà thờ đổ Hải Lý, Tòa giám mục Bùi Chu, Đền Trần.",
    dacSan: "• Phở bò Nam Định chuẩn vị gốc & Bánh xíu báo thơm lừng.",
    chiPhi: "400.000đ - 1.000.000đ / ngày"
  },
  "thai binh": {
    ten: "Tỉnh Thái Bình",
    subRegion: "dong_bang_sh", mien: "bac",
    anh: "https://images.unsplash.com/photo-1509030450996-93f2e3d84298?w=1000",
    moTa: "Quê hương lúa nước bình yên với bãi biển vô cực Quang Lang độc đáo.",
    thoiDiem: "• Tháng 5 - 9: Săn bình minh bãi biển vô cực.",
    diemDen: "• Biển vô cực Quang Lang, Chùa Keo cổ kính độc đáo.",
    dacSan: "• Bánh cáy Thái Bình & Canh cá quỳnh cừ đậm vị.",
    chiPhi: "400.000đ - 900.000đ / ngày"
  },

  // --- MIỀN TRUNG & TÂY NGUYÊN (19 TỈNH) ---
  "thanh hoa": {
    ten: "Tỉnh Thanh Hóa",
    subRegion: "bac_trung_bo", mien: "trung",
    anh: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=1000",
    moTa: "Biển Sầm Sơn nhộn nhịp hòa cùng không gian sinh thái xanh ngắt tại khu bảo tồn Pù Luông.",
    thoiDiem: "• Tháng 5 - 8: Tắm biển Sầm Sơn.\n• Tháng 9 - 10: Ngắm ruộng bậc thang Pù Luông.",
    diemDen: "• Biển Sầm Sơn & Bãi Đông hoang sơ.\n• Khu bảo tồn thiên nhiên Pù Luông xanh ngát.\n• Di sản thế giới Thành Nhà Hồ.",
    dacSan: "• Nem chua Thanh Hóa giòn sần sật, chua ngọt trọn vị.\n• Chả tôm Nướng & Bánh cuốn Thanh Hóa.",
    chiPhi: "600.000đ - 1.600.000đ / ngày"
  },
  "nghe an": {
    ten: "Tỉnh Nghệ An",
    subRegion: "bac_trung_bo", mien: "trung",
    anh: "https://images.unsplash.com/photo-1552353617-3bfd679b3bdd?w=1000",
    moTa: "Quê hương Bác Hồ kính yêu, sở hữu bãi biển Cửa Lò sầm uất và đồi chè Thanh Chương rợp xanh.",
    thoiDiem: "• Tháng 5 - 8: Tắm biển Cửa Lò mát rượi.",
    diemDen: "• Khu di tích Kim Liên (Quê Bác).\n• Biển Cửa Lò & Đồi chè ốc đảo Thanh Chương.",
    dacSan: "• Súp lươn Nghệ An ăn kèm bánh mì giòn tan.\n• Nhút Thanh Chương & Tương Nam Đàn.",
    chiPhi: "500.000đ - 1.300.000đ / ngày"
  },
  "ha tinh": {
    ten: "Tỉnh Hà Tĩnh",
    subRegion: "bac_trung_bo", mien: "trung",
    anh: "https://images.unsplash.com/photo-1552353617-3bfd679b3bdd?w=1000",
    moTa: "Mảnh đất lịch sử thiêng liêng Ngã ba Đồng Lộc và biển Thiên Cầm trong xanh êm đềm.",
    thoiDiem: "• Tháng 4 - 8: Mùa biển Thiên Cầm tuyệt đẹp.",
    diemDen: "• KDT Ngã ba Đồng Lộc, Biển Thiên Cầm, Chùa Hương Tích.",
    dacSan: "• Kẹo Cu Đơ Hà Tĩnh & Bánh ram mướt dẻo thơm.",
    chiPhi: "450.000đ - 1.100.000đ / ngày"
  },
  "quang binh": {
    ten: "Tỉnh Quảng Bình",
    subRegion: "bac_trung_bo", mien: "trung",
    anh: "https://images.unsplash.com/photo-1599707303381-807c42749419?w=1000",
    moTa: "Vương quốc hang động thế giới Phong Nha - Kẻ Bàng kỳ vĩ mê hoặc giới phiêu lưu mạo hiểm.",
    thoiDiem: "• Tháng 4 - 8: Mùa thám hiểm hang động lý tưởng nhất.",
    diemDen: "• Động Phong Nha, Động Thiên Đường, Hang Sơn Đoòng.\n• Sông Chày - Hang Tối: Zipline và chèo thuyền Kayak.",
    dacSan: "• Cháo canh Quảng Bình & Lẩu cá khoai nóng hổi.",
    chiPhi: "900.000đ - 3.000.000đ / ngày"
  },
  "quang tri": {
    ten: "Tỉnh Quảng Trị",
    subRegion: "bac_trung_bo", mien: "trung",
    anh: "https://images.unsplash.com/photo-1552353617-3bfd679b3bdd?w=1000",
    moTa: "Mảnh đất anh hùng ghi dấu lịch sử Đôi bờ Hiền Lương - Bến Hải và Địa đạo Vịnh Mốc.",
    thoiDiem: "• Tháng 4 - 8: Mùa nắng đẹp khô ráo.",
    diemDen: "• Thành cổ Quảng Trị, Địa đạo Vịnh Mốc, Cầu Hiền Lương.",
    dacSan: "• Thịt trâu lá trơảng & Bánh lọc Mỹ Chánh.",
    chiPhi: "500.000đ - 1.200.000đ / ngày"
  },
  "thua thien hue": {
    ten: "Tỉnh Thừa Thiên Huế",
    subRegion: "bac_trung_bo", mien: "trung",
    anh: "https://images.unsplash.com/photo-1552353617-3bfd679b3bdd?w=1000",
    moTa: "Cố đô hoài cổ dịu dàng bên dòng Sông Hương thơ mộng, lưu giữ trọn vẹn di sản triều Nguyễn.",
    thoiDiem: "• Tháng 1 - 4: Tiết trời dịu mát, không mưa.",
    diemDen: "• Đại Nội Huế, Chùa Thiên Mụ, Lăng Khải Định, Lăng Tự Đức.\n• Trải nghiệm nghe Ca Huế trên dòng Sông Hương.",
    dacSan: "• Bún bò Huế đậm đà chuẩn vị gốc.\n• Cơm hến, Bánh bèo, Bánh nậm, Bánh lọc tinh tế.",
    chiPhi: "500.000đ - 1.400.000đ / ngày"
  },
  "da nang": {
    ten: "Thành phố Đà Nẵng",
    subRegion: "nam_trung_bo", mien: "trung",
    anh: "https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=1000",
    moTa: "Thành phố đáng sống nhất Việt Nam sở hữu Cầu Vàng Bà Nà Hills và bãi biển Mỹ Khê quyến rũ.",
    thoiDiem: "• Tháng 3 - 8: Thời tiết nắng ấm, bãi biển lặng sóng rực rỡ.",
    diemDen: "• Sun World Bà Nà Hills: Cầu Vàng chạm mây & Làng Pháp.\n• Bãi biển Mỹ Khê: Top bãi biển đẹp nhất hành tinh.\n• Cầu Rồng phun lửa & Phun nước đêm cuối tuần.",
    dacSan: "• Mì Quảng Đà Nẵng & Bánh tráng cuốn thịt heo 2 đầu da.\n• Hải sản tươi sống nướng mỡ hành đậm đà.",
    chiPhi: "800.000đ - 2.200.000đ / ngày"
  },
  "quang nam": {
    ten: "Tỉnh Quảng Nam (Hội An)",
    subRegion: "nam_trung_bo", mien: "trung",
    anh: "https://images.unsplash.com/photo-1552353617-3bfd679b3bdd?w=1000",
    moTa: "Phố cổ Hội An đèn lồng rực rỡ lung linh bên sông Hoài và Di sản thế giới Thánh địa Mỹ Sơn.",
    thoiDiem: "• Tháng 2 - 7: Tiết trời khô ráo nắng đẹp.",
    diemDen: "• Phố cổ Hội An: Thả đèn hoa đăng đêm rằm.\n• Thánh địa Mỹ Sơn cổ kính & Đảo Cù Lao Chàm xanh mát.",
    dacSan: "• Cao lầu Hội An, Bánh mì Phượng nức tiếng.\n• Cơm gà Hội An thơm dẻo.",
    chiPhi: "700.000đ - 1.800.000đ / ngày"
  },
  "quang ngai": {
    ten: "Tỉnh Quảng Ngãi",
    subRegion: "nam_trung_bo", mien: "trung",
    anh: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=1000",
    moTa: "Thiên đường biển đảo Đảo Lý Sơn với những trầm tích núi lửa hàng triệu năm.",
    thoiDiem: "• Tháng 4 - 8: Biển êm rực rỡ nắng vàng.",
    diemDen: "• Đảo Lý Sơn, Cổng Tụ Vò, Đỉnh Thới Lới hùng vĩ.",
    dacSan: "• Tỏi cô đơn Lý Sơn & Don Quảng Ngãi đậm vị.",
    chiPhi: "600.000đ - 1.400.000đ / ngày"
  },
  "binh dinh": {
    ten: "Tỉnh Bình Định (Quy Nhơn)",
    subRegion: "nam_trung_bo", mien: "trung",
    anh: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=1000",
    moTa: "Quy Nhơn - Thiên đường biển xanh cát trắng với Kỳ Co, Eo Gió thơ mộng.",
    thoiDiem: "• Tháng 3 - 8: Mùa biển xanh nắng vàng rực rỡ.",
    diemDen: "• Eo Gió, Bãi biển Kỳ Co, Tháp Bánh Ít Chăm Pa.",
    dacSan: "• Bánh hỏi lòng heo Quy Nhơn & Bánh xèo tôm nhảy.",
    chiPhi: "700.000đ - 1.600.000đ / ngày"
  },
  "phu yen": {
    ten: "Tỉnh Phú Yên",
    subRegion: "nam_trung_bo", mien: "trung",
    anh: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=1000",
    moTa: "Xứ sở hoa vàng trên cỏ xanh với kiệt tác tự nhiên Ghềnh Đá Đĩa độc nhất vô nhị.",
    thoiDiem: "• Tháng 3 - 8: Nắng đẹp khô ráo.",
    diemDen: "• Ghềnh Đá Đĩa, Mũi Điện đón bình minh đầu tiên, Bãi Xếp.",
    dacSan: "• Mắt cá ngừ đại dương hầm thuốc bắc & Sò huyết Đầm O Loan.",
    chiPhi: "600.000đ - 1.400.000đ / ngày"
  },
  "khanh hoa": {
    ten: "Tỉnh Khánh Hòa (Nha Trang)",
    subRegion: "nam_trung_bo", mien: "trung",
    anh: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=1000",
    moTa: "Thành phố biển Nha Trang sôi động với một trong những vịnh biển đẹp nhất thế giới.",
    thoiDiem: "• Tháng 1 - 8: Tiết trời chan hòa nắng ấm.",
    diemDen: "• VinWonders Nha Trang, Đảo Hòn Mun lặn ngắm san hô, Tháp Bà Ponagar.",
    dacSan: "• Bún cá Nha Trang, Nem nướng Ninh Hòa & Yến sào.",
    chiPhi: "900.000đ - 2.500.000đ / ngày"
  },
  "ninh thuan": {
    ten: "Tỉnh Ninh Thuận",
    subRegion: "nam_trung_bo", mien: "trung",
    anh: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=1000",
    moTa: "Vùng đất nắng gió độc đáo sở hữu Vịnh Vĩnh Hy xanh ngọc và những vườn nho trút quả.",
    thoiDiem: "• Tháng 4 - 8: Mùa nho chín và biển Vĩnh Hy trong vắt.",
    diemDen: "• Vịnh Vĩnh Hy, Hang Rái, Đồi cát Nam Cương, Đồng cừu An Hòa.",
    dacSan: "• Nho tươi Ninh Thuận & Thịt cừu/dông nướng mỡ hành.",
    chiPhi: "600.000đ - 1.500.000đ / ngày"
  },
  "binh thuan": {
    ten: "Tỉnh Bình Thuận (Phan Thiết)",
    subRegion: "nam_trung_bo", mien: "trung",
    anh: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=1000",
    moTa: "Thủ phủ Resort Mũi Né và thiên đường hoang sơ Đảo Phú Quý mê hoặc giới trẻ.",
    thoiDiem: "• Quanh năm, đẹp nhất tháng 12 - tháng 6.",
    diemDen: "• Đồi Cát Bay, Bàu Trắng sa mạc thu nhỏ, Đảo Phú Quý hoang sơ.",
    dacSan: "• Bánh xèo Phan Thiết & Lẩu thả Mũi Né đậm đà.",
    chiPhi: "700.000đ - 1.800.000đ / ngày"
  },
  "kon tum": {
    ten: "Tỉnh Kon Tum",
    subRegion: "tay_nguyen", mien: "trung",
    anh: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1000",
    moTa: "Thị trấn Măng Đen se lạnh thơ mộng được ví như Đà Lạt thứ hai của Tây Nguyên.",
    thoiDiem: "• Tháng 11 - 3: Mùa hoa dã quỳ và mai anh đào nở.",
    diemDen: "• KDL Măng Đen, Nhà thờ Gỗ Kon Tum cổ kính trăm năm.",
    dacSan: "• Gỏi lá Kon Tum 40 loại lá rừng & Cơm lam gà nướng.",
    chiPhi: "500.000đ - 1.200.000đ / ngày"
  },
  "gia lai": {
    ten: "Tỉnh Gia Lai",
    subRegion: "tay_nguyen", mien: "trung",
    anh: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1000",
    moTa: "Phố núi Pleiku sở hữu Đôi mắt Pleiku 'Biển Hồ T'Nưng' xanh trong veo phẳng lặng.",
    thoiDiem: "• Tháng 11 - 2: Mùa hoa dã quỳ rực rỡ khắp núi đồi.",
    diemDen: "• Biển Hồ T'Nưng, Núi lửa Chư Đăng Ya, Chùa Minh Thành.",
    dacSan: "• Phở hai bát Pleiku (Phở khô) & Gà sa lửa.",
    chiPhi: "500.000đ - 1.200.000đ / ngày"
  },
  "dak lak": {
    ten: "Tỉnh Đắk Lắk",
    subRegion: "tay_nguyen", mien: "trung",
    anh: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1000",
    moTa: "Thủ phủ cà phê Buôn Ma Thuột đậm đà bản sắc núi rừng Tây Nguyên.",
    thoiDiem: "• Tháng 12 - 3: Mùa hoa cà phê nở trắng đồi núi.",
    diemDen: "• Bảo tàng Thế giới Cà phê, Buôn Đôn, Cụm thác Dray Nur.",
    dacSan: "• Cà phê Buôn Ma Thuột & Bún đỏ Buôn Ma Thuột.",
    chiPhi: "600.000đ - 1.400.000đ / ngày"
  },
  "dak nong": {
    ten: "Tỉnh Đắk Nông",
    subRegion: "tay_nguyen", mien: "trung",
    anh: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1000",
    moTa: "Sở hữu Hồ Tà Đùng - Vịnh Hạ Long thu nhỏ trên cao nguyên ngợp mắt đảo xanh.",
    thoiDiem: "• Tháng 11 - 4: Mùa tích nước hồ đẹp nhất.",
    diemDen: "• Hồ Tà Đùng, Thác Liêng Nung, Hang động núi lửa Krông Nô.",
    dacSan: "• Rượu cần Tây Nguyên & Cá lăng sông Sêrêpôk.",
    chiPhi: "500.000đ - 1.200.000đ / ngày"
  },
  "lam dong": {
    ten: "Tỉnh Lâm Đồng (Đà Lạt)",
    subRegion: "tay_nguyen", mien: "trung",
    anh: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1000",
    moTa: "Đà Lạt ngàn hoa mộng mơ, điểm nghỉ dưỡng thơ mộng bậc nhất Việt Nam với khí hậu se lạnh quanh năm.",
    thoiDiem: "• Tháng 11 - 3: Mùa hoa mai anh đào & săn mây bồng bềnh.",
    diemDen: "• Hồ Xuân Hương, Đồi chè Cầu Đất, Thác Datanla, Quảng trường Lâm Viên.",
    dacSan: "• Lẩu gà lá é, Bánh căn xíu mại & Kem bơ béo ngậy.",
    chiPhi: "700.000đ - 1.800.000đ / ngày"
  },

  // --- MIỀN NAM (19 TỈNH) ---
  "tp.ho chi minh": {
    ten: "Thành phố Hồ Chí Minh",
    subRegion: "dong_nam_bo", mien: "nam",
    anh: "https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=1000",
    moTa: "Đô thị 'Thành phố không ngủ' sôi động, hiện đại bậc nhất Việt Nam hòa quyện nét ẩm thực đa dạng.",
    thoiDiem: "• Tháng 12 - 4: Mùa khô nắng ấm rực rỡ.",
    diemDen: "• Tòa nhà Landmark 81, Dinh Độc Lập, Phố đi bộ Nguyễn Huệ, Bus đường sông Waterbus.",
    dacSan: "• Cơm tấm Sài Gòn, Hủ tiếu Nam Vang, Phá lấu vỉa hè.",
    chiPhi: "800.000đ - 2.500.000đ / ngày"
  },
  "can tho": {
    ten: "Thành phố Cần Thơ",
    subRegion: "tay_nam_bo", mien: "nam",
    anh: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=1000",
    moTa: "Thủ phủ Miền Tây nổi tiếng với trải nghiệm văn hóa Chợ nổi Cái Răng trên sông nước.",
    thoiDiem: "• Tháng 6 - 8: Mùa trái cây miệt vườn chín rộ.",
    diemDen: "• Chợ nổi Cái Răng, Bến Ninh Kiều, Nhà cổ Bình Thủy.",
    dacSan: "• Lẩu mắm Cần Thơ & Bánh xèo củ hủ dừa.",
    chiPhi: "500.000đ - 1.200.000đ / ngày"
  },
  "ba ria - vung tau": {
    ten: "Tỉnh Bà Rịa - Vũng Tàu",
    subRegion: "dong_nam_bo", mien: "nam",
    anh: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=1000",
    moTa: "Thành phố biển Vũng Tàu nhộn nhịp & Côn Đảo linh thiêng thiên đường biển ngọc.",
    thoiDiem: "• Quanh năm, lý tưởng nghỉ dưỡng cuối tuần.",
    diemDen: "• Tượng Chúa Kito Vũng Tàu, Bãi Sau, Quần đảo Côn Đảo.",
    dacSan: "• Bánh khọt Vũng Tàu giòn rụm & Lẩu cá đuối.",
    chiPhi: "600.000đ - 1.600.000đ / ngày"
  },
  "binh duong": {
    ten: "Tỉnh Bình Dương",
    subRegion: "dong_nam_bo", mien: "nam",
    anh: "https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=1000",
    moTa: "Nổi tiếng với Khu du lịch Đại Nam quy mô hoành tráng và vườn trái cây Lái Thiêu.",
    thoiDiem: "• Tháng 5 - 8: Mùa thu hoạch măng cụt Lái Thiêu.",
    diemDen: "• Khu du lịch Lạc Cảnh Đại Nam Văn Hiến, Chùa Bà Thiên Hậu.",
    dacSan: "• Bánh beo bì Chợ Búng & Gỏi gà măng cụt.",
    chiPhi: "400.000đ - 1.000.000đ / ngày"
  },
  "binh phuoc": {
    ten: "Tỉnh Bình Phước",
    subRegion: "dong_nam_bo", mien: "nam",
    anh: "https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=1000",
    moTa: "Thủ phủ hạt điều Việt Nam với danh thắng Núi Bà Rá và Vườn quốc gia Bù Gia Mập.",
    thoiDiem: "• Tháng 12 - 4: Mùa khô thích hợp đi trải nghiệm.",
    diemDen: "• Núi Bà Rá, Hồ Thác Mơ, VQG Bù Gia Mập.",
    dacSan: "• Hạt điều rang muối Bình Phước & Ve sầu chiên giòn.",
    chiPhi: "400.000đ - 900.000đ / ngày"
  },
  "dong nai": {
    ten: "Tỉnh Đồng Nai",
    subRegion: "dong_nam_bo", mien: "nam",
    anh: "https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=1000",
    moTa: "Điểm đến trekking Vườn quốc gia Cát Tiên và cắm trại Hồ Trị An lãng mạn.",
    thoiDiem: "• Tháng 12 - 5: Mùa khô đi trekking rừng.",
    diemDen: "• Vườn quốc gia Cát Tiên, Hồ Trị An, KDL Bửu Long.",
    dacSan: "• Cá lăng sông Đồng Nai & Gỏi bưởi Tân Triều.",
    chiPhi: "400.000đ - 1.000.000đ / ngày"
  },
  "tay ninh": {
    ten: "Tỉnh Tây Ninh",
    subRegion: "dong_nam_bo", mien: "nam",
    anh: "https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=1000",
    moTa: "Nóc nhà Nam Bộ 'Núi Bà Đen' săn mây tuyệt đẹp và Tòa Thánh Tây Ninh độc đáo.",
    thoiDiem: "• Tháng 1 - 3 âm lịch: Mùa hội xuân Núi Bà Đen.",
    diemDen: "• Núi Bà Đen (Đi cáp treo săn mây), Tòa Thánh Tây Ninh, Hồ Dầu Tiếng.",
    dacSan: "• Bánh tráng phơi sương Trảng Bàng & Muối tôm Tây Ninh.",
    chiPhi: "500.000đ - 1.100.000đ / ngày"
  },
  "an giang": {
    ten: "Tỉnh An Giang",
    subRegion: "tay_nam_bo", mien: "nam",
    anh: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=1000",
    moTa: "Rừng tràm Trà Sư xanh mướt bèo bồng và trung tâm tâm linh Miếu Bà Chúa Xứ.",
    thoiDiem: "• Tháng 9 - 11: Mùa nước nổi rừng tràm xanh ngát.",
    diemDen: "• Rừng tràm Trà Sư, Miếu Bà Chúa Xứ Núi Sam, Núi Cấm.",
    dacSan: "• Lẩu mắm Châu Đốc & Bánh bò thốt nốt béo ngậy.",
    chiPhi: "500.000đ - 1.200.000đ / ngày"
  },
  "bac lieu": {
    ten: "Tỉnh Bạc Liêu",
    subRegion: "tay_nam_bo", mien: "nam",
    anh: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=1000",
    moTa: "Gắn liền với giai thoại Công tử Bạc Liêu và Cánh đồng quạt gió ven biển cực Chill.",
    thoiDiem: "• Quanh năm nắng ấm rực rỡ.",
    diemDen: "• Nhà Công tử Bạc Liêu, Cánh đồng điện gió Bạc Liêu, Chùa Xiêm Cán.",
    dacSan: "• Bánh tằm nước cốt dừa Bạc Liêu & Lẩu mắm.",
    chiPhi: "450.000đ - 1.000.000đ / ngày"
  },
  "ben tre": {
    ten: "Tỉnh Bến Tre",
    subRegion: "tay_nam_bo", mien: "nam",
    anh: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=1000",
    moTa: "Xứ sở Dừa xanh rợp bóng mát, trải nghiệm chèo xuồng rạch dừa nước miệt vườn.",
    thoiDiem: "• Tháng 6 - 8: Mùa trái cây xum xuê.",
    diemDen: "• Cồn Phụng, Cồn Quy, Vườn trái cây Cái Mơn.",
    dacSan: "• Kẹo dừa Bến Tre & Cơm hấp trái dừa ngọt thanh.",
    chiPhi: "400.000đ - 900.000đ / ngày"
  },
  "ca mau": {
    ten: "Tỉnh Cà Mau",
    subRegion: "tay_nam_bo", mien: "nam",
    anh: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=1000",
    moTa: "Cột mốc tọa độ GPS 0001 tận cùng phía Nam Tổ quốc giữa rừng đước bạt ngàn.",
    thoiDiem: "• Tháng 12 - 4: Mùa khô di chuyển cực kỳ thuận lợi.",
    diemDen: "• Mũi Cà Mau, Vườn quốc gia U Minh Hạ, Hòn Đá Bạc.",
    dacSan: "• Cua Cà Mau gạch son chắc thịt & Cá thòi lòi nướng muối ớt.",
    chiPhi: "600.000đ - 1.300.000đ / ngày"
  },
  "dong thap": {
    ten: "Tỉnh Đồng Tháp",
    subRegion: "tay_nam_bo", mien: "nam",
    anh: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=1000",
    moTa: "Đất Sen Hồng rực rỡ với Làng hoa Sa Đéc hàng trăm năm tuổi ngát hương.",
    thoiDiem: "• Tháng 12: Mùa hoa Sa Đéc nở rực rỡ đón Tết.",
    diemDen: "• Làng hoa Sa Đéc, KDL Xẻo Quýt, Đồng sen Tháp Mười.",
    dacSan: "• Hủ tiếu Sa Đéc & Nem Lai Vung chua ngọt.",
    chiPhi: "450.000đ - 1.000.000đ / ngày"
  },
  "hau giang": {
    ten: "Tỉnh Hậu Giang",
    subRegion: "tay_nam_bo", mien: "nam",
    anh: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=1000",
    moTa: "Mảnh đất sông nước êm đềm nổi tiếng với Chợ nổi Ngã Bảy và Lung Ngọc Hoàng.",
    thoiDiem: "• Tháng 9 - 11: Mùa nước nổi thanh bình.",
    diemDen: "• Khu bảo tồn thiên nhiên Lung Ngọc Hoàng, Chợ nổi Ngã Bảy.",
    dacSan: "• Chả cá thát lát Hậu Giang & Khóm Cầu Đúc.",
    chiPhi: "400.000đ - 900.000đ / ngày"
  },
  "kien giang": {
    ten: "Tỉnh Kiên Giang (Phú Quốc)",
    subRegion: "tay_nam_bo", mien: "nam",
    anh: "https://images.unsplash.com/photo-1540206395-68808572332f?w=1000",
    moTa: "Đảo Ngọc Phú Quốc - Thiên đường nghỉ dưỡng biển đảo tầm cỡ quốc tế.",
    thoiDiem: "• Tháng 11 - 4: Mùa khô biển lặng, sóng êm, nắng ấm rực rỡ.",
    diemDen: "• Bãi Sao, Thị trấn Hoàng Hôn Sunset Town, Cáp treo Hòn Thơm, Grand World.",
    dacSan: "• Gỏi cá trích Phú Quốc, Bún quậy Kiến Xây & Rượu sim.",
    chiPhi: "1.200.000đ - 3.800.000đ / ngày"
  },
  "long an": {
    ten: "Tỉnh Long An",
    subRegion: "tay_nam_bo", mien: "nam",
    anh: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=1000",
    moTa: "Cửa ngõ kết nối TP.HCM và Miền Tây sở hữu Làng nổi Tân Lập rợp bóng rừng tràm.",
    thoiDiem: "• Tháng 9 - 11: Mùa nước nổi ngắm rừng tràm.",
    diemDen: "• Khu du lịch sinh thái Làng nổi Tân Lập, Làng cổ Phước Lộc Thọ.",
    dacSan: "• Lạp xưởng tươi Long An & Bánh tét Long An.",
    chiPhi: "350.000đ - 800.000đ / ngày"
  },
  "soc trang": {
    ten: "Tỉnh Sóc Trăng",
    subRegion: "tay_nam_bo", mien: "nam",
    anh: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=1000",
    moTa: "Xứ sở những ngôi chùa Khmer kiến trúc lộng lẫy nguy nga độc đáo.",
    thoiDiem: "• Tháng 10 - 11 âm lịch: Lễ hội Ok Om Bok & Đua ghe Ngo.",
    diemDen: "• Chùa Dơi, Chùa Chén Kiểu, Chùa Som Rong dát vàng.",
    dacSan: "• Bánh pía Sóc Trăng dẻo thơm & Bún nước lèo.",
    chiPhi: "400.000đ - 900.000đ / ngày"
  },
  "tien giang": {
    ten: "Tỉnh Tiền Giang",
    subRegion: "tay_nam_bo", mien: "nam",
    anh: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=1000",
    moTa: "Miệt vườn trù phú ven Sông Tiền và Chợ nổi Cái Bè nhộn nhịp.",
    thoiDiem: "• Tháng 5 - 8: Mùa trái cây miệt vườn chín xum xuê.",
    diemDen: "• Cù lao Thới Sơn, Chùa Vĩnh Tràng, Chợ nổi Cái Bè.",
    dacSan: "• Hủ tiếu Mỹ Tho & Vú sữa Lò Rèn ngọt lịm.",
    chiPhi: "400.000đ - 950.000đ / ngày"
  },
  "tra vinh": {
    ten: "Tỉnh Trà Vinh",
    subRegion: "tay_nam_bo", mien: "nam",
    anh: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=1000",
    moTa: "Thành phố rợp bóng cây cổ thụ trăm năm và danh thắng Ao Bà Om mát rượi.",
    thoiDiem: "• Tháng 4 (Tết Chôl Chnăm Thmây) hoặc Tháng 10 âm lịch.",
    diemDen: "• Danh thắng Ao Bà Om, Chùa Hang, Biển Ba Động.",
    dacSan: "• Dừa sáp Cầu Kè béo ngậy & Bún nước lèo Trà Vinh.",
    chiPhi: "400.000đ - 900.000đ / ngày"
  },
  "vinh long": {
    ten: "Tỉnh Vĩnh Long",
    subRegion: "tay_nam_bo", mien: "nam",
    anh: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=1000",
    moTa: "Nổi tiếng với Vương quốc gạch gốm đỏ Mang Thít bên sông cổ kính.",
    thoiDiem: "• Tháng 5 - 8: Mùa trái cây Cù lao An Bình.",
    diemDen: "• Làng gốm đỏ Mang Thít, Cù lao An Bình.",
    dacSan: "• Cá tai tượng chiên xù & Bưởi năm roi Mỹ Hòa.",
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
              `Em đã sẵn sàng hỗ trợ bạn khám phá trọn bộ **63 Tỉnh Thành** dọc 3 miền Bắc - Trung - Nam với đầy đủ lịch trình, hình ảnh và đặc sản!\n\n` +
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
              `📍 **CẨM NANG DU LỊCH: ${province.ten.toUpperCase()}**\n\n` +
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
  console.log(`🚀 [FULL 63 PROVINCES WEBHOOK SERVER READY] Port ${PORT}`);
});
