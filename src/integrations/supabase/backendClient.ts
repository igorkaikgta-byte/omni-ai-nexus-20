// backendClient.ts
export const BACKEND_URL = "https://omni-ai-nexus-20.onrender.com"; // URL do Render

export async function sendMessageToBackend(user: string, text: string) {
  try {
    const response = await fetch(`${BACKEND_URL}/mensagem`, {  // rota padronizada
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user, text }),
    });

    if (!response.ok) {
      throw new Error(`Erro do backend: ${response.status}`);
    }

    const data = await response.json();
    return data.response || "Sem resposta da IA.";
  } catch (error) {
    console.error("Erro ao enviar mensagem para o backend:", error);
    return "Erro ao se comunicar com a IA.";
  }
}
