from django.shortcuts import render

# Create your views here.


def english_conversation(request):
    return render(request, 'english_conversation/english_conversation.html')