// netlify/functions/gemini-proxy.js

// Lendo a chave de API de forma segura das Variáveis de Ambiente do Netlify
const API_KEY = process.env.GEMINI_API_KEY;

// Endpoint do Gemini
const GEMINI_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + API_KEY;

// PROMPT DE SISTEMA OTIMIZADO
const SYSTEM_PROMPT = `Você é João, assistente virtual da plataforma "Somos Um" para educadores.
Especializado em educação, cultura afro-brasileira e Lei 10.639/2003.

DIRETRIZES:
1. Responda de forma clara e didática
2. Foque em aspectos pedagógicos aplicáveis em sala de aula
3. Limite a resposta a 3-4 parágrafos concisos
4. Sempre sugira um recurso prático (livro, filme, atividade)
5. Adapte para diferentes níveis de ensino quando relevante
6. Use linguagem acessível mas profissional

CONTEXTO DE HISTÓRIA AFRO-BRASILEIRA:
- Enfatize resistência, cultura e contribuições
- Relacione com a Lei 10.639/2003 quando pertinente
- Destaque personalidades importantes além das mais conhecidas

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
            console.log("📝 Processando pergunta:", prompt);
            
            // Verificar se é uma pergunta de contexto (sobre "outros líderes")
            let enhancedPrompt = prompt;
            const lowerPrompt = prompt.toLowerCase();
            
            if (lowerPrompt.includes("outros") || lowerPrompt.includes("outras") || 
                lowerPrompt.includes("além") || lowerPrompt.includes("também")) {
                console.log("🔍 Detectada pergunta de contexto - adicionando referência");
                enhancedPrompt = `Considerando que estamos falando sobre história afro-brasileira e resistência, ${prompt}`;
            }

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
                                { text: SYSTEM_PROMPT + "\n\nPERGUNTA DO EDUCADOR: " + enhancedPrompt }
                            ]
                        }
                    ],
                    generationConfig: {
                        temperature: 0.7,
                        maxOutputTokens: 800, // Reduzido para respostas mais concisas
                        topP: 0.8,
                        topK: 40,
                        stopSequences: ["###", "---"] // Para evitar respostas muito longas
                    }
                }),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!geminiResponse.ok) {
                const errorText = await geminiResponse.text();
                console.error("❌ Erro Gemini:", geminiResponse.status, errorText);
                throw new Error(`API Gemini retornou status ${geminiResponse.status}`);
            }

            const geminiData = await geminiResponse.json();
            
            // Extrai e trata a resposta com verificação robusta
            let iaText = "";
            
            // Tentar diferentes estruturas de resposta
            if (geminiData.candidates?.[0]?.content?.parts?.[0]?.text) {
                iaText = geminiData.candidates[0].content.parts[0].text;
            } else if (geminiData.text) {
                iaText = geminiData.text;
            } else if (geminiData.choices?.[0]?.text) {
                iaText = geminiData.choices[0].text;
            } else {
                console.warn("⚠️ Estrutura de resposta inesperada:", JSON.stringify(geminiData).substring(0, 300));
                
                // Resposta local inteligente baseada na pergunta
                if (lowerPrompt.includes("zumbi") || lowerPrompt.includes("palmares")) {
                    iaText = "Zumbi dos Palmares foi líder do Quilombo dos Palmares no século XVII, símbolo da resistência negra. Para sala de aula: explore o contexto histórico da escravidão, organização dos quilombos como espaços de liberdade, e a importância de Zumbi como figura de resistência. Sugestão: atividade de pesquisa sobre a Serra da Barriga e discussão sobre memória histórica.";
                } else if (lowerPrompt.includes("outros") || lowerPrompt.includes("líderes")) {
                    iaText = "Outros líderes importantes da resistência negra: Dandara (esposa de Zumbi, guerreira), Aqualtune (líder e mãe de Ganga Zumba), Luísa Mahin (participante da Revolta dos Malês), Luiz Gama (abolicionista e jornalista). Para trabalhar em aula: crie uma linha do tempo com diferentes formas de resistência, de quilombos a imprensa negra.";
                } else if (lowerPrompt.includes("lei") || lowerPrompt.includes("10.639")) {
                    iaText = "Lei 10.639/2003 torna obrigatório o ensino de história e cultura afro-brasileira. Implementação prática: projetos interdisciplinares, formação docente, revisão de materiais didáticos. Recurso: utilize a Coleção História Geral da África da UNESCO como referência.";
                } else {
                    iaText = "Para uma resposta mais precisa sobre educação afro-brasileira, especifique: nível de ensino (Fundamental I, II, Médio) e tema específico (ex: capoeira, religiões de matriz africana, literatura negra).";
                }
            }

            // Limpar formatação e garantir resposta adequada
            iaText = iaText
                .replace(/\*\*/g, '')
                .replace(/\*/g, '')
                .replace(/\#\#\#/g, '')
                .replace(/```[\s\S]*?```/g, '') // Remove blocos de código
                .trim();

            // Se a resposta for muito curta ou muito longa, ajustar
            if (iaText.length < 50) {
                console.log("⚠️ Resposta muito curta, usando fallback");
                iaText = "Zumbi dos Palmares liderou o maior quilombo do Brasil colonial. Para aulas: trabalhe resistência escrava, organização social quilombola e memória histórica. Atividade: debate sobre o Dia da Consciência Negra (20 de novembro).";
            } else if (iaText.length > 1500) {
                console.log("⚠️ Resposta muito longa, encurtando");
                // Manter apenas os primeiros 1500 caracteres e garantir termino adequado
                iaText = iaText.substring(0, 1500);
                const lastPeriod = iaText.lastIndexOf('.');
                const lastQuestion = iaText.lastIndexOf('?');
                const lastExclamation = iaText.lastIndexOf('!');
                const lastPunctuation = Math.max(lastPeriod, lastQuestion, lastExclamation);
                
                if (lastPunctuation > 1400) {
                    iaText = iaText.substring(0, lastPunctuation + 1);
                } else {
                    iaText = iaText.trim() + "... [continua]";
                }
            }

            // Garantir que termine com pontuação
            if (!/[.!?]\s*$/.test(iaText.trim())) {
                iaText = iaText.trim() + ".";
            }

            console.log("📝 Resposta final (tamanho):", iaText.length);
            
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
            console.error("❌ Erro na chamada:", fetchError);
            throw fetchError;
        }

    } catch (error) {
        console.error("💥 Erro geral:", error);
        
        // Resposta de fallback inteligente baseada na pergunta original
        let fallbackResponse = "Como João, assistente pedagógico, posso ajudar com planejamento de aulas sobre cultura afro-brasileira, implementação da Lei 10.639/2003 ou recursos didáticos. Reformule sua pergunta especificando nível de ensino e tema.";
        
        try {
            const { prompt } = JSON.parse(event.body);
            const lowerPrompt = prompt.toLowerCase();
            
            if (lowerPrompt.includes("zumbi") || lowerPrompt.includes("palmares")) {
                fallbackResponse = "Zumbi dos Palmares: líder do Quilombo dos Palmares (século XVII). Para aulas do Fundamental II ao Médio: trabalhe o contexto da escravidão, formas de resistência e a importância dos quilombos. Sugestão: análise de documentos históricos e debate sobre memória.";
            } else if (lowerPrompt.includes("outros") || lowerPrompt.includes("líderes")) {
                fallbackResponse = "Outros líderes da resistência negra: Dandara, Aqualtune, Luísa Mahin, Luiz Gama, Carolina Maria de Jesus. Atividade: pesquisa biográfica comparativa, destacando diferentes formas de resistência (quilombos, imprensa, literatura).";
            }
        } catch (e) {
            // Ignora erro de parse
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