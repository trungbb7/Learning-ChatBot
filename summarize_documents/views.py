from django.shortcuts import render
from django.http import JsonResponse
import json
from django.views.decorators.csrf import csrf_exempt
import os
from google import genai
from dotenv import load_dotenv
import fitz  # PyMuPDF
import docx
from django.http import JsonResponse
from django.core.files.storage import default_storage

load_dotenv()

GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')
GEMINI_MODEL = os.getenv('GEMINI_MODEL')

client = genai.Client(api_key=GEMINI_API_KEY)

# Create your views here.

def index(request):
#     4.3. Gọi hàm render cho template "tóm tắt văn bản".
#     4.4. Trả về template đã được render
    template=render(request, 'summarize_documents/summarize.html')
    # 4.5. Response trang html "Tóm tắt văn bản"
    return template 




@csrf_exempt
def summarize_api(request):
    
    if request.method == 'POST' and request.FILES.get('file'):
# 4.7.2.2  Lấy dữ liệu từ request
        uploaded_file = request.FILES['file']
        summarize_type = request.POST.get('summaryType')
        filename = uploaded_file.name
        ext = os.path.splitext(filename)[1].lower()

        #  4.7.2.3  Lưu file tạm 
        path = default_storage.save('tmp/' + filename, uploaded_file)
        # 4.7.2.4 trả về đường dẫn file fullpath()
        full_path = default_storage.path(path)
        # 4.7.2.5 trích xuất văn bản
        # 4.7 2.6 trả về nội dung văn bản text
        try:
            if ext == '.pdf':
                text = extract_text_from_pdf(full_path)
            elif ext == '.docx':
                text = extract_text_from_docx(full_path)
            elif ext == '.txt':
                text = extract_text_from_txt(full_path)
            else:
                return JsonResponse({'error': 'File không được hỗ trợ.'}, status=400)
        # 4.7.2.7 Chuẩn bị prompt tóm tắt văn bản 
            prompt = f""" 
                Tạo tóm tắc văn bản  của văn bản sau. Chú ý đến các điểm chính và thông tin quan trọng. Giữ tóm tắc rõ ràng và ngắn gọn.
                có 3 mức đọo tóm tắt là short, medium , long . Hãy tóm tắt theo mức độ ${summarize_type}               
                Văn bản: ${text}
                    """

        # 4.7.2.8 gửi yêu cầu tóm tắt văn bản
        # 4.7.2.9 trả về văn bản đã tắt
            response = client.models.generate_content(
            model=GEMINI_MODEL,
            contents = prompt,
            )
            
            summaried_text = response.text
            # 4.7.2.10. Response {sumarized_text}
            return JsonResponse({
                'summarized_text': summaried_text
            })

        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)
        finally:
            if os.path.exists(full_path):
                os.remove(full_path)
    else:
        text = request.POST.get('text')
        summarize_type = request.POST.get('summaryType')
        # 4.7.1.4  chuẩn bị prompt
        prompt = f""" 
                Tạo tóm tắc văn bản  của văn bản sau. Chú ý đến các điểm chính và thông tin quan trọng. Giữ tóm tắc rõ ràng và ngắn gọn.
                có 3 mức đọo tóm tắt là short, medium , long . Hãy tóm tắt theo mức độ ${summarize_type}               
                Văn bản: ${text}
                    """
        # 4.7.1.5 gửi yêu cầu tóm tắt văn bản cho gemini 
        # 4.7.1.5 trả về bản tóm tắt

        response = client.models.generate_content(
        model=GEMINI_MODEL,
        contents = prompt,
        )
        
        summaried_text = response.text
        # 4.7.1.6. Response {sumarized_text}
        return JsonResponse({
            'summarized_text': summaried_text
        })
       

# ===== Các hàm trích xuất =====
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
