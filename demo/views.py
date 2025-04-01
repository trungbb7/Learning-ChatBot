import json, os
from django.shortcuts import render
from google import genai
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from dotenv import load_dotenv

# Create your views here.

load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")
model = os.getenv("GEMINI_MODEL")

client = genai.Client(api_key=api_key)


def generate_response(user_message):
    response = client.models.generate_content(model=model, contents=[user_message])
    return response.text


def index(request):
    return render(request, "demo/demo.html")


@csrf_exempt
def chat(request):
    if request.method == "POST":
        data = json.loads(request.body)
        user_message = data.get("message")
        response = generate_response(user_message)
        return JsonResponse({"response": response})
    return render(request, "demo/demo.html")
