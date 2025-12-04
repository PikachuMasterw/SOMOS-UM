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
    console.log("Headers:", event.headers);
    
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

    try {
        console.log("📥 Corpo da requisição (raw):", event.body);
        
        // Extrai o 'prompt' da requisição JSON do Front-end
        const { prompt } = JSON.parse(event.body);
        console.log("📝 Prompt recebido:", prompt);

        if (!prompt) {
            console.log("❌ Prompt vazio ou não fornecido");
            return { 
                statusCode: 400,
                headers,
                body: JSON.stringify({ status: "error", resposta: "Por favor, digite sua pergunta." }) 
            };
        }

        // ========== VERIFICAÇÃO DA CHAVE API ==========
        console.log("🔑 Verificando API_KEY...");
        console.log("API_KEY definida?", !!API_KEY);
        console.log("API_KEY (primeiros 10 caracteres):", API_KEY ? API_KEY.substring(0, 10) + "..." : "NÃO DEFINIDA");
        
        if (!API_KEY) {
            console.error("❌ API_KEY não configurada no Netlify");
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({ 
                    status: "error", 
                    resposta: "Serviço temporariamente indisponível. Por favor, tente novamente em alguns instantes." 
                })
            };
        }
        
        console.log("✅ API_KEY verificada com sucesso");

        // Chamada à API do Gemini com timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 segundos timeout
        console.log("⏱️  Timeout configurado: 15 segundos");

        try {
            console.log("🚀 Enviando requisição para API Gemini...");
            console.log("🔗 Endpoint (sem key):", GEMINI_ENDPOINT.substring(0, GEMINI_ENDPOINT.indexOf("key=")) + "key=***");
            
            const geminiResponse = await fetch(GEMINI_ENDPOINT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
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
                        maxOutputTokens: 500,
                        topP: 0.8,
                        topK: 40
                    }
                }),
                signal: controller.signal
            });

            clearTimeout(timeoutId);
            console.log("📥 Resposta do Gemini recebida");
            console.log("📊 Status:", geminiResponse.status, geminiResponse.statusText);

            // ========== LOG DE ERRO DETALHADO ==========
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
                
                throw new Error(`API Gemini retornou status ${geminiResponse.status}: ${errorBody.substring(0, 200)}`);
            }

            const geminiData = await geminiResponse.json();
            console.log("✅ Dados recebidos da Gemini com sucesso");
            console.log("📦 Estrutura dos dados:", Object.keys(geminiData));
            
            // Extrai e trata a resposta
            let iaText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || 
                       "Desculpe, não consegui processar sua pergunta no momento. Tente reformulá-la.";

            console.log("✍️ Resposta da IA (original, primeiros 200 chars):", iaText.substring(0, 200) + "...");

            // Limpar formatação excessiva
            iaText = iaText.replace(/\*\*/g, '').replace(/\#\#\#/g, '').replace(/\*/g, '');
            console.log("✨ Resposta após limpeza de formatação");

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
            console.error("❌ Erro na chamada fetch:", fetchError);
            
            if (fetchError.name === 'AbortError') {
                console.error("⏰ Timeout excedido (15 segundos)");
                throw new Error("Tempo limite excedido. Tente novamente.");
            }
            
            // Log detalhado do erro
            console.error("🔍 Detalhes do erro fetchError:", {
                name: fetchError.name,
                message: fetchError.message,
                stack: fetchError.stack
            });
            
            throw fetchError;
        }

    } catch (error) {
        console.error("💥 Erro na Netlify Function:", error);
        console.error("🔍 Stack trace completo:", error.stack);
        
        // Resposta de fallback para erros
        const fallbackResponses = [
            "Como João, assistente pedagógico, posso ajudar com questões sobre Lei 10.639/2003, planos de aula ou recursos para educação afro-brasileira.",
            "No momento estou com dificuldades técnicas. Enquanto isso, você pode explorar nossos planos de aula prontos ou o calendário afro-brasileiro.",
            "Para uma resposta completa, reformule sua pergunta focando em aspectos pedagógicos da educação afro-brasileira."
        ];
        
        const randomResponse = fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
        
        console.log("🔄 Retornando resposta de fallback:", randomResponse);
        
        return {
            statusCode: 200, // Retorna 200 mesmo com erro para não quebrar o frontend
            headers,
            body: JSON.stringify({ 
                status: "success", 
                resposta: randomResponse 
            })
        };
    }
};