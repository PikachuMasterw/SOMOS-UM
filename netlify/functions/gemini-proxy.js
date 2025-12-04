// netlify/functions/gemini-proxy.js

// Lendo a chave de API de forma segura das Variáveis de Ambiente do Netlify
const API_KEY = process.env.GEMINI_API_KEY;

// Endpoint do Gemini
const GEMINI_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + API_KEY;

// PROMPT DE SISTEMA ESPECIALIZADO PARA PROFESSORES E EDUCAÇÃO
const SYSTEM_PROMPT = `VOCÊ É O "JOÃO", ASSISTENTE VIRTUAL ESPECIALIZADO DA PLATAFORMA "SOMOS UM" PARA EDUCADORES.

CONTEXTO E IDENTIDADE:
- Você é João, assistente virtual especializado em educação, cultura afro-brasileira e Lei 10.639/2003
- Foco principal: auxiliar PROFESSORES na preparação de aulas, planos de ensino e recursos didáticos
- Especialização: História e Cultura Afro-Brasileira, Educação Antirracista, Práticas Pedagógicas Inclusivas

REGRAS DE RESPOSTA:
1. SEMPRE use linguagem profissional e pedagógica apropriada para educadores
2. Responda de forma CONCISA e DIRETA (máximo 250 palavras)
3. SEMPRE faça referência à Lei 10.639/2003 quando relevante
4. SEMPRE sugira recursos, atividades ou estratégias práticas para sala de aula
5. SEMPRE considere diferentes níveis de ensino (Fundamental I, II, Médio, Superior)
6. NÃO use formatação markdown, listas ou emojis - apenas texto corrido

ÁREAS DE ESPECIALIDADE (foco principal):
1. PLANOS DE AULA: Sugestões de objetivos, conteúdos, metodologias, avaliações
2. RECURSOS DIDÁTICOS: Materiais, livros, filmes, músicas, atividades práticas
3. FORMAÇÃO DOCENTE: Estratégias pedagógicas, avaliação, gestão de sala de aula
4. LEGISLAÇÃO: Lei 10.639/2003, BNCC, diretrizes curriculares
5. CULTURA AFRO-BRASILEIRA: História, personalidades, contribuições culturais
6. EDUCAÇÃO ANTIRRACISTA: Práticas, estratégias, enfrentamento ao racismo

DIRETRIZES PARA PERGUNTAS FORA DO ESCOPO:
- Se a pergunta for claramente fora do contexto educacional ou da plataforma: "Como assistente especializado em educação da plataforma Somos Um, posso ajudar você com questões relacionadas a planos de aula, Lei 10.639/2003, recursos didáticos ou práticas pedagógicas. Tem alguma dúvida nessa área?"
- Se a pergunta for sobre educação mas muito genérica: "Para uma resposta mais precisa, poderia especificar o nível de ensino (Fundamental I, II, Médio) ou o aspecto específico que gostaria de abordar?"

EXEMPLOS DE RESPOSTAS IDEIAIS:
- "Para trabalhar Capoeira no Fundamental II, sugiro: 1) Contexto histórico da diáspora africana; 2) Oficina prática de movimentos básicos; 3) Discussão sobre resistência cultural. Recursos: documentário 'Capoeira Iluminada', livro 'Capoeira: uma história afro-brasileira'."
- "Na avaliação de conteúdos sobre cultura afro-brasileira, priorize produções textuais dos alunos, participação em discussões críticas e trabalhos em grupo que evidenciem compreensão das contribuições africanas."

INFORMAÇÕES DA PLATAFORMA:
- Somos Um é uma plataforma dedicada ao ensino da História e Cultura Afro-Brasileira
- Foco em implementação da Lei 10.639/2003 em sala de aula
- Recursos disponíveis: planos de aula, calendário afro-brasileiro, biblioteca, ferramentas para educadores

AGORA, COMO JOÃO - ASSISTENTE PEDAGÓGICO ESPECIALIZADO, RESPONDA À PERGUNTA DO EDUCADOR:`;

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
        // Tente parsear o JSON - mas primeiro verifique se não está vazio
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
        console.error("Conteúdo que falhou:", event.body);
        return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ 
                status: "error", 
                resposta: "Formato de requisição inválido. Envie um JSON válido com campo 'prompt'." 
            })
        };
    }

    // ========== VERIFICAÇÃO DA CHAVE API ==========
    console.log("🔑 Verificando API_KEY...");
    console.log("API_KEY definida?", !!API_KEY);
    
    // Log seguro da chave (apenas primeiros e últimos caracteres)
    if (API_KEY) {
        const maskedKey = API_KEY.substring(0, 5) + "..." + API_KEY.substring(API_KEY.length - 5);
        console.log("API_KEY (mascarada):", maskedKey);
    } else {
        console.log("❌ API_KEY não definida!");
    }
    
    if (!API_KEY) {
        console.error("❌ API_KEY não configurada no Netlify");
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
                status: "error", 
                resposta: "Erro de configuração do servidor. API KEY não encontrada." 
            })
        };
    }
    
    console.log("✅ API_KEY verificada com sucesso");

    // ========== CHAMADA À API GEMINI ==========
    console.log("🚀 Preparando chamada para API Gemini...");
    console.log("🔗 Endpoint (mascarado):", GEMINI_ENDPOINT.replace(API_KEY, "API_KEY_OCULTADA"));
    
    try {
        // Chamada à API do Gemini com timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 segundos timeout
        console.log("⏱️  Timeout configurado: 30 segundos");
        
        const requestBody = {
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
                maxOutputTokens: 500,
                topP: 0.8,
                topK: 40
            }
        };
        
        console.log("📦 Request body para Gemini (primeiros 500 chars):", 
                   JSON.stringify(requestBody).substring(0, 500) + "...");
        
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
        console.log("📊 Headers da resposta:", JSON.stringify(Object.fromEntries(geminiResponse.headers.entries())));

        // ========== TRATAMENTO DE ERROS DA API GEMINI ==========
        if (!geminiResponse.ok) {
            console.error(`❌ Erro de Status HTTP da API Gemini: ${geminiResponse.status}`);
            
            // Tentar obter mais detalhes do erro
            let errorBody = "Não foi possível obter corpo do erro";
            try {
                errorBody = await geminiResponse.text();
                console.error("📄 Corpo do erro da API Gemini:", errorBody);
            } catch (e) {
                console.error("❌ Não foi possível ler corpo do erro:", e.message);
            }
            
            // Retornar erro amigável baseado no status
            let errorMessage = "Erro ao processar sua pergunta. Tente novamente.";
            if (geminiResponse.status === 400) {
                errorMessage = "Erro na requisição para a IA. Verifique o formato da pergunta.";
            } else if (geminiResponse.status === 403) {
                errorMessage = "Problema de autenticação com o serviço de IA.";
            } else if (geminiResponse.status === 429) {
                errorMessage = "Limite de requisições excedido. Tente novamente em alguns instantes.";
            } else if (geminiResponse.status === 500) {
                errorMessage = "Erro interno no serviço de IA. Tente novamente mais tarde.";
            }
            
            return {
                statusCode: 200, // Retorna 200 para não quebrar frontend
                headers,
                body: JSON.stringify({ 
                    status: "error", 
                    resposta: errorMessage,
                    debug: `Status ${geminiResponse.status}`
                })
            };
        }

        // ========== PROCESSAMENTO DA RESPOSTA BEM-SUCEDIDA ==========
        const geminiData = await geminiResponse.json();
        console.log("✅ Dados recebidos da Gemini com sucesso");
        console.log("📦 Estrutura dos dados recebidos:", Object.keys(geminiData));
        
        // Extrai a resposta
        let iaText = "Desculpe, não consegui processar sua pergunta no momento. Tente reformulá-la.";
        
        if (geminiData.candidates && geminiData.candidates[0] && 
            geminiData.candidates[0].content && 
            geminiData.candidates[0].content.parts && 
            geminiData.candidates[0].content.parts[0]) {
            
            iaText = geminiData.candidates[0].content.parts[0].text;
            console.log("✍️ Resposta da IA (tamanho):", iaText.length, "caracteres");
            console.log("✍️ Resposta da IA (primeiros 300 chars):", iaText.substring(0, 300) + "...");
            
        } else {
            console.warn("⚠️ Estrutura de resposta inesperada:", JSON.stringify(geminiData).substring(0, 500));
        }

        // Limpar formatação excessiva (mantendo quebras de linha)
        iaText = iaText
            .replace(/\*\*/g, '')
            .replace(/\#\#\#/g, '')
            .replace(/\*/g, '')
            .replace(/\\n/g, '\n')
            .trim();

        console.log("✨ Resposta final processada");
        
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
        console.error("❌ Erro na chamada fetch para Gemini:", fetchError);
        
        // Log detalhado do erro
        console.error("🔍 Detalhes do erro fetchError:", {
            name: fetchError.name,
            message: fetchError.message,
            stack: fetchError.stack
        });
        
        if (fetchError.name === 'AbortError') {
            console.error("⏰ Timeout excedido (30 segundos)");
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ 
                    status: "error", 
                    resposta: "Tempo limite excedido. Tente novamente com uma pergunta mais curta." 
                })
            };
        }
        
        // Resposta de fallback para erros de rede
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ 
                status: "error", 
                resposta: "Erro de conexão com o serviço de IA. Verifique sua conexão e tente novamente." 
            })
        };
    }
};