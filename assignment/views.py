from django.shortcuts import render
from django.http import JsonResponse
import json
from django.views.decorators.csrf import csrf_exempt
import os
from google import genai
from dotenv import load_dotenv
import fitz  # PyMuPDF
import docx
from django.core.files.storage import default_storage

load_dotenv()

GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')
GEMINI_MODEL = os.getenv('GEMINI_MODEL')

client = genai.Client(api_key=GEMINI_API_KEY)
def create_quiz(request):
    # 7.1.3 Gọi hàm render cho template "Tạo bài tập từ tài liệu".
    # 7.1.4 Trả về template đã được render
    template =  render(request, 'assigment/createQuiz.html')
    # 7.1.5 Response trang html "Tạo bài tập từ tài liệu"
    return template

@csrf_exempt
def create_quiz_api(request):
    if request.method == 'POST' and request.FILES.get('file'):
        # 7.1.9 Lấy dữ liệu từ request
        uploaded_file = request.FILES['file']
        filename = uploaded_file.name
        ext = os.path.splitext(filename)[1].lower()

        # 7.1.10 Lưu file tạm
        path = default_storage.save('tmp/' + filename, uploaded_file)
        full_path = default_storage.path(path)
        print("Đã lưu file tại:", full_path)

        # 7.1.11 extract_text(full_path)
        try:
            if ext == '.pdf':
                text = extract_text_from_pdf(full_path)
            elif ext == '.docx':
                text = extract_text_from_docx(full_path)
            elif ext == '.txt':
                text = extract_text_from_txt(full_path)
            else:
                return JsonResponse({'error': 'File không được hỗ trợ.'}, status=400)

        # Chuẩn bị prompt
            prompt = f"""
Tạo 10 câu hỏi trắc nghiệm dựa trên văn bản sau, mỗi câu có 4 lựa chọn và một đáp án đúng. Trả về kết quả dưới dạng JSON như sau:
{{
    "questions": [
        {{
            "question": "Câu hỏi 1?",
            "options": ["A", "B", "C", "D"],
            "correctAnswer": "A"
        }},
        ...
    ]
}}

Văn bản: {text}
"""
            # 7.1.12 Gửi prompt tạo câu hỏi với text trích xuất
            # 7.1.13 Trả về JSON câu hỏi
            response = client.models.generate_content(
                model=GEMINI_MODEL,
                contents=prompt,
            )
            # 7.1.14 Response {data}
            return JsonResponse({'data': response.text})

        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)
        finally:
            if os.path.exists(full_path):
                os.remove(full_path)

    elif request.method == 'POST':
         # 7.1.18 Gửi prompt tạo câu hỏi với text
        body = json.loads(request.body)
        text = body.get('text')

        prompt = f"""
Tạo 10 câu hỏi trắc nghiệm dựa trên văn bản sau, mỗi câu có 4 lựa chọn và một đáp án đúng. Trả về kết quả dưới dạng JSON như sau:
{{
    "questions": [
        {{
            "question": "Câu hỏi 1?",
            "options": ["A", "B", "C", "D"],
            "correctAnswer": "A"
        }},
        ...
    ]
}}

Văn bản: {text}
"""
        response = client.models.generate_content(
            model=GEMINI_MODEL,
            contents=prompt,
        )
        # 7.1.20 Trả về JSON câu hỏi
        return JsonResponse({'data': response.text})

    else:
        return JsonResponse({'error': 'Phương thức không hợp lệ'}, status=405)

# ===== Hàm trích xuất văn bản =====

def extract_text_from_pdf(file_path):
    doc = fitz.open(file_path)
    text = ""
    for page in doc:
        text += page.get_text()
    doc.close()
    return text

def extract_text_from_docx(file_path):
    doc = docx.Document(file_path)
    return "\n".join([para.text for para in doc.paragraphs])

def extract_text_from_txt(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        return f.read()
