from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.decorators import login_required
from .models import Conversation, ConversationMessage
from django.contrib.auth.models import User
from .utils import get_initial_content, continute_conversation
import json
from .utils import InitialMessage, RepsonseMessage
from pydantic import BaseModel
import os
from google import genai
from dotenv import load_dotenv

load_dotenv()

GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')
GEMINI_MODEL = os.getenv('GEMINI_MODEL')

client = genai.Client(api_key=GEMINI_API_KEY)

# Create your views here.


@login_required
def english_conversation(request):
    # 6.1.3. Gọi hàm render cho template "Giả lập hội thoại giao tiếp tiếng Anh". 
    # & 6.1.4. Trả về template đã được render.
    template = render(request, "english_conversation/english_conversation.html")
    # 6.1.5. Response trang html "Giả lập hội thoại giao tiếp tiếng Anh"
    return template


@csrf_exempt
def start_conversation(request):
    if request.method == "POST":
        # 6.1.9. Lấy dữ liệu từ request (scenario, description, bot_role)
        data = json.loads(request.body)
        scenario = data.get("scenario")
        description = data.get("description")
        bot_role = data.get("bot_role")
        
        
        # 6.1.10. Chuẩn bị promt cho lời chào mở đầu (scenario, description, bot_role) 
        prompt = f"""
                Tôi muốn luyện tập hội thoại giao tiếp tiếng Anh trong ngữ cảnh: "{description}".
                Bạn sẽ đóng vai là: "{bot_role}"
                
                Hãy:
                1. Phản hồi lời mở đầu tự nhiên như 2 người trong thực tế để bắt đầu cuộc hội thoại.
                3. Tự tạo thông tin cá nhân, ngữ cảnh cần thiết.
                3. Tạo tiêu đề ngắn gọn cho cuộc hội thoại (tối đa 255 ký tự)
                3. Sử dụng tiếng Anh.  
                """
                
        # 6.1.11. Yêu cầu tạo lời chào mở đầu (prompt) 
        # & 6.1.12. Trả về lời chào mở đầu
        initial_content = client.models.generate_content(
        model=GEMINI_MODEL,
        contents = prompt,
        config=genai.types.GenerateContentConfig(
        response_mime_type="application/json",
        response_schema=InitialMessage,
        ))



        # 6.1.13. Tạo cuộc hội thoại mới
        conversation = Conversation.objects.create(
            user=request.user,
            title=initial_content["title"],
            scenario=scenario,
            description=description,
            bot_role=bot_role,
        )

        # 6.1.14. Tạo tin nhắn đầu tiên với vai trò bot
        ConversationMessage.objects.create(
            conversation=conversation, role="bot", content=initial_content["message"]
        )

        # 6.1.15. Response {conversation_id, message}
        return JsonResponse(
            {
                "conversation_id": conversation.id,
                "message": initial_content["message"],
            }
        )


@csrf_exempt
def continue_conversation(request):
    if request.method == "POST":
        # 6.1.19. Lấy dữ liệu từ request (conversation_id, message)
        data = json.loads(request.body)
        conversation_id = data.get("conversation_id")
        new_message = data.get("user_message")

        # 6.1.20. Lấy thông tin cuộc hội thoại (conversation_id)
        # & 6.1.21. Trả về thông tin cuộc hội thoại
        conversation = Conversation.objects.get(pk=conversation_id)

        if conversation:
            # 6.1.22. Tạo tin nhắn mới với vai trò user
            user_message = ConversationMessage(
                conversation=conversation, role="user", content=new_message
            )

            # 6.1.23. Lấy lịch sử cuộc hội thoại
            # & 6.1.24. Trả về lịch sử cuộc hội thoại
            previous_messages = conversation.conversation_messages.all().order_by(
                "created_at"
            )

            # 6.1.25. Định dạng lịch sử cuộc hội thoại
            formated_conversation = ""
            for message in previous_messages:
                name = "Tôi" if message.role == "User" else conversation.bot_role
                formated_conversation += f"{name}: {message.content}\n"
                
            
            # 6.1.26. Chuẩn bị prompt tiếp tục cuộc hội thoại(history, description, bot_role)
            description = conversation.description
            bot_role = conversation.bot_role
            
            prompt = f"""
                        Tiếp tục cuộc hội thoại trong ngữ cảnh: "{description}".
                        Vai trò của bạn là: "{bot_role}".
                        Lịch sử của cuộc trò chuyện: 
                        "{formated_conversation}"'
                        Đây là nội dung mới nhất của tôi: "{new_message}"
                        
                        Hãy:
                        1. Phản hồi một cách tự nhiên như cuộc trò chuyện trong thực tế (bằng tiếng Anh).
                        2. Feedback nội dung mới nhất của tôi về cách sử dụng tiếng Anh (ngữ pháp, từ vựng, tự nhiên), gợi ý nội dung chuẩn hơn nếu có thể (bằng tiếng Việt).
                        """

            
            # 6.1.27. Yêu cầu tạo message và feedback cho cuộc hội thoại (prompt)
            # & 6.1.28. Trả về message và feedback
            response = client.models.generate_content(
                model=GEMINI_MODEL,
                contents = prompt,
                config=genai.types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=RepsonseMessage,
                ))

            user_message.feedback = response["feedback"]
            user_message.save()

            # 6.1.29. Tạo tin nhắn mới với vai trò bot
            bot_message = ConversationMessage(
                conversation=conversation, role="bot", content=response["message"]
            )
            bot_message.save()

            # 6.1.30. Response {message, feedback}
            return JsonResponse(response)

        else:
            return JsonResponse(
                {"success": False, "message": "Conversation not found"}, status=404
            )
            


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
