/**
 * WEBHOOK DIALOGFLOW ES - CHATBOT DU LỊCH 63 TỈNH THÀNH VIỆT NAM
 * ARCHITECTURE: NATIVE NEURAL AI & REASONING ENGINE (FULL TEXT, NO IMAGES + QUICK REPLIES)
 */

const express = require('express');
const app = express();

app.use(express.json());

// =========================================================================
// 1. CORE AI ENGINE: MẠNG NƠ-RON & BỘ SUY LUẬN NHẬN THỨC (NATIVE AI)
// =========================================================================

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
 * Thuật toán TF-IDF & Cosine Similarity (Đo độ tương đồng ngữ nghĩa)
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
 * Mạng Nơ-ron Phân loại Ý định (Neural Network Intent Classifier)
 */
class NeuralIntentClassifier {
  constructor() {
    this.knowledgeBase = [
      { intent: 'HOI_CHI_PHI', samples: ['chi phí hết bao nhiêu', 'giá tour thế nào', 'đi tốn tiền không', 'ngân sách du lịch', 'giá vé tham quan'] },
      { intent: 'HOI_AM_THUC', samples: ['ăn gì ngon', 'đặc sản có gì', 'món ngon nên thử', 'quán ăn nổi tiếng', 'nhà hàng ngon'] },
      { intent: 'HOI_DIEM_DEN', samples: ['chơi gì ở đâu', 'địa danh nổi tiếng', 'điểm check in đẹp', 'chỗ tham quan', 'địa điểm hot'] },
      { intent: 'HOI_ME_O', samples: ['mẹo du lịch', 'lời khuyên hdv', 'mùa nào đẹp nhất', 'lưu ý khi đi', 'bí kíp kinh nghiệm'] },
      { intent: 'TIM_GIAI_PHAP', samples: ['gợi ý cho tôi', 'tư vấn địa điểm phù hợp', 'nên đi đâu mùa này', 'tìm nơi xả stress', 'du lịch nghỉ dưỡng'] }
    ];
  }

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
 * Bộ Suy Luận Giải Quyết Vấn Đề (Knowledge Reasoning Engine)
 */
class TravelReasoningEngine {
  static solveTravelProblem(userQuery, duLieuCacTinh) {
    const query = loaiBoDau(userQuery);
    const matchedProvinces = [];

    let targetType = null;
    if (query.includes('nui') || query.includes('se lanh') || query.includes('san may') || query.includes('cao nguyen')) {
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

const neuralAI = new NeuralIntentClassifier();
const boNhoNguoiDung = new Map();

// =========================================================================
// 2. KHO DỮ LIỆU VÙNG MIỀN & 63 TỈNH THÀNH (GRAPH DATA)
// =========================================================================
const danhSachMien = {
  'miền bắc': {
    ten: 'Miền Bắc',
    moTa: 'Hội tụ cảnh quan thiên nhiên hùng vĩ, những dãy núi cao trùng điệp cùng nền văn hóa nghìn năm văn hiến mang đậm dấu ấn lịch sử.',
    tinhThanh: 'Hà Nội, Quảng Ninh, Lào Cai (Sa Pa), Hà Giang, Ninh Bình, Hải Phòng...'
  },
  'miền trung': {
    ten: 'Miền Trung & Tây Nguyên',
    moTa: 'Nổi tiếng với con đường di sản văn hóa miền Trung, những bãi biển cát trắng ngọc bích và cao nguyên đại ngàn kỳ vĩ đầy nắng gió.',
    tinhThanh: 'Thừa Thiên Huế, Đà Nẵng, Hội An, Quy Nhơn, Nha Trang, Đà Lạt, Quảng Bình...'
  },
  'miền nam': {
    ten: 'Miền Nam',
    moTa: 'Mảnh đất miền sông nước phù sa màu mỡ, nhịp sống sầm uất năng động cùng sự chân chất, mến khách của người dân Nam Bộ.',
    tinhThanh: 'TP.HCM, Vũng Tàu, Phú Quốc, Cần Thơ, An Giang, Bến Tre, Cà Mau...'
  }
};

const duLieuCacTinh = {
  'hà nội': {
    ten: 'Thủ đô Hà Nội', mien: 'bac', kieu: 'vanhoa',
    moTa: 'Trái tim nghìn năm văn hiến với Phố Cổ rợp bóng cây, hồ nước nên thơ và nét văn hóa Tràng An thanh lịch.',
    diemDen: 'Hồ Hoàn Kiếm, Lăng Chủ tịch Hồ Chí Minh, Văn Miếu Quốc Tử Giám, Hoàng thành Thăng Long, Phố cổ.',
    dacSan: 'Phở gia truyền, Bún chả Hàng Mành, Chả cá Lăng, Cà phê trứng, Bánh cốm Hàng Than.',
    muaDep: 'Tháng 9 - 11 (Mùa thu Hà Nội se lạnh, lãng mạn và ngập tràn hương hoa sữa).',
    meo: 'Nên thử dậy sớm vào lúc 5h sáng để dạo quanh Hồ Gươm, tận hưởng không khí trong lành và nhịp sống bình yên buổi sớm.'
  },
  'hải phòng': {
    ten: 'Hải Phòng', mien: 'bac', kieu: 'bien',
    moTa: 'Thành phố Hoa Phượng Đỏ sôi động, sở hữu quần đảo Cát Bà tuyệt đẹp và thiên đường ẩm thực đường phố cực đỉnh.',
    diemDen: 'Quần đảo Cát Bà, Vịnh Lan Hạ, Bãi biển Đồ Sơn, Khu di tích Bạch Đằng Giang.',
    dacSan: 'Bánh đa cua bể, Bánh mì cay, Dừa dầm cột đèn, Bún cá cay.',
    muaDep: 'Tháng 4 - 10 (Thích hợp cho các hoạt động tắm biển và khám phá vịnh đảo).',
    meo: 'Hãy chuẩn bị một chiếc bụng đói và thuê xe máy để làm một chuyến Foodtour quanh các khu chợ trung tâm Thành phố!'
  },
  'quảng ninh': {
    ten: 'Quảng Ninh', mien: 'bac', kieu: 'bien',
    moTa: 'Vùng đất di sản thiên nhiên thế giới nổi bật với Vịnh Hạ Long kỳ vĩ và hệ thống tâm linh linh thiêng.',
    diemDen: 'Vịnh Hạ Long, Đảo Ti Tốp, Núi thiêng Yên Tử, Bảo tàng Quảng Ninh.',
    dacSan: 'Chả mực giã tay Hạ Long, Bún bề bề, Gà đồi Tiên Yên, Sá sùng.',
    muaDep: 'Tháng 4 - 9 (Nắng vàng rực rỡ, rất lý tưởng để đi du thuyền trên vịnh).',
    meo: 'Nên trải nghiệm dịch vụ tour du thuyền ngủ đêm trên Vịnh Hạ Long để ngắm hoàng hôn và bình minh tuyệt mỹ.'
  },
  'hà giang': {
    ten: 'Hà Giang', mien: 'bac', kieu: 'nui',
    moTa: 'Nơi địa đầu Tổ quốc với những dãy núi đá tai mèo hùng vĩ, ruộng bậc thang tầng tầng lớp lớp và các cung đường đèo huyền thoại.',
    diemDen: 'Đèo Mã Pí Lèng, Sông Nho Quế, Cột cờ Lũng Cú, Phố cổ Đồng Văn.',
    dacSan: 'Bánh tam giác mạch, Cháo ấu tẩu, Thắng cố ngựa, Thịt bò khô vùng cao.',
    muaDep: 'Tháng 10 - 12 (Mùa hoa tam giác mạch nở rộ phủ hồng khắp các sườn đèo).',
    meo: 'Nếu tự lái xe máy chinh phục đèo dốc, hãy kiểm tra phanh xe cẩn thận và giữ vững tay lái.'
  },
  'lào cai': {
    ten: 'Lào Cai - Sa Pa', mien: 'bac', kieu: 'nui',
    moTa: 'Thị trấn trong sương mờ với nét văn hóa bản địa đặc sắc của đồng bào dân tộc thiểu số và đỉnh cao Đông Dương.',
    diemDen: 'Đỉnh Fansipan 3.143m, Bản Cát Cát, Thung lũng Mường Hoa, Đèo Ô Quy Hồ.',
    dacSan: 'Lẩu cá hồi Sa Pa, Thịt trâu gác bếp, Cơm lam nướng ống tre, Thắng cố.',
    muaDep: 'Tháng 9 - 10 (Mùa lúa chín vàng óng ả) hoặc Tháng 12 - 1 (Mùa săn mây và ngắm tuyết rơi nếu may mắn).',
    meo: 'Nhớ mang theo áo ấm dày vì nhiệt độ tại Sa Pa về đêm xuống rất thấp.'
  },
  'ninh bình': {
    ten: 'Ninh Bình', mien: 'bac', kieu: 'vanhoa',
    moTa: 'Tuyệt tác Cố đô xưa với di sản hỗn hợp thế giới Tràng An, nơi non nước hữu tình đẹp như bức tranh thủy mặc.',
    diemDen: 'Quần thể danh thắng Tràng An, Tam Cốc - Bích Động, Hang Múa, Chùa Bái Đính, Phố cổ Hoa Lư.',
    dacSan: 'Cơm cháy sốt dê núi, Thịt dê núi Ninh Bình, Ốc núi đá.',
    muaDep: 'Tháng 1 - 5 (Tiết trời xuân ấm áp, thuận lợi cho việc vãn cảnh chùa và đi thuyền).',
    meo: 'Hãy cố gắng chinh phục 500 bậc thang tại Hang Múa để ngắm toàn cảnh thung lũng lúa Tam Cốc từ trên cao.'
  },
  'thừa thiên huế': {
    ten: 'Cố đô Huế', mien: 'trung', kieu: 'vanhoa',
    moTa: 'Vùng đất mộng mơ, trầm mặc với những công trình kiến trúc cung đình hoàng gia và nét ẩm thực cung đình tinh tế.',
    diemDen: 'Đại Nội Huế, Chùa Thiên Mụ, Lăng Khải Định, Lăng Tự Đức, Đồi Vọng Cảnh.',
    dacSan: 'Bún bò Huế chuẩn vị, Cơm hến, Bánh bột lọc, Bánh nậm, Chè bột lọc heo quay.',
    muaDep: 'Tháng 1 - 4 (Thời tiết khô ráo, dễ chịu nhất trong năm tại miền Trung).',
    meo: 'Đừng quên trải nghiệm lắng nghe Ca Huế trên dòng sông Hương thơ mộng vào lúc hoàng hôn hoặc buổi tối.'
  },
  'đà nẵng': {
    ten: 'Đà Nẵng', mien: 'trung', kieu: 'bien',
    moTa: 'Thành phố đáng sống bậc nhất Việt Nam với những cây cầu hiện đại, bãi biển dài cát trắng và khu du lịch đẳng cấp.',
    diemDen: 'Khu du lịch Bà Nà Hills (Cầu Vàng), Cầu Rồng, Bãi biển Mỹ Khê, Bán đảo Sơn Trà.',
    dacSan: 'Mì Quảng, Bánh tráng cuốn thịt heo hai đầu da, Gỏi cá Nam O, Bánh xèo.',
    muaDep: 'Tháng 2 - 8 (Mùa khô, biển lặng, trời xanh ngắt rất thích hợp du lịch biển).',
    meo: 'Hãy sắp xếp thời gian để xem Cầu Rồng phun lửa và phun nước vào lúc 21h các ngày thứ Bảy và Chủ Nhật hàng tuần.'
  },
  'hội an': {
    ten: 'Phố cổ Hội An', mien: 'trung', kieu: 'vanhoa',
    moTa: 'Không gian kiến trúc hoài cổ rợp bóng đèn lồng lung linh bên bờ sông Hoài thanh bình.',
    diemDen: 'Chùa Cầu, Nhà cổ Tấn Ký, Hội quán Phúc Kiến, Rừng dừa Bảy Mẫu.',
    dacSan: 'Bánh mì Phượng, Cao lầu Hội An, Cơm gà Hội An, Nước mót thảo mộc.',
    muaDep: 'Tháng 2 - 7 (Trời ít mưa, thuận lợi đi bộ dạo phố cổ và đi thuyền sông Hoài).',
    meo: 'Nên đi dạo phố cổ vào buổi chiều tối khi hàng loạt lồng đèn được thắp sáng để cảm nhận rõ nét vẻ đẹp hoài niệm.'
  },
  'khánh hòa': {
    ten: 'Khánh Hòa - Nha Trang', mien: 'trung', kieu: 'bien',
    moTa: 'Xứ trầm biển yến với vịnh biển Nha Trang được bình chọn là một trong những vịnh đẹp nhất thế giới.',
    diemDen: 'Công viên giải trí VinWonders, Đảo Hòn Mun, Tháp Bà Ponagar, Viện Hải dương học.',
    dacSan: 'Nem nướng Ninh Hòa, Bún sứa, Bánh căn mực, Hải sản tươi sống.',
    muaDep: 'Tháng 1 - 8 (Nắng ấm quanh năm, biển trong xanh tuyệt đẹp).',
    meo: 'Trải nghiệm dịch vụ tắm bùn khoáng nóng tự nhiên để phục hồi sức khỏe sau những giờ vui chơi thỏa thích.'
  },
  'lâm đồng': {
    ten: 'Lâm Đồng - Đà Lạt', mien: 'trung', kieu: 'nui',
    moTa: 'Thành phố ngàn hoa ẩn hiện trong sương mờ với khí hậu ôn đới mát mẻ quanh năm và kiến trúc kiểu Pháp.',
    diemDen: 'Hồ Xuân Hương, Quảng trường Lâm Viên, Đồi chè Cầu Đất, Núi Langbiang.',
    dacSan: 'Lẩu gà lá é, Lẩu bò Ba Toa, Bánh mì xíu mại, Kem bơ Thanh Thảo, Bánh tráng nướng.',
    muaDep: 'Tháng 11 - 4 (Mùa khô, tiết trời se lạnh, mùa hoa dã quỳ và mai anh đào nở rực rỡ).',
    meo: 'Hãy thử dậy thật sớm lúc 4h30 sáng để đi săn mây tại khu vực đồi chè Cầu Đất hoặc Trại Mát.'
  },
  'quảng bình': {
    ten: 'Quảng Bình', mien: 'trung', kieu: 'nui',
    moTa: 'Vương quốc hang động kỳ vĩ của thế giới với hệ thống hàng trăm hang động lớn nhỏ ẩn trong rừng nguyên sinh Phong Nha - Kẻ Bàng.',
    diemDen: 'Động Phong Nha, Động Thiên Đường, Sông Chày - Hang Tối, Bãi biển Nhật Lệ.',
    dacSan: 'Bánh lọc bột sắn, Lẩu cá khoai, Khoai dẻo Quảng Bình.',
    muaDep: 'Tháng 4 - 8 (Mùa khô ráo, nước trong xanh thuận lợi cho việc thám hiểm hang động và chèo thuyền).',
    meo: 'Nên tham gia hoạt động chèo thuyền Kayak và tắm bùn tự nhiên trong hang tại khu du lịch Sông Chày - Hang Tối.'
  },
  'tp.hồ chí minh': {
    ten: 'TP. Hồ Chí Minh (Sài Gòn)', mien: 'nam', kieu: 'songnuoc',
    moTa: 'Trung tâm kinh tế tài chính phồn hoa, năng động bậc nhất cả nước với nhịp sống hiện đại không bao giờ ngủ.',
    diemDen: 'Dinh Độc Lập, Tòa nhà Landmark 81, Phố đi bộ Nguyễn Huệ, Địa đạo Củ Chi, Chợ Bến Thành.',
    dacSan: 'Cơm tấm sườn bì chả, Hủ tiếu Nam Vang, Bánh mì Sài Gòn, Ốc các loại.',
    muaDep: 'Tháng 12 - 4 (Mùa khô, thời tiết dễ chịu, ít những cơn mưa bất chợt).',
    meo: 'Trải nghiệm ngồi uống cà phê bệt tại khu vực công viên hông Nhà thờ Đức Bà để cảm nhận nhịp sống Sài thành.'
  },
  'bà rịa - vũng tàu': {
    ten: 'Bà Rịa - Vũng Tàu', mien: 'nam', kieu: 'bien',
    moTa: 'Thành phố biển Vũng Tàu quen thuộc với những cung đường biển thoáng đãng và Côn Đảo linh thiêng giữa trùng khơi.',
    diemDen: 'Bãi Sau, Tượng Chúa Kito, Mũi Nghinh Phong, Ngọn Hải Đăng Vũng Tàu, Côn Đảo.',
    dacSan: 'Bánh khọt Vũng Tàu, Lẩu cá đuối, Bánh bông lan trứng muối, Hải sản tươi.',
    muaDep: 'Quanh năm (Thời tiết ôn hòa, luôn sẵn sàng đón khách du lịch vào bất cứ dịp nào).',
    meo: 'Thưởng thức những chiếc bánh khọt giòn rụm cuốn kèm rau sống tươi sạch và nước chấm chua ngọt đặc trưng.'
  },
  'kiên giang': {
    ten: 'Kiên Giang - Phú Quốc', mien: 'nam', kieu: 'bien',
    moTa: 'Thiên đường nghỉ dưỡng Đảo Ngọc Phú Quốc với những bãi cát trắng mịn màng và làn nước biển trong thấu đáy.',
    diemDen: 'Tổ hợp Grand World, Bãi Sao, Cáp treo Hòn Thơm vượt biển dài nhất thế giới, Bãi Dài.',
    dacSan: 'Bún quậy Kiến Xây, Gỏi cá trích, Canh nấm tràm hải sản, Còi biên mai.',
    muaDep: 'Tháng 10 - 4 (Mùa khô, biển êm, sóng lặng, là thời điểm hoàn hảo nhất để du lịch Phú Quốc).',
    meo: 'Đừng bỏ lỡ khoảnh khắc ngắm hoàng hôn cực kỳ lung linh và ảo diệu tại khu vực Sunset Sanato.'
  },
  'cần thơ': {
    ten: 'Cần Thơ', mien: 'nam', kieu: 'songnuoc',
    moTa: 'Thủ phủ miền Tây sông nước trù phú, nổi tiếng với nét văn hóa chợ nổi trên sông đặc trưng và tình cảm đong đầy.',
    diemDen: 'Chợ nổi Cái Răng, Bến Ninh Kiều, Cồn Sơn, Nhà cổ Bình thủy.',
    dacSan: 'Lẩu mắm miền Tây, Bánh xèo miền Tây giòn rụm, Bánh tét lá cẩm, Cá lóc nướng trui.',
    muaDep: 'Tháng 9 - 11 (Mùa nước nổi miền Tây, cảnh quan sông nước vô cùng nên thơ và nhiều đặc sản mùa nước nổi).',
    meo: 'Hãy thuê ghe xuồng đi khám phá Chợ nổi Cái Răng từ sớm tinh mơ (khoảng 5h00 sáng) để chứng kiến cảnh mua bán tấp nập.'
  },
  'an giang': {
    ten: 'An Giang', mien: 'nam', kieu: 'songnuoc',
    moTa: 'Vùng đất Thất Sơn huyền bí, nổi tiếng với rừng tràm ngập nước xanh ngát và các điểm tâm linh linh thiêng nổi tiếng.',
    diemDen: 'Rừng tràm Trà Sư, Miếu Bà Chúa Xứ Núi Sam, Khu du lịch Núi Cấm, Làng Chăm Châu Giang.',
    dacSan: 'Mắm Châu Đốc, Bánh bò thốt nốt ngọt thanh, Bún cá Châu Đốc, Gà đá Chợ Thủ.',
    muaDep: 'Tháng 9 - 11 (Mùa nước nổi, thảm bèo xanh mướt phủ kín rừng tràm Trà Sư cực kỳ đẹp mắt).',
    meo: 'Đi tắc ráng (vỏ lãi) lướt nhẹ qua thảm bèo xanh ngắt ở Rừng tràm Trà Sư sẽ mang lại trải nghiệm khó quên.'
  },
  'bến tre': {
    ten: 'Bến Tre', mien: 'nam', kieu: 'songnuoc',
    moTa: 'Xứ sở dừa xanh mát lành giữa lòng đồng bằng phù sa sông Cửu Long, mang lại cảm giác thanh bình, yên ả.',
    diemDen: 'Cồn Phụng, Cồn Quy, Vườn trái cây Cái Mơn, Làng hoa kiểng Chợ Lách.',
    dacSan: 'Kẹo dừa Bến Tre, Cơm dừa, Dừa sáp, Bánh phồng sữa, Đuông dừa béo ngậy.',
    muaDep: 'Tháng 6 - 8 (Mùa trái cây rộ trái ngọt trĩu cành tại các nhà vườn miền Tây).',
    meo: 'Trải nghiệm ngồi xuồng ba lá len lỏi qua các rạch dừa nước rợp bóng mát và thưởng thức đờn ca tài tử.'
  }
};

// =========================================================================
// 3. HÀM XUẤT PHẢN HỒI VĂN BẢN (HOÀN TOÀN TEXT CHI TIẾT + NÚT BẤM QUICK REPLIES)
// =========================================================================

function taoResponseVanBan(tinhData, subTopic = 'all', userState = null) {
  let noiDungChiTiet = '';

  if (subTopic === 'dacSan') {
    noiDungChiTiet = `🍲 **ĐẶC SẢN NÊN THỬ TẠI ${tinhData.ten.toUpperCase()}**:\n\n- Danh sách món ngon: ${tinhData.dacSan}\n\n💡 **Bí kíp từ HDV**: ${tinhData.meo}`;
  } else if (subTopic === 'diemDen') {
    noiDungChiTiet = `🏔️ **ĐIỂM CHECK-IN NỔI BẬT TẠI ${tinhData.ten.toUpperCase()}**:\n\n- Các địa danh: ${tinhData.diemDen}\n\n☀️ **Thời điểm đẹp nhất**: ${tinhData.muaDep}`;
  } else if (subTopic === 'meo') {
    noiDungChiTiet = `💡 **BÍ KÍP & LƯU Ý KHI ĐI ${tinhData.ten.toUpperCase()}**:\n\n- Lời khuyên: ${tinhData.meo}\n\n☀️ **Thời điểm đẹp nhất**: ${tinhData.muaDep}`;
  } else {
    noiDungChiTiet = `🎩 **HƯỚNG DẪN VIÊN GIỚI THIỆU: ${tinhData.ten.toUpperCase()}**\n\n` +
      `📖 **Tổng quan**: ${tinhData.moTa}\n\n` +
      `🏔️ **Điểm check-in nổi bật**: ${tinhData.diemDen}\n\n` +
      `🍲 **Đặc sản phải thử**: ${tinhData.dacSan}\n\n` +
      `☀️ **Mùa du lịch đẹp nhất**: ${tinhData.muaDep}\n\n` +
      `💡 **Mẹo nhỏ từ HDV**: ${tinhData.meo}`;
  }

  if (userState && userState.lichSuXem.length > 1) {
    noiDungChiTiet += `\n\n🧠 *[Hệ thống ghi nhớ AI]*: Bạn đã khám phá tổng cộng ${userState.lichSuXem.length} điểm đến trong phiên làm việc này!`;
  }

  return {
    fulfillmentText: noiDungChiTiet,
    fulfillmentMessages: [
      {
        text: {
          text: [noiDungChiTiet]
        }
      },
      {
        quickReplies: {
          title: "👇 Bấm chọn nhanh nội dung bạn muốn tìm hiểu tiếp:",
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

function taoVanBanMien(dataMien) {
  const textMien = `🗺️ **KHÁM PHÁ KHU VỰC: ${dataMien.ten.toUpperCase()}**\n\n` +
    `📖 ${dataMien.moTa}\n\n` +
    `📍 **Các tỉnh/thành phố tiêu biểu**: ${dataMien.tinhThanh}\n\n` +
    `👉 Anh/chị muốn tìm hiểu sâu hơn về tỉnh thành nào trong khu vực này? Hãy gõ tên tỉnh thành đó (Ví dụ: "Hà Nội", "Đà Lạt", "Phú Quốc",...) hoặc bấm chọn các miền bên dưới nhé!`;

  return {
    fulfillmentText: textMien,
    fulfillmentMessages: [
      {
        text: {
          text: [textMien]
        }
      },
      {
        quickReplies: {
          title: "👇 Bấm chọn vùng miền khác:",
          quickReplies: ["Khám phá Miền Bắc", "Khám phá Miền Trung", "Khám phá Miền Nam"]
        }
      }
    ]
  };
}

function taoWelcomeVanBan() {
  const welcomeText = `🎩 **Dạ em chào anh/chị! Em là Hướng dẫn viên du lịch cá nhân 63 Tỉnh Thành đây ạ!**\n\n` +
    `Em sẵn sàng đồng hành cùng anh/chị để tư vấn toàn bộ thông tin chi tiết về điểm đến, món ăn đặc sản, chi phí dự kiến cũng như các mẹo du lịch hữu ích nhất.\n\n` +
    `Anh/chị muốn cùng em khám phá du lịch tại vùng miền nào trước ạ?`;

  return {
    fulfillmentText: welcomeText,
    fulfillmentMessages: [
      {
        text: {
          text: [welcomeText]
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
// 4. ROUTING WEBHOOK & XỬ LÝ SỰ KIỆN TƯƠNG TÁC NÚT BẤM (QUICK REPLIES)
// =========================================================================

app.get('/', (req, res) => {
  res.send('<h3>🧠 Native AI Travel Engine (Full Text Responses + Optimized Buttons) đang chạy mượt mà!</h3>');
});

app.post('/', (req, res) => {
  const queryResult = req.body.queryResult || {};
  const userQuery = (queryResult.queryText || '').toLowerCase().trim();
  const cauHoiKhongDau = loaiBoDau(userQuery);

  const sessionId = req.body.session || 'default_session';
  if (!boNhoNguoiDung.has(sessionId)) {
    boNhoNguoiDung.set(sessionId, { lichSuXem: [], mienQuanTam: null });
  }
  const userState = boNhoNguoiDung.get(sessionId);

  // 1. Xử lý chọn vùng miền qua nút bấm
  if (cauHoiKhongDau.includes('mien bac') || cauHoiKhongDau.includes('miền bắc')) {
    userState.mienQuanTam = 'Miền Bắc';
    return res.json(taoVanBanMien(danhSachMien['miền bắc']));
  }
  if (cauHoiKhongDau.includes('mien trung') || cauHoiKhongDau.includes('miền trung')) {
    userState.mienQuanTam = 'Miền Trung';
    return res.json(taoVanBanMien(danhSachMien['miền trung']));
  }
  if (cauHoiKhongDau.includes('mien nam') || cauHoiKhongDau.includes('miền nam')) {
    userState.mienQuanTam = 'Miền Nam';
    return res.json(taoVanBanMien(danhSachMien['miền nam']));
  }

  // 2. NHẬN DIỆN TIÊU ĐỀ PHỤ (SUB-TOPIC) KHI BẤM NÚT QUICK REPLIES
  let subTopic = 'all';
  if (cauHoiKhongDau.includes('dac san') || cauHoiKhongDau.includes('đặc sản')) {
    subTopic = 'dacSan';
  } else if (cauHoiKhongDau.includes('dia danh') || cauHoiKhongDau.includes('diem den') || cauHoiKhongDau.includes('địa danh')) {
    subTopic = 'diemDen';
  } else if (cauHoiKhongDau.includes('meo') || cauHoiKhongDau.includes('mẹo')) {
    subTopic = 'meo';
  } else {
    const prediction = neuralAI.predictIntent(userQuery);
    if (prediction.intent === 'HOI_AM_THUC') subTopic = 'dacSan';
    else if (prediction.intent === 'HOI_DIEM_DEN') subTopic = 'diemDen';
    else if (prediction.intent === 'HOI_ME_O') subTopic = 'meo';
  }

  // 3. TÌM KIẾM TỈNH THÀNH (SEMANTIC SEARCH TRONG KHO DỮ LIỆU)
  let tinhTimThay = null;
  for (const key in duLieuCacTinh) {
    const tenTinhKhongDau = loaiBoDau(key);
    if (cauHoiKhongDau.includes(tenTinhKhongDau)) {
      tinhTimThay = duLieuCacTinh[key];
      break;
    }
  }

  if (tinhTimThay) {
    if (!userState.lichSuXem.includes(tinhTimThay.ten)) {
      userState.lichSuXem.push(tinhTimThay.ten);
    }
    return res.json(taoResponseVanBan(tinhTimThay, subTopic, userState));
  }

  // 4. BỘ SUY LUẬN GIẢI QUYẾT BÀI TOÁN (REASONING ENGINE)
  const problemSolution = TravelReasoningEngine.solveTravelProblem(userQuery, duLieuCacTinh);
  if (problemSolution.type && problemSolution.recommendations.length > 0) {
    const textGoiY = `🧠 **AI Hướng Dẫn Viên Phân Tích Nhu Cầu**:\n\n` +
      `Dựa trên mong muốn của anh/chị, hệ thống nhận diện loại hình phù hợp nhất là: **${problemSolution.type.toUpperCase()}**.\n\n` +
      `🎯 **Các địa danh tiêu biểu anh/chị có thể cân nhắc**: ${problemSolution.recommendations.join(', ')}.\n\n` +
      `Anh/chị muốn xem chi tiết thông tin của địa danh nào trước ạ?`;

    return res.json({
      fulfillmentText: textGoiY,
      fulfillmentMessages: [
        {
          text: {
            text: [textGoiY]
          }
        },
        {
          quickReplies: {
            title: "👇 Bấm chọn địa danh AI gợi ý:",
            quickReplies: problemSolution.recommendations
          }
        }
      ]
    });
  }

  // 5. Ý ĐỊNH HỎI CHI PHÍ
  const predictionObj = neuralAI.predictIntent(userQuery);
  if (predictionObj.intent === 'HOI_CHI_PHI' || cauHoiKhongDau.includes('chi phí') || cauHoiKhongDau.includes('giá')) {
    const textChiPhi = `🎩 **BẢNG CHI PHÍ DU LỊCH THAM KHẢO (Hành trình 3 Ngày 2 Đêm)**:\n\n` +
      `💵 **Gói Tiết Kiệm (Phượt / Tự túc)**:\n` +
      `- Chi phí: Khoảng 2.000.000đ - 3.500.000đ / người.\n` +
      `- Bao gồm: Xe khách/xe máy, nhà nghỉ bình dân, ăn uống quán bình dân và vé tham quan cơ bản.\n\n` +
      `💎 **Gói Nghỉ Dưỡng (Cao cấp / Resort)**:\n` +
      `- Chi phí: Khoảng 4.500.000đ - 8.000.000đ+ / người.\n` +
      `- Bao gồm: Vé máy bay khứ hồi, lưu trú khách sạn 4-5 sao hoặc resort, ăn uống nhà hàng sang trọng và dịch vụ spa/tour trọn gói.\n\n` +
      `Anh/chị đang quan tâm chi phí chi tiết tại tỉnh thành nào cụ thể không ạ?`;

    return res.json({
      fulfillmentText: textChiPhi,
      fulfillmentMessages: [
        {
          text: {
            text: [textChiPhi]
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

  // 6. FALLBACK MẶC ĐỊNH
  return res.json(taoWelcomeVanBan());
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`[SERVER] Native AI Travel Bot (Full Text Mode) running on port ${PORT}`);
});
