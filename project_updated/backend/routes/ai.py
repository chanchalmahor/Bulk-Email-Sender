from fastapi import APIRouter
from pydantic import BaseModel
from google import genai
import os

router = APIRouter()
client = genai.Client(api_key=os.getenv("GEMINI_API_KEY", ""))

class AIRequest(BaseModel):
    role: str
    skills: str
    tone: str = "professional"
    extra: str = ""

class PromptRequest(BaseModel):
    prompt: str

@router.post("/generate")
async def generate_email(req: AIRequest):
    try:
        prompt = f"""Write a cold job application email body for a {req.role} position.
Use {{name}} for the HR contact name and {{company}} for company name as merge placeholders.
Skills to highlight: {req.skills}
Tone: {req.tone}
Extra instructions: {req.extra}
Return ONLY the email body text. No subject line. No preamble. Start with 'Dear {{name}},'."""

        response = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=prompt
        )
        return {"body": response.text}
    except Exception as e:
        return {"error": str(e)}

@router.post("/prompt")
async def generate_from_prompt(req: PromptRequest):
    try:
        full_prompt = f"""{req.prompt}

Important rules:
- Use {{name}} for HR contact name and {{company}} for company name as merge placeholders.
- Return ONLY the email body text.
- No subject line, no preamble.
- Start with 'Dear {{name}},'."""

        response = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=full_prompt
        )
        return {"body": response.text}
    except Exception as e:
        return {"error": str(e)}