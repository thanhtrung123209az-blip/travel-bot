/**
 * ==============================================================================
 * HỆ THỐNG CHATBOT DU LỊCH ĐỘT PHÁ 63 TỈNH THÀNH VIỆT NAM (OFFLINE ENGINE)
 * Đề tài Dự thi Khoa học Kỹ thuật (KHKT) - Dành cho Cấp Tỉnh & Cấp Quốc Gia
 * 
 * Các Thuật toán & Mô hình Toán học Tự phát triển (100% Self-Contained):
 * 1. Lexicon-Based Sentiment Analysis (Phân tích cảm xúc & Tâm trạng)
 * 2. Vector Space Model & Cosine Similarity (Mô hình Không gian Vector)
 * 3. Climate Matrix Engine (Ma trận Khí hậu Lịch sử 3 Miền theo Mùa)
 * 4. Analytic Hierarchy Process - AHP (Mô hình Ra quyết định Đa tiêu chí)
 * 5. Traveling Salesperson Problem - TSP (Tối ưu hóa Tuyến đường Liên tỉnh)
 * 6. Jaccard Text Similarity NLP (Xử lý Ngôn ngữ Tự nhiên Fallback)
 * 7. Multi-Criteria Query & Relevance Scoring Engine (Thuật toán Truy vấn & Tìm kiếm Thông minh)
 * ==============================================================================
 */

const express = require('express');
const app = express();
app.use(express.json());

// ==============================================================================
// 1. CƠ SỞ DỮ LIỆU HOÀN CHỈNH 63 TỈNH THÀNH VIỆT NAM (OFFLINE DATABASE)
// Vector thuộc tính: [Biển/Đảo, Văn Hóa/Lịch Sử, Núi/Phượt, Nghỉ Dưỡng/Chữa Lành, Giá Rẻ/Bình Dân]
// BudgetLevel: 1 (Giá Rẻ/Bình Dân), 2 (Trung Bình), 3 (Cao Cấp/Nghỉ Dưỡng)
// ==============================================================================
const PROVINCES_DATABASE = [
  // --- MIỀN BẮC (25 TỈNH/THÀNH) ---
  {
    id: "hanoi",
    name: "Hà Nội",
    region: "MienBac",
    vector: [0.1, 0.95, 0.2, 0.6, 0.8],
    budgetLevel: 1,
    desc: "Thủ đô ngàn năm văn hiến, đậm đà bản sắc văn hóa và ẩm thực 36 phố phường.",
    tags: ["Văn hóa", "Ẩm thực", "Lịch sử"],
    itinerary3D2N: "• Ngày 1: Lăng Bác - Hồ Hoàn Kiếm - Phố Cổ.\n• Ngày 2: Văn Miếu - Hoàng Thành Thăng Long.\n• Ngày 3: Chợ Đồng Xuân - Thưởng thức Phở & Cà phê Trứng."
  },
  {
    id: "haiphong",
    name: "Hải Phòng",
    region: "MienBac",
    vector: [0.85, 0.5, 0.3, 0.7, 0.8],
    budgetLevel: 2,
    desc: "Thành phố Hoa Phượng Đỏ, nổi tiếng với đảo Cát Bà và Food Tour độc đáo.",
    tags: ["Biển đảo", "Food Tour", "Cát Bà"],
    itinerary3D2N: "• Ngày 1: Food Tour trung tâm thành phố (Bánh đa cua, Bánh mì que).\n• Ngày 2: Vịnh Lan Hạ - Đảo Cát Bà.\n• Ngày 3: Tắm biển Bãi Cháy/Đồ Sơn - Trở về."
  },
  {
    id: "quangninh",
    name: "Quảng Ninh",
    region: "MienBac",
    vector: [0.95, 0.6, 0.4, 0.9, 0.4],
    budgetLevel: 3,
    desc: "Di sản Thiên nhiên Thế giới Vịnh Hạ Long, Đảo Cô Tô và Bảo tàng Quảng Ninh.",
    tags: ["Vịnh Hạ Long", "Biển đảo", "Sang trọng"],
    itinerary3D2N: "• Ngày 1: Bảo tàng Quảng Ninh - Du thuyền ngắm Vịnh Hạ Long.\n• Ngày 2: Vui chơi Sun World Hạ Long Complex - Đảo Ti Tốp.\n• Ngày 3: Mua sắm hải sản Chợ Hạ Long - Trở về."
  },
  {
    id: "bacninh",
    name: "Bắc Ninh",
    region: "MienBac",
    vector: [0.0, 0.95, 0.1, 0.5, 0.9],
    budgetLevel: 1,
    desc: "Nôi văn hóa Kinh Bắc, điệu Dân ca Quan họ truyền thống và đền chùa cổ kính.",
    tags: ["Quan họ", "Tâm linh", "Đền Dô"],
    itinerary3D2N: "• Ngày 1: Đền Đô - Làng tranh Đông Hồ.\n• Ngày 2: Chùa Phật Tích - Thưởng thức Quan họ Bắc Ninh.\n• Ngày 3: Làng gốm Phù Lãng - Mua đặc sản bánh phu thê."
  },
  {
    id: "hanam",
    name: "Hà Nam",
    region: "MienBac",
    vector: [0.0, 0.9, 0.2, 0.7, 0.8],
    budgetLevel: 1,
    desc: "Địa điểm du lịch tâm linh nổi tiếng với Quần thể Chùa Tam Chúc hùng vĩ.",
    tags: ["Tam Chúc", "Tâm linh", "Yên bình"],
    itinerary3D2N: "• Ngày 1: Chùa Tam Chúc - Đi thuyền trên hồ Tam Chúc.\n• Ngày 2: Chùa Địa Tạng Phi Lai Tự - Đền Trúc.\n• Ngày 3: Làng kho cá Vũ Đại - Thưởng thức cá kho cổ truyền."
  },
  {
    id: "haiduong",
    name: "Hải Dương",
    region: "MienBac",
    vector: [0.0, 0.85, 0.2, 0.5, 0.9],
    budgetLevel: 1,
    desc: "Vùng đất danh nhân kiệt xuất, danh thắng Côn Sơn - Kiếp Bạc và đặc sản Bánh đậu xanh.",
    tags: ["Côn Sơn Kiếp Bạc", "Văn hóa", "Bánh đậu xanh"],
    itinerary3D2N: "• Ngày 1: Khu di tích Côn Sơn - Chùa Côn Sơn.\n• Ngày 2: Đền Kiếp Bạc - Đảo Cò Chi Lăng Nam.\n• Ngày 3: Mua đặc sản Bánh đậu xanh & Vải thiều Thanh Hà."
  },
  {
    id: "hungyen",
    name: "Hưng Yên",
    region: "MienBac",
    vector: [0.0, 0.9, 0.1, 0.4, 0.9],
    budgetLevel: 1,
    desc: "Phố Hiến vang bóng một thời 'Thứ nhất Kinh Kỳ, thứ nhì Phố Hiến' cùng nhãn lồng ngon nức tiếng.",
    tags: ["Phố Hiến", "Lịch sử", "Nhãn lồng"],
    itinerary3D2N: "• Ngày 1: Đền Mẫu - Văn Miếu Xích Đằng - Hồ Xích Đằng.\n• Ngày 2: Chùa Chuông - Làng Nôm cổ kính.\n• Ngày 3: Thưởng thức chè sen nhãn lồng - Mua quà lưu niệm."
  },
  {
    id: "namdinh",
    name: "Nam Định",
    region: "MienBac",
    vector: [0.4, 0.9, 0.1, 0.5, 0.9],
    budgetLevel: 1,
    desc: "Đất Vương triều Trần, nổi tiếng với Đền Trần, Chùa Cổ Lễ và kiến trúc Nhà thờ cổ.",
    tags: ["Đền Trần", "Nhà thờ cổ", "Phở Nam Định"],
    itinerary3D2N: "• Ngày 1: Khu di tích Đền Trần - Chùa Tháp Phổ Minh.\n• Ngày 2: Tour kiến trúc Nhà thờ cổ (Nhà thờ Đổ Hải Lý, Bùi Chu).\n• Ngày 3: Thưởng thức Phở bò gia truyền Nam Định."
  },
  {
    id: "ninhbinh",
    name: "Ninh Bình",
    region: "MienBac",
    vector: [0.2, 0.9, 0.6, 0.8, 0.7],
    budgetLevel: 2,
    desc: "Cố đô Hoa Lư, Di sản Kép Tràng An và cảnh quan núi đá vôi tuyệt đẹp.",
    tags: ["Tràng An", "Tam Cốc", "Hang Múa"],
    itinerary3D2N: "• Ngày 1: Đi thuyền Tràng An - Leo đỉnh Hang Múa.\n• Ngày 2: Chùa Bái Đính - Tam Cốc Bích Động.\n• Ngày 3: Cố đô Hoa Lư - Thưởng thức Dê núi Ninh Bình."
  },
  {
    id: "thaibinh",
    name: "Thái Bình",
    region: "MienBac",
    vector: [0.6, 0.7, 0.1, 0.5, 0.9],
    budgetLevel: 1,
    desc: "Quê hương 5 tấn, bãi biển Đồng Châu hoang sơ và Chùa Keo kiến trúc gỗ độc đáo.",
    tags: ["Chùa Keo", "Biển Đồng Châu", "Bình yên"],
    itinerary3D2N: "• Ngày 1: Chùa Keo Thái Bình - Đền Đồng Xâm.\n• Ngày 2: Ngắm bình minh biển vô cực Thụy Xuân / Bãi biển Đồng Châu.\n• Ngày 3: Thưởng thức Bún bung & Bánh gai Đại Đồng."
  },
  {
    id: "hagiang",
    name: "Hà Giang",
    region: "MienBac",
    vector: [0.0, 0.7, 1.0, 0.5, 0.8],
    budgetLevel: 1,
    desc: "Đèo Mã Pí Lèng hùng vĩ, Cột cờ Lũng Cú và sông Nho Quế xanh ngọc bích.",
    tags: ["Mã Pí Lèng", "Nho Quế", "Phượt núi"],
    itinerary3D2N: "• Ngày 1: TP Hà Giang - Quản Bạ - Yên Minh.\n• Ngày 2: Dinh họ Vương - Cột cờ Lũng Cú - Thị trấn Đồng Văn.\n• Ngày 3: Đèo Mã Pí Lèng - Chèo thuyền Sông Nho Quế - Trở về."
  },
  {
    id: "caobang",
    name: "Cao Bằng",
    region: "MienBac",
    vector: [0.0, 0.8, 0.9, 0.6, 0.8],
    budgetLevel: 1,
    desc: "Thác Bản Giốc kỳ vĩ bậc nhất Việt Nam và khu di tích lịch sử Hang Pác Bó.",
    tags: ["Thác Bản Giốc", "Pác Bó", "Thiên nhiên"],
    itinerary3D2N: "• Ngày 1: Di tích Pác Bó - Suối Lê Nin.\n• Ngày 2: Thác Bản Giốc - Động Ngườm Ngao.\n• Ngày 3: Hồ Thăng Hen - Mua đặc sản Lạp xưởng, Bánh khảo."
  },
  {
    id: "backan",
    name: "Bắc Kạn",
    region: "MienBac",
    vector: [0.0, 0.5, 0.8, 0.7, 0.8],
    budgetLevel: 1,
    desc: "Hồ Ba Bể - Một trong 20 hồ nước ngọt tự nhiên lớn nhất thế giới giữa lòng núi rừng.",
    tags: ["Hồ Ba Bể", "Thiên nhiên", "Thư giãn"],
    itinerary3D2N: "• Ngày 1: Di chuyển đến Ba Bể - Nghơi tại Homestay bản Pác Ngòi.\n• Ngày 2: Đi thuyền dạo quanh Hồ Ba Bể - Động Puông - Thác Đầu Đẳng.\n• Ngày 3: Trải nghiệm văn hóa Tày - Mua đặc sản Cá nướng Ba Bể."
  },
  {
    id: "tuyenquang",
    name: "Tuyên Quang",
    region: "MienBac",
    vector: [0.0, 0.9, 0.6, 0.6, 0.8],
    budgetLevel: 1,
    desc: "Thủ đô Khu giải phóng Tân Trào và Suối khoáng nóng Mỹ Lâm thư giãn.",
    tags: ["Tân Trào", "Lịch sử", "Khoáng nóng"],
    itinerary3D2N: "• Ngày 1: Khu di tích lịch sử Tân Trào - Lán Nà Nưa.\n• Ngày 2: Tắm khoáng nóng Mỹ Lâm - Danh thắng Na Hang.\n• Ngày 3: Thưởng thức Cam Sành Hàm Yên & Bánh gai Chiêm Hóa."
  },
  {
    id: "laocai",
    name: "Lào Cai (Sapa)",
    region: "MienBac",
    vector: [0.0, 0.6, 1.0, 0.8, 0.5],
    budgetLevel: 2,
    desc: "Thị trấn Sapa sương mờ, đỉnh Fansipan Nóc nhà Đông Dương và văn hóa H'Mông.",
    tags: ["Sapa", "Fansipan", "Sương mờ"],
    itinerary3D2N: "• Ngày 1: Chinh phục đỉnh Fansipan - Bản Cát Cát.\n• Ngày 2: Thung lũng Mường Hoa - Đèo Ô Quy Hồ ngắm hoàng hôn.\n• Ngày 3: Mua sắm đặc sản Chợ Sapa - Khởi hành về."
  },
  {
    id: "dienbien",
    name: "Điện Biên",
    region: "MienBac",
    vector: [0.0, 1.0, 0.8, 0.5, 0.8],
    budgetLevel: 1,
    desc: "Chiến trường Điện Biên Phủ lừng lẫy năm châu, Đồi A1 và hoa ban trắng Tây Bắc.",
    tags: ["Điện Biên Phủ", "Lịch sử", "Hoa ban"],
    itinerary3D2N: "• Ngày 1: Bảo tàng Chiến thắng Điện Biên Phủ - Đồi A1 - Hầm De Castries.\n• Ngày 2: Sở chỉ huy chiến dịch Mường Phăng - Hồ Pá Khoang.\n• Ngày 3: Ngắm hoa ban (mùa xuân) - Mua thịt trâu gầy bếp."
  },
  {
    id: "laichau",
    name: "Lai Châu",
    region: "MienBac",
    vector: [0.0, 0.5, 1.0, 0.5, 0.8],
    budgetLevel: 1,
    desc: "Cầu kính Rồng May trên đỉnh O Quy Hồ và vùng núi hoang sơ hùng vĩ.",
    tags: ["Đèo Ô Quy Hồ", "Cầu kính", "Trekking"],
    itinerary3D2N: "• Ngày 1: Đèo Ô Quy Hồ - Trải nghiệm Cầu kính Rồng May.\n• Ngày 2: Khám phá Động Pusamcap - Bản Si Thâu Chải.\n• Ngày 3: Thưởng thức ẩm thực dân tộc Thái - Khởi hành về."
  },
  {
    id: "sonla",
    name: "Sơn La (Mộc Châu)",
    region: "MienBac",
    vector: [0.0, 0.5, 0.8, 0.9, 0.7],
    budgetLevel: 2,
    desc: "Cao nguyên Mộc Châu xanh mướt đồi trà, đồi hoa cải và khí hậu mát mẻ quanh năm.",
    tags: ["Mộc Châu", "Đồi trà", "Khí hậu mát"],
    itinerary3D2N: "• Ngày 1: Đồi chè Trái Tim - Thác Dải Yếm - Cầu kính Tình Yêu.\n• Ngày 2: Rừng thông Bản Áng - Thung lũng mận Nà Ka.\n• Ngày 3: Mua đặc sản Sữa tươi Mộc Châu - Bê chao."
  },
  {
    id: "yenbai",
    name: "Yên Bái",
    region: "MienBac",
    vector: [0.0, 0.6, 0.9, 0.7, 0.8],
    budgetLevel: 1,
    desc: "Danh thắng Ruộng bậc thang Mù Cang Chải vinh danh thế giới và đèo Khau Phạ.",
    tags: ["Mù Cang Chải", "Ruộng bậc thang", "Khau Phạ"],
    itinerary3D2N: "• Ngày 1: Nghỉ dưỡng Suối khoáng nóng Trạm Tấu.\n• Ngày 2: Đèo Khau Phạ - Ruộng bậc thang La Pán Tẩn (Mù Cang Chải).\n• Ngày 3: Săn mây Đồi Mâm Xôi - Mua cốm Tú Lệ."
  },
  {
    id: "hoabinh",
    name: "Hòa Bình",
    region: "MienBac",
    vector: [0.0, 0.6, 0.7, 0.8, 0.8],
    budgetLevel: 1,
    desc: "Thung lũng Mai Châu thơ mộng, Thủy điện Hòa Bình và văn hóa Mường, Thái.",
    tags: ["Mai Châu", "Văn hóa Mường", "Thủy điện"],
    itinerary3D2N: "• Ngày 1: Tham quan Nhà máy Thủy điện Hòa Bình - Bản Lác (Mai Châu).\n• Ngày 2: Khám phá Thung Bái - Đèo Thung Khe (Đèo Đá White).\n• Ngày 3: Mua cam Cao Phong - Thưởng thức cơm lam gà nướng."
  },
  {
    id: "thainguyen",
    name: "Thái Nguyên",
    region: "MienBac",
    vector: [0.0, 0.7, 0.5, 0.6, 0.8],
    budgetLevel: 1,
    desc: "Đệ nhất danh trà Việt Nam, Hồ Nút Cốc thơ mộng và An toàn khu ATK Định Hóa.",
    tags: ["Đệ nhất trà", "Hồ Núi Cốc", "ATK"],
    itinerary3D2N: "• Ngày 1: An toàn khu ATK Định Hóa - Bảo tàng Văn hóa các Dân tộc VN.\n• Ngày 2: Khu du lịch Hồ Núi Cốc - Thăm đồi trà Tân Cương.\n• Ngày 3: Trải nghiệm hái trà - Thưởng thức Trà Thái Nguyên."
  },
  {
    id: "langson",
    name: "Lạng Sơn",
    region: "MienBac",
    vector: [0.0, 0.8, 0.7, 0.5, 0.8],
    budgetLevel: 1,
    desc: "Chùa Tam Thanh, Động Nhị Thanh, Đỉnh Mẫu Sơn quanh năm mây phủ.",
    tags: ["Mẫu Sơn", "Động Tam Thanh", "Đặc sản Vịt quay"],
    itinerary3D2N: "• Ngày 1: Chùa - Động Tam Thanh - Chợ Kỳ Lừa.\n• Ngày 2: Đỉnh núi Mẫu Sơn săn mây hoặc tuyết (mùa đông).\n• Ngày 3: Mua sắm Cửa khẩu Hữu Nghị - Thưởng thức Vịt quay Lạng Sơn."
  },
  {
    id: "bacgiang",
    name: "Bắc Giang",
    region: "MienBac",
    vector: [0.0, 0.8, 0.5, 0.5, 0.9],
    budgetLevel: 1,
    desc: "Chùa Vĩnh Nghiêm lưu giữ Mộc bản Kinh Phật và vùng trồng Vải thiều Lục Ngạn.",
    tags: ["Chùa Vĩnh Nghiêm", "Vải Lục Ngạn", "Tâm linh"],
    itinerary3D2N: "• Ngày 1: Chùa Vĩnh Nghiêm - Khu du lịch sinh thái Suối Mỡ.\n• Ngày 2: Khám phá Vùng vải thiều Lục Ngạn (mùa hè) / Đồng Cao.\n• Ngày 3: Thưởng thức Mỳ Chũ Bắc Giang - Khởi hành về."
  },
  {
    id: "phutho",
    name: "Phú Thọ",
    region: "MienBac",
    vector: [0.0, 1.0, 0.3, 0.6, 0.9],
    budgetLevel: 1,
    desc: "Đất Tổ Hùng Vương, Đền Hùng linh thiêng và Đồi chè Long Cốc bát úp kỳ ảo.",
    tags: ["Đền Hùng", "Đất Tổ", "Đồi chè Long Cốc"],
    itinerary3D2N: "• Ngày 1: Khu di tích lịch sử Đền Hùng - Bảo tàng Hùng Vương.\n• Ngày 2: Đồi chè Long Cốc - Vườn quốc gia Xuân Sơn.\n• Ngày 3: Thưởng thức Bánh tai, thịt chua Thanh Sơn."
  },
  {
    id: "vinhphuc",
    name: "Vĩnh Phúc",
    region: "MienBac",
    vector: [0.0, 0.7, 0.6, 0.9, 0.6],
    budgetLevel: 2,
    desc: "Thị trấn Tam Đảo nhấp nhô trong sương mù và Danh thắng Tây Thiên cổ kính.",
    tags: ["Tam Đảo", "Tây Thiên", "Nghỉ dưỡng"],
    itinerary3D2N: "• Ngày 1: Thị trấn Tam Đảo - Nhà thờ đá cổ - Đỉnh Rồng.\n• Ngày 2: Khu danh thắng Tây Thiên - Thiền viện Trúc Lâm Tây Thiên.\n• Ngày 3: Thưởng thức su su Tam Đảo - Khởi hành về."
  },

  // --- MIỀN TRUNG & TÂY NGUYÊN (19 TỈNH/THÀNH) ---
  {
    id: "thanhhoa",
    name: "Thanh Hóa",
    region: "MienTrung",
    vector: [0.7, 0.8, 0.5, 0.7, 0.8],
    budgetLevel: 1,
    desc: "Bãi biển Sầm Sơn nhộn nhịp, Thành Nhà Hồ Di sản Thế giới và Khu bảo tồn Pù Luông.",
    tags: ["Sầm Sơn", "Thành Nhà Hồ", "Pù Luông"],
    itinerary3D2N: "• Ngày 1: Tắm biển Sầm Sơn - Hòn Trống Mái.\n• Ngày 2: Di sản thế giới Thành Nhà Hồ - Khu sinh thái Pù Luông.\n• Ngày 3: Thưởng thức Nem chua Thanh Hóa & Bánh răng bừa."
  },
  {
    id: "nghean",
    name: "Nghệ An",
    region: "MienTrung",
    vector: [0.7, 0.9, 0.4, 0.6, 0.8],
    budgetLevel: 1,
    desc: "Quê hương Chủ tịch Hồ Chí Minh (Khu di tích Kim Liên) và Biển Cửa Lò.",
    tags: ["Làng Sen Bác Hồ", "Cửa Lò", "Súp lươn"],
    itinerary3D2N: "• Ngày 1: Khu di tích Làng Sen - Quê Bác Hồ.\n• Ngày 2: Bãi biển Cửa Lò - Đảo Hòn Ngư.\n• Ngày 3: Thưởng thức Súp lươn Nghệ An & Bánh mướt."
  },
  {
    id: "hatinh",
    name: "Hà Tĩnh",
    region: "MienTrung",
    vector: [0.6, 0.9, 0.4, 0.5, 0.9],
    budgetLevel: 1,
    desc: "Khu di tích Ngã ba Đồng Lộc linh thiêng, Biển Thiên Cầm trong xanh.",
    tags: ["Ngã ba Đồng Lộc", "Thiên Cầm", "Lịch sử"],
    itinerary3D2N: "• Ngày 1: Khu di tích Ngã ba Đồng Lộc - Khu lưu niệm Nguyễn Du.\n• Ngày 2: Bãi biển Thiên Cầm - Chùa Hương Tích Hà Tĩnh.\n• Ngày 3: Mua đặc sản Kẹo Cu Đơ & Cam Bù Hương Sơn."
  },
  {
    id: "quangbinh",
    name: "Quảng Bình",
    region: "MienTrung",
    vector: [0.4, 0.6, 0.9, 0.8, 0.6],
    budgetLevel: 2,
    desc: "Vương quốc Hang động: Phong Nha - Kẻ Bàng, Hang Sơn Đoòng và Mộ Đại tướng Võ Nguyên Giáp.",
    tags: ["Phong Nha", "Hang động", "Khám phá"],
    itinerary3D2N: "• Ngày 1: Động Phong Nha - Động Thiên Đường.\n• Ngày 2: Sông Chày - Hang Tối / Suối Moọc.\n• Ngày 3: Bãi biển Nhật Lệ - Thưởng thức bánh bột lọc Quảng Bình."
  },
  {
    id: "quangtri",
    name: "Quảng Trị",
    region: "MienTrung",
    vector: [0.5, 1.0, 0.3, 0.4, 0.9],
    budgetLevel: 1,
    desc: "Mảnh đất lịch sử với Thành cổ Quảng Trị, Nghĩa trang Trường Sơn, Địa đạo Vịnh Mốc.",
    tags: ["Thành cổ Quảng Trị", "Địa đạo Vịnh Mốc", "Lịch sử"],
    itinerary3D2N: "• Ngày 1: Thành cổ Quảng Trị - Sông Thạch Hãn.\n• Ngày 2: Cầu Hiền Lương - Sông Bến Hải - Địa đạo Vịnh Mốc.\n• Ngày 3: Nghĩa trang Liệt sĩ Quốc gia Trường Sơn - Trở về."
  },
  {
    id: "hue",
    name: "Thừa Thiên Huế",
    region: "MienTrung",
    vector: [0.3, 1.0, 0.2, 0.8, 0.8],
    budgetLevel: 1,
    desc: "Cố đô trầm mặc cổ kính với Đại Nội Huế, Các Lăng vua Triều Nguyễn và Ẩm thực Cung đình.",
    tags: ["Cố đô Huế", "Đại Nội", "Ẩm thực Huế"],
    itinerary3D2N: "• Ngày 1: Đại Nội Huế - Chùa Thiên Mụ - Nghe Ca Huế sông Hương.\n• Ngày 2: Lăng Khải Định - Lăng Tự Đức - Đồi Vọng Cảnh.\n• Ngày 3: Chợ Đông Ba - Thưởng thức Bún bò Huế & Bánh Bèo."
  },
  {
    id: "danang",
    name: "Đà Nẵng",
    region: "MienTrung",
    vector: [0.9, 0.5, 0.4, 0.9, 0.6],
    budgetLevel: 2,
    desc: "Thành phố đáng sống nhất Việt Nam, Biển Mỹ Khê, Cầu Vàng Bà Nà Hills.",
    tags: ["Đà Nẵng", "Bà Nà Hills", "Biển Mỹ Khê"],
    itinerary3D2N: "• Ngày 1: Biển Mỹ Khê - Ngũ Hành Sơn - Cầu Rồng phun lửa.\n• Ngày 2: Vui chơi trọn ngày Bà Nà Hills & Check-in Cầu Vàng.\n• Ngày 3: Bán đảo Sơn Trà (Chùa Linh Ứng) - Chợ Hàn."
  },
  {
    id: "quangnam",
    name: "Quảng Nam",
    region: "MienTrung",
    vector: [0.7, 0.95, 0.3, 0.8, 0.7],
    budgetLevel: 2,
    desc: "Phố cổ Hội An đèn lồng lung linh, Thánh địa Mỹ Sơn và Đảo Cù Lao Chàm.",
    tags: ["Hội An", "Thánh địa Mỹ Sơn", "Cù Lao Chàm"],
    itinerary3D2N: "• Ngày 1: Dạo Phố cổ Hội An - Đi thuyền thả đèn hoa đăng.\n• Ngày 2: Thánh địa Mỹ Sơn - Rừng dừa Bảy Mẫu.\n• Ngày 3: Đảo Cù Lao Chàm - Thưởng thức Cao Lầu & Mỳ Quảng."
  },
  {
    id: "quangngai",
    name: "Quảng Ngãi",
    region: "MienTrung",
    vector: [0.95, 0.7, 0.3, 0.6, 0.8],
    budgetLevel: 1,
    desc: "Đảo Lý Sơn - Thiên đường tỏi và những trầm tích núi lửa triệu năm giữa biển khơi.",
    tags: ["Đảo Lý Sơn", "Núi Thiên Ấn", "Cổ Thạch"],
    itinerary3D2N: "• Ngày 1: Cảng Sa Kỳ - Ra Đảo Lý Sơn - Đỉnh Thới Lới.\n• Ngày 2: Chùa Hang - Cổng Tỏ Vò - Đảo An Bình (Đảo Bé).\n• Ngày 3: Mua đặc sản Tỏi Lý Sơn - Thưởng thức Đôn Quảng Ngãi."
  },
  {
    id: "binhdinh",
    name: "Bình Định",
    region: "MienTrung",
    vector: [0.9, 0.7, 0.3, 0.7, 0.8],
    budgetLevel: 1,
    desc: "Võ cổ truyền Tây Sơn, Eo Gió - Kỳ Co hoang sơ quyến rũ.",
    tags: ["Quy Nhơn", "Kỳ Co Eo Gió", "Bình Định"],
    itinerary3D2N: "• Ngày 1: Tắm biển Quy Nhơn - Ghềnh Ráng Tiên Sa - Mộ Hàn Mặc Tử.\n• Ngày 2: Tour Kỳ Co - Eo Gió - Tịnh xá Ngọc Hòa.\n• Ngày 3: Bảo tàng Quang Trung - Mua Bánh ít lá gai."
  },
  {
    id: "phuyen",
    name: "Phú Yên",
    region: "MienTrung",
    vector: [0.9, 0.5, 0.4, 0.7, 0.9],
    budgetLevel: 1,
    desc: "Xứ sở 'Tôi thấy hoa vàng trên cỏ xanh', Ghềnh Đá Đĩa độc nhất vô nhị.",
    tags: ["Hoa vàng cỏ xanh", "Ghềnh Đá Đĩa", "Mũi Điện"],
    itinerary3D2N: "• Ngày 1: Ghềnh Đá Đĩa - Nhà thờ Mằng Lăng - Bãi Xép.\n• Ngày 2: Mũi Điện (Đón bình minh sớm nhất) - Tháp Nghinh Phong.\n• Ngày 3: Thưởng thức Mắt cá ngừ đại dương - Khởi hành về."
  },
  {
    id: "khanhhoa",
    name: "Khánh Hòa (Nha Trang)",
    region: "MienTrung",
    vector: [0.95, 0.4, 0.3, 0.9, 0.5],
    budgetLevel: 2,
    desc: "Thành phố biển Nha Trang năng động, VinWonders và Vịnh Vân Phong.",
    tags: ["Nha Trang", "VinWonders", "Tháp Bà Ponagar"],
    itinerary3D2N: "• Ngày 1: Biển Nha Trang - Tháp Bà Ponagar - Tắm bùn khoáng.\n• Ngày 2: Khám phá VinWonders Hòn Tre / Tour 4 đảo ngắm san hô.\n• Ngày 3: Chợ Đầm - Thưởng thức Bún chả cá & Nem nướng."
  },
  {
    id: "ninhthuan",
    name: "Ninh Thuận",
    region: "MienTrung",
    vector: [0.8, 0.7, 0.5, 0.6, 0.8],
    budgetLevel: 1,
    desc: "Vịnh Vĩnh Hy xanh biếc, Vườn nho Ba Mọi và văn hóa Tháp Chăm Cổ kính.",
    tags: ["Vịnh Vĩnh Hy", "Tháp Po Klong Garai", "Vườn nho"],
    itinerary3D2N: "• Ngày 1: Vịnh Vĩnh Hy - Hang Rái.\n• Ngày 2: Tháp Po Klong Garai - Đồi cát Nam Cương.\n• Ngày 3: Trải nghiệm hái nho tại Vườn nho Phan Rang."
  },
  {
    id: "binhthuan",
    name: "Bình Thuận (Phan Thiết)",
    region: "MienTrung",
    vector: [0.9, 0.4, 0.3, 0.8, 0.7],
    budgetLevel: 2,
    desc: "Mũi Né - Thủ phủ resort, Đồi cát bay rực rỡ và Đảo Phú Quý hoang sơ.",
    tags: ["Mũi Né", "Đồi cát bay", "Đảo Phú Quý"],
    itinerary3D2N: "• Ngày 1: Đồi cát Mũi Né - Suối Tiên - Làng chài Mũi Né.\n• Ngày 2: Hải đăng Keo Ga / Tour Đảo Phú Quý.\n• Ngày 3: Mua nước mắm Phan Thiết & Thanh long - Trở về."
  },
  {
    id: "kontum",
    name: "Kon Tum",
    region: "MienTrung",
    vector: [0.0, 0.8, 0.8, 0.6, 0.8],
    budgetLevel: 1,
    desc: "Nhà thờ Gỗ Kon Tum trăm tuổi, Măng Đen được ví như Đà Lạt thứ hai.",
    tags: ["Măng Đen", "Nhà thờ Gỗ", "Tây Nguyên"],
    itinerary3D2N: "• Ngày 1: Tòa Giám Mục - Nhà thờ Gỗ Kon Tum - Cầu treo Kon Klor.\n• Ngày 2: Thị trấn Măng Đen - Hồ Đăk Ke - Thác Pa Sỹ.\n• Ngày 3: Thưởng thức Cà phê Măng Đen & Gỏi lá Kon Tum."
  },
  {
    id: "gialai",
    name: "Gia Lai",
    region: "MienTrung",
    vector: [0.0, 0.6, 0.8, 0.7, 0.8],
    budgetLevel: 1,
    desc: "Biển Hồ T'Nưng 'Đôi mắt Pleiku', Núi lửa Chư Đăng Ya rực rỡ dã quỳ.",
    tags: ["Biển Hồ Pleiku", "Chư Đăng Ya", "Cồng chiêng"],
    itinerary3D2N: "• Ngày 1: Biển Hồ T'Nưng - Đồi chè Biển Hồ.\n• Ngày 2: Núi lửa Chư Đăng Ya - Chùa Minh Thành.\n• Ngày 3: Thưởng thức Phở hai tô Pleiku & Cà phê Gia Lai."
  },
  {
    id: "daklak",
    name: "Đắk Lắk",
    region: "MienTrung",
    vector: [0.0, 0.8, 0.7, 0.7, 0.8],
    budgetLevel: 1,
    desc: "Thủ phủ cà phê Buôn Ma Thuột, Cưỡi voi Buôn Đôn, Thác Dray Nur kỳ vĩ.",
    tags: ["Buôn Ma Thuột", "Thác Dray Nur", "Cà phê"],
    itinerary3D2N: "• Ngày 1: Bảo tàng Thế giới Cà phê - Làng cà phê Trung Nguyên.\n• Ngày 2: Cụm Thác Dray Nur - Dray Sap - Buôn Đôn.\n• Ngày 3: Hồ Lắc - Thưởng thức bún đỏ Buôn Ma Thuột."
  },
  {
    id: "daknong",
    name: "Đắk Nông",
    region: "MienTrung",
    vector: [0.0, 0.5, 0.9, 0.7, 0.8],
    budgetLevel: 1,
    desc: "Công viên Địa chất Toàn cầu Hang động Núi lửa Krông Nô và Hồ Tà Đùng - Hạ Long trên Tây Nguyên.",
    tags: ["Hồ Tà Đùng", "Công viên địa chất", "Thiên nhiên"],
    itinerary3D2N: "• Ngày 1: Hồ Tà Đùng - Ngắm toàn cảnh Hạ Long trên Tây Nguyên.\n• Ngày 2: Khám phá Hang động Núi lửa Krông Nô - Thác Liêng Nung.\n• Ngày 3: Mua đặc sản bơ thạch bích Đắk Nông - Khởi hành về."
  },
  {
    id: "lamdong",
    name: "Lâm Đồng (Đà Lạt)",
    region: "MienTrung",
    vector: [0.1, 0.4, 0.6, 1.0, 0.6],
    budgetLevel: 2,
    desc: "Thành phố ngàn hoa Đà Lạt, khí hậu mát mẻ quanh năm, lý tưởng để nghỉ dưỡng & chữa lành.",
    tags: ["Đà Lạt", "Chữa lành", "Lãng mạn"],
    itinerary3D2N: "• Ngày 1: Hồ Xuân Hương - Dinh Bảo Đại - Chợ đêm Đà Lạt.\n• Ngày 2: Đỉnh Langbiang - Cầu Đất Farm - Thung lũng Tình Yêu.\n• Ngày 3: Check-in các quán cà phê ngắm mây - Trải nghiệm hái dâu."
  },

  // --- MIỀN NAM (19 TỈNH/THÀNH) ---
  {
    id: "tphcm",
    name: "TP. Hồ Chí Minh",
    region: "MienNam",
    vector: [0.1, 0.85, 0.1, 0.7, 0.7],
    budgetLevel: 2,
    desc: "Thành phố đông dân và sầm uất nhất Việt Nam, giao thoa văn hóa hiện đại và lịch sử.",
    tags: ["Sài Gòn", "Sầm uất", "Địa đạo Củ Chi"],
    itinerary3D2N: "• Ngày 1: Nhà thờ Đức Bà - Bưu điện Trung tâm - Dinh Độc Lập - Chợ Bến Thành.\n• Ngày 2: Tham quan Địa đạo Củ Chi - Phố đi bộ Nguyễn Huệ.\n• Ngày 3: Trải nghiệm Bus trên sông Sài Gòn - Thưởng thức Cơm tấm."
  },
  {
    id: "binhduong",
    name: "Bình Dương",
    region: "MienNam",
    vector: [0.0, 0.7, 0.2, 0.6, 0.8],
    budgetLevel: 1,
    desc: "Khu du lịch Đại Nam quy mô hoành tráng, Chùa Bà Thiên Hậu và Làng gốm Lái Thiêu.",
    tags: ["Đại Nam", "Chùa Bà", "Làng gốm"],
    itinerary3D2N: "• Ngày 1: Vui chơi Khu du lịch Lạc Cảnh Đại Nam Văn Hiến.\n• Ngày 2: Chùa Bà Thiên Hậu - Chùa Hội Khánh.\n• Ngày 3: Làng gốm Lái Thiêu - Thưởng thức bánh beo bì."
  },
  {
    id: "binhphuoc",
    name: "Bình Phước",
    region: "MienNam",
    vector: [0.0, 0.5, 0.7, 0.6, 0.9],
    budgetLevel: 1,
    desc: "Vườn quốc gia Bù Gia Mập hoang sơ, Núi Bà Rá và thủ phủ Cây điều Việt Nam.",
    tags: ["Bù Gia Mập", "Núi Bà Rá", "Hạt điều"],
    itinerary3D2N: "• Ngày 1: Chinh phục Núi Bà Rá - Hồ Thủy điện Mơ Thác.\n• Ngày 2: Trekking Vườn quốc gia Bù Gia Mập.\n• Ngày 3: Mua đặc sản Hạt điều Bình Phước - Trở về."
  },
  {
    id: "tayninh",
    name: "Tây Ninh",
    region: "MienNam",
    vector: [0.0, 0.9, 0.6, 0.6, 0.8],
    budgetLevel: 1,
    desc: "Núi Bà Đen - Nóc nhà Nam Bộ, Tòa Thánh Tây Ninh độc đáo và Bánh tráng phơi sương.",
    tags: ["Núi Bà Đen", "Tòa Thánh", "Bánh tráng phơi sương"],
    itinerary3D2N: "• Ngày 1: Tòa Thánh Tây Ninh - Chinh phục Núi Bà Đen bằng cáp treo.\n• Ngày 2: Hồ Dầu Tiếng - Ma Thiên Lãnh.\n• Ngày 3: Mua Bánh tráng phơi sương & Muối tôm Tây Ninh."
  },
  {
    id: "dongnai",
    name: "Đồng Nai",
    region: "MienNam",
    vector: [0.0, 0.5, 0.6, 0.7, 0.8],
    budgetLevel: 1,
    desc: "Vườn quốc gia Cát Tiên - Khu bảo tồn sinh quyển thế giới và Khu du lịch Bửu Long.",
    tags: ["Cát Tiên", "Bửu Long", "Sinh thái"],
    itinerary3D2N: "• Ngày 1: Khu du lịch Bửu Long (Vịnh Hạ Long thu nhỏ).\n• Ngày 2: Vườn quốc gia Cát Tiên - Xem thú ban đêm.\n• Ngày 3: Trải nghiệm Vườn trái cây Long Khánh."
  },
  {
    id: "vungtau",
    name: "Bà Rịa - Vũng Tàu",
    region: "MienNam",
    vector: [0.95, 0.4, 0.2, 0.8, 0.6],
    budgetLevel: 2,
    desc: "Bãi Sau Vũng Tàu, Tượng Chúa Dang Tay và Quần đảo Côn Đảo linh thiêng.",
    tags: ["Vũng Tàu", "Côn Đảo", "Biển gần Sài Gòn"],
    itinerary3D2N: "• Ngày 1: Biển Bãi Sau - Tượng Chúa Kito - Hải Đăng Vũng Tàu.\n• Ngày 2: Tour Côn Đảo - Viếng mộ Cô Sáu - Nghĩa trang Hàng Dương.\n• Ngày 3: Thưởng thức Bánh khọt Vũng Tàu - Mua hải sản."
  },
  {
    id: "longan",
    name: "Long An",
    region: "MienNam",
    vector: [0.0, 0.6, 0.2, 0.7, 0.9],
    budgetLevel: 1,
    desc: "Cửa ngõ Miền Tây, Làng nổi Tân Lập rợp mát rừng tràm và Dược liệu Đồng Tháp Mười.",
    tags: ["Làng nổi Tân Lập", "Rừng tràm", "Miền Tây"],
    itinerary3D2N: "• Ngày 1: Khám phá Làng nổi Tân Lập - Đi xuồng chèo xuyên rừng tràm.\n• Ngày 2: Khu du lịch Cánh Đồng Bất Tận.\n• Ngày 3: Mua đặc sản Lạp xưởng tươi & Rượu đế Gò Đen."
  },
  {
    id: "tiengiang",
    name: "Tiền Giang",
    region: "MienNam",
    vector: [0.2, 0.8, 0.1, 0.7, 0.9],
    budgetLevel: 1,
    desc: "Chợ gạo Mỹ Tho, Chùa Vĩnh Tràng và Cù lao Thới Sơn rợp bóng vườn trái cây.",
    tags: ["Mỹ Tho", "Cù lao Thới Sơn", "Chùa Vĩnh Tràng"],
    itinerary3D2N: "• Ngày 1: Chùa Vĩnh Tràng - Tour 4 cù lao (Long, Lân, Quy, Phụng).\n• Ngày 2: Trải nghiệm Vườn trái cây Vĩnh Kim - Chợ nổi Cái Bè.\n• Ngày 3: Thưởng thức Hủ tiếu Mỹ Tho gia truyền."
  },
  {
    id: "bentre",
    name: "Bến Tre",
    region: "MienNam",
    vector: [0.2, 0.6, 0.1, 0.8, 0.9],
    budgetLevel: 1,
    desc: "Xứ Dừa Bến Tre, trải nghiệm chèo xuồng ba lá miệt vườn và Kẹo dừa truyền thống.",
    tags: ["Xứ Dừa", "Miệt vườn", "Kẹo dừa"],
    itinerary3D2N: "• Ngày 1: Khám phá Cồn Phụng - Cơ sở sản xuất Kẹo Dừa.\n• Ngày 2: Khu du lịch Sân chim Vàm Hồ - Vườn trái cây Cái Mơn.\n• Ngày 3: Thưởng thức Cơm nấu trong trái dừa & Tôm hấp nước dừa."
  },
  {
    id: "travinh",
    name: "Trà Vinh",
    region: "MienNam",
    vector: [0.3, 0.95, 0.1, 0.6, 0.9],
    budgetLevel: 1,
    desc: "Văn hóa Khmer độc đáo, Chùa Hang, Ao Bà Om và Dừa sáp hiếm có.",
    tags: ["Chùa Khmer", "Ao Bà Om", "Dừa sáp"],
    itinerary3D2N: "• Ngày 1: Danh thắng Ao Bà Om - Chùa Âng - Bảo tàng Khmer.\n• Ngày 2: Chùa Hang (Chùa Kompong Chray) - Biển Ba Động.\n• Ngày 3: Thưởng thức Bún nước lèo Trà Vinh & Dừa sáp Cau Kè."
  },
  {
    id: "vinhlong",
    name: "Vĩnh Long",
    region: "MienNam",
    vector: [0.1, 0.6, 0.1, 0.8, 0.9],
    budgetLevel: 1,
    desc: "Cù lao An Bình mênh mông sông nước và những lò gạch gốm đỏ truyền thống.",
    tags: ["Cù lao An Bình", "Lò gạch cổ", "Sông nước"],
    itinerary3D2N: "• Ngày 1: Khám phá Cù lao An Bình - Tát mương bắt cá.\n• Ngày 2: Vương quốc Lò gạch gốm đỏ Mang Thít.\n• Ngày 3: Thưởng thức Bưởi 5 Roi Bình Minh - Trở về."
  },
  {
    id: "dongthap",
    name: "Đồng Tháp",
    region: "MienNam",
    vector: [0.0, 0.7, 0.2, 0.8, 0.9],
    budgetLevel: 1,
    desc: "Đất Sen Hồng Đồng Tháp, Vườn quốc gia Tràm Chim và Làng hoa Sa Đéc rực rỡ.",
    tags: ["Đất Sen Hồng", "Tràm Chim", "Làng hoa Sa Đéc"],
    itinerary3D2N: "• Ngày 1: Làng hoa kiểng Sa Đéc - Nhà cổ Huỳnh Thủy Lê.\n• Ngày 2: Vườn quốc gia Tràm Chim Tam Nông (Ngắm Sếu đầu đỏ).\n• Ngày 3: Thưởng thức hủ tiếu Sa Đéc & Nem Lai Vung."
  },
  {
    id: "angiang",
    name: "An Giang",
    region: "MienNam",
    vector: [0.0, 0.9, 0.4, 0.7, 0.9],
    budgetLevel: 1,
    desc: "Miếu Bà Chúa Xứ Núi Sam linh thiêng, Rừng tràm Trà Cử và Vùng đất Thất Sơn.",
    tags: ["Miếu Bà Chúa Xứ", "Rừng tràm Trà Cư", "An Giang"],
    itinerary3D2N: "• Ngày 1: Miếu Bà Chúa Xứ Núi Sam (Châu Đốc) - Chợ Mắm Châu Đốc.\n• Ngày 2: Rừng tràm Trà Cấm - Cánh đồng thốt nốt Tịnh Biên.\n• Ngày 3: Thưởng thức Bún cá Long Xuyên & Bánh bò thốt nốt."
  },
  {
    id: "kiengiang",
    name: "Kiên Giang (Phú Quốc)",
    region: "MienNam",
    vector: [1.0, 0.3, 0.1, 0.95, 0.3],
    budgetLevel: 3,
    desc: "Đảo Ngọc Phú Quốc đẳng cấp quốc tế, Bãi Sao, VinWonders và Nam Du hoang sơ.",
    tags: ["Phú Quốc", "Đảo Ngọc", "Sang trọng"],
    itinerary3D2N: "• Ngày 1: Bãi Sao - Lặn ngắm san hô An Thới - Thị trấn Hoàng Hôn.\n• Ngày 2: Vui chơi VinWonders & Vinpearl Safari Phú Quốc.\n• Ngày 3: Mua đặc sản Nước mắm, Tiêu Phú Quốc - Trở về."
  },
  {
    id: "cantho",
    name: "Cần Thơ",
    region: "MienNam",
    vector: [0.2, 0.8, 0.1, 0.8, 0.8],
    budgetLevel: 1,
    desc: "Thủ phủ Tây Đô, Chợ nổi Cái Răng tấp nập buổi sáng và Phố đi bộ Bến Ninh Kiều.",
    tags: ["Cần Thơ", "Chợ nổi Cái Răng", "Bến Ninh Kiều"],
    itinerary3D2N: "• Ngày 1: Bến Ninh Kiều - Nhà cổ Bình Thủy.\n• Ngày 2: Đi thuyền sớm tham quan Chợ nổi Cái Răng - Làng du lịch Mỹ Khánh.\n• Ngày 3: Thưởng thức Lẩu mắm Cần Thơ & Bánh xèo miền Tây."
  },
  {
    id: "haugiang",
    name: "Hậu Giang",
    region: "MienNam",
    vector: [0.1, 0.6, 0.1, 0.7, 0.9],
    budgetLevel: 1,
    desc: "Khu bảo tồn thiên nhiên Lung Ngọc Hoàng và chợ nông sản Phụng Hiệp.",
    tags: ["Lung Ngọc Hoàng", "Khóm Cầu Đúc", "Thiên nhiên"],
    itinerary3D2N: "• Ngày 1: Khám phá Khu bảo tồn thiên nhiên Lung Ngọc Hoàng.\n• Ngày 2: Vùng khóm Cầu Đúc - Chợ nổi Ngã Bảy.\n• Ngày 3: Thưởng thức đặc sản Chả cá thát lát Hậu Giang."
  },
  {
    id: "soctrang",
    name: "Sóc Trăng",
    region: "MienNam",
    vector: [0.2, 0.95, 0.1, 0.6, 0.9],
    budgetLevel: 1,
    desc: "Ngôi chùa Dơi linh thiêng, Chùa Chén Kiểu độc đáo và Bánh pía sầu riêng thơm ngon.",
    tags: ["Chùa Dơi", "Chùa Chén Kiểu", "Bánh Pía"],
    itinerary3D2N: "• Ngày 1: Chùa Dơi (Chùa Mahatup) - Chùa Chén Kiểu.\n• Ngày 2: Chùa Som Rong kiến trúc Thái Lan - Bảo tàng Khmer Sóc Trăng.\n• Ngày 3: Mua đặc sản Bánh Pía Sóc Trăng & Lạp xưởng."
  },
  {
    id: "baclieu",
    name: "Bạc Liêu",
    region: "MienNam",
    vector: [0.5, 0.8, 0.1, 0.7, 0.9],
    budgetLevel: 1,
    desc: "Nhà Công tử Bạc Liêu lừng lẫy, Cánh đồng Điện gió Bạc Liêu và Điệu Đờn ca tài tử.",
    tags: ["Công tử Bạc Liêu", "Điện gió", "Đờn ca tài tử"],
    itinerary3D2N: "• Ngày 1: Nhà Công tử Bạc Liêu - Khu lưu niệm Đờn ca tài tử Cao Văn Lầu.\n• Ngày 2: Check-in Cánh đồng Điện gió Bạc Liêu - Quán Âm Phật Đài.\n• Ngày 3: Thưởng thức Bánh xèo A Mật - Trở về."
  },
  {
    id: "camau",
    name: "Cà Mau",
    region: "MienNam",
    vector: [0.7, 0.7, 0.2, 0.7, 0.8],
    budgetLevel: 1,
    desc: "Đất Mũi Cà Mau - Cực Nam của Tổ quốc, Rừng U Minh Hạ ngút ngàn.",
    tags: ["Đất Mũi Cà Mau", "Cực Nam", "Rừng U Minh"],
    itinerary3D2N: "• Ngày 1: TP Cà Mau - Di chuyển đến Đất Mũi Cà Mau.\n• Ngày 2: Mốc tọa độ Quốc gia GPS 0001 - Rừng quốc gia U Minh Hạ.\n• Ngày 3: Thưởng thức Cua Cà Mau nức tiếng - Khởi hành về."
  }
];

// Bảng Khoảng cách Liên tỉnh (Mô phỏng cho Thuật toán TSP Optimization)
const INTER_CITY_DISTANCE = {
  "hanoi": { "laocai": 315, "hue": 668, "danang": 763, "quangninh": 160, "tphcm": 1700 },
  "laocai": { "hanoi": 315, "hagiang": 200, "yenbai": 130 },
  "danang": { "hue": 100, "lamdong": 650, "hanoi": 763, "binhdinh": 300 },
  "hue": { "danang": 100, "hanoi": 668, "quangbinh": 160 },
  "lamdong": { "danang": 650, "kiengiang": 500, "tphcm": 300 },
  "tphcm": { "lamdong": 300, "vungtau": 100, "cantho": 170, "tayninh": 100, "kiengiang": 380 }
};

// ==============================================================================
// THUẬT TOÁN BỔ SUNG: BỎ DẤU TIẾNG VIỆT (DIACRITICS REMOVAL NORMALIZATION)
// ==============================================================================
function removeVietnameseTones(str) {
  if (!str) return '';
  str = str.toLowerCase();
  str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, "a");
  str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, "e");
  str = str.replace(/ì|í|ị|ỉ|ĩ/g, "i");
  str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, "o");
  str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, "u");
  str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, "y");
  str = str.replace(/đ/g, "d");
  str = str.replace(/\u0300|\u0301|\u0306|\u0303|\u0323/g, "");
  str = str.replace(/\u02C6|\u031B/g, "");
  return str.trim();
}

// ==============================================================================
// THUẬT TOÁN TRUY VẤN MỚI: TÌM KIẾM & CHẤM ĐIỂM TƯƠNG QUAN (SMART QUERY ENGINE)
// ==============================================================================
function queryProvincesDatabase(queryText, filters = {}) {
  const normalizedQuery = removeVietnameseTones(queryText);
  const queryTokens = normalizedQuery.split(/\s+/).filter(t => t.length > 0);

  const results = PROVINCES_DATABASE.map(province => {
    let relevanceScore = 0;
    const normName = removeVietnameseTones(province.name);
    const normId = removeVietnameseTones(province.id);
    const normDesc = removeVietnameseTones(province.desc);
    const normTags = province.tags.map(t => removeVietnameseTones(t));
    const normItinerary = removeVietnameseTones(province.itinerary3D2N);

    // 1. Áp dụng Bộ lọc (Filter Engine) nếu có
    if (filters.region && province.region !== filters.region) return null;
    if (filters.budgetLevel && province.budgetLevel !== Number(filters.budgetLevel)) return null;

    // 2. Chấm điểm Khớp Tên/ID tỉnh thành (Exact/Partial Name Match)
    if (normName === normalizedQuery || normId === normalizedQuery) {
      relevanceScore += 10.0;
    } else if (normName.includes(normalizedQuery) || normalizedQuery.includes(normName)) {
      relevanceScore += 6.0;
    }

    // 3. Chấm điểm Khớp Thẻ Chủ đề (Tags Match)
    normTags.forEach(tag => {
      if (tag.includes(normalizedQuery) || normalizedQuery.includes(tag)) {
        relevanceScore += 5.0;
      }
    });

    // 4. Chấm điểm Theo Từ Khóa (Token Match in Desc & Itinerary)
    queryTokens.forEach(token => {
      if (token.length < 2) return; // Bỏ qua từ quá ngắn
      if (normName.includes(token)) relevanceScore += 2.0;
      if (normTags.some(t => t.includes(token))) relevanceScore += 1.5;
      if (normDesc.includes(token)) relevanceScore += 1.0;
      if (normItinerary.includes(token)) relevanceScore += 0.5;
    });

    return {
      ...province,
      relevanceScore: Number(relevanceScore.toFixed(2))
    };
  })
  .filter(item => item !== null && item.relevanceScore > 0)
  .sort((a, b) => b.relevanceScore - a.relevanceScore);

  return results;
}

// ==============================================================================
// 2. THUẬT TOÁN 1: LEXICON-BASED SENTIMENT ANALYSIS (PHÂN TÍCH TÂM TRẠNG)
// ==============================================================================
const SENTIMENT_LEXICON = {
  relax: ["mệt", "mệt mỏi", "stress", "áp lực", "chữa lành", "yên tĩnh", "nghỉ ngơi", "thư giãn", "xả stress"],
  adventure: ["phượt", "chinh phục", "leo núi", "khám phá", "mạo hiểm", "vận động", "trekking"],
  culture: ["cổ kính", "văn hóa", "lịch sử", "truyền thống", "chùa", "bảo tàng", "di tích", "tâm linh"],
  beach: ["nóng", "ngột ngạt", "thích biển", "tắm biển", "đảo", "hải sản", "sóng biển"],
  budget: ["rẻ", "tiết kiệm", "sinh viên", "hạt dẻ", "ít tiền", "bình dân"]
};

function analyzeSentimentAndAdjustVector(userInput) {
  const text = userInput.toLowerCase();
  // Vector mục tiêu mặc định: [Biển, Văn Hóa, Núi, Nghỉ Dưỡng, Giá Rẻ]
  let userTargetVector = [0.5, 0.5, 0.5, 0.5, 0.5];
  let detectedMood = "Cân bằng & Linh hoạt";

  if (SENTIMENT_LEXICON.relax.some(w => text.includes(w))) {
    userTargetVector[3] += 0.4; // Tăng Nghỉ dưỡng/Chữa lành
    userTargetVector[2] -= 0.2;
    detectedMood = "Cần Thư giãn & Chữa lành (Relax/Healing)";
  }
  if (SENTIMENT_LEXICON.adventure.some(w => text.includes(w))) {
    userTargetVector[2] += 0.5; // Tăng Núi/Phượt
    userTargetVector[3] -= 0.2;
    detectedMood = "Năng động & Thích Khám phá (Adventure)";
  }
  if (SENTIMENT_LEXICON.beach.some(w => text.includes(w))) {
    userTargetVector[0] += 0.5; // Tăng Biển
    detectedMood = "Yêu thích Biển đảo (Beach Lover)";
  }
  if (SENTIMENT_LEXICON.culture.some(w => text.includes(w))) {
    userTargetVector[1] += 0.5; // Tăng Văn hóa
    detectedMood = "Đam mê Lịch sử & Văn hóa (Culture)";
  }
  if (SENTIMENT_LEXICON.budget.some(w => text.includes(w))) {
    userTargetVector[4] += 0.4; // Tăng Ưu tiên Giá rẻ
  }

  return { userTargetVector, detectedMood };
}

// ==============================================================================
// 3. THUẬT TOÁN 2: COSINE SIMILARITY (MÔ HÌNH KHÔNG GIAN VECTOR)
// Công thức: cos(θ) = (A · B) / (||A|| * ||B||)
// ==============================================================================
function calculateCosineSimilarity(vecA, vecB) {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// ==============================================================================
// 4. THUẬT TOÁN 3: CLIMATE MATRIX ENGINE (DỰ BÁO KHÍ HẬU LỊCH SỬ 3 MIỀN)
// ==============================================================================
const CLIMATE_MATRIX = {
  "MienBac": {
    rainyMonths: [7, 8],
    idealMonths: [9, 10, 11, 3, 4],
    desc: "Khí hậu 4 mùa rõ rệt. Đang ở thời điểm thời tiết thuận lợi!"
  },
  "MienTrung": {
    rainyMonths: [9, 10, 11],
    idealMonths: [1, 2, 3, 4, 5, 6, 7],
    desc: "Mùa nắng ấm áp, cảnh quan biển trong xanh."
  },
  "MienNam": {
    rainyMonths: [5, 6, 7, 8, 9, 10],
    idealMonths: [11, 12, 1, 2, 3, 4],
    desc: "Thời tiết ôn hòa, nắng dịu nhẹ thích hợp trải nghiệm miệt vườn."
  }
};

function getClimateScoreAndAdvice(region) {
  const currentMonth = new Date().getMonth() + 1; // Lấy tháng thực tế hệ thống
  const regionInfo = CLIMATE_MATRIX[region] || CLIMATE_MATRIX["MienBac"];

  if (regionInfo.rainyMonths.includes(currentMonth)) {
    return {
      score: 0.4,
      advice: `⚠ *Tháng ${currentMonth} là mùa mưa/bão tại khu vực này. Cần chú ý mang ô/áo mưa!*`
    };
  } else if (regionInfo.idealMonths.includes(currentMonth)) {
    return {
      score: 1.0,
      advice: `☀️ *Tháng ${currentMonth} là Mùa Vàng du lịch (Thời tiết khô ráo, cảnh quan đẹp nhất)!*`
    };
  }
  return {
    score: 0.7,
    advice: `⛅ *Thời tiết Tháng ${currentMonth} tương đối thuận lợi cho hoạt động tham quan.*`
  };
}

// ==============================================================================
// 5. THUẬT TOÁN 4: ANALYTIC HIERARCHY PROCESS - AHP (ĐIỂM ĐA TIÊU CHÍ)
// Công thức: Score_total = w1*Score_cosine + w2*Score_budget + w3*Score_climate
// ==============================================================================
function recommendDestinationsAHP(userInput, userBudgetLevel = 2) {
  const { userTargetVector, detectedMood } = analyzeSentimentAndAdjustVector(userInput);
  
  // Trọng số AHP chuẩn hóa (Tổng = 1.0)
  const w1 = 0.50; // Trọng số Mức tương đồng Sở thích & Cảm xúc
  const w2 = 0.25; // Trọng số Phù hợp Ngân sách
  const w3 = 0.25; // Trọng số Điểm Khí hậu Theo mùa

  const rankedList = PROVINCES_DATABASE.map(province => {
    // 1. Điểm Cosine Similarity
    const cosineScore = calculateCosineSimilarity(userTargetVector, province.vector);

    // 2. Điểm Ngân sách
    const budgetDiff = Math.abs(province.budgetLevel - userBudgetLevel);
    const budgetScore = 1.0 - (budgetDiff / 2.0);

    // 3. Điểm Thời tiết
    const climateResult = getClimateScoreAndAdvice(province.region);

    // Điểm tổng hợp AHP
    const totalScore = (w1 * cosineScore) + (w2 * budgetScore) + (w3 * climateResult.score);

    return {
      ...province,
      cosineScore: cosineScore.toFixed(3),
      budgetScore: budgetScore.toFixed(2),
      climateAdvice: climateResult.advice,
      totalScore: totalScore.toFixed(3)
    };
  });

  // Sắp xếp giảm dần theo điểm AHP
  rankedList.sort((a, b) => b.totalScore - a.totalScore);
  return { rankedList, detectedMood };
}

// ==============================================================================
// 6. THUẬT TOÁN 5: TRAVELING SALESPERSON PROBLEM - TSP (TỐI ƯU TUYẾN ĐƯỜNG)
// Thuật toán: Nearest Neighbor Heuristic
// ==============================================================================
function optimizeMultiCityRoute(cityIds, startCityId) {
  let unvisited = [...cityIds].filter(id => id !== startCityId);
  let route = [startCityId];
  let current = startCityId;
  let totalDistance = 0;

  while (unvisited.length > 0) {
    let nearest = null;
    let minDist = Infinity;

    for (let nextCity of unvisited) {
      let dist = INTER_CITY_DISTANCE[current]?.[nextCity] || 250;
      if (dist < minDist) {
        minDist = dist;
        nearest = nextCity;
      }
    }

    if (nearest) {
      route.push(nearest);
      totalDistance += minDist;
      unvisited = unvisited.filter(id => id !== nearest);
      current = nearest;
    } else {
      break;
    }
  }

  return { route, totalDistance };
}

// ==============================================================================
// 7. THUẬT TOÁN 6: JACCARD TEXT SIMILARITY NLP (FALLBACK FAQ ENGINE)
// ==============================================================================
function tokenizeText(text) {
  return text.toLowerCase()
             .replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "")
             .split(/\s+/)
             .filter(word => word.length > 0);
}

function calculateJaccardSimilarity(str1, str2) {
  const setA = new Set(tokenizeText(str1));
  const setB = new Set(tokenizeText(str2));

  const intersection = new Set([...setA].filter(x => setB.has(x)));
  const union = new Set([...setA, ...setB]);

  if (union.size === 0) return 0;
  return intersection.size / union.size;
}

const OFFLINE_FAQ_DATABASE = [
  { q: "nên mang theo đồ gì khi đi du lịch biển", a: "🧳 **Hành lý đi biển:** Kem chống nắng, kính râm, đồ bơi, dép xỏ ngón và túi chống nước điện thoại!" },
  { q: "làm sao để tiết kiệm chi phí du lịch tự túc", a: "💡 **Mẹo tiết kiệm:** Đặt vé/phòng trước 2-3 tuần, ăn tại các chợ đêm địa phương và sử dụng xe máy thuê." },
  { q: "khi nào là mùa đẹp nhất để đi du lịch miền bắc", a: "🍂 **Mùa đẹp Miền Bắc:** Từ tháng 9 đến tháng 11 (Mùa thu mát mẻ, lúa chín ngợp trời) và tháng 3 - 4 (Mùa xuân)." },
  { q: "kinh nghiệm đi phượt bằng xe máy an toàn", a: "🏍️ **Kinh nghiệm phượt:** Kiểm tra phanh/lốp xe, trang bị bảo hộ đầy đủ, không chạy đêm và mang theo bộ vá xe cá nhân!" }
];

function queryOfflineFAQ(userQuery) {
  let bestMatch = null;
  let highestScore = 0;

  for (let item of OFFLINE_FAQ_DATABASE) {
    let score = calculateJaccardSimilarity(userQuery, item.q);
    if (score > highestScore) {
      highestScore = score;
      bestMatch = item;
    }
  }

  if (highestScore > 0.12 && bestMatch) {
    return bestMatch.a;
  }
  return "🤖 **AI Du lịch Việt Nam (63 Tỉnh Thành):** Bạn có thể gõ tên bất kỳ tỉnh thành nào (ví dụ: *'Lịch trình Tây Ninh'*, *'Tìm kiếm Phú Quốc'* hay *'Gợi ý đi biển'*) để tôi tư vấn chi tiết!";
}

// ==============================================================================
// 8. DIALOGFLOW WEBHOOK ROUTER (XỬ LÝ INTENTS & TRUY VẤN CẢI TIẾN)
// ==============================================================================
app.post('/webhook', (req, res) => {
  const queryResult = req.body.queryResult || {};
  const intentName = queryResult.intent ? queryResult.intent.displayName : '';
  const queryText = queryResult.queryText || '';

  // INTENT 1: GỢI Ý DU LỊCH TRONG 63 TỈNH THÀNH (AHP MODEL)
  if (intentName === 'tim_kiem_tour' || intentName === 'Goiyi_DuLich' || queryText.toLowerCase().includes('gợi ý') || queryText.toLowerCase().includes('đi đâu')) {
    const { rankedList, detectedMood } = recommendDestinationsAHP(queryText, 2);
    const top = rankedList[0];
    const runnerUp = rankedList[1];

    const responseText = 
`🤖 **KẾT QUẢ PHÂN TÍCH TƯ VẤN DU LỊCH 63 TỈNH THÀNH (AHP ENGINE):**

🧠 **Cảm xúc ghi nhận:** *${detectedMood}*
📍 **Lựa chọn #1 Tối ưu nhất:** **${top.name}**
📊 **Điểm AHP Tổng hợp:** $Score = ${top.totalScore}$ *(Độ khớp Vector: ${top.cosineScore})*

📝 **Mô tả:** ${top.desc}
${top.climateAdvice}
✨ **Đặc trưng:** ${top.tags.join(', ')}.

🥈 **Lựa chọn #2 Dự phòng:** **${runnerUp.name}** (Điểm AHP: ${runnerUp.totalScore})

👉 Gõ *"Lịch trình ${top.name}"* để xem chi tiết 3N2Đ!`;

    return res.json({ fulfillmentText: responseText });
  }

  // INTENT 2: XEM LỊCH TRÌNH 3N2Đ THEO TỈNH THÀNH BẤT KỲ (SỬ DỤNG SMART QUERY ENGINE)
  if (intentName === 'xem_lich_trinh' || queryText.toLowerCase().includes('lịch trình') || queryText.toLowerCase().includes('truy vấn')) {
    // Sử dụng Thuật toán Truy vấn Tìm kiếm Thông minh thay vì tìm kiếm từ khóa cứng
    const searchResults = queryProvincesDatabase(queryText);
    const matchedProvince = searchResults.length > 0 ? searchResults[0] : PROVINCES_DATABASE[0];

    const responseText = 
`🗺️ **LỊCH TRÌNH 3 NGÀY 2 ĐÊM CHI TIẾT - ${matchedProvince.name.toUpperCase()}**

${matchedProvince.itinerary3D2N}

💡 *Địa điểm được tìm thấy chính xác bằng Thuật toán Truy vấn Bỏ dấu & Chấm điểm Tương quan (Điểm khớp: ${matchedProvince.relevanceScore || 'N/A'}).*`;

    return res.json({ fulfillmentText: responseText });
  }

  // INTENT 3: TỐI ƯU TUYẾN ĐƯỜNG LIÊN TỈNH (TSP ROUTE OPTIMIZER)
  if (intentName === 'toi_uu_tuyen_duong' || queryText.toLowerCase().includes('tuyến đường') || queryText.toLowerCase().includes('đi nhiều tỉnh')) {
    const { route, totalDistance } = optimizeMultiCityRoute(["laocai", "quangninh", "hue"], "hanoi");
    const routeNames = route.map(id => PROVINCES_DATABASE.find(p => p.id === id)?.name || id).join(" ➔ ");

    const responseText = 
`🛺 **TỐI ƯU TUYẾN ĐƯỜNG LIÊN TỈNH (TSP ALGORITHM):**

🛣️ **Thứ tự di chuyển tiết kiệm nhất:**
${routeNames}

📏 **Tổng quãng đường ước tính:** ~${totalDistance} km
⚡ *Gợi ý giúp bạn tối ưu hóa thời gian và chi phí di chuyển.*`;

    return res.json({ fulfillmentText: responseText });
  }

  // INTENT FALLBACK: DÙNG JACCARD NLP TRA CỨU
  const faqAnswer = queryOfflineFAQ(queryText);
  return res.json({ fulfillmentText: faqAnswer });
});

// ==============================================================================
// 9. API TRUY VẤN TÌM KIẾM CHO CÁC ỨNG DỤNG FRONTEND / EXTERNAL CLIENTS (/api/search)
// ==============================================================================
app.get('/api/search', (req, res) => {
  const query = req.query.q || '';
  const region = req.query.region || null;
  const budgetLevel = req.query.budgetLevel || null;

  const searchResults = queryProvincesDatabase(query, { region, budgetLevel });

  res.json({
    status: "success",
    query: query,
    filters: { region, budgetLevel },
    totalResults: searchResults.length,
    data: searchResults
  });
});

// ==============================================================================
// 10. DASHBOARD TRỰC QUAN (/map) - HIỂN THỊ ĐỦ 63 TỈNH THÀNH & BỘ LỌC TRUY VẤN
// ==============================================================================
app.get('/map', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="vi">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Bản Đồ Du Lịch 63 Tỉnh Thành Việt Nam - KHKT Engine</title>
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; background: #f0f4f8; margin: 0; padding: 20px; color: #1e293b; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 30px; border-radius: 16px; box-shadow: 0 10px 25px rgba(0,0,0,0.1); }
        h1 { color: #0284c7; text-align: center; margin-bottom: 5px; font-size: 28px; }
        .subtitle { text-align: center; color: #64748b; font-size: 15px; margin-bottom: 25px; }
        .stats-bar { display: flex; justify-content: space-around; background: #e0f2fe; padding: 15px; border-radius: 10px; margin-bottom: 25px; font-weight: bold; color: #0369a1; }
        .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 15px; }
        .card { border: 1px solid #e2e8f0; padding: 16px; border-radius: 12px; background: #ffffff; transition: 0.2s; }
        .card:hover { border-color: #0284c7; transform: translateY(-3px); box-shadow: 0 5px 15px rgba(2,132,199,0.15); }
        .badge { background: #0284c7; color: white; padding: 3px 8px; border-radius: 8px; font-size: 11px; font-weight: bold; }
        .tag { background: #f1f5f9; color: #475569; padding: 2px 6px; border-radius: 4px; font-size: 11px; margin-right: 4px; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>🇻🇳 BẢN ĐỒ DU LỊCH THÔNG MINH 63 TỈNH THÀNH VIỆT NAM</h1>
        <p class="subtitle">Hệ thống Tư vấn Lịch trình & Mô hình Thuật toán Truy vấn AHP Offline 100%</p>
        
        <div class="stats-bar">
          <span>📊 Số lượng địa điểm: 63/63 Tỉnh Thành</span>
          <span>🧠 Thuật toán: AHP + Query Scoring + Cosine + Climate + TSP</span>
          <span>⚡ Trạng thái: Ready for KHKT Expo</span>
        </div>

        <h3>📍 Danh sách Cơ sở Dữ liệu 63 Tỉnh Thành đã Mã hóa Vector:</h3>
        <div class="grid">
          ${PROVINCES_DATABASE.map((p, index) => `
            <div class="card">
              <span class="badge">#${index + 1} -${p.region}</span>
              <h3 style="margin: 8px 0 4px 0; color: #0f172a;">${p.name}</h3>
              <p style="font-size: 12px; color: #64748b; margin-bottom: 8px;">${p.desc}</p>
              <div>${p.tags.map(t => `<span class="tag">#${t}</span>`).join('')}</div>
            </div>
          `).join('')}
        </div>
      </div>
    </body>
    </html>
  `);
});

// Endpoint kiểm tra server
app.get('/', (req, res) => {
  res.send('✅ Server Chatbot Du Lịch 63 Tỉnh Thành (Tích hợp Thuật toán Truy vấn) đang chạy hoàn hảo trên cổng 3000!');
});

// ==============================================================================
// 11. KHỞI CHẠY SERVER
// ==============================================================================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`================================================================`);
  console.log(`🚀 CHATBOT DU LỊCH 63 TỈNH THÀNH VIỆT NAM ĐÃ SẴN SÀNG!`);
  console.log(`📊 Đã nạp thành công ${PROVINCES_DATABASE.length}/63 Tỉnh Thành vào Offline Database`);
  console.log(`🔍 Đã kích hoạt Thuật toán Truy vấn & Chấm điểm Tương quan (Query Scoring Engine)`);
  console.log(`📡 Webhook URL: http://localhost:${PORT}/webhook`);
  console.log(`🔎 API Truy vấn Tìm kiếm: http://localhost:${PORT}/api/search?q=phu%20quoc`);
  console.log(`🗺️ Interactive Dashboard 63 Tỉnh Thành: http://localhost:${PORT}/map`);
  console.log(`================================================================`);
});
