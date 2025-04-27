from django.shortcuts import render
from django.http import JsonResponse, HttpResponse
import json
import os
import fitz  
from docx import Document
import google.generativeai as genai
from dotenv import load_dotenv

from django.views.decorators.csrf import csrf_exempt

load_dotenv()



GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')
GEMINI_MODEL = os.getenv('GEMINI_MODEL')

genai.configure(api_key=GEMINI_API_KEY)
model = genai.GenerativeModel(GEMINI_MODEL)


# Create your views here.


def create_quiz(request):
    return render(request, 'assigment/createQuiz.html')


@csrf_exempt
def create_quiz_api(request):
    body = json.loads(request.body)
    currentType = body.get('currentQuizType')
    text = body.get('text')

    prompt = f"""
            Generate a {currentType} quiz based on the following text. Create 5 questions with 4 options each (for multiple choice) or true/false options. Format the response as JSON:
                {{
                    "questions": [
                        {{
                            "question": "question text",
                            "options": ["option1", "option2", "option3", "option4"],
                            "correctAnswer": "correct option"
                        }}
                    ]
                }}
                
                                Text: {text}
    """
    
    model = genai.GenerativeModel(GEMINI_MODEL)

    #
    response = model.generate_content({
        'text': prompt  
    })

    return JsonResponse({
        'data': response.text
    })


def extract_text_from_pdf(uploaded_file):
    text = ""
    pdf_document = fitz.open(stream=uploaded_file.read(), filetype="pdf")
    
    for page in pdf_document:
        text += page.get_text()
    
    return text


@csrf_exempt
def process_pdf(request):
    if request.method == 'POST':
        uploaded_file = request.FILES.get('file')

        if not uploaded_file:
            return JsonResponse({'error': 'No file uploaded'}, status=400)

        try:
            # Extract text sạch
            extracted_text = extract_text_from_pdf(uploaded_file)

            # Chuẩn bị prompt
            prompt = f"""
                Hãy tạo ra 5 câu hỏi trắc nghiệm, mỗi câu có 4 lựa chọn dựa trên nội dung trong file được cung cấp

            Văn bản:
            {extracted_text}
            """

            # Gửi cho Gemini
            model = genai.GenerativeModel('gemini-1.5-pro-latest')
            response = model.generate_content(prompt)

            return JsonResponse({'text': response.text})

        except Exception as e:
            print("Error:", e)
            return JsonResponse({'error': str(e)}, status=500)

    return JsonResponse({'error': 'Invalid request'}, status=405)




@csrf_exempt
def process_docx(request):
    if request.method == 'POST':
        uploaded_file = request.FILES.get('file')

        if not uploaded_file:
            return JsonResponse({'error': 'No file uploaded'}, status=400)

        try:
            # Đọc file DOCX
            doc = Document(uploaded_file)
            extracted_text = "\n".join([para.text for para in doc.paragraphs if para.text.strip()])

            # Chuẩn bị prompt
            prompt = f"""
                Hãy tạo ra 5 câu hỏi trắc nghiệm, mỗi câu có 4 lựa chọn dựa trên nội dung trong file được cung cấp.
            Văn bản:
            {extracted_text}
            """

            # Gửi cho Gemini
            model = genai.GenerativeModel('gemini-1.5-pro-latest')
            response = model.generate_content(prompt)

            return JsonResponse({'text': response.text})

        except Exception as e:
            print("Error:", e)
            return JsonResponse({'error': str(e)}, status=500)

    return JsonResponse({'error': 'Invalid request'}, status=405)




@csrf_exempt
def process_txt(request):
    if request.method == 'POST':
        uploaded_file = request.FILES.get('file')

        if not uploaded_file:
            return JsonResponse({'error': 'No file uploaded'}, status=400)

        try:
            # Đọc nội dung file TXT
            extracted_text = uploaded_file.read().decode('utf-8')

            # Chuẩn bị prompt
            prompt = f"""
                Hãy tạo ra 5 câu hỏi trắc nghiệm, mỗi câu có 4 lựa chọn dựa trên nội dung trong file được cung cấp.
            Văn bản:
            {extracted_text}
            """

            # Gửi cho Gemini
            model = genai.GenerativeModel('gemini-1.5-pro-latest')
            response = model.generate_content(prompt)

            return JsonResponse({'text': response.text})

        except Exception as e:
            print("Error:", e)
            return JsonResponse({'error': str(e)}, status=500)

    return JsonResponse({'error': 'Invalid request'}, status=405)
