from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.decorators import login_required
from .models import Conversation, ConversationMessage
from django.contrib.auth.models import User
from .utils import get_initial_message, continute_conversation
import json
# Create your views here.


def english_conversation(request):
    return render(request, 'english_conversation/english_conversation.html')


@csrf_exempt
def start_conversation(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        scenario = data.get('scenario')
        description = data.get('description')
        bot_role = data.get('bot_role')
        
        # Init new conversation
        conversation = Conversation.objects.create(
            user=request.user,
            scenario=scenario,
            description=description,
            bot_role=bot_role
        )
        
        # Get initial message
        initial_message = get_initial_message(scenario, description, bot_role)
        ConversationMessage.objects.create(
            conversation=conversation,
            role='bot',
            content=initial_message
        )
        
        return JsonResponse({'success': True, 
                             'conversation_id': conversation.id, 
                             'message': initial_message})
    
    
@csrf_exempt
def continue_conversation(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        conversation_id = data.get('conversation_id')
        new_message = data.get('user_message')
        conversation = Conversation.objects.get(pk=conversation_id)
        if not conversation:
            return JsonResponse({
                'success': False,
                'message': 'Conversation not found'
            }, status=404)
            
        else:
            # Save message
            user_message = ConversationMessage(
            conversation=conversation,
            role='user',
            content=new_message
        )
            user_message.save()
            
            
            previous_messages = conversation.conversation_messages.all().order_by('created_at')
            formated_conversation = ""
            for message in previous_messages:
                name = 'Tôi' if message.role == 'User' else conversation.bot_role
                formated_conversation += f"{name}: {message.content}\n"
                
            response = continute_conversation(new_message, 
                                            formated_conversation, 
                                            conversation.scenario, 
                                            conversation.description, 
                                            conversation.bot_role)
            
            user_message.feedback = response['feedback']
            user_message.save()
            bot_message = ConversationMessage(
                conversation=conversation,
                role='bot',
                content=response['message'])
            bot_message.save()
            
            return JsonResponse(response)
            
            

@csrf_exempt
def get_conversation_history(request):
    user = request.user
    conversations = user.conversations.all().order_by('-updated_at')
    response = []
    for conversation in conversations:
        first_message = conversation.conversation_messages.first()
        preview = f"{first_message.content[:30]}..."
        response.append({
            'id': conversation.id,
            'scenario': conversation.scenario,
            'preview': preview,
            'date': conversation.updated_at
        })
        
    return JsonResponse({'history': response})
        
        
        
@csrf_exempt
def get_conversation(request, id):
    user = request.user
    conversation = user.conversations.get(pk=id)
    query_messages = conversation.conversation_messages.all().order_by('updated_at')
    messages = []
    for message in query_messages:
        messages.append({
            'role': message.role,
            'content': message.content,
            'feedback': message.feedback
        })
    return JsonResponse({
        'id': conversation.id,
        'scenario': conversation.scenario,
        'messages': messages
    })
    
    

@csrf_exempt
def remove_conversation(request):
    if request.method == 'POST':
        user = request.user
    data = json.loads(request.body)
    id = data.get('id')
    conversation = user.conversations.get(pk=id)
    if not conversation:
        return JsonResponse({
            'message': 'Conversation not found or you don\'t have permission' 
        }, status=404)
    else:
        conversation.delete()
        return JsonResponse({
            'message': 'Delete successful'
        })
    
    
    
@csrf_exempt
def remove_all_conversation(request):
    if request.method == 'POST':
        user = request.user
        user.conversations.all().delete()
        return JsonResponse({
            'message': 'Delete successful'
        })
        