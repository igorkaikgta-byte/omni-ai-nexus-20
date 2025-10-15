# main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import openai
import os

# Inicializa FastAPI
app = FastAPI()

# Configura CORS para qualquer origem
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Modelo esperado no corpo da requisição
class Message(BaseModel):
    user: str
    text: str

# Endpoint principal para receber mensagens
@app.post("/mensagem")
async def message_endpoint(msg: Message):
    print(f"📩 Recebi mensagem do usuário '{msg.user}': {msg.text}")

    try:
        # Pega a chave da variável de ambiente
        chave_openai = os.getenv("OPENAI_API_KEY")
        print("🔑 Chave OpenAI:", "CONFIGURADA" if chave_openai else "NÃO CONFIGURADA")
        
        if not chave_openai:
            return {"response": "Erro: chave OpenAI não configurada no Render."}

        openai.api_key = chave_openai

        # Chamada ao ChatGPT
        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "Você é um assistente útil e direto."},
                {"role": "user", "content": msg.text},
            ],
        )

        reply = response.choices[0].message.content.strip()
        print(f"🤖 Resposta da IA: {reply}")

        return {"response": reply}

    except Exception as e:
        print("❌ Erro ao processar mensagem:", e)
        return {"response": f"Erro ao se comunicar com a OpenAI: {e}"}

# Rota simples de teste
@app.get("/")
def root():
    return {"message": "🚀 Backend da Omni AI Nexus rodando com sucesso!"}
