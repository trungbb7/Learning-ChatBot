from django.db import models
from django.contrib.auth.models import User

# Create your models here.

class TimeStampedModel(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        abstract = True
        
        
class Conversation(TimeStampedModel):
    user = models.ForeignKey(User,related_name="conversations" , on_delete=models.CASCADE)
    scenario = models.CharField(max_length=255)
    description = models.TextField()
    bot_role = models.CharField(max_length=255)
    
    
class ConversationMessage(TimeStampedModel):
    conversation = models.ForeignKey(Conversation, related_name='conversation_messages', on_delete=models.CASCADE)
    role = models.CharField(choices=[('user', 'User'), ('bot', 'Bot')], max_length=5)
    content = models.TextField()
    feedback = models.TextField(null=True, blank=True)
    
    def __str__(self):
        return f"{self.role} - {self.content[:20]}"
    
    


