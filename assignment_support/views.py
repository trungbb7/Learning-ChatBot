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


class HintModel(BaseModel):
    hints: list[str]


class SolutionModel(BaseModel):
    solution: str


load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_MODEL = os.getenv("GEMINI_MODEL")

client = genai.Client(api_key=GEMINI_API_KEY)


# Create your views here.
@login_required
def assignment_support(request):
    # 5.1.3. Django view render template “Trợ lý Bài tập” và trả về HTML cho trình duyệt.
    # 5.1.4. Trả về template đã được render
    tempalate = render(request, "assignment_support/assignment_support.html")
    # 5.1.5 Respone trang html “Trợ lí giải bài tập”
    return tempalate


# 5.1.11. Django view nhận request, nếu là ảnh thì xử lý để trích xuất nội dung.
@csrf_exempt
def suggest(request):
    if request.method == "POST":
        body = json.loads(request.body)
        text = body.get("text")
        sub = body.get("subject")
        print(sub)
        image_base64 = body.get("image_base64") or body.get("data")

        if image_base64:
            # // 5.1.12: Tạo prompt phù hợp gửi đến Gemini API
            # extract ảnh thành văn bản
            contents = [
                {
                    "parts": [
                        {
                            "text": "Hãy đọc và trích xuất văn bản từ hình ảnh này. Chỉ trả về văn bản đã được trích xuất, không thêm bất kỳ bình luận nào."
                        },
                        {
                            "inline_data": {
                                "mime_type": "image/jpeg",
                                "data": image_base64,
                            }
                        },
                    ]
                }
            ]

            response_extract = client.models.generate_content(
                model=GEMINI_MODEL, contents=contents
            )
            print("response ", response_extract.text)
            # // 5.1.13: Gemini API trả về kết quả
            return JsonResponse({"hints": response_extract.text})

        if not text:
            return JsonResponse({"error": "Không có nội dung bài toán."}, status=400)

        # // 5.1.12: Tạo prompt phù hợp gửi đến Gemini API
        prompt = f""" 
                Hãy phân tích và đưa ra các gợi ý từng bước để giải bài tập ${sub} sau đây. Chỉ đưa ra gợi ý, không giải chi tiết. Lưu ý:
                1. Sử dụng LaTeX cho tất cả các biểu thức toán học, 
                2. Đảm bảo mỗi bước giải đều có giải thích rõ ràng
                3. Sử dụng markdown để định dạng văn bản
                4. Các công thức toán học phải được đặt trong cặp dấu \( \) cho công thức nội dòng hoặc \[ \] cho công thức riêng dòng
                5. Với biểu thức toán học, thay cặp dấu $ $ bằng \( \), ví dụ $x^2 + 2$ thì thay bằng \(x^2 + 2\)
                6. Mỗi gợi ý phải được đánh số và bắt đầu bằng dấu gạch đầu dòng (-)
                (Trả lời bằng tiếng Việt, nếu đề bài không rõ ràng thì yêu cầu làm rõ đề bài)

                Đề bài:
                {text}
                        """

        response_hint = client.models.generate_content(
            model=GEMINI_MODEL,
            contents=prompt,
            config=genai.types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=HintModel,
            ),
        )

        json_response = json.loads(response_hint.text)
        hints = json_response["hints"]

        # // 5.1.13: Gemini API trả về kết quả
        return JsonResponse({"hints": hints})


@csrf_exempt
def handle_exercise(request):
    if request.method == "POST":

        body = json.loads(request.body)
        text = body.get("text")
        sub = body.get("subject")
        print(sub)
        # // 5.1.12: Tạo prompt phù hợp gửi đến Gemini API
        prompt = f""" 
            Hãy giải chi tiết bài tập ${sub} sau đây. Lưu ý:
            1. Sử dụng LaTeX cho tất cả các biểu thức toán học
            2. Đảm bảo mỗi bước giải đều có giải thích rõ ràng
            3. Sử dụng markdown để định dạng văn bản
            4. Các công thức toán học phải được đặt trong cặp dấu \( \) cho công thức nội dòng hoặc \[ \] cho công thức riêng dòng
            5. Với biểu thức toán học, thay cặp dấu $ $ bằng \( \), ví dụ $x^2 + 2$ thì thay bằng \(x^2 + 2\)
            6. Chỉ được trả lời bằng tiếng Việt
            (nếu đề bài không rõ ràng thì yêu cầu làm rõ đề bài)
            Đề bài:
            {text}
                """

        response = client.models.generate_content(
            model=GEMINI_MODEL,
            contents=prompt,
            config=genai.types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=SolutionModel,
            ),
        )

        json_response = json.loads(response.text)
        solution = json_response["solution"]

        # // 5.1.13: Gemini API trả về kết quả

        return JsonResponse({"hints": solution})
