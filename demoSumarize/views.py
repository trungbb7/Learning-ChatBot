from django.shortcuts import render
import json, os
from django.views.decorators.csrf import csrf_exempt
from dotenv import load_dotenv
from google import genai
from django.http import JsonResponse

# Create your views here.

load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")
model = os.getenv("GEMINI_MODEL")

client = genai.Client(api_key=api_key)


# Hàm tạo tóm tắt
def summarize_text_with_gemini(currentSummaryType, text):
    # Tạo prompt
    content = f"Tạo tóm tắc văn bản ${currentSummaryType} của văn bản sau. Chú ý đến các điểm chính và thông tin quan trọng. Giữ tóm tắc rõ ràng và ngắn gọn.\n\nVăn bản: ${text}"
    # Gọi API Gemini để nhận tóm tắc
    response = client.models.generate_content(model=model, contents=[content])
    # Trả về kết quả
    return response.text


# Trang chủ cho tạo tóm tắt
def summarizeHome(request):
    return render(request, "text-summarize.html")


# Hàm API tạo tóm tắt từ văn bản`
@csrf_exempt
def summarize(request):
    if request.method == "POST":
        # Lấy dữ liệu từ request body (người dùng gửi lên thông qua Javascript)
        data = json.loads(request.body)
        # Kiểu tóm tắt (Ngắn, dài, trung bình)
        currentSummaryType = data.get("summary_type")
        # Văn bản cần tóm tắt ảo
        text = data.get("text")
        # Gọi hàm tạo tóm tắt và trả về kết quả ảo đến người dùng
        response = summarize_text_with_gemini(currentSummaryType, text)
        return JsonResponse({"summary": response})
