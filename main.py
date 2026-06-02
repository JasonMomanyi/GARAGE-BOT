import os
import logging
from fastapi import FastAPI, Request, HTTPException, Depends
from dotenv import load_dotenv
from sqlalchemy.orm import Session
import asyncio

from database import engine, Base, get_db
from models import Customer, ConversationState
from services.whatsapp_client import send_whatsapp_message
from services.ai_client import generate_response

# Setup logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

load_dotenv()

# Create DB Tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="ABC Garage WhatsApp Engine")

VERIFY_TOKEN = os.getenv("WHATSAPP_VERIFY_TOKEN", "default_verify_token")

@app.on_event("startup")
async def startup_event():
    logger.info("ABC Garage WhatsApp Engine - Developed by Alex Maina")

@app.get("/webhook")
async def verify_webhook(request: Request):
    """Webhook verification for Meta Cloud API."""
    mode = request.query_params.get("hub.mode")
    token = request.query_params.get("hub.verify_token")
    challenge = request.query_params.get("hub.challenge")

    if mode and token:
        if mode == "subscribe" and token == VERIFY_TOKEN:
            logger.info("WEBHOOK_VERIFIED")
            return int(challenge)
        else:
            raise HTTPException(status_code=403, detail="Verification failed")
    raise HTTPException(status_code=400, detail="Missing parameters")

@app.post("/webhook")
async def handle_webhook(request: Request, db: Session = Depends(get_db)):
    """Handle incoming WhatsApp messages."""
    try:
        body = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON")

    logger.info(f"Incoming webhook: {body}")

    try:
        # Extract basic WhatsApp payload (Meta Cloud API format)
        entry = body.get("entry", [])[0]
        changes = entry.get("changes", [])[0]
        value = changes.get("value", {})
        
        if "messages" in value:
            message = value["messages"][0]
            phone_number = message["from"]
            
            # Handle text messages
            if message["type"] == "text":
                text = message["text"]["body"].strip().lower()
                
                # 1. Check/Create Conversation State
                state = db.query(ConversationState).filter(ConversationState.phone_number == phone_number).first()
                if not state:
                    state = ConversationState(phone_number=phone_number)
                    db.add(state)
                    db.commit()
                
                # Ensure customer exists
                customer = db.query(Customer).filter(Customer.phone == phone_number).first()
                if not customer:
                    customer = Customer(phone=phone_number)
                    db.add(customer)
                    db.commit()

                # 2. Human Escalation Check
                if state.is_escalated:
                    logger.info(f"Message from {phone_number} ignored (Escalated to human).")
                    return {"status": "ignored_escalated"}
                
                # 3. Handle specific quick keywords
                if text in ["menu", "hi", "hello", "back"]:
                    state.current_step = None
                    db.commit()
                    menu_msg = (
                        "Welcome to ABC Garage. How can we help today?\n"
                        "1. Book Service\n"
                        "2. Service Pricing\n"
                        "3. Vehicle Status\n"
                        "4. Speak to an Agent\n"
                        "(Or just tell me what you need in your own words!)"
                    )
                    await send_whatsapp_message(phone_number, menu_msg)
                    return {"status": "ok"}
                
                if text == "4":
                    state.is_escalated = True
                    db.commit()
                    logger.info(f"User {phone_number} requested human agent.")
                    await send_whatsapp_message(phone_number, "Connecting you to an agent. Automation paused.")
                    return {"status": "ok"}

                # 4. Route to AI for dynamic handling
                ai_response = await generate_response(text)
                await send_whatsapp_message(phone_number, ai_response)
                
    except Exception as e:
        logger.error(f"Error processing webhook: {e}")
        # Always return 200 OK so WhatsApp doesn't retry infinitely
        return {"status": "error"}

    return {"status": "ok"}
