const express = require('express');
const Fuse = require('fuse.js');

const app = express();
app.use(express.json());

// Hàm xóa dấu tiếng Việt và chuẩn hóa chuỗi
function normalizeText(str) {
  if (!str) return '';
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'd')
    .replace(/[^a-z0-9\s]/g, '')
    .trim();
}

// CƠ SỞ DỮ LIỆU TOÀN DIỆN 63 TỈNH THÀNH VIỆT NAM (BẮC - TRUNG - NAM)
const provincesData = [
  // --- MIỀN BẮC ---
  {
    name: "Thành phố Hà Nội",
    shortName: "Hà Nội",
    region: "Miền Bắc (Đồng bằng sông Hồng)",
    aliases: ["hanoi", "ha noi", "ha loi", "thu do", "thang long", "hn"],
    geography: "Nằm ở trung tâm đồng bằng sông Hồng, bờ sông Hồng mộng mơ, tiếp giáp nhiều tỉnh trung du và đồng bằng.",
    history: "Hơn 1000 năm văn hiến, khởi đầu từ mốc vua Lý Thái Tổ dời đô về Thăng Long năm 1010, trải qua bao triều đại hào hùng.",
    culture: "Văn hóa Tràng An thanh lịch, tinh tế; đậm đà nét truyền thống với làng nghề cổ, nghệ thuật ca trù, rối nước.",
    attractions: "Hồ Hoàn Kiếm, Văn Miếu Quốc Tử Giám, Hoàng thành Thăng Long, Phố cổ Hà Nội, Chùa Trấn Quốc.",
    food: "Phở Hà Nội, Bún chả, Chả cá Lăng, Bún đậu mắm tôm, Cốm làng Vòng.",
    bestTime: "Tháng 9 đến tháng 11 (Mùa thu mát mẻ, hoa sữa nồng nàn) hoặc tháng 3 - tháng 4 (Mùa xuân)."
  },
  {
    name: "Thành phố Hải Phòng",
    shortName: "Hải Phòng",
    region: "Miền Bắc (Đồng bằng sông Hồng)",
    aliases: ["hai phong", "hai phongg", "hoa phuong do", "cat ba", "dat cang"],
    geography: "Thành phố Cảng ven biển Đông Bắc, sở hữu quần đảo Cát Bà hùng vĩ và hệ thống sông ngòi dày đặc.",
    history: "Gắn liền với chiến công Bạch Đằng giang lừng lẫy của Nữ tướng Lê Chân, Ngô Quyền, Trần Hưng Đạo.",
    culture: "Văn hóa biển cả khoáng đạt, bộc trực, kiên cường; nổi tiếng với Lễ hội chọi trâu Đồ Sơn truyền thống.",
    attractions: "Đảo Cát Bà, Vịnh Lan Hạ, Biển Đồ Sơn, Tuyệt Tình Cốc, Hải đăng Hòn Dấu.",
    food: "Bánh đa cua, Bún cá cay, Bánh mì que Hải Phòng, Dừa dầm, Nem cua bể.",
    bestTime: "Tháng 4 đến tháng 10 (Thích hợp nghỉ dưỡng biển đảo và Food Tour)."
  },
  {
    name: "Tỉnh Quảng Ninh",
    shortName: "Quảng Ninh",
    region: "Miền Bắc (Đông Bắc Bộ)",
    aliases: ["quang ninh", "ha long", "vinh ha long", "yen tu", "co to"],
    geography: "Tỉnh địa đầu Đông Bắc, sở hữu kỳ quan thiên nhiên thế giới Vịnh Hạ Long và đường bờ biển dài thơ mộng.",
    history: "Vùng đất mỏ anh hùng, nơi ghi dấu chiến thắng Bạch Đằng và sự ra đời của Thiền phái Trúc Lâm Yên Tử.",
    culture: "Giao thoa giữa văn hóa biển đảo, văn hóa công nhân mỏ và tinh thần Phật giáo Thiền phái Yên Tử.",
    attractions: "Vịnh Hạ Long, Đảo Cô Tô, Quan Lạn, Danh thắng Yên Tử, Bãi Cháy, Bảo tàng Quảng Ninh.",
    food: "Chả mực Hạ Long, Sá sùng Vân Đồn, Bánh gật gù, Rượu mơ Yên Tử, Ngán biển.",
    bestTime: "Tháng 4 - 9 (Du lịch biển Hạ Long/Cô Tô), Tháng 1 - 3 âm lịch (Hành hương Yên Tử)."
  },
  {
    name: "Tỉnh Bắc Ninh",
    shortName: "Bắc Ninh",
    region: "Miền Bắc (Đồng bằng sông Hồng)",
    aliases: ["bac ninh", "kinh bac", "quan ho", "chua dau", "chua bat thap"],
    geography: "Tỉnh có diện tích nhỏ nhất Việt Nam, nằm ở cửa ngõ phía Bắc thủ đô Hà Nội.",
    history: "Vùng đất Kinh Bắc cổ kính, cội nguồn của dân tộc Việt, cái nôi của vương triều Lý hào hùng.",
    culture: "Nổi tiếng thế giới với Dân ca Quan họ Bắc Ninh (Di sản UNESCO) và làng nghề làm tranh Đông Hồ.",
    attractions: "Đền Đô, Chùa Dâu, Chùa Bút Tháp, Làng tranh Đông Hồ, Làng gốm Phù Lãng.",
    food: "Bánh phu thê Đình Bảng, Nem Bùi, Bánh đúc chim bồ câu, Trầu cau Kinh Bắc.",
    bestTime: "Tháng 1 đến tháng 3 âm lịch (Mùa lễ hội xuân Quan họ rộn ràng)."
  },
  {
    name: "Tỉnh Ninh Bình",
    shortName: "Ninh Bình",
    region: "Miền Bắc (Đồng bằng sông Hồng)",
    aliases: ["ninh binh", "trang an", "tam coc", "bai dinh", "co do hoa lu"],
    geography: "Vùng đất bán sơn địa phía Nam sông Hồng, nổi tiếng với địa hình Karst ngập nước ngoạn mục.",
    history: "Cố đô Hoa Lư - Thủ đô đầu tiên của nhà nước phong kiến tập quyền Việt Nam dưới thời Đinh, Tiền Lê.",
    culture: "Hội tụ văn hóa cố đô tâm linh, hòa quyện giữa nếp sống nông nghiệp lúa nước và đạo Phật.",
    attractions: "Quần thể danh thắng Tràng An, Tam Cốc - Bích Động, Chùa Bái Đính, Hang Múa, Cố đô Hoa Lư.",
    food: "Cơm cháy Ninh Bình, Thịt dê núi, Ốc núi, Nem chua Yên Mạc, Mắm tép Gia Viễn.",
    bestTime: "Tháng 1 - 3 (Chiêm bái lễ Phật), Tháng 5 - 6 (Mùa lúa chín vàng Tam Cốc)."
  },
  {
    name: "Tỉnh Hà Giang",
    shortName: "Hà Giang",
    region: "Miền Bắc (Đông Bắc Bộ)",
    aliases: ["ha giang", "dong van", "ma pi leng", "lung cu", "hoang su phi"],
    geography: "Tỉnh cực Bắc Tổ quốc với địa hình công viên địa chất đồi núi đá vôi uốn lượn hùng vĩ.",
    history: "Vùng đất biên cương tiền tiêu, lưu giữ cột mốc chủ quyền dân tộc và truyền thống kiên cường.",
    culture: "Đa dạng sắc màu của 22 dân tộc anh em (H'Mông, Dao, Tày...), nổi tiếng với Chợ tình Khâu Vai.",
    attractions: "Cột cờ Lũng Cú, Đèo Mã Pí Lèng, Cao nguyên đá Đồng Văn, Hoàng Su Phì, Dinh họ Vương.",
    food: "Thắng cố, Bánh tam giác mạch, Cháo tẩu tẩu, Thịt trâu gác bếp, Cam sành Hà Giang.",
    bestTime: "Tháng 9 - 10 (Mùa lúa chín Hoàng Su Phì), Tháng 10 - 12 (Mùa hoa tam giác mạch)."
  },
  {
    name: "Tỉnh Lào Cai",
    shortName: "Lào Cai (Sa Pa)",
    region: "Miền Bắc (Tây Bắc Bộ)",
    aliases: ["lao cai", "sapa", "sa pa", "fansipan", "phan xipang"],
    geography: "Tỉnh miền núi biên giới, sở hữu đỉnh Fansipan - Nóc nhà Đông Dương cao 3.143m.",
    history: "Trạm nghỉ dưỡng từ thời Pháp thuộc, điểm giao thoa thương mại biên giới Việt - Trung.",
    culture: "Đậm đà nét sinh hoạt vùng cao với Chợ tình Sa Pa, điệu xòe, tiếng khèn H'Mông, Dao đỏ.",
    attractions: "Đỉnh Fansipan, Đèo Ô Quy Hồ, Bản Cát Cát, Thung lũng Mường Hoa, Nhà thờ đá Sa Pa.",
    food: "Thịt lợn cắp nách, Thắng cố Sa Pa, Lẩu cá hồi, Mầm đá, Thịt xông khói.",
    bestTime: "Tháng 9 - 11 (Mùa lúa chín), Tháng 12 - 2 năm sau (Săn mây, săn tuyết Sa Pa)."
  },
  {
    name: "Tỉnh Cao Bằng",
    shortName: "Cao Bằng",
    region: "Miền Bắc (Đông Bắc Bộ)",
    aliases: ["cao bang", "ban gioc", "thac ban gioc", "pac bo"],
    geography: "Vùng núi cao biên giới phía Bắc với hệ thống sông hang ngầm và thác nước tuyệt đẹp.",
    history: "Căn cứ địa cách mạng lòng chảo, nơi Bác Hồ trở về nước trực tiếp lãnh đạo cách mạng năm 1941.",
    culture: "Sắc màu văn hóa Tày, Nùng phong phú với điệu Then, đàn Tính và các làng nghề đúc gặt cổ truyền.",
    attractions: "Thác Bản Giốc, Động Ngườm Ngao, Hang Pác Bó, Suối Lê Nin, Hồ Thang Hen.",
    food: "Bánh cuốn Cao Bằng, Vịt quay 7 vị, Hạt dẻ Trùng Khánh, Phở chua, Bánh trứng kiến.",
    bestTime: "Tháng 8 đến tháng 11 (Mùa thác Bản Giốc cuồn cuộn nước trong xanh nhất)."
  },
  {
    name: "Tỉnh Điện Biên",
    shortName: "Điện Biên",
    region: "Miền Bắc (Tây Bắc Bộ)",
    aliases: ["dien bien", "dien bien phu", "pha din"],
    geography: "Tỉnh miền núi biên giới Tây Bắc, có cánh đồng Mường Thanh rộng lớn nhất vùng.",
    history: "Lừng lẫy 5 châu, chấn động địa cầu với Chiến thắng Điện Biên Phủ lịch sử năm 1954.",
    culture: "Bản sắc văn hóa đặc sắc của 19 dân tộc, nổi bật với điệu múa xè Thái và lễ hội Hoa Ban.",
    attractions: "Tượng đài Chiến thắng Điện Biên Phủ, Đồi A1, Đèo Pha Đín, Cánh đồng Mường Thanh.",
    food: "Thịt trâu gác bếp, Sâu chít, Bắp nếp Mường Thanh, Cá nướng Pa Pỉnh Tộp.",
    bestTime: "Tháng 3 (Lễ hội Hoa Ban nở trắng rừng), Tháng 5 (Dịp kỷ niệm chiến thắng lịch sử)."
  },
  {
    name: "Tỉnh Sơn La",
    shortName: "Sơn La (Mộc Châu)",
    region: "Miền Bắc (Tây Bắc Bộ)",
    aliases: ["son la", "moc chau", "thung lung hoa cai", "ta xua"],
    geography: "Cao nguyên rộng lớn bao la, khí hậu quanh năm mát mẻ ôn hòa tuyệt vời.",
    history: "Nổi tiếng với Di tích lịch sử Nhà tù Sơn La - Cây đào Tô Hiệu biểu tượng cho ý chí kiên cường.",
    culture: "Không gian văn hóa Tây Bắc rực rỡ nét xòe Thái, hội ngầu hộc, làn điệu dân ca Thái, H'Mông.",
    attractions: "Cao nguyên Mộc Châu, Đồi chè Trái Tim, Thác Dải Yếm, Đỉnh Tà Xùa, Nhà tù Sơn La.",
    food: "Bê chao Mộc Châu, Cá suối nướng, Ốc đá Suối Bàng, Nộm da trâu.",
    bestTime: "Tháng 1 - 2 (Mùa hoa mận hoa đào), Tháng 10 - 12 (Mùa hoa cải, săn mây Tà Xùa)."
  },
  {
    name: "Tỉnh Hòa Bình",
    shortName: "Hòa Bình",
    region: "Miền Bắc (Tây Bắc Bộ)",
    aliases: ["hoa binh", "mai chau", "thuy dien hoa binh", "kim boi"],
    geography: "Cửa ngõ Tây Bắc, hồ thủy điện sông Đà mênh mông như biển hồ trên núi.",
    history: "Cội nguồn của \"Văn hóa Hòa Bình\" thời đại đồ đá nổi tiếng trong lịch sử nhân loại.",
    culture: "Thủ phủ của người Mường với sử thi Đẻ đất đẻ nước, tiếng cồng chiêng và nét duyên Mai Châu.",
    attractions: "Thung lũng Mai Châu, Hồ Hòa Bình, Nhà máy Thủy điện Hòa Bình, Suối khoáng Kim Bôi.",
    food: "Cơm lam Mai Châu, Lợn mán thui luộc, Cá sông Đà nướng lá chuối, Rượu cần Mường.",
    bestTime: "Tháng 10 đến tháng 4 (Thời tiết mát mẻ, dạo lòng hồ và nghỉ dưỡng Kim Bôi)."
  },
  {
    name: "Tỉnh Hà Nam",
    shortName: "Hà Nam",
    region: "Miền Bắc (Đồng bằng sông Hồng)",
    aliases: ["ha nam", "chua tam chuc", "phu ly", "nam cao"],
    geography: "Vùng đất nằm ở phía Nam cửa ngõ Thủ đô, địa hình dải đồi núi thấp xen kẽ đồng bằng.",
    history: "Quê hương văn học của cố nhà văn Nam Cao với những địa danh đi vào lịch sử văn học.",
    culture: "Đại diện cho văn hóa làng xã đồng bằng Bắc Bộ, truyền thống chèo cổ và lễ hội Tích điền.",
    attractions: "Khu du lịch tâm linh Tam Chúc, Chùa Địa Tạng Phi Lai Tự, Hang Luồn, Đền Trần Thương.",
    food: "Bánh cuốn Phủ Lý, Cá kho Vũ Đại, Hồng nhân hậu Lý Nhân, Chuối ngự Đại Hoàng.",
    bestTime: "Tháng 1 đến tháng 3 (Chiêm bái lễ Phật đầu xuân tại Tam Chúc, Địa Tạng Phi Lai)."
  },
  {
    name: "Tỉnh Hải Dương",
    shortName: "Hải Dương",
    region: "Miền Bắc (Đồng bằng sông Hồng)",
    aliases: ["hai duong", "con son kiep bac", "thanh ha", "chi linh"],
    geography: "Nằm ở trung tâm vùng kinh tế trọng điểm Bắc Bộ, đất đai trù phú phù sa.",
    history: "Vùng đất địa linh nhân kiệt, nơi gắn liền với Anh hùng dân tộc Trần Hưng Đạo và Danh nhân Nguyễn Trãi.",
    culture: "Nôi văn hóa xứ Đông, quê hương rối nước Hồng Phong và những di tích lịch sử đặc biệt.",
    attractions: "Khu danh thắng Côn Sơn - Kiếp Bạc, Đảo Cò Chi Lăng Nam, Chùa Thanh Mai.",
    food: "Bánh đậu xanh Hải Dương, Bánh gai Ninh Giang, Vải thiều Thanh Hà, Bún cá rô đồng.",
    bestTime: "Tháng 5 - 6 (Mùa vải thiều chín đỏ Thanh Hà), Tháng 8 âm lịch (Lễ hội Côn Sơn Kiếp Bạc)."
  },
  {
    name: "Tỉnh Hưng Yên",
    shortName: "Hưng Yên",
    region: "Miền Bắc (Đồng bằng sông Hồng)",
    aliases: ["hung yen", "pho hien", "nhan long"],
    geography: "Nằm ở trải dài bờ tả ngạn sông Hồng, đất đai phù sa màu mỡ bậc nhất.",
    history: "Nổi tiếng thương cảng \"Thứ nhất Kinh Kỳ, thứ nhì Phố Hiến\" sầm uất thế kỷ 16-17.",
    culture: "Mang đậm nét văn hóa sông Hồng với vô số ngôi đền cổ kính và đặc sản Nhãn lồng tiến vua.",
    attractions: "Phố Hiến cổ, Đền Mẫu Hưng Yên, Chùa Nôm, Làng cổ Đông Tảo.",
    food: "Nhãn lồng Hưng Yên, Bún thang lợn Phố Hiến, Gà Đông Tảo, Ếch om Phượng Tường.",
    bestTime: "Tháng 7 đến tháng 8 (Mùa nhãn lồng chín rộ thơm ngát cả vùng đất)."
  },
  {
    name: "Tỉnh Nam Định",
    shortName: "Nam Định",
    region: "Miền Bắc (Đồng bằng sông Hồng)",
    aliases: ["nam dinh", "den tran", "quat lam", "pho bo nam dinh"],
    geography: "Tỉnh ven biển đồng bằng sông Hồng với mạng lưới sông ngòi trù phú.",
    history: "Đất phát tích của Vương triều Trần lừng lẫy 3 lần đánh thắng quân Nguyên Mông.",
    culture: "Trung tâm Công giáo lớn nhất miền Bắc với kiến trúc nhà thờ cổ kính và Lễ khai ấn Đền Trần.",
    attractions: "Đền Trần, Nhà thờ đổ Văn Lý, Chùa Cổ Lễ, Biển Quất Lâm, Vườn quốc gia Xuân Thủy.",
    food: "Phở bò Nam Định, Bánh xíu báo, Nem nắm Giao Thủy, Bánh gai Bà Thi.",
    bestTime: "Đêm rằm tháng Giêng (Lễ khai ấn Đền Trần) hoặc mùa hè du lịch biển."
  },
  {
    name: "Tỉnh Thái Bình",
    shortName: "Thái Bình",
    region: "Miền Bắc (Đồng bằng sông Hồng)",
    aliases: ["thai binh", "chua keo", "que lua", "dong chau"],
    geography: "Được bao bọc bởi 3 mặt sông lớn và biển Đông, được mệnh danh là \"Quê hương 5 tấn\".",
    history: "Vùng đất gắn liền với công cuộc khai hoang lập ấp của Doanh điền sứ Nguyễn Công Trứ.",
    culture: "Cradle của nghệ thuật hát Chèo cổ, múa rối nước và ngôi chùa Keo cổ kính độc đáo.",
    attractions: "Chùa Keo, Biển Đồng Châu, Cồn Vần, Làng vườn Bách Thuận.",
    food: "Bánh cáy Thái Bình, Canh cá quỳnh cừ, Bún bung hoa chuối, Ổi bo Thái Bình.",
    bestTime: "Tháng 9 đến tháng 11 (Lễ hội Chùa Keo và ngắm mùa lúa vàng rực)."
  },
  {
    name: "Tỉnh Vĩnh Phúc",
    shortName: "Vĩnh Phúc",
    region: "Miền Bắc (Đồng bằng sông Hồng)",
    aliases: ["vinh phuc", "tam dao", "tay thien", "dai lai"],
    geography: "Chuyển tiếp giữa trung du miền núi và đồng bằng, khí hậu Tam Đảo mát mẻ tuyệt diệu.",
    history: "Nơi gắn liền với khởi nghĩa Hai Bà Trưng và danh thắng tâm linh Phật giáo Tây Thiên.",
    culture: "Giao thoa văn hóa giữa miền núi và miền xuôi, đậm đà tín ngưỡng thờ Quốc mẫu Tây Thiên.",
    attractions: "Thị trấn Tam Đảo, Thiền viện Trúc Lâm Tây Thiên, Hồ Đại Lải, Tháp Bình Sơn.",
    food: "Ngọn su su Tam Đảo, Cá thính Lập Thạch, Dứa Tam Dương, Tép dầu Hồ Xạ Hương.",
    bestTime: "Quanh năm (Tam Đảo khí hậu 4 mùa trong 1 ngày vô cùng dễ chịu)."
  },
  {
    name: "Tỉnh Bắc Kạn",
    shortName: "Bắc Kạn",
    region: "Miền Bắc (Đông Bắc Bộ)",
    aliases: ["bac kan", "ho ba be", "atk cho don"],
    geography: "Địa hình núi cao, sở hữu Hồ Ba Bể - một trong 20 hồ nước ngọt tự nhiên lớn nhất thế giới.",
    history: "Căn cứ địa cách mạng ATK Chợ Đồn trong thời kỳ kháng chiến chống Pháp.",
    culture: "Địa bàn sinh sống lâu đời của người Tày, Nùng, H'Mông với nét văn hóa hồ thiên nhiên kỳ thú.",
    attractions: "Hồ Ba Bể, Động Puông, Thác Đầu Đẳng, Động Hua Mạ, ATK Chợ Đồn.",
    food: "Cá nướng Hồ Ba Bể, Miến đao Tráng Liệt, Tôm chua Ba Bể, Lạp xưởng hun khói.",
    bestTime: "Tháng 8 đến tháng 11 (Nước hồ Ba Bể đầy trong xanh, khí hậu mát mẻ)."
  },
  {
    name: "Tỉnh Tuyên Quang",
    shortName: "Tuyên Quang",
    region: "Miền Bắc (Đông Bắc Bộ)",
    aliases: ["tuyen quang", "tan trao", "na hang", "thu do khu giaiphong"],
    geography: "Nằm ở trung tâm vùng Đông Bắc, sở hữu lòng hồ Na Hang mệnh danh Hạ Long trên núi.",
    history: "Thủ đô Khu giải phóng, Thủ đô Kháng chiến gắn với Lán Nà Nưa, Cây đa Tân Trào.",
    culture: "Đặc sắc với Lễ hội Thành Tuyên (Mô hình Trung thu lớn nhất Việt Nam) và hát Páo dung.",
    attractions: "Khu di tích Tân Trào, Hồ sinh thái Na Hang, Thác Mơ, Suối khoáng Mỹ Lâm.",
    food: "Bánh gai Chiêm Hóa, Mắm cá ruộng, Cam sành Hàm Yên, Thịt lợn tên tên.",
    bestTime: "Tháng 8 - 9 âm lịch (Dịp Lễ hội Trung thu Thành Tuyên rực rỡ phố phường)."
  },
  {
    name: "Tỉnh Thái Nguyên",
    shortName: "Thái Nguyên",
    region: "Miền Bắc (Đông Bắc Bộ)",
    aliases: ["thai nguyen", "ho nui coc", "de nhat danh trà", "tan cuong"],
    geography: "Trung tâm cửa ngõ miền núi phía Bắc, nổi tiếng với đồi chè Tân Cương xanh mút mắt.",
    history: "Thủ đô kháng chiến ATK Định Hóa, trung tâm luyện kim và giáo dục lớn thứ 3 cả nước.",
    culture: "Văn hóa trà đượm tình người, gắn liền với huyền thoại Hồ Núi Cốc Chàng Cốc - Nàng Công.",
    attractions: "Hồ Núi Cốc, Đồi chè Tân Cương, ATK Định Hóa, Bảo tàng Văn hóa các dân tộc Việt Nam.",
    food: "Trà Tân Cương, Trám đen Hà Châu, Bánh chưng Bờ Đậu, Cơm lam Định Hóa.",
    bestTime: "Tháng 8 đến tháng 10 (Mùa hái chè xanh mát và cảnh hồ đẹp nhất)."
  },
  {
    name: "Tỉnh Lạng Sơn",
    shortName: "Lạng Sơn",
    region: "Miền Bắc (Đông Bắc Bộ)",
    aliases: ["lang son", "mau son", "dong tam thanh", "ai chi lang"],
    geography: "Tỉnh biên giới Đông Bắc, địa hình núi đá vôi uốn lượn và khí hậu Mẫu Sơn lạnh giá.",
    history: "Vùng đất ải Chi Lăng lừng lẫy đánh tan bao quân xâm lược phương Bắc.",
    culture: "Sầm uất thương mại biên giới, văn hóa xứ Lạng với chợ Kỳ Lừa, phố Kỳ Lừa thơ mộng.",
    attractions: "Đỉnh Mẫu Sơn, Động Tam Thanh, Ải Chi Lăng, Chợ Kỳ Lừa, Thành Nhà Mạc.",
    food: "Vịt quay Lạng Sơn, Khâu nhục, Bánh áp chao, Phở chua Lạng Sơn, Na Chi Lăng.",
    bestTime: "Tháng 12 - 2 (Ngắm tuyết rơi Mẫu Sơn) hoặc Mùa hè đi lễ đền chùa."
  },
  {
    name: "Tỉnh Bắc Giang",
    shortName: "Bắc Giang",
    region: "Miền Bắc (Đông Bắc Bộ)",
    aliases: ["bac giang", "tay yen tu", "luc ngan", "vai thieu"],
    geography: "Nằm trên hành lang kinh tế Đông Bắc, địa hình chuyển tiếp đồng bằng và miền núi.",
    history: "Gắn liền với chiến thắng Xương Giang lịch sử và Phật giáo Trúc Lâm Tây Yên Tử.",
    culture: "Vùng đất Quan họ phía Bắc sông Cầu và vùng trồng cây ăn quả danh tiếng.",
    attractions: "Khu du lịch Tây Yên Tử, Chùa Vĩnh Nghiêm, Đồng Cao, Hồ Cấm Sơn.",
    food: "Vải thiều Lục Ngạn, Bánh đa Kế, Chè kho Mỹ Độ, Mỳ Chũ.",
    bestTime: "Tháng 6 - 7 (Mùa vải thiều Lục Ngạn chín đỏ rực mút tầm mắt)."
  },
  {
    name: "Tỉnh Phú Thọ",
    shortName: "Phú Thọ",
    region: "Miền Bắc (Đông Bắc Bộ)",
    aliases: ["phu tho", "den hung", "phong chau", "dat to"],
    geography: "Nơi hợp lưu của 3 dòng sông lớn: Sông Hồng, Sông Lô, Sông Đà.",
    history: "Đất Tổ Hùng Vương, thủ đô Phong Châu cổ đại - cội nguồn của dân tộc Việt Nam.",
    culture: "Di sản Hát Xoan Phú Thọ và Tín ngưỡng thờ cúng Hùng Vương được UNESCO vinh danh.",
    attractions: "Khu di tích lịch sử Đền Hùng, Vườn quốc gia Xuân Sơn, Đồi chè Long Cốc.",
    food: "Thịt chua Thanh Sơn, Bánh hòn Hùng Lo, Cọ om Phú Thọ, Rêu đá Thanh Sơn.",
    bestTime: "Mùng 10 tháng 3 âm lịch (Giỗ tổ Hùng Vương - Trở về cội nguồn)."
  },
  {
    name: "Tỉnh Lai Châu",
    shortName: "Lai Châu",
    region: "Miền Bắc (Tây Bắc Bộ)",
    aliases: ["lai chau", "sin ho", "putaleng", "sin ho"],
    geography: "Tỉnh biên giới Tây Bắc có địa hình hiểm trở với những đỉnh núi cao vút mây trời.",
    history: "Lịch sử gắn liền với biên cương Tổ quốc và truyền thống đoàn kết các dân tộc thiểu số.",
    culture: "Nơi sinh sống của 20 dân tộc với những phiên chợ lùi huyền bí và nghề dệt thổ cẩm.",
    attractions: "Cao nguyên Sìn Hồ, Đèo Ô Quy Hồ, Đỉnh Pu Ta Leng, Đỉnh Bạch Mộc Lương Tử.",
    food: "Lợn cắp nách, Pa pỉnh tộp, Rượu ngô Sìn Hồ, Măng đắng Lai Châu.",
    bestTime: "Tháng 9 đến tháng 11 (Mùa săn mây, dã quỳ nở và leo núi chinh phục đỉnh cao)."
  },
  {
    name: "Tỉnh Yên Bái",
    shortName: "Yên Bái",
    region: "Miền Bắc (Tây Bắc Bộ)",
    aliases: ["yen bai", "mu cang chai", "thac ba", "tram tau"],
    geography: "Nằm ở trung điểm Tây Bắc, sở hữu ruộng bậc thang danh thắng Mù Cang Chải.",
    history: "Nổi tiếng với Khởi nghĩa Yên Bái anh hùng của nhà cách mạng Nguyễn Thái Học.",
    culture: "Bản sắc văn hóa Thái, H'Mông, Tày với nghệ thuật xòe Thái di sản nhân loại.",
    attractions: "Ruộng bậc thang Mù Cang Chải, Hồ Thác Bà, Suối khoáng nóng Trạm Tấu, Đèo Khau Phạ.",
    food: "Nếp Tú Lệ, Lạp xưởng Mường Lo, Trà Shan Tuyết Suối Giàng, Muỗm rang.",
    bestTime: "Tháng 9 - 10 (Mùa vàng rực rỡ danh thắng Ruộng bậc thang Mù Cang Chải)."
  },

  // --- MIỀN TRUNG ---
  {
    name: "Thành phố Đà Nẵng",
    shortName: "Đà Nẵng",
    region: "Miền Trung (Duyên hải Nam Trung Bộ)",
    aliases: ["da nang", "da nangg", "ba na hills", "cau vang", "thanh pho dang song"],
    geography: "Nằm ở trung độ Việt Nam, có cảng biển nước sâu, sông Hàn chảy qua lòng thành phố.",
    history: "Từ làng chài cổ trở thành thành phố cảng chiến lược và đô thị đáng sống bậc nhất.",
    culture: "Văn hóa biển giao thoa hiện đại, văn minh, mến khách và Lễ hội pháo hoa quốc tế.",
    attractions: "Bà Nà Hills (Cầu Vàng), Ngũ Hành Sơn, Biển Mỹ Khê, Bán đảo Sơn Trà, Cầu Rồng.",
    food: "Mì Quảng, Bánh tráng cuốn thịt heo, Bún chả cá Đà Nẵng, Bánh xèo, Hải sản.",
    bestTime: "Tháng 4 đến tháng 8 (Thời tiết nắng đẹp, biển êm, không mưa)."
  },
  {
    name: "Tỉnh Thừa Thiên Huế",
    shortName: "Thừa Thiên Huế",
    region: "Miền Trung (Bắc Trung Bộ)",
    aliases: ["hue", "thua thien hue", "co do hue", "song huong", "chua thien mu"],
    geography: "Dải đất duyên hải hẹp, dựa lưng vào dãy Trường Sơn, sông Hương uốn lượn hiền hòa.",
    history: "Thủ đô của Việt Nam thời triều Nguyễn (1802 - 1945), nơi lưu giữ kho tàng di sản đồ sộ.",
    culture: "Văn hóa Cung đình tinh tế, Nhã nhạc cung đình Huế (UNESCO) và ẩm thực mạ Huế quyến rũ.",
    attractions: "Đại Nội Huế, Chùa Thiên Mụ, Lăng Khải Định, Lăng Tự Đức, Sông Hương, Cầu Tràng Tiền.",
    food: "Bún bò Huế, Bánh bèo - nậm - lọc, Cơm hến, Chè Cung đình Huế, Bánh khoái.",
    bestTime: "Tháng 1 đến tháng 4 (Thời tiết mát mẻ, dễ chịu, thơ mộng nhất)."
  },
  {
    name: "Tỉnh Quảng Nam",
    shortName: "Quảng Nam (Hội An)",
    region: "Miền Trung (Duyên hải Nam Trung Bộ)",
    aliases: ["quang nam", "hoi an", "pho co hoi an", "my son"],
    geography: "Trải dài từ núi cao Trường Sơn ra biển Đông, sở hữu 2 di sản thế giới.",
    history: "Thương cảng quốc tế Faifo sầm uất thế kỷ 16-17 và trung tâm văn hóa Chăm Pa cổ.",
    culture: "Đèn lồng Hội An, bài chồi Trung Bộ, văn hóa giao thoa Việt - Hoa - Nhật - Tây Phương.",
    attractions: "Phố cổ Hội An, Thánh địa Mỹ Sơn, Đảo Cù Lao Chàm, Biển An Bàng, VinWonders.",
    food: "Cao lầu Hội An, Mì Quảng, Bánh mì Phượng, Cơm gà Hội An, Bánh đập hến xào.",
    bestTime: "Tháng 2 đến tháng 7 (Mùa khô, nắng đẹp, lồng đèn lung linh)."
  },
  {
    name: "Tỉnh Khánh Hòa",
    shortName: "Khánh Hòa (Nha Trang)",
    region: "Miền Trung (Duyên hải Nam Trung Bộ)",
    aliases: ["khanh hoa", "nha trang", "vinwonders", "dao binh ba"],
    geography: "Sở hữu bờ biển dài và hàng trăm đảo lớn nhỏ, Vịnh Nha Trang đẹp top thế giới.",
    history: "Vùng đất Xứ Trầm Hương giàu truyền thống lịch sử Chăm Pa và bảo tồn biển.",
    culture: "Văn hóa biển đảo sôi động, tín ngưỡng thờ Tháp Bà Ponagar linh thiêng.",
    attractions: "VinWonders Nha Trang, Đảo Bình Ba, Đảo Điệp Sơn, Tháp Bà Ponagar, Vịnh Vân Phong.",
    food: "Bún chả cá Nha Trang, Nem nướng Ninh Hòa, Bánh căn hải sản, Yến sào Khánh Hòa.",
    bestTime: "Tháng 1 đến tháng 8 (Mùa khô rực rỡ, nước biển trong xanh như ngọc)."
  },
  {
    name: "Tỉnh Lâm Đồng",
    shortName: "Lâm Đồng (Đà Lạt)",
    region: "Miền Trung (Tây Nguyên)",
    aliases: ["lam dong", "da lat", "dalat", "thanh pho ngan hoa"],
    geography: "Nằm trên cao nguyên Langbiang, độ cao 1.500m, khí hậu ôn đới quanh năm se lạnh.",
    history: "Được bác sĩ Alexandre Yersin phát hiện năm 1893, người Pháp quy hoạch thành quy trình nghỉ dưỡng.",
    culture: "Văn hóa lãng mạn, thanh lịch của người Đà Lạt kết hợp Không gian văn hóa Cồng chiêng Tây Nguyên.",
    attractions: "Hồ Xuân Hương, Đỉnh Langbiang, Thung lũng Tình Yêu, Chợ đêm Đà Lạt, Đồi chè Cầu Đất.",
    food: "Bánh mì xíu mại, Lẩu gà lá é, Bánh căn Đà Lạt, Kem bơ, Bánh tráng nướng.",
    bestTime: "Tháng 11 đến tháng 3 (Mùa hoa dã quỳ, mai anh đào, thời tiết se lạnh tuyệt vời)."
  },
  {
    name: "Tỉnh Thanh Hóa",
    shortName: "Thanh Hóa",
    region: "Miền Trung (Bắc Trung Bộ)",
    aliases: ["thanh hoa", "sam son", "thanh nha ho", "pu luong"],
    geography: "Tỉnh quy mô lớn phía Bắc Trung Bộ, địa hình đa dạng từ biển khơi đến núi cao Pù Luông.",
    history: "Đất vương hội - Quê hương của nhiều vị vua chúa (Lê Lợi, Hồ Quý Ly) và khởi nghĩa Lam Sơn.",
    culture: "Nôi Đông Sơn rực rỡ với Trống đồng Đông Sơn, điệu hò sông Mã anh hùng.",
    attractions: "Biển Sầm Sơn, Khu bảo tồn Pù Luông, Thành nhà Hồ, Biển Hải Tiến, Suối cá thần.",
    food: "Nem chua Thanh Hóa, Chả tôm, Bánh răng bừa, Mắm tép Ba Làng, Bánh gai Tứ Trụ.",
    bestTime: "Tháng 5 - 8 (Tắm biển Sầm Sơn và ngắm mùa lúa vàng Pù Luông)."
  },
  {
    name: "Tỉnh Nghệ An",
    shortName: "Nghệ An",
    region: "Miền Trung (Bắc Trung Bộ)",
    aliases: ["nghe an", "cua lo", "que bac", "nam dan"],
    geography: "Tỉnh có diện tích lớn nhất Việt Nam, stretching từ núi cao biên giới đến biển Cửa Lò.",
    history: "Quê hương của Chủ tịch Hồ Chí Minh vĩ đại và nhiều danh nhân chí sĩ yêu nước.",
    culture: "Ví Giặm Nghệ Tĩnh (Di sản UNESCO), tinh thần hiếu học và chí khí kiên cường.",
    attractions: "Biển Cửa Lò, Khu di tích Kim Liên (Quê Bác), Đồi chè Thanh Chương, Đảo Chè.",
    food: "Súp lươn Nghệ An, Bánh mướt, Nhút Thanh Chương, Tương Nam Đàn, Cam Xã Đoài.",
    bestTime: "Tháng 6 đến tháng 8 (Tắm biển Cửa Lò và thăm quê Bác)."
  },
  {
    name: "Tỉnh Hà Tĩnh",
    shortName: "Hà Tĩnh",
    region: "Miền Trung (Bắc Trung Bộ)",
    aliases: ["ha tinh", "dong loc", "thien cam"],
    geography: "Nằm dưới chân dãy Hoành Sơn, biển Thiên Cầm xanh ngát thơ mộng.",
    history: "Ghi dấu lịch sử anh hùng với Ngã ba Đồng Lộc - biểu tượng bất tử của thanh niên xung phong.",
    culture: "Quê hương Đại thi hào Nguyễn Du (Truyện Kiều) và điệu hát Ví Giặm mặn mòi.",
    attractions: "Ngã ba Đồng Lộc, Biển Thiên Cầm, Hồ Kẻ Gỗ, Chùa Hương Tích Hà Tĩnh.",
    food: "Kẹo cu đơ, Bánh tày, Gỏi cá đục, Mực nhảy Vũng Áng, Ram bánh mướt.",
    bestTime: "Tháng 4 đến tháng 8 (Nắng đẹp, tắm biển Thiên Cầm tuyệt vời)."
  },
  {
    name: "Tỉnh Quảng Bình",
    shortName: "Quảng Bình",
    region: "Miền Trung (Bắc Trung Bộ)",
    aliases: ["quang binh", "phong nha", "phong nha ke bang", "son doong"],
    geography: "Nơi hẹp nhất Việt Nam theo chiều Đông - Tây, vương quốc hang động thế giới.",
    history: "Vùng đất giao thoa văn hóa Đại Việt và Chăm Pa, nơi ghi dấu Lũy Thầy lịch sử.",
    culture: "Văn hóa tâm linh gắn liền với Đại tướng Võ Nguyên Giáp và huyền thoại hang động.",
    attractions: "Vườn quốc gia Phong Nha - Kẻ Bàng, Hang Sơn Đoòng, Động Thiên Đường, Biển Nhật Lệ.",
    food: "Cháo canh Quảng Bình, Bánh lọc, Đẻn biển, Bánh khoái Quảng Bình.",
    bestTime: "Tháng 4 đến tháng 8 (Mùa khô nắng ráo, lý tưởng nhất để khám phá hang động)."
  },
  {
    name: "Tỉnh Quảng Trị",
    shortName: "Quảng Trị",
    region: "Miền Trung (Bắc Trung Bộ)",
    aliases: ["quang tri", "thanh co quang tri", "vinh moc", "con co"],
    geography: "Nằm ở giao điểm Bắc - Nam, sở hữu sông Bến Hải và Cầu Hiền Lương vĩ tuyến 17.",
    history: "Vùng đất lửa anh hùng, nơi diễn ra cuộc chiến 81 ngày đêm bảo vệ Thành cổ Quảng Trị.",
    culture: "Văn hóa tri ân, hòa bình và tưởng niệm lịch sử vô cùng sâu sắc.",
    attractions: "Thành cổ Quảng Trị, Địa đạo Vĩnh Mốc, Cầu Hiền Lương - Sông Bến Hải, Đảo Cồn Cỏ.",
    food: "Thịt trâu lá trơảng, Bánh lọc Mỹ Chánh, Bún hến Mai Xá, Cháo vạt giường.",
    bestTime: "Tháng 4 đến tháng 7 (Thời tiết thích hợp hành hương tri ân lịch sử)."
  },
  {
    name: "Tỉnh Quảng Ngãi",
    shortName: "Quảng Ngãi",
    region: "Miền Trung (Duyên hải Nam Trung Bộ)",
    aliases: ["quang ngai", "ly son", "dao ly son"],
    geography: "Duyên hải dốc từ núi ra biển, sở hữu đảo núi lửa cổ Lý Sơn giữa biển khơi.",
    history: "Quê hương Đội hùng binh Hoàng Sa từng cắm mốc chủ quyền biển đảo từ nhiều thế kỷ trước.",
    culture: "Văn hóa Sa Huỳnh cổ đại và Lễ khao thề thế tháp hải đội Hoàng Sa linh thiêng.",
    attractions: "Đảo Lý Sơn, Biển Mỹ Khê (Quảng Ngãi), Ba Làng An, Khu chứng tích Sơn Mỹ.",
    food: "Tỏi Lý Sơn, Don Quảng Ngãi, Bánh đập, Kẹo gương, Bún cá ngừ.",
    bestTime: "Tháng 5 đến tháng 8 (Biển êm, mây xanh, hoàn hảo để đi đảo Lý Sơn)."
  },
  {
    name: "Tỉnh Bình Định",
    shortName: "Bình Định (Quy Nhơn)",
    region: "Miền Trung (Duyên hải Nam Trung Bộ)",
    aliases: ["binh dinh", "quy nhon", "ky co", "eo gio"],
    geography: "Bờ biển nhiều vũng vịnh, bán đảo đẹp ngoạn mục với Kỳ Co, Eo Gió.",
    history: "Đất võ Tây Sơn - Quê hương Anh hùng áo vải Quang Trung Nguyễn Huệ.",
    culture: "Văn hóa Đất Võ, hát Bội, nghệ thuật Bài chồi và cụm tháp Chăm cổ kính độc đáo.",
    attractions: "Eo Gió, Kỳ Co, Tháp Đôi, Bãi Trung Lương, Ghềnh Ráng Tiên Sa.",
    food: "Bánh xèo tôm nhảy, Bún chả cá Quy Nhơn, Tré Bình Định, Bánh hỏi lòng heo.",
    bestTime: "Tháng 3 đến tháng 9 (Trời nắng xanh, nước biển Kỳ Co trong vắt)."
  },
  {
    name: "Tỉnh Phú Yên",
    shortName: "Phú Yên",
    region: "Miền Trung (Duyên hải Nam Trung Bộ)",
    aliases: ["phu yen", "ghenh da dia", "tuy hoa", "hoa vang tren co xanh"],
    geography: "Sở hữu Ghềnh Đá Đĩa độc nhất vô nhị và Mũi Điện - Nơi đón bình minh đầu tiên trên đất liền.",
    history: "Gắn liền với công cuộc mở cõi phía Nam của Lương Văn Chánh thế kỷ 16.",
    culture: "Vùng đất \"Tôi thấy hoa vàng trên cỏ xanh\" bình yên với đàn đá Tuy An cổ xưa.",
    attractions: "Ghềnh Đá Đĩa, Mũi Điện (Hải đăng Đại Lãnh), Bãi Xép, Tháp Nghinh Phong, Hồ Ô Loan.",
    food: "Mắt cá ngừ đại dương, Bánh hỏi lòng heo, Sò huyết đầm Ô Loan, Cơm gà Phú Yên.",
    bestTime: "Tháng 3 đến tháng 8 (Nắng đẹp, cảnh quan thiên nhiên nguyên sơ tươi mát)."
  },
  {
    name: "Tỉnh Ninh Thuận",
    shortName: "Ninh Thuận",
    region: "Miền Trung (Duyên hải Nam Trung Bộ)",
    aliases: ["ninh thuan", "phan rang", "vinh hy", "cham"],
    geography: "Vùng đất tiểu khí hậu sa mạc khô hạn nhất Việt Nam, sở hữu Vịnh Vĩnh Hy xanh biếc.",
    history: "Trung tâm lưu giữ lâu đời văn hóa Vương quốc Chăm Pa cổ đại.",
    culture: "Lễ hội Katê rực rỡ sắc màu người Chăm, làng gốm Bàu Trúc, làng dệt Mỹ Nghiệp.",
    attractions: "Vịnh Vĩnh Hy, Tháp Po Klong Garai, Đồi cát Nam Cương, Đồng cừu An Hòa.",
    food: "Nho Phan Rang, Thịt cừu - thịt dê, Bánh căn - bánh xèo Phan Rang, Bún mắm nêm.",
    bestTime: "Tháng 8 - 10 (Mùa nho chín mọng ngọt lịm và trúng dịp Lễ hội Katê)."
  },
  {
    name: "Tỉnh Bình Thuận",
    shortName: "Bình Thuận (Phan Thiết)",
    region: "Miền Trung (Duyên hải Nam Trung Bộ)",
    aliases: ["binh thuan", "phan thiet", "muine", "mui ne", "phu quy"],
    geography: "Nổi tiếng với đồi cát bay trập trùng Mũi Né và đảo Phú Quý giữa đại dương.",
    history: "Nơi Bác Hồ từng dừng chân dạy học tại Trường Dục Thanh trước khi ra đi tìm đường cứu nước.",
    culture: "Sự kết hợp giữa nét sinh hoạt làng chài ven biển và nét đặc sắc Chăm Pa.",
    attractions: "Mũi Né, Đồi Cát Bay, Đảo Phú Quý, Bãi đá Cổ Thạch, Hải đăng Ke Ga.",
    food: "Thanh long Bình Thuận, Lẩu thả Mũi Né, Bánh căn Phan Thiết, Chả giụi, Mực một nắng.",
    bestTime: "Tháng 10 đến tháng 4 (Nghỉ dưỡng Mũi Né), Tháng 3 đến 7 (Khám phá Đảo Phú Quý)."
  },
  {
    name: "Tỉnh Kon Tum",
    shortName: "Kon Tum",
    region: "Miền Trung (Tây Nguyên)",
    aliases: ["kon tum", "mang den", "nha tho go"],
    geography: "Tỉnh cực Bắc Tây Nguyên, sở hữu thiên đường sinh thái Măng Đen mát lạnh.",
    history: "Trận chiến Ngục Kon Tum anh hùng và lịch sử truyền đạo Công giáo lâu đời.",
    culture: "Bản sắc Bahnar, Jrai với Nhà Rông cao vút, tiếng cồng chiêng và điệu xoang.",
    attractions: "Thị trấn Măng Đen, Nhà thờ gỗ Kon Tum, Cầu treo Kon Klor, Tòa Giám Mục.",
    food: "Gỏi lá Kon Tum, Cơm lam gà nướng Măng Đen, Cá gật gù, Rượu sim Măng Đen.",
    bestTime: "Tháng 10 đến tháng 12 (Mùa dã quỳ nở vàng và ngắm hoa mai anh đào Măng Đen)."
  },
  {
    name: "Tỉnh Gia Lai",
    shortName: "Gia Lai",
    region: "Miền Trung (Tây Nguyên)",
    aliases: ["gia lai", "pleiku", "bien ho", "chur dang ya"],
    geography: "Cao nguyên Pleiku đất đỏ bazan bao la, sở hữu Biển Hồ T'Nưng (Đôi mắt Pleiku).",
    history: "Chiến công Đường 19, Chiến dịch Tây Nguyên mở màn giải phóng miền Nam 1975.",
    culture: "Đậm chất Không gian văn hóa Cồng chiêng Tây Nguyên và lễ hội bỏ mả đặc trưng.",
    attractions: "Biển Hồ T'Nưng, Núi lửa Chư Đăng Ya, Chùa Minh Thành, Thác Phú Cường.",
    food: "Phở hai tô (Phở khô Gia Lai), Bún mắm cua, Muối kiến vàng, Cà phê Pleiku.",
    bestTime: "Tháng 11 đến tháng 2 năm sau (Mùa hoa dã quỳ và hoa cà phê nở trắng rừng)."
  },
  {
    name: "Tỉnh Đắk Lắk",
    shortName: "Đắk Lắk",
    region: "Miền Trung (Tây Nguyên)",
    aliases: ["dak lak", "dac lac", "buon ma thuot", "bmt", "buon don"],
    geography: "Trung tâm thủ phủ Tây Nguyên, vùng đất bazan màu mỡ.",
    history: "Thủ phủ Cà phê Việt Nam, nơi khởi đầu Chiến dịch Tây Nguyên lịch sử năm 1975.",
    culture: "Huyền thoại Voi Buôn Đôn, văn hóa Ê-đê mẫu hệ với những ngôi nhà dài truyền thống.",
    attractions: "Bảo tàng Cà phê Buôn Ma Thuột, Buôn Đôn, Hồ Lắk, Thác Dray Nur, Thác Dray Sap.",
    food: "Cà phê Buôn Ma Thuột, Bún đỏ, Lẩu rau rừng, Gà sa lửa Buôn Đôn.",
    bestTime: "Tháng 12 đến tháng 3 (Thời tiết khô ráo, hoa cà phê nở trắng xóa núi rừng)."
  },
  {
    name: "Tỉnh Đắk Nông",
    shortName: "Đắk Nông",
    region: "Miền Trung (Tây Nguyên)",
    aliases: ["dak nong", "dac nong", "ta dung"],
    geography: "Sở hữu Công viên địa chất toàn cầu UNESCO và Hồ Tà Đùng - Hạ Long trên Tây Nguyên.",
    history: "Căn cứ kháng chiến N'Trăng Lơng anh hùng chống thực dân Pháp.",
    culture: "Sắc màu văn hóa M'Nông, lưu giữ bộ đàn đá cổ xưa nhất nhân loại.",
    attractions: "Hồ Tà Đùng, Thác Liêng Nung, Hang động núi lửa Krông Nô, Thác Đray Sáp.",
    food: "Rượu cần Đắk Nông, Cơm lam, Bơ sáp Đắk Nông, Cá lăng sông Sêrêpốk.",
    bestTime: "Tháng 11 đến tháng 4 (Mùa khô, nước hồ Tà Đùng mênh mang trong xanh đẹp nhất)."
  },

  // --- MIỀN NAM ---
  {
    name: "Thành phố Hồ Chí Minh",
    shortName: "TP. Hồ Chí Minh (Sài Gòn)",
    region: "Miền Nam (Đông Nam Bộ)",
    aliases: ["tphcm", "tp hcm", "sai gon", "saigon", "sg", "ben thanh", "quan 1"],
    geography: "Đô thị lớn nhất Việt Nam nằm bên sông Sài Gòn, trung tâm kinh tế - văn hóa miền Nam.",
    history: "Hòn ngọc Viễn Đông với hơn 300 năm hình thành, nơi Bác Hồ ra đi tìm đường cứu nước năm 1911.",
    culture: "Sôi động, phóng khoáng, bao dung và hội tụ văn hóa đa dạng mọi miền đất nước.",
    attractions: "Chợ Bến Thành, Dinh Độc Lập, Nhà thờ Đức Bà, Landmark 81, Phố đi bộ Nguyễn Huệ.",
    food: "Cơm tấm Sài Gòn, Bánh mì Sài Gòn, Hủ tiếu Nam Vang, Ốc Sài Gòn, Phá lấu.",
    bestTime: "Tháng 12 đến tháng 4 (Mùa khô, không lo mưa đột ngột, phố xá lung linh)."
  },
  {
    name: "Tỉnh Bà Rịa - Vũng Tàu",
    shortName: "Bà Rịa - Vũng Tàu",
    region: "Miền Nam (Đông Nam Bộ)",
    aliases: ["vung tau", "vung taug", "ba ria", "con dao"],
    geography: "Nhô ra biển Đông như một bán đảo, sở hữu Côn Đảo thiêng liêng ngoài khơi.",
    history: "Trận chiến Hải đăng Ke Ga, Côn Đảo - "Địa ngục trần gian" kiên cường thời chiến.",
    culture: "Văn hóa biển sôi nổi, Lễ hội Nghinh Ông truyền thống của ngư dân miền biển.",
    attractions: "Tượng Chúa Kitô Vua, Bãi Sau, Bãi Trước, Mũi Nghinh Phong, Côn Đảo, Hồ Tràm.",
    food: "Bánh khọt Vũng Tàu, Lẩu cá đuối, Bánh kẹp bông lan trứng muối, Hải sản Côn Đảo.",
    bestTime: "Quanh năm (Rất thích hợp cho các chuyến du lịch biển nghỉ dưỡng cuối tuần)."
  },
  {
    name: "Tỉnh Tây Ninh",
    shortName: "Tây Ninh",
    region: "Miền Nam (Đông Nam Bộ)",
    aliases: ["tay ninh", "nui ba den", "toa thanh tay ninh"],
    geography: "Biên giới phía Tây Nam, sở hữu Núi Bà Đen - Nóc nhà Nam Bộ cao 986m.",
    history: "Căn cứ Trung ương Cục miền Nam trong thời kỳ kháng chiến chống Mỹ.",
    culture: "Thánh địa của Đạo Cao Đài và Tín ngưỡng thờ Linh Sơn Thánh Mẫu linh thiêng.",
    attractions: "Núi Bà Đen, Tòa thánh Tây Ninh, Hồ Dầu Tiếng, Ma Thiên Lãnh.",
    food: "Bánh tráng phơi sương Trảng Bàng, Bánh canh Trảng Bàng, Muối tôm Tây Ninh.",
    bestTime: "Tháng 1 đến tháng 3 (Lễ hội Hội Xuân Núi Bà Đen linh thiêng rộn ràng)."
  },
  {
    name: "Tỉnh Bình Dương",
    shortName: "Bình Dương",
    region: "Miền Nam (Đông Nam Bộ)",
    aliases: ["binh duong", "dai nam", "chua ba thien hau", "lai thieu"],
    geography: "Nằm ở trung tâm Đông Nam Bộ, nổi tiếng với các khu vườn ăn trái miệt vườn Lái Thiêu.",
    history: "Đất gốm Sông Bé lâu đời và chiến khu Đ anh hùng.",
    culture: "Lễ hội Chùa Bà Thiên Hậu lớn nhất Nam Bộ và nghề gốm sứ truyền thống.",
    attractions: "Khu du lịch Đại Nam, Chùa Bà Thiên Hậu, Làng gốm Lái Thiêu, Hồ Dầu Tiếng.",
    food: "Bánh bèo bì Bún Tàu, Măng cụt Lái Thiêu, Lẩu bò mắm ruốc, Gà nướng sầu riêng.",
    bestTime: "Tháng 5 đến tháng 8 (Mùa trái cây chín rộ tại vườn Lái Thiêu)."
  },
  {
    name: "Tỉnh Bình Phước",
    shortName: "Bình Phước",
    region: "Miền Nam (Đông Nam Bộ)",
    aliases: ["binh phuoc", "nam cat tien", "nui ba ra", "bu gia map"],
    geography: "Tỉnh có diện tích lớn nhất miền Nam, bạt ngàn rừng cao su và điều.",
    history: "Chiến thắng Phước Long mở màn cho Đại thắng mùa Xuân năm 1975.",
    culture: "Văn hóa S'tiêng, M'Nông độc đáo với tiếng cồng chiêng và lễ hội đâm trâu.",
    attractions: "Trảng cỏ Bù Lạch, Núi Bà Rá, Vườn quốc gia Bù Gia Mập, Căn cứ Tà Thiết.",
    food: "Hạt điều rang muối, Đọt mây nướng, Ve sầu sữa chiên giòn, Heo thả rông.",
    bestTime: "Tháng 12 đến tháng 3 (Mùa rừng cao su thay lá vàng rực tuyệt đẹp)."
  },
  {
    name: "Tỉnh Đồng Nai",
    shortName: "Đồng Nai",
    region: "Miền Nam (Đông Nam Bộ)",
    aliases: ["dong nai", "bien hoa", "nam cat tien", "tri an"],
    geography: "Cửa ngõ kết nối Đông Nam Bộ và Tây Nguyên, có rừng quốc gia Cát Tiên.",
    history: "Vùng đất Biên Hóa - Trấn Biên hơn 300 năm mở cõi phương Nam.",
    culture: "Hội tụ văn hóa miền Đông gian lao mà anh dũng, văn hóa Chơ Ro, Mạ.",
    attractions: "Vườn quốc gia Cát Tiên, Khu du lịch Bửu Long, Thác Giang Điền, Hồ Trị An.",
    food: "Bưởi Tân Triều, Gỏi cá Biên Hòa, Lẩu khổ qua rừng, Mứt chôm chôm.",
    bestTime: "Tháng 5 đến tháng 8 (Mùa du lịch sinh thái miệt vườn trái cây)."
  },
  {
    name: "Thành phố Cần Thơ",
    shortName: "Cần Thơ",
    region: "Miền Nam (Đồng bằng sông Cửu Long)",
    aliases: ["can tho", "cho noi cai rang", "ben ninh kieu"],
    geography: "Trái tim của miền Tây Nam Bộ, nằm ven bờ sông Hậu êm đềm.",
    history: "Tây Đô sầm uất nổi tiếng từ xa xưa: \"Cần Thơ gạo trắng nước trong\".",
    culture: "Văn hóa sông nước miệt vườn đặc trưng, chợ nổi và điệu hò sông Hậu.",
    attractions: "Chợ nổi Cái Răng, Bến Ninh Kiều, Nhà cổ Bình Thủy, Cồn Sơn.",
    food: "Bánh xèo Cần Thơ, Bún mắm, Lẩu vịt nấu chao, Bánh cống, Khô nhái.",
    bestTime: "Tháng 9 - 11 (Mùa nước nổi) hoặc Tháng 6 - 8 (Mùa trái cây chín trĩu quả)."
  },
  {
    name: "Tỉnh Kiên Giang",
    shortName: "Kiên Giang (Phú Quốc)",
    region: "Miền Nam (Đồng bằng sông Cửu Long)",
    aliases: ["kien giang", "phu quoc", "phu quoc island", "nam du", "ha tien"],
    geography: "Tỉnh tận cùng phía Tây Nam, sở hữu Đảo Ngọc Phú Quốc và Hà Tiên thơ mộng.",
    history: "Gắn liền với tên tuổi Anh hùng dân tộc Nguyễn Trung Trực kiên cường.",
    culture: "Giao thoa văn hóa Việt - Hoa - Khmer và nét sinh hoạt biển đảo trù phú.",
    attractions: "Đảo Phú Quốc, Quần đảo Nam Du, Hà Tiên, Hòn Sơn, Grand World.",
    food: "Bún quậy Phú Quốc, Gỏi cá trích, Rượu sim, Nước mắm Phú Quốc, Còi biên mai.",
    bestTime: "Tháng 11 đến tháng 4 (Mùa khô Phú Quốc, biển tĩnh lặng xanh vắt)."
  },
  {
    name: "Tỉnh An Giang",
    shortName: "An Giang",
    region: "Miền Nam (Đồng bằng sông Cửu Long)",
    aliases: ["an giang", "chau doc", "mieu ba chua xu", "tra su"],
    geography: "Đầu nguồn sông Tiền và sông Hậu, địa hình Thất Sơn (Bảy Núi) kỳ vĩ.",
    history: "Vùng đất mở cõi của Danh tướng Thoại Ngọc Hầu với Kênh Vĩnh Tế vĩ đại.",
    culture: "Đa văn hóa đặc sắc Việt - Khmer - Cham - Hoa; Miếu Bà Chúa Xứ linh thiêng.",
    attractions: "Rừng tràm Trà Sư, Miếu Bà Chúa Xứ Núi Sam, Núi Cấm, Hồ Tà Pạ.",
    food: "Lẩu mắm Châu Đốc, Bún cá Long Xuyên, Bánh bò thốt nốt, Tung lò khờ.",
    bestTime: "Tháng 9 đến tháng 11 (Mùa nước nổi rừng tràm Trà Sư đẹp như tranh vẽ)."
  },
  {
    name: "Tỉnh Cà Mau",
    shortName: "Cà Mau",
    region: "Miền Nam (Đồng bằng sông Cửu Long)",
    aliases: ["ca mau", "dat mui", "mui ca mau", "u minh ha"],
    geography: "Mảnh đất tận cùng cực Nam Tổ quốc, 3 mặt giáp biển, hệ sinh thái ngập mặn.",
    history: "Mảnh đất kiên trung, căn cứ cách mạng ngầm U Minh Hạ thời chiến đấu.",
    culture: "Đậm chất xông phao sông nước, nghe đờn ca tài tử giữa rừng tràm u tịch.",
    attractions: "Mũi Cà Mau, Vườn quốc gia U Minh Hạ, Hòn Đá Bạc, Đầm Thị Tường.",
    food: "Cua Cà Mau, Bánh tầm gà giòn, Cá thòi lòi nướng muối ớt, Lẩu mắm U Minh.",
    bestTime: "Tháng 12 đến tháng 4 năm sau (Mùa khô ráo, tiện di chuyển thăm Đất Mũi)."
  },
  {
    name: "Tỉnh Bến Tre",
    shortName: "Bến Tre",
    region: "Miền Nam (Đồng bằng sông Cửu Long)",
    aliases: ["ben tre", "xu dua", "con phung"],
    geography: "Được hợp thành từ 3 cù lao lớn bạt ngàn dừa xanh giữa các nhánh sông Cửu Long.",
    history: "Quê hương Đội quân Tóc dài và Phong trào Đồng Khởi lịch sử hào hùng.",
    culture: "Văn hóa Dừa ngọt ngào, nếp sống miệt vườn chân chất tình người.",
    attractions: "Cồn Phụng, Cồn Quy, Sân chim Vàm Hồ, Các vườn trái cây Cái Mơn.",
    food: "Kẹo dừa Bến Tre, Cơm dừa, Dừa sáp, Cá lóc nướng trui, Củ hủ dừa.",
    bestTime: "Tháng 6 đến tháng 8 (Mùa trái cây sum suê và không khí mát rượi)."
  },
  {
    name: "Tỉnh Đồng Tháp",
    shortName: "Đồng Tháp",
    region: "Miền Nam (Đồng bằng sông Cửu Long)",
    aliases: ["dong thap", "sa dec", "lang hoa sa dec", "tram chim"],
    geography: "Vùng Đất Sen Hồng nằm ở đồng bằng ngập nước Đồng Tháp Mười.",
    history: "Căn cứ Xẻo Quýt anh hùng và Làng hoa Sa Đéc hơn 100 năm tuổi.",
    culture: "Biểu tượng Sen hồng thuần khiết và nét văn hóa hiền hòa sếu đầu đỏ.",
    attractions: "Làng hoa Sa Đéc, Vườn quốc gia Tràm Chim, Khu di tích Xẻo Quýt, Chùa Lá Tảo.",
    food: "Hủ tiếu Sa Đéc, Nem Lai Vung, Bánh xèo Cao Lãnh, Các món ăn chế biến từ Sen.",
    bestTime: "Tháng 9 - 12 (Mùa nước nổi Tràm Chim) & Dịp cận Tết (Làng hoa Sa Đéc)."
  },
  {
    name: "Tỉnh Bạc Liêu",
    shortName: "Bạc Liêu",
    region: "Miền Nam (Đồng bằng sông Cửu Long)",
    aliases: ["bac lieu", "cong tu bac lieu", "dien gio bac lieu"],
    geography: "Tỉnh ven biển miền Tây, sở hữu cánh đồng quạt gió trên biển rực rỡ.",
    history: "Gắn liền với giai thoại Công tử Bạc Liêu lừng lẫy miền Nam.",
    culture: "Cội nguồn bản Dạ cổ hoài lang của Cố nhạc sĩ Cao Văn Lầu.",
    attractions: "Nhà Công tử Bạc Liêu, Cánh đồng quạt gió, Nhà hát Cao Văn Lầu, Phật Bà Nam Hải.",
    food: "Lẩu mắm Bạc Liêu, Bánh tằm Ngan Dừa, Bún nước lèo, Cá kèo nướng.",
    bestTime: "Tháng 8 đến tháng 10 (Mùa lễ hội Ok Om Bok rộn ràng không khí)."
  },
  {
    name: "Tỉnh Tiền Giang",
    shortName: "Tiền Giang",
    region: "Miền Nam (Đồng bằng sông Cửu Long)",
    aliases: ["tien giang", "my tho", "chot noi cai be", "thoi son"],
    geography: "Nằm trải dài dọc bờ sông Tiền, cửa ngõ từ TP.HCM về miền Tây.",
    history: "Chiến công Rạch Gầm - Xoài Mút lừng lẫy của Anh hùng Quang Trung.",
    culture: "Văn hóa sông nước hủ tiếu Mỹ Tho và trải nghiệm đi xuồng ba lá.",
    attractions: "Cù lao Thới Sơn, Chợ nổi Cái Bè, Chùa Vĩnh Tràng, Trại rắn Đồng Tâm.",
    food: "Hủ tiếu Mỹ Tho, Vú sữa Lò Rèn, Bánh vá Chợ Gạo, Chả tụy Chợ Gạo.",
    bestTime: "Quanh năm (Cách TP.HCM rất gần, lý tưởng cho chuyến đi trong ngày)."
  },
  {
    name: "Tỉnh Sóc Trăng",
    shortName: "Sóc Trăng",
    region: "Miền Nam (Đồng bằng sông Cửu Long)",
    aliases: ["soc trang", "chua doi", "banh pia"],
    geography: "Nằm ở cửa sông Hậu đổ ra biển Đông, đất đai phù sa trù phú.",
    history: "Sự chung sống lâu đời hòa thuận giữa 3 dân tộc Kinh - Khmer - Hoa.",
    culture: "Lễ hội Đua ghe Ngo, kiến trúc chùa Khmer lộng lẫy và Bánh pía thơm ngon.",
    attractions: "Chùa Dơi, Chùa Chén Kiểu, Chùa Som Rong, Cù lao Dung.",
    food: "Bánh pía Sóc Trăng, Bún nước lèo, Bánh cống, Lạp xưởng Vũng Thơm.",
    bestTime: "Tháng 10 - 11 âm lịch (Rộn ràng Lễ hội Đua ghe Ngo Ok Om Bok)."
  },
  {
    name: "Tỉnh Trà Vinh",
    shortName: "Trà Vinh",
    region: "Miền Nam (Đồng bằng sông Cửu Long)",
    aliases: ["tra vinh", "ao ba om", "chua hang"],
    geography: "Bán đảo ven biển được bao bọc bởi sông Tiền và sông Hậu.",
    history: "Vùng đất cổ lưu giữ hơn 140 ngôi chùa Khmer có kiến trúc độc đáo.",
    culture: "Không gian xanh rợp bóng cây cổ thụ và kho tàng văn hóa Khmer đa dạng.",
    attractions: "Ao Bà Ôm, Chùa Hang, Biển Ba Động, Chùa Âng.",
    food: "Bún nước lèo Trà Vinh, Dừa sáp Cầu Kè, Bánh tét Trà Cuôn, Chả hoa.",
    bestTime: "Tháng 10 âm lịch (Lễ hội Ok Om Bok) hoặc mùa hè nghỉ dưỡng biển Ba Động."
  },
  {
    name: "Tỉnh Vĩnh Long",
    shortName: "Vĩnh Long",
    region: "Miền Nam (Đồng bằng sông Cửu Long)",
    aliases: ["vinh long", "an binh", "cu lao an binh"],
    geography: "Nằm ở trung tâm 2 nhánh sông Tiền và sông Hậu, đất đai ngọt phù sa.",
    history: "Vùng đất Long Hồ dinh xưa, nơi sinh ra nhiều nhà lãnh đạo tài ba.",
    culture: "Văn hóa sinh thái sông nước miệt vườn đậm chất Nam Bộ.",
    attractions: "Cù lao An Bình, Chùa Phật Ngọc Xá Lợi, Khu du lịch Vinh Sang.",
    food: "Cá cháy Rạch Tra, Bánh cháy, Khoai lang bí Bình Tân, Trái cây miệt vườn.",
    bestTime: "Tháng 5 đến tháng 10 (Mùa trái cây chín trĩu cành trên các cù lao)."
  },
  {
    name: "Tỉnh Hậu Giang",
    shortName: "Hậu Giang",
    region: "Miền Nam (Đồng bằng sông Cửu Long)",
    aliases: ["hau giang", "vi thanh", "lung ngoc hoang"],
    geography: "Trung tâm đồng bằng sông Hậu với hệ thống kênh rạch chằng chịt.",
    history: "Di tích Chiến thắng Tầm Vu vang dội thời kháng chiến.",
    culture: "Nếp sống chân chất của người dân vùng kênh xáng Quản Lộ - Phụng Hiệp.",
    attractions: "Khu bảo tồn thiên nhiên Lung Ngọc Hoàng, Chợ đêm Vị Thanh, Công viên Xà No.",
    food: "Cá thát lát rút xương, Khóm Cầu Đúc, Bún xào vịt, Chả cá thát lát.",
    bestTime: "Tháng 9 đến tháng 11 (Khám phá nét hoang sơ mùa nước nổi Lung Ngọc Hoàng)."
  },
  {
    name: "Tỉnh Long An",
    shortName: "Long An",
    region: "Miền Nam (Đồng bằng sông Cửu Long)",
    aliases: ["long an", "tan lap", "lang noi tan lap"],
    geography: "Nằm trên dải sông Vàm Cỏ Đông và Vàm Cỏ Tây thơ mộng.",
    history: "Dòng sông Vàm Cỏ Đông ghi dấu những chiến công hiển hách đánh Pháp, Mỹ.",
    culture: "Trung tâm đờn ca tài tử Nam Bộ và tinh thần \"Trung dũng gia cường\".",
    attractions: "Làng nổi Tân Lập, Khu du lịch Cát Tường Phú Sinh, Nhà 120 cột.",
    food: "Lạp xưởng tươi Long An, Thanh long Châu Thành, Rượu đế Gò Đen.",
    bestTime: "Tháng 8 đến tháng 11 (Làng nổi Tân Lập xanh mát giữa rừng tràm mùa nước nổi)."
  }
];

// Cấu hình Fuse.js cho Tìm kiếm mờ
const fuseOptions = {
  includeScore: true,
  threshold: 0.45,
  keys: ['searchKeys']
};

const processedData = provincesData.map(item => {
  const normName = normalizeText(item.name);
  const normShort = normalizeText(item.shortName);
  const normAliases = item.aliases.map(a => normalizeText(a));
  return {
    ...item,
    searchKeys: [normName, normShort, ...normAliases].join(' ')
  };
});

const fuse = new Fuse(processedData, fuseOptions);

// 1. Hàm tìm tỉnh thành
function findProvince(query) {
  if (!query) return null;
  const cleanQuery = normalizeText(query);

  // Khớp chính xác
  const exactMatch = processedData.find(p => 
    p.aliases.some(a => normalizeText(a) === cleanQuery) ||
    normalizeText(p.shortName) === cleanQuery ||
    normalizeText(p.name) === cleanQuery
  );
  if (exactMatch) return exactMatch;

  // Tìm kiếm mờ
  const results = fuse.search(cleanQuery);
  if (results.length > 0) {
    return results[0].item;
  }
  return null;
}

// 2. Bộ máy Nhận diện ý định câu hỏi (Intent Aspect Detector)
function detectQuestionAspect(userQuery) {
  const norm = normalizeText(userQuery);

  if (/(lich su|su tich|nguon goc|qua khu|xua|co do|danh nhan)/i.test(norm)) {
    return 'history';
  }
  if (/(dia ly|vi tri|dia hinh|khi hau|nam o dau|hoang so|thien nhien)/i.test(norm)) {
    return 'geography';
  }
  if (/(van hoa|phong tuc|le hoi|con nguoi|loi song|truyen thong|tin nguong)/i.test(norm)) {
    return 'culture';
  }
  if (/(an gi|am thuc|dac san|quan an|mon ngon|duong pho|uong gi)/i.test(norm)) {
    return 'food';
  }
  if (/(di dau|choi gi|dia danh|canh dep|tham quan|checkin|diem den|thang canh)/i.test(norm)) {
    return 'attractions';
  }
  if (/(mua nao|khi nao|thoi gian|thoi diem|thoi tiet|thang may)/i.test(norm)) {
    return 'bestTime';
  }
  
  return 'general'; // Giới thiệu tổng quan như Hướng dẫn viên
}

// 3. Hàm biên soạn câu trả lời chuẩn Hướng Dẫn Viên Du Lịch
function formatTourGuideResponse(province, aspect) {
  const name = province.shortName;

  switch (aspect) {
    case 'history':
      return `📜 **HƯỚNG DẪN VIÊN CHÀO QUÝ KHÁCH! VỀ LỊCH SỬ THIÊNG LIÊNG CỦA ${name.toUpperCase()}:**\n\n` +
        `${province.history}\n\n` +
        `💡 *Lời khuyên HDV:* Tìm hiểu lịch sử địa phương sẽ giúp chuyến đi của quý khách thêm phần ý nghĩa và sâu sắc hơn rất nhiều!`;

    case 'geography':
      return `🗺️ **BẢN ĐỒ & ĐỊA LÝ DÂN CƯ ${name.toUpperCase()}:**\n\n` +
        `Về vị trí địa lý: ${province.geography}\n` +
        `Thuộc vùng: ${province.region}.\n\n` +
        `💡 *Lời khuyên HDV:* Vị trí địa lý này tạo nên khung cảnh thiên nhiên rất độc đáo cho ${name}!`;

    case 'culture':
      return `🎭 **NÉT ĐẸP VĂN HÓA & NẾP SỐNG ${name.toUpperCase()}:**\n\n` +
        `${province.culture}\n\n` +
        `💡 *Lời khuyên HDV:* Hãy mở lòng trải nghiệm các lễ hội và giao lưu cùng người dân địa phương nơi đây nhé!`;

    case 'food':
      return `🍲 **HÀNH TRÌNH KHÁM PHÁ ẨM THỰC ${name.toUpperCase()}:**\n\n` +
        `Đến với ${name}, quý khách nhất định không thể bỏ qua những món đặc sản trứ danh:\n` +
        `👉 ${province.food}\n\n` +
        `💡 *Gợi ý HDV:* Đừng quên thưởng thức ẩm thực đường phố vào buổi tối để cảm nhận trọn vẹn hương vị vùng miền!`;

    case 'attractions':
      return `📸 **ĐIỂM ĐẾN DU LỊCH & CHECK-IN NỔI TIẾNG TẠI ${name.toUpperCase()}:**\n\n` +
        `Dưới đây là danh thắng danh tiếng quý khách nên ghé thăm:\n` +
        `📍 ${province.attractions}\n\n` +
        `💡 *Gợi ý HDV:* Quý khách nhớ chuẩn bị trang phục phù hợp và máy ảnh đầy pin để lưu lại những khoảnh khắc đẹp nhé!`;

    case 'bestTime':
      return `🗓️ **THỜI ĐIỂM DẠO CHƠI LÝ TƯỞNG NHẤT TẠI ${name.toUpperCase()}:**\n\n` +
        `⏰ Thời gian đẹp nhất: ${province.bestTime}\n\n` +
        `💡 *Lời khuyên HDV:* Lên kế hoạch đặt vé và phòng trước 2-3 tuần để có chuyến đi suôn sẻ nhất nhé!`;

    default: // Tổng quan trọn gói
      return `🎙️ **XIN CHÀO QUÝ KHÁCH! TÔI LÀ HƯỚNG DẪN VIÊN DU LỊCH ẢO. XIN GIỚI THIỆU TỔNG QUAN VỀ ${province.name.toUpperCase()}:**\n\n` +
        `📍 **Thuộc vùng:** ${province.region}\n` +
        `🗺️ **Địa lý:** ${province.geography}\n` +
        `📜 **Lịch sử:** ${province.history}\n` +
        `🎭 **Văn hóa:** ${province.culture}\n` +
        `🏛️ **Địa danh nổi tiếng:** ${province.attractions}\n` +
        `🍲 **Đặc sản phải thử:** ${province.food}\n` +
        `🗓️ **Thời điểm lý tưởng:** ${province.bestTime}\n\n` +
        `✨ *Chúc quý khách có một chuyến hành trình khám phá ${province.shortName} thật tuyệt vời và trọn vẹn!*`;
  }
}

// Endpoint kiểm tra hoạt động
app.get('/', (req, res) => {
  res.send('Server Hướng Dẫn Viên Du Lịch 63 Tỉnh Thành Việt Nam đang chạy tốt!');
});

// Endpoint Webhook chính cho Dialogflow
app.post('/webhook', (req, res) => {
  try {
    const queryResult = req.body.queryResult;
    const userQuery = queryResult.queryText || '';
    const parameters = queryResult.parameters || {};

    const searchText = parameters.province || userQuery;

    // 1. Tìm tỉnh thành trong CSDL
    const matchedProvince = findProvince(searchText);

    let replyMessage = "";

    if (matchedProvince) {
      // 2. Nhận diện khía cạnh người dùng hỏi (Lịch sử/Địa lý/Văn hóa/Ăn uống...)
      const aspect = detectQuestionAspect(userQuery);
      
      // 3. Phản hồi theo phong cách Hướng dẫn viên
      replyMessage = formatTourGuideResponse(matchedProvince, aspect);
    } else {
      replyMessage = `Xin chào quý khách! Tôi là Hướng dẫn viên du lịch ảo. Hiện tại tôi chưa nhận diện được rõ tên tỉnh thành quý khách đang quan tâm.\n\nQuý khách có thể hỏi tôi bất kỳ thông tin nào, ví dụ:\n• "Lịch sử Hà Nội thế nào?"\n• "Ăn gì ở Sài Gòn?"\n• "Địa danh nổi tiếng ở Đà Nẵng"\n• "Đi Mộc Châu mùa nào đẹp?"`;
    }

    return res.json({
      fulfillmentText: replyMessage
    });

  } catch (error) {
    console.error("Lỗi Webhook:", error);
    return res.json({
      fulfillmentText: "Rất tiếc! Đã xảy ra lỗi hệ thống. Hướng dẫn viên du lịch ảo sẽ quay lại hỗ trợ quý khách trong giây lát!"
    });
  }
});

// Khởi chạy Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server Chatbot Du Lịch đang chạy tại port ${PORT}`);
});
