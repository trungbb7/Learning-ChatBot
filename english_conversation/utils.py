from pydantic import BaseModel
import os
import json
from google import genai
from dotenv import load_dotenv

load_dotenv()

GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')
GEMINI_MODEL = os.getenv('GEMINI_MODEL')

client = genai.Client(api_key=GEMINI_API_KEY)




class InitialMessage(BaseModel):
    message: str
    title: str


class RepsonseMessage(BaseModel):
    message: str
    feedback: str



def get_initial_content(scenario, description = None, bot_role = None):
    prompt = f"""
    Tôi muốn luyện tập hội thoại giao tiếp tiếng Anh trong ngữ cảnh: "{description}".
    Bạn sẽ đóng vai là: "{bot_role}"
    
    Hãy:
    1. Phản hồi lời mở đầu tự nhiên như 2 người trong thực tế để bắt đầu cuộc hội thoại.
    3. Tự tạo thông tin cá nhân, ngữ cảnh cần thiết.
    3. Tạo tiêu đề ngắn gọn cho cuộc hội thoại (tối đa 255 ký tự)
    3. Sử dụng tiếng Anh.  
    """
    
    response = client.models.generate_content(
        model=GEMINI_MODEL,
        contents = prompt,
        config=genai.types.GenerateContentConfig(
        response_mime_type="application/json",
        response_schema=InitialMessage,
    ))
    
    return json.loads(response.text)



def continute_conversation(new_message, formated_conversation, scenario, description, bot_role):
    
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
    
    response = client.models.generate_content(
        model=GEMINI_MODEL,
        contents = prompt,
        config=genai.types.GenerateContentConfig(
        response_mime_type="application/json",
        response_schema=RepsonseMessage,
    ))
    
    return json.loads(response.text) 



