// netlify/functions/gemini-proxy.js
// VERSÃO HÍBRIDA - 5 DE DEZEMBRO 2025

const API_KEY = process.env.GEMINI_API_KEY;

// ========== CONFIGURAÇÃO ==========
// OPÇÃO A: Gemini 1.5 Flash (MAIS ESTÁVEL)
const GEMINI_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" + API_KEY;

// OPÇÃO B: Gemini 2.5 Flash (COM reasoningTokens: "OFF")
// const GEMINI_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + API_KEY;

// PROMPT OTIMIZADO (baseado na versão antiga)
const SYSTEM_PROMPT = `Você é João, assistente virtual da plataforma "SomOS UM" para educadores.
Especializado em educação, cultura afro-brasileira e Lei 10.639/2003.

DIRETRIZES:
1. Responda de forma clara e didática
2. Foque em aspectos pedagógicos aplicáveis em sala de aula
3. Limite a resposta a 2-3 parágrafos concisos
4. Sempre sugira um recurso prático (livro, filme, atividade)
5. Adapte para diferentes níveis de ensino quando relevante
6. Use linguagem acessível mas profissional

CONTEXTO DE HISTÓRIA AFRO-BRASILEIRA:
- Enfatize resistência, cultura e contribuições
- Relacione com a Lei 10.639/2003 quando pertinente
- Destaque personalidades importantes além das mais conhecidas

Agora, responda à pergunta do educador:`;

// ========== BANCO DE RESPOSTAS LOCAIS INTELIGENTE ==========
const RESPOSTAS_LOCAIS = {
    // PERGUNTAS FREQUENTES (respostas garantidas)
    "zumbi": "Zumbi dos Palmares foi líder do Quilombo dos Palmares no século XVII, símbolo da resistência negra à escravidão. Para sala de aula: explore o contexto histórico da escravidão, organização dos quilombos como espaços de liberdade, e a importância de Zumbi como figura de resistência. Sugestão: atividade de pesquisa sobre a Serra da Barriga e debate sobre memória histórica. Recurso: documentário 'Quilombo' (1984).",
    
    "umbanda": "Umbanda é religião afro-brasileira que sincretiza elementos africanos, indígenas e cristãos. Criada no século XX, representa resistência cultural. Para aulas: abordar diversidade religiosa com respeito, história da perseguição às religiões de matriz africana, e contribuições culturais. Sugestão: análise comparativa com candomblé e catolicismo. Cuidado pedagógico: evitar estereótipos.",
    
    "candomblé": "Candomblé é religião de matriz africana com origem iorubá. Para abordar em aula: respeito à diversidade religiosa, história das perseguições, contribuições culturais (música, culinária). Sugestão: estudar os orixás como elementos da cultura afro-brasileira. Recurso: livro 'Orixás' de Pierre Verger.",
    
    "capoeira": "Capoeira é arte marcial afro-brasileira que mistura luta, dança e música. Para aula: contexto histórico da diáspora africana, oficina prática de movimentos básicos, discussão sobre resistência cultural. Sugestão: convidar um mestre de capoeira para demonstração. Recurso: documentário 'Capoeira Iluminada'.",
    
    "lei 10.639": "Lei 10.639/2003 torna obrigatório o ensino de História e Cultura Afro-Brasileira. Implementação prática: projetos interdisciplinares, formação docente, revisão de materiais didáticos. Sugestão: criar plano de aula interdisciplinar abordando contribuições africanas. Recurso: Coleção História Geral da África da UNESCO.",
    
    "ganga zumba": "Ganga Zumba foi líder do Quilombo dos Palmares antes de Zumbi, seu sobrinho. Governou durante período de crescimento do quilombo. Para aula: compare as lideranças de Ganga Zumba (estratégias de negociação) e Zumbi (resistência armada). Atividade: debate sobre diferentes táticas de sobrevivência.",
    
    // REDIRECIONAMENTO PARA PERGUNTAS FORA DO ESCOPO
    "guerra": "Para informações sobre conflitos contemporâneos, recomendo fontes especializadas. Como assistente pedagógico, posso ajudar com aulas sobre diversidade cultural africana ou reinos históricos africanos.",
    
    "amazônia": "Questões socioambientais são importantes, mas fogem do meu escopo especializado. Posso ajudar com aulas sobre povos indígenas brasileiros ou cultura afro-indígena.",
    
    "tribo": "Para informações sobre povos africanos contemporâneos, recomendo fontes especializadas. Posso ajudar com aulas sobre reinos africanos históricos ou diáspora africana."
};

exports.handler = async (event, context) => {
    console.log("=== JOÃO IA - VERSÃO HÍBRIDA ===");
    
    // Configurar CORS (simplificado)
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Content-Type': 'application/json'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    if (event.httpMethod !== 'POST') {
        return { 
            statusCode: 405, 
            headers,
            body: JSON.stringify({ status: "error", resposta: "Método não permitido." }) 
        };
    }

    try {
        const { prompt } = JSON.parse(event.body);
        console.log("📝 Pergunta recebida:", prompt);

        if (!prompt) {
            return { 
                statusCode: 400,
                headers,
                body: JSON.stringify({ status: "error", resposta: "Por favor, digite sua pergunta." }) 
            };
        }

        if (!API_KEY) {
            console.error("❌ API_KEY não configurada");
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({ 
                    status: "error", 
                    resposta: "Serviço temporariamente indisponível." 
                })
            };
        }

        const lowerPrompt = prompt.toLowerCase();
        
        // ========== ESTRATÉGIA: IA PRIMEIRO, FALLBACK LOCAL DEPOIS ==========
        
        // 1. Se for PERGUNTA CRÍTICA, responder localmente (rápido)
        if (deveResponderLocalmente(lowerPrompt)) {
            console.log("⚡ Respondendo localmente (pergunta crítica)");
            const resposta = getRespostaLocal(lowerPrompt);
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ status: "success", resposta })
            };
        }
        
        // 2. Tentar Gemini (com timeout curto)
        console.log("🔄 Tentando Gemini (timeout: 8 segundos)...");
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);

        try {
            const geminiResponse = await fetch(GEMINI_ENDPOINT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{
                        role: "user",
                        parts: [{ text: SYSTEM_PROMPT + "\n\nPERGUNTA DO EDUCADOR: " + prompt }]
                    }],
                    generationConfig: {
                        temperature: 0.7,
                        maxOutputTokens: 1000,
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
                
                if (resposta.length > 50) {
                    console.log("✅ Gemini respondeu com sucesso");
                    resposta = resposta.replace(/\*\*/g, '').replace(/\*/g, '').trim();
                    return {
                        statusCode: 200,
                        headers,
                        body: JSON.stringify({ status: "success", resposta })
                    };
                }
            }
            
            console.log("⚠️ Gemini não deu resposta adequada");
            
        } catch (geminiError) {
            clearTimeout(timeoutId);
            console.log("❌ Gemini falhou:", geminiError.message);
        }

        // 3. Fallback: resposta local inteligente
        console.log("🔄 Usando fallback inteligente");
        const respostaFallback = criarRespostaFallback(lowerPrompt, prompt);
        
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ 
                status: "success", 
                resposta: respostaFallback 
            })
        };

    } catch (error) {
        console.error("💥 Erro geral:", error);
        
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ 
                status: "success", 
                resposta: "Olá! Sou João, assistente da plataforma Somos Um. Como posso ajudar com educação afro-brasileira?" 
            })
        };
    }
};

// ========== FUNÇÕES AUXILIARES ==========

function deveResponderLocalmente(lowerPrompt) {
    // Responde localmente APENAS para:
    // 1. Perguntas fora do escopo (redireciona)
    // 2. Saudações (obrigatório)
    
    const perguntasForaEscopo = [
        'guerra', 'conflito', 'tribo africana', 'amazônia', 'desmatamento',
        'notícia', 'atualidade', 'política', 'economia'
    ];
    
    const saudações = ['oi', 'olá', 'bom dia', 'boa tarde', 'boa noite'];
    
    // Se for saudação OU fora do escopo → resposta local
    return saudações.some(s => lowerPrompt.includes(s)) ||
           perguntasForaEscopo.some(p => lowerPrompt.includes(p));
}

function getRespostaLocal(lowerPrompt) {
    // Saudações
    if (lowerPrompt.includes('oi') || lowerPrompt.includes('olá')) {
        return "Olá! Sou João, assistente pedagógico da plataforma Somos Um. Especializado em educação sobre cultura afro-brasileira e Lei 10.639/2003. Como posso ajudá-lo?";
    }
    
    // Fora do escopo
    if (lowerPrompt.includes('guerra') || lowerPrompt.includes('conflito')) {
        return RESPOSTAS_LOCAIS["guerra"];
    }
    
    if (lowerPrompt.includes('amazônia') || lowerPrompt.includes('amazonia')) {
        return RESPOSTAS_LOCAIS["amazônia"];
    }
    
    if (lowerPrompt.includes('tribo')) {
        return RESPOSTAS_LOCAIS["tribo"];
    }
    
    // Default
    return RESPOSTAS_LOCAIS["zumbi"]; // Fallback genérico
}

function criarRespostaFallback(lowerPrompt, promptOriginal) {
    // Tenta criar uma resposta inteligente baseada na pergunta
    
    const temas = [
        {
            keywords: ['zumbi', 'palmares', 'quilombo'],
            resposta: RESPOSTAS_LOCAIS["zumbi"]
        },
        {
            keywords: ['líder', 'liderança', 'lideres', 'equivalente', 'similar'],
            resposta: `Baseado em sua pergunta sobre "${promptOriginal}", posso mencionar que além de Zumbi dos Palmares, outras lideranças importantes da resistência negra foram: Dandara (guerreira de Palmares), Aqualtune (princesa africana), Luísa Mahin (Revolta dos Malês) e Luiz Gama (abolicionista). Para aula: atividade de pesquisa comparativa sobre diferentes formas de liderança na resistência afro-brasileira.`
        },
        {
            keywords: ['umbanda', 'candomblé', 'religião'],
            resposta: RESPOSTAS_LOCAIS["umbanda"]
        },
        {
            keywords: ['capoeira'],
            resposta: RESPOSTAS_LOCAIS["capoeira"]
        },
        {
            keywords: ['lei', '10.639', '10639'],
            resposta: RESPOSTAS_LOCAIS["lei 10.639"]
        },
        {
            keywords: ['cultura', 'afro'],
            resposta: RESPOSTAS_LOCAIS["zumbi"] // Fallback para cultura afro
        }
    ];
    
    for (const tema of temas) {
        for (const keyword of tema.keywords) {
            if (lowerPrompt.includes(keyword)) {
                return tema.resposta;
            }
        }
    }
    
    // Resposta padrão para perguntas não reconhecidas
    return `Para uma resposta mais precisa sobre "${promptOriginal}", especifique:
    1. Nível de ensino (Fundamental I, II ou Médio)
    2. Tema específico (história, cultura, literatura, música)
    3. Tipo de ajuda (plano de aula, atividade, recurso)
    
    Exemplo: "Preciso de uma atividade sobre capoeira para o 6º ano"`;
}