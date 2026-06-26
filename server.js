const express = require('express');
const path = require('path');
const multer = require('multer'); // 📸 사진을 받기 위한 마법의 장갑!
const app = express();

const PORT = process.env.PORT || 3000;

// 사진을 임시로 메모리에 저장
const upload = multer({ storage: multer.memoryStorage() });

// 'public' 폴더 허용
app.use(express.static(path.join(__dirname, 'public')));

// 🔥 핵심! 프론트엔드에서 AI 변환 요청이 오면 여기서 받음!
app.post('/api/pixelate', upload.single('photo'), (req, res) => {
    // 만약 사용자가 사진을 안 올렸다면 에러 메시지 뱉기
    if (!req.file) {
        return res.status(400).json({ error: "사진을 찾을 수 없습니다!" });
    }

    const userPhoto = req.file;
    const aiPrompt = req.body.prompt;

    console.log("📸 유저가 올린 사진 크기:", userPhoto.size, "bytes");
    console.log("🗣️ 입력된 프롬프트:", aiPrompt);

    // AI가 변환하는 척 3초 기다림 (진짜 AI 연동 전까지 테스트용)
    setTimeout(() => {
        res.json({
            success: true,
            // 더미 데이터: 피카츄 픽셀 아트 이미지
            pixelImageUrl: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png' 
        });
    }, 3000); 
});

// 홈페이지 접속 시 화면 보여주기
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 서버 켜기!
app.listen(PORT, () => {
    console.log(`🚀 AI 띠부실 서버 가동 중! (http://localhost:${PORT})`);
});
