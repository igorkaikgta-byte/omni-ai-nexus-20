# main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import openai  # se você usar OpenAI para a IA

# Inicializa o app
app = FastAPI()

# Habilita CORS para qualquer origem (ou coloque o domínio do seu front)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # para produção, coloque seu domínio
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Modelo da requisição
class Message(BaseModel):
    user: str
    text: str

# Endpoint para o chat
@app.post("/message")
async def message_endpoint(msg: Message):
    user_text = msg.text

    try:
        # Aqui você chama sua IA (exemplo com OpenAI)
        # Substitua com sua lógica de IA ou Sienge
        # Exemplo de resposta dummy:
        reply = f"Você disse: {user_text}"

        # Se usar OpenAI:
        # openai.api_key = "SUA_CHAVE"
        # response = openai.ChatCompletion.create(
        #     model="gpt-3.5-turbo",
        #     messages=[{"role": "user", "content": user_text}]
        # )
        # reply = response.choices[0].message.content

        return {"response": reply}

    except Exception as e:
        print("Erro ao processar mensagem:", e)
        return {"response": "Desculpe, ocorreu um erro ao tentar responder."}
