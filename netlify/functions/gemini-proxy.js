// netlify/functions/gemini-proxy.js

// Lendo a chave de API de forma segura das Variáveis de Ambiente do Netlify (NUNCA EXPOSTA)
const API_KEY = process.env.GEMINI_API_KEY; 

// Endpoint do Gemini
const GEMINI_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + API_KEY;

// 🟢 NOVA CONSTANTE: PROMPT DE SISTEMA COMPLETO DO JOÃO IA
const SYSTEM_PROMPT = `VOCÊ DEVE RESPONDER SOMENTE COM TEXTO SIMPLES E CORRIDO. É ABSOLUTAMENTE PROIBIDO o uso de qualquer formatação Markdown, como negrito, itálico, listas, cabeçalhos (#) ou traços.

Você é o "João", o assistente virtual da plataforma Somos Um.

Sua especialidade é fornecer informações exclusivas sobre Educação, Cultura Afro-Brasileira, Desenvolvimento Comunitário e conteúdo específico da plataforma Somos Um.

REGRAS DE CONTEÚDO:
1. Responda sempre de forma curta e direta, usando as informações da Somos Um.
2. Se a pergunta for muito geral ou não relacionada à plataforma (ex: "Qual a capital da França?"), você deve responder de forma cortês, dizendo: "Essa pergunta vai um pouco além dos temas da plataforma Somos Um, mas posso ajudar com informações sobre Educadores, Lei 10.639, biblioteca ou eventos da nossa comunidade."
3. Não se identifique como um modelo de linguagem ou IA, a menos que seja especificamente perguntado. Responda como o João.`;

// Função principal que o Netlify Functions executa
exports.handler = async (event, context) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: "Método não permitido." };
    }

    try {
        // Extrai o 'prompt' da requisição JSON do Front-end
        const { prompt } = JSON.parse(event.body);

        if (!prompt) {
            return { 
                statusCode: 400, 
                body: JSON.stringify({ status: "error", resposta: "Prompt não fornecido." }) 
            };
        }

        // Chamada à API do Gemini
        const geminiResponse = await fetch(GEMINI_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            // 🟢 ATUALIZADO: O corpo da requisição agora envia o SYSTEM_PROMPT e a pergunta do usuário
            body: JSON.stringify({
                contents: [
                    {
                        role: "user",
                        parts: [
                            { text: SYSTEM_PROMPT }, // 1. O prompt de contexto
                            { text: prompt } // 2. A pergunta do usuário
                        ]
                    }
                ]
            })
        });

        const geminiData = await geminiResponse.json();
        
        // Extrai e trata a resposta
        const iaText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || "Erro: Não foi possível extrair a resposta da IA.";

        // Retorna o JSON de sucesso (Netlify resolve o CORS e envia a resposta ao joao-ia.js)
        return {
            statusCode: 200,
            body: JSON.stringify({ 
                status: "success", 
                resposta: iaText 
            }),
            headers: {
                "Content-Type": "application/json"
            }
        };

    } catch (error) {
        console.error("Erro na Netlify Function:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ 
                status: "error", 
                resposta: "Erro interno do servidor: " + error.message 
            })
        };
    }
};