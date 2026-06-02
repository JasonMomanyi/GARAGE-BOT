import os
import httpx
import logging
from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger(__name__)

WHATSAPP_TOKEN = os.getenv("WHATSAPP_TOKEN")
PHONE_NUMBER_ID = os.getenv("PHONE_NUMBER_ID")

async def send_whatsapp_message(to_number: str, message_body: str):
    if not WHATSAPP_TOKEN or not PHONE_NUMBER_ID or WHATSAPP_TOKEN == "your_meta_whatsapp_token_here":
        logger.warning(f"Mock WhatsApp Send to {to_number}: {message_body}")
        return True

    url = f"https://graph.facebook.com/v17.0/{PHONE_NUMBER_ID}/messages"
    headers = {
        "Authorization": f"Bearer {WHATSAPP_TOKEN}",
        "Content-Type": "application/json"
    }
    payload = {
        "messaging_product": "whatsapp",
        "to": to_number,
        "text": {"body": message_body}
    }

    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(url, headers=headers, json=payload, timeout=10.0)
            response.raise_for_status()
            logger.info(f"WhatsApp message sent to {to_number}")
            return True
        except httpx.HTTPError as e:
            logger.error(f"Failed to send WhatsApp message: {e}")
            return False
