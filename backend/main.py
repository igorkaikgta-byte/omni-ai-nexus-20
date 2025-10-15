from fastapi import FastAPI
from pydantic import BaseModel
from openai import OpenAI
import os

app = FastAPI()

# 👇 Coloque aqui sua chave da OpenAI
os.environ["OPENAI_API_KEY"] = "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"

client = OpenAI()

@app.get("/")
def home():
    return {"message": "Backend rodando com IA 🚀"}

class Message(BaseModel):
    message: str

@app.post("/ai/message")
def chat(message: Message):
    try:
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "Você é um assistente amigável e inteligente."},
                {"role": "user", "content": message.message}
            ]
        )
        answer = response.choices[0].message.content
        return {"response": answer}
    except Exception as e:
        return {"error": str(e)}

