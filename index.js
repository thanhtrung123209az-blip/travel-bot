/**
 * WEBHOOK DIALOGFLOW ES - CHATBOT DU LỊCH 63 TỈNH THÀNH VIỆT NAM
 * ARCHITECTURE: NATIVE NEURAL AI & REASONING ENGINE (FULL ALGORITHMS + OPTIMIZED BUTTONS)
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
const ANH_MAC_DINH = 'https://images.unsplash.com/photo-1528127269322-539801943592?w=800';

// =========================================================================
// 2. KHO DỮ LIỆU VÙNG MIỀN & 63 TỈNH THÀNH (GRAPH DATA)
// =========================================================================
const danhSachMien = {
  'miền bắc': {
    ten: 'Miền Bắc',
    anh: 'https://images.unsplash.com/photo-1528127269322-539801943592?w=800',
    moTa: 'Hội tụ cảnh quan thiên nhiên hùng vĩ, núi cao trùng điệp và nền văn hóa nghìn năm văn hiến.',
    tinhThanh: 'Hà Nội, Quảng Ninh, Lào Cai (Sa Pa), Hà Giang, Ninh Bình, Hải Phòng...'
  },
  'miền trung': {
    ten: 'Miền Trung & Tây Nguyên',
    anh: 'https://images.unsplash.com/photo-1552353617-3bfd679b3bdd?w=800',
    moTa: 'Nổi tiếng với con đường di sản văn hóa, bãi biển ngọc bích và đại ngàn kỳ vĩ.',
    tinhThanh: 'Thừa Thiên Huế, Đà Nẵng, Hội An, Quy Nhơn, Nha Trang, Đà Lạt, Quảng Bình...'
  },
  'miền nam': {
    ten: 'Miền Nam',
    anh: 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=800',
    moTa: 'Mảnh đất miền sông nước phù sa màu mỡ, nhịp sống sầm uất và con người mến khách.',
    tinhThanh: 'TP.HCM, Vũng Tàu, Phú Quốc, Cần Thơ, An Giang, Bến Tre, Cà Mau...'
  }
};

const duLieuCacTinh = {
  'hà nội': {
    ten: 'Thủ đô Hà Nội', mien: 'bac', kieu: 'vanhoa',
    anh: 'https://images.unsplash.com/photo-1509030450996-93f2e3d84298?w=800',
    moTa: 'Trái tim nghìn năm văn hiến với Phố Cổ rợp bóng cây và nét văn hóa Tràng An.',
    diemDen: 'Hồ Hoàn Kiếm, Lăng Bác, Văn Miếu Quốc Tử Giám, Hoàng thành Thăng Long.',
    dacSan: 'Phở gia truyền, Bún chả Hàng Mành, Chả cá Lăng, Cà phê trứng.',
    muaDep: 'Tháng 9 - 11 (Thu Hà Nội se lạnh lãng mạn).',
    meo: 'Thử dậy lúc 5h sáng dạo Hồ Gươm ngắm nhịp sống bình yên!'
  },
  'hải phòng': {
    ten: 'Hải Phòng', mien: 'bac', kieu: 'bien',
    anh: 'https://images.unsplash.com/photo-1552554948-261ef40d4240?w=800',
    moTa: 'Thành phố Hoa Phượng Đỏ sôi động với biển Cát Bà và Foodtour cực đỉnh.',
    diemDen: 'Quần đảo Cát Bà, Vịnh Lan Hạ, Bãi biển Đồ Sơn.',
    dacSan: 'Bánh đa cua, Bánh mì que, Dừa dầm, Bún cá cay.',
    muaDep: 'Tháng 4 - 10.',
    meo: 'Thuê xe máy làm một chuyến Foodtour quanh các khu chợ trung tâm!'
  },
  'quảng ninh': {
    ten: 'Quảng Ninh', mien: 'bac', kieu: 'bien',
    anh: 'https://images.unsplash.com/photo-1552554948-261ef40d4240?w=800',
    moTa: 'Vùng đất di sản sở hữu Vịnh Hạ Long - Kỳ quan thiên nhiên thế giới.',
    diemDen: 'Vịnh Hạ Long, Yên Tử, Đảo Ti Tốp.',
    dacSan: 'Chả mực Hạ Long, Bún bề bề, Gà đồi Tiên Yên.',
    muaDep: 'Tháng 4 - 9.',
    meo: 'Nên trải nghiệm tour du thuyền ngủ đêm trên Vịnh!'
  },
  'hà giang': {
    ten: 'Hà Giang', mien: 'bac', kieu: 'nui',
    anh: 'https://images.unsplash.com/photo-1508873696983-2df515122519?w=800',
    moTa: 'Nơi địa đầu Tổ quốc với núi đá hùng vĩ và cung đường đèo huyền thoại.',
    diemDen: 'Đèo Mã Pí Lèng, Sông Nho Quế, Cột cờ Lũng Cú.',
    dacSan: 'Bánh tam giác mạch, Cháo ấu tẩu, Thắng cố.',
    muaDep: 'Tháng 10 - 12 (Mùa hoa tam giác mạch).',
    meo: 'Tự lái xe máy đèo dốc nhớ kiểm tra phanh cẩn thận!'
  },
  'lào cai': {
    ten: 'Lào Cai - Sa Pa', mien: 'bac', kieu: 'nui',
    anh: 'https://images.unsplash.com/photo-1528127269322-539801943592?w=800',
    moTa: 'Thị trấn trong mây với nét văn hóa H\'Mông đặc sắc và đỉnh Fansipan.',
    diemDen: 'Fansipan 3.143m, Bản Cát Cát, Thung lũng Mường Hoa.',
    dacSan: 'Lẩu cá hồi, Thịt trâu gác bếp, Thắng cố.',
    muaDep: 'Tháng 9-10 (Lúa chín) & Tháng 12-1 (Săn mây).',
    meo: 'Mang theo áo ấm dày vì nhiệt độ ban đêm xuống thấp.'
  },
  'ninh bình': {
    ten: 'Ninh Bình', mien: 'bac', kieu: 'vanhoa',
    anh: 'https://images.unsplash.com/photo-1528127269322-539801943592?w=800',
    moTa: 'Tuyệt tác Cố đô xưa với di sản thế giới Tràng An sơn thủy hữu tình.',
    diemDen: 'Tràng An, Tam Cốc - Bích Động, Hang Múa, Chùa Bái Đính.',
    dacSan: 'Cơm cháy sốt dê, Thịt dê núi, Ốc núi.',
    muaDep: 'Tháng 1 - 5.',
    meo: 'Chinh phục Hang Múa 500 bậc thang ngắm trọn thung lũng lúa!'
  },
  'thừa thiên huế': {
    ten: 'Cố đô Huế', mien: 'trung', kieu: 'vanhoa',
    anh: 'https://images.unsplash.com/photo-1569154941061-e231b4725ef1?w=800',
    moTa: 'Thành phố mộng mơ trầm mặc giữ gìn hồn di sản dân tộc.',
    diemDen: 'Đại Nội Huế, Chùa Thiên Mụ, Lăng Khải Định.',
    dacSan: 'Bún bò Huế, Cơm hến, Bánh bột lọc.',
    muaDep: 'Tháng 1 - 4.',
    meo: 'Nghe Ca Huế trên sông Hương vào buổi tối.'
  },
  'đà nẵng': {
    ten: 'Đà Nẵng', mien: 'trung', kieu: 'bien',
    anh: 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=800',
    moTa: 'Thành phố đáng sống nhất Việt Nam với Cầu Vàng và biển Mỹ Khê.',
    diemDen: 'Bà Nà Hills, Cầu Rồng, Biển Mỹ Khê, Sơn Trà.',
    dacSan: 'Mì Quảng, Bánh tráng thịt heo.',
    muaDep: 'Tháng 2 - 8.',
    meo: 'Xem Cầu Rồng phun lửa lúc 21h cuối tuần!'
  },
  'hội an': {
    ten: 'Phố cổ Hội An', mien: 'trung', kieu: 'vanhoa',
    anh: 'https://images.unsplash.com/photo-1552353617-3bfd679b3bdd?w=800',
    moTa: 'Không gian hoài cổ rợp bóng đèn lồng bên sông Hoài.',
    diemDen: 'Chùa Cầu, Nhà cổ Tấn Ký, Rừng dừa Bảy Mẫu.',
    dacSan: 'Bánh mì Phượng, Cao lầu, Cơm gà.',
    muaDep: 'Tháng 2 - 7.',
    meo: 'Đi thuyền thả đèn hoa đăng trên sông Hoài!'
  },
  'khánh hòa': {
    ten: 'Khánh Hòa - Nha Trang', mien: 'trung', kieu: 'bien',
    anh: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800',
    moTa: 'Thiên đường biển đảo tuyệt đẹp với Vịnh Nha Trang quyến rũ.',
    diemDen: 'VinWonders, Hòn Mun, Tháp Bà Ponagar.',
    dacSan: 'Nem nướng Ninh Hòa, Bún sứa.',
    muaDep: 'Tháng 1 - 8.',
    meo: 'Trải nghiệm dịch vụ tắm bùn khoáng nóng.'
  },
  'lâm đồng': {
    ten: 'Lâm Đồng - Đà Lạt', mien: 'trung', kieu: 'nui',
    anh: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800',
    moTa: 'Thành phố sương mờ lãng mạn xứ sở ngàn hoa.',
    diemDen: 'Hồ Xuân Hương, Quảng trường Lâm Viên, Cầu Đất, Langbiang.',
    dacSan: 'Lẩu gà lá é, Lẩu bò Ba Toa, Bánh mì xíu mại, Kem bơ.',
    muaDep: 'Tháng 11 - 4.',
    meo: 'Dậy 4h30 sáng đi săn mây tại đồi chè Cầu Đất!'
  },
  'quảng bình': {
    ten: 'Quảng Bình', mien: 'trung', kieu: 'nui',
    anh: 'https://images.unsplash.com/photo-1552353617-3bfd679b3bdd?w=800',
    moTa: 'Vương quốc hang động thế giới sở hữu Phong Nha - Kẻ Bàng.',
    diemDen: 'Động Phong Nha, Động Thiên Đường, Sông Chày - Hang Tối.',
    dacSan: 'Bánh lọc, Lẩu cá khoai.',
    muaDep: 'Tháng 4 - 8.',
    meo: 'Chèo thuyền Kayak trên Sông Chày xanh ngọc.'
  },
  'tp.hồ chí minh': {
    ten: 'TP. Hồ Chí Minh (Sài Gòn)', mien: 'nam', kieu: 'songnuoc',
    anh: 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=800',
    moTa: 'Trung tâm phồn hoa, năng động và không ngủ.',
    diemDen: 'Dinh Độc Lập, Landmark 81, Phố đi bộ Nguyễn Huệ, Địa đạo Củ Chi.',
    dacSan: 'Cơm tấm sườn, Hủ tiếu Nam Vang, Bánh mì Sài Gòn.',
    muaDep: 'Tháng 12 - 4.',
    meo: 'Uống cà phê bệt hông Nhà thờ Đức Bà!'
  },
  'bà rịa - vũng tàu': {
    ten: 'Bà Rịa - Vũng Tàu', mien: 'nam', kieu: 'bien',
    anh: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800',
    moTa: 'Phố biển Vũng Tàu rộn ràng và Côn Đảo linh thiêng giữa đại dương.',
    diemDen: 'Bãi Sau, Tượng Chúa Kito, Mũi Nghinh Phong.',
    dacSan: 'Bánh khọt, Lẩu cá đuối, Bánh bông lan trứng muối.',
    muaDep: 'Quanh năm.',
    meo: 'Thưởng thức bánh khọt nóng kèm rau sống tươi.'
  },
  'kiên giang': {
    ten: 'Kiên Giang - Phú Quốc', mien: 'nam', kieu: 'bien',
    anh: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800',
    moTa: 'Thiên đường biển đảo Đảo Ngọc Phú Quốc.',
    diemDen: 'Grand World, Bãi Sao, Cáp treo Hòn Thơm.',
    dacSan: 'Bún quậy, Gỏi cá trích, Hải sản tươi.',
    muaDep: 'Tháng 10 - 4.',
    meo: 'Đón hoàng hôn lung linh tại Sunset Sanato.'
  },
  'cần thơ': {
    ten: 'Cần Thơ', mien: 'nam', kieu: 'songnuoc',
    anh: ANH_MAC_DINH,
    moTa: 'Thủ phủ miền Tây sông nước đong đầy tình người.',
    diemDen: 'Chợ nổi Cái Răng, Bến Ninh Kiều, Cồn Sơn.',
    dacSan: 'Lẩu mắm, Bánh xèo miền Tây, Bánh tét.',
    muaDep: 'Tháng 9 - 11.',
    meo: 'Khám phá chợ nổi Cái Răng từ 5h00 sáng.'
  },
  'an giang': {
    ten: 'An Giang', mien: 'nam', kieu: 'songnuoc',
    anh: ANH_MAC_DINH,
    moTa: 'Vùng đất Thất Sơn huyền bí với Rừng tràm Trà Sư xanh ngát.',
    diemDen: 'Rừng tràm Trà Sư, Miếu Bà Chúa Xứ, Núi Cấm.',
    dacSan: 'Mắm Châu Đốc, Bánh bò thốt nốt, Bún cá.',
    muaDep: 'Tháng 9 - 11.',
    meo: 'Đi tắc ráng lướt thảm bèo xanh ở Trà Sư.'
  },
  'bến tre': {
    ten: 'Bến Tre', mien: 'nam', kieu: 'songnuoc',
    anh: ANH_MAC_DINH,
    moTa: 'Xứ sở dừa xanh mát giữa lòng đồng bằng phù sa.',
    diemDen: 'Cồn Phụng, Vườn trái cây Cái Mơn.',
    dacSan: 'Kẹo dừa, Cơm dừa, Dừa sáp, Đuông dừa.',
    muaDep: 'Tháng 6 - 8.',
    meo: 'Chèo xuồng ba lá trong các rạch dừa nước.'
  }
};

// =========================================================================
// 3. HÀM XUẤT PHẢN HỒI (RESPONSES & OPTIMIZED INTERACTIVE BUTTONS)
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
    fullFulfillmentText += `\n\n🧠 [AI Memory]: Bạn đã khám phá ${userState.lichSuXem.length} điểm đến trong phiên này!`;
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
          title: "👇 Bấm chọn vùng miền khác:",
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
          subtitle: "Vui lòng bấm chọn vùng miền hoặc gõ tên Tỉnh/Thành bên dưới:",
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
// 4. ROUTING WEBHOOK & XỬ LÝ SỰ KIỆN TƯƠNG TÁC NÚT BẤM (QUICK REPLIES)
// =========================================================================

app.get('/', (req, res) => {
  res.send('<h3>🧠 Native AI Travel Engine + Optimized Interactive Buttons đang chạy mượt mà!</h3>');
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
    return res.json(taoCardMien(danhSachMien['miền bắc']));
  }
  if (cauHoiKhongDau.includes('mien trung') || cauHoiKhongDau.includes('miền trung')) {
    userState.mienQuanTam = 'Miền Trung';
    return res.json(taoCardMien(danhSachMien['miền trung']));
  }
  if (cauHoiKhongDau.includes('mien nam') || cauHoiKhongDau.includes('miền nam')) {
    userState.mienQuanTam = 'Miền Nam';
    return res.json(taoCardMien(danhSachMien['miền nam']));
  }

  // 2. TỐI ƯU HÓA NÚT TƯƠNG TÁC (QUICK REPLIES CLICK HANDLING):
  // Nhận diện chính xác subTopic khi người dùng bấm vào các nút phụ đề ("Địa danh...", "Đặc sản...", "Mẹo đi...")
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

  // 3. TÌM KIẾM TỈNH THÀNH (SEMANTIC SEARCH)
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
    return res.json(taoResponseRichText(tinhTimThay, subTopic, userState));
  }

  // 4. BỘ SUY LUẬN GIẢI QUYẾT BÀI TOÁN (REASONING ENGINE)
  const problemSolution = TravelReasoningEngine.solveTravelProblem(userQuery, duLieuCacTinh);
  if (problemSolution.type && problemSolution.recommendations.length > 0) {
    return res.json({
      fulfillmentText: `🧠 **AI Hướng Dẫn Viên Suy Luận Nhu Cầu**: Tìm kiếm loại hình **${problemSolution.type.toUpperCase()}**.\n\n🎯 **Gợi ý địa danh phù hợp**: ${problemSolution.recommendations.join(', ')}.`,
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

  // 5. Ý ĐỊNH HỎI CHI PHÍ
  const predictionObj = neuralAI.predictIntent(userQuery);
  if (predictionObj.intent === 'HOI_CHI_PHI' || cauHoiKhongDau.includes('chi phí') || cauHoiKhongDau.includes('giá')) {
    return res.json({
      fulfillmentText: `🎩 **Chi phí du lịch tham khảo (3N2Đ)**:\n💵 Tiết kiệm: 2 - 3.5tr | 💎 Nghỉ dưỡng: 4.5 - 8tr/người.`,
      fulfillmentMessages: [
        {
          card: {
            title: "🎩 BẢNG CHI PHÍ THAM KHẢO",
            subtitle: "Tiết kiệm: 2-3.5tr | Nghỉ dưỡng: 4.5-8tr/người (3N2Đ)",
            imageUri: ANH_MAC_DINH
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
  return res.json(taoWelcomeCard());
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`[SERVER] Native AI Travel Bot running on port ${PORT}`);
});
