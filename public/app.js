// 1. 필요한 HTML 요소들 싹 다 불러오기
const imageLoader = document.getElementById('imageLoader');
const canvas = document.getElementById('stickerCanvas');
const ctx = canvas.getContext('2d');
const stickerNameInput = document.getElementById('stickerName');
const stickerNoInput = document.getElementById('stickerNo');
const bgColorInput = document.getElementById('bgColor');
const downloadBtn = document.getElementById('downloadBtn');

// AI 관련 새로 추가된 버튼들
const aiConvertBtn = document.getElementById('aiConvertBtn');
const loadingText = document.getElementById('loadingText');

let uploadedImage = null;

// 2. 초기화 가이드라인 화면 구성
function initCanvas() {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.strokeStyle = '#808080';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 6]);
    ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40);
    ctx.setLineDash([]);

    ctx.fillStyle = '#404040';
    ctx.font = 'bold 15px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('위의 [내 사진 업로드 하기] 버튼을 눌러', canvas.width / 2, canvas.height / 2 - 10);
    ctx.fillText('스티커로 만들 사진을 선택하세요!', canvas.width / 2, canvas.height / 2 + 15);
}

// 3. 스티커 실시간 렌더링(그림 그리기) 함수
function drawSticker() {
    if (!uploadedImage) return;

    const size = canvas.width; // 500x500 고정
    
    // 배경색 채우기
    ctx.fillStyle = bgColorInput.value;
    ctx.fillRect(0, 0, size, size);

    // 띠부실 테두리 가이드라인 확보
    const margin = 55;
    const targetSize = size - (margin * 2); 

    const imgWidth = uploadedImage.width;
    const imgHeight = uploadedImage.height;
    
    let srcX = 0, srcY = 0, srcWidth = imgWidth, srcHeight = imgHeight;

    // 1:1 정방형 비율 강제 맞춤 (Center-Crop)
    if (imgWidth > imgHeight) {
        srcWidth = imgHeight;
        srcX = (imgWidth - imgHeight) / 2;
    } else {
        srcHeight = imgWidth;
        srcY = (imgHeight - imgWidth) / 2;
    }

    // 중앙에 이미지 그리기
    ctx.drawImage(uploadedImage, srcX, srcY, srcWidth, srcHeight, margin, margin - 15, targetSize, targetSize);

    // 띠부실 점선 효과
    ctx.strokeStyle = 'rgba(0,0,0,0.15)';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.strokeRect(15, 15, size - 30, size - 30);
    ctx.setLineDash([]);

    // 도감번호 쓰기
    const noText = stickerNoInput.value.trim();
    if (noText) {
        ctx.fillStyle = '#000000';
        ctx.font = 'bold 16px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(noText, 30, 42);
    }

    // 캐릭터 이름 쓰기
    const nameText = stickerNameInput.value.trim();
    if (nameText) {
        ctx.font = 'bold 16px sans-serif';
        const textWidth = ctx.measureText(nameText).width;
        const paddingX = 30;
        const boxWidth = textWidth + paddingX;
        const boxHeight = 34;
        const boxX = (size - boxWidth) / 2;
        const boxY = size - 55;

        // 반투명 검은색 박스
        ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
        ctx.beginPath();
        if (typeof ctx.roundRect === 'function') {
            ctx.roundRect(boxX, boxY, boxWidth, boxHeight, 6);
        } else {
            ctx.rect(boxX, boxY, boxWidth, boxHeight);
        }
        ctx.fill();

        // 흰색 글씨
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(nameText, size / 2, boxY + (boxHeight / 2));
    }
}

// 4. 일반 사진 업로드 시 캔버스에 띄우기
imageLoader.addEventListener('change', (e) => {
    if(e.target.files.length === 0) return;
    
    const reader = new FileReader();
    reader.onload = function(event) {
        uploadedImage = new Image();
        uploadedImage.onload = function() {
            drawSticker();
            downloadBtn.disabled = false;
            if(aiConvertBtn) aiConvertBtn.disabled = false; // 사진 올리면 AI 버튼도 켜짐!
        }
        uploadedImage.src = event.target.result;
    }
    reader.readAsDataURL(e.target.files[0]);
});

// 5. 글씨나 색상 바꾸면 바로바로 적용 (실시간 동기화)
stickerNameInput.addEventListener('input', drawSticker);
stickerNoInput.addEventListener('input', drawSticker);
bgColorInput.addEventListener('input', drawSticker);

// 6. 다운로드 버튼
downloadBtn.addEventListener('click', () => {
    if (!uploadedImage) return;
    const link = document.createElement('a');
    link.download = `${stickerNameInput.value || 'sticker'}_띠부실.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
});

// 7. 🔥 대망의 AI 픽셀 변환 버튼 클릭 이벤트 🔥
if(aiConvertBtn) {
    aiConvertBtn.addEventListener('click', async () => {
        const file = imageLoader.files[0];
        if (!file) return;

        // 버튼 잠그고 로딩 텍스트 보여주기
        aiConvertBtn.disabled = true;
        loadingText.style.display = 'block';

        const formData = new FormData();
        formData.append('photo', file);
        formData.append('prompt', "첨부된 사진을 참고해, 128x128 픽셀 아트 스타일 캐릭터로 변환. 인물의 주요 외형, 헤어스타일, 옷차림, 표정 등은 사진을 충실히 반영. 도트 아트 느낌을 강조하고, 배경은 투명");

        try {
            // 우리 서버(server.js)에 사진이랑 프롬프트 보내기
            const response = await fetch('/api/pixelate', {
                method: 'POST',
                body: formData
            });

            if (response.ok) {
                const data = await response.json();
                
                // 서버에서 내려준 픽셀 이미지로 스티커 갈아끼우기!
                uploadedImage = new Image();
                uploadedImage.crossOrigin = "Anonymous"; // 외부 이미지 보안 에러 방지
                uploadedImage.onload = function() {
                    drawSticker(); // 바뀐 이미지로 다시 그리기!
                }
                uploadedImage.src = data.pixelImageUrl; 
            } else {
                alert('AI 변환 실패 ㅠㅠ 다시 시도해봐!');
            }
        } catch (error) {
            console.error('서버 통신 에러:', error);
            alert('서버랑 연결이 끊겼어!');
        } finally {
            // 로딩 텍스트 숨기고 버튼 다시 켜기
            aiConvertBtn.disabled = false;
            loadingText.style.display = 'none';
        }
    });
}

// 처음 켰을 때 초기 화면 그려주기!
initCanvas();
