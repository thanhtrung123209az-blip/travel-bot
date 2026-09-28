/**
 * WEBHOOK DIALOGFLOW ES - CHÁT BOT DU LỊCH 63 TỈNH THÀNH VIỆT NAM (THÔNG MINH)
 * 
 * Tính năng tích hợp:
 * 1. Phản hồi Thẻ tương tác (Rich Card) đẹp mắt kèm Hình ảnh & Nút bấm.
 * 2. Hỗ trợ tra cứu Vùng miền (Bắc - Trung - Nam) & 63 Tỉnh Thành.
 * 3. THUẬT TOÁN TÌM KIẾM MỜ (Fuzzy Matching): Tự sửa lỗi gõ sai chính tả / gõ không dấu.
 * 4. BỘ NHỚ PHIÊN (Session Memory): Tích lũy lịch sử tra cứu của từng người dùng.
 * 5. Bắt ngữ cảnh chuyên sâu (Ăn gì, Đi đâu, Mẹo du lịch, Chi phí).
 */

const express = require('express');
const app = express();

app.use(express.json());

// =========================================================================
// 1. CẤU HÌNH & BỘ NHỚ LƯU TRỮ TRẠNG THÁI (SESSION MEMORY)
// =========================================================================
const ANH_MAC_DINH = 'https://images.unsplash.com/photo-1528127269322-539801943592?w=800';

// Lưu trữ lịch sử & sở thích người dùng theo sessionId của Dialogflow
const boNhoNguoiDung = new Map();

// =========================================================================
// 2. BỘ THUẬT TOÁN XỬ LÝ CHUỖI & TÌM KIẾM MỜ (FUZZY MATCHING)
// =========================================================================

/**
 * Hàm loại bỏ dấu tiếng Việt để so sánh chuỗi không dấu
 */
function loaiBoDau(str) {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd').replace(/Đ/g, 'D')
    .toLowerCase()
    .trim();
}

/**
 * Thuật toán Dice's Coefficient: Tính độ tương đồng giữa 2 chuỗi (Trả về 0.0 -> 1.0)
 * Giúp phát hiện từ gõ sai chính tả (VD: "dalat" -> "đà lạt", "ha gianng" -> "hà giang")
 */
function tinhDoTuongDong(str1, str2) {
  const s1 = loaiBoDau(str1);
  const s2 = loaiBoDau(str2);

  if (s1 === s2) return 1.0;
  if (s1.length < 2 || s2.length < 2) return 0.0;

  const bigrams1 = new Map();
  for (let i = 0; i < s1.length - 1; i++) {
    const bigram = s1.substring(i, i + 2);
    bigrams1.set(bigram, (bigrams1.get(bigram) || 0) + 1);
  }

  let intersectionSize = 0;
  for (let i = 0; i < s2.length - 1; i++) {
    const bigram = s2.substring(i, i + 2);
    const count = bigrams1.get(bigram) || 0;
    if (count > 0) {
      bigrams1.set(bigram, count - 1);
      intersectionSize++;
    }
  }

  return (2.0 * intersectionSize) / (s1.length + s2.length - 2);
}

// =========================================================================
// 3. KHO DỮ LIỆU CÁC VÙNG MIỀN
// =========================================================================
const danhSachMien = {
  'miền bắc': {
    ten: 'Miền Bắc',
    anh: 'https://images.unsplash.com/photo-1528127269322-539801943592?w=800',
    moTa: 'Hội tụ cảnh quan thiên nhiên hùng vĩ, núi cao trùng điệp và nền văn hóa nghìn năm văn hiến.',
    tinhThanh: 'Hà Nội, Quảng Ninh, Lào Cai (Sa Pa), Hà Giang, Ninh Bình, Hải Phòng, Cao Bằng, Điện Biên, Mộc Châu...'
  },
  'miền trung': {
    ten: 'Miền Trung & Tây Nguyên',
    anh: 'https://images.unsplash.com/photo-1552353617-3bfd679b3bdd?w=800',
    moTa: 'Nổi tiếng với con đường di sản văn hóa, bãi biển ngọc bích và không gian đại ngàn kỳ vĩ.',
    tinhThanh: 'Thừa Thiên Huế, Đà Nẵng, Hội An, Quy Nhơn, Phú Yên, Nha Trang, Đà Lạt, Quảng Bình...'
  },
  'miền nam': {
    ten: 'Miền Nam',
    anh: 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=800',
    moTa: 'Mảnh đất miền sông nước phù sa màu mỡ, nhịp sống sầm uất, hiện đại và con người mến khách.',
    tinhThanh: 'TP.HCM, Vũng Tàu, Phú Quốc, Cần Thơ, Tây Ninh, An Giang, Bến Tre, Cà Mau...'
  }
};

// =========================================================================
// 4. KHO DỮ LIỆU 63 TỈNH THÀNH & ĐỊA DANH NỔI TIẾNG
// =========================================================================
const duLieuCacTinh = {
  // -------------------- I. MIỀN BẮC --------------------
  'hà nội': {
    ten: 'Thủ đô Hà Nội',
    anh: 'https://images.unsplash.com/photo-1509030450996-93f2e3d84298?w=800',
    moTa: 'Trái tim nghìn năm văn hiến với Phố Cổ rợp bóng cây và nét văn hóa Tràng An.',
    diemDen: 'Hồ Hoàn Kiếm, Lăng Bác, Văn Miếu Quốc Tử Giám, Hoàng thành Thăng Long, Cầu Long Biên.',
    dacSan: 'Phở gia truyền, Bún chả Hàng Mành, Chả cá Lăng, Cà phê trứng Giảng, Bánh cốm.',
    muaDep: 'Tháng 9 - 11 (Thu Hà Nội hoa sữa rơi, tiết trời se lạnh lãng mạn).',
    meo: 'Thử dậy lúc 5h sáng dạo Hồ Gươm ngắm nhịp sống bình yên nhất của Thủ đô!'
  },
  'hải phòng': {
    ten: 'Hải Phòng',
    anh: 'https://images.unsplash.com/photo-1552554948-261ef40d4240?w=800',
    moTa: 'Thành phố Hoa Phượng Đỏ sôi động với biển Cát Bà và Foodtour cực đỉnh.',
    diemDen: 'Quần đảo Cát Bà, Vịnh Lan Hạ, Đảo Hòn Dáu, Bãi biển Đồ Sơn.',
    dacSan: 'Bánh đa cua, Bánh mì que, Dừa dầm, Bún cá cay, Cua bể.',
    muaDep: 'Tháng 4 - Tháng 10 (Thích hợp tắm biển & oanh tạc Foodtour).',
    meo: 'Thuê một chiếc xe máy làm một chuyến Foodtour quanh các khu chợ trung tâm!'
  },
  'quảng ninh': {
    ten: 'Quảng Ninh',
    anh: 'https://images.unsplash.com/photo-1552554948-261ef40d4240?w=800',
    moTa: 'Vùng đất di sản sở hữu Vịnh Hạ Long - Kỳ quan thiên nhiên thế giới.',
    diemDen: 'Vịnh Hạ Long, Đỉnh linh thiêng Yên Tử, Đảo Ti Tốp, Sun World Bãi Cháy.',
    dacSan: 'Chả mực Hạ Long, Bún bề bề, Sá sùng rang, Gà đồi Tiên Yên.',
    muaDep: 'Tháng 4 - Tháng 9 (Nắng vàng, biển xanh bãi tắm đẹp).',
    meo: 'Nên trải nghiệm tour du thuyền ngủ đêm trên Vịnh một lần trong đời!'
  },
  'hạ long': {
    ten: 'Vịnh Hạ Long (Quảng Ninh)',
    anh: 'https://images.unsplash.com/photo-1552554948-261ef40d4240?w=800',
    moTa: 'Kỳ quan đá dựng trên làn nước xanh ngọc bích.',
    diemDen: 'Động Thiên Cung, Hang Đầu Gỗ, Đảo Ti Tốp, Bảo tàng Quảng Ninh.',
    dacSan: 'Bánh cuốn chả mực nóng hổi, bún hải sản.',
    muaDep: 'Tháng 4 - Tháng 8.',
    meo: 'Đừng quên mang theo đồ bơi và kem chống nắng nhé!'
  },
  'bắc ninh': {
    ten: 'Bắc Ninh',
    anh: ANH_MAC_DINH,
    moTa: 'Xứ sở Kinh Bắc đậm đà làn điệu Dân ca Quan họ ngọt ngào.',
    diemDen: 'Chùa Dâu, Chùa Bút Tháp, Đền Đô (thờ 8 vị vua Lý), Làng nghề gốm Phù Lãng.',
    dacSan: 'Bánh phu thê Đình Bảng, Nem Bùi, Thịt chuột Dĩnh Bảng, Trà cam đường.',
    muaDep: 'Tháng 1 - Tháng 3 âm lịch (Mùa lễ hội xuân miền Bắc).',
    meo: 'Ghé Đền Đô vào dịp lễ hội để thưởng thức quan họ hát trên thuyền rồng!'
  },
  'bắc giang': {
    ten: 'Bắc Giang',
    anh: ANH_MAC_DINH,
    moTa: 'Vùng đất miền đồi núi với những vườn vải thiều chín đỏ bạt ngàn.',
    diemDen: 'Khu du lịch Tây Yên Tử, Hồ Cấm Sơn, Chùa Vĩnh Nghiêm, Đồng Cao.',
    dacSan: 'Vải thiều Lục Ngạn, Bánh đa Kế, Mỳ Chũ, Gà đồi Yên Thế.',
    muaDep: 'Tháng 6 - Tháng 7 (Mùa vải thiều chín đỏ cả vùng đồi).',
    meo: 'Ghé Đồng Cao cắm trại đêm ngắm ngàn sao cực kỳ trải nghiệm!'
  },
  'lạng sơn': {
    ten: 'Lạng Sơn',
    anh: ANH_MAC_DINH,
    moTa: 'Mảnh đất biên cương nổi tiếng với Ải Chi Lăng và phố chợ sầm uất.',
    diemDen: 'Động Tam Thanh, Mẫu Sơn, Đỉnh Nà Lay, Phố Cổ Kỳ Lừa.',
    dacSan: 'Vịt quay Mắc Mật, Khâu nhục, Bánh phở chua, Bánh áp chao.',
    muaDep: 'Tháng 12 - Tháng 1 (Săn băng tuyết tại đỉnh Mẫu Sơn).',
    meo: 'Thưởng thức vịt quay chuẩn vị đượm mùi lá mắc mật thơm nức!'
  },
  'cao bằng': {
    ten: 'Cao Bằng',
    anh: 'https://images.unsplash.com/photo-1599707303381-807c42749419?w=800',
    moTa: 'Non nước hữu tình sở hữu Thác Bản Giốc tuyệt mỹ.',
    diemDen: 'Thác Bản Giốc, Động Ngườm Ngao, Suối Lê Nin - Pác Bó, Hồ Thang Hen.',
    dacSan: 'Bánh cuốn nước xương, Hạt dẻ Trùng Khánh, Vịt quay 7 vị, Lạp xưởng.',
    muaDep: 'Tháng 8 - Tháng 10 (Mùa nước thác xanh ngọc bích rực rỡ).',
    meo: 'Nhớ mua hạt dẻ Trùng Khánh rang nóng bùi ngậy làm quà!'
  },
  'hà giang': {
    ten: 'Hà Giang',
    anh: 'https://images.unsplash.com/photo-1508873696983-2df515122519?w=800',
    moTa: 'Nơi địa đầu Tổ quốc với núi đá hùng vĩ và cung đường đèo huyền thoại.',
    diemDen: 'Đèo Mã Pí Lèng, Sông Nho Quế, Cột cờ Lũng Cú, Dinh Nhà Vương, Phố cổ Đồng Văn.',
    dacSan: 'Bánh tam giác mạch, Cháo ấu tẩu, Phở tráng đồng, Thắng cố.',
    muaDep: 'Tháng 10 - Tháng 12 (Mùa hoa tam giác mạch nở hồng rực các sườn núi).',
    meo: 'Tự lái xe máy đèo dốc nhớ kiểm tra phanh kỹ và đi tốc độ an toàn nhé!'
  },
  'tuyên quang': {
    ten: 'Tuyên Quang',
    anh: ANH_MAC_DINH,
    moTa: 'Thủ đô khu giải phóng với núi rừng lịch sử và Hồ Na Hang thần tiên.',
    diemDen: 'Khu di tích Tân Trào, Hồ Na Hang - Lâm Bình, Thác Mơ, Suối khoáng Mỹ Lâm.',
    dacSan: 'Thịt trâu gác bếp, Cam sành Hàm Yên, Mắm ruộng Chiêm Hóa, Bánh nếp.',
    muaDep: 'Tháng 8 âm lịch (Đón Lễ hội Trung thu lớn nhất cả nước).',
    meo: 'Đi thuyền trên Hồ Na Hang check-in Cọc Vài Phạ tuyệt đẹp!'
  },
  'thái nguyên': {
    ten: 'Thái Nguyên',
    anh: ANH_MAC_DINH,
    moTa: 'Đệ nhất danh trà Việt Nam với những đồi chè xanh mút mắt.',
    diemDen: 'Đồi chè Tân Cương, Hồ Nước Cốc, Hang Phượng Hoàng - Suối Moà.',
    dacSan: 'Trà Tân Cương, Bánh chưng Bờm, Cơm lam Định Hóa, Nem chua Đại Từ.',
    muaDep: 'Tháng 9 - Tháng 11 (Thời tiết mát mẻ ngắm đồi chè xanh mướt).',
    meo: 'Trải nghiệm tự tay hái chè và thưởng thức trà nóng tại vườn!'
  },
  'phú thọ': {
    ten: 'Phú Thọ',
    anh: ANH_MAC_DINH,
    moTa: 'Đất Tổ Hùng Vương thiêng liêng cội nguồn dân tộc.',
    diemDen: 'Khu di tích lịch sử Đền Hùng, Vườn quốc gia Xuân Sơn, Đồi chè Long Cốc.',
    dacSan: 'Thịt chua Thanh Sơn, Bánh hòn, Trám om thịt, Bưởi Đoan Hùng.',
    muaDep: 'Mùng 10 tháng 3 âm lịch (Giỗ Tổ Hùng Vương).',
    meo: 'Đón bình minh trên Đồi chè Long Cốc nhấp nhô mây vờn đẹp như tranh vẽ!'
  },
  'bắc kạn': {
    ten: 'Bắc Kạn',
    anh: ANH_MAC_DINH,
    moTa: 'Vùng đất ngàn xanh giữ trọn vẻ đẹp hoang sơ của Hồ Ba Bể.',
    diemDen: 'Hồ Ba Bể, Động Puông, Thác Đầu Đẳng, An Mạ, Động Hua Mạ.',
    dacSan: 'Cá nướng Hồ Ba Bể, Lạp xưởng hun khói, Tôm chua Ba Bể, Miến dong.',
    muaDep: 'Tháng 2 - Tháng 5 (Mùa nước hồ xanh trong phẳng lặng).',
    meo: 'Đi thuyền độc mộc dạo quanh lòng Hồ Ba Bể lắng nghe tiếng rừng!'
  },
  'lào cai': {
    ten: 'Lào Cai - Sa Pa',
    anh: 'https://images.unsplash.com/photo-1528127269322-539801943592?w=800',
    moTa: 'Thị trấn trong mây với nét văn hóa H\'Mông đặc sắc và đỉnh Fansipan.',
    diemDen: 'Đỉnh Fansipan 3.143m, Bản Cát Cát, Thung lũng Mường Hoa, Cầu kính Rồng Mây.',
    dacSan: 'Lẩu cá hồi cá tầm, Thịt trâu gác bếp, Thắng cố, Rau mầm đá.',
    muaDep: 'Tháng 9-10 (Lúa chín vàng) & Tháng 12-1 (Săn mây, tuyết rơi).',
    meo: 'Thuê một bộ đồ dân tộc check-in Bản Cát Cát có ngay album ảnh xuất sắc!'
  },
  'sapa': {
    ten: 'Sa Pa (Lào Cai)',
    anh: 'https://images.unsplash.com/photo-1528127269322-539801943592?w=800',
    moTa: 'Sương mờ phố núi mát mẻ quanh năm.',
    diemDen: 'Nóc nhà Đông Dương Fansipan, Moana Sa Pa, Cổng Trời.',
    dacSan: 'Đồ nướng đêm phố cổ, Lẩu cá tầm.',
    muaDep: 'Tháng 9 - Tháng 1.',
    meo: 'Nhớ mang áo ấm dày vì nhiệt độ buổi tối xuống khá thấp!'
  },
  'yên bái': {
    ten: 'Yên Bái',
    anh: ANH_MAC_DINH,
    moTa: 'Tuyệt tác ruộng bậc thang Mù Cang Chải rực rỡ sóng lúa.',
    diemDen: 'Ruộng bậc thang Mù Cang Chải, Đèo Khau Phạ, Hồ Thác Bà, Suối nước nóng Trạm Tấu.',
    dacSan: 'Cốm Tú Lệ, Thịt trâu sấy, Bánh chưng đen, Chè Shan tuyết Suối Giàng.',
    muaDep: 'Tháng 9 - Tháng 10 (Mùa lúa chín vàng óng bạt ngàn).',
    meo: 'Trải nghiệm nhảy dù dù lượn Bay trên mùa vàng tại Đèo Khau Phạ!'
  },
  'lai châu': {
    ten: 'Lai Châu',
    anh: ANH_MAC_DINH,
    moTa: 'Vùng đất hiểm trở kỳ vĩ với những đỉnh núi cao nhất Việt Nam.',
    diemDen: 'Đèo O Quy Hồ, Đỉnh Pu Si Lung, Pu Ta Leng, Bản Sin Suối Hồ.',
    dacSan: 'Lợn kẹp nách, Pa pỉnh tộp (Cá nướng), Rượu ngô Sìn Hồ.',
    muaDep: 'Tháng 9 - Tháng 11 (Săn mây đỉnh đèo O Quy Hồ).',
    meo: 'Đón hoàng hôn tại Cổng trời O Quy Hồ ngắm mặt trời lặn hùng vĩ!'
  },
  'điện biên': {
    ten: 'Điện Biên',
    anh: ANH_MAC_DINH,
    moTa: 'Mảnh đất lịch sử lừng lẫy năm châu chấn động địa cầu.',
    diemDen: 'Đồi A1, Tượng đài Chiến thắng Điện Biên Phủ, Hầm De Castries, Cánh đồng Mường Thanh.',
    dacSan: 'Thịt xông khói, Sâu chít, Bắp mắm, Bánh ăm tẩu.',
    muaDep: 'Tháng 3 (Mùa hoa ban nở trắng trời Tây Bắc).',
    meo: 'Ghé thăm nghĩa trang liệt sĩ A1 để thắp hương tưởng niệm!'
  },
  'sơn la': {
    ten: 'Sơn La',
    anh: ANH_MAC_DINH,
    moTa: 'Cao nguyên Mộc Châu xanh ngát thảo nguyên và hoa cải trắng.',
    diemDen: 'Cao nguyên Mộc Châu, Rừng thông Bản Áng, Đồi chè Trái Tim, Thác Dải Yếm.',
    dacSan: 'Bê chao Mộc Châu, Cơm lam, Bún mọc, Nậm pịa.',
    muaDep: 'Tháng 1 - Tháng 2 (Mùa hoa mận, hoa mơ nở trắng rừng).',
    meo: 'Thưởng thức đĩa Bê chao nóng hổi ngay khi vừa chiên xong!'
  },
  'hòa bình': {
    ten: 'Hòa Bình',
    anh: ANH_MAC_DINH,
    moTa: 'Cửa ngõ Tây Bắc đậm đà bản sắc Mường và Hồ thủy điện bao la.',
    diemDen: 'Thung lũng Mai Châu, Hồ Hòa Bình, Thác Gỡ, Bản Lác.',
    dacSan: 'Cơm lam nướng lá chuối, Lợn mán thui luộc, Bánh ốc Mường.',
    muaDep: 'Tháng 10 - Tháng 4 (Mai Châu thời tiết cực mát mẻ).',
    meo: 'Thuê nhà sàn tại Bản Lác nghỉ đêm và thưởng thức múa xòe Mường!'
  },
  'hà nam': {
    ten: 'Hà Nam',
    anh: ANH_MAC_DINH,
    moTa: 'Vùng đất tâm linh yên bình nơi ven bờ sông Đáy.',
    diemDen: 'Chùa Tam Chúc (Ngôi chùa lớn nhất thế giới), Chùa Địa Tạng Phi Lai Tự, Ngôi nhà Bá Kiến.',
    dacSan: 'Cá kho Cổ Hoàng / Vũ Đại, Bánh cuốn Phủ Lý, Hồng nhân hậu.',
    muaDep: 'Tháng 1 - Tháng 3 âm lịch (Mùa chiêm bái lễ Phật).',
    meo: 'Đi thuyền trên lòng Hồ Tam Chúc ngắm cảnh núi non hùng vĩ!'
  },
  'hải dương': {
    ten: 'Hải Dương',
    anh: ANH_MAC_DINH,
    moTa: 'Xứ Đông cổ kính với đặc sản Bánh đậu xanh trứ danh.',
    diemDen: 'Khu di tích Côn Sơn - Kiếp Bạc, Đảo Cò Chi Lăng Nam, Chùa Thanh Mai.',
    dacSan: 'Bánh đậu xanh, Bánh gai Ninh Giang, Rươi Tứ Kỳ, Vải thiều Thanh Hà.',
    muaDep: 'Tháng 9 - Tháng 11 (Lễ hội Côn Sơn - Kiếp Bạc).',
    meo: 'Thưởng thức bánh đậu xanh tan trong miệng cùng tách trà mạn nóng!'
  },
  'hưng yên': {
    ten: 'Hưng Yên',
    anh: ANH_MAC_DINH,
    moTa: 'Phố Hiến xưa "Thứ nhất Kinh Kỳ, thứ nhì Phố Hiến".',
    diemDen: 'Cây đa Banyan, Chùa Chuông, Văn Miếu Xích Đằng, Hồ Nguyệt Đức.',
    dacSan: 'Nhãn lồng Hưng Yên, Bún thang lợn, Ếch om Phượng Tường, Chè hạt sen.',
    muaDep: 'Tháng 7 - Tháng 8 (Đúng mùa thu hoạch nhãn lồng mọng ngọt).',
    meo: 'Mua nhãn lồng chính gốc Phố Hiến làm quà thơm ngọt!'
  },
  'nam định': {
    ten: 'Nam Định',
    anh: ANH_MAC_DINH,
    moTa: 'Đất Cố đô Trần văn hiến và những nhà thờ kiến trúc Âu tuyệt đẹp.',
    diemDen: 'Đền Trần, Nhà thờ đổ Văn Lý, Nhà thờ Bùi Chu, Tòa thánh Phương Chính.',
    dacSan: 'Phở bò Nam Định, Bánh xíu báo, Bánh gai Bà Thi, Kẹo thần tài.',
    muaDep: 'Đêm 14 tháng Giêng âm lịch (Lễ khai ấn Đền Trần).',
    meo: 'Sáng làm đĩa Bánh xíu báo nóng hổi kèm tô Phở bò gia truyền!'
  },
  'ninh bình': {
    ten: 'Ninh Bình',
    anh: 'https://images.unsplash.com/photo-1528127269322-539801943592?w=800',
    moTa: 'Tuyệt tác Cố đô xưa với di sản thế giới Tràng An sơn thủy hữu tình.',
    diemDen: 'Tràng An, Tam Cốc - Bích Động, Hang Múa, Chùa Bái Đính, Tuyệt Tình Cốc.',
    dacSan: 'Cơm cháy sốt dê, Thịt dê núi tái chanh, Ốc núi Ninh Bình.',
    muaDep: 'Tháng 1 - Tháng 5 (Đi lễ xuân & Mùa lúa vàng Tam Cốc rực rỡ).',
    meo: 'Chinh phục Hang Múa 500 bậc thang ngắm trọn thung lũng lúa!'
  },
  'thái bình': {
    ten: 'Thái Bình',
    anh: ANH_MAC_DINH,
    moTa: 'Quê hương 5 tấn với bãi biển hoang sơ và Chùa Keo cổ kính.',
    diemDen: 'Chùa Keo, Biển vô cực Quang Lang, Biển Đồng Châu, Cồn Vần.',
    dacSan: 'Bánh cay Thái Bình, Bún bung hoa chuối, Canh cá quỳnh cừ.',
    muaDep: 'Tháng 9 - Tháng 10 (Săn bình minh tuyệt đẹp trên biển vô cực).',
    meo: 'Thức dậy từ 4h sáng ra biển Quang Lang ngắm mặt nước soi bóng trời!'
  },
  'vĩnh phúc': {
    ten: 'Vĩnh Phúc',
    anh: ANH_MAC_DINH,
    moTa: 'Thị trấn Tam Đảo bồng bềnh mây núi gần sát Hà Nội.',
    diemDen: 'Tam Đảo, Danh thắng Tây Thiên, Hồ Đại Lải, Làng hoa Me Linh.',
    dacSan: 'Ngọn su su xào tỏi, Bánh chưng gù, Dứa Tam Dương, Bánh hòn.',
    muaDep: 'Quanh năm (Lý tưởng cho chuyến đi trốn cuối tuần).',
    meo: 'Nghỉ dưỡng Tam Đảo thưởng thức đĩa ngọn su su xào giòn ngọt!'
  },

  // -------------------- II. MIỀN TRUNG & TÂY NGUYÊN --------------------
  'thanh hóa': {
    ten: 'Thanh Hóa',
    anh: ANH_MAC_DINH,
    moTa: 'Mảnh đất xứ Thanh vừa có biển Sầm Sơn rộn ràng vừa có Pù Luông xanh ngát.',
    diemDen: 'Biển Sầm Sơn, Khu bảo tồn Pù Luông, Thành nhà Hồ, Suối cá thần Cẩm Lương.',
    dacSan: 'Nem chua Thanh Hóa, Chả tôm, Bánh răng bừa, Mắm tép Bỉm Sơn.',
    muaDep: 'Tháng 5 - Tháng 10 (Mùa hè tắm biển Sầm Sơn / Ngắm lúa Pù Luông).',
    meo: 'Mua nem chua chuẩn Thanh Hóa về làm quà nhắm bia cực mê!'
  },
  'nghệ an': {
    ten: 'Nghệ An',
    anh: ANH_MAC_DINH,
    moTa: 'Quê hương Chủ tịch Hồ Chí Minh vĩ đại với biển Cửa Lò bao la.',
    diemDen: 'Khu di tích Kim Liên (Quê Bác), Biển Cửa Lò, Đồi chè Thanh Chương, Đảo Lan.',
    dacSan: 'Súp lươn Nghệ An, Nhút Thanh Chương, Tương Nam Đàn, Cam Xã Đoài.',
    muaDep: 'Tháng 6 - Tháng 8 (Mùa du lịch biển Cửa Lò rộn ràng).',
    meo: 'Thưởng thức tô Súp lươn cay nồng kèm bánh mì giòn tan buổi sáng!'
  },
  'hà tĩnh': {
    ten: 'Hà Tĩnh',
    anh: ANH_MAC_DINH,
    moTa: 'Khúc ruột miền Trung kiên cường với Biển Thiên Cầm trong xanh.',
    diemDen: 'Biển Thiên Cầm, Ngã ba Đồng Lộc, Chùa Hương Tích, Hồ Kẻ Gỗ.',
    dacSan: 'Kẹo cu đơ Hà Tĩnh, Bánh gối, Bún bò Đội Cung, Hến sông La.',
    muaDep: 'Tháng 5 - Tháng 8 (Tắm biển Thiên Cầm sóng êm đềm).',
    meo: 'Nhâm nhi miếng kẹo cu đơ giòn bùi bên tách trà xanh nóng!'
  },
  'quảng bình': {
    ten: 'Quảng Bình',
    anh: ANH_MAC_DINH,
    moTa: 'Vương quốc hang động thế giới sở hữu Phong Nha - Kẻ Bàng.',
    diemDen: 'Động Phong Nha, Động Thiên Đường, Hang Sơn Đoòng, Sông Chày - Hang Tối, Biển Nhật Lệ.',
    dacSan: 'Bánh lọc chao, Lẩu cá khoai, Bánh xèo Quảng Hòa, Khoai đèo.',
    muaDep: 'Tháng 4 - Tháng 8 (Mùa khô thuận lợi khám phá hang động).',
    meo: 'Thử chèo thuyền Kayak trên dòng Sông Chày xanh màu ngọc bích!'
  },
  'quảng trị': {
    ten: 'Quảng Trị',
    anh: ANH_MAC_DINH,
    moTa: 'Vùng đất thiêng anh hùng gắn liền với những chiến công lịch sử.',
    diemDen: 'Thành cổ Quảng Trị, Nghĩa trang Trường Sơn, Cầu Hiền Lương - Sông Bến Hải, Địa đạo Vịnh Mốc.',
    dacSan: 'Bánh lọc Mỹ Chánh, Bún hến Mai Xá, Cháo vạt giường, Trà chè vằng.',
    muaDep: 'Tháng 3 - Tháng 8 (Thời tiết khô ráo thuận tiện tham quan).',
    meo: 'Đến dâng hương tại Thành cổ Quảng Trị để tri ân các anh hùng liệt sĩ!'
  },
  'thừa thiên huế': {
    ten: 'Cố đô Huế',
    anh: 'https://images.unsplash.com/photo-1569154941061-e231b4725ef1?w=800',
    moTa: 'Thành phố mộng mơ trầm mặc giữ gìn hồn di sản dân tộc.',
    diemDen: 'Đại Nội Huế, Chùa Thiên Mụ, Lăng Khải Định, Lăng Tự Đức, Đồi Vọng Cảnh.',
    dacSan: 'Bún bò Huế, Cơm hến, Bánh bèo - nậm - lọc, Chè hẻm 20 món.',
    muaDep: 'Tháng 1 - Tháng 4 (Thời tiết mát mẻ dễ chịu nhất).',
    meo: 'Thuê áo dài chụp ảnh cổ phục tại Đại Nội và nghe Ca Huế Sông Hương!'
  },
  'huế': {
    ten: 'Xứ Huế mộng mơ',
    anh: 'https://images.unsplash.com/photo-1569154941061-e231b4725ef1?w=800',
    moTa: 'Vẻ đẹp hoàng cung trầm mặc lãng mạn.',
    diemDen: 'Kinh thành Huế, Đồi Thiên An, Chùa Thiên Mụ.',
    dacSan: 'Bún bò Huế chuẩn vị, Bánh bột lọc gói lá chuối.',
    muaDep: 'Tháng 1 - Tháng 4.',
    meo: 'Tối đi thuyền rồng ngắm hoàng hôn và nghe ca Huế trên sông Hương!'
  },
  'đà nẵng': {
    ten: 'Đà Nẵng',
    anh: 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=800',
    moTa: 'Thành phố đáng sống nhất Việt Nam với Cầu Vàng và biển Mỹ Khê.',
    diemDen: 'Sun World Bà Nà Hills, Cầu Rồng, Biển Mỹ Khê, Bán đảo Sơn Trà, Ngũ Hành Sơn.',
    dacSan: 'Mì Quảng, Bánh tráng thịt heo 2 đầu da, Bún chả cá, Hải sản.',
    muaDep: 'Tháng 2 - Tháng 8 (Nắng đẹp, biển êm sóng nhẹ).',
    meo: 'Xem Cầu Rồng phun lửa & nước lúc 21h tối Thứ 7 và Chủ Nhật!'
  },
  'quảng nam': {
    ten: 'Quảng Nam',
    anh: 'https://images.unsplash.com/photo-1552353617-3bfd679b3bdd?w=800',
    moTa: 'Mảnh đất 2 di sản thế giới Phố cổ Hội An và Thánh địa Mỹ Sơn.',
    diemDen: 'Phố cổ Hội An, Thánh địa Mỹ Sơn, Cù Lao Chàm, Rừng dừa Bảy Mẫu.',
    dacSan: 'Cao lầu, Cơm gà Hội An, Mì Quảng Phú Chiêm, Bánh đập hến xào.',
    muaDep: 'Tháng 2 - Tháng 7.',
    meo: 'Đến Hội An từ 17h chiều để ngắm khoảnh khắc phố cổ lên đèn lung linh!'
  },
  'hội an': {
    ten: 'Phố cổ Hội An (Quảng Nam)',
    anh: 'https://images.unsplash.com/photo-1552353617-3bfd679b3bdd?w=800',
    moTa: 'Không gian hoài cổ rợp bóng đèn lồng bên sông Hoài.',
    diemDen: 'Chùa Cầu, Nhà cổ Tấn Ký, Rừng dừa Bảy Mẫu, Cù Lao Chàm.',
    dacSan: 'Bánh mì Phượng, Cao lầu, Bánh hoa hồng trắng.',
    muaDep: 'Tháng 2 - Tháng 7.',
    meo: 'Đi thuyền thả đèn hoa đăng trên sông Hoài gửi gắm ước nguyện!'
  },
  'quảng ngãi': {
    ten: 'Quảng Ngãi',
    anh: ANH_MAC_DINH,
    moTa: 'Quê hương Đảo Lý Sơn - Thiên đường núi lửa giữa đại dương.',
    diemDen: 'Đảo Lý Sơn (Cổng Tỏ Vò, Đỉnh Thới Lới), Bãi biển Mỹ Khê Quảng Ngãi, Ba Làng An.',
    dacSan: 'Don Quảng Ngãi, Cúm núm Lý Sơn, Tỏi cô đơn, Kẹo gương, Bánh đập.',
    muaDep: 'Tháng 4 - Tháng 8 (Biển lặng sóng vô cùng thích hợp du lịch đảo).',
    meo: 'Check-in Cổng Tỏ Vò Lý Sơn vào lúc bình minh đẹp mê ngẩn!'
  },
  'bình định': {
    ten: 'Bình Định - Quy Nhơn',
    anh: ANH_MAC_DINH,
    moTa: 'Đất võ trời văn với biển Quy Nhơn trong xanh và Kỳ Co - Eo Gió.',
    diemDen: 'Eo Gió, Bãi tắm Kỳ Co, Tháp Chăm Bánh Ít, Khu dã ngoại Trung Lương, Đồi cát Phương Mai.',
    dacSan: 'Bánh xèo tôm nhảy, Bún chả cá Quy Nhơn, Tré bó rơm, Bánh ít lá gai.',
    muaDep: 'Tháng 3 - Tháng 9 (Thời tiết nắng trong, biển trong như ngọc).',
    meo: 'Đến Eo Gió ngắm con đường đi bộ ven biển đẹp nhất Việt Nam!'
  },
  'phú yên': {
    ten: 'Phú Yên',
    anh: ANH_MAC_DINH,
    moTa: 'Xứ sở "Tôi thấy hoa vàng trên cỏ xanh" bình yên rợp sóng.',
    diemDen: 'Gành Đá Đĩa, Mũi Điện (Đón bình minh sớm nhất), Bãi Xép, Tháp Nghinh Phong, Cầu gỗ Ông Tơ.',
    dacSan: 'Mắt cá ngừ đại dương hầm thuốc bắc, Bánh hỏi lòng heo, Sò huyết Ô Loan, Cơm gà.',
    muaDep: 'Tháng 1 - Tháng 8 (Trời xanh mát, bãi biển sóng em).',
    meo: 'Đón những tia nắng bình minh đầu tiên trên đất liền tại Mũi Điện!'
  },
  'khánh hòa': {
    ten: 'Khánh Hòa - Nha Trang',
    anh: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800',
    moTa: 'Thiên đường biển đảo tuyệt đẹp với Vịnh Nha Trang quyến rũ.',
    diemDen: 'VinWonders Nha Trang, Hòn Mun, Hòn Tằm, Tháp Bà Ponagar, Biển Dốc Lết.',
    dacSan: 'Nem nướng Ninh Hòa, Bún sứa, Bò Lạc Cảnh, Hải sản Chợ Đêm.',
    muaDep: 'Tháng 1 - Tháng 8 (Nắng đẹp biển êm).',
    meo: 'Nên trải nghiệm dịch vụ tắm bùn khoáng nóng thư giãn thư thái!'
  },
  'nha trang': {
    ten: 'Thành phố Nha Trang',
    anh: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800',
    moTa: 'Phố biển năng động với hàng dừa xanh ngát.',
    diemDen: 'Đảo Hòn Mun, Đảo Tằm, VinWonders, Tháp Bà Ponagar.',
    dacSan: 'Bún chả cá Nha Trang, Nem nướng Đặng Văn Quyên.',
    muaDep: 'Tháng 1 - Tháng 8.',
    meo: 'Tối đi dạo đường bờ biển Trần Phú tận hưởng gió biển mát rượi!'
  },
  'ninh thuận': {
    ten: 'Ninh Thuận',
    anh: ANH_MAC_DINH,
    moTa: 'Vùng đất nắng gió với những vườn nho trĩu quả và Hang Rái kỳ ảo.',
    diemDen: 'Vịnh Vĩnh Hy, Hang Rái, Đồng cừu An Hòa, Tháp Po Klong Garai, Vườn nho Thái An.',
    dacSan: 'Bánh căn / Bánh xèo Phan Rang, Nho tươi Ninh Thuận, Thịt dông cát, Cừu nướng.',
    muaDep: 'Tháng 8 - Tháng 10 (Đúng mùa thu hoạch nho chín mọng).',
    meo: 'Vào tận vườn nho Thái An tự tay hái và thưởng thức tại chỗ!'
  },
  'bình thuận': {
    ten: 'Bình Thuận - Phan Thiết',
    anh: ANH_MAC_DINH,
    moTa: 'Thủ đô resort Mũi Né với những đồi cát mênh mông như sa mạc.',
    diemDen: 'Đồi Cát Bay Mũi Né, Bàu Trắng, Suối Tiên, Làng chài Mũi Né, Hải đăng Ke Ga.',
    dacSan: 'Lẩu thả Phan Thiết, Bánh xèo Tuyên Quang, Mực một nắng, Bánh quấy.',
    muaDep: 'Tháng 11 - Tháng 4 năm sau (Mùa biển xanh rực rỡ, gió lộng).',
    meo: 'Trải nghiệm lái xe địa hình mô tô vượt đỉnh Đồi cát Bàu Trắng!'
  },
  'kon tum': {
    ten: 'Kon Tum',
    anh: ANH_MAC_DINH,
    moTa: 'Vùng đất Tây Nguyên cổ kính nơi có Nhà thờ Gỗ độc đáo.',
    diemDen: 'Nhà thờ Gỗ Kon Tum, Tòa Giám mục, Cầu treo Kon Klor, Măng Đen (Đà Lạt thứ 2).',
    dacSan: 'Gỏi lá Kon Tum, Cơm lam gà nướng, Cá tầm Măng Đen, Rượu cần.',
    muaDep: 'Tháng 11 - Tháng 4 (Mùa hoa dã quỳ & hoa cà phê nở trắng rừng).',
    meo: 'Thưởng thức đĩa Gỏi lá quy tụ hơn 40 loại lá rừng Tây Nguyên!'
  },
  'gia lai': {
    ten: 'Gia Lai',
    anh: ANH_MAC_DINH,
    moTa: 'Phố núi Pleiku rợp bóng thông reo và Biển Hồ T\'Nưng xanh ngắt.',
    diemDen: 'Biển Hồ T\'Nưng, Núi lửa Chư Đăng Ya, Chùa Minh Thành, Hàng thông trăm tuổi.',
    dacSan: 'Phở hai bát Pleiku (Phở khô), Bún mắm nêm, Gà nướng Sa Bộc, Bò một nắng.',
    muaDep: 'Tháng 11 - Tháng 12 (Mùa hoa dã quỳ nở vàng rực Núi lửa Chư Đăng Ya).',
    meo: 'Ăn Phở khô nhớ dùng 1 bát khô riêng và 1 bát nước dùng riêng đúng chuẩn!'
  },
  'đắk lắk': {
    ten: 'Đắk Lắk',
    anh: ANH_MAC_DINH,
    moTa: 'Thủ phủ cà phê Việt Nam với Buôn Ma Thuột hùng vĩ.',
    diemDen: 'Bảo tàng Thế giới Cà phê, Buôn Đôn, Cụm thác Dray Nur - Dray Sap, Hồ Lắk.',
    dacSan: 'Bún đỏ Buôn Ma Thuột, Gà nướng cơm lam, Lẩu cá lăng sông Sêrêpôk, Cà phê Buôn Ma Thuột.',
    muaDep: 'Tháng 12 - Tháng 3 (Mùa hoa cà phê nở trắng bạt ngàn các ngọn đồi).',
    meo: 'Ghé Bảo tàng Cà phê thưởng thức ly cà phê đậm đà nhất Tây Nguyên!'
  },
  'đắk nông': {
    ten: 'Đắk Nông',
    anh: ANH_MAC_DINH,
    moTa: 'Công viên địa chất toàn cầu với Công viên Hang động Núi lửa Tà Đùng.',
    diemDen: 'Hồ Tà Đùng (Vịnh Hạ Long trên Tây Nguyên), Thác Liêng Nung, Thác Đray Sap.',
    dacSan: 'Cá lăng nướng than hồng, Rượu cần, Bún mắm miền Tây tại chợ, Cam sành.',
    muaDep: 'Tháng 11 - Tháng 4 (Mùa khô hồ Tà Đùng nước xanh ngắt đẹp nhất).',
    meo: 'Check-in ngắm toàn cảnh các hòn đảo nhỏ trên Hồ Tà Đùng từ trên cao!'
  },
  'lâm đồng': {
    ten: 'Lâm Đồng - Đà Lạt',
    anh: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800',
    moTa: 'Thành phố sương mờ lãng mạn xứ sở ngàn hoa.',
    diemDen: 'Hồ Tuyền Lâm, Quảng trường Lâm Viên, Đồi chè Cầu Đất, Langbiang, Chợ đêm Đà Lạt.',
    dacSan: 'Lẩu gà lá é, Lẩu bò Ba Toa, Bánh mì xíu mại nóng, Bánh căn, Kem bơ.',
    muaDep: 'Tháng 11 - Tháng 4 (Mùa dã quỳ, mai anh đào & săn mây).',
    meo: 'Nhớ mang áo len dày dạo chợ đêm; dậy 4h30 đi săn mây Cầu Đất!'
  },
  'đà lạt': {
    ten: 'Thành phố Đà Lạt',
    anh: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800',
    moTa: 'Thành phố ngàn hoa với khí hậu se lạnh quanh năm.',
    diemDen: 'Hồ Xuân Hương, Thung lũng Tình Yêu, Thiền viện Trúc Lâm.',
    dacSan: 'Bánh căn góc cây bơ, Lẩu gà lá é Tao Ngộ, Sữa đậu nành nóng.',
    muaDep: 'Tháng 11 - Tháng 4.',
    meo: 'Thuê chiếc xe máy chạy quanh các con dốc ngắm hoàng hôn thung lũng!'
  },

  // -------------------- III. MIỀN NAM --------------------
  'tp.hồ chí minh': {
    ten: 'TP. Hồ Chí Minh (Sài Gòn)',
    anh: 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=800',
    moTa: 'Trung tâm phồn hoa, năng động và không ngủ.',
    diemDen: 'Dinh Độc Lập, Bưu điện TP, Landmark 81, Phố đi bộ Nguyễn Huệ, Địa đạo Củ Chi.',
    dacSan: 'Cơm tấm sườn bì chả, Hủ tiếu Nam Vang, Bánh mì Sài Gòn, Ốc đêm đường Vĩnh Khánh.',
    muaDep: 'Tháng 12 - Tháng 4 (Mùa khô trời nắng đẹp trọn vẹn).',
    meo: 'Ngồi cà phê bệt hông Nhà thờ Đức Bà để cảm nhận chất Sài Gòn rất riêng!'
  },
  'sài gòn': {
    ten: 'Sài Gòn hoa lệ',
    anh: 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=800',
    moTa: 'Sôi động hiện đại với nét văn hóa đường phố phóng khoáng.',
    diemDen: 'Chợ Bến Thành, Bến Bạch Đằng, Bùi Viện, Landmark 81.',
    dacSan: 'Cơm tấm đêm, Bánh mì, Hủ tiếu gõ, Trà sữa.',
    muaDep: 'Tháng 12 - Tháng 4.',
    meo: 'Đi Waterbus ngắm sông Sài Gòn rực rỡ lúc hoàng hôn!'
  },
  'bà rịa - vũng tàu': {
    ten: 'Bà Rịa - Vũng Tàu',
    anh: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800',
    moTa: 'Phố biển Vũng Tàu rộn ràng và Côn Đảo linh thiêng giữa đại dương.',
    diemDen: 'Bãi Sau Vũng Tàu, Tượng Chúa Kito, Mũi Nghinh Phong, Côn Đảo (Viếng Mộ Cô Sáu).',
    dacSan: 'Bánh khọt Cô Ba, Lẩu cá đuối Trương Công Định, Bánh bông lan trứng muối.',
    muaDep: 'Quanh năm (Côn Đảo đi đẹp nhất từ tháng 3 - tháng 9).',
    meo: 'Thưởng thức đĩa bánh khọt giòn rụm vừa chiên xong kèm rau sống!'
  },
  'vũng tàu': {
    ten: 'Thành phố Vũng Tàu',
    anh: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800',
    moTa: 'Biển xanh gần gũi thích hợp cho nghỉ dưỡng ngẫu hứng.',
    diemDen: 'Hải đăng Vũng Tàu, Bãi Trước, Bãi Sau, Mũi Nghinh Phong.',
    dacSan: 'Lẩu cá đuối, Bánh khọt Gốc Cột Điện.',
    muaDep: 'Cuối tuần quanh năm.',
    meo: 'Check-in Cổng trời Mũi Nghinh Phong nhìn thẳng ra biển rộng!'
  },
  'bình dương': {
    ten: 'Bình Dương',
    anh: ANH_MAC_DINH,
    moTa: 'Thủ phủ công nghiệp kết hợp khu du lịch tâm linh & làng nghề cổ.',
    diemDen: 'Khu du lịch Đại Nam, Chùa Bà Thiên Hậu, Làng gốm Lái Thiêu, Nhà cổ Trần Văn Lạc.',
    dacSan: 'Bánh bèo bì Chợ Búng, Lẩu bò mắm ruốc, Măng cụt Lái Thiêu, Gà nướng niêu.',
    muaDep: 'Tháng 5 - Tháng 8 (Đúng mùa trái cây chín rộ Lái Thiêu).',
    meo: 'Vào vườn măng cụt Lái Thiêu thưởng thức gỏi gà măng cụt trứ danh!'
  },
  'bình phước': {
    ten: 'Bình Phước',
    anh: ANH_MAC_DINH,
    moTa: 'Mảnh đất miền Đông Nam Bộ rợp bóng cao su và vườn điều bạt ngàn.',
    diemDen: 'Vườn quốc gia Bù Gia Mập, Núi Bà Rá - Hồ Thác Mơ, Trảng cỏ Bù Lách.',
    dacSan: 'Hạt điều rang muối Bình Phước, Đọt mây nướng, Vịt quay lá mắc mật, Ve sầu chiên giòn.',
    muaDep: 'Tháng 12 - Tháng 3 (Mùa lá cao su đổ vàng thay lá siêu đẹp).',
    meo: 'Check-in con đường lá cao su mùa thay lá như khung cảnh châu Âu!'
  },
  'đồng nai': {
    ten: 'Đồng Nai',
    anh: ANH_MAC_DINH,
    moTa: 'Mảnh đất miền Đông giàu thiên nhiên hoang sơ và trái cây mọng ngọt.',
    diemDen: 'Vườn quốc gia Cát Tiên, Khu du lịch Bửu Long, Thác Giang Điền, Vườn trái cây Long Khánh.',
    dacSan: 'Trái cây Long Khánh (Chôm chôm, sầu riêng), Dát bò Đồng Nai, Lẩu lá khổ qua rừng.',
    muaDep: 'Tháng 5 - Tháng 8 (Mùa trái cây Long Khánh chín rộ).',
    meo: 'Ghé Vườn quốc gia Cát Tiên xem thú ban đêm cực thú vị!'
  },
  'tây ninh': {
    ten: 'Tây Ninh',
    anh: 'https://images.unsplash.com/photo-1528127269322-539801943592?w=800',
    moTa: 'Vùng đất thánh tâm linh với Nóc nhà Nam Bộ Núi Bà Đen.',
    diemDen: 'Núi Bà Đen, Tòa Thánh Tây Ninh, Hồ Dầu Tiếng, Ma Thiên Lãnh.',
    dacSan: 'Bánh tráng phơi sương Trảng Bàng cuốn rau rừng, Bò tơ Tây Ninh, Muối tôm.',
    muaDep: 'Tháng 12 - Tháng 5 (Mùa khô thuận tiện đi cáp treo).',
    meo: 'Đi cáp treo lên đỉnh Núi Bà Đen chiêm bái Tượng Phật Bà Tây Bổ Đà Sơn!'
  },
  'an giang': {
    ten: 'An Giang',
    anh: ANH_MAC_DINH,
    moTa: 'Vùng đất Thất Sơn huyền bí với Rừng tràm Tra Cửu xanh ngát.',
    diemDen: 'Rừng tràm Trà Cửu, Miếu Bà Chúa Xúc Núi Sam, Núi Cấm, Chợ Mới.',
    dacSan: 'Mắm Châu Đốc, Lẩu mắm, Bánh bò thốt nốt, Gà đốt Mộc Bài, Bún cá Châu Đốc.',
    muaDep: 'Tháng 9 - Tháng 11 (Mùa nước nổi miền Tây đẹp rực rỡ).',
    meo: 'Đi tắc ráng lướt qua thảm bèo xanh mướt tại Rừng tràm Trà Cửu!'
  },
  'bạc liêu': {
    ten: 'Bạc Liêu',
    anh: ANH_MAC_DINH,
    moTa: 'Quê hương Công tử Bạc Liêu và bản Đạ Cổ Hoài Lang bất hủ.',
    diemDen: 'Nhà Công tử Bạc Liêu, Cánh đồng quạt gió Bạc Liêu, Nhà hát Cao Văn Lầu, Chùa Ghositaram.',
    dacSan: 'Lẩu mắm Bạc Liêu, Bánh xèo Bạc Liêu, Ba khía muối, Bún nước lèo.',
    muaDep: 'Quanh năm (Trời nắng xanh check-in cánh đồng quạt gió đẹp nhất).',
    meo: 'Ghé Nhà Công tử Bạc Liêu nghe lại những giai thoại hào sảng xưa!'
  },
  'bến tre': {
    ten: 'Bến Tre',
    anh: ANH_MAC_DINH,
    moTa: 'Xứ sở dừa xanh mát dải đất phù sa đồng bằng.',
    diemDen: 'Cồn Phụng, Khu du lịch Lan Vương, Vườn trái cây Cái Mơn, Chùa Tuyên Linh.',
    dacSan: 'Kẹo dừa Bến Tre, Cơm dừa, Dừa sáp, Bánh xèo hến Cồn Phụng, Đuông dừa.',
    muaDep: 'Tháng 6 - Tháng 8 (Mùa trái cây chín trĩu cành).',
    meo: 'Chèo xuồng ba lá trong các rạch dừa nước rợp bóng mát!'
  },
  'cà mau': {
    ten: 'Cà Mau',
    anh: ANH_MAC_DINH,
    moTa: 'Mảnh đất cực Nam Tổ quốc nơi rừng u minh chạm biển bao la.',
    diemDen: 'Mũi Cà Mau (Cột mốc cực Nam), Vườn quốc gia U Minh Hạ, Hòn Đá Bạc, Đầm Thị Tường.',
    dacSan: 'Cua Cà Mau trứ danh, Ba khía Rạch Gốc, Cá thòi lòi nướng muối ớt, Lẩu mắm.',
    muaDep: 'Tháng 12 - Tháng 4 (Mùa khô thuận tiện di chuyển ra Mũi).',
    meo: 'Check-in Cột mốc tọa độ quốc gia GPS 0001 tại Đất Mũi Cà Mau!'
  },
  'cần thơ': {
    ten: 'Thủ phủ Cần Thơ',
    anh: ANH_MAC_DINH,
    moTa: 'Thủ phủ miền Tây sông nước đong đầy tình người.',
    diemDen: 'Chợ nổi Cái Răng, Bến Ninh Kiều, Cồn Sơn, Nhà cổ Bình Thủy.',
    dacSan: 'Lẩu mắm Cần Thơ, Bánh xèo măng xơ đống, Bánh tét lá cẩm, Hủ tiếu giòn.',
    muaDep: 'Tháng 9 - 11 (Mùa nước nổi) & Tháng 6 - 8 (Mùa trái cây chín).',
    meo: 'Đi chợ nổi Cái Răng từ 5h00 sáng để cảm nhận nhịp sống nhộn nhịp!'
  },
  'đồng tháp': {
    ten: 'Đồng Tháp',
    anh: ANH_MAC_DINH,
    moTa: 'Đất Sen Hồng rực rỡ với Vườn quốc gia Tràm Chim.',
    diemDen: 'Khu du lịch Xẻo Quýt, Vườn quốc gia Tràm Chim, Làng hoa Sa Đéc, Nhà cổ Huỳnh Thủy Lê.',
    dacSan: 'Nem Lai Vung, Bánh ướt Sa Đéc, Hủ tiếu Sa Đéc, Các món ăn chế biến từ Sen.',
    muaDep: 'Tháng 1 - Tháng 2 (Làng hoa Sa Đéc nở rực rỡ đón Tết).',
    meo: 'Thưởng thức tô Hủ tiếu Sa Đéc nước dùng ngọt thanh đậm đà!'
  },
  'hậu giang': {
    ten: 'Hậu Giang',
    anh: ANH_MAC_DINH,
    moTa: 'Vùng đất bình yên ven dòng sông Hậu hiền hòa.',
    diemDen: 'Khu bảo tồn thiên nhiên Lung Ngọc Hoàng, Chợ nổi Ngã Bảy, Công viên Xà No.',
    dacSan: 'Cá thát lát rút xương chiên giòn, Khóm Cầu Đúc, Bánh xèo củ hủ dừa.',
    muaDep: 'Tháng 9 - Tháng 11 (Mùa nước nổi Lung Ngọc Hoàng xanh biếc).',
    meo: 'Thưởng thức Chả cá thát lát dai giòn thơm ngon chuẩn vị!'
  },
  'kiên giang': {
    ten: 'Kiên Giang - Phú Quốc',
    anh: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800',
    moTa: 'Thiên đường biển đảo Đảo Ngọc Phú Quốc và Quần đảo Nam Du.',
    diemDen: 'Phú Quốc (Grand World, Bãi Sao, Cáp treo Hòn Thơm), Nam Du, Hà Tiên.',
    dacSan: 'Bún quậy Kiến Xây, Gỏi cá trích, Nhum biển nướng, Nước mắm Phú Quốc.',
    muaDep: 'Tháng 10 - Tháng 4 năm sau (Mùa khô biển trong ngọc bích).',
    meo: 'Đón hoàng hôn lung linh tại Sunset Sanato Phú Quốc!'
  },
  'phú quốc': {
    ten: 'Đảo Ngọc Phú Quốc (Kiên Giang)',
    anh: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800',
    moTa: 'Thiên đường nghỉ dưỡng biển xanh cát trắng mịn.',
    diemDen: 'Grand World, VinWonders, Bãi Sao, Chợ đêm Phú Quốc.',
    dacSan: 'Bún quậy tự pha, Gỏi cá trích, Hải sản tươi.',
    muaDep: 'Tháng 10 - Tháng 4.',
    meo: 'Tự tay pha chế nước chấm theo vị riêng khi ăn Bún quậy!'
  },
  'long an': {
    ten: 'Long An',
    anh: ANH_MAC_DINH,
    moTa: 'Cửa ngõ kết nối TP.HCM với miền Tây sông nước dạt dào.',
    diemDen: 'Làng nổi Tân Lập, Khu du lịch Cánh Đồng Bất Tận, Chùa Tôn Thạnh.',
    dacSan: 'Lạp xưởng tươi Cần Đước, Rượu Gò Đen, Gạo tài nguyên, Thanh long.',
    muaDep: 'Tháng 8 - Tháng 11 (Làng nổi Tân Lập rợp bóng rừng tràm).',
    meo: 'Bắt chiếc xuồng ba lá xuôi dòng con đường xuyên rừng tràm Tân Lập!'
  },
  'sóc trăng': {
    ten: 'Sóc Trăng',
    anh: ANH_MAC_DINH,
    moTa: 'Sự giao thoa văn hóa độc đáo Kinh - Hoa - Khmer với những ngôi chùa vàng.',
    diemDen: 'Chùa Dơi, Chùa Som Rong, Chùa Chén Kiểu, Cồn Mỹ Phước.',
    dacSan: 'Bánh pía Sóc Trăng, Bún nước lèo, Bánh cống, Bánh gừng.',
    muaDep: 'Tháng 10 âm lịch (Lễ hội Oóc Om Bóc & Đua ghe Ngộ).',
    meo: 'Thưởng thức chiếc Bánh pía sầu riêng trứng muối nóng hổi ngọt bùi!'
  },
  'tiền giang': {
    ten: 'Tiền Giang',
    anh: ANH_MAC_DINH,
    moTa: 'Vùng đất cây trái xum xuê bên dòng sông Tiền hiền hòa.',
    diemDen: 'Cù lao Thới Sơn, Chợ nổi Cái Bè, Chùa Vĩnh Tràng, Biển Tân Thành.',
    dacSan: 'Hủ tiếu Mỹ Tho, Vú sữa Lò Rèn, Dứa Tân Phước, Mắm còng.',
    muaDep: 'Tháng 6 - Tháng 8 (Mùa trái cây chín rộ ngọt mọng).',
    meo: 'Thưởng thức tô Hủ tiếu Mỹ Tho tôm thịt ngọt thanh hấp dẫn!'
  },
  'trà vinh': {
    ten: 'Trà Vinh',
    anh: ANH_MAC_DINH,
    moTa: 'Vùng đất rợp bóng cây cổ thụ nghìn năm và Chùa Khmer cổ kính.',
    diemDen: 'Ao Bà Om, Chùa Hang, Chùa Âng, Biển Ba Động, Cù lao Long Trị.',
    dacSan: 'Bún nước lèo Trà Vinh, Dừa sáp Cầu Kè, Bánh tét Trà Cuôn.',
    muaDep: 'Tháng 10 âm lịch (Lễ hội Ok Om Bok rộn ràng).',
    meo: 'Nhớ thử món Dừa sáp dầm đá đường béo ngậy khó cưỡng!'
  },
  'vĩnh long': {
    ten: 'Vĩnh Long',
    anh: ANH_MAC_DINH,
    moTa: 'Mảnh đất sinh thái cù lao bạt ngàn vườn cây ăn trái.',
    diemDen: 'Cù lao An Bình, Chùa Tiên Châu, Làng gạch Mang Thít, Nhà cổ Cai Cường.',
    dacSan: 'Cá cháy sông Hậu, Bưởi năm roi Bình Minh, Tai tượng chiên xù.',
    muaDep: 'Tháng 5 - Tháng 7 (Thỏa sức hái trái cây tại vườn cù lao).',
    meo: 'Trải nghiệm làm nông dân bắt cá lóc nướng trui tại vườn!'
  }
};

// =========================================================================
// 5. BỘ HÀM TẠO PAYLOAD DIALOGFLOW ES (HELPER FUNCTIONS)
// =========================================================================

/**
 * Tạo Thẻ tương tác cho một tỉnh thành cụ thể (Có gắn kèm thông tin lịch sử người dùng)
 */
function taoResponseRichText(tinhData, subTopic = 'all', userState = null) {
  let subTitleText = '';

  if (subTopic === 'dacSan') {
    subTitleText = `🍲 ĐẶC SẢN PHẢI THỬ:\n${tinhData.dacSan}\n\n💡 Mẹo HDV: ${tinhData.meo}`;
  } else if (subTopic === 'diemDen') {
    subTitleText = `🏔️ ĐIỂM CHECK-IN NỔI BẬT:\n${tinhData.diemDen}\n\n☀️ Mùa đẹp: ${tinhData.muaDep}`;
  } else if (subTopic === 'meo') {
    subTitleText = `💡 BÍ KÍP HDV BẬT MÍ:\n${tinhData.meo}\n\n☀️ Mùa đẹp: ${tinhData.muaDep}`;
  } else {
    subTitleText = `${tinhData.moTa}\n\n🏔️ Điểm đến: ${tinhData.diemDen}\n🍲 Đặc sản: ${tinhData.dacSan}\n☀️ Mùa đẹp: ${tinhData.muaDep}`;
  }

  // TÍCH LŨY THÔNG MINH: Thêm dòng thông báo lịch sử đã xem nếu có
  let fullFulfillmentText = `🎩 HDV DU LỊCH: ${tinhData.ten.toUpperCase()}\n\n${subTitleText}`;
  if (userState && userState.lichSuXem.length > 1) {
    const demLichSu = userState.lichSuXem.length;
    fullFulfillmentText += `\n\n📌 (Bạn đã khám phá ${demLichSu} điểm đến trong phiên này)`;
  }

  return {
    fulfillmentText: fullFulfillmentText,
    fulfillmentMessages: [
      {
        card: {
          title: `🎩 HDV DU LỊCH: ${tinhData.ten.toUpperCase()}`,
          subtitle: subTitleText.length > 240 ? subTitleText.substring(0, 237) + '...' : subTitleText,
          imageUri: tinhData.anh || ANH_MAC_DINH,
          buttons: [
            { text: '🏔️ Điểm Tham Quan', postback: `điểm chơi ${tinhData.ten}` },
            { text: '🍲 Món Ngon Đặc Sản', postback: `ăn gì ${tinhData.ten}` },
            { text: '💡 Mẹo HDV Bật Mí', postback: `mẹo ${tinhData.ten}` }
          ]
        }
      }
    ]
  };
}

/**
 * Tạo Thẻ thông tin danh sách Vùng Miền
 */
function taoCardMien(dataMien) {
  const titleText = `🗺️ KHÁM PHÁ ${dataMien.ten.toUpperCase()}`;
  const subTitleText = `${dataMien.moTa}\n\n📍 Các tỉnh tiêu biểu: ${dataMien.tinhThanh}`;

  return {
    fulfillmentText: `${titleText}\n\n${subTitleText}\n\n💡 Gõ tên tỉnh bất kỳ (hoặc gõ không dấu/sai chính tả) em vẫn hiểu nhé!`,
    fulfillmentMessages: [
      {
        card: {
          title: titleText,
          subtitle: subTitleText.length > 240 ? subTitleText.substring(0, 237) + '...' : subTitleText,
          imageUri: dataMien.anh,
          buttons: [
            { text: "🌲 Chọn Miền Bắc", postback: "Miền Bắc" },
            { text: "🌊 Chọn Miền Trung", postback: "Miền Trung" },
            { text: "🌴 Chọn Miền Nam", postback: "Miền Nam" }
          ]
        }
      }
    ]
  };
}

/**
 * Tạo Thẻ Chào mặc định
 */
function taoWelcomeCard() {
  return {
    fulfillmentText: "🎩 **Dạ em chào quý khách! Em là Hướng dẫn viên du lịch cá nhân 63 Tỉnh Thành đây ạ!**\n\nQuý khách muốn cùng em khám phá du lịch tại miền nào?",
    fulfillmentMessages: [
      {
        card: {
          title: "🎩 HDV DU LỊCH 63 TỈNH THÀNH",
          subtitle: "Vui lòng chọn vùng miền hoặc gõ tên Tỉnh/Thành bạn muốn tham quan khám phá:",
          imageUri: "https://images.unsplash.com/photo-1528127269322-539801943592?w=800",
          buttons: [
            { text: "🌲 Khám Phá Miền Bắc", postback: "Miền Bắc" },
            { text: "🌊 Khám Phá Miền Trung", postback: "Miền Trung" },
            { text: "🌴 Khám Phá Miền Nam", postback: "Miền Nam" }
          ]
        }
      }
    ]
  };
}

// =========================================================================
// 6. ROUTING KHỞI TẠO VÀ XỬ LÝ WEBHOOK
// =========================================================================

app.get('/', (req, res) => {
  res.send('<h3>🎙️ Webhook Bot Du Lịch 63 Tỉnh Thành (Tích hợp Fuzzy Matching & Session Memory) đang hoạt động!</h3>');
});

app.post('/', (req, res) => {
  const queryResult = req.body.queryResult || {};
  const userQuery = (queryResult.queryText || '').toLowerCase().trim();

  // -----------------------------------------------------------------------
  // BƯỚC 1: KHỞI TẠO HOẶC LẤY BỘ NHỚ PHIÊN CHAT (SESSION STATE)
  // -----------------------------------------------------------------------
  const sessionId = req.body.session || 'default_session';
  if (!boNhoNguoiDung.has(sessionId)) {
    boNhoNguoiDung.set(sessionId, {
      lichSuXem: [],
      mienQuanTam: null,
      thoiGianBatDau: new Date()
    });
  }
  const userState = boNhoNguoiDung.get(sessionId);

  // -----------------------------------------------------------------------
  // BƯỚC 2: XỬ LÝ LỌC THEO VÙNG MIỀN
  // -----------------------------------------------------------------------
  if (userQuery.includes('miền bắc') || userQuery.includes('mien bac')) {
    userState.mienQuanTam = 'Miền Bắc';
    return res.json(taoCardMien(danhSachMien['miền bắc']));
  }
  if (userQuery.includes('miền trung') || userQuery.includes('mien trung')) {
    userState.mienQuanTam = 'Miền Trung';
    return res.json(taoCardMien(danhSachMien['miền trung']));
  }
  if (userQuery.includes('miền nam') || userQuery.includes('mien nam')) {
    userState.mienQuanTam = 'Miền Nam';
    return res.json(taoCardMien(danhSachMien['miền nam']));
  }

  // -----------------------------------------------------------------------
  // BƯỚC 3: XỬ LÝ PHÂN TÍCH NGỮ CẢNH CHUYÊN SÂU
  // -----------------------------------------------------------------------
  let subTopic = 'all';
  if (userQuery.includes('ăn gì') || userQuery.includes('đặc sản') || userQuery.includes('món ngon')) {
    subTopic = 'dacSan';
  } else if (userQuery.includes('điểm') || userQuery.includes('chơi gì') || userQuery.includes('check-in')) {
    subTopic = 'diemDen';
  } else if (userQuery.includes('mẹo') || userQuery.includes('lời khuyên') || userQuery.includes('mùa đẹp')) {
    subTopic = 'meo';
  }

  // -----------------------------------------------------------------------
  // BƯỚC 4: TÌM KIẾM TỈNH THÀNH BẰNG THUẬT TOÁN KẾT HỢP (EXACT + FUZZY MATCHING)
  // -----------------------------------------------------------------------
  let tinhTimThay = null;
  let doThichHopCaoNhat = 0;
  const câuHỏiKhongDau = loaiBoDau(userQuery);

  // 1. Quét tìm chính xác từ khóa / chuỗi con
  for (const key in duLieuCacTinh) {
    const tenTinhKhongDau = loaiBoDau(key);
    if (câuHỏiKhongDau.includes(tenTinhKhongDau)) {
      tinhTimThay = duLieuCacTinh[key];
      break;
    }
  }

  // 2. Nếu gõ sai hoặc không khớp từ khóa -> Chạy Thuật toán Fuzzy Matching
  if (!tinhTimThay) {
    const cacTu = câuHỏiKhongDau.split(' ');
    
    for (const key in duLieuCacTinh) {
      const tenTinhKhongDau = loaiBoDau(key);
      
      // So sánh nguyên câu hỏi với tên tỉnh
      const scoreFull = tinhDoTuongDong(câuHỏiKhongDau, tenTinhKhongDau);
      if (scoreFull > doThichHopCaoNhat && scoreFull >= 0.55) {
        doThichHopCaoNhat = scoreFull;
        tinhTimThay = duLieuCacTinh[key];
      }

      // So sánh từng từ trong câu hỏi với tên tỉnh
      for (const tu of cacTu) {
        if (tu.length >= 3) {
          const scoreWord = tinhDoTuongDong(tu, tenTinhKhongDau);
          if (scoreWord > doThichHopCaoNhat && scoreWord >= 0.65) {
            doThichHopCaoNhat = scoreWord;
            tinhTimThay = duLieuCacTinh[key];
          }
        }
      }
    }
  }

  // Bắt được tỉnh thành -> Trả về kết quả & Tích lũy bộ nhớ
  if (tinhTimThay) {
    if (!userState.lichSuXem.includes(tinhTimThay.ten)) {
      userState.lichSuXem.push(tinhTimThay.ten);
    }
    return res.json(taoResponseRichText(tinhTimThay, subTopic, userState));
  }

  // -----------------------------------------------------------------------
  // BƯỚC 5: XỬ LÝ CÂU HỎI VỀ CHI PHÍ
  // -----------------------------------------------------------------------
  if (userQuery.includes('chi phí') || userQuery.includes('giá') || userQuery.includes('bao nhiêu')) {
    return res.json({
      fulfillmentText: `🎩 **Dạ em HDV xin tư vấn mức chi phí du lịch tham khảo ạ**:

💵 **Tour Tiết Kiệm (3N2Đ)**: ~ 2.000.000đ - 3.500.000đ/người.
💎 **Tour Nghỉ Dưỡng (3N2Đ)**: ~ 4.500.000đ - 8.000.000đ/người.

Quý khách muốn đi tỉnh thành nào cứ gõ tên tỉnh em sẽ tư vấn chi tiết nhé!`
    });
  }

  // -----------------------------------------------------------------------
  // BƯỚC 6: FALLBACK MẶC ĐỊNH (WELCOME)
  // -----------------------------------------------------------------------
  return res.json(taoWelcomeCard());
});

// Khởi chạy Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`[SERVER] Bot Du Lich 63 Tinh Thanh (Smart AI Engine) running on port ${PORT}`);
});

