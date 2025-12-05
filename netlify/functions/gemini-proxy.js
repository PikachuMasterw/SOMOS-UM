// netlify/functions/gemini-proxy.js
// VERSÃO FINAL - Usando IA REAL com Gemini

// Configuração da API
const GEMINI_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent";

// Prompt de sistema otimizado para respostas curtas
const SYSTEM_PROMPT = `Você é João, assistente pedagógico da plataforma "Somos Um".
Foco: educação sobre cultura afro-brasileira e Lei 10.639/2003.

DIRETRIZES:
1. Seja DIRETO (máximo 3-4 frases)
2. Foque em ASPECTOS PRÁTICOS para sala de aula
3. Sugira 1-2 recursos ou atividades
4. Adapte para nível de ensino quando mencionado
5. Sem formatação, apenas texto simples

EXEMPLO DE RESPOSTA IDEAL:
"Para Zumbi no 7º ano: analise documentos históricos sobre Palmares, debate sobre resistência. Recurso: documentário Quilombo (1984)."

Agora responda à pergunta:`;

exports.handler = async (event, context) => {
    console.log("=== JOÃO IA - SISTEMA ATIVO ===");
    
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Content-Type': 'application/json'
    };

    if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };
    if (event.httpMethod !== 'POST') return { statusCode: 405, headers, body: JSON.stringify({ status: "error", resposta: "Método não permitido." }) };

    try {
        const { prompt } = JSON.parse(event.body || '{}');
        console.log("📝 Pergunta:", prompt);

        if (!prompt || prompt.trim() === '') {
            return { 
                statusCode: 400,
                headers,
                body: JSON.stringify({ status: "error", resposta: "Digite sua pergunta." }) 
            };
        }
        
        const lower = prompt.toLowerCase().trim();
        
        // ========== RESPOSTAS RÁPIDAS ==========
        
        // Saudações
        if (["oi", "olá", "ola", "bom dia", "boa tarde", "boa noite"].includes(lower)) {
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ 
                    status: "success", 
                    resposta: "Olá! Sou João, assistente pedagógico. Como posso ajudar com cultura afro-brasileira?" 
                })
            };
        }
        
        // Identificação
        if (lower.includes("qual seu nome") || lower.includes("quem é você")) {
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ 
                    status: "success", 
                    resposta: "Sou João, assistente da plataforma Somos Um. Especializado em educação sobre cultura afro-brasileira." 
                })
            };
        }
        
        // Comandos de menu
        const modulos = {
            "👨‍🏫": "Módulo Educador: recursos para professores (planos, materiais).",
            "📋": "Plano de Aula: crio planos personalizados. Exemplo: 'Plano sobre Zumbi para 8º ano'",
            "🎓": "Módulo Estudante: conteúdos, quizzes e biblioteca.",
            "📚": "Biblioteca: livros, artigos e vídeos especializados.",
            "⚖️": "Lei 10.639/2003: ensino obrigatório da cultura afro-brasileira.",
            "menu": "Módulos: 👨‍🏫 Educador | 📋 Plano Aula | 🎓 Estudante | 📚 Biblioteca | ⚖️ Lei 10.639"
        };
        
        for (const [key, resposta] of Object.entries(modulos)) {
            if (prompt.includes(key) || lower === key) {
                return { statusCode: 200, headers, body: JSON.stringify({ status: "success", resposta }) };
            }
        }
        
        // ========== USAR IA REAL ==========
        
        const API_KEY = process.env.GEMINI_API_KEY;
        
        if (!API_KEY) {
            console.log("⚠️ Sem API_KEY, usando fallback");
            
            // Fallback inteligente para testes
            let respostaFallback = "Para uma resposta completa, configure a API_KEY. ";
            
            if (lower.includes("zumbi")) {
                respostaFallback += "Zumbi: líder de Palmares, resistência negra. Para aulas: documentário Quilombo, análise de documentos.";
            } else if (lower.includes("lei 10.639") || lower.includes("lei 10639")) {
                respostaFallback += "Lei 10.639: ensino obrigatório da cultura afro-brasileira. Implemente com projetos interdisciplinares.";
            } else if (lower.includes("capoeira")) {
                respostaFallback += "Capoeira: arte marcial afro-brasileira. Atividade: aula prática com mestre convidado.";
            } else {
                respostaFallback += "Especifique: nível de ensino e tema (ex: 'Zumbi para 8º ano' ou 'atividade sobre capoeira').";
            }
            
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ status: "success", resposta: respostaFallback })
            };
        }
        
        // Chamar API Gemini
        const fullEndpoint = `${GEMINI_ENDPOINT}?key=${API_KEY}`;
        
        const response = await fetch(fullEndpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: SYSTEM_PROMPT + "\n\nPERGUNTA: " + prompt
                    }]
                }],
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 250, // Respostas curtas
                    topP: 0.8,
                    topK: 40
                }
            })
        });
        
        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }
        
        const data = await response.json();
        let resposta = data.candidates?.[0]?.content?.parts?.[0]?.text || 
                      "Não consegui gerar uma resposta. Reformule sua pergunta.";
        
        // Limitar tamanho
        if (resposta.length > 500) {
            resposta = resposta.substring(0, 497) + "...";
        }
        
        console.log("🤖 Resposta IA:", resposta.length, "caracteres");
        
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ status: "success", resposta })
        };

    } catch (error) {
        console.error("💥 Erro:", error.message);
        
        // Fallback para erros
        let fallback = "Sistema temporariamente indisponível. ";
        
        try {
            const { prompt } = JSON.parse(event.body || '{}');
            const lower = prompt.toLowerCase();
            
            if (lower.includes("zumbi")) {
                fallback += "Zumbi dos Palmares: líder quilombola, resistência à escravidão. Recurso: Parque Memorial Quilombo dos Palmares.";
            } else if (lower.includes("lei")) {
                fallback += "Lei 10.639/2003: ensino obrigatório da cultura afro-brasileira. Implemente com materiais da UNESCO.";
            } else {
                fallback += "Tente novamente em instantes ou especifique sua pergunta.";
            }
        } catch (e) {
            fallback = "Olá! Sou João, da plataforma Somos Um. Posso ajudar com educação sobre cultura afro-brasileira. Digite sua pergunta.";
        }
        
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ 
                status: "success", 
                resposta: fallback 
            })
        };
    }
};