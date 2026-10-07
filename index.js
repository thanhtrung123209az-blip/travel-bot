import os
import re
import unicodedata
import requests
from flask import Flask, request, jsonify

app = Flask(__name__)

# ==============================================================================
# HÀM HOÀN NGUYÊN & CHUẨN HÓA CHUỖI (XỬ LÝ DẤU & NHẬN DẠNG THÔNG MINH)
# ==============================================================================
def remove_accents(text: str) -> str:
    """Xóa dấu tiếng Việt và đưa về chữ thường chuẩn"""
    if not text:
        return ""
    text = text.lower().strip()
    text = re.sub(r'^(tỉnh|thành phố|tp\.|tp)\s+', '', text)
    text = unicodedata.normalize('NFD', text)
    text = re.sub(r'[\u0300-\u036f]', '', text)
    text = text.replace('đ', 'd').replace('Đ', 'd')
    return text.strip()

# ==============================================================================
# CƠ SỞ DỮ LIỆU ĐẦY ĐỦ 63 TỈNH THÀNH VIỆT NAM (TỪ BẮC VÀO NAM)
# ==============================================================================
PROVINCES_DB = {
    # --- TÂY BẮC BỘ (6 TỈNH) ---
    "dien bien": {
        "name": "Tỉnh Điện Biên",
        "region": "Tây Bắc Bộ",
        "geography": "Núi cao hiểm trở, lòng chảo Mường Thanh bằng phẳng rộng lớn.",
        "history": "Gắn liền với chiến thắng Điện Biên Phủ lừng lẫy năm 1954.",
        "culture": "Đặc sắc văn hóa Thái, H'Mông, lễ hội Ban xòe hoa.",
        "food": ["Thịt trâu gác bếp", "Sâu chít", "Gạo mường thanh", "Pa pĩnh tộp"],
        "spots": ["Đồi A1", "Sân bay Mường Thanh", "Tượng đài Chiến thắng", "Đèo Pha Đin"],
        "best_season": "Tháng 3 (Mùa hoa ban) hoặc Tháng 5 (Kỷ niệm chiến thắng)",
        "base_daily_cost": {"economy": 350000, "standard": 700000, "luxury": 1500000}
    },
    "lai chau": {
        "name": "Tỉnh Lai Châu",
        "region": "Tây Bắc Bộ",
        "geography": "Vùng núi cao biên giới, nhiều đỉnh núi hùng vĩ như Pusilung, Putaleng.",
        "history": "Vùng đất lịch sử lâu đời của đồng bào dân tộc thiểu số Tây Bắc.",
        "culture": "Đa dạng nét sống 20 dân tộc, độc đáo với trang phục thổ cẩm.",
        "food": ["Lợn cắp nách", "Cá gập nướng", "Măng nứa", "Rượu ngô Sùng Phài"],
        "spots": ["Đèo Ô Quy Hồ", "Cao nguyên Sìn Hồ", "Đỉnh Putaleng", "Bản Sin Suối Hồ"],
        "best_season": "Tháng 9 - 10 (Mùa lúa chín Sìn Hồ)",
        "base_daily_cost": {"economy": 350000, "standard": 650000, "luxury": 1400000}
    },
    "son la": {
        "name": "Tỉnh Sơn La",
        "region": "Tây Bắc Bộ",
        "geography": "Cao nguyên Mộc Châu đồi núi chập chùng, khí hậu mát mẻ.",
        "history": "Nổi tiếng với Nhà tù Sơn La thời kỳ kháng chiến chống Pháp.",
        "culture": "Điệu xòe Thái cổ, văn hóa trà Ô Long và chăn nuôi bò sữa.",
        "food": ["Bê chao Mộc Châu", "Thịt muối chua", "Nộm da trâu", "Cơm lam"],
        "spots": ["Rừng thông Bản Áng", "Đồi chè Trái Tim", "Thác Dải Yếm", "Đỉnh Tà Xùa"],
        "best_season": "Tháng 11 - 2 (Mùa hoa cải, hoa mận, săn mây Tà Xùa)",
        "base_daily_cost": {"economy": 400000, "standard": 750000, "luxury": 1600000}
    },
    "hoa binh": {
        "name": "Tỉnh Hòa Bình",
        "region": "Tây Bắc Bộ",
        "geography": "Cửa ngõ Tây Bắc, có hồ thủy điện Hòa Bình rộng lớn.",
        "history": "Nơi khởi nguồn của Văn hóa Hòa Bình thời tiền sử.",
        "culture": "Đặc trưng văn hóa Mường, múa sạp, tiếng cồng chiêng.",
        "food": ["Cơm lam Mai Châu", "Thịt lợn mán thui lá bưởi", "Chả lá bưởi", "Rượu cần"],
        "spots": ["Thung lũng Mai Châu", "Hồ Hòa Bình", "Thác Gợt", "Bản Lác"],
        "best_season": "Tháng 10 - 4 (Thời tiết mát mẻ, lý tưởng nghỉ dưỡng)",
        "base_daily_cost": {"economy": 350000, "standard": 700000, "luxury": 1500000}
    },
    "lao cai": {
        "name": "Tỉnh Lào Cai",
        "region": "Tây Bắc Bộ",
        "geography": "Có đỉnh Fansipan - Nóc nhà Đông Dương và thị trấn Sa Pa.",
        "history": "Thương cảng biên giới quan trọng giữa Việt Nam và Trung Quốc.",
        "culture": "Đa dạng sắc tộc, nổi tiếng với Chợ tình Sa Pa, Chợ Bắc Hà.",
        "food": ["Thắng cố", "Lẩu cá hồi", "Lợn cắp nách", "Rượu Táo Mèo"],
        "spots": ["Đỉnh Fansipan", "Thị trấn Sa Pa", "Bản Cát Cát", "Chợ Bắc Hà"],
        "best_season": "Tháng 9 - 11 (Lúa chín) hoặc Tháng 12 - 2 (Săn tuyết)",
        "base_daily_cost": {"economy": 450000, "standard": 900000, "luxury": 2200000}
    },
    "yen bai": {
        "name": "Tỉnh Yên Bái",
        "region": "Tây Bắc Bộ",
        "geography": "Ruộng bậc thang Mù Cang Chải trúng danh thế giới.",
        "history": "Nơi diễn ra Khởi nghĩa Yên Bái năm 1930.",
        "culture": "Văn hóa dân tộc Mông, Lô Lô, lễ hội dù lượn Mù Cang Chải.",
        "food": ["Xôi ngũ sắc", "Cốm Tu Lệ", "Chè Shan Tuyết Suối Giàng", "Lạp xưởng"],
        "spots": ["Mù Cang Chải", "Đèo Khau Phạ", "Hồ Thác Bà", "Suối Giàng"],
        "best_season": "Tháng 9 - 10 (Mùa vàng ruộng bậc thang)",
        "base_daily_cost": {"economy": 350000, "standard": 700000, "luxury": 1500000}
    },

    # --- ĐÔNG BẮC BỘ (9 TỈNH) ---
    "ha giang": {
        "name": "Tỉnh Hà Giang",
        "region": "Đông Bắc Bộ",
        "geography": "Cao nguyên đá vôi hùng vĩ, công viên địa chất toàn cầu.",
        "history": "Mảnh đất địa đầu Tổ quốc kiên cường bảo vệ biên cương.",
        "culture": "Đặc sắc với Lễ cấp sắc người Dao, Chợ tình Khâu Vai.",
        "food": ["Thắng cố", "Bánh tam giác mạch", "Cháo tẩu tẩu", "Thịt trâu gác bếp"],
        "spots": ["Đèo Mã Pí Lèng", "Cột cờ Lũng Cú", "Sông Nho Quế", "Hoàng Su Phì"],
        "best_season": "Tháng 10 - 12 (Mùa hoa tam giác mạch)",
        "base_daily_cost": {"economy": 400000, "standard": 800000, "luxury": 1700000}
    },
    "cao bang": {
        "name": "Tỉnh Cao Bằng",
        "region": "Đông Bắc Bộ",
        "geography": "Địa hình hang động, sông suối non nước hữu tình.",
        "history": "Căn cứ địa cách mạng Pắc Bố, nơi Bác Hồ về nước năm 1941.",
        "culture": "Văn hóa Tày, Nùng, điệu hát Then và đàn Tính.",
        "food": ["Bánh áp chao", "Phở chua", "Lạp xưởng hun khói", "Hạt dẻ Trùng Khánh"],
        "spots": ["Thác Bản Giốc", "Hang Pắc Bố", "Đèo Khau Liêu", "Hồ Thủng"],
        "best_season": "Tháng 8 - 10 (Thác Bản Giốc đầy nước xanh trong)",
        "base_daily_cost": {"economy": 350000, "standard": 700000, "luxury": 1500000}
    },
    "bac kan": {
        "name": "Tỉnh Bắc Kạn",
        "region": "Đông Bắc Bộ",
        "geography": "Sở hữu Hồ Ba Bể - một trong những hồ nước ngọt tự nhiên lớn nhất.",
        "history": "Thuộc Chiến khu ATK Thái Nguyên - Bắc Kạn thời chống Pháp.",
        "culture": "Chèo thuyền độc mộc, hát Then truyền thống.",
        "food": ["Cá nướng Hồ Ba Bể", "Tôm chua", "Lợn sữa quay", "Măng vầu"],
        "spots": ["Hồ Ba Bể", "Động Puông", "Thác Đầu Đẳng", "Đền Thắm"],
        "best_season": "Tháng 2 - 5 (Hồ nước yên bình, khí hậu trong lành)",
        "base_daily_cost": {"economy": 300000, "standard": 650000, "luxury": 1300000}
    },
    "tuyen quang": {
        "name": "Tỉnh Tuyên Quang",
        "region": "Đông Bắc Bộ",
        "geography": "Đồi núi trung du, sông Lô chảy qua thơ mộng.",
        "history": "Thủ đô Khu giải phóng, Thủ đô Kháng chiến Tân Trào.",
        "culture": "Lễ hội Trung thu Tuyên Quang lớn nhất cả nước.",
        "food": ["Bánh nếp Tày", "Mắm ruộng Chiêm Hóa", "Vịt bầu Minh Hương", "Cam Sành"],
        "spots": ["Khu di tích Tân Trào", "Khu du lịch Na Hang", "Suối khoáng Mỹ Lâm"],
        "best_season": "Tháng 8 âm lịch (Dịp Lễ hội Trung Thu)",
        "base_daily_cost": {"economy": 300000, "standard": 600000, "luxury": 1300000}
    },
    "thai nguyen": {
        "name": "Tỉnh Thái Nguyên",
        "region": "Đông Bắc Bộ",
        "geography": "Địa hình trung du chuyển tiếp giữa đồng bằng và miền núi.",
        "history": "Trung tâm căn cứ địa ATK Định Hóa.",
        "culture": "Đệ nhất danh trà, văn hóa thưởng trà Việt Nam.",
        "food": ["Chè Tân Cương", "Cơm lam Định Hóa", "Bánh chưng bờ đậu", "Trám đen"],
        "spots": ["Đồi chè Tân Cương", "Hồ Núi Cốc", "ATK Định Hóa", "Hang Phượng Hoàng"],
        "best_season": "Quanh năm, đẹp nhất từ tháng 3 - 9",
        "base_daily_cost": {"economy": 300000, "standard": 600000, "luxury": 1200000}
    },
    "lang son": {
        "name": "Tỉnh Lạng Sơn",
        "region": "Đông Bắc Bộ",
        "geography": "Cửa khẩu giao thương trọng yếu, nhiều dãy núi vôi đẹp.",
        "history": "Nổi tiếng với ải Chi Lăng đánh tan quân Minh.",
        "culture": "Mua sắm chợ biên giới, lễ hội Lồng Tồng.",
        "food": ["Vịt quay Lạng Sơn", "Khâu nhục", "Phở chua", "Bánh áp chao"],
        "spots": ["Động Tam Thanh", "Núi Mẫu Sơn", "Ải Chi Lăng", "Chợ Kỳ Lừa"],
        "best_season": "Tháng 12 - 2 (Săn băng tuyết Mẫu Sơn)",
        "base_daily_cost": {"economy": 350000, "standard": 700000, "luxury": 1400000}
    },
    "bac giang": {
        "name": "Tỉnh Bắc Giang",
        "region": "Đông Bắc Bộ",
        "geography": "Vùng đồi núi trung du tiếp giáp đồng bằng sông Hồng.",
        "history": "Địa danh Yên Thế gắn liền với anh hùng Hoàng Hoa Thám.",
        "culture": "Quan họ Bắc Giang, thủ phủ vải thiều Lục Ngạn.",
        "food": ["Vải thiều Lục Ngạn", "Bánh đa Kế", "Mỳ Chũ", "Rượu làng Vân"],
        "spots": ["Chùa Vĩnh Nghiêm", "Khu du lịch Suối Mỡ", "Rừng nguyên sinh Tây Yên Tử"],
        "best_season": "Tháng 6 - 7 (Mùa vải thiều chín đỏ)",
        "base_daily_cost": {"economy": 300000, "standard": 600000, "luxury": 1200000}
    },
    "quang ninh": {
        "name": "Tỉnh Quảng Ninh",
        "region": "Đông Bắc Bộ",
        "geography": "Sở hữu Kỳ quan thiên nhiên thế giới Vịnh Hạ Long.",
        "history": "Chiến thắng Yên Tử, cội nguồn Thiền phái Trúc Lâm.",
        "culture": "Văn hóa công nhân mỏ than và du lịch biển đảo cao cấp.",
        "food": ["Chả mực Hạ Long", "Sá sùng Quan Lạn", "Bánh gật gù", "Gà đồi Tiên Yên"],
        "spots": ["Vịnh Hạ Long", "Đảo Cô Tô", "Quần thể Yên Tử", "Sun World Hạ Long"],
        "best_season": "Tháng 4 - 8 (Tắm biển) hoặc Tháng 1 - 3 (Lễ chùa Yên Tử)",
        "base_daily_cost": {"economy": 500000, "standard": 1100000, "luxury": 2800000}
    },
    "phu tho": {
        "name": "Tỉnh Phú Thọ",
        "region": "Đông Bắc Bộ",
        "geography": "Nơi hợp lưu của sông Hồng, sông Đa và sông Lô.",
        "history": "Đất Tổ Hùng Vương, cội nguồn dân tộc Việt Nam.",
        "culture": "Hát Xoan Phú Thọ - Di sản văn hóa phi vật thể thế giới.",
        "food": ["Thịt chua Thanh Sơn", "Bánh tai", "Rau sắn muối chua", "Cọ sống Nghĩa Quân"],
        "spots": ["Đền Hùng", "Vườn quốc gia Xuân Sơn", "Đồi chè Long Cốc"],
        "best_season": "Tháng 3 âm lịch (Dịp Giỗ Tổ Hùng Vương)",
        "base_daily_cost": {"economy": 300000, "standard": 650000, "luxury": 1300000}
    },

    # --- ĐỒNG BẰNG SÔNG HỒNG (10 TỈNH/THÀNH) ---
    "ha noi": {
        "name": "Thành phố Hà Nội",
        "region": "Đồng bằng sông Hồng",
        "geography": "Trung tâm đồng bằng Sông Hồng, sông Hồng chảy qua.",
        "history": "Thủ đô hơn 1000 năm văn hiến từ thời Lý Thái Tổ (1010).",
        "culture": "Văn hóa Tràng An thanh lịch, 36 phố phường, nghệ thuật múa rối nước.",
        "food": ["Phở Hà Nội", "Bún chả", "Chả cá Lăng", "Cốm làng Vòng", "Cà phê trứng"],
        "spots": ["Hồ Hoàn Kiếm", "Văn Miếu - Quốc Tử Giám", "Phố cổ Hà Nội", "Lăng Bác"],
        "best_season": "Tháng 9 - 11 (Mùa thu Hà Nội lãng mạn)",
        "base_daily_cost": {"economy": 450000, "standard": 900000, "luxury": 2500000}
    },
    "hai phong": {
        "name": "Thành phố Hải Phòng",
        "region": "Đồng bằng sông Hồng",
        "geography": "Thành phố Cảng ven biển, nổi tiếng với quần đảo Cát Bà.",
        "history": "Thành phố Hoa Phượng Đỏ, trung tâm công nghiệp lâu đời.",
        "culture": "Văn hóa Food Tour ẩm thực đường phố, nhịp sống sôi động.",
        "food": ["Bánh đa cua", "Bánh mì que", "Dừa dầm", "Nem cua bể", "Lẩu cua đồng"],
        "spots": ["Quần đảo Cát Bà", "Vịnh Lan Hạ", "Bãi biển Đồ Sơn", "Tuyệt Tình Cốc"],
        "best_season": "Tháng 4 - 10 (Du lịch biển và trải nghiệm Food Tour)",
        "base_daily_cost": {"economy": 400000, "standard": 800000, "luxury": 1900000}
    },
    "bac ninh": {
        "name": "Tỉnh Bắc Ninh",
        "region": "Đồng bằng sông Hồng",
        "geography": "Diện tích nhỏ nhất Việt Nam, trù phú kinh tế.",
        "history": "Vùng đất Kinh Bắc cổ kính, nôi Phật giáo Việt Nam.",
        "culture": "Dân ca Quan họ Bắc Ninh, Làng nghề tranh Kinh Bắc.",
        "food": ["Bánh phu thê Đình Bảng", "Nem Bùi", "Bánh đúc chim bồ câu", "Rượu làng Vân"],
        "spots": ["Chùa Dâu", "Chùa Bút Tháp", "Đền Đô", "Làng tranh Đông Hồ"],
        "best_season": "Tháng 1 - 3 (Mùa lễ hội Kinh Bắc)",
        "base_daily_cost": {"economy": 300000, "standard": 650000, "luxury": 1300000}
    },
    "ha nam": {
        "name": "Tỉnh Hà Nam",
        "region": "Đồng bằng sông Hồng",
        "geography": "Cửa ngõ phía Nam Thủ đô, địa hình đồng bằng và núi vôi.",
        "history": "Nhiều di tích chùa chiền và di sản văn hóa tâm linh.",
        "culture": "Lễ hội Tích điền Đọi Sơn, gốm Quyết Thành.",
        "food": ["Cá kho Làng Vũ Đại", "Bánh cuốn Phủ Lý", "Rượu Vọc", "Bún cá chấm"],
        "spots": ["Khu du lịch Tam Chúc", "Chùa Địa Tạng Phi Lai", "Làng Vũ Đại"],
        "best_season": "Tháng 1 - 3 (Du lịch tâm linh đầu năm)",
        "base_daily_cost": {"economy": 350000, "standard": 700000, "luxury": 1500000}
    },
    "hai duong": {
        "name": "Tỉnh Hải Dương",
        "region": "Đồng bằng sông Hồng",
        "geography": "Vùng đồng bằng trù phú nằm giữa Hà Nội và Hải Phòng.",
        "history": "Đất danh nhân kiệt xuất như Nguyễn Trãi, Chu Văn An.",
        "culture": "Múa rối nước Làng Ra, bánh đậu xanh truyền thống.",
        "food": ["Bánh đậu xanh", "Bánh gai Ninh Giang", "Rươi Tứ Kỳ", "Vải thiều Thanh Hà"],
        "spots": ["Khu di tích Côn Sơn - Kiếp Bạc", "Đảo Cò Chi Lăng Nam", "Chùa Thanh Mai"],
        "best_season": "Tháng 8 âm lịch (Lễ hội Côn Sơn - Kiếp Bạc)",
        "base_daily_cost": {"economy": 300000, "standard": 600000, "luxury": 1200000}
    },
    "hung yen": {
        "name": "Tỉnh Hưng Yên",
        "region": "Đồng bằng sông Hồng",
        "geography": "Đồng bằng sông Hồng phù sa màu mỡ.",
        "history": "Nổi tiếng thương cảng Phố Hiến \"Thứ nhất Kinh Kỳ, thứ nhì Phố Hiến\".",
        "culture": "Văn hóa phố cổ ven sông, đặc sản nhãn lồng.",
        "food": ["Nhãn lồng Hưng Yên", "Gà Đông Tảo", "Bún thang lươn", "Bánh răng dừa"],
        "spots": ["Phố Hiến", "Đền Chử Đồng Tử", "Làng nôm cổ", "Đền Mẫu"],
        "best_season": "Tháng 7 - 8 (Mùa nhãn lồng chín cây)",
        "base_daily_cost": {"economy": 300000, "standard": 600000, "luxury": 1200000}
    },
    "nam dinh": {
        "name": "Tỉnh Nam Định",
        "region": "Đồng bằng sông Hồng",
        "geography": "Vùng duyên hải đồng bằng sông Hồng có bờ biển dài.",
        "history": "Đất Tổ vương triều Trần lừng lẫy lịch sử.",
        "culture": "Lễ khai ấn Đền Trần, văn hóa nhà thờ Công giáo.",
        "food": ["Phở bò Nam Định", "Bánh xíu báo", "Kẹo Cổ Ngựa", "Nem nắm Giao Thủy"],
        "spots": ["Đền Trần", "Nhà thờ Đổ Hải Lý", "Vườn quốc gia Xuân Thủy", "Tòa giám mục Bùi Chu"],
        "best_season": "Tháng 1 - 3 (Lễ hội Đền Trần)",
        "base_daily_cost": {"economy": 300000, "standard": 650000, "luxury": 1300000}
    },
    "ninh binh": {
        "name": "Tỉnh Ninh Bình",
        "region": "Đồng bằng sông Hồng",
        "geography": "Quần thể di sản thế giới Tràng An, danh thắng ngập nước.",
        "history": "Cố đô Hoa Lư - Kinh đô đầu tiên của nhà nước phong kiến tập quyền.",
        "culture": "Văn hóa cố đô, Phật giáo tâm linh hoành tráng.",
        "food": ["Cơm cháy Ninh Bình", "Thịt dê núi", "Ốc núi", "Rượu Kim Sơn"],
        "spots": ["Quần thể Tràng An", "Tam Cốc - Bích Động", "Chùa Bái Đính", "Hang Múa"],
        "best_season": "Tháng 1 - 5 (Trẩy hội) hoặc Tháng 5 - 6 (Mùa lúa vàng Tam Cốc)",
        "base_daily_cost": {"economy": 400000, "standard": 850000, "luxury": 2000000}
    },
    "thai binh": {
        "name": "Tỉnh Thái Bình",
        "region": "Đồng bằng sông Hồng",
        "geography": "Được bao bọc bởi 3 mặt sông và biển, đất đai màu mỡ.",
        "history": "Quê hương chị Hai 5 tấn, giàu truyền thống cách mạng.",
        "culture": "Hát chèo Thái Bình, lễ hội Keo Thái Bình.",
        "food": ["Bánh cáy Thái Bình", "Canh cá Quỳnh Côi", "Bún bung", "Gỏi nhệch"],
        "spots": ["Chùa Keo", "Biển Đồng Châu", "Khu du lịch sinh thái Cồn Vành"],
        "best_season": "Tháng 9 - 11 (Cánh đồng lúa chín vàng trù phú)",
        "base_daily_cost": {"economy": 300000, "standard": 600000, "luxury": 1200000}
    },
    "vinh phuc": {
        "name": "Tỉnh Vĩnh Phúc",
        "region": "Đồng bằng sông Hồng",
        "geography": "Chuyển tiếp giữa trung du và đồng bằng, có thị trấn mây Tam Đảo.",
        "history": "Khu căn cứ kháng chiến và di tích danh thắng Tây Thiên.",
        "culture": "Văn hóa tâm linh Mẫu Tây Thiên, du lịch sinh thái.",
        "food": ["Rau su su Tam Đảo", "Cá thính Lập Thạch", "Bánh hòn Hợp Thịnh"],
        "spots": ["Thị trấn Tam Đảo", "Danh thắng Tây Thiên", "Hồ Đại Lải"],
        "best_season": "Tháng 4 - 10 (Trốn nóng tại Tam Đảo mát mẻ)",
        "base_daily_cost": {"economy": 400000, "standard": 800000, "luxury": 1800000}
    },

    # --- BẮC TRUNG BỘ (6 TỈNH) ---
    "thanh hoa": {
        "name": "Tỉnh Thanh Hóa",
        "region": "Bắc Trung Bộ",
        "geography": "Diện tích rộng lớn, hội tụ đủ biển, đồng bằng, miền núi.",
        "history": "Cội nguồn khởi nghĩa Lam Sơn, Di sản Thành Nhà Hồ.",
        "culture": "Văn hóa Đông Sơn cổ đại, điệu hò sông Mã.",
        "food": ["Nem chua Thanh Hóa", "Bánh răng bừa", "Chả tôm", "Mắm tép"],
        "spots": ["Bãi biển Sầm Sơn", "Thành Nhà Hồ", "Khu bảo tồn Pù Luông", "Pù Luông"],
        "best_season": "Tháng 5 - 8 (Tắm biển Sầm Sơn) hoặc Tháng 9 (Lúa Pù Luông)",
        "base_daily_cost": {"economy": 350000, "standard": 750000, "luxury": 1600000}
    },
    "nghe an": {
        "name": "Tỉnh Nghệ An",
        "region": "Bắc Trung Bộ",
        "geography": "Tỉnh có diện tích lớn nhất Việt Nam, bờ biển dài.",
        "history": "Quê hương Chủ tịch Hồ Chí Minh (Làng Sen Nam Đàn).",
        "culture": "Ví Giặm Nghệ Tĩnh - Di sản phi vật thể thế giới.",
        "food": ["Súp lươn Nghệ An", "Bánh mướt", "Nhút Thanh Chương", "Cam Xã Đoài"],
        "spots": ["Khu di tích Kim Liên", "Bãi biển Cửa Lò", "Vườn quốc gia Pù Mát"],
        "best_season": "Tháng 6 - 8 (Tắm biển Cửa Lò) hoặc Tháng 12 (Cánh đồng hoa hướng dương)",
        "base_daily_cost": {"economy": 350000, "standard": 700000, "luxury": 1500000}
    },
    "ha tinh": {
        "name": "Tỉnh Hà Tĩnh",
        "region": "Bắc Trung Bộ",
        "geography": "Địa hình hẹp ngang, phía Tây núi cao, phía Đông giáp biển.",
        "history": "Quê hương Đại thi hào Nguyễn Du, Ngã ba Đồng Lộc anh hùng.",
        "culture": "Hát Ví Giặm, truyền thống hiếu học lâu đời.",
        "food": ["Kẹo Cu Đơ", "Bánh tráng RAM", "Mực nhảy Vũng Áng", "Cam Bù Hương Sơn"],
        "spots": ["Ngã ba Đồng Lộc", "Bãi biển Thiên Cầm", "Khu di tích Nguyễn Du"],
        "best_season": "Tháng 5 - 8 (Du lịch biển Thiên Cầm)",
        "base_daily_cost": {"economy": 300000, "standard": 650000, "luxury": 1300000}
    },
    "quang binh": {
        "name": "Tỉnh Quảng Bình",
        "region": "Bắc Trung Bộ",
        "geography": "Vương quốc hang động thế giới Phong Nha - Kẻ Bàng.",
        "history": "Mảnh đất Quảng Bình quật cường, di tích Đèo Ngang.",
        "culture": "Văn hóa sông nước Phong Nha, hò khoan Lệ Thủy.",
        "food": ["Bánh bột lọc", "Cháo canh Quảng Bình", "Đẻn biển", "Khoai gieo"],
        "spots": ["Sơn Đoòng", "Động Phong Nha", "Động Thiên Đường", "Sông Chày - Hang Tối"],
        "best_season": "Tháng 4 - 8 (Mùa khô lý tưởng khám phá hang động)",
        "base_daily_cost": {"economy": 400000, "standard": 850000, "luxury": 2000000}
    },
    "quang tri": {
        "name": "Tỉnh Quảng Trị",
        "region": "Bắc Trung Bộ",
        "geography": "Vùng đất lửa lịch sử, nhiều di tích chiến trường xưa.",
        "history": "Vĩ tuyến 17, Cầu Hiền Lương - Sông Bến Hải chia cắt đất nước.",
        "culture": "Văn hóa tâm linh tri ân các anh hùng liệt sĩ.",
        "food": ["Thịt trâu lá trơng", "Bánh lọc Mỹ Chánh", "Bún hến Mai Xá", "Cháo vạt giường"],
        "spots": ["Thành cổ Quảng Trị", "Đảo Cồn Cỏ", "Địa đạo Vịnh Mốc", "Cầu Hiền Lương"],
        "best_season": "Tháng 4 - 7 (Mùa khô ráo)",
        "base_daily_cost": {"economy": 300000, "standard": 650000, "luxury": 1300000}
    },
    "thua thien hue": {
        "name": "Tỉnh Thừa Thiên Huế",
        "region": "Bắc Trung Bộ",
        "geography": "Nằm tựa lưng dãy Trường Sơn, có sông Hương núi Ngự.",
        "history": "Cố đô nhà Nguyễn - Kinh đô cuối cùng phong kiến Việt Nam.",
        "culture": "Nhã nhạc cung đình Huế, ẩm thực cung đình tỉ mỉ.",
        "food": ["Bún bò Huế", "Bánh bèo - nậm - lọc", "Cơm hến", "Chè hé", "Tôm chua"],
        "spots": ["Đại Nội Huế", "Chùa Thiên Mụ", "Lăng Khải Định", "Sông Hương"],
        "best_season": "Tháng 1 - 4 (Thời tiết dịu mát, thơ mộng)",
        "base_daily_cost": {"economy": 400000, "standard": 800000, "luxury": 1900000}
    },

    # --- NAM TRUNG BỘ (8 TỈNH/THÀNH) ---
    "da nang": {
        "name": "Thành phố Đà Nẵng",
        "region": "Nam Trung Bộ",
        "geography": "Thành phố đáng sống, bờ biển Mỹ Khê trải dài.",
        "history": "Trung tâm kinh tế - du lịch động lực của miền Trung.",
        "culture": "Hiện đại, thân thiện, Lễ hội Pháo hoa quốc tế DIFF.",
        "food": ["Mì Quảng", "Bánh tráng thịt heo", "Bún chả cá", "Hải sản tươi"],
        "spots": ["Bà Nà Hills", "Cầu Vàng", "Bán đảo Sơn Trà", "Biển Mỹ Khê"],
        "best_season": "Tháng 4 - 8 (Biển đẹp, mây xanh, nắng ấm)",
        "base_daily_cost": {"economy": 450000, "standard": 900000, "luxury": 2500000}
    },
    "quang nam": {
        "name": "Tỉnh Quảng Nam",
        "region": "Nam Trung Bộ",
        "geography": "Sở hữu 2 di sản thế giới: Phố cổ Hội An và Thánh địa Mỹ Sơn.",
        "history": "Thương cảng quốc tế Faifo sầm uất từ thế kỷ 16-17.",
        "culture": "Đèn lồng Phố cổ, bài chòi Hội An, làng gốm Thanh Hà.",
        "food": ["Cao lầu", "Cơm gà Hội An", "Mì Quảng", "Bánh đập hến xào"],
        "spots": ["Phố cổ Hội An", "Thánh địa Mỹ Sơn", "Cù Lao Chàm", "VinWonders Nam Hội An"],
        "best_season": "Tháng 2 - 7 (Trời khô ráo, nắng nhẹ)",
        "base_daily_cost": {"economy": 450000, "standard": 950000, "luxury": 2400000}
    },
    "quang ngai": {
        "name": "Tỉnh Quảng Ngãi",
        "region": "Nam Trung Bộ",
        "geography": "Có huyện đảo Lý Sơn - thiên đường tỏi và núi lửa cổ.",
        "history": "Đội hùng binh Hoàng Sa bảo vệ chủ quyền biển đảo.",
        "culture": "Văn hóa Đảo Lý Sơn, văn hóa Sa Huỳnh cổ đại.",
        "food": ["Mắm nhum", "Don Quảng Ngãi", "Tỏi Lý Sơn", "Bún cá dầm"],
        "spots": ["Đảo Lý Sơn", "Cổng Tò Vò", "Bãi biển Mỹ Khê Quảng Ngãi"],
        "best_season": "Tháng 4 - 8 (Biển êm để đi tàu ra đảo Lý Sơn)",
        "base_daily_cost": {"economy": 350000, "standard": 750000, "luxury": 1600000}
    },
    "binh dinh": {
        "name": "Tỉnh Bình Định",
        "region": "Nam Trung Bộ",
        "geography": "Đất võ trời văn, đường bờ biển Quy Nhơn thơ mộng.",
        "history": "Kinh đô Hoàng đế Thái Đức Nguyễn Nhạc, cái nôi võ thuật.",
        "culture": "Võ cổ truyền Bình Định, hát Bội, tháp Chăm cổ.",
        "food": ["Bánh hỏi lòng heo", "Bún chả cá Quy Nhơn", "Bánh xèo tôm nhảy", "Tré bình định"],
        "spots": ["Kỳ Co", "Eo Gió", "Tháp Bánh Ít", "Bảo tàng Quang Trung"],
        "best_season": "Tháng 3 - 9 (Nắng đẹp, tắm biển Kỳ Co)",
        "base_daily_cost": {"economy": 400000, "standard": 800000, "luxury": 1800000}
    },
    "phu yen": {
        "name": "Tỉnh Phú Yên",
        "region": "Nam Trung Bộ",
        "geography": "Xứ sở Hoa vàng trên cỏ xanh, địa chất Gành Đá Đĩa độc nhất.",
        "history": "Cực Đông đất liền - Mũi Điện đón bình minh đầu tiên.",
        "culture": "Văn hóa biển hoang sơ, mộc mạc và chân chất.",
        "food": ["Mắt cá ngừ đại dương", "Bánh hỏi lòng heo", "Cháo hàu", "Sò huyết Ô Đầm"],
        "spots": ["Gành Đá Đĩa", "Mũi Điện", "Tháp Nghinh Phong", "Bãi Xép"],
        "best_season": "Tháng 3 - 8 (Mùa nắng khô ráo)",
        "base_daily_cost": {"economy": 350000, "standard": 750000, "luxury": 1600000}
    },
    "khanh hoa": {
        "name": "Tỉnh Khánh Hòa",
        "region": "Nam Trung Bộ",
        "geography": "Thành phố biển Nha Trang, Vịnh Cam Ranh nước sâu.",
        "history": "Thủ phủ yến sào và du lịch nghỉ dưỡng quốc tế lâu đời.",
        "culture": "Văn hóa Chăm Pa Tháp Bà Ponagar, lễ hội Cầu Ngư.",
        "food": ["Bún cá Nha Trang", "Yến sào Khánh Hòa", "Bánh căn", "Nem nướng Ninh Hòa"],
        "spots": ["VinWonders Nha Trang", "Tháp Bà Ponagar", "Đảo Điệp Sơn", "Vịnh Vân Phong"],
        "best_season": "Tháng 1 - 8 (Thời tiết đẹp rực rỡ)",
        "base_daily_cost": {"economy": 450000, "standard": 950000, "luxury": 2600000}
    },
    "ninh thuan": {
        "name": "Tỉnh Ninh Thuận",
        "region": "Nam Trung Bộ",
        "geography": "Vùng đất nắng và gió, có Vịnh Vĩnh Hy tuyệt đẹp.",
        "history": "Thủ phủ văn hóa Chăm lớn nhất Việt Nam.",
        "culture": "Tháp Chăm Po Klong Garai, làng gốm Bàu Trúc cổ nhất Đông Nam Á.",
        "food": ["Nho Phan Rang", "Thịt cừu - dê", "Bánh xèo Phan Rang", "Bánh căn"],
        "spots": ["Vịnh Vĩnh Hy", "Tháp Po Klong Garai", "Đồng cừu An Hòa", "Hang Rái"],
        "best_season": "Tháng 8 - 10 (Mùa nho chín mọng)",
        "base_daily_cost": {"economy": 350000, "standard": 700000, "luxury": 1500000}
    },
    "binh thuan": {
        "name": "Tỉnh Bình Thuận",
        "region": "Nam Trung Bộ",
        "geography": "Nổi tiếng với Đồi cát Mũi Né được ví như tiểu sa mạc.",
        "history": "Trường Dục Thanh nơi Bác Hồ từng dừng chân dạy học.",
        "culture": "Lễ hội Kate người Chăm, văn hóa nước mắm Phan Thiết.",
        "food": ["Thanh long Bình Thuận", "Lẩu thả Phan Thiết", "Bánh rế", "Răng mực"],
        "spots": ["Mũi Né", "Đồi Cát Bay", "Đảo Phú Quý", "Bãi đá Cổ Thạch"],
        "best_season": "Tháng 11 - 4 năm sau (Trời trong xanh, đồi cát đẹp)",
        "base_daily_cost": {"economy": 400000, "standard": 850000, "luxury": 2000000}
    },

    # --- TÂY NGUYÊN (5 TỈNH) ---
    "kon tum": {
        "name": "Tỉnh Kon Tum",
        "region": "Tây Nguyên",
        "geography": "Ngã ba Đông Dương (Một con gà gáy 3 nước cùng nghe).",
        "history": "Địa danh ngục Kon Tum thời kháng chiến.",
        "culture": "Không gian văn hóa Cồng chiêng Tây Nguyên, Nhà rông Ba Na.",
        "food": ["Gỏi lá Kon Tum", "Gà nướng cơm lam", "Heo mũk", "Cà phê Kon Tum"],
        "spots": ["Nhà thờ Gỗ Kon Tum", "Cầu treo Kon Klor", "Măng Đen"],
        "best_season": "Tháng 11 - 3 (Mùa dã quỳ và không gian lạnh Măng Đen)",
        "base_daily_cost": {"economy": 350000, "standard": 700000, "luxury": 1500000}
    },
    "gia lai": {
        "name": "Tỉnh Gia Lai",
        "region": "Tây Nguyên",
        "geography": "Cao nguyên Pleiku mát mẻ với Hồ T'Nưng (Biển Hồ).",
        "history": "Chiến thắng Đường 7 - Sông Bổn năm 1975.",
        "culture": "Văn hóa Jrai, Bahnar, trường ca Đăm San.",
        "food": ["Phở hai tô Pleiku", "Bún mắm nêm", "Bò một nắng", "Muối kiến vàng"],
        "spots": ["Biển Hồ T'Nưng", "Núi lửa Chư Đăng Ya", "Thác Phú Cường"],
        "best_season": "Tháng 11 - 2 (Mùa dã quỳ nở vàng núi lửa)",
        "base_daily_cost": {"economy": 350000, "standard": 700000, "luxury": 1500000}
    },
    "dak lak": {
        "name": "Tỉnh Đắk Lắk",
        "region": "Tây Nguyên",
        "geography": "Thủ phủ cà phê Việt Nam, Buôn Ma Thuột sầm uất.",
        "history": "Trận Buôn Ma Thuột mở màn chiến dịch Hồ Chí Minh 1975.",
        "culture": "Văn hóa voi Buôn Đôn, lễ hội Cà phê Buôn Ma Thuột.",
        "food": ["Cà phê Buôn Ma Thuột", "Bún đỏ", "Lẩu rau rừng", "Cá lăng sông Sêrêpốk"],
        "spots": ["Bảo tàng Cà phê", "Buôn Đôn", "Thác Dray Nur", "Hồ Lắk"],
        "best_season": "Tháng 12 - 3 (Mùa hoa cà phê nở trắng trời)",
        "base_daily_cost": {"economy": 350000, "standard": 750000, "luxury": 1600000}
    },
    "dak nong": {
        "name": "Tỉnh Đắk Nông",
        "region": "Tây Nguyên",
        "geography": "Công viên địa chất toàn cầu với hệ thống hang động núi lửa dài nhất ĐNÁ.",
        "history": "Vùng đất huyền thoại với đồng bào M'Nông.",
        "culture": "Sử thi M'Nông, văn hóa cồng chiêng độc đáo.",
        "food": ["Rượu cần", "Cơm lam", "Cà đắng", "Cá lăng nướng"],
        "spots": ["Tà Đùng (Vịnh Hạ Long Tây Nguyên)", "Thác Đray Sáp", "Hang động Volcanic"],
        "best_season": "Tháng 11 - 4 (Mùa khô Tà Đùng xanh ngắt)",
        "base_daily_cost": {"economy": 350000, "standard": 700000, "luxury": 1400000}
    },
    "lam dong": {
        "name": "Tỉnh Lâm Đồng",
        "region": "Tây Nguyên",
        "geography": "Thành phố ngàn hoa Đà Lạt trên cao nguyên Langbiang.",
        "history": "Khám phá bởi bác sĩ Alexandre Yersin năm 1893.",
        "culture": "Đà Lạt lãng mạn, kiến trúc Pháp cổ, văn hóa trà Bảo Lộc.",
        "food": ["Bánh mì xíu mại", "Bánh căn Đà Lạt", "Lẩu gà lá é", "Kem bơ"],
        "spots": ["Hồ Xuân Hương", "Langbiang", "Thung lũng Tình Yêu", "Thác Datanla"],
        "best_season": "Tháng 11 - 3 (Mùa hoa dã quỳ, mai anh đào)",
        "base_daily_cost": {"economy": 450000, "standard": 900000, "luxury": 2200000}
    },

    # --- ĐÔNG NAM BỘ (6 TỈNH/THÀNH) ---
    "tp ho chi minh": {
        "name": "Thành phố Hồ Chí Minh",
        "region": "Đông Nam Bộ",
        "geography": "Trung tâm kinh tế lớn nhất Việt Nam, hệ thống sông Sài Gòn.",
        "history": "Hơn 300 năm hình thành (Sài Gòn - Gia Định xưa).",
        "culture": "Năng động, sầm uất, ẩm thực đường phố hội tụ đa dạng.",
        "food": ["Cơm tấm Sài Gòn", "Bánh mì Sài Gòn", "Hủ tiếu Nam Vang", "Ốc đêm Sài Gòn"],
        "spots": ["Dinh Độc Lập", "Nhà thờ Đức Bà", "Chợ Bến Thành", "Địa đạo Củ Chi"],
        "best_season": "Tháng 12 - 4 (Mùa khô ráo, nắng đẹp)",
        "base_daily_cost": {"economy": 500000, "standard": 1000000, "luxury": 2800000}
    },
    "ba ria vung tau": {
        "name": "Tỉnh Bà Rịa - Vũng Tàu",
        "region": "Đông Nam Bộ",
        "geography": "Thành phố biển nghỉ dưỡng cận kề TP.HCM, Côn Đảo.",
        "history": "Địa danh Côn Đảo - di tích lịch sử đặc biệt quốc gia.",
        "culture": "Nghỉ dưỡng biển, văn hóa tâm linh Chị Võ Thị Sáu.",
        "food": ["Bánh khọt Vũng Tàu", "Lẩu cá đuối", "Hải sản tươi", "Bánh bông lan trứng muối"],
        "spots": ["Tượng Chúa Kitô", "Hải đăng Vũng Tàu", "Côn Đảo", "Bãi Sau"],
        "best_season": "Quanh năm, đẹp nhất từ tháng 11 - 4",
        "base_daily_cost": {"economy": 450000, "standard": 900000, "luxury": 2300000}
    },
    "binh duong": {
        "name": "Tỉnh Bình Dương",
        "region": "Đông Nam Bộ",
        "geography": "Thuộc vùng kinh tế trọng điểm phía Nam, giáp TP.HCM.",
        "history": "Thủ phủ công nghiệp sầm uất, làng nghề truyền thống.",
        "culture": "Gốm sứ Lái Thiêu, sơn mài Tương Bình Hiệp.",
        "food": ["Bánh bèo bì Bún Tàu", "Lăng măng chua", "Măng cụt Lái Thiêu"],
        "spots": ["Khu du lịch Đại Nam", "Chùa Bà Thiên Hậu", "Hồ Dầu Tiếng"],
        "best_season": "Tháng 5 - 8 (Mùa trái cây Lái Thiêu chín rộ)",
        "base_daily_cost": {"economy": 350000, "standard": 700000, "luxury": 1500000}
    },
    "binh phuoc": {
        "name": "Tỉnh Bình Phước",
        "region": "Đông Nam Bộ",
        "geography": "Đất đỏ bazán, thủ phủ điều và cao su Việt Nam.",
        "history": "Căn cứ Tà Thiết - Bộ chỉ huy Chiến dịch Hồ Chí Minh.",
        "culture": "Văn hóa S'Tiêng, lễ hội mừng lúa mới.",
        "food": ["Hạt điều rang muối", "Đọt mây nướng", "Lợn thả rông", "Rượu cần"],
        "spots": ["Trảng cỏ Bàu Lách", "Căn cứ Tà Thiết", "Thác Mơ"],
        "best_season": "Tháng 12 - 3 (Mùa cao su thay lá đỏ lãng mạn)",
        "base_daily_cost": {"economy": 300000, "standard": 600000, "luxury": 1200000}
    },
    "dong nai": {
        "name": "Tỉnh Đồng Nai",
        "region": "Đông Nam Bộ",
        "geography": "Sở hữu Vườn quốc gia Cát Tiên - Khu trữ lượng sinh quyển.",
        "history": "Trấn Biên xưa - Vùng đất khai phá Nam Bộ sớm.",
        "culture": "Văn hóa Chơ Ro, làng bưởi Tân Triều.",
        "food": ["Bưởi Tân Triều", "Lẩu khổ qua rừng", "Gỏi cá Biên Hòa"],
        "spots": ["Vườn quốc gia Cát Tiên", "Khu du lịch Bửu Long", "Thác Giang Điền"],
        "best_season": "Tháng 12 - 5 (Mùa khô đi rừng Cát Tiên)",
        "base_daily_cost": {"economy": 350000, "standard": 700000, "luxury": 1500000}
    },
    "tay ninh": {
        "name": "Tỉnh Tây Ninh",
        "region": "Đông Nam Bộ",
        "geography": "Có Nóc nhà Nam Bộ - Núi Bà Đen cao 986m.",
        "history": "Trung tâm Tòa thánh Cao Đài và Căn cứ Trung ương Cục.",
        "culture": "Đạo Cao Đài, lễ hội Núi Bà Đen linh thiêng.",
        "food": ["Bánh tráng phơi sương", "Muối tôm Tây Ninh", "Bánh canh Trảng Bàng"],
        "spots": ["Núi Bà Đen", "Tòa Thánh Tây Ninh", "Hồ Dầu Tiếng"],
        "best_season": "Tháng 1 - 3 (Lễ chùa Núi Bà Đen đầu năm)",
        "base_daily_cost": {"economy": 350000, "standard": 700000, "luxury": 1500000}
    },

    # --- ĐỒNG BẰNG SÔNG CỬU LONG (13 TỈNH/THÀNH) ---
    "can tho": {
        "name": "Thành phố Cần Thơ",
        "region": "Đồng bằng sông Cửu Long",
        "geography": "Thủ phủ Tây Đô, trung tâm miền Tây sông nước.",
        "history": "Sầm uất lâu đời từ thời khai hoang mở cõi Nam Bộ.",
        "culture": "Văn hóa Chợ nổi, đờn ca tài tử Nam Bộ.",
        "food": ["Bánh xèo Cần Thơ", "Lẩu mắm", "Lẩu vịt nấu chao", "Trái cây miệt vườn"],
        "spots": ["Chợ nổi Cái Răng", "Bến Ninh Kiều", "Nhà cổ Bình Thủy"],
        "best_season": "Tháng 6 - 8 (Trái cây chín) hoặc Tháng 9 - 11 (Mùa nước nổi)",
        "base_daily_cost": {"economy": 350000, "standard": 750000, "luxury": 1800000}
    },
    "an giang": {
        "name": "Tỉnh An Giang",
        "region": "Đồng bằng sông Cửu Long",
        "geography": "Sở hữu dãy Thất Sơn (Bảy Núi) hùng vĩ và Rừng tràm Tra Cứu.",
        "history": "Vùng đất huyền bí, Miếu Bà Chúa Xứ Núi Sam.",
        "culture": "Giao thoa văn hóa Việt, Hoa, Chăm, Khmer.",
        "food": ["Mắm Châu Đốc", "Bún cá Long Xuyên", "Bánh thốt nốt", "Tung lăm vĩ"],
        "spots": ["Rừng tràm Trà Cư", "Miếu Bà Chúa Xứ", "Núi Cấm", "Hồ Tà Pạ"],
        "best_season": "Tháng 9 - 11 (Mùa nước nổi tràm xanh tuyệt đẹp)",
        "base_daily_cost": {"economy": 350000, "standard": 700000, "luxury": 1500000}
    },
    "bac lieu": {
        "name": "Tỉnh Bạc Liêu",
        "region": "Đồng bằng sông Cửu Long",
        "geography": "Vùng duyên hải Bán đảo Cà Mau, đồng muối trắng.",
        "history": "Gắn liền với giai thoại Công tử Bạc Liêu lừng danh.",
        "culture": "Quê hương bản Dạ cổ hoài lang của Cố nhạc sĩ Cao Văn Lầu.",
        "food": ["Lẩu mắm Bạc Liêu", "Bánh tằm Nắng Xẻo", "Bún nước lèo", "Đuông dừa"],
        "spots": ["Nhà Công tử Bạc Liêu", "Cánh đồng quạt gió", "Chùa Ghositaram"],
        "best_season": "Tháng 10 - 4 (Thời tiết nắng ráo đi cánh đồng quạt gió)",
        "base_daily_cost": {"economy": 350000, "standard": 700000, "luxury": 1500000}
    },
    "ben tre": {
        "name": "Tỉnh Bến Tre",
        "region": "Đồng bằng sông Cửu Long",
        "geography": "Được hợp thành bởi 3 cù lao rộng lớn rợp bóng dừa.",
        "history": "Quê hương Đồng Khởi quật cường thời kháng chiến.",
        "culture": "Xứ sở Dừa Việt Nam, du lịch sinh thái miệt vườn.",
        "food": ["Kẹo dừa Bến Tre", "Cơm dừa", "Gỏi củ dừa", "Bánh xèo hến"],
        "spots": ["Cồn Phụng", "Sân chim Vàm Hồ", "Khu du lịch Lan Vương"],
        "best_season": "Tháng 6 - 8 (Mùa trái cây trù phú)",
        "base_daily_cost": {"economy": 300000, "standard": 650000, "luxury": 1400000}
    },
    "ca mau": {
        "name": "Tỉnh Cà Mau",
        "region": "Đồng bằng sông Cửu Long",
        "geography": "Mảnh đất cực Nam Tổ quốc, 3 mặt tiếp giáp biển.",
        "history": "Địa đầu phía Nam với Hệ sinh thái Rừng ngập mặn U Minh.",
        "culture": "Đời sống xóm Rạch, len lỏi sông nước Cà Mau.",
        "food": ["Cua Cà Mau", "Lẩu U Minh", "Cá thòi lòi nướng muối ớt", "Ase mắm"],
        "spots": ["Cột mốc Mũi Cà Mau", "Vườn quốc gia U Minh Hạ", "Hòn Đá Bạc"],
        "best_season": "Tháng 12 - 4 (Mùa khô dễ di chuyển thăm Đất Mũi)",
        "base_daily_cost": {"economy": 400000, "standard": 800000, "luxury": 1600000}
    },
    "dong thap": {
        "name": "Tỉnh Đồng Tháp",
        "region": "Đồng bằng sông Cửu Long",
        "geography": "Thủ phủ Hoa sen và Đất sen hồng Tháp Mười.",
        "history": "Căn cứ Xẻo Quýt hào hùng thời chống Mỹ.",
        "culture": "Văn hóa sen, Làng hoa kiểng Sa Đéc hơn 100 năm.",
        "food": ["Hủ tiếu Sa Đéc", "Nem Lai Vung", "Cơm gói lá sen", "Cá lóc nướng trui"],
        "spots": ["Làng hoa Sa Đéc", "Khu di tích Xẻo Quýt", "Vườn quốc gia Tràm Chim"],
        "best_season": "Tháng 12 - 1 (Cận Tết ngắm Làng hoa Sa Đéc)",
        "base_daily_cost": {"economy": 350000, "standard": 700000, "luxury": 1400000}
    },
    "hau giang": {
        "name": "Tỉnh Hậu Giang",
        "region": "Đồng bằng sông Cửu Long",
        "geography": "Nằm ở trung tâm châu thổ sông Mê Kông.",
        "history": "Tách ra từ tỉnh Cần Thơ cũ năm 2004.",
        "culture": "Trải nghiệm chợ nổi Ngã Bảy huyền thoại.",
        "food": ["Chả cá thát lát", "Khóm Cầu Đúc", "Đọt choại luộc", "Sữa khóm"],
        "spots": ["Khu bảo tồn Tây Cung", "Chợ nổi Ngã Bảy", "Công viên Xà No"],
        "best_season": "Tháng 6 - 9 (Mùa thu hoạch Khóm Cầu Đúc)",
        "base_daily_cost": {"economy": 300000, "standard": 600000, "luxury": 1200000}
    },
    "kien giang": {
        "name": "Tỉnh Kiên Giang",
        "region": "Đồng bằng sông Cửu Long",
        "geography": "Sở hữu đảo Ngọc Phú Quốc - Thiên đường du lịch quốc tế.",
        "history": "Trận Hà Tiên gắn với dòng họ Mạc khai phá.",
        "culture": "Văn hóa biển đảo, nước mắm Phú Quốc truyền thống.",
        "food": ["Bún quậy Phú Quốc", "Gỏi cá trích", "Nước mắm Phú Quốc", "Còi biên mai"],
        "spots": ["Thành phố Phú Quốc", "Grand World", "Quần đảo Nam Du", "Hà Tiên"],
        "best_season": "Tháng 11 - 4 năm sau (Mùa khô Phú Quốc biển êm ngắt)",
        "base_daily_cost": {"economy": 500000, "standard": 1100000, "luxury": 3000000}
    },
    "long an": {
        "name": "Tỉnh Long An",
        "region": "Đồng bằng sông Cửu Long",
        "geography": "Cửa ngõ kết nối TP.HCM với 12 tỉnh miền Tây.",
        "history": "Vùng đất \"Trung dũng gia cường, toàn dân đánh giặc\".",
        "culture": "Vàm Cỏ Đông, Vàm Cỏ Tây đi vào thơ ca.",
        "food": ["Gạo tài nguyên Chợ Đào", "Lạp xưởng tươi", "Thanh long Châu Thành"],
        "spots": ["Làng cổ Phước Lộc Thọ", "Khu du lịch Cát Tường Phú Sinh", "Tân Lập"],
        "best_season": "Tháng 9 - 11 (Mùa nước nổi rừng tràm Tân Lập)",
        "base_daily_cost": {"economy": 300000, "standard": 650000, "luxury": 1300000}
    },
    "soc trang": {
        "name": "Tỉnh Sóc Trăng",
        "region": "Đồng bằng sông Cửu Long",
        "geography": "Vùng ven biển cửa sông Hậu rợp bóng dừa.",
        "history": "Nơi hội tụ đậm nét văn hóa 3 dân tộc Kinh - Hoa - Khmer.",
        "culture": "Lễ hội Đua ghe Ngo Oóc Om Bóc, Chùa Chén Kiểu.",
        "food": ["Bánh pía Sóc Trăng", "Bún nước lèo", "Bánh cống", "Mè láo"],
        "spots": ["Chùa Dơi", "Chùa Chén Kiểu", "Chùa Som Rong", "Bảo tàng Khmer"],
        "best_season": "Tháng 10 âm lịch (Dịp lễ hội Đua ghe Ngo náo nhiệt)",
        "base_daily_cost": {"economy": 300000, "standard": 650000, "luxury": 1300000}
    },
    "tien giang": {
        "name": "Tỉnh Tiền Giang",
        "region": "Đồng bằng sông Cửu Long",
        "geography": "Trải dài dọc bờ sông Tiền trù phú trái ngọt.",
        "history": "Chiến thắng Rạch Gầm - Xoài Mút của Nguyễn Huệ năm 1785.",
        "culture": "Du lịch Cù lao Thới Sơn, văn hóa chợ Mỹ Tho.",
        "food": ["Hủ tiếu Mỹ Tho", "Vú sữa Lò Rèn", "Sầu riêng Cẩm Sơn", "Mắm còng"],
        "spots": ["Cù lao Thới Sơn", "Chùa Vĩnh Tràng", "Chợ nổi Cái Bè"],
        "best_season": "Tháng 5 - 7 (Mùa trái cây chín trù phú)",
        "base_daily_cost": {"economy": 300000, "standard": 650000, "luxury": 1300000}
    },
    "tra vinh": {
        "name": "Tỉnh Trà Vinh",
        "region": "Đồng bằng sông Cửu Long",
        "geography": "Địa hình duyên hải ven biển, nhiều giồng cát duyên hải.",
        "history": "Thủ phủ cổ kính với hơn 140 ngôi chùa Khmer độc đáo.",
        "culture": "Văn hóa Khmer, cây dầu cổ thụ hàng trăm năm.",
        "food": ["Dừa sáp Trà Vinh", "Bún nước lèo", "Bánh canh Bến Có", "Chù khú"],
        "spots": ["Ao Bà Om", "Chùa Hang", "Biển Ba Động", "Chùa Ang"],
        "best_season": "Tháng 4 âm lịch (Lễ Chol Chnam Thmay người Khmer)",
        "base_daily_cost": {"economy": 300000, "standard": 600000, "luxury": 1200000}
    },
    "vinh long": {
        "name": "Tỉnh Vĩnh Long",
        "region": "Đồng bằng sông Cửu Long",
        "geography": "Nằm giữa hai nhánh sông Tiền và sông Hậu bồi đắp phù sa.",
        "history": "Vùng đất Long Hồ dinh nổi tiếng thời Nam Bộ cổ.",
        "culture": "Miệt vườn Cù lao An Bình, làng gốm gạch đỏ.",
        "food": ["Bưởi Năm Roi Bình Minh", "Cá cháy sông Hậu", "Khoai lang Bình Tân"],
        "spots": ["Cù lao An Bình", "Chùa Phật Ngọc Xá Lợi", "Làng gạch Mang Thít"],
        "best_season": "Tháng 5 - 8 (Trải nghiệm miệt vườn cây trái)",
        "base_daily_cost": {"economy": 300000, "standard": 650000, "luxury": 1300000}
    }
}

# Bảng tra cứu Alias bổ sung giúp nhận diện viết tắt/tên thường gọi
EXTRA_ALIASES = {
    "hn": "ha noi", "thudo": "ha noi", "hathanh": "ha noi",
    "hpg": "hai phong", "sg": "tp ho chi minh", "saigon": "tp ho chi minh",
    "tphcm": "tp ho chi minh", "hcm": "tp ho chi minh", "dn": "da nang",
    "ct": "can tho", "dl": "lam dong", "dalat": "lam dong",
    "pq": "kien giang", "phuquoc": "kien giang", "vt": "ba ria vung tau",
    "vungtau": "ba ria vung tau"
}

# ==============================================================================
# THUẬT TOÁN BẮT TÊN TỈNH THÀNH TRONG CÂU NÓI BẤT KỲ
# ==============================================================================
def find_province_in_text(raw_text: str) -> str:
    """Thuật toán quét từ khóa thông minh để trích xuất tên tỉnh"""
    if not raw_text:
        return ""
    
    clean_text = remove_accents(str(raw_text))
    
    # 1. Tra cứu Alias nhanh
    for alias, target_key in EXTRA_ALIASES.items():
        if re.search(r'\b' + alias + r'\b', clean_text):
            return target_key

    # 2. Quét khớp chính xác từ cơ sở dữ liệu 63 tỉnh
    # Ưu tiên các tên dài trước để tránh khớp nhầm
    sorted_keys = sorted(PROVINCES_DB.keys(), key=lambda x: len(x), reverse=True)
    for key in sorted_keys:
        if key in clean_text:
            return key
            
    return ""

# ==============================================================================
# THUẬT TOÁN TÍNH CHI PHÍ DU LỊCH LINH HOẠT
# ==============================================================================
def calculate_cost_engine(province_key: str, days: int = 2, people: int = 1, budget: str = "standard", transport: str = "bus"):
    data = PROVINCES_DB.get(province_key, PROVINCES_DB["ha noi"])
    
    # Chuẩn hóa tham số
    days = max(1, int(days))
    people = max(1, int(people))
    budget_type = budget.lower() if budget.lower() in ["economy", "standard", "luxury"] else "standard"
    
    daily_cost_per_person = data["base_daily_cost"].get(budget_type, 800000)
    
    # Bảng chi phí di chuyển ước tính khứ hồi / người
    transport_rates = {
        "motorbike": 150000, # Chi phí xăng
        "bus": 400000,       # Xe khách
        "train": 700000,     # Tàu hỏa
        "flight": 1800000    # Máy bay
    }
    trans_fee = transport_rates.get(transport.lower(), 400000)
    
    total_living = daily_cost_per_person * days * people
    total_transport = trans_fee * people
    contingency = (total_living + total_transport) * 0.1 # 10% chi phí dự phòng
    
    grand_total = int(total_living + total_transport + contingency)
    
    budget_labels = {"economy": "Tiết kiệm", "standard": "Tiêu chuẩn", "luxury": "Cao cấp"}
    
    return {
        "province": data["name"],
        "days": days,
        "people": people,
        "budget_label": budget_labels[budget_type],
        "daily_per_person": daily_cost_per_person,
        "total": grand_total
    }

# ==============================================================================
# THUẬT TOÁN DỰ BÁO THỜI TIẾT & LỜI KHUYÊN DỊP DU LỊCH
# ==============================================================================
def get_weather_engine(province_key: str) -> str:
    data = PROVINCES_DB.get(province_key)
    p_name = data["name"] if data else province_key.title()
    
    # Thử lấy thời tiết thực tế từ OpenWeatherMap API (nếu có cài API Key trên Render)
    api_key = os.environ.get("OPENWEATHER_API_KEY")
    if api_key:
        try:
            url = f"http://api.openweathermap.org/data/2.5/weather?q={p_name},VN&appid={api_key}&units=metric&lang=vi"
            res = requests.get(url, timeout=3).json()
            if res.get("cod") == 200:
                temp = res["main"]["temp"]
                desc = res["weather"][0]["description"]
                humidity = res["main"]["humidity"]
                return f"☀️ **Thời tiết hiện tại ở {p_name}:** {temp}°C, {desc}, độ ẩm {humidity}%.\n💡 **Khuyên dùng:** {data['best_season']}."
        except Exception:
            pass
            
    # Mặc định sử dụng Dữ liệu thời điểm du lịch đẹp nhất theo mùa khí hậu
    if data:
        return f"🌦️ **Thời tiết & Mùa du lịch đẹp nhất tại {data['name']}:**\n👉 {data['best_season']}."
    return f"Bạn nên xem trước thời tiết tại {p_name} trước ngày di chuyển 3-5 ngày."

# ==============================================================================
# DIALOGFLOW WEBHOOK ENDPOINT
# ==============================================================================
@app.route('/webhook', methods=['POST'])
def webhook():
    req = request.get_json(silent=True, force=True)
    query_result = req.get('queryResult', {})
    intent_name = query_result.get('intent', {}).get('displayName', '')
    parameters = query_result.get('parameters', {})
    query_text = query_result.get('queryText', '')
    
    # Trích xuất tên tỉnh từ parameters hoặc trực tiếp từ câu hỏi
    raw_prov_param = parameters.get('geo-city') or parameters.get('province') or parameters.get('location') or ""
    province_key = find_province_in_text(str(raw_prov_param)) or find_province_in_text(query_text)
    
    fulfillment_text = ""

    # 1. INTENT THÔNG TIN TỔNG QUAN TỈNH THÀNH (Văn hóa, Lịch sử, Địa lý)
    if intent_name == "province.info":
        if province_key and province_key in PROVINCES_DB:
            p = PROVINCES_DB[province_key]
            fulfillment_text = (
                f"📍 **{p['name'].upper()}** ({p['region']})\n\n"
                f"🗺️ **Địa lý:** {p['geography']}\n\n"
                f"📜 **Lịch sử:** {p['history']}\n\n"
                f"🎭 **Văn hóa:** {p['culture']}"
            )
        else:
            fulfillment_text = "Bạn muốn tìm hiểu thông tin lịch sử, văn hóa, địa lý của tỉnh thành nào trong 63 tỉnh thành Việt Nam?"

    # 2. INTENT ẨM THỰC VÀ ĐỊA ĐIỂM DU LỊCH NỔI TIẾNG
    elif intent_name == "province.food_spots":
        if province_key and province_key in PROVINCES_DB:
            p = PROVINCES_DB[province_key]
            spots_str = "\n• ".join(p["spots"])
            food_str = ", ".join(p["food"])
            fulfillment_text = (
                f"📸 **ĐIỂM DU LỊCH HẤP DẪN TẠI {p['name'].upper()}:**\n• {spots_str}\n\n"
                f"🍲 **ĐẶC SẢN NỔI TIẾNG NÊN THỬ:**\n{food_str}"
            )
        else:
            fulfillment_text = "Bạn muốn tham khảo địa điểm tham quan và đặc sản của tỉnh thành nào?"

    # 3. INTENT THUẬT TOÁN TÍNH CHI PHÍ DU LỊCH
    elif intent_name == "cost.estimation":
        if not province_key:
            province_key = "ha noi" # Mặc định nếu người dùng không nói tỉnh
            
        days = parameters.get('number-days') or 2
        people = parameters.get('number-people') or 1
        budget = parameters.get('budget-level') or "standard"
        transport = parameters.get('transport-mode') or "bus"
        
        calc = calculate_cost_engine(province_key, days, people, budget, transport)
        
        fulfillment_text = (
            f"💰 **BẢNG DỰ TÍNH CHI PHÍ DU LỊCH: {calc['province'].upper()}**\n"
            f"⏱️ **Thời gian:** {calc['days']} ngày | 👥 **Số người:** {calc['people']} người\n"
            f"🏨 **Mức chi tiêu:** {calc['budget_label']}\n"
            f"-----------------------------------\n"
            f"💵 **Ước tính tổng chi phí:** ~ **{calc['total']:,} VNĐ**\n"
            f"*(Đã bao gồm chi phí lưu trú, ăn uống, di chuyển và 10% chi phí dự phòng phát sinh)*"
        )

    # 4. INTENT DỰ BÁO THỜI TIẾT / MÙA DU LỊCH
    elif intent_name == "weather.forecast":
        if province_key:
            fulfillment_text = get_weather_engine(province_key)
        else:
            fulfillment_text = "Bạn muốn kiểm tra thời tiết hoặc thời điểm du lịch đẹp nhất của tỉnh thành nào?"

    # 5. INTENT GỢI Ý ĐIỂM ĐẾN THEO MIỀN
    elif intent_name == "recommendation.region":
        region_query = remove_accents(query_text)
        matched_provinces = []
        
        for k, v in PROVINCES_DB.items():
            if remove_accents(v["region"]) in region_query:
                matched_provinces.append(v["name"])
                
        if matched_provinces:
            fulfillment_text = f"🗺️ **Các tỉnh thành thuộc vùng bạn quan tâm:**\n• " + "\n• ".join(matched_provinces[:8])
        else:
            fulfillment_text = "Bạn muốn gợi ý điểm đến ở vùng nào? (Ví dụ: Tây Bắc, Đông Bắc, Đồng bằng sông Hồng, Bắc Trung Bộ, Nam Trung Bộ, Tây Nguyên, Đông Nam Bộ, Miền Tây)."

    # DEFAULT FALLBACK
    else:
        fulfillment_text = (
            "Xin chào! Tôi là Chatbot Du lịch 63 Tỉnh Thành Việt Nam. "
            "Tôi có thể hỗ trợ bạn:\n"
            "1. Tra cứu Lịch sử, Văn hóa, Địa lý 63 tỉnh thành.\n"
            "2. Gợi ý Ẩm thực đặc sản & Địa điểm check-in.\n"
            "3. Tính toán chi phí chuyến đi tự động.\n"
            "4. Xem thời tiết và mùa du lịch đẹp nhất."
        )

    return jsonify({"fulfillmentText": fulfillment_text})

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port)
