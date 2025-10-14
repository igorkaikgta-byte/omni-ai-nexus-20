import os
import openai
from dotenv import load_dotenv

load_dotenv()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
if not OPENAI_API_KEY:
    raise Exception("OPENAI_API_KEY is not set in environment")

openai.api_key = OPENAI_API_KEY

def ask_openai(prompt: str) -> str:
    # Simple wrapper - you can change model and parameters as needed.
    resp = openai.ChatCompletion.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": "Você é uma assistente que identifica intenções e interpreta perguntas relacionadas a dados financeiros do Sienge."},
            {"role": "user", "content": prompt},
        ],
        max_tokens=256,
        temperature=0.0,
    )
    # Compatible with classic OpenAI response shape
    choices = resp.get('choices') or []
    if not choices:
        return ""
    message = choices[0].get('message') or choices[0]
    return message.get('content', '').strip()
