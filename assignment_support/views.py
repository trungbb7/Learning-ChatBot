from django.shortcuts import render

from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.decorators import login_required
import json
import base64


from pydantic import BaseModel
import os
from google import genai
from dotenv import load_dotenv

load_dotenv()

GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')
GEMINI_MODEL = os.getenv('GEMINI_MODEL')

client = genai.Client(api_key=GEMINI_API_KEY)
# Create your views here.
# @login_required
def assignment_support(request):
    return render(request, 'assignment_support/assignment_support.html')


@csrf_exempt
def handle_text(request):
    if request.method == 'POST':

        body = json.loads(request.body)
        text = body.get('text')
        prompt = f""" 
            Hãy phân tích và đưa ra các gợi ý từng bước để giải bài tập sau đây. Chỉ đưa ra gợi ý, không giải chi tiết. Lưu ý:
            1. Sử dụng LaTeX cho tất cả các biểu thức toán học, 
            2. Đảm bảo mỗi bước giải đều có giải thích rõ ràng
            3. Sử dụng markdown để định dạng văn bản
            4. Các công thức toán học phải được đặt trong cặp dấu \\( \\) cho công thức nội dòng hoặc \\[\\] cho công thức riêng dòng
            5. Không sử dụng dấu $ cho LaTeX, chỉ sử dụng \\( \\) và \\[\\]
            6. Mỗi gợi ý phải được đánh số và bắt đầu bằng dấu gạch đầu dòng (-)
            7. Các gợi ý phải được phân tách bằng dấu xuống dòng

            Đề bài:
            {text}
                """
        
        response = client.models.generate_content(
            model=GEMINI_MODEL,
            contents = prompt,
            # config=genai.types.GenerateContentConfig(
            # response_mime_type="application/json",
            # response_schema=InitialMessage,
        # )
        )

        print("response ",response.text)

        return JsonResponse({
            'hints': response.text
        })
    
@csrf_exempt
def handle_exercise(request):
    if request.method == 'POST':

        body = json.loads(request.body)
        text = body.get('text')
        prompt = f""" 
            Hãy giải chi tiết bài tập sau đây. Lưu ý:
            1. Sử dụng LaTeX cho tất cả các biểu thức toán học
            2. Đảm bảo mỗi bước giải đều có giải thích rõ ràng
            3. Sử dụng markdown để định dạng văn bản
            4. Các công thức toán học phải được đặt trong cặp dấu \\( \\) cho công thức nội dòng hoặc \\[\\] cho công thức riêng dòng
            5. Không sử dụng dấu $ cho LaTeX, chỉ sử dụng \\( \\) và \\[\\]

            Đề bài:
            {text}
                """
        
        response = client.models.generate_content(
            model=GEMINI_MODEL,
            contents = prompt,
            # config=genai.types.GenerateContentConfig(
            # response_mime_type="application/json",
            # response_schema=InitialMessage,
        # )
        )

        print("response ",response.text)

        return JsonResponse({
            'hints': response.text
        })
    
@csrf_exempt
def handle_exercise_image(request):
    if request.method == 'POST':

        body = json.loads(request.body)
        base64_img = body.get('data')

        # image_bytes = base64.b64decode(base64_img)
        contents = [
                {
                    "parts": [
                        {
                            "text": "Hãy đọc và trích xuất văn bản từ hình ảnh này. Chỉ trả về văn bản đã được trích xuất, không thêm bất kỳ bình luận nào."
                        },
                        {
                            "inline_data": {
                                "mime_type": "image/jpeg",
                                "data": base64_img
                            }
                        }
                    ]
                }
            ]
        response = client.models.generate_content(
            model=GEMINI_MODEL,
            contents = contents,
            # config=genai.types.GenerateContentConfig(
            # response_mime_type="application/json",
            # response_schema=InitialMessage,
        # )
        )

        print("response ",response.text)

        return JsonResponse({
            'hints': response.text
        })
    
