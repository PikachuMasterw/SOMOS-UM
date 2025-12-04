// netlify/functions/gemini-proxy.js

// Lendo a chave de API de forma segura das Variáveis de Ambiente do Netlify
const API_KEY = process.env.GEMINI_API_KEY;

// Endpoint do Gemini
const GEMINI_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + API_KEY;

// PROMPT DE SISTEMA SIMPLIFICADO - MUITO MAIS CURTO!
const SYSTEM_PROMPT = `Você é João, assistente virtual da plataforma "Somos Um" para educadores.
Especializado em educação, cultura afro-brasileira e Lei 10.639/2003.
Responda de forma concisa e direta (máximo 250 palavras).
Sempre sugira recursos, atividades ou estratégias práticas para sala de aula.
Considere diferentes níveis de ensino (Fundamental I, II, Médio, Superior).
Não use formatação markdown, listas ou emojis - apenas texto corrido.
Foco: auxiliar professores na preparação de aulas, planos de ensino e recursos didáticos.

Agora, responda à pergunta do educador:`;

exports.handler = async (event, context) => {
    // ========== LOG INICIAL ==========
    console.log("=== GEMINI PROXY CHAMADO ===");
    console.log("Método HTTP:", event.httpMethod);
    console.log("Path:", event.path);
    
    // Configurar CORS
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
        'Access-Control-Max-Age': '86400',
        'Content-Type': 'application/json'
    };

    // Lidar com requisições OPTIONS para CORS
    if (event.httpMethod === 'OPTIONS') {
        console.log("✅ Respondendo a requisição OPTIONS (CORS)");
        return {
            statusCode: 200,
            headers,
            body: ''
        };
    }

    if (event.httpMethod !== 'POST') {
        console.log(`❌ Método ${event.httpMethod} não permitido`);
        return { 
            statusCode: 405, 
            headers,
            body: JSON.stringify({ status: "error", resposta: "Método não permitido." }) 
        };
    }

    // ========== VERIFICAÇÃO INICIAL DO BODY ==========
    console.log("📥 Corpo da requisição (raw):", event.body);
    console.log("Tipo do body:", typeof event.body);
    
    let prompt;
    try {
        if (!event.body) {
            console.log("❌ Body está vazio");
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ status: "error", resposta: "Body vazio." })
            };
        }
        
        const body = JSON.parse(event.body);
        console.log("📝 Body parseado:", body);
        
        prompt = body.prompt;
        
        if (!prompt) {
            console.log("❌ Campo 'prompt' não encontrado no body");
            return { 
                statusCode: 400,
                headers,
                body: JSON.stringify({ status: "error", resposta: "Por favor, digite sua pergunta no campo 'prompt'." }) 
            };
        }
        
        console.log("✅ Prompt extraído:", prompt);
        
    } catch (parseError) {
        console.error("❌ Erro ao parsear JSON:", parseError);
        return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ 
                status: "error", 
                resposta: "Formato de requisição inválido." 
            })
        };
    }

    // ========== VERIFICAÇÃO DA CHAVE API ==========
    console.log("🔑 Verificando API_KEY...");
    console.log("API_KEY definida?", !!API_KEY);
    
    if (!API_KEY) {
        console.error("❌ API_KEY não configurada no Netlify");
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
                status: "error", 
                resposta: "Erro de configuração do servidor." 
            })
        };
    }
    
    console.log("✅ API_KEY verificada com sucesso");

    // ========== CHAMADA À API GEMINI ==========
    console.log("🚀 Preparando chamada para API Gemini...");
    
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);
        console.log("⏱️  Timeout configurado: 15 segundos");
        
        // Prompt final muito mais curto
        const finalPrompt = SYSTEM_PROMPT + "\n\nPERGUNTA DO EDUCADOR: " + prompt;
        console.log("📝 Prompt final (tamanho):", finalPrompt.length, "caracteres");
        
        const requestBody = {
            contents: [
                {
                    role: "user",
                    parts: [
                        { text: finalPrompt }
                    ]
                }
            ],
            generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 1000, // Aumentado para garantir resposta
                topP: 0.8,
                topK: 40
            }
        };
        
        console.log("📦 Enviando requisição para Gemini...");
        
        const geminiResponse = await fetch(GEMINI_ENDPOINT, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(requestBody),
            signal: controller.signal
        });

        clearTimeout(timeoutId);
        console.log("📥 Resposta do Gemini recebida");
        console.log("📊 Status:", geminiResponse.status, geminiResponse.statusText);

        if (!geminiResponse.ok) {
            let errorBody = "";
            try {
                errorBody = await geminiResponse.text();
                console.error("📄 Erro da API Gemini:", errorBody);
            } catch (e) {}
            
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ 
                    status: "error", 
                    resposta: "Erro ao processar sua pergunta. Tente novamente." 
                })
            };
        }

        const geminiData = await geminiResponse.json();
        console.log("✅ Dados recebidos da Gemini");
        console.log("📦 Estrutura dos dados:", Object.keys(geminiData));
        
        // Extrai a resposta - verificação mais robusta
        let iaText = "";
        
        if (geminiData.candidates && 
            geminiData.candidates[0] && 
            geminiData.candidates[0].content && 
            geminiData.candidates[0].content.parts && 
            geminiData.candidates[0].content.parts[0] &&
            geminiData.candidates[0].content.parts[0].text) {
            
            iaText = geminiData.candidates[0].content.parts[0].text;
            console.log("✍️ Resposta da IA encontrada, tamanho:", iaText.length);
            
        } else {
            console.warn("⚠️ Estrutura de resposta inesperada, usando fallback");
            console.warn("Dados completos:", JSON.stringify(geminiData).substring(0, 500));
            
            // Verificar se há erro de MAX_TOKENS
            if (geminiData.candidates && 
                geminiData.candidates[0] && 
                geminiData.candidates[0].finishReason === "MAX_TOKENS") {
                iaText = "Sua pergunta é muito complexa. Tente simplificá-la ou dividir em partes menores.";
            } else {
                // Usar resposta local como fallback
                const lowerPrompt = prompt.toLowerCase();
                if (lowerPrompt.includes("zumbi") || lowerPrompt.includes("palmares")) {
                    iaText = "Zumbi dos Palmares foi líder do Quilombo dos Palmares no século XVII, símbolo da resistência negra à escravidão. Para trabalhar em sala: 1) Contextualizar a escravidão no Brasil; 2) Analisar a organização dos quilombos; 3) Debater a resistência cultural. Recursos: filme 'Quilombo', livro 'Palmares' de Décio Freitas.";
                } else if (lowerPrompt.includes("lei") || lowerPrompt.includes("10.639")) {
                    iaText = "Lei 10.639/2003 torna obrigatório o ensino de História e Cultura Afro-Brasileira. Implementação: 1) Formação docente; 2) Material didático inclusivo; 3) Projetos interdisciplinares. Recursos: BNCC, Diretrizes Curriculares, Portal do MEC.";
                } else {
                    iaText = "Para uma resposta completa sobre educação afro-brasileira, especifique: nível de ensino (Fundamental, Médio) e tema específico (história, cultura, personalidades).";
                }
            }
        }

        // Limpar formatação básica
        iaText = iaText
            .replace(/\*\*/g, '')
            .replace(/\*/g, '')
            .trim();

        console.log("✨ Resposta final processada");
        
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ 
                status: "success", 
                resposta: iaText 
            })
        };

    } catch (fetchError) {
        console.error("❌ Erro na chamada fetch:", fetchError);
        
        if (fetchError.name === 'AbortError') {
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ 
                    status: "error", 
                    resposta: "Tempo limite excedido. Tente novamente." 
                })
            };
        }
        
        // Resposta de fallback local
        const lowerPrompt = prompt.toLowerCase();
        let fallbackResponse;
        
        if (lowerPrompt.includes("zumbi") || lowerPrompt.includes("palmares")) {
            fallbackResponse = "Zumbi dos Palmares: líder do Quilombo dos Palmares, símbolo da resistência negra no Brasil colonial. Para aula: abordar contexto histórico da escravidão, organização dos quilombos, e importância para a cultura afro-brasileira.";
        } else if (lowerPrompt.includes("lei")) {
            fallbackResponse = "Lei 10.639/2003: obriga ensino de História e Cultura Afro-Brasileira. Sugestões: projetos interdisciplinares, formação docente, recursos como livros de Conceição Evaristo e documentários sobre cultura negra.";
        } else {
            fallbackResponse = "Como João, assistente pedagógico, posso ajudar com questões sobre Lei 10.639/2003, planos de aula ou recursos para educação afro-brasileira. Especifique sua dúvida!";
        }
        
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