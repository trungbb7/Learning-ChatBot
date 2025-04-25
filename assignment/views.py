from django.shortcuts import render
from django.http import JsonResponse
import json
import os
from google import genai
from dotenv import load_dotenv

from django.views.decorators.csrf import csrf_exempt

load_dotenv()



GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')
GEMINI_MODEL = os.getenv('GEMINI_MODEL')

client = genai.Client(api_key=GEMINI_API_KEY)

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
    
    response = client.models.generate_content(
        model=GEMINI_MODEL,
        contents = prompt
        
    )

    return JsonResponse({
        'data': response.text
    })



