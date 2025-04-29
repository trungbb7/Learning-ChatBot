import os
from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

# Cấu hình Gemini API
genai.configure(api_key=os.getenv('GEMINI_API_KEY'))

@csrf_exempt
def summarize_text(request):
    if request.method == 'POST':
        try:
            text = request.POST.get('text', '')
            if not text:
                return JsonResponse({'error': 'Vui lòng nhập văn bản cần tóm tắt'}, status=400)

            # Khởi tạo model Gemini
            model = genai.GenerativeModel('gemini-pro')
            
            # Tạo prompt cho việc tóm tắt
            prompt = f"""Hãy tóm tắt đoạn văn bản sau đây một cách ngắn gọn và đầy đủ ý chính:

{text}

Tóm tắt:"""

            # Gọi API để tóm tắt
            response = model.generate_content(prompt)
            summary = response.text

            return JsonResponse({'summary': summary})
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)
    
    return render(request, 'summarize.html') 