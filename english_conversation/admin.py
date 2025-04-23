from django.contrib import admin
from .models import Conversation, ConversationMessage


# Register your models here.

@admin.register(Conversation)
class ConversationAdmin(admin.ModelAdmin):
    list_display = ['id', 'user','scenario', 'description', 'bot_role']
    list_filter = ['id', 'user','scenario', 'description', 'bot_role']
    
    
    
@admin.register(ConversationMessage)
class ConversationMesageAdmin(admin.ModelAdmin):
    list_display = ['conversation__id', 'role', 'content', 'feedback']
    list_filter = ['conversation__id',  'role', 'feedback']
    