const API_KEY = "AIzaSyDFzsQxciE0WYHaXd0968bBMdZIkxZlRp0";
        const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`;

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

        // File upload handling
        document.getElementById('file-upload').addEventListener('click', () => {
            document.getElementById('document-input').click();
        });

        document.getElementById('document-input').addEventListener('change', async (e) => {
            const files = e.target.files;
            if (!files.length) return;

            const fileInfo = document.getElementById('file-info');
            fileInfo.innerHTML = `Selected: ${files.length} file(s)`;

            // Show loading indicator
            const loading = document.createElement('div');
            loading.className = 'loading';
            loading.innerHTML = '<span class="material-symbols-rounded">sync</span> Processing document...';
            fileInfo.appendChild(loading);
            loading.style.display = 'block';

            try {
                let extractedText = '';
                // For PDF files
                if (files[0].name.endsWith('.pdf')) {
                    const formData = new FormData();
                    formData.append('file', files[0]);

                    const response = await fetch('/api/process-pdf', {
                        method: 'POST',
                        body: formData
                    });

                    if (!response.ok) throw new Error('Failed to process PDF');
                    extractedText = await response.text();
                }
                // For DOCX files
                else if (files[0].name.endsWith('.docx')) {
                    const formData = new FormData();
                    formData.append('file', files[0]);

                    const response = await fetch('/api/process-docx', {
                        method: 'POST',
                        body: formData
                    });

                    if (!response.ok) throw new Error('Failed to process DOCX');
                    extractedText = await response.text();
                }
                // For TXT files
                else if (files[0].name.endsWith('.txt')) {
                    extractedText = await files[0].text();
                }
                else {
                    throw new Error('Unsupported file format');
                }

                // Store the extracted text in a hidden variable
                window.extractedText = extractedText;
                
                loading.style.display = 'none';
                fileInfo.innerHTML = `Successfully processed: ${files[0].name}`;
                
                // Automatically generate quiz for uploaded files
                await generateQuiz();
            } catch (error) {
                console.error('Error:', error);
                loading.style.display = 'none';
                fileInfo.innerHTML = `Error: ${error.message}`;
            }
        });

        async function generateQuiz() {
            const text = window.extractedText || document.getElementById('text-input').value.trim();
            if (!text) {
                alert('Please upload a document or enter some text first!');
                return;
            }

            try {
                const response = await fetch("/api/create-quiz", {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        currentQuizType: currentQuizType,
                        text: text
                    })
                    // body: JSON.stringify({
                    //     contents: [{
                    //         role: 'user',
                    //         parts: [{
                    //             text: `Generate a ${currentQuizType} quiz based on the following text. Create 5 questions with 4 options each (for multiple choice) or true/false options. Format the response as JSON:
                    //             {
                    //                 "questions": [
                    //                     {
                    //                         "question": "question text",
                    //                         "options": ["option1", "option2", "option3", "option4"],
                    //                         "correctAnswer": "correct option"
                    //                     }
                    //                 ]
                    //             }
                                
                    //             Text: ${text}`
                    //         }]
                    //     }]
                    // })
                });
        
                const responseData = await response.json();
                const responseText = responseData.data
                // if (!response.ok) throw new Error(data.error.message);
        
                // // Extract JSON from the response text
                // const responseText = data.candidates[0].content.parts[0].text;
        
                const jsonMatch = responseText.match(/\{[\s\S]*\}/);
                if (!jsonMatch) {
                    throw new Error('No valid JSON found in response');
                }
        
                questions = JSON.parse(jsonMatch[0]).questions;
                displayQuiz();
            } catch (error) {
                console.error('Error:', error);
                alert('Error generating quiz. Please try again.');
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
                        ${q.options.map((option, optIndex) => `
                            <div class="option-button" data-question="${index}" data-option="${optIndex}">
                                ${option}
                            </div>
                        `).join('')}
                    </div>
                `;
                container.appendChild(questionDiv);
            });

            document.querySelector('.input-section').style.display = 'none';
            document.getElementById('quiz-section').style.display = 'block';
            document.getElementById('result-section').style.display = 'none';

            // Add click handlers for options
            document.querySelectorAll('.option-button').forEach(button => {
                button.addEventListener('click', () => {
                    const questionIndex = parseInt(button.dataset.question);
                    const optionIndex = parseInt(button.dataset.option);

                    // Remove selection from other options in the same question
                    document.querySelectorAll(`.option-button[data-question="${questionIndex}"]`)
                        .forEach(opt => opt.classList.remove('selected'));

                    button.classList.add('selected');
                    userAnswers[questionIndex] = optionIndex;
                });
            });
        }

        function submitQuiz() {
            if (userAnswers.length !== questions.length) {
                alert('Please answer all questions!');
                return;
            }

            let score = 0;
            questions.forEach((q, index) => {
                const userAnswer = q.options[userAnswers[index]];
                const isCorrect = userAnswer === q.correctAnswer;
                if (isCorrect) score++;

                // Show correct/incorrect answers
                document.querySelectorAll(`.option-button[data-question="${index}"]`).forEach(button => {
                    const optionText = button.textContent.trim();
                    if (optionText === q.correctAnswer) {
                        button.classList.add('correct');
                    } else if (optionText === userAnswer) {
                        button.classList.add('incorrect');
                    }
                });
            });

            const percentage = (score / questions.length) * 100;
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
        }


        function resetSummary() {
            document.getElementById('text-input').value = '';
            document.querySelector('.input-section').style.display = 'block';
            document.getElementById('summary-section').style.display = 'none';
        }