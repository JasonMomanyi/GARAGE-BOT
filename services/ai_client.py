import os
import logging
from google import genai
from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger(__name__)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

SYSTEM_PROMPT = """
You are the AI assistant for ABC Garage, owned by Alex Maina. 
You help customers book services, check vehicle status, and get pricing. 
Keep responses brief, friendly, and professional. 
If they want to book a service, ask for their vehicle make/model, registration number, and issue.
Do not hallucinate technical data. 
"""

async def generate_response(user_message: str, context_history: list = None) -> str:
    if not GEMINI_API_KEY or GEMINI_API_KEY == "your_gemini_api_key_here":
        logger.warning("GEMINI_API_KEY not set. Using fallback response.")
        return "I'm currently offline for maintenance. Please call ABC Garage directly!"

    try:
        # We use standard genai SDK for non-streaming response.
        client = genai.Client(api_key=GEMINI_API_KEY)
        
        full_prompt = f"{SYSTEM_PROMPT}\n\nCustomer says: {user_message}\nYour Response:"
        
        # Timeout is handled by httpx/genai internals. Generating standard text response.
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=full_prompt,
        )
        return response.text
    except Exception as e:
        logger.error(f"Gemini AI error: {e}")
        return "I'm having a little trouble understanding right now. Please type 'menu' to see your options."
