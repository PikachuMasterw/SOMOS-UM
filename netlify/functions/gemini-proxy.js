// netlify/functions/gemini-proxy.js

// Lendo a chave de API de forma segura das Variáveis de Ambiente do Netlify
const API_KEY = process.env.GEMINI_API_KEY;

// Endpoint do Gemini
const GEMINI_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + API_KEY;

// PROMPT DE SISTEMA SIMPLIFICADO
const SYSTEM_PROMPT = `Você é João, assistente virtual da plataforma "Somos Um" para educadores.
Especializado em educação, cultura afro-brasileira e Lei 10.639/2003.
Responda de forma concisa e direta.
Sempre sugira recursos, atividades ou estratégias práticas para sala de aula.
Considere diferentes níveis de ensino.
Não use formatação markdown, listas ou emojis - apenas texto corrido.
Foco: auxiliar professores na preparação de aulas, planos de ensino e recursos didáticos.

Agora, responda à pergunta do educador:`;

exports.handler = async (event, context) => {
    // Configurar CORS
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
        'Access-Control-Max-Age': '86400',
        'Content-Type': 'application/json; charset=utf-8'
    };

    // Lidar com requisições OPTIONS para CORS
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers,
            body: ''
        };
    }

    if (event.httpMethod !== 'POST') {
        return { 
            statusCode: 405, 
            headers,
            body: JSON.stringify({ status: "error", resposta: "Método não permitido." }) 
        };
    }

    try {
        // Extrai o 'prompt'
        const { prompt } = JSON.parse(event.body);

        if (!prompt) {
            return { 
                statusCode: 400,
                headers,
                body: JSON.stringify({ status: "error", resposta: "Por favor, digite sua pergunta." }) 
            };
        }

        if (!API_KEY) {
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({ 
                    status: "error", 
                    resposta: "Serviço temporariamente indisponível." 
                })
            };
        }

        // Chamada à API do Gemini
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000);

        try {
            const geminiResponse = await fetch(GEMINI_ENDPOINT, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    contents: [
                        {
                            role: "user",
                            parts: [
                                { text: SYSTEM_PROMPT + "\n\nPERGUNTA DO EDUCADOR: " + prompt }
                            ]
                        }
                    ],
                    generationConfig: {
                        temperature: 0.7,
                        maxOutputTokens: 2000, // Aumentado ainda mais
                        topP: 0.8,
                        topK: 40
                    }
                }),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!geminiResponse.ok) {
                throw new Error(`API Gemini retornou status ${geminiResponse.status}`);
            }

            const geminiData = await geminiResponse.json();
            
            // Extrai e trata a resposta
            let iaText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || 
                       "Desculpe, não consegui processar sua pergunta no momento. Tente reformulá-la.";

            // Limpar formatação básica mas preservar pontuação
            iaText = iaText
                .replace(/\*\*/g, '')
                .replace(/\*/g, '')
                .replace(/\#\#\#/g, '')
                .trim();

            // Garantir que a resposta termine com pontuação completa
            if (!/[.!?]$/.test(iaText.trim())) {
                iaText = iaText.trim() + ".";
            }

            // Log para debug
            console.log("📝 Resposta completa enviada (tamanho):", iaText.length);
            console.log("📝 Últimos 50 caracteres:", iaText.slice(-50));

            // Retorna o JSON de sucesso
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ 
                    status: "success", 
                    resposta: iaText 
                })
            };

        } catch (fetchError) {
            clearTimeout(timeoutId);
            throw fetchError;
        }

    } catch (error) {
        console.error("Erro:", error);
        
        // Resposta de fallback
        const fallbackResponse = "Como João, assistente pedagógico, posso ajudar com questões sobre Lei 10.639/2003, planos de aula ou recursos para educação afro-brasileira.";
        
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ 
                status: "success", 
                resposta: fallbackResponse 
            })
        };
    }
};