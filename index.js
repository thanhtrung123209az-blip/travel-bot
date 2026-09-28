const express = require('express');
const app = express();

app.use(express.json());

// Kiểm tra trạng thái hoạt động của Server
app.get('/', (req, res) => {
  res.send('Server Webhook Gemini cho Travel Bot đang chạy bình thường!');
});

// Endpoint nhận Webhook từ Dialogflow
app.post('/', async (req, res) => {
  try {
    // Lấy câu hỏi của người dùng gửi từ Dialogflow
    const userQuery = req.body.queryResult && req.body.queryResult.queryText 
      ? req.body.queryResult.queryText 
      : 'Xin chào';

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.json({
        fulfillmentText: 'Lỗi: Chưa cấu hình GEMINI_API_KEY trên hệ thống Render!'
      });
    }

    // Gọi API của Gemini AI (sử dụng mô hình gemini-1.5-flash)
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `Bạn là trợ lý AI tư vấn du lịch thông minh, thân thiện. Hãy trả lời câu hỏi sau một cách ngắn gọn, chính xác và hấp dẫn: "${userQuery}"`
                }
              ]
            }
          ]
        })
      }
    );

    const data = await response.json();
    const botReply = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Rất tiếc, AI chưa thể trả lời câu hỏi này lúc này.';

    // Trả câu trả lời về cho Dialogflow
    return res.json({
      fulfillmentText: botReply
    });

  } catch (error) {
    console.error('Lỗi khi kết nối Gemini API:', error);
    return res.json({
      fulfillmentText: 'Có lỗi xảy ra trong quá trình xử lý với AI Gemini!'
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server đang chạy ở cổng ${PORT}`);
});
