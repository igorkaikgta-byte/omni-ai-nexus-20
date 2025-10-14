from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional
from sienge_api import get_contas_a_pagar, get_extrato_cliente
from openai_integration import ask_openai
import os

app = FastAPI(title="Omni AI Nexo - Backend Sienge + IA")

class Query(BaseModel):
    pergunta: str
    empresa: Optional[str] = None

@app.post("/perguntar")
async def perguntar(data: Query):
    try:
        # Step 1: Ask the IA what intent is
        intent_text = ask_openai(f"""Você é um assistente que identifica intenções de consulta sobre Sienge.
        Retorne apenas uma intenção curta entre: CONTAS_A_PAGAR, EXTRATO_CLIENTE, OUTRO
        Pergunta: {data.pergunta}
        """)
        intent = intent_text.strip().upper()
        if "CONTAS" in intent and "PAGAR" in intent or intent == "CONTAS_A_PAGAR":
            resultado = get_contas_a_pagar(data.empresa)
        elif "EXTRATO" in intent or intent == "EXTRATO_CLIENTE":
            resultado = get_extrato_cliente(data.empresa)
        else:
            resultado = {"message": "Não encontrei uma consulta correspondente à pergunta."}
        return {"pergunta": data.pergunta, "intent_detected": intent, "resposta": resultado}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
