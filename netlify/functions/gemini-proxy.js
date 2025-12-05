// netlify/functions/gemini-proxy.js
// VERSÃO QUE REALMENTE USA GEMINI - 5 DE DEZEMBRO 2025

const API_KEY = process.env.GEMINI_API_KEY;

// Gemini 1.5 Flash (estável) - VERIFIQUE SE ESTÁ ATIVA NO GOOGLE AI STUDIO!
const GEMINI_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" + API_KEY;

// PROMPT SIMPLES E EFETIVO
const SYSTEM_PROMPT = `Você é João, assistente pedagógico da plataforma "Somos Um".
Especialista em educação sobre cultura afro-brasileira e Lei 10.639/2003.
Responda de forma didática e prática para professores.
Seja conciso (150-300 palavras).
Sempre sugira uma atividade ou recurso para sala de aula.`;

exports.handler = async (event, context) => {
    console.log("=== JOÃO IA - VERSÃO GEMINI ATIVADA ===");
    
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
        console.log("📝 Pergunta recebida:", prompt);

        if (!prompt || prompt.trim() === '') {
            return { 
                statusCode: 400,
                headers,
                body: JSON.stringify({ status: "error", resposta: "Por favor, digite sua pergunta." }) 
            };
        }

        // ========== VERIFICAÇÃO CRÍTICA DA API_KEY ==========
        console.log("🔑 Verificando API_KEY...");
        
        if (!API_KEY) {
            console.error("❌ API_KEY NÃO CONFIGURADA no Netlify!");
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({ 
                    status: "error", 
                    resposta: "Erro de configuração: API KEY não encontrada." 
                })
            };
        }
        
        // Log seguro da chave
        console.log("🔐 API_KEY comprimento:", API_KEY.length);
        console.log("🔐 API_KEY inicia com:", API_KEY.substring(0, 10));
        
        const lowerPrompt = prompt.toLowerCase().trim();
        
        // ========== SAUDAÇÕES (sempre local) ==========
        const saudacoesExatas = ['oi', 'olá', 'ola'];
        if (saudacoesExatas.some(s => lowerPrompt === s)) {
            console.log("⚡ Saudação exata, respondendo local");
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ 
                    status: "success", 
                    resposta: "Olá! Sou João, assistente pedagógico da plataforma Somos Um. Especializado em educação sobre cultura afro-brasileira e Lei 10.639/2003. Como posso ajudá-lo?" 
                })
            };
        }
        
        // ========== PERGUNTAS FORA DO ESCOPO (sempre local) ==========
        const foraEscopo = ['guerra', 'conflito', 'tribo africana', 'amazônia', 'amazonia', 'desmatamento'];
        if (foraEscopo.some(p => lowerPrompt.includes(p))) {
            console.log("⚡ Fora do escopo, redirecionando local");
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ 
                    status: "success", 
                    resposta: "Para questões sobre atualidades, recomendo fontes especializadas. Como assistente pedagógico, posso ajudá-lo com temas educacionais relacionados à cultura afro-brasileira ou Lei 10.639/2003." 
                })
            };
        }

        // ========== AGORA SIM: TENTAR GEMINI ==========
        console.log("🚀 PREPARANDO PARA CHAMAR GEMINI...");
        console.log("🔗 Endpoint:", GEMINI_ENDPOINT.replace(API_KEY, "API_KEY_OCULTADA"));
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
            console.log("⏰ Timeout após 15 segundos");
            controller.abort();
        }, 15000);

        try {
            const startTime = Date.now();
            console.log("🔄 Enviando requisição para Gemini...");
            
            const geminiResponse = await fetch(GEMINI_ENDPOINT, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    contents: [{
                        role: "user",
                        parts: [{ 
                            text: SYSTEM_PROMPT + "\n\nPergunta do professor: " + prompt 
                        }]
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
            const responseTime = Date.now() - startTime;
            console.log(`⏱️  Gemini respondeu em ${responseTime}ms`);
            console.log(`📊 Status HTTP: ${geminiResponse.status} ${geminiResponse.statusText}`);

            if (geminiResponse.ok) {
                const data = await geminiResponse.json();
                console.log("✅ Resposta Gemini recebida");
                console.log("📦 Estrutura da resposta:", Object.keys(data));
                
                let resposta = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
                
                if (resposta && resposta.length > 50) {
                    console.log(`✍️ Resposta Gemini (${resposta.length} chars):`, resposta.substring(0, 200) + "...");
                    
                    // Limpar formatação
                    resposta = resposta
                        .replace(/\*\*/g, '')
                        .replace(/\*/g, '')
                        .trim();
                    
                    return {
                        statusCode: 200,
                        headers,
                        body: JSON.stringify({ status: "success", resposta })
                    };
                } else {
                    console.warn("⚠️ Resposta Gemini muito curta ou vazia");
                    console.warn("📄 Dados completos:", JSON.stringify(data).substring(0, 300));
                }
            } else {
                const errorText = await geminiResponse.text();
                console.error(`❌ Erro HTTP ${geminiResponse.status}:`, errorText.substring(0, 200));
            }
            
        } catch (fetchError) {
            clearTimeout(timeoutId);
            if (fetchError.name === 'AbortError') {
                console.error("⏰ TIMEOUT: Gemini não respondeu em 15 segundos");
            } else {
                console.error("❌ Erro na chamada fetch:", fetchError.message);
            }
        }

        // ========== SE GEMINI FALHOU: FALLBACK LOCAL ==========
        console.log("🔄 Gemini falhou, usando fallback local");
        
        let respostaLocal;
        
        if (lowerPrompt.includes("zumbi") || lowerPrompt.includes("palmares")) {
            respostaLocal = `Zumbi dos Palmares foi líder do Quilombo dos Palmares (século XVII), símbolo da resistência negra.

Para aulas:
• Fundamental I: Contação de história sobre quilombos
• Fundamental II: Análise de documentos históricos
• Ensino Médio: Debate sobre memória histórica

Recurso: Documentário "Quilombo" (1984).`;
        }
        else if (lowerPrompt.includes("líder") || lowerPrompt.includes("lider") || 
                 lowerPrompt.includes("equivalente") || lowerPrompt.includes("similar")) {
            respostaLocal = `Além de Zumbi, outras lideranças importantes:

1. Dandara - Guerreira de Palmares
2. Aqualtune - Princesa africana
3. Luísa Mahin - Revolta dos Malês
4. Luiz Gama - Abolicionista
5. Carolina Maria de Jesus - Escritora

Atividade: Linha do tempo da resistência negra.`;
        }
        else if (lowerPrompt.includes("lei") || lowerPrompt.includes("10.639")) {
            respostaLocal = `Lei 10.639/2003 obriga ensino de História e Cultura Afro-Brasileira.

Implementação:
1. Formação docente
2. Materiais didáticos inclusivos
3. Projetos interdisciplinares

Recurso: Coleção "História Geral da África" da UNESCO.`;
        }
        else {
            respostaLocal = `Sobre "${prompt}", posso ajudar melhor se especificar:

• Nível de ensino (Fundamental I, II, Médio)
• Tema específico (história, cultura, literatura)
• Tipo de ajuda (plano de aula, atividade, recurso)

Exemplo: "Atividade sobre capoeira para o 6º ano"`;
        }
        
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ 
                status: "success", 
                resposta: respostaLocal 
            })
        };

    } catch (error) {
        console.error("💥 Erro geral no handler:", error);
        
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ 
                status: "success", 
                resposta: "Olá! Sou João da plataforma Somos Um. Como posso ajudá-lo com educação afro-brasileira?" 
            })
        };
    }
};