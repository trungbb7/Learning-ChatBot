from django.shortcuts import render

# Create your views here.


def create_quiz(request):
    return render(request, 'assigment/createQuiz.html')