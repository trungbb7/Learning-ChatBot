const API_KEY = "AIzaSyDFzsQxciE0WYHaXd0968bBMdZIkxZlRp0";
        const API_URL = "/create-quiz-api/";

        let currentQuizType = 'multiple-choice';
        let questions = [];
        let userAnswers = [];

        let files;

        // Theme handling
        function toggleTheme() {
            const body = document.body;
            const isDark = body.getAttribute('data-theme') === 'dark';
            body.setAttribute('data-theme', isDark ? 'light' : 'dark');
            localStorage.setItem('theme', isDark ? 'light' : 'dark');
            updateThemeIcon();
        }

        function updateThemeIcon() {
            const icon = document.querySelector(".theme-toggle i");
            if (icon) {
              const isDark = document.body.getAttribute("data-theme") === "dark";
              icon.className = isDark ? "fas fa-sun" : "fas fa-moon";
            } else {
              console.warn("Theme toggle icon not found");
            }
          }

        // Load saved theme
        const savedTheme = localStorage.getItem('theme') || 'light';
        document.body.setAttribute('data-theme', savedTheme);
        updateThemeIcon();

        // Quiz type selection
        document.querySelectorAll('.option').forEach(option => {
            option.addEventListener('click', () => {
                document.querySelectorAll('.option').forEach(opt => opt.classList.remove('active'));
                option.classList.add('active');
                currentQuizType = option.dataset.type;
            });
        });

        /// File upload
document.getElementById('file-upload').addEventListener('click', () => {
    document.getElementById('document-input').click();
});

document.getElementById('document-input').addEventListener('change', async (e) => {
    files = e.target.files;
    if (!files.length) return;
    const fileInfo = document.getElementById('file-info');
    fileInfo.innerHTML = `Selected: ${files[0].name}`;   
});


    // 7.1.7 Chọn file và nhấn tạo quiz
    // 7.1.16 Nhập text và nhấn tạo quiz
    async function generateQuiz() {
    const manualText = document.getElementById('text-input').value.trim();
    const loading = document.getElementById('file-loading');
    loading.className = 'loading';
    loading.innerHTML = '<span class="material-symbols-rounded">sync</span> Đang tạo câu hỏi...';
    loading.style.display = 'block';

    // 7.1.8 Request POST kèm file
     try {
        const formData = new FormData();
        formData.append('file', files[0]);

        const response = await fetch(API_URL, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) throw new Error('Lỗi khi gửi file lên server');

        const data = await response.json();
        loading.style.display = 'none';
        const jsonMatch = data.data.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error("Không tìm thấy JSON hợp lệ trong phản hồi");

        const parsed = JSON.parse(jsonMatch[0]);
        window.extractedQuestions = parsed.questions;

    } catch (error) {
        console.error(error);
    }

    if (window.extractedQuestions && window.extractedQuestions.length > 0) {
        questions = window.extractedQuestions;
        // 7.1.15 Hiển thị câu hỏi
        displayQuiz();
        loading.style.display = 'none';
        return;
    }

    if (!manualText) {
        alert('Hãy nhập văn bản hoặc tải file lên trước.');
        loading.style.display = 'none';
        return;
    }
        // 7.1.17 Gửi request POST với text
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: manualText })
        });
        // 7.1.19 Trả về JSON câu hỏi
        const data = await response.json();
        loading.style.display = 'none';
        const jsonMatch = data.data.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error("Không tìm thấy JSON hợp lệ trong phản hồi");

        const parsed = JSON.parse(jsonMatch[0]);
        questions = parsed.questions;
        // 7.1.21 Hiển thị câu hỏi
        displayQuiz();
        loading.style.display = 'none';


    } catch (error) {
        console.error(error);
        alert("Lỗi khi tạo câu hỏi: " + error.message);
    }
}


function displayQuiz() {
    const container = document.getElementById('questions-container');
    container.innerHTML = '';
    userAnswers = [];

    questions.forEach((q, index) => {
        const questionDiv = document.createElement('div');
        questionDiv.className = 'question';
        questionDiv.innerHTML = `
            <h3>Câu ${index + 1}</h3>
            <p style="margin-bottom: 10px;">${q.question}</p>
            <div class="options-grid">
                ${q.options.map((opt, i) => `
                    <div class="option-button" data-question="${index}" data-option="${i}">
                        ${opt}
                    </div>
                `).join('')}
            </div>
        `;
        container.appendChild(questionDiv);
    });

    document.querySelector('.input-section').style.display = 'none';
    document.getElementById('quiz-section').style.display = 'block';
    document.getElementById('result-section').style.display = 'none';
    // 7.1.22 Chọn câu trả lời
    document.querySelectorAll('.option-button').forEach(btn => {
        btn.addEventListener('click', () => {
            const qIndex = parseInt(btn.dataset.question);
            const optIndex = parseInt(btn.dataset.option);

            document.querySelectorAll(`.option-button[data-question="${qIndex}"]`)
                .forEach(el => el.classList.remove('selected'));

            btn.classList.add('selected');
            userAnswers[qIndex] = optIndex;
        });
    });
}
// 7.1.23 Nhấn nút Hoàn thành
function submitQuiz() {
    let score = 0;
    questions.forEach((q, index) => {
        const chosen = q.options[userAnswers[index]];
        // 7.1.24 So sánh đáp án với correctAnswer
        const isCorrect = chosen === q.correctAnswer;
        if (isCorrect) score++;

        document.querySelectorAll(`.option-button[data-question="${index}"]`).forEach(btn => {
            const text = btn.textContent.trim();
            const newBtn = btn.cloneNode(true);
            btn.parentNode.replaceChild(newBtn, btn);

            if (text === q.correctAnswer) newBtn.classList.add('correct');
            else if (text === chosen) newBtn.classList.add('incorrect');
        });
    });
    // 7.1.25 Hiển thị điểm và đáp án
    const percentage = Math.round(score / questions.length * 100);
    document.getElementById('score').textContent = `Điểm: ${percentage}%`;
    document.getElementById('result-section').style.display = 'block';
    document.getElementById('submit-button').style.display = 'none';

}
 // 7.1.27 Gọi lại API tạo quiz
async function resetQuiz() {
    document.getElementById('questions-container').innerHTML = '';
    document.getElementById('result-section').style.display = 'none';
    questions = [];
    userAnswers = [];
    window.extractedQuestions = null;

    const loading = document.getElementById('reset-loading');
    loading.className = 'loading';
    loading.innerHTML = '<span class="material-symbols-rounded">sync</span> Đang tạo câu hỏi...';
    loading.style.display = 'block';
    await generateQuiz();
    loading.style.display = 'none';
     document.getElementById('submit-button').style.display = 'flex';
    window.scrollTo(0, 0);
}


function resetText() {
    // Reset text input
    document.getElementById('text-input').value = '';
    // Show upload section
    document.querySelector('.input-section').style.display = 'block';
    // Hide all other sections
    document.getElementById('quiz-section').style.display = 'none';
    document.getElementById('result-section').style.display = 'none';
    document.getElementById('summary-section').style.display = 'none';
    // Clear quiz content
    document.getElementById('questions-container').innerHTML = '';
    document.getElementById('score').innerHTML = '';
    document.getElementById('summary-content').innerHTML = '';
    // Reset file input and file info
    document.getElementById('document-input').value = '';
    document.getElementById('file-info').innerHTML = '';
    // Clear variables
    window.questions = [];
    window.userAnswers = [];
    window.extractedQuestions = null;
    window.scrollTo(0, 0);
}

        