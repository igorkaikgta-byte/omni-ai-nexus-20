# main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import openai

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class Message(BaseModel):
    user: str
    text: str

@app.post("/mensagem")  # OBS: rota deve bater com o que o Lovable chama
async def message_endpoint(msg: Message):
    print(f"Recebi mensagem do Lovable: {msg}")  # print para checar se está chegando
    try:
        openai.api_key = "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"  # substitua pela sua chave
        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": msg.text}]
        )
        reply = response.choices[0].message.content
        print(f"Resposta da OpenAI: {reply}")
        return {"response": reply}
    except Exception as e:
        print("Erro ao processar mensagem:", e)
        return {"response": "Erro ao se comunicar com a OpenAI."}

