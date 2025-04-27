from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.decorators import login_required
from .models import Conversation, ConversationMessage
from django.contrib.auth.models import User
from .utils import get_initial_content, continute_conversation
import json

# Create your views here.


@login_required
def english_conversation(request):
    return render(request, "english_conversation/english_conversation.html")


@csrf_exempt
def start_conversation(request):
    if request.method == "POST":
        # Get payload data
        data = json.loads(request.body)
        scenario = data.get("scenario")
        description = data.get("description")
        bot_role = data.get("bot_role")

        # Get initial content(greeting, title)
        initial_content = get_initial_content(scenario, description, bot_role)

        # Create new conversation
        conversation = Conversation.objects.create(
            user=request.user,
            title=initial_content["title"],
            scenario=scenario,
            description=description,
            bot_role=bot_role,
        )

        # Create initial message with bot role
        ConversationMessage.objects.create(
            conversation=conversation, role="bot", content=initial_content["message"]
        )

        return JsonResponse(
            {
                "conversation_id": conversation.id,
                "message": initial_content["message"],
            }
        )


@csrf_exempt
def continue_conversation(request):
    if request.method == "POST":
        # Get payload data
        data = json.loads(request.body)
        conversation_id = data.get("conversation_id")
        new_message = data.get("user_message")

        # Get conversation
        conversation = Conversation.objects.get(pk=conversation_id)

        # Error if conversation not found
        if not conversation:
            return JsonResponse(
                {"success": False, "message": "Conversation not found"}, status=404
            )

        else:
            # Create new message with user role
            user_message = ConversationMessage(
                conversation=conversation, role="user", content=new_message
            )
            # user_message.save()

            # Get conversation history
            previous_messages = conversation.conversation_messages.all().order_by(
                "created_at"
            )

            # Format conversation history
            formated_conversation = ""
            for message in previous_messages:
                name = "Tôi" if message.role == "User" else conversation.bot_role
                formated_conversation += f"{name}: {message.content}\n"

            # Get message and feedback from Gemini API
            response = continute_conversation(
                new_message,
                formated_conversation,
                conversation.scenario,
                conversation.description,
                conversation.bot_role,
            )

            user_message.feedback = response["feedback"]
            user_message.save()

            # Create new message with bot role
            bot_message = ConversationMessage(
                conversation=conversation, role="bot", content=response["message"]
            )
            bot_message.save()

            # Return {message, feedback}
            return JsonResponse(response)


@csrf_exempt
def get_conversation_history(request):
    # Retrive conversation history
    user = request.user
    conversations = user.conversations.all().order_by("-updated_at")
    response = []

    for conversation in conversations:
        first_message = conversation.conversation_messages.first()
        if first_message:
            preview = f"{first_message.content[:30]}..."
            response.append(
                {
                    "id": conversation.id,
                    "scenario": conversation.scenario,
                    "title": conversation.title,
                    "preview": preview,
                    "date": conversation.updated_at,
                }
            )

    return JsonResponse({"history": response})


@csrf_exempt
def get_conversation(request, id):
    user = request.user
    conversation = user.conversations.get(pk=id)
    query_messages = conversation.conversation_messages.all().order_by("updated_at")
    messages = []
    for message in query_messages:
        messages.append(
            {
                "role": message.role,
                "content": message.content,
                "feedback": message.feedback,
            }
        )
    return JsonResponse(
        {"id": conversation.id, "scenario": conversation.scenario, "messages": messages}
    )


@csrf_exempt
def remove_conversation(request):
    if request.method == "POST":
        user = request.user
    data = json.loads(request.body)
    id = data.get("id")
    conversation = user.conversations.get(pk=id)
    if not conversation:
        return JsonResponse(
            {"message": "Conversation not found or you don't have permission"},
            status=404,
        )
    else:
        conversation.delete()
        return JsonResponse({"message": "Delete successful"})


@csrf_exempt
def remove_all_conversation(request):
    if request.method == "POST":
        user = request.user
        user.conversations.all().delete()
        return JsonResponse({"message": "Delete successful"})
