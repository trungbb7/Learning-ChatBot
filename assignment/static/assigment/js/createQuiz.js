const API_KEY = "AIzaSyDFzsQxciE0WYHaXd0968bBMdZIkxZlRp0";
        const API_URL = "/create-quiz-api/";

        let currentQuizType = 'multiple-choice';
        let questions = [];
        let userAnswers = [];

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
    const files = e.target.files;
    if (!files.length) return;

    const fileInfo = document.getElementById('file-info');
    fileInfo.innerHTML = `Selected: ${files.length} file(s)`;

    const loading = document.createElement('div');
    loading.className = 'loading';
    loading.innerHTML = '<span class="material-symbols-rounded">sync</span> Processing document...';
    fileInfo.appendChild(loading);
    loading.style.display = 'block';

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
        fileInfo.innerHTML = `✅ Đã xử lý: ${files[0].name}`;

        // Lưu lại JSON response (chưa hiển thị)
        const jsonMatch = data.data.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error("Không tìm thấy JSON hợp lệ trong phản hồi");

        const parsed = JSON.parse(jsonMatch[0]);
        window.extractedQuestions = parsed.questions;

    } catch (error) {
        console.error(error);
        loading.style.display = 'none';
        fileInfo.innerHTML = `Lỗi: ${error.message}`;
    }
});


// Manual text quiz generation
async function generateQuiz() {
    const manualText = document.getElementById('text-input').value.trim();

    if (window.extractedQuestions && window.extractedQuestions.length > 0) {
        questions = window.extractedQuestions;
        displayQuiz();
        return;
    }

    if (!manualText) {
        alert('Hãy nhập văn bản hoặc tải file lên trước.');
        return;
    }

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: manualText })
        });

        const data = await response.json();
        const jsonMatch = data.data.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error("Không tìm thấy JSON hợp lệ trong phản hồi");

        const parsed = JSON.parse(jsonMatch[0]);
        questions = parsed.questions;
        displayQuiz();

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
            <h3>Question ${index + 1}</h3>
            <p>${q.question}</p>
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

function submitQuiz() {
    if (userAnswers.length !== questions.length) {
        alert('Vui lòng trả lời tất cả các câu hỏi!');
        return;
    }

    let score = 0;
    questions.forEach((q, index) => {
        const chosen = q.options[userAnswers[index]];
        const isCorrect = chosen === q.correctAnswer;
        if (isCorrect) score++;

        document.querySelectorAll(`.option-button[data-question="${index}"]`).forEach(btn => {
            const text = btn.textContent.trim();
            if (text === q.correctAnswer) btn.classList.add('correct');
            else if (text === chosen) btn.classList.add('incorrect');
        });
    });

    const percentage = Math.round(score / questions.length * 100);
    document.getElementById('score').textContent = `Score: ${percentage}%`;
    document.getElementById('result-section').style.display = 'block';
}

function resetQuiz() {
    document.getElementById('text-input').value = '';
    document.querySelector('.input-section').style.display = 'block';
    document.getElementById('quiz-section').style.display = 'none';
    document.getElementById('result-section').style.display = 'none';
    questions = [];
    userAnswers = [];
    window.extractedQuestions = null; // reset biến tạm
}


        function resetSummary() {
            document.getElementById('text-input').value = '';
            document.querySelector('.input-section').style.display = 'block';
            document.getElementById('summary-section').style.display = 'none';
        }