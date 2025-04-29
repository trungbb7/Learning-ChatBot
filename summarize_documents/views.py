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
    return render(request, 'summarize_documents/summarize.html')


# @csrf_exempt
# def summarize_api(request):
#     if request.method == 'POST':
#         body = json.loads(request.body)
#         text = body.get('text')
        

#         prompt = f""" 
#         Tạo tóm tắc văn bản  của văn bản sau. Chú ý đến các điểm chính và thông tin quan trọng. Giữ tóm tắc rõ ràng và ngắn gọn.
                                
#          Văn bản: ${text}
#         """

#         response = client.models.generate_content(
#         model=GEMINI_MODEL,
#         contents = prompt,
#         )
        
#         summaried_text = response.text
#         return JsonResponse({
#             'summarized_text': summaried_text
#         })


        




@csrf_exempt
def summarize_api(request):
    if request.method == 'POST' and request.FILES.get('file'):
        uploaded_file = request.FILES['file']
        filename = uploaded_file.name
        ext = os.path.splitext(filename)[1].lower()

        # Lưu file tạm
        path = default_storage.save('tmp/' + filename, uploaded_file)
        full_path = default_storage.path(path)

        try:
            if ext == '.pdf':
                text = extract_text_from_pdf(full_path)
            elif ext == '.docx':
                text = extract_text_from_docx(full_path)
            elif ext == '.txt':
                text = extract_text_from_txt(full_path)
            else:
                return JsonResponse({'error': 'File không được hỗ trợ.'}, status=400)

            prompt = f""" 
                Tạo tóm tắc văn bản  của văn bản sau. Chú ý đến các điểm chính và thông tin quan trọng. Giữ tóm tắc rõ ràng và ngắn gọn.
                                
                Văn bản: ${text}
                    """
            response = client.models.generate_content(
            model=GEMINI_MODEL,
            contents = prompt,
            )
            
            summaried_text = response.text
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
        prompt = f""" 
                Tạo tóm tắc văn bản  của văn bản sau. Chú ý đến các điểm chính và thông tin quan trọng. Giữ tóm tắc rõ ràng và ngắn gọn.
                                
                Văn bản: ${text}
                    """
        response = client.models.generate_content(
        model=GEMINI_MODEL,
        contents = prompt,
        )
        
        summaried_text = response.text
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
