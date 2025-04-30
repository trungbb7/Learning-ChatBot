        // const API_KEY = "AIzaSyDFzsQxciE0WYHaXd0968bBMdZIkxZlRp0";
        // const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`;

        let currentSubject = 'math';
        let currentHintNumber = 1;
        let hints = [];
        let solution = '';

        // Theme handling
        function toggleTheme() {
            const body = document.body;
            const isDark = body.getAttribute('data-theme') === 'dark';
            body.setAttribute('data-theme', isDark ? 'light' : 'dark');
            localStorage.setItem('theme', isDark ? 'light' : 'dark');
            updateThemeIcon();
        }

        // Function to preserve LaTeX escapes
        function preserveLaTeX(text) {
            // Replace LaTeX delimiters with placeholders
            text = text.replace(/\\\(/g, 'LATEX_INLINE_OPEN');
            text = text.replace(/\\\)/g, 'LATEX_INLINE_CLOSE');
            text = text.replace(/\\\[/g, 'LATEX_DISPLAY_OPEN');
            text = text.replace(/\\\]/g, 'LATEX_DISPLAY_CLOSE');

            // Process with marked
            text = marked.parse(text);

            // Restore LaTeX delimiters
            text = text.replace(/LATEX_INLINE_OPEN/g, '\\(');
            text = text.replace(/LATEX_INLINE_CLOSE/g, '\\)');
            text = text.replace(/LATEX_DISPLAY_OPEN/g, '\\[');
            text = text.replace(/LATEX_DISPLAY_CLOSE/g, '\\]');

            return text;
        }

        // function updateThemeIcon() {
        //     const icon = document.querySelector('.theme-toggle-as .material-symbols-rounded');
        //     const isDark = document.body.getAttribute('data-theme') === 'dark';
        //     icon.textContent = isDark ? 'light_mode' : 'dark_mode';
        // }
        function updateThemeIcon() {
            const icon = document.querySelector('.theme-toggle-as .material-symbols-rounded');
            const isDark = document.body.getAttribute('data-theme') === 'dark';
            if (icon) {
                icon.textContent = isDark ? 'light_mode' : 'dark_mode';
            }
        }
        

        // Load saved theme
        const savedTheme = localStorage.getItem('theme') || 'light';
        document.body.setAttribute('data-theme', savedTheme);
        updateThemeIcon();

        // Subject selection
        document.querySelectorAll('.subject-button-as').forEach(button => {
            button.addEventListener('click', () => {
                document.querySelectorAll('.subject-button-as').forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                currentSubject = button.dataset.subject;
                clearText();
            });
        });

        // Input method handling
        document.querySelectorAll('.input-method-button-as').forEach(button => {
            
            button.addEventListener('click', () => {
                document.querySelectorAll('.input-method-button-as').forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');

                const method = button.dataset.method;
                document.getElementById('text-input-container-as').style.display = method === 'text' ? 'block' : 'none';
                document.getElementById('image-input-container-as').style.display = method === 'image' ? 'block' : 'none';
            });
        });

        // Image upload handling
        const imageUploadArea = document.getElementById('image-upload-area-as');
        const imageInput = document.getElementById('image-input-as');
        const imagePreview = document.getElementById('image-preview-as');
        const previewImage = document.getElementById('preview-image-as');

        imageUploadArea.addEventListener('click', () => imageInput.click());
        imageUploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            imageUploadArea.style.borderColor = getComputedStyle(document.documentElement).getPropertyValue('--primary-color');
        });
        imageUploadArea.addEventListener('dragleave', () => {
            imageUploadArea.style.borderColor = getComputedStyle(document.documentElement).getPropertyValue('--border-color');
        });
        imageUploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            imageUploadArea.style.borderColor = getComputedStyle(document.documentElement).getPropertyValue('--border-color');
            const file = e.dataTransfer.files[0];
            if (file && file.type.startsWith('image/')) {
                handleImage(file);
            }
        });

        imageInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                handleImage(file);
            }
        });

        function handleImage(file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                previewImage.src = e.target.result;
                imagePreview.style.display = 'block';
                imageUploadArea.querySelector('.upload-placeholder-as').style.display = 'none';
            };
            reader.readAsDataURL(file);
        }

        function removeImage() {
            imageInput.value = '';
            previewImage.src = '';
            imagePreview.style.display = 'none';
            imageUploadArea.querySelector('.upload-placeholder-as').style.display = 'flex';
        }

        // LaTeX preview
        document.getElementById('input-text-as').addEventListener('input', () => {
            const text = document.getElementById('input-text-as').value;
            const preview = document.getElementById('latex-preview-as');
            preview.innerHTML = text;
            if (MathJax.typesetPromise) {
                MathJax.typesetPromise([preview]);
            }
        });

        // Get hint
        async function getHint() {
            const inputMethod = document.querySelector('.input-method-button-as.active').dataset.method;
            let inputText = '';
            const loading = document.getElementById('loading-as');
            const hintContainer = document.getElementById('hint-container-as');
            const hintContent = document.getElementById('hint-content-as');

            if (inputMethod === 'text') {
                inputText = document.getElementById('input-text-as').value.trim();
            } else {
                const imageFile = imageInput.files[0];
                if (!imageFile) {
                    alert('Vui lòng tải lên hình ảnh');
                    return;
                }

                try {
                    loading.style.display = 'block';
                    inputText = await convertImageToText(imageFile);
                    // Hiển thị văn bản đã nhận dạng trong textarea để người dùng có thể chỉnh sửa
                    document.getElementById('input-text-as').value = inputText;
                } catch (error) {
                    alert('Lỗi khi xử lý hình ảnh: ' + error.message);
                    return;
                } finally {
                    loading.style.display = 'none';
                }
            }

            if (!inputText) {
                alert('Vui lòng nhập đề bài cần giải');
                return;
            }

            loading.style.display = 'block';
            hintContainer.style.display = 'none';

            try {
                const response = await fetch('/handle_text', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        text: inputText
                    })
                });

                const data = await response.json();
                if (!response.ok) throw new Error(data.error.message);

                const hint = data.hints;
                hints = hint.split('\n')
                    .filter(line => line.trim())
                    .map(line => line.trim().replace(/^-\s*/, ''));
                currentHintNumber = 1;
                showCurrentHint();
            } catch (error) {
                hintContent.innerHTML = `<p class="error-message-as">Lỗi: ${error.message}</p>`;
            } finally {
                loading.style.display = 'none';
                hintContainer.style.display = 'block';
            }
        }

        function showCurrentHint() {
            const hintContent = document.getElementById('hint-content-as');
            const hintNumber = document.getElementById('hint-number-as');

            if (currentHintNumber <= hints.length) {
                hintNumber.textContent = currentHintNumber;
                hintContent.innerHTML = preserveLaTeX(hints[currentHintNumber - 1]);
                if (MathJax.typesetPromise) {
                    MathJax.typesetPromise([hintContent]);
                }
            } else {
                hintContent.innerHTML = '<p>Bạn đã xem hết các gợi ý. Hãy thử tự giải bài tập!</p>';
            }
        }

        function getPrevHint() {
            if (currentHintNumber > 1) {
                currentHintNumber--;
                showCurrentHint();
            }
        }

        function getNextHint() {
            if (currentHintNumber < hints.length) {
                currentHintNumber++;
                showCurrentHint();
            }
        }

        async function solveExercise() {
            const inputText = document.getElementById('input-text-as').value.trim();
            if (!inputText) {
                alert('Vui lòng nhập đề bài cần giải');
                return;
            }

            const loading = document.getElementById('loading-as');
            const hintContainer = document.getElementById('hint-container-as');
            const hintContent = document.getElementById('hint-content-as');

            loading.style.display = 'block';
            hintContainer.style.display = 'none';

            try {
                const response = await fetch('/handle_exercise', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        text : inputText
                    })
                });

                const data = await response.json();
                if (!response.ok) throw new Error(data.error.message);

                solution = data.hints;

                console.log(`solution: ${solution}`);

                hintContent.innerHTML = preserveLaTeX(solution);
                if (MathJax.typesetPromise) {
                    MathJax.typesetPromise([hintContent]);
                }
                document.getElementById('hint-number-as').textContent = 'Giải';
            } catch (error) {
                hintContent.innerHTML = `<p class="error-message-as">Lỗi: ${error.message}</p>`;
            } finally {
                loading.style.display = 'none';
                hintContainer.style.display = 'block';
            }
        }

        async function convertImageToText(imageFile) {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = async (e) => {
                    try {
                        // Chuyển đổi hình ảnh thành base64
                        const base64Image = e.target.result.split(',')[1];

                        // Gọi Gemini API với hình ảnh
                        const response = await fetch('/handle_exercise_image', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                                data: base64Image
                            })
                        });

                        const data = await response.json();
                        if (!response.ok) {
                            throw new Error(data.error?.message || 'Lỗi khi xử lý hình ảnh');
                        }

                        const text = data.hints;
                        if (!text) {
                            throw new Error('Không thể nhận dạng văn bản từ hình ảnh');
                        }

                        resolve(text);
                    } catch (error) {
                        console.error('Lỗi khi xử lý hình ảnh:', error);
                        reject(error);
                    }
                };
                reader.onerror = (error) => reject(error);
                reader.readAsDataURL(imageFile);
            });
        }

        function clearText() {
            document.getElementById('input-text-as').value = '';
            document.getElementById('hint-container-as').style.display = 'none';
            document.getElementById('latex-preview-as').innerHTML = '';
            removeImage();
            currentHintNumber = 1;
            hints = [];
        }
