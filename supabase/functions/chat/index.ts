import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Função para processar arquivos e extrair conteúdo
async function processFiles(files: Array<{ name: string; type: string; data: string }>) {
  const processedFiles = [];
  
  for (const file of files) {
    console.log('Processing file:', file.name, 'type:', file.type);
    
    // Para imagens, retornar diretamente para o modelo multimodal
    if (file.type.startsWith('image/')) {
      processedFiles.push({
        type: 'image',
        name: file.name,
        mimeType: file.type,
        data: file.data
      });
    }
    // Para arquivos de texto
    else if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
      try {
        const text = atob(file.data);
        processedFiles.push({
          type: 'text',
          name: file.name,
          content: text
        });
      } catch (e) {
        console.error('Error decoding text file:', e);
      }
    }
    // Para PDFs e outros documentos, extrair informações básicas
    else if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
      processedFiles.push({
        type: 'document',
        name: file.name,
        fileType: 'PDF',
        note: 'Documento PDF anexado'
      });
    }
    else if (file.type.includes('word') || file.name.endsWith('.docx') || file.name.endsWith('.doc')) {
      processedFiles.push({
        type: 'document',
        name: file.name,
        fileType: 'Word',
        note: 'Documento Word anexado'
      });
    }
    else if (file.type.includes('sheet') || file.name.endsWith('.xlsx') || file.name.endsWith('.xls') || file.name.endsWith('.csv')) {
      processedFiles.push({
        type: 'document',
        name: file.name,
        fileType: 'Planilha',
        note: 'Planilha anexada'
      });
    }
    else {
      processedFiles.push({
        type: 'unknown',
        name: file.name,
        note: 'Arquivo anexado'
      });
    }
  }
  
  return processedFiles;
}

// Função para formatar mensagens com arquivos para o modelo
function formatMessagesWithFiles(messages: any[], processedFiles: any[]) {
  if (processedFiles.length === 0) {
    return messages;
  }
  
  const formattedMessages = [...messages];
  const lastMessage = formattedMessages[formattedMessages.length - 1];
  
  // Construir contexto dos arquivos
  let filesContext = '\n\n📎 Arquivos anexados:\n';
  const imageFiles = [];
  
  for (const file of processedFiles) {
    if (file.type === 'image') {
      imageFiles.push(file);
      filesContext += `- 🖼️ ${file.name} (imagem para análise)\n`;
    } else if (file.type === 'text') {
      filesContext += `- 📄 ${file.name}:\n\`\`\`\n${file.content}\n\`\`\`\n`;
    } else if (file.type === 'document') {
      filesContext += `- 📋 ${file.name} (${file.fileType})\n`;
    } else {
      filesContext += `- 📎 ${file.name}\n`;
    }
  }
  
  // Se houver imagens, preparar para envio multimodal
  if (imageFiles.length > 0) {
    // Gemini 2.5 Flash suporta análise de imagens
    // Adicionar contexto sobre as imagens
    filesContext += '\nPor favor, analise as imagens anexadas e responda com base no conteúdo visual.';
  }
  
  // Adicionar contexto ao conteúdo da última mensagem
  if (typeof lastMessage.content === 'string') {
    lastMessage.content = lastMessage.content + filesContext;
  }
  
  return formattedMessages;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, files } = await req.json();
    console.log('Received chat request with', messages.length, 'messages');
    
    if (files && files.length > 0) {
      console.log('Received', files.length, 'files');
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY not configured');
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Processar arquivos se houver
    let processedFiles: any[] = [];
    if (files && files.length > 0) {
      processedFiles = await processFiles(files);
      console.log('Processed', processedFiles.length, 'files');
    }

    // Formatar mensagens com contexto dos arquivos
    const formattedMessages = formatMessagesWithFiles(messages, processedFiles);

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: 'Você é uma IA assistente inteligente e prestativa. Responda de forma clara, concisa e profissional em português do Brasil. Você tem acesso a múltiplas capacidades e pode ajudar com diversas tarefas. Quando arquivos forem anexados, analise o conteúdo e responda com base nas informações fornecidas.'
          },
          ...formattedMessages
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Limite de taxa excedido. Por favor, tente novamente em alguns instantes.' }),
          { 
            status: 429, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Pagamento necessário. Por favor, adicione créditos ao seu workspace.' }),
          { 
            status: 402, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      throw new Error(`AI Gateway error: ${response.status}`);
    }

    // Return the streaming response directly
    return new Response(response.body, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
      },
    });

  } catch (err) {
    console.error('Error in chat function:', err);
    const errorMessage = err instanceof Error ? err.message : 'An error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
