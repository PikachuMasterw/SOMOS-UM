// netlify/functions/gemini-proxy.js

// Lendo a chave de API de forma segura das Variáveis de Ambiente do Netlify (NUNCA EXPOSTA)
const API_KEY = process.env.GEMINI_API_KEY; 

// Endpoint do Gemini
const GEMINI_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + API_KEY;

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
            body: JSON.stringify({
                contents: [{ role: "user", parts: [{ text: prompt }] }]
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