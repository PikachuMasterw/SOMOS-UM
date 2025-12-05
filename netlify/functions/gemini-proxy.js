// netlify/functions/gemini-proxy.js
// VERSÃO EQUILIBRADA - Respostas locais APENAS para o essencial

const API_KEY = process.env.GEMINI_API_KEY;

// GEMINI 1.5 FLASH (estável) - SEMPRE tenta IA primeiro
const GEMINI_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" + API_KEY;

// PROMPT CURTO E EFETIVO
const SYSTEM_PROMPT = `Você é João, assistente pedagógico da plataforma "Somos Um".
Especialista em educação sobre cultura afro-brasileira e Lei 10.639/2003.
Responda de forma didática e prática para professores.
Foque em sugestões de aula, atividades e recursos.
Seja conciso (150-300 palavras).
Se a pergunta for fora do contexto educacional, redirecione educadamente.`;

exports.handler = async (event, context) => {
    console.log("=== JOÃO IA - CHAMADA ===");
    
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Content-Type': 'application/json'
    };

    if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };
    if (event.httpMethod !== 'POST') return { statusCode: 405, headers, body: JSON.stringify({ status: "error", resposta: "Método não permitido." }) };

    try {
        const { prompt } = JSON.parse(event.body);
        console.log("📝 Pergunta:", prompt);

        if (!prompt) return { statusCode: 400, headers, body: JSON.stringify({ status: "error", resposta: "Por favor, digite sua pergunta." }) };
        if (!API_KEY) return { statusCode: 500, headers, body: JSON.stringify({ status: "error", resposta: "Serviço indisponível." }) };

        // ========== TENTAR GEMINI PRIMEIRO (10 SEGUNDOS) ==========
        console.log("🔄 Chamando Gemini...");
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        try {
            const geminiResponse = await fetch(GEMINI_ENDPOINT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{
                        role: "user",
                        parts: [{ text: SYSTEM_PROMPT + "\n\nPergunta do professor: " + prompt }]
                    }],
                    generationConfig: {
                        temperature: 0.7,
                        maxOutputTokens: 800,
                        topP: 0.8,
                        topK: 40
                    }
                }),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (geminiResponse.ok) {
                const data = await geminiResponse.json();
                let resposta = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
                
                if (resposta.length > 30) {
                    console.log("✅ Gemini respondeu!");
                    // Limpar formatação básica
                    resposta = resposta.replace(/\*\*/g, '').replace(/\*/g, '').trim();
                    return {
                        statusCode: 200,
                        headers,
                        body: JSON.stringify({ status: "success", resposta })
                    };
                }
            }
            
            console.log("⚠️ Gemini não deu resposta boa");
            
        } catch (geminiError) {
            clearTimeout(timeoutId);
            console.log("❌ Gemini falhou:", geminiError.message);
        }

        // ========== APENAS SE GEMINI FALHAR: RESPOSTAS LOCAIS BÁSICAS ==========
        console.log("🔄 Usando respostas locais (fallback)");
        const respostaLocal = getRespostaLocalBasica(prompt);
        
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ 
                status: "success", 
                resposta: respostaLocal 
            })
        };

    } catch (error) {
        console.error("💥 Erro:", error);
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ 
                status: "success", 
                resposta: "Olá! Sou João, assistente pedagógico da plataforma Somos Um. Posso ajudar com educação sobre cultura afro-brasileira. Qual sua dúvida?" 
            })
        };
    }
};

// ========== RESPOSTAS LOCAIS MÍNIMAS ==========
// APENAS para emergências quando Gemini falha TOTAUMENTE
function getRespostaLocalBasica(prompt) {
    const lower = prompt.toLowerCase();
    
    // APENAS 4 CASOS CRÍTICOS:
    
    // 1. SAUDAÇÃO (muito importante)
    if (lower.includes('oi') || lower.includes('olá') || 
        lower.includes('bom dia') || lower.includes('boa tarde') || lower.includes('boa noite')) {
        return "Olá! Sou João, assistente pedagógico da plataforma Somos Um. Especializado em educação sobre cultura afro-brasileira e Lei 10.639/2003. Posso ajudar com planejamento de aulas, recursos didáticos e estratégias pedagógicas. Qual sua dúvida?";
    }
    
    // 2. PERGUNTA FORA DO ESCOPO (ex: guerras, notícias)
    if (lower.includes('guerra') || lower.includes('conflito') || 
        lower.includes('tribo') && (lower.includes('áfrica') || lower.includes('africa')) ||
        lower.includes('amazônia') || lower.includes('amazonia') || lower.includes('desmatamento')) {
        return "Para questões sobre atualidades ou conflitos, recomendo consultar fontes especializadas. Como assistente pedagógico, posso ajudá-lo com temas educacionais relacionados à cultura afro-brasileira, implementação da Lei 10.639/2003, ou recursos para sala de aula. Tem alguma dúvida nessa área?";
    }
    
    // 3. PERGUNTA MUITO GENÉRICA
    if (lower.length < 10 || 
        lower === 'ajuda' || lower === 'help' || 
        lower === 'o que é isso' || lower === 'como funciona') {
        return "Sou João, assistente virtual da plataforma 'Somos Um'. Posso ajudar você com:\n\n• Planos de aula sobre cultura afro-brasileira\n• Implementação da Lei 10.639/2003\n• Sugestões de atividades e recursos didáticos\n• Estratégias pedagógicas antirracistas\n\nFaça uma pergunta específica para uma resposta mais útil!";
    }
    
    // 4. ERRO TOTAL - Gemini não respondeu NADA útil
    return "No momento estou com dificuldades técnicas para responder a essa pergunta. Para dúvidas sobre educação afro-brasileira, você pode explorar nossos recursos na plataforma Somos Um ou tentar reformular sua pergunta especificando nível de ensino e tema. Desculpe pelo inconveniente!";
}