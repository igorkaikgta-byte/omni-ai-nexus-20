# main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import openai

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

# Endpoint para receber mensagens do Lovable
@app.post("/mensagem")  # rota padronizada
async def message_endpoint(msg: Message):
    print(f"📩 Recebi mensagem do usuário '{msg.user}': {msg.text}")

    try:
        # Sua chave OpenAI (ideal usar variável de ambiente depois)
        openai.api_key = "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"

        # Chamada ao ChatGPT
        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "Você é um assistente útil e direto."},
                {"role": "user", "content": msg.text},
            ]
        )

        reply = response.choices[0].message.content.strip()
        print(f"🤖 Resposta da IA: {reply}")

        return {"response": reply}

    except Exception as e:
        print("❌ Erro ao processar mensagem:", e)
        return {"response": "Erro ao se comunicar com a OpenAI."}

# Rota simples de teste
@app.get("/")
def root():
    return {"message": "🚀 Backend da Omni AI Nexus rodando com sucesso!"}
