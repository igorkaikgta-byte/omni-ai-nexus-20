import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// 🔹 URL fixa do seu backend no Render
const BACKEND_URL = "https://omni-ai-nexus-20.onrender.com";

// 🔹 Função para processar arquivos
async function processFiles(files: Array<{ name: string; type: string; data: string }>) {
  const processedFiles = [];

  for (const file of files) {
    console.log("Processing file:", file.name, "type:", file.type);

    if (file.type.startsWith("image/")) {
      processedFiles.push({
        type: "image",
        name: file.name,
        mimeType: file.type,
        data: file.data,
      });
    } else if (file.type === "text/plain" || file.name.endsWith(".txt")) {
      try {
        const text = atob(file.data);
        processedFiles.push({
          type: "text",
          name: file.name,
          content: text,
        });
      } catch (e) {
        console.error("Error decoding text file:", e);
      }
    } else if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
      processedFiles.push({
        type: "document",
        name: file.name,
        fileType: "PDF",
        note: "Documento PDF anexado",
      });
    } else if (file.type.includes("word") || file.name.endsWith(".docx") || file.name.endsWith(".doc")) {
      processedFiles.push({
        type: "document",
        name: file.name,
        fileType: "Word",
        note: "Documento Word anexado",
      });
    } else if (file.type.includes("sheet") || file.name.endsWith(".xlsx") || file.name.endsWith(".xls") || file.name.endsWith(".csv")) {
      processedFiles.push({
        type: "document",
        name: file.name,
        fileType: "Planilha",
        note: "Planilha anexada",
      });
    } else {
      processedFiles.push({
        type: "unknown",
        name: file.name,
        note: "Arquivo anexado",
      });
    }
  }

  return processedFiles;
}

// 🔹 Função para formatar mensagens com arquivos
function formatMessagesWithFiles(messages: any[], processedFiles: any[]) {
  if (processedFiles.length === 0) return messages;

  const formattedMessages = [...messages];
  const lastMessageIndex = formattedMessages.length - 1;
  const lastMessage = formattedMessages[lastMessageIndex];

  const imageFiles = processedFiles.filter((f) => f.type === "image");
  const otherFiles = processedFiles.filter((f) => f.type !== "image");

  if (imageFiles.length > 0) {
    const contentParts: any[] = [];

    if (typeof lastMessage.content === "string") {
      contentParts.push({
        type: "text",
        text: lastMessage.content,
      });
    }

    if (otherFiles.length > 0) {
      let filesContext = "\n\n📎 Arquivos anexados:\n";
      for (const file of otherFiles) {
        if (file.type === "text") {
          filesContext += `- 📄 ${file.name}:\n\`\`\`\n${file.content}\n\`\`\`\n`;
        } else if (file.type === "document") {
          filesContext += `- 📋 ${file.name} (${file.fileType}) - Documento identificado mas conteúdo não extraído ainda.\n`;
        } else {
          filesContext += `- 📎 ${file.name}\n`;
        }
      }
      contentParts[0].text += filesContext;
    }

    for (const img of imageFiles) {
      contentParts.push({
        type: "image_url",
        image_url: {
          url: `data:${img.mimeType};base64,${img.data}`,
        },
      });
    }

    formattedMessages[lastMessageIndex] = {
      ...lastMessage,
      content: contentParts,
    };
  } else {
    let filesContext = "\n\n📎 Arquivos anexados:\n";
    for (const file of otherFiles) {
      if (file.type === "text") {
        filesContext += `- 📄 ${file.name}:\n\`\`\`\n${file.content}\n\`\`\`\n`;
      } else if (file.type === "document") {
        filesContext += `- 📋 ${file.name} (${file.fileType}) - Documento identificado mas conteúdo não extraído ainda.\n`;
      } else {
        filesContext += `- 📎 ${file.name}\n`;
      }
    }

    if (typeof lastMessage.content === "string") {
      lastMessage.content += filesContext;
    }
  }

  return formattedMessages;
}

// 🔹 Servidor principal
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, files } = await req.json();
    console.log("Received chat request with", messages.length, "messages");

    let processedFiles: any[] = [];
    if (files && files.length > 0) {
      processedFiles = await processFiles(files);
      console.log("Processed", processedFiles.length, "files");
    }

    const formattedMessages = formatMessagesWithFiles(messages, processedFiles);

    // 🚀 Chama seu backend hospedado no Render
    const response = await fetch(`${BACKEND_URL}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: formattedMessages,
        files: processedFiles,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Backend error:", response.status, errorText);
      throw new Error(`Backend error: ${response.status}`);
    }

    return new Response(response.body, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
      },
    });
  } catch (err) {
    console.error("Error in chat function:", err);
    const errorMessage = err instanceof Error ? err.message : "An error occurred";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
