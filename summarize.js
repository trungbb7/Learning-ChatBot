        // const API_KEY = "YOUR_NEW_API_KEY"; // Thay thế bằng API key mới
        const API_URL = "/api/summarize"; // Thay thế bằng URL API mới

        let currentSummaryType = 'short';



        // Theme handling
function toggleTheme() {
    const body = document.body;
    const isDark = body.getAttribute("data-theme") === "dark";
    const newTheme = isDark ? "light" : "dark";
  
    // Apply transition class for smooth transition
    body.classList.add("theme-transition");
  
    // Update theme
    body.setAttribute("data-theme", newTheme);
    localStorage.setItem("theme", newTheme);
  
    // Update icon
    updateThemeIcon();
  
    // Remove transition class after transition completes
    setTimeout(() => {
      body.classList.remove("theme-transition");
    }, 500);
  
    console.log(`Theme changed to: ${newTheme}`);
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
  
  // Initialize theme
  function initTheme() {
    const savedTheme = localStorage.getItem("theme") || "light";
    document.body.setAttribute("data-theme", savedTheme);
    console.log(`Initialized theme: ${savedTheme}`);
    updateThemeIcon();
  }
  
  // Document ready event
  document.addEventListener("DOMContentLoaded", () => {
    console.log("DOM loaded, initializing application...");
  
    // Initialize theme
    initTheme();
  })

        // // Theme handling
        // function toggleTheme() {
        //     const body = document.body;
        //     const isDark = body.getAttribute('data-theme') === 'dark';
        //     body.setAttribute('data-theme', isDark ? 'light' : 'dark');
        //     localStorage.setItem('theme', isDark ? 'light' : 'dark');
        //     updateThemeIcon();
        // }

        // function updateThemeIcon() {
        //     const icon = document.querySelector('.theme-toggle .material-symbols-rounded');
        //     const isDark = document.body.getAttribute('data-theme') === 'dark';
        //     icon.textContent = isDark ? 'light_mode' : 'dark_mode';
        // }

        // // Load saved theme
        // const savedTheme = localStorage.getItem('theme') || 'light';
        // document.body.setAttribute('data-theme', savedTheme);
        // updateThemeIcon();

        // 4.12 Xử lý nhập liệu
        document.querySelectorAll('.method').forEach(method => {
            method.addEventListener('click', () => {
                document.querySelectorAll('.method').forEach(m => m.classList.remove('active'));
                method.classList.add('active');
                
                const methodType = method.dataset.method;
                document.getElementById('text-input-container').style.display = methodType === 'text' ? 'block' : 'none';
                document.getElementById('file-input-container').style.display = methodType === 'file' ? 'block' : 'none';
            });
        });

       
        document.getElementById('file-input').addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const fileName = document.getElementById('file-name');
            const fileError = document.getElementById('file-error');
            fileName.textContent = `Đã chọn: ${file.name}`;
            fileName.style.display = 'block';
            fileError.style.display = 'none';

            // Check file extension
            const extension = file.name.split('.').pop().toLowerCase();
            if (!['docx', 'pdf', 'txt'].includes(extension)) {
                fileError.textContent = 'Chỉ chấp nhận file .docx, .pdf, .txt';
                fileError.style.display = 'block';
                e.target.value = ''; // Clear the file input
                fileName.style.display = 'none';
            }
        });

        // Summary type selection
        document.querySelectorAll('.option').forEach(option => {
            option.addEventListener('click', () => {
                document.querySelectorAll('.option').forEach(opt => opt.classList.remove('active'));
                option.classList.add('active');
                currentSummaryType = option.dataset.type;
            });
        });

        async function generateSummary() {
            const loadingOverlay = document.getElementById('loading-overlay');
            loadingOverlay.style.display = 'flex';

            try {
                const activeMethod = document.querySelector('.method.active').dataset.method;
                let formData = new FormData();

                if (activeMethod === 'text') {
                    const text = document.getElementById('text-input').value.trim();
                    if (!text) {
                        alert('Please enter some text first!');
                        return;
                    }
                    formData.append('text', text);
                } else {
                    const fileInput = document.getElementById('file-input');
                    const file = fileInput.files[0];
                    if (!file) {
                        alert('Please select a file first!');
                        return;
                    }
                    formData.append('file', file);
                }

                formData.append('summaryType', currentSummaryType);
// 4.7.1.2  Request POST/summarize
                const response = await fetch(API_URL, {
                    method: 'POST',
                    
                    body: formData
                });

                const data = await response.json();
                if (!response.ok) throw new Error(data.error || 'Error generating summary');

                const summary = data.summarized_text;
                // 4.7.2.11. hiẻn thị kết quả
                document.getElementById('summary-content').textContent = summary;
                document.querySelector('.input-section').style.display = 'none';
                document.getElementById('summary-section').style.display = 'block';
            } catch (error) {
                console.error('Error:', error);
                alert('Error generating summary. Please try again.');
            } finally {
                loadingOverlay.style.display = 'none';
            }
        }

        function resetSummary() {
            document.getElementById('text-input').value = '';
            document.querySelector('.input-section').style.display = 'block';
            document.getElementById('summary-section').style.display = 'none';
        }
    