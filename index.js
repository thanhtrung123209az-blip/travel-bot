const express = require('express');
const app = express();
app.use(express.json());

// 🎙️ KHO DỮ LIỆU TƯ VẤN DU LỊCH 63 TỈNH THÀNH (PHONG CÁCH HƯỚNG DẪN VIÊN)
const duLieuCacTinh = {
  // ==================== I. MIỀN BẮC ====================
  'lào cai': `🎩 **Dạ em chào quý khách! Chào mừng quý khách đến với Lào Cai - Sa Pa vùng đất sương giăng!**

🏔️ **Điểm check-in đỉnh cao**:
• Đỉnh Fansipan - Nóc nhà Đông Dương (đi cáp treo ngắm mây ngàn).
• Bản Cát Cát, Thung lũng Mường Hoa - Trải nghiệm văn hóa H'Mông.
• Cầu kính Rồng Mây - Thử thách lòng cảm giác mạnh.

🍲 **Món ngon chuẩn vị Tây Bắc**:
• Lẩu cá hồi, cá tầm tươi sống nhúng rau mầm đá.
• Thịt trâu gác bếp, thắng cố đêm Phố Cổ.

☀️ **Mùa vàng du lịch**:
• Tháng 9 - 10: Ngắm mùa lúa chín vàng rực trên ruộng bậc thang.
• Tháng 12 - 1: Săn mây, ngắm băng tuyết và tận hưởng cái lạnh đậm chất Âu.

💡 **Bí kíp HDV bật mí**: Hãy thuê một bộ trang phục dân tộc tại Bản Cát Cát để có bộ ảnh kỷ niệm cực xinh nhé!`,

  'sapa': `🎩 **Dạ em chào quý khách! Sa Pa mờ sương xin chào đón quý khách!**

🏔️ **Trải nghiệm không thể bỏ lỡ**:
• Chinh phục đỉnh Fansipan 3.143m ngắm biển mây bồng bềnh.
• Dạo bước tại Bản Cát Cát, Check-in Moana Sa Pa, Cổng Trời.

🍲 **Ẩm thực sưởi ấm lòng người**:
• Lẩu cá hồi cá tầm, đồ nướng phố cổ đêm sương lạnh.

☀️ **Thời điểm lý tưởng**: Tháng 9-10 (Lúa chín) & Tháng 12-1 (Săn mây, tuyết).
💡 **Lời khuyên HDV**: Chuẩn bị áo ấm dày và giày thể thao êm chân vì sẽ đi bộ khá nhiều ạ!`,

  'hà giang': `🎩 **Dạ em chào quý khách! Hà Giang - Mảnh đất địa đầu Tổ quốc hùng vĩ xin chào!**

🏍️ **Cung đường huyền thoại**:
• Chinh phục Đèo Mã Pí Lèng - một trong "Tứ đại đỉnh đèo".
• Đi thuyền trên Sông Nho Quế màu xanh ngọc bích qua hẻm Tu Sản.
• Cột cờ Lũng Cú, Dinh thự nhà Vương, Phố cổ Đồng Văn.

🍲 **Đặc sản đậm đà miền đá**:
• Bánh tam giác mạch, cháo ấu tẩu sưởi ấm đêm lạnh, phở tráng đồng.

☀️ **Mùa đẹp nhất**: Tháng 10 - 12 (Đúng mùa hoa tam giác mạch nở rộ).
💡 **Mẹo từ HDV**: Đường đèo nhiều khúc cua tay áo, nếu tự lái xe máy quý khách nhớ giữ vững tay lái và kiểm tra phanh kỹ nhé!`,

  'cao bằng': `🎩 **Dạ em chào quý khách! Cao Bằng - Vùng đất non nước hữu tình xin chào!**

🌊 **Cảnh quan tuyệt mỹ**:
• Thác Bản Giốc - Thác nước tự nhiên lớn nhất Đông Nam Á.
• Động Ngườm Ngao kỳ ảo, Suối Lê Nin - Khu di tích Pác Bó xanh trong như ngọc.

🍲 **Món ngon nhớ mãi**:
• Bánh cuốn Cao Bằng nước xương ngọt thanh, hạt dẻ Trùng Khánh bùi ngậy, vịt quay 7 vị.

☀️ **Thời điểm vàng**: Tháng 8 - Tháng 10 (Nước thác xanh ngắt, trong lành).
💡 **Gợi ý HDV**: Đừng quên mua hạt dẻ Trùng Khánh về làm quà cho người thân nhé!`,

  'hà nội': `🎩 **Dạ em chào quý khách! Hà Nội 36 phố phường nghìn năm văn hiến xin chào!**

🏛️ **Hành trình khám phá thủ đô**:
• Dạo Hồ Hoàn Kiếm, viếng Lăng Bác, thăm Văn Miếu Quốc Tử Giám.
• Khám phá nét cổ kính của Phố Cổ Hà Nội và Cầu Long Biên lịch sử.

🍲 **Tinh hoa ẩm thực Tràng An**:
• Phở gia truyền, Bún chả Hàng Mành, Chả cá Lăng, Cà phê trứng Giảng.

☀️ **Mùa đẹp nhất**: Tháng 9 - Tháng 11 (Thu Hà Nội hoa sữa rơi, không khí se lạnh siêu lãng mạn).
💡 **Mẹo HDV**: Hãy thử dậy sớm lúc 5h sáng dạo quanh Hồ Gươm để cảm nhận một Hà Nội bình yên nhất!`,

  'quảng ninh': `🎩 **Dạ em chào quý khách! Quảng Ninh - Kỳ quan thiên nhiên thế giới xin chào!**

⛵ **Trải nghiệm đẳng cấp**:
• Du thuyền tham quan Vịnh Hạ Long, Đảo Ti Tốp, Động Thiên Cung.
• Hành hương về đất Phật Yên Tử, vui chơi tại Sun World Hạ Long.

🍲 **Đặc sản hải sản**:
• Chả mực Hạ Long giòn sần sật, bún bề bề, sá sùng rang.

☀️ **Thời điểm đẹp**: Tháng 4 - Tháng 9 (Nắng đẹp, biển xanh thích hợp tắm biển và đi du thuyền).
💡 **Bí kíp HDV**: Nên đặt tour du thuyền ngủ đêm trên Vịnh Hạ Long để đón bình minh siêu đẹp!`,

  'hạ long': `🎩 **Dạ em chào quý khách! Vịnh Hạ Long kỳ quan xin chào đón quý khách!**

⛵ **Điểm tham quan nổi bật**:
• Vịnh Hạ Long, Bảo tàng Quảng Ninh, Đảo Ti Tốp, Phố cổ Bãi Cháy.
🍲 **Thức quà của biển**: Chả mực Hạ Long ăn kèm xôi trắng hoặc bánh cuốn, bún bề bề.
☀️ **Mùa đẹp**: Tháng 4 - Tháng 8.
💡 **Mẹo HDV**: Đừng quên mang theo đồ bơi và kem chống nắng đầy đủ nhé!`,

  'ninh bình': `🎩 **Dạ em chào quý khách! Ninh Bình - Tuyệt tác di sản Cố đô xin chào!**

🚣 **Cảnh tiên nơi hạ giới**:
• Đi thuyền Tràng An / Tam Cốc lướt qua những dãy núi đá vôi.
• Chinh phục Hang Múa ngắm toàn cảnh dòng sông Ngô Đồng.
• Chiêm bái Chùa Bái Đính - Ngôi chùa sở hữu nhiều kỷ lục.

🍲 **Đặc sản cố đô**:
• Cơm cháy giòn tan chấm sốt dê, Thịt dê núi tái chanh thơm nức.

☀️ **Mùa vàng**: Tháng 1 - Tháng 5 (Đi lễ xuân & Mùa lúa vàng Tam Cốc rực rỡ vào tháng 5-6).
💡 **Mẹo HDV**: Leo Hang Múa khoảng 500 bậc thang, quý khách nhớ mang giày thể thao nhẹ nhé!`,

  // ==================== II. MIỀN TRUNG & TÂY NGUYÊN ====================
  'thừa thiên huế': `🎩 **Dạ em chào quý khách! Cố đô Huế mộng mơ kính chào quý khách!**

👑 **Dấu ấn kinh kỳ**:
• Thăm Đại Nội Huế, Lăng Khải Định, Lăng Tự Đức, Chùa Thiên Mụ.
• Đi thuyền rồng ngắm hoàng hôn và nghe Ca Huế trên Sông Hương.

🍲 **Culinary Huế - Đậm đà xứ Huế**:
• Bún bò Huế chuẩn vị, Cơm hến, Bánh bèo - nậm - lọc, Chè hẻm.

☀️ **Thời điểm đẹp**: Tháng 1 - Tháng 4 (Thời tiết mát mẻ, dễ chịu).
💡 **Bí kíp HDV**: Thuê một chiếc áo dài truyền thống chụp ảnh tại Đại Nội sẽ cho ra những bức hình tuyệt đẹp!`,

  'huế': `🎩 **Dạ em chào quý khách! Xứ Huế mộng mơ kính chào quý khách!**

👑 **Điểm đến cố đô**: Đại Nội Huế, Chùa Thiên Mụ, Lăng Khải Định, Đồi Vọng Cảnh.
🍲 **Ẩm thực đặc sắc**: Bún bò Huế, Cơm hến, Bánh bèo nậm lọc, Chè mâm.
☀️ **Thời điểm lý tưởng**: Tháng 1 - Tháng 4.
💡 **Lời khuyên HDV**: Hãy thưởng thức một tách trà cung đình Huế vào buổi tối nhé!`,

  'đà nẵng': `🎩 **Dạ em chào quý khách! Đà Nẵng - Thành phố đáng sống nhất Việt Nam xin chào!**

🌉 **Điểm hẹn hiện đại & thiên nhiên**:
• Sun World Bà Nà Hills (Check-in Cầu Vàng nổi tiếng thế giới).
• Xem Cầu Rồng phun lửa & nước vào 21h cuối tuần.
• Tắm biển Mỹ Khê, thăm Bán đảo Sơn Trà và Chùa Linh Ứng.

🍲 **Đặc sản thành phố biển**:
• Mì Quảng, Bánh tráng thịt heo 2 đầu da, Bún chả cá.

☀️ **Thời điểm lý tưởng**: Tháng 2 - Tháng 8 (Trời trong xanh, ít mưa).
💡 **Mẹo HDV**: Nên lên Bà Nà Hills từ sớm để tránh đông đúc và săn được mây đẹp tại Cầu Vàng!`,

  'hội an': `🎩 **Dạ em chào quý khách! Phố cổ Hội An hoài niệm kính chào quý khách!**

🏮 **Không gian hoài cổ**:
• Dạo bước Phố cổ Hội An rợp bóng đèn lồng, check-in Chùa Cầu.
• Đi thuyền trên sông Hoài thả đèn hoa đăng cầu may mắn.
• Khám phá Rừng dừa Bảy Mẫu múa thúng thú vị.

🍲 **Ẩm thực phố hội**:
• Cao lầu, Cơm gà Hội An, Bánh mì Phượng / Madam Khánh, Bánh đập hến xào.

☀️ **Mùa đẹp**: Tháng 2 - Tháng 7.
💡 **Mẹo HDV**: Hãy ghé Hội An từ 17h chiều để ngắm trọn vẹn khoảnh khắc phố lên đèn cực kỳ lung linh!`,

  'quảng nam': `🎩 **Dạ em chào quý khách! Quảng Nam - Nơi hội tụ di sản xin chào!**

🏮 **Điểm đến di sản**: Phố cổ Hội An, Thánh địa Mỹ Sơn, Cù Lao Chàm, Rừng dừa Bảy Mẫu.
🍲 **Đặc sản trứ danh**: Cao lầu, Mì Quảng Phú Chiêm, Cơm gà Hội An.
☀️ **Thời điểm đẹp**: Tháng 2 - Tháng 7.
💡 **Mẹo HDV**: Kết hợp đi Cù Lao Chàm lặn ngắm san hô vào buổi sáng rất tuyệt ạ!`,

  'khánh hòa': `🎩 **Dạ em chào quý khách! Nha Trang - Thiên đường biển xanh Khánh Hòa xin chào!**

🏝️ **Trải nghiệm biển đảo tuyệt vời**:
• Oanh tạc thiên đường giải trí VinWonders Nha Trang.
• Tour 4 đảo (Hòn Mun, Hòn Tằm) lặn ngắm san hô, tắm bùn khoáng.
• Tháp Bà Ponagar cổ kính đậm nét văn hóa Chăm Pa.

🍲 **Đặc sản xứ trầm hương**:
• Nem nướng Nha Trang, Bún chả cá/bún sứa, Hải sản Chợ Đêm.

☀️ **Thời điểm đẹp**: Tháng 1 - Tháng 8 (Nắng vàng, biển êm).
💡 **Mẹo HDV**: Hãy thử trải nghiệm dịch vụ tắm bùn khoáng nóng để thư giãn cơ thể nhé!`,

  'nha trang': `🎩 **Dạ em chào quý khách! Nha Trang biển xanh nắng vàng xin chào!**

🏝️ **Điểm check-in nổi bật**: VinWonders, Đảo Hòn Mun, Tháp Bà Ponagar, Biển Dốc Lết.
🍲 **Ẩm thực biển**: Nem nướng Đặng Văn Quyên, Bún sứa, Bò Lạc Cảnh.
☀️ **Thời điểm đẹp**: Tháng 1 - Tháng 8.
💡 **Mẹo HDV**: Tối dạo đường Trần Phú ngắm biển và gió mát cực kỳ chill!`,

  'lâm đồng': `🎩 **Dạ em chào quý khách! Đà Lạt - Thành phố ngàn hoa xứ Lâm Đồng xin chào!**

🌸 **Thành phố mộng mơ**:
• Hồ Tuyền Lâm, Thung lũng Tình Yêu, Chợ đêm Đà Lạt, Đồi cỏ hồng.
• Săn mây tại Cầu Đất, check-in các quán cà phê ngắm thung lũng.

🍲 **Ẩm thực sưởi ấm phố núi**:
• Lẩu gà lá é, Bánh mì xíu mại nóng hổi, Bánh căn, Kem bơ Thanh Thảo.

☀️ **Mùa đẹp nhất**: Tháng 11 - Tháng 4 (Mùa hoa dã quỳ, mai anh đào & săn mây).
💡 **Bí kíp HDV**: Buổi tối nhiệt độ xuống thấp, nhớ mang áo len, khăn quàng cổ để dạo chợ đêm nhé!`,

  'đà lạt': `🎩 **Dạ em chào quý khách! Đà Lạt phố sương mờ kính chào quý khách!**

🌸 **Điểm đến lãng mạn**: Hồ Xuân Hương, Quảng trường Lâm Viên, Đồi chè Cầu Đất, Langbiang.
🍲 **Món ấm lòng**: Lẩu bò Ba Toa, Lẩu gà lá é Tao Ngộ, Bánh căn góc cây bơ.
☀️ **Thời điểm đẹp**: Tháng 11 - Tháng 4.
💡 **Mẹo HDV**: Dậy sớm từ 4h30 sáng đi săn mây Đồi Cầu Đất sẽ có ảnh siêu phẩm!`,

  // ==================== III. MIỀN NAM ====================
  'tp.hồ chí minh': `🎩 **Dạ em chào quý khách! Thành phố Hồ Chí Minh (Sài Gòn) năng động xin chào!**

🏙️ **Nhịp sống phồn hoa**:
• Dinh Độc Lập, Bưu điện Trung tâm, Nhà thờ Đức Bà, Chợ Bến Thành.
• Ngắm toàn cảnh thành phố từ tòa nhà Landmark 81 hoặc ngắm sông trên Bus đường sông.
• Khám phá không gian lịch sử tại Địa đạo Củ Chi.

🍲 **Thiên đường ăn uống không ngủ**:
• Cơm tấm Sài Gòn, Hủ tiếu Nam Vang, Bánh mì Sài Gòn, ốc đêm đường Vĩnh Khánh.

☀️ **Thời điểm đẹp**: Tháng 12 - Tháng 4 (Mùa khô, trời nắng đẹp ít mưa).
💡 **Mẹo HDV**: Trải nghiệm một ly cà phê bệt hông Nhà thờ Đức Bà buổi sáng để cảm nhận nét Sài Gòn rất riêng!`,

  'sài gòn': `🎩 **Dạ em chào quý khách! Sài Gòn hoa lệ xin chào quý khách!**

🏙️ **Điểm dừng chân nổi tiếng**: Dinh Độc Lập, Phố đi bộ Nguyễn Huệ, Bưu điện TP, Landmark 81.
🍲 **Món ngon đường phố**: Cơm tấm sườn bì chả, Hủ tiếu, Bánh mì, các món ốc.
☀️ **Thời điểm đẹp**: Tháng 12 - Tháng 4.
💡 **Mẹo HDV**: Tối đi dạo Bến Bạch Đằng ngắm du thuyền lung linh trên sông Sài Gòn nhé!`,

  'bà rịa - vũng tàu': `🎩 **Dạ em chào quý khách! Vũng Tàu & Côn Đảo - Điểm hẹn đại dương xin chào!**

🌊 **Hành trình biển đảo**:
• Tắm biển Bãi Sau Vũng Tàu, Check-in Hải đăng, Tượng Chúa Kito.
• Du lịch tâm linh & thiên nhiên tại Côn Đảo (Viếng Mộ Cô Sáu, thăm Nhà tù Côn Đảo).

🍲 **Đặc sản phố biển**:
• Bánh khọt Cô Ba/Gốc Cột Điện, Lẩu cá đuối hẻm Trương Công Định, Hải sản tươi.

☀️ **Thời điểm đẹp**: Quanh năm (Côn Đảo đi đẹp nhất tháng 3 - tháng 9).
💡 **Mẹo HDV**: Thưởng thức bánh khọt nóng hổi vừa chiên xong ăn kèm rau sống cực kỳ bắt miệng!`,

  'vũng tàu': `🎩 **Dạ em chào quý khách! Vũng Tàu biển xanh nắng vàng xin chào!**

🌊 **Điểm tham quan**: Bãi Sau, Bãi Trước, Tượng Chúa Giang Tay, Mũi Nghinh Phong.
🍲 **Đặc sản ngon khó cưỡng**: Bánh khọt, Lẩu cá đuối, Bánh bông lan trứng muối.
☀️ **Thời điểm đẹp**: Cuối tuần quanh năm.
💡 **Mẹo HDV**: Nhớ ghé Mũi Nghinh Phong chụp ảnh cổng trời nhìn ra biển cực ấn tượng!`,

  'kiên giang': `🎩 **Dạ em chào quý khách! Kiên Giang - Đảo ngọc Phú Quốc xin chào!**

🌅 **Thiên đường nghỉ dưỡng**:
• Khám phá Đảo Ngọc Phú Quốc: Bãi Sao, Grand World - Thành phố không ngủ, Sunset Sanato.
• Đi cáp treo Hòn Thơm dài nhất thế giới, thăm Quần đảo Nam Du.

🍲 **Hương vị biển đảo**:
• Bún quậy Kiến Xây, Gỏi cá trích cuốn bánh tráng, Nhum biển nướng mỡ hành.

☀️ **Thời điểm vàng**: Tháng 10 - Tháng 4 năm sau (Mùa khô Phú Quốc biển trong như ngọc).
💡 **Bí kíp HDV**: Đón hoàng hôn tại Sunset Sanato hoặc Dinh Cậu là trải nghiệm tuyệt vời nhất!`,

  'phú quốc': `🎩 **Dạ em chào quý khách! Đảo Ngọc Phú Quốc xin chào đón quý khách!**

🌅 **Trải nghiệm đỉnh cao**: Grand World, VinWonders, Cáp treo Hòn Thơm, Lặn ngắm san hô Bãi Sao.
🍲 **Món ngon trứ danh**: Bún quậy, Gỏi cá trích, Hải sản Chợ đêm Phú Quốc.
☀️ **Thời điểm đẹp**: Tháng 10 - Tháng 4.
💡 **Mẹo HDV**: Thưởng thức bún quậy nhớ tự tay pha chén nước chấm theo công thức riêng nhé!`,

  'cần thơ': `🎩 **Dạ em chào quý khách! Cần thơ - Thủ phủ miền Tây sông nước kính chào quý khách!**

🚣 **Nét đẹp sông nước Tây Nam Bộ**:
• Đi thuyền sớm khám phá Chợ nổi Cái Răng tấp nập ghe thuyền.
• Dạo Bến Ninh Kiều, ghé Cồn Sơn trải nghiệm làm bánh dân gian & xem cá lóc bay.

🍲 **Ẩm thực đậm đà miền Tây**:
• Lẩu mắm Cần Thơ, Bánh xèo măng xơ đống, Bánh tét lá cẩm, Hủ tiếu giòn.

☀️ **Thời điểm đẹp**: Tháng 9 - 11 (Mùa nước nổi) hoặc Tháng 6 - 8 (Mùa trái cây chín mọng).
💡 **Mẹo HDV**: Hãy dậy thật sớm từ 5h00 sáng để đi chợ nổi Cái Răng nhộn nhịp nhất ạ!`,

  'tây ninh': `🎩 **Dạ em chào quý khách! Tây Ninh - Vùng đất thánh tâm linh xin chào!**

⛰️ **Chinh phục & Chiêm bái**:
• Trải nghiệm cáp treo lên đỉnh Núi Bà Đen (Nóc nhà Nam Bộ) chiêm bái Tượng Phật Bà Tây Bổ Đà Sơn.
• Thăm Tòa Thánh Tây Ninh với kiến trúc Đạo Cao Đài độc đáo.

🍲 **Đặc sản gây thương nhớ**:
• Bánh tráng phơi sương Trảng Bàng cuốn thịt luộc rau rừng, Bò tơ Tây Ninh, Muối tôm.

☀️ **Thời điểm đẹp**: Tháng 12 - Tháng 5 (Mùa khô ráo, thuận tiện đi lại).
💡 **Mẹo HDV**: Đừng quên mua Muối tôm Tây Ninh chính gốc về làm quà cho gia đình bạn bè nhé!`
};

// 🌐 ROUTING SERVER EXPRESS
app.get('/', (req, res) => {
  res.send('<h3>🎙️ Server Webhook Hướng Dẫn Viên Du Lịch 63 Tỉnh Thành đang hoạt động sẵn sàng!</h3>');
});

app.post('/', (req, res) => {
  const queryResult = req.body.queryResult || {};
  const userQuery = (queryResult.queryText || '').toLowerCase().trim();

  let replyText = '';
  let found = false;

  // 🔍 Lọc và tìm kiếm thông tin theo từ khóa tỉnh thành
  for (const [tinh, thongTin] of Object.entries(duLieuCacTinh)) {
    if (userQuery.includes(tinh)) {
      replyText = thongTin;
      found = true;
      break;
    }
  }

  // 🤖 Xử lý các tình huống câu hỏi chung nếu người dùng chưa nhập tên tỉnh
  if (!found) {
    if (userQuery.includes('ăn gì') || userQuery.includes('đặc sản')) {
      replyText = '🎩 **Dạ em chào quý khách!** Quý khách đang muốn tìm hiểu ẩm thực & đặc sản của tỉnh thành nào ạ? (Ví dụ: Đặc sản Hà Nội, Đặc sản Huế, Ăn gì ở Đà Lạt, Đặc sản Tây Ninh...) Quý khách cứ nói tên địa danh em sẽ tư vấn ngay nhé!';
    } else if (userQuery.includes('giá') || userQuery.includes('chi phí') || userQuery.includes('bao nhiêu')) {
      replyText = `🎩 **Dạ, em HDV xin tư vấn mức chi phí du lịch tham khảo ạ**:

💵 **Tour Tiết Kiệm (3N2Đ)**: ~ 2.000.000đ - 3.500.000đ/người (Khách sạn 2-3 sao, di chuyển xe khách/xe máy).
💎 **Tour Nghỉ Dưỡng (3N2Đ)**: ~ 4.500.000đ - 8.000.000đ/người (Khách sạn/Resort 4-5 sao, máy bay).

Quý khách muốn đi tỉnh nào em sẽ dự toán chi tiết hơn giúp mình nhé!`;
    } else {
      replyText = '🎩 **Dạ em chào quý khách! Em là Hướng dẫn viên du lịch cá nhân của mình đây ạ!** \n\nQuý khách muốn cùng em khám phá danh lam thắng cảnh, ẩm thực hay kinh nghiệm du lịch tại địa danh nào ạ? (Ví dụ: Hà Nội, Hà Giang, Hạ Long, Ninh Bình, Huế, Đà Nẵng, Hội An, Nha Trang, Đà Lạt, Sài Gòn, Vũng Tàu, Tây Ninh, Cần Thơ, Phú Quốc...)';
    }
  }

  return res.json({ fulfillmentText: replyText });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`HDV Server listening on port ${PORT}`);
});
