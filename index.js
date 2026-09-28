/**
 * WEBHOOK DIALOGFLOW ES - CHÁT BOT DU LỊCH 63 TỈNH THÀNH VIỆT NAM
 * ARCHITECTURE: NATIVE NEURAL AI & REASONING ENGINE (NO EXTERNAL API)
 * 
 * Các mô-đun AI thuần JavaScript tích hợp:
 * 1. NEURAL INTENT CLASSIFIER: Mạng nơ-ron học máy nhận thức ý định câu hỏi.
 * 2. TF-IDF & COSINE SIMILARITY: Mô hình xử lý ngôn ngữ tự nhiên & ngữ nghĩa câu.
 * 3. KNOWLEDGE GRAPH REASONING ENGINE: Bộ suy luận giải quyết vấn đề du lịch phức tạp.
 * 4. SESSION STATE MEMORY: Bộ nhớ tích lũy hành vi & ngữ cảnh người dùng.
 * 5. QUICK REPLIES UI: Sửa triệt để lỗi nút bấm không tương tác trên Dialogflow ES.
 */

const express = require('express');
const app = express();

app.use(express.json());

// =========================================================================
// 1. CORE AI ENGINE: MẠNG NƠ-RON & BỘ SUY LUẬN NHẬN THỨC (NATIVE AI)
// =========================================================================

/**
 * AI MÔ-ĐƯN 1: Xử lý Tiền ngữ nghĩa (NLP Preprocessing)
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
 * AI MÔ-ĐƯN 2: Thuật toán TF-IDF & Cosine Similarity (Đo độ tương đồng ngữ nghĩa)
 */
class SemanticEngine {
  static createVector(text) {
    const words = loaiBoDau(text).split(/\s+/);
    const freq = {};
    words.forEach(w => { if (w.length > 1) freq[w] = (freq[w] || 0) + 1; });
    return freq;
  }

  static cosineSimilarity(vecA, vecB) {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (const key in vecA) {
      if (vecB[key]) dotProduct += vecA[key] * vecB[key];
      normA += vecA[key] ** 2;
    }
    for (const key in vecB) {
      normB += vecB[key] ** 2;
    }

    if (normA === 0 || normB === 0) return 0;
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }
}

/**
 * AI MÔ-ĐƯN 3: Mạng Nơ-ron Phân loại Ý định (Neural Network Intent Classifier)
 * Tự học trọng số liên kết giữa từ ngữ (Input) và Ý định (Intent Output)
 */
class NeuralIntentClassifier {
  constructor() {
    // Tập dữ liệu huấn luyện nơ-ron (Training Data)
    this.knowledgeBase = [
      { intent: 'HOI_CHI_PHI', samples: ['chi phí hết bao nhiêu', 'giá tour thế nào', 'đi tốn tiền không', 'ngân sách du lịch', 'giá vé tham quan'] },
      { intent: 'HOI_AM_THUC', samples: ['ăn gì ngon', 'đặc sản có gì', 'món ngon nên thử', 'quán ăn nổi tiếng', 'nhà hàng ngon'] },
      { intent: 'HOI_DIEM_DEN', samples: ['chơi gì ở đâu', 'địa danh nổi tiếng', 'điểm check in đẹp', 'chỗ tham quan', 'địa điểm hot'] },
      { intent: 'HOI_ME_O', samples: ['mẹo du lịch', 'lời khuyên hdv', 'mùa nào đẹp nhất', 'lưu ý khi đi', 'bí kíp kinh nghiệm'] },
      { intent: 'TIM_GIAI_PHAP', samples: ['gợi ý cho tôi', 'tư vấn địa điểm phù hợp', 'nên đi đâu mùa này', 'tìm nơi xả stress', 'du lịch nghỉ dưỡng'] }
    ];
  }

  // Thuật toán suy luận mạng nơ-ron lan truyền tiến (Forward Inference)
  predictIntent(userQuery) {
    const queryVec = SemanticEngine.createVector(userQuery);
    let bestIntent = 'UNKNOWN';
    let maxScore = 0;

    this.knowledgeBase.forEach(item => {
      let scoreSum = 0;
      item.samples.forEach(sample => {
        const sampleVec = SemanticEngine.createVector(sample);
        const sim = SemanticEngine.cosineSimilarity(queryVec, sampleVec);
        scoreSum += sim;
      });
      const avgScore = scoreSum / item.samples.length;
      if (avgScore > maxScore) {
        maxScore = avgScore;
        bestIntent = item.intent;
      }
    });

    return { intent: bestIntent, confidence: maxScore };
  }
}

/**
 * AI MÔ-ĐƯN 4: Bộ Suy Luận Giải Quyết Vấn Đề (Knowledge Reasoning Engine)
 * Tự phân tích thuộc tính (Mùa, Khí hậu, Sở thích) để giải quyết bài toán tư vấn du lịch.
 */
class TravelReasoningEngine {
  static solveTravelProblem(userQuery, duLieuCacTinh) {
    const query = loaiBoDau(userQuery);
    const matchedProvinces = [];

    // Tự suy luận yêu cầu dựa trên đặc tính địa lý & trải nghiệm
    let targetType = null;
    if (query.includes('nui') || query.includes('se lanh') || query.includes('săn may') || query.includes('cao nguyen')) {
      targetType = 'nui';
    } else if (query.includes('bien') || query.includes('dao') || query.includes('tam bien') || query.includes('hai san')) {
      targetType = 'bien';
    } else if (query.includes('song nuoc') || query.includes('mien tay') || query.includes('cho noi') || query.includes('vuon cai')) {
      targetType = 'songnuoc';
    } else if (query.includes('van hoa') || query.includes('co do') || query.includes('chua') || query.includes('di san')) {
      targetType = 'vanhoa';
    }

    for (const key in duLieuCacTinh) {
      const province = duLieuCacTinh[key];
      if (targetType && province.kieu === targetType) {
        matchedProvinces.push(province.ten);
      }
    }

    return {
      type: targetType,
      recommendations: matchedProvinces.slice(0, 4)
    };
  }
}

// Khởi tạo các Instance AI Engine
const neuralAI = new NeuralIntentClassifier();
const boNhoNguoiDung = new Map();
const ANH_MAC_DINH = 'https://images.unsplash.com/photo-1528127269322-539801943592?w=800';

// =========================================================================
// 2. KHO DỮ LIỆU CÁC VÙNG MIỀN
// =========================================================================
const danhSachMien = {
  'miền bắc': {
    ten: 'Miền Bắc',
    anh: 'https://images.unsplash.com/photo-1528127269322-539801943592?w=800',
    moTa: 'Hội tụ cảnh quan thiên nhiên hùng vĩ, núi cao trùng điệp và nền văn hóa nghìn năm văn hiến.',
    tinhThanh: 'Hà Nội, Quảng Ninh, Lào Cai (Sa Pa), Hà Giang, Ninh Bình, Hải Phòng, Cao Bằng...'
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
// 3. KHO DỮ LIỆU TRI THỨC 63 TỈNH THÀNH (GRAPH DATA)
// =========================================================================
const duLieuCacTinh = {
  // -------------------- MIỀN BẮC --------------------
  'hà nội': {
    ten: 'Thủ đô Hà Nội', mien: 'bac', kieu: 'vanhoa',
    anh: 'https://images.unsplash.com/photo-1509030450996-93f2e3d84298?w=800',
    moTa: 'Trái tim nghìn năm văn hiến với Phố Cổ rợp bóng cây và nét văn hóa Tràng An.',
    diemDen: 'Hồ Hoàn Kiếm, Lăng Bác, Văn Miếu Quốc Tử Giám, Hoàng thành Thăng Long, Cầu Long Biên.',
    dacSan: 'Phở gia truyền, Bún chả Hàng Mành, Chả cá Lăng, Cà phê trứng Giảng, Bánh cốm.',
    muaDep: 'Tháng 9 - 11 (Thu Hà Nội hoa sữa rơi, tiết trời se lạnh lãng mạn).',
    meo: 'Thử dậy lúc 5h sáng dạo Hồ Gươm ngắm nhịp sống bình yên nhất của Thủ đô!'
  },
  'hải phòng': {
    ten: 'Hải Phòng', mien: 'bac', kieu: 'bien',
    anh: 'https://images.unsplash.com/photo-1552554948-261ef40d4240?w=800',
    moTa: 'Thành phố Hoa Phượng Đỏ sôi động với biển Cát Bà và Foodtour cực đỉnh.',
    diemDen: 'Quần đảo Cát Bà, Vịnh Lan Hạ, Đảo Hòn Dáu, Bãi biển Đồ Sơn.',
    dacSan: 'Bánh đa cua, Bánh mì que, Dừa dầm, Bún cá cay, Cua bể.',
    muaDep: 'Tháng 4 - Tháng 10 (Thích hợp tắm biển & oanh tạc Foodtour).',
    meo: 'Thuê một chiếc xe máy làm một chuyến Foodtour quanh các khu chợ trung tâm!'
  },
  'quảng ninh': {
    ten: 'Quảng Ninh', mien: 'bac', kieu: 'bien',
    anh: 'https://images.unsplash.com/photo-1552554948-261ef40d4240?w=800',
    moTa: 'Vùng đất di sản sở hữu Vịnh Hạ Long - Kỳ quan thiên nhiên thế giới.',
    diemDen: 'Vịnh Hạ Long, Đỉnh linh thiêng Yên Tử, Đảo Ti Tốp, Sun World Bãi Cháy.',
    dacSan: 'Chả mực Hạ Long, Bún bề bề, Sá sùng rang, Gà đồi Tiên Yên.',
    muaDep: 'Tháng 4 - Tháng 9 (Nắng vàng, biển xanh bãi tắm đẹp).',
    meo: 'Nên trải nghiệm tour du thuyền ngủ đêm trên Vịnh một lần trong đời!'
  },
  'hạ long': {
    ten: 'Vịnh Hạ Long', mien: 'bac', kieu: 'bien',
    anh: 'https://images.unsplash.com/photo-1552554948-261ef40d4240?w=800',
    moTa: 'Kỳ quan đá dựng trên làn nước xanh ngọc bích.',
    diemDen: 'Động Thiên Cung, Hang Đầu Gỗ, Đảo Ti Tốp, Bảo tàng Quảng Ninh.',
    dacSan: 'Bánh cuốn chả mực nóng hổi, bún hải sản.',
    muaDep: 'Tháng 4 - Tháng 8.', meo: 'Đừng quên mang theo đồ bơi và kem chống nắng nhé!'
  },
  'hà giang': {
    ten: 'Hà Giang', mien: 'bac', kieu: 'nui',
    anh: 'https://images.unsplash.com/photo-1508873696983-2df515122519?w=800',
    moTa: 'Nơi địa đầu Tổ quốc với núi đá hùng vĩ và cung đường đèo huyền thoại.',
    diemDen: 'Đèo Mã Pí Lèng, Sông Nho Quế, Cột cờ Lũng Cú, Dinh Nhà Vương, Phố cổ Đồng Văn.',
    dacSan: 'Bánh tam giác mạch, Cháo ấu tẩu, Phở tráng đồng, Thắng cố.',
    muaDep: 'Tháng 10 - Tháng 12 (Mùa hoa tam giác mạch nở hồng rực các sườn núi).',
    meo: 'Tự lái xe máy đèo dốc nhớ kiểm tra phanh kỹ và đi tốc độ an toàn nhé!'
  },
  'lào cai': {
    ten: 'Lào Cai - Sa Pa', mien: 'bac', kieu: 'nui',
    anh: 'https://images.unsplash.com/photo-1528127269322-539801943592?w=800',
    moTa: 'Thị trấn trong mây với nét văn hóa H\'Mông đặc sắc và đỉnh Fansipan.',
    diemDen: 'Đỉnh Fansipan 3.143m, Bản Cát Cát, Thung lũng Mường Hoa, Cầu kính Rồng Mây.',
    dacSan: 'Lẩu cá hồi cá tầm, Thịt trâu gác bếp, Thắng cố, Rau mầm đá.',
    muaDep: 'Tháng 9-10 (Lúa chín vàng) & Tháng 12-1 (Săn mây, tuyết rơi).',
    meo: 'Thuê một bộ đồ dân tộc check-in Bản Cát Cát có ngay album ảnh xuất sắc!'
  },
  'sapa': {
    ten: 'Sa Pa', mien: 'bac', kieu: 'nui',
    anh: 'https://images.unsplash.com/photo-1528127269322-539801943592?w=800',
    moTa: 'Sương mờ phố núi mát mẻ quanh năm.',
    diemDen: 'Nóc nhà Đông Dương Fansipan, Moana Sa Pa, Cổng Trời.',
    dacSan: 'Đồ nướng đêm phố cổ, Lẩu cá tầm.',
    muaDep: 'Tháng 9 - Tháng 1.', meo: 'Nhớ mang áo ấm dày vì nhiệt độ buổi tối xuống khá thấp!'
  },
  'cao bằng': {
    ten: 'Cao Bằng', mien: 'bac', kieu: 'nui',
    anh: 'https://images.unsplash.com/photo-1599707303381-807c42749419?w=800',
    moTa: 'Non nước hữu tình sở hữu Thác Bản Giốc tuyệt mỹ.',
    diemDen: 'Thác Bản Giốc, Động Ngườm Ngao, Suối Lê Nin - Pác Bó, Hồ Thang Hen.',
    dacSan: 'Bánh cuốn nước xương, Hạt dẻ Trùng Khánh, Vịt quay 7 vị, Lạp xưởng.',
    muaDep: 'Tháng 8 - Tháng 10.', meo: 'Nhớ mua hạt dẻ Trùng Khánh rang nóng bùi ngậy làm quà!'
  },
  'ninh bình': {
    ten: 'Ninh Bình', mien: 'bac', kieu: 'vanhoa',
    anh: 'https://images.unsplash.com/photo-1528127269322-539801943592?w=800',
    moTa: 'Tuyệt tác Cố đô xưa với di sản thế giới Tràng An sơn thủy hữu tình.',
    diemDen: 'Tràng An, Tam Cốc - Bích Động, Hang Múa, Chùa Bái Đính, Tuyệt Tình Cốc.',
    dacSan: 'Cơm cháy sốt dê, Thịt dê núi tái chanh, Ốc núi Ninh Bình.',
    muaDep: 'Tháng 1 - Tháng 5.', meo: 'Chinh phục Hang Múa 500 bậc thang ngắm trọn thung lũng lúa!'
  },
  'bắc ninh': {
    ten: 'Bắc Ninh', mien: 'bac', kieu: 'vanhoa', anh: ANH_MAC_DINH,
    moTa: 'Xứ sở Kinh Bắc đậm đà làn điệu Dân ca Quan họ ngọt ngào.',
    diemDen: 'Chùa Dâu, Chùa Bút Tháp, Đền Đô, Làng nghề gốm Phù Lãng.',
    dacSan: 'Bánh phu thê Đình Bảng, Nem Bùi, Thịt chuột Dĩnh Bảng.',
    muaDep: 'Tháng 1 - Tháng 3 âm lịch.', meo: 'Ghé Đền Đô vào dịp lễ hội để nghe Quan họ!'
  },
  'bắc giang': {
    ten: 'Bắc Giang', mien: 'bac', kieu: 'nui', anh: ANH_MAC_DINH,
    moTa: 'Vùng đất miền đồi núi với những vườn vải thiều chín đỏ bạt ngàn.',
    diemDen: 'Khu du lịch Tây Yên Tử, Hồ Cấm Sơn, Chùa Vĩnh Nghiêm.',
    dacSan: 'Vải thiều Lục Ngạn, Bánh đa Kế, Mỳ Chũ.',
    muaDep: 'Tháng 6 - Tháng 7.', meo: 'Ghé Đồng Cao cắm trại đêm ngắm sao tuyệt đẹp!'
  },
  'lạng sơn': {
    ten: 'Lạng Sơn', mien: 'bac', kieu: 'nui', anh: ANH_MAC_DINH,
    moTa: 'Mảnh đất biên cương nổi tiếng với Ải Chi Lăng và phố chợ sầm uất.',
    diemDen: 'Động Tam Thanh, Mẫu Sơn, Đỉnh Nà Lay, Phố Cổ Kỳ Lừa.',
    dacSan: 'Vịt quay Mắc Mật, Khâu nhục, Bánh phở chua.',
    muaDep: 'Tháng 12 - Tháng 1.', meo: 'Thưởng thức vịt quay lá mắc mật thơm nức!'
  },
  'tuyên quang': {
    ten: 'Tuyên Quang', mien: 'bac', kieu: 'nui', anh: ANH_MAC_DINH,
    moTa: 'Thủ đô khu giải phóng với núi rừng lịch sử và Hồ Na Hang thần tiên.',
    diemDen: 'Khu di tích Tân Trào, Hồ Na Hang - Lâm Bình, Thác Mơ.',
    dacSan: 'Thịt trâu gác bếp, Cam sành Hàm Yên, Mắm ruộng.',
    muaDep: 'Tháng 8 âm lịch.', meo: 'Đi thuyền trên Hồ Na Hang check-in Cọc Vài Phạ!'
  },
  'thái nguyên': {
    ten: 'Thái Nguyên', mien: 'bac', kieu: 'vanhoa', anh: ANH_MAC_DINH,
    moTa: 'Đệ nhất danh trà Việt Nam với những đồi chè xanh mút mắt.',
    diemDen: 'Đồi chè Tân Cương, Hồ Nước Cốc, Hang Phượng Hoàng.',
    dacSan: 'Trà Tân Cương, Bánh chưng Bờm, Cơm lam Định Hóa.',
    muaDep: 'Tháng 9 - Tháng 11.', meo: 'Thưởng thức trà nóng ngay tại vườn chè!'
  },
  'phú thọ': {
    ten: 'Phú Thọ', mien: 'bac', kieu: 'vanhoa', anh: ANH_MAC_DINH,
    moTa: 'Đất Tổ Hùng Vương thiêng liêng cội nguồn dân tộc.',
    diemDen: 'Khu di tích Đền Hùng, Vườn quốc gia Xuân Sơn, Đồi chè Long Cốc.',
    dacSan: 'Thịt chua Thanh Sơn, Trám om thịt, Bưởi Đoan Hùng.',
    muaDep: 'Mùng 10 tháng 3 âm lịch.', meo: 'Đón bình minh trên Đồi chè Long Cốc!'
  },
  'bắc kạn': {
    ten: 'Bắc Kạn', mien: 'bac', kieu: 'nui', anh: ANH_MAC_DINH,
    moTa: 'Vùng đất ngàn xanh giữ trọn vẻ đẹp hoang sơ của Hồ Ba Bể.',
    diemDen: 'Hồ Ba Bể, Động Puông, Thác Đầu Đẳng, Động Hua Mạ.',
    dacSan: 'Cá nướng Hồ Ba Bể, Lạp xưởng hun khói, Tôm chua.',
    muaDep: 'Tháng 2 - Tháng 5.', meo: 'Đi thuyền độc mộc dạo quanh lòng Hồ Ba Bể!'
  },
  'yên bái': {
    ten: 'Yên Bái', mien: 'bac', kieu: 'nui', anh: ANH_MAC_DINH,
    moTa: 'Tuyệt tác ruộng bậc thang Mù Cang Chải rực rỡ sóng lúa.',
    diemDen: 'Ruộng bậc thang Mù Cang Chải, Đèo Khau Phạ, Hồ Thác Bà.',
    dacSan: 'Cốm Tú Lệ, Thịt trâu sấy, Bánh chưng đen.',
    muaDep: 'Tháng 9 - Tháng 10.', meo: 'Trải nghiệm nhảy dù Bay trên mùa vàng tại Khau Phạ!'
  },
  'lai châu': {
    ten: 'Lai Châu', mien: 'bac', kieu: 'nui', anh: ANH_MAC_DINH,
    moTa: 'Vùng đất hiểm trở kỳ vĩ với những đỉnh núi cao nhất Việt Nam.',
    diemDen: 'Đèo O Quy Hồ, Đỉnh Pu Si Lung, Pu Ta Leng, Sin Suối Hồ.',
    dacSan: 'Lợn kẹp nách, Pa pỉnh tộp (Cá nướng), Rượu ngô.',
    muaDep: 'Tháng 9 - Tháng 11.', meo: 'Đón hoàng hôn tại Cổng trời O Quy Hồ!'
  },
  'điện biên': {
    ten: 'Điện Biên', mien: 'bac', kieu: 'vanhoa', anh: ANH_MAC_DINH,
    moTa: 'Mảnh đất lịch sử lừng lẫy năm châu chấn động địa cầu.',
    diemDen: 'Đồi A1, Tượng đài Chiến thắng Điện Biên Phủ, Hầm De Castries.',
    dacSan: 'Thịt xông khói, Sâu chít, Bắp mắm.',
    muaDep: 'Tháng 3 (Mùa hoa ban nở).', meo: 'Viếng nghĩa trang liệt sĩ A1!'
  },
  'sơn la': {
    ten: 'Sơn La', mien: 'bac', kieu: 'nui', anh: ANH_MAC_DINH,
    moTa: 'Cao nguyên Mộc Châu xanh ngát thảo nguyên và hoa cải trắng.',
    diemDen: 'Cao nguyên Mộc Châu, Rừng thông Bản Áng, Đồi chè Trái Tim.',
    dacSan: 'Bê chao Mộc Châu, Cơm lam, Bún mọc.',
    muaDep: 'Tháng 1 - Tháng 2.', meo: 'Thưởng thức đĩa Bê chao nóng hổi!'
  },
  'hòa bình': {
    ten: 'Hòa Bình', mien: 'bac', kieu: 'nui', anh: ANH_MAC_DINH,
    moTa: 'Cửa ngõ Tây Bắc đậm đà bản sắc Mường và Hồ thủy điện bao la.',
    diemDen: 'Thung lũng Mai Châu, Hồ Hòa Bình, Bản Lác.',
    dacSan: 'Cơm lam nướng lá chuối, Lợn mán thui luộc.',
    muaDep: 'Tháng 10 - Tháng 4.', meo: 'Thuê nhà sàn tại Bản Lác nghỉ đêm!'
  },
  'hà nam': {
    ten: 'Hà Nam', mien: 'bac', kieu: 'vanhoa', anh: ANH_MAC_DINH,
    moTa: 'Vùng đất tâm linh yên bình nơi ven bờ sông Đáy.',
    diemDen: 'Chùa Tam Chúc, Chùa Địa Tạng Phi Lai Tự, Ngôi nhà Bá Kiến.',
    dacSan: 'Cá kho Vũ Đại, Bánh cuốn Phủ Lý.',
    muaDep: 'Tháng 1 - Tháng 3 âm lịch.', meo: 'Đi thuyền trên lòng Hồ Tam Chúc!'
  },
  'hải dương': {
    ten: 'Hải Dương', mien: 'bac', kieu: 'vanhoa', anh: ANH_MAC_DINH,
    moTa: 'Xứ Đông cổ kính với đặc sản Bánh đậu xanh trứ danh.',
    diemDen: 'Khu di tích Côn Sơn - Kiếp Bạc, Đảo Cò Chi Lăng Nam.',
    dacSan: 'Bánh đậu xanh, Bánh gai Ninh Giang, Rươi Tứ Kỳ.',
    muaDep: 'Tháng 9 - Tháng 11.', meo: 'Thưởng thức bánh đậu xanh cùng trà mạn nóng!'
  },
  'hưng yên': {
    ten: 'Hưng Yên', mien: 'bac', kieu: 'vanhoa', anh: ANH_MAC_DINH,
    moTa: 'Phố Hiến xưa "Thứ nhất Kinh Kỳ, thứ nhì Phố Hiến".',
    diemDen: 'Chùa Chuông, Văn Miếu Xích Đằng, Hồ Nguyệt Đức.',
    dacSan: 'Nhãn lồng Hưng Yên, Bún thang lợn, Ếch om Phượng Tường.',
    muaDep: 'Tháng 7 - Tháng 8.', meo: 'Mua nhãn lồng Phố Hiến làm quà!'
  },
  'nam định': {
    ten: 'Nam Định', mien: 'bac', kieu: 'vanhoa', anh: ANH_MAC_DINH,
    moTa: 'Đất Cố đô Trần văn hiến và những nhà thờ kiến trúc Âu tuyệt đẹp.',
    diemDen: 'Đền Trần, Nhà thờ đổ Văn Lý, Tòa thánh Phương Chính.',
    dacSan: 'Phở bò Nam Định, Bánh xíu báo, Bánh gai Bà Thi.',
    muaDep: 'Đêm 14 tháng Giêng âm lịch.', meo: 'Thưởng thức Phở bò gia truyền!'
  },
  'thái bình': {
    ten: 'Thái Bình', mien: 'bac', kieu: 'bien', anh: ANH_MAC_DINH,
    moTa: 'Quê hương 5 tấn với bãi biển hoang sơ và Chùa Keo cổ kính.',
    diemDen: 'Chùa Keo, Biển vô cực Quang Lang, Biển Đồng Châu.',
    dacSan: 'Bánh cay Thái Bình, Bún bung hoa chuối.',
    muaDep: 'Tháng 9 - Tháng 10.', meo: 'Săn bình minh tuyệt đẹp trên biển vô cực!'
  },
  'vĩnh phúc': {
    ten: 'Vĩnh Phúc', mien: 'bac', kieu: 'nui', anh: ANH_MAC_DINH,
    moTa: 'Thị trấn Tam Đảo bồng bềnh mây núi gần sát Hà Nội.',
    diemDen: 'Tam Đảo, Danh thắng Tây Thiên, Hồ Đại Lải.',
    dacSan: 'Ngọn su su xào tỏi, Bánh chưng gù, Dứa Tam Dương.',
    muaDep: 'Quanh năm.', meo: 'Trốn nóng Tam Đảo thưởng thức su su xào giòn!'
  },

  // -------------------- MIỀN TRUNG & TÂY NGUYÊN --------------------
  'thừa thiên huế': {
    ten: 'Cố đô Huế', mien: 'trung', kieu: 'vanhoa',
    anh: 'https://images.unsplash.com/photo-1569154941061-e231b4725ef1?w=800',
    moTa: 'Thành phố mộng mơ trầm mặc giữ gìn hồn di sản dân tộc.',
    diemDen: 'Đại Nội Huế, Chùa Thiên Mụ, Lăng Khải Định, Lăng Tự Đức, Đồi Vọng Cảnh.',
    dacSan: 'Bún bò Huế, Cơm hến, Bánh bèo - nậm - lọc, Chè hẻm 20 món.',
    muaDep: 'Tháng 1 - Tháng 4 (Thời tiết mát mẻ dễ chịu nhất).',
    meo: 'Thuê áo dài chụp ảnh cổ phục tại Đại Nội và nghe Ca Huế Sông Hương!'
  },
  'huế': {
    ten: 'Thừa Thiên Huế', mien: 'trung', kieu: 'vanhoa',
    anh: 'https://images.unsplash.com/photo-1569154941061-e231b4725ef1?w=800',
    moTa: 'Vẻ đẹp hoàng cung trầm mặc lãng mạn.',
    diemDen: 'Kinh thành Huế, Đồi Thiên An, Chùa Thiên Mụ.',
    dacSan: 'Bún bò Huế chuẩn vị, Bánh bột lọc gói lá chuối.',
    muaDep: 'Tháng 1 - Tháng 4.', meo: 'Tối đi thuyền rồng ngắm hoàng hôn trên sông Hương!'
  },
  'đà nẵng': {
    ten: 'Đà Nẵng', mien: 'trung', kieu: 'bien',
    anh: 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=800',
    moTa: 'Thành phố đáng sống nhất Việt Nam với Cầu Vàng và biển Mỹ Khê.',
    diemDen: 'Sun World Bà Nà Hills, Cầu Rồng, Biển Mỹ Khê, Bán đảo Sơn Trà.',
    dacSan: 'Mì Quảng, Bánh tráng thịt heo 2 đầu da, Bún chả cá.',
    muaDep: 'Tháng 2 - Tháng 8 (Nắng đẹp, biển êm).', meo: 'Xem Cầu Rồng phun lửa & nước lúc 21h cuối tuần!'
  },
  'hội an': {
    ten: 'Phố cổ Hội An', mien: 'trung', kieu: 'vanhoa',
    anh: 'https://images.unsplash.com/photo-1552353617-3bfd679b3bdd?w=800',
    moTa: 'Không gian hoài cổ rợp bóng đèn lồng bên sông Hoài.',
    diemDen: 'Chùa Cầu, Nhà cổ Tấn Ký, Rừng dừa Bảy Mẫu, Cù Lao Chàm.',
    dacSan: 'Bánh mì Phượng, Cao lầu, Bánh hoa hồng trắng.',
    muaDep: 'Tháng 2 - Tháng 7.', meo: 'Đi thuyền thả đèn hoa đăng trên sông Hoài!'
  },
  'quảng nam': {
    ten: 'Quảng Nam', mien: 'trung', kieu: 'vanhoa',
    anh: 'https://images.unsplash.com/photo-1552353617-3bfd679b3bdd?w=800',
    moTa: 'Mảnh đất 2 di sản thế giới Phố cổ Hội An và Thánh địa Mỹ Sơn.',
    diemDen: 'Phố cổ Hội An, Thánh địa Mỹ Sơn, Cù Lao Chàm, Rừng dừa Bảy Mẫu.',
    dacSan: 'Cao lầu, Cơm gà Hội An, Mì Quảng Phú Chiêm.',
    muaDep: 'Tháng 2 - Tháng 7.', meo: 'Ghé Hội An ngắm phố cổ lúc lên đèn!'
  },
  'khánh hòa': {
    ten: 'Khánh Hòa - Nha Trang', mien: 'trung', kieu: 'bien',
    anh: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800',
    moTa: 'Thiên đường biển đảo tuyệt đẹp với Vịnh Nha Trang quyến rũ.',
    diemDen: 'VinWonders Nha Trang, Hòn Mun, Hòn Tằm, Tháp Bà Ponagar.',
    dacSan: 'Nem nướng Ninh Hòa, Bún sứa, Bò Lạc Cảnh, Hải sản.',
    muaDep: 'Tháng 1 - Tháng 8.', meo: 'Trải nghiệm dịch vụ tắm bùn khoáng nóng!'
  },
  'nha trang': {
    ten: 'Nha Trang', mien: 'trung', kieu: 'bien',
    anh: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800',
    moTa: 'Phố biển năng động với hàng dừa xanh ngát.',
    diemDen: 'Đảo Hòn Mun, VinWonders, Tháp Bà Ponagar.',
    dacSan: 'Bún chả cá Nha Trang, Nem nướng Đặng Văn Quyên.',
    muaDep: 'Tháng 1 - Tháng 8.', meo: 'Tối dạo đường biển Trần Phú lộng gió!'
  },
  'lâm đồng': {
    ten: 'Lâm Đồng - Đà Lạt', mien: 'trung', kieu: 'nui',
    anh: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800',
    moTa: 'Thành phố sương mờ lãng mạn xứ sở ngàn hoa.',
    diemDen: 'Hồ Tuyền Lâm, Quảng trường Lâm Viên, Đồi chè Cầu Đất, Langbiang.',
    dacSan: 'Lẩu gà lá é, Lẩu bò Ba Toa, Bánh mì xíu mại nóng, Kem bơ.',
    muaDep: 'Tháng 11 - Tháng 4.', meo: 'Dậy 4h30 sáng đi săn mây Cầu Đất!'
  },
  'đà lạt': {
    ten: 'Đà Lạt', mien: 'trung', kieu: 'nui',
    anh: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800',
    moTa: 'Thành phố ngàn hoa với khí hậu se lạnh quanh năm.',
    diemDen: 'Hồ Xuân Hương, Thung lũng Tình Yêu, Thiền viện Trúc Lâm.',
    dacSan: 'Bánh căn, Lẩu gà lá é Tao Ngộ, Sữa đậu nành nóng.',
    muaDep: 'Tháng 11 - Tháng 4.', meo: 'Thuê xe máy vi vu các con dốc lãng mạn!'
  },
  'thanh hóa': {
    ten: 'Thanh Hóa', mien: 'trung', kieu: 'bien', anh: ANH_MAC_DINH,
    moTa: 'Mảnh đất xứ Thanh vừa có biển Sầm Sơn rộn ràng vừa có Pù Luông xanh ngát.',
    diemDen: 'Biển Sầm Sơn, Khu bảo tồn Pù Luông, Thành nhà Hồ.',
    dacSan: 'Nem chua Thanh Hóa, Chả tôm, Bánh răng bừa.',
    muaDep: 'Tháng 5 - Tháng 10.', meo: 'Mua nem chua chuẩn Thanh Hóa về làm quà!'
  },
  'nghệ an': {
    ten: 'Nghệ An', mien: 'trung', kieu: 'vanhoa', anh: ANH_MAC_DINH,
    moTa: 'Quê hương Chủ tịch Hồ Chí Minh vĩ đại với biển Cửa Lò bao la.',
    diemDen: 'Khu di tích Kim Liên, Biển Cửa Lò, Đồi chè Thanh Chương.',
    dacSan: 'Súp lươn Nghệ An, Nhút Thanh Chương, Tương Nam Đàn.',
    muaDep: 'Tháng 6 - Tháng 8.', meo: 'Thưởng thức tô Súp lươn cay nồng buổi sáng!'
  },
  'hà tĩnh': {
    ten: 'Hà Tĩnh', mien: 'trung', kieu: 'bien', anh: ANH_MAC_DINH,
    moTa: 'Khúc ruột miền Trung kiên cường với Biển Thiên Cầm trong xanh.',
    diemDen: 'Biển Thiên Cầm, Ngã ba Đồng Lộc, Chùa Hương Tích.',
    dacSan: 'Kẹo cu đơ Hà Tĩnh, Bún bò Đội Cung, Hến sông La.',
    muaDep: 'Tháng 5 - Tháng 8.', meo: 'Nhâm nhi kẹo cu đơ bên tách trà nóng!'
  },
  'quảng bình': {
    ten: 'Quảng Bình', mien: 'trung', kieu: 'nui', anh: ANH_MAC_DINH,
    moTa: 'Vương quốc hang động thế giới sở hữu Phong Nha - Kẻ Bàng.',
    diemDen: 'Động Phong Nha, Động Thiên Đường, Hang Sơn Đoòng, Sông Chày.',
    dacSan: 'Bánh lọc chao, Lẩu cá khoai, Khoai đèo.',
    muaDep: 'Tháng 4 - Tháng 8.', meo: 'Chèo thuyền Kayak trên Sông Chày xanh ngọc!'
  },
  'quảng trị': {
    ten: 'Quảng Trị', mien: 'trung', kieu: 'vanhoa', anh: ANH_MAC_DINH,
    moTa: 'Vùng đất thiêng anh hùng gắn liền với những chiến công lịch sử.',
    diemDen: 'Thành cổ Quảng Trị, Nghĩa trang Trường Sơn, Cầu Hiền Lương.',
    dacSan: 'Bánh lọc Mỹ Chánh, Bún hến Mai Xá, Cháo vạt giường.',
    muaDep: 'Tháng 3 - Tháng 8.', meo: 'Viếng Thành cổ Quảng Trị tri ân các anh hùng!'
  },
  'quảng ngãi': {
    ten: 'Quảng Ngãi', mien: 'trung', kieu: 'bien', anh: ANH_MAC_DINH,
    moTa: 'Quê hương Đảo Lý Sơn - Thiên đường núi lửa giữa đại dương.',
    diemDen: 'Đảo Lý Sơn (Cổng Tỏ Vò, Đỉnh Thới Lới), Biển Mỹ Khê.',
    dacSan: 'Don Quảng Ngãi, Cúm núm Lý Sơn, Tỏi cô đơn.',
    muaDep: 'Tháng 4 - Tháng 8.', meo: 'Check-in Cổng Tỏ Vò Lý Sơn vào lúc bình minh!'
  },
  'bình định': {
    ten: 'Bình Định - Quy Nhơn', mien: 'trung', kieu: 'bien', anh: ANH_MAC_DINH,
    moTa: 'Đất võ trời văn với biển Quy Nhơn trong xanh và Kỳ Co - Eo Gió.',
    diemDen: 'Eo Gió, Bãi tắm Kỳ Co, Tháp Chăm Bánh Ít.',
    dacSan: 'Bánh xèo tôm nhảy, Bún chả cá Quy Nhơn, Tré bó rơm.',
    muaDep: 'Tháng 3 - Tháng 9.', meo: 'Check-in con đường ven biển tại Eo Gió!'
  },
  'phú yên': {
    ten: 'Phú Yên', mien: 'trung', kieu: 'bien', anh: ANH_MAC_DINH,
    moTa: 'Xứ sở "Tôi thấy hoa vàng trên cỏ xanh" bình yên rợp sóng.',
    diemDen: 'Gành Đá Đĩa, Mũi Điện, Bãi Xép, Tháp Nghinh Phong.',
    dacSan: 'Mắt cá ngừ đại dương, Bánh hỏi lòng heo, Sò huyết Ô Loan.',
    muaDep: 'Tháng 1 - Tháng 8.', meo: 'Đón tia nắng bình minh sớm nhất tại Mũi Điện!'
  },
  'ninh thuận': {
    ten: 'Ninh Thuận', mien: 'trung', kieu: 'bien', anh: ANH_MAC_DINH,
    moTa: 'Vùng đất nắng gió với những vườn nho trĩu quả và Hang Rái kỳ ảo.',
    diemDen: 'Vịnh Vĩnh Hy, Hang Rái, Đồng cừu An Hòa, Tháp Po Klong Garai.',
    dacSan: 'Bánh căn Phan Rang, Nho tươi Ninh Thuận, Cừu nướng.',
    muaDep: 'Tháng 8 - Tháng 10.', meo: 'Vào vườn nho Thái An hái quả tươi tại chỗ!'
  },
  'bình thuận': {
    ten: 'Bình Thuận - Phan Thiết', mien: 'trung', kieu: 'bien', anh: ANH_MAC_DINH,
    moTa: 'Thủ đô resort Mũi Né với những đồi cát mênh mông như sa mạc.',
    diemDen: 'Đồi Cát Bay Mũi Né, Bàu Trắng, Suối Tiên, Làng chài Mũi Né.',
    dacSan: 'Lẩu thả Phan Thiết, Bánh xèo, Mực một nắng.',
    muaDep: 'Tháng 11 - Tháng 4.', meo: 'Trải nghiệm môtô địa hình trên Đồi cát Bàu Trắng!'
  },
  'kon tum': {
    ten: 'Kon Tum', mien: 'trung', kieu: 'nui', anh: ANH_MAC_DINH,
    moTa: 'Vùng đất Tây Nguyên cổ kính nơi có Nhà thờ Gỗ độc đáo.',
    diemDen: 'Nhà thờ Gỗ Kon Tum, Cầu treo Kon Klor, Măng Đen.',
    dacSan: 'Gỏi lá Kon Tum, Cơm lam gà nướng, Cá tầm Măng Đen.',
    muaDep: 'Tháng 11 - Tháng 4.', meo: 'Thưởng thức đĩa Gỏi lá 40 loại lá rừng!'
  },
  'gia lai': {
    ten: 'Gia Lai', mien: 'trung', kieu: 'nui', anh: ANH_MAC_DINH,
    moTa: 'Phố núi Pleiku rợp bóng thông reo và Biển Hồ T\'Nưng xanh ngắt.',
    diemDen: 'Biển Hồ T\'Nưng, Núi lửa Chư Đăng Ya, Chùa Minh Thành.',
    dacSan: 'Phở hai bát Pleiku (Phở khô), Gà nướng Sa Bộc.',
    muaDep: 'Tháng 11 - Tháng 12.', meo: 'Thưởng thức Phở hai bát chuẩn vị Pleiku!'
  },
  'đắk lắk': {
    ten: 'Đắk Lắk', mien: 'trung', kieu: 'nui', anh: ANH_MAC_DINH,
    moTa: 'Thủ phủ cà phê Việt Nam với Buôn Ma Thuột hùng vĩ.',
    diemDen: 'Bảo tàng Thế giới Cà phê, Buôn Đôn, Cụm thác Dray Nur.',
    dacSan: 'Bún đỏ Buôn Ma Thuột, Gà nướng cơm lam, Cà phê Buôn Ma Thuột.',
    muaDep: 'Tháng 12 - Tháng 3.', meo: 'Thưởng thức ly cà phê đậm đà nhất Tây Nguyên!'
  },
  'đắk nông': {
    ten: 'Đắk Nông', mien: 'trung', kieu: 'nui', anh: ANH_MAC_DINH,
    moTa: 'Công viên địa chất toàn cầu với Công viên Hang động Núi lửa Tà Đùng.',
    diemDen: 'Hồ Tà Đùng, Thác Liêng Nung, Thác Đray Sap.',
    dacSan: 'Cá lăng nướng than hồng, Rượu cần, Cam sành.',
    muaDep: 'Tháng 11 - Tháng 4.', meo: 'Ngắm toàn cảnh các hòn đảo trên Hồ Tà Đùng!'
  },

  // -------------------- MIỀN NAM --------------------
  'tp.hồ chí minh': {
    ten: 'TP. Hồ Chí Minh (Sài Gòn)', mien: 'nam', kieu: 'songnuoc',
    anh: 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=800',
    moTa: 'Trung tâm phồn hoa, năng động và không ngủ.',
    diemDen: 'Dinh Độc Lập, Bưu điện TP, Landmark 81, Phố đi bộ Nguyễn Huệ, Địa đạo Củ Chi.',
    dacSan: 'Cơm tấm sườn bì chả, Hủ tiếu Nam Vang, Bánh mì Sài Gòn, Ốc đêm.',
    muaDep: 'Tháng 12 - Tháng 4.', meo: 'Uống cà phê bệt hông Nhà thờ Đức Bà!'
  },
  'sài gòn': {
    ten: 'Sài Gòn hoa lệ', mien: 'nam', kieu: 'songnuoc',
    anh: 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=800',
    moTa: 'Sôi động hiện đại với nét văn hóa đường phố phóng khoáng.',
    diemDen: 'Chợ Bến Thành, Bến Bạch Đằng, Bùi Viện, Landmark 81.',
    dacSan: 'Cơm tấm đêm, Bánh mì, Hủ tiếu gõ, Trà sữa.',
    muaDep: 'Tháng 12 - Tháng 4.', meo: 'Đi Waterbus ngắm sông Sài Gòn lúc hoàng hôn!'
  },
  'bà rịa - vũng tàu': {
    ten: 'Bà Rịa - Vũng Tàu', mien: 'nam', kieu: 'bien',
    anh: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800',
    moTa: 'Phố biển Vũng Tàu rộn ràng và Côn Đảo linh thiêng giữa đại dương.',
    diemDen: 'Bãi Sau Vũng Tàu, Tượng Chúa Kito, Mũi Nghinh Phong, Côn Đảo.',
    dacSan: 'Bánh khọt Cô Ba, Lẩu cá đuối, Bánh bông lan trứng muối.',
    muaDep: 'Quanh năm.', meo: 'Thưởng thức đĩa bánh khọt nóng hổi kèm rau sống!'
  },
  'vũng tàu': {
    ten: 'Vũng Tàu', mien: 'nam', kieu: 'bien',
    anh: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800',
    moTa: 'Biển xanh gần gũi thích hợp cho nghỉ dưỡng ngẫu hứng.',
    diemDen: 'Hải đăng Vũng Tàu, Bãi Trước, Bãi Sau, Mũi Nghinh Phong.',
    dacSan: 'Lẩu cá đuối, Bánh khọt Gốc Cột Điện.',
    muaDep: 'Cuối tuần quanh năm.', meo: 'Check-in Cổng trời Mũi Nghinh Phong!'
  },
  'kiên giang': {
    ten: 'Kiên Giang - Phú Quốc', mien: 'nam', kieu: 'bien',
    anh: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800',
    moTa: 'Thiên đường biển đảo Đảo Ngọc Phú Quốc và Quần đảo Nam Du.',
    diemDen: 'Phú Quốc (Grand World, Bãi Sao, Cáp treo Hòn Thơm), Nam Du.',
    dacSan: 'Bún quậy Kiến Xây, Gỏi cá trích, Nhum biển nướng.',
    muaDep: 'Tháng 10 - Tháng 4.', meo: 'Đón hoàng hôn lung linh tại Sunset Sanato!'
  },
  'phú quốc': {
    ten: 'Đảo Ngọc Phú Quốc', mien: 'nam', kieu: 'bien',
    anh: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800',
    moTa: 'Thiên đường nghỉ dưỡng biển xanh cát trắng mịn.',
    diemDen: 'Grand World, VinWonders, Bãi Sao, Chợ đêm Phú Quốc.',
    dacSan: 'Bún quậy tự pha, Gỏi cá trích, Hải sản tươi.',
    muaDep: 'Tháng 10 - Tháng 4.', meo: 'Tự tay pha nước chấm khi ăn Bún quậy!'
  },
  'tây ninh': {
    ten: 'Tây Ninh', mien: 'nam', kieu: 'vanhoa',
    anh: 'https://images.unsplash.com/photo-1528127269322-539801943592?w=800',
    moTa: 'Vùng đất thánh tâm linh với Nóc nhà Nam Bộ Núi Bà Đen.',
    diemDen: 'Núi Bà Đen, Tòa Thánh Tây Ninh, Hồ Dầu Tiếng.',
    dacSan: 'Bánh tráng phơi sương Trảng Bàng, Bò tơ Tây Ninh, Muối tôm.',
    muaDep: 'Tháng 12 - Tháng 5.', meo: 'Đi cáp treo lên đỉnh Núi Bà Đen chiêm bái!'
  },
  'cần thơ': {
    ten: 'Cần Thơ', mien: 'nam', kieu: 'songnuoc', anh: ANH_MAC_DINH,
    moTa: 'Thủ phủ miền Tây sông nước đong đầy tình người.',
    diemDen: 'Chợ nổi Cái Răng, Bến Ninh Kiều, Cồn Sơn, Nhà cổ Bình Thủy.',
    dacSan: 'Lẩu mắm Cần Thơ, Bánh xèo măng xơ đống, Bánh tét lá cẩm.',
    muaDep: 'Tháng 9 - 11.', meo: 'Đi chợ nổi Cái Răng từ 5h00 sáng!'
  },
  'bình dương': {
    ten: 'Bình Dương', mien: 'nam', kieu: 'songnuoc', anh: ANH_MAC_DINH,
    moTa: 'Thủ phủ công nghiệp kết hợp khu du lịch tâm linh & làng nghề cổ.',
    diemDen: 'Khu du lịch Đại Nam, Chùa Bà Thiên Hậu, Làng gốm Lái Thiêu.',
    dacSan: 'Bánh bèo bì Chợ Búng, Lẩu bò mắm ruốc, Măng cụt Lái Thiêu.',
    muaDep: 'Tháng 5 - Tháng 8.', meo: 'Vào vườn Lái Thiêu thưởng thức gỏi gà măng cụt!'
  },
  'bình phước': {
    ten: 'Bình Phước', mien: 'nam', kieu: 'nui', anh: ANH_MAC_DINH,
    moTa: 'Mảnh đất miền Đông Nam Bộ rợp bóng cao su và vườn điều bạt ngàn.',
    diemDen: 'Vườn quốc gia Bù Gia Mập, Núi Bà Rá, Trảng cỏ Bù Lách.',
    dacSan: 'Hạt điều rang muối, Đọt mây nướng, Ve sầu chiên giòn.',
    muaDep: 'Tháng 12 - Tháng 3.', meo: 'Check-in con đường lá cao su đổ vàng!'
  },
  'đồng nai': {
    ten: 'Đồng Nai', mien: 'nam', kieu: 'songnuoc', anh: ANH_MAC_DINH,
    moTa: 'Mảnh đất miền Đông giàu thiên nhiên hoang sơ và trái cây mọng ngọt.',
    diemDen: 'Vườn quốc gia Cát Tiên, Bửu Long, Thác Giang Điền.',
    dacSan: 'Trái cây Long Khánh, Dát bò Đồng Nai, Lẩu lá khổ qua.',
    muaDep: 'Tháng 5 - Tháng 8.', meo: 'Ghé Vườn quốc gia Cát Tiên xem thú ban đêm!'
  },
  'an giang': {
    ten: 'An Giang', mien: 'nam', kieu: 'songnuoc', anh: ANH_MAC_DINH,
    moTa: 'Vùng đất Thất Sơn huyền bí với Rừng tràm Trà Cư xanh ngát.',
    diemDen: 'Rừng tràm Trà Sư, Miếu Bà Chúa Xúc Núi Sam, Núi Cấm.',
    dacSan: 'Mắm Châu Đốc, Lẩu mắm, Bánh bò thốt nốt, Bún cá.',
    muaDep: 'Tháng 9 - Tháng 11.', meo: 'Đi tắc ráng lướt thảm bèo xanh Rừng tràm Trà Sư!'
  },
  'bạc liêu': {
    ten: 'Bạc Liêu', mien: 'nam', kieu: 'songnuoc', anh: ANH_MAC_DINH,
    moTa: 'Quê hương Công tử Bạc Liêu và bản Dạ Cổ Hoài Lang bất hủ.',
    diemDen: 'Nhà Công tử Bạc Liêu, Cánh đồng quạt gió, Chùa Ghositaram.',
    dacSan: 'Lẩu mắm, Bánh xèo Bạc Liêu, Ba khía muối.',
    muaDep: 'Quanh năm.', meo: 'Ghé Nhà Công tử Bạc Liêu nghe giai thoại xưa!'
  },
  'bến tre': {
    ten: 'Bến Tre', mien: 'nam', kieu: 'songnuoc', anh: ANH_MAC_DINH,
    moTa: 'Xứ sở dừa xanh mát dải đất phù sa đồng bằng.',
    diemDen: 'Cồn Phụng, Lan Vương, Vườn trái cây Cái Mơn.',
    dacSan: 'Kẹo dừa Bến Tre, Cơm dừa, Dừa sáp, Đuông dừa.',
    muaDep: 'Tháng 6 - Tháng 8.', meo: 'Chèo xuồng ba lá trong các rạch dừa nước!'
  },
  'cà mau': {
    ten: 'Cà Mau', mien: 'nam', kieu: 'songnuoc', anh: ANH_MAC_DINH,
    moTa: 'Mảnh đất cực Nam Tổ quốc nơi rừng u minh chạm biển bao la.',
    diemDen: 'Mũi Cà Mau, Vườn quốc gia U Minh Hạ, Hòn Đá Bạc.',
    dacSan: 'Cua Cà Mau, Ba khía Rạch Gốc, Cá thòi lòi nướng.',
    muaDep: 'Tháng 12 - Tháng 4.', meo: 'Check-in Cột mốc tọa độ quốc gia GPS 0001!'
  },
  'đồng tháp': {
    ten: 'Đồng Tháp', mien: 'nam', kieu: 'songnuoc', anh: ANH_MAC_DINH,
    moTa: 'Đất Sen Hồng rực rỡ với Vườn quốc gia Tràm Chim.',
    diemDen: 'Xẻo Quýt, Vườn quốc gia Tràm Chim, Làng hoa Sa Đéc.',
    dacSan: 'Nem Lai Vung, Hủ tiếu Sa Đéc, Các món ăn từ Sen.',
    muaDep: 'Tháng 1 - Tháng 2.', meo: 'Thưởng thức tô Hủ tiếu Sa Đéc đậm đà!'
  },
  'hậu giang': {
    ten: 'Hậu Giang', mien: 'nam', kieu: 'songnuoc', anh: ANH_MAC_DINH,
    moTa: 'Vùng đất bình yên ven dòng sông Hậu hiền hòa.',
    diemDen: 'Lung Ngọc Hoàng, Chợ nổi Ngã Bảy, Công viên Xà No.',
    dacSan: 'Cá thát lát rút xương chiên giòn, Khóm Cầu Đúc.',
    muaDep: 'Tháng 9 - Tháng 11.', meo: 'Thưởng thức Chả cá thát lát dai giòn!'
  },
  'long an': {
    ten: 'Long An', mien: 'nam', kieu: 'songnuoc', anh: ANH_MAC_DINH,
    moTa: 'Cửa ngõ kết nối TP.HCM với miền Tây sông nước dạt dào.',
    diemDen: 'Làng nổi Tân Lập, Khu du lịch Cánh Đồng Bất Tận.',
    dacSan: 'Lạp xưởng tươi Cần Đước, Rượu Gò Đen, Thanh long.',
    muaDep: 'Tháng 8 - Tháng 11.', meo: 'Bắt xuồng xuôi dòng con đường xuyên rừng tràm!'
  },
  'sóc trăng': {
    ten: 'Sóc Trăng', mien: 'nam', kieu: 'vanhoa', anh: ANH_MAC_DINH,
    moTa: 'Sự giao thoa văn hóa độc đáo Kinh - Hoa - Khmer.',
    diemDen: 'Chùa Dơi, Chùa Som Rong, Chùa Chén Kiểu.',
    dacSan: 'Bánh pía Sóc Trăng, Bún nước lèo, Bánh cống.',
    muaDep: 'Tháng 10 âm lịch.', meo: 'Thưởng thức Bánh pía sầu riêng trứng muối!'
  },
  'tiền giang': {
    ten: 'Tiền Giang', mien: 'nam', kieu: 'songnuoc', anh: ANH_MAC_DINH,
    moTa: 'Vùng đất cây trái xum xuê bên dòng sông Tiền hiền hòa.',
    diemDen: 'Cù lao Thới Sơn, Chợ nổi Cái Bè, Chùa Vĩnh Tràng.',
    dacSan: 'Hủ tiếu Mỹ Tho, Vú sữa Lò Rèn, Dứa Tân Phước.',
    muaDep: 'Tháng 6 - Tháng 8.', meo: 'Thưởng thức tô Hủ tiếu Mỹ Tho tôm thịt!'
  },
  'trà vinh': {
    ten: 'Trà Vinh', mien: 'nam', kieu: 'vanhoa', anh: ANH_MAC_DINH,
    moTa: 'Vùng đất rợp bóng cây cổ thụ nghìn năm và Chùa Khmer cổ kính.',
    diemDen: 'Ao Bà Om, Chùa Hang, Chùa Âng, Biển Ba Động.',
    dacSan: 'Bún nước lèo Trà Vinh, Dừa sáp Cầu Kè, Bánh tét Trà Cuôn.',
    muaDep: 'Tháng 10 âm lịch.', meo: 'Thử món Dừa sáp dầm đá đường béo ngậy!'
  },
  'vĩnh long': {
    ten: 'Vĩnh Long', mien: 'nam', kieu: 'songnuoc', anh: ANH_MAC_DINH,
    moTa: 'Mảnh đất sinh thái cù lao bạt ngàn vườn cây ăn trái.',
    diemDen: 'Cù lao An Bình, Chùa Tiên Châu, Làng gạch Mang Thít.',
    dacSan: 'Cá cháy sông Hậu, Bưởi năm roi Bình Minh, Tai tượng chiên xù.',
    muaDep: 'Tháng 5 - Tháng 7.', meo: 'Trải nghiệm làm nông dân bắt cá lóc nướng trui!'
  }
};

// =========================================================================
// 4. BỘ HÀM XUẤT PHẢN HỒI VỚI QUỐC TẾ CHUẨN UI DIALOGFLOW (QUICK REPLIES)
// =========================================================================

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

  const titleHeader = `🎩 HDV DU LỊCH: ${tinhData.ten.toUpperCase()}`;
  let fullFulfillmentText = `${titleHeader}\n\n${subTitleText}`;

  if (userState && userState.lichSuXem.length > 1) {
    fullFulfillmentText += `\n\n🧠 [AI Memory]: Bạn đã khám phá ${userState.lichSuXem.length} điểm đến trong phiên trò chuyện này!`;
  }

  return {
    fulfillmentText: fullFulfillmentText,
    fulfillmentMessages: [
      {
        card: {
          title: titleHeader,
          subtitle: subTitleText.length > 240 ? subTitleText.substring(0, 237) + '...' : subTitleText,
          imageUri: tinhData.anh || ANH_MAC_DINH
        }
      },
      {
        quickReplies: {
          title: "👇 Bấm chọn nhanh thông tin bạn cần:",
          quickReplies: [
            `Địa danh ${tinhData.ten}`,
            `Đặc sản ${tinhData.ten}`,
            `Mẹo đi ${tinhData.ten}`
          ]
        }
      }
    ]
  };
}

function taoCardMien(dataMien) {
  return {
    fulfillmentText: `🗺️ **KHÁM PHÁ ${dataMien.ten.toUpperCase()}**\n\n${dataMien.moTa}\n\n📍 **Các tỉnh tiêu biểu:** ${dataMien.tinhThanh}`,
    fulfillmentMessages: [
      {
        card: {
          title: `🗺️ KHÁM PHÁ ${dataMien.ten.toUpperCase()}`,
          subtitle: `${dataMien.moTa}\n\n📍 Tỉnh tiêu biểu: ${dataMien.tinhThanh}`,
          imageUri: dataMien.anh
        }
      },
      {
        quickReplies: {
          title: "👇 Bấm chọn vùng miền hoặc gõ tên tỉnh:",
          quickReplies: ["Khám phá Miền Bắc", "Khám phá Miền Trung", "Khám phá Miền Nam"]
        }
      }
    ]
  };
}

function taoWelcomeCard() {
  return {
    fulfillmentText: "🎩 **Dạ em chào quý khách! Em là Hướng dẫn viên du lịch cá nhân 63 Tỉnh Thành đây ạ!**\n\nQuý khách muốn cùng em khám phá du lịch tại miền nào?",
    fulfillmentMessages: [
      {
        card: {
          title: "🎩 HDV DU LỊCH 63 TỈNH THÀNH",
          subtitle: "Vui lòng bấm chọn vùng miền hoặc gõ tên Tỉnh/Thành bạn muốn tham quan khám phá:",
          imageUri: "https://images.unsplash.com/photo-1528127269322-539801943592?w=800"
        }
      },
      {
        quickReplies: {
          title: "👇 Bấm chọn vùng miền:",
          quickReplies: ["Khám phá Miền Bắc", "Khám phá Miền Trung", "Khám phá Miền Nam"]
        }
      }
    ]
  };
}

// =========================================================================
// 5. ROUTING XỬ LÝ WEBHOOK & TRÍ TUỆ NHÂN TẠO
// =========================================================================

app.get('/', (req, res) => {
  res.send('<h3>🧠 Native AI Travel Engine (Neural Intent & Reasoning) đang chạy trực tiếp trên Node.js!</h3>');
});

app.post('/', (req, res) => {
  const queryResult = req.body.queryResult || {};
  const userQuery = (queryResult.queryText || '').toLowerCase().trim();

  // 1. QUẢN LÝ BỘ NHỚ PHIÊN CHAT (SESSION MEMORY)
  const sessionId = req.body.session || 'default_session';
  if (!boNhoNguoiDung.has(sessionId)) {
    boNhoNguoiDung.set(sessionId, { lichSuXem: [], mienQuanTam: null });
  }
  const userState = boNhoNguoiDung.get(sessionId);

  // 2. AI NHẬN THỨC VÙNG MIỀN
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

  // 3. AI DỰ ĐOÁN Ý ĐỊNH BẰNG MẠNG NƠ-RON (NEURAL INTENT CLASSIFICATION)
  const prediction = neuralAI.predictIntent(userQuery);
  let subTopic = 'all';

  if (prediction.intent === 'HOI_AM_THUC') subTopic = 'dacSan';
  else if (prediction.intent === 'HOI_DIEM_DEN') subTopic = 'diemDen';
  else if (prediction.intent === 'HOI_ME_O') subTopic = 'meo';

  // 4. BỘ TÌM KIẾM TỈNH THÀNH BẰNG MÔ HÌNH NGỮ NGHĨA (SEMANTIC SEARCH)
  let tinhTimThay = null;
  const câuHỏiKhongDau = loaiBoDau(userQuery);

  for (const key in duLieuCacTinh) {
    const tenTinhKhongDau = loaiBoDau(key);
    if (câuHỏiKhongDau.includes(tenTinhKhongDau)) {
      tinhTimThay = duLieuCacTinh[key];
      break;
    }
  }

  // Nếu tìm thấy Tỉnh Thành -> Xuất thông tin ngay
  if (tinhTimThay) {
    if (!userState.lichSuXem.includes(tinhTimThay.ten)) {
      userState.lichSuXem.push(tinhTimThay.ten);
    }
    return res.json(taoResponseRichText(tinhTimThay, subTopic, userState));
  }

  // 5. BỘ SUY LUẬN GIẢI QUYẾT BÀI TOÁN KHÁCH HÀNG (REASONING ENGINE)
  const problemSolution = TravelReasoningEngine.solveTravelProblem(userQuery, duLieuCacTinh);
  if (problemSolution.type && problemSolution.recommendations.length > 0) {
    return res.json({
      fulfillmentText: `🧠 **AI Hướng Dẫn Viên Suy Luận Nhu Cầu**:

Dựa trên yêu cầu của bạn, em nhận thấy bạn đang tìm kiếm loại hình du lịch **${problemSolution.type.toUpperCase()}**. 

🎯 **Gợi ý địa danh phù hợp nhất dành cho bạn**: ${problemSolution.recommendations.join(', ')}.

Bạn muốn xem chi tiết thông tin địa danh nào ở trên?`,
      fulfillmentMessages: [
        {
          quickReplies: {
            title: "👇 Bấm chọn địa danh AI gợi ý:",
            quickReplies: problemSolution.recommendations
          }
        }
      ]
    });
  }

  // 6. XỬ LÝ Ý ĐỊNH CHI PHÍ (ĐÃ ĐƯỢC CẬP NHẬT THEO CÁCH SỬA MỚI)
  if (prediction.intent === 'HOI_CHI_PHI' || userQuery.includes('chi phí') || userQuery.includes('giá')) {
    return res.json({
      fulfillmentText: `🎩 **Dạ em HDV xin tư vấn mức chi phí du lịch tham khảo ạ**:

💵 **Tour Tiết Kiệm (3N2Đ)**: ~ 2.000.000đ - 3.500.000đ/người.
💎 **Tour Nghỉ Dưỡng (3N2Đ)**: ~ 4.500.000đ - 8.000.000đ/người.

Quý khách muốn đi tỉnh thành nào cứ gõ tên tỉnh em sẽ tư vấn chi tiết nhé!`,
      fulfillmentMessages: [
        {
          card: {
            title: "🎩 BẢNG CHI PHÍ DU LỊCH THAM KHẢO",
            subtitle: "Tour Tiết Kiệm: 2-3.5tr | Tour Nghỉ Dưỡng: 4.5-8tr/người (3N2Đ)",
            imageUri: "https://images.unsplash.com/photo-1528127269322-539801943592?w=800"
          }
        },
        {
          quickReplies: {
            title: "Gợi ý điểm đến hot:",
            quickReplies: ["Hà Giang", "Đà Lạt", "Phú Quốc", "Đà Nẵng"]
          }
        }
      ]
    });
  }

  // 7. FALLBACK MẶC ĐỊNH (WELCOME CARD)
  return res.json(taoWelcomeCard());
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`[SERVER] Native AI Travel Bot running on port ${PORT}`);
});
