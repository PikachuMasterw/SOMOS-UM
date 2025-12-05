// netlify/functions/gemini-proxy.js
// VERSÃO PARA CONTA GRATUITA DO GEMINI

const API_KEY = process.env.GEMINI_API_KEY;

// MODELO GRATUITO DISPONÍVEL: gemini-1.0-pro (gratuito com limites)
const GEMINI_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.0-pro:generateContent?key=" + API_KEY;

// PROMPT SIMPLES PARA ECONOMIZAR TOKENS
const SYSTEM_PROMPT = `Você é João, assistente pedagógico da plataforma "Somos Um".
Foco: educação sobre cultura afro-brasileira e Lei 10.639/2003.
Responda de forma prática para professores.
Máximo: 150 palavras.
Sugira uma atividade para sala de aula.`;

exports.handler = async (event, context) => {
    console.log("=== JOÃO IA - CONTA GRATUITA ===");
    
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

        if (!API_KEY) {
            console.error("❌ API_KEY não configurada");
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({ 
                    status: "error", 
                    resposta: "Erro de configuração do servidor." 
                })
            };
        }
        
        const lowerPrompt = prompt.toLowerCase().trim();
        
        // ========== RESPOSTAS LOCAIS PRINCIPAIS ==========
        // Saudações
        if (lowerPrompt === 'oi' || lowerPrompt === 'olá' || lowerPrompt === 'ola') {
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ 
                    status: "success", 
                    resposta: "Olá! Sou João, assistente pedagógico da plataforma Somos Um. Especializado em educação sobre cultura afro-brasileira e Lei 10.639/2003. Como posso ajudá-lo?" 
                })
            };
        }
        
        // Sugestões do chat (emojis)
        const sugestoes = {
            '👨‍🏫': "**Módulo Educador** - Recursos para professores:\n• Plano de Aula IA: Criação de planos sobre cultura afro-brasileira\n• Calendário de Datas: Datas importantes\n• Central de Downloads: Materiais didáticos\n• Cartilhas Educativas: Para diferentes níveis",
            '📋': "**Plano de Aula IA** - Posso ajudar na criação de planos sobre:\n• História e cultura afro-brasileira\n• Personalidades importantes\n• Manifestações culturais\n• Implementação da Lei 10.639/2003",
            '🎓': "**Módulo Estudante** - Recursos para aprendizado:\n• Módulos de Estudo: Conteúdo temático\n• Quiz & Testes: Preparação para vestibulares\n• Glossário: Termos importantes\n• Biblioteca Digital: Livros, artigos, vídeos",
            '🧠': "**Quiz & Testes** - Avaliação de conhecimento:\n• Baseado em questões de vestibulares\n• Foco em história e cultura afro-brasileira\n• Personalidades importantes\n• Lei 10.639/2003",
            '📚': "**Biblioteca Digital** - Acervo completo:\n• Livros: Autores como Conceição Evaristo\n• Artigos Científicos: Pesquisas atuais\n• Vídeos: Documentários, entrevistas\n• Referências: Materiais para pesquisa",
            '⚖️': "**Lei 10.639/2003** - Torna obrigatório o ensino de história e cultura afro-brasileira.\n\nImplementação:\n1. Formação docente\n2. Materiais didáticos inclusivos\n3. Projetos interdisciplinares\n4. Datas comemorativas",
            '🌐': "**Plataforma Somos Um** - Missão:\nCongregar artigos científicos sobre história e cultura afro-brasileira.\n\nMódulos: Educador, Estudante, Biblioteca, Comunidade.\n\nFoco: Implementação da Lei 10.639/2003."
        };
        
        // Verificar se é uma sugestão (emoji)
        for (const [emoji, resposta] of Object.entries(sugestoes)) {
            if (prompt.includes(emoji)) {
                console.log(`⚡ Resposta para sugestão ${emoji}`);
                return {
                    statusCode: 200,
                    headers,
                    body: JSON.stringify({ status: "success", resposta })
                };
            }
        }
        
        // Perguntas fora do escopo
        if (lowerPrompt.includes('guerra') || lowerPrompt.includes('conflito') || 
            lowerPrompt.includes('tribo') || lowerPrompt.includes('amazônia') || 
            lowerPrompt.includes('amazonia') || lowerPrompt.includes('desmatamento')) {
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ 
                    status: "success", 
                    resposta: "Para questões sobre atualidades, recomendo fontes especializadas. Como assistente pedagógico, posso ajudá-lo com temas educacionais relacionados à cultura afro-brasileira ou Lei 10.639/2003." 
                })
            };
        }

        // ========== TENTAR GEMINI GRATUITO ==========
        console.log("🚀 Tentando Gemini 1.0 Pro (gratuito)...");
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
            console.log("⏰ Timeout após 5 segundos");
            controller.abort();
        }, 5000);

        try {
            const startTime = Date.now();
            
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
                        maxOutputTokens: 500,  // Reduzido para conta gratuita
                        topP: 0.8,
                        topK: 40
                    }
                }),
                signal: controller.signal
            });

            clearTimeout(timeoutId);
            const responseTime = Date.now() - startTime;
            console.log(`⏱️  Gemini respondeu em ${responseTime}ms`);
            console.log(`📊 Status HTTP: ${geminiResponse.status}`);

            if (geminiResponse.ok) {
                const data = await geminiResponse.json();
                console.log("✅ Gemini respondeu com sucesso");
                
                let resposta = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
                
                if (resposta && resposta.length > 30) {
                    console.log(`✍️ Resposta Gemini (${resposta.length} chars)`);
                    
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
                    console.warn("⚠️ Resposta Gemini muito curta");
                }
            } else {
                const errorText = await geminiResponse.text();
                console.error(`❌ Erro HTTP ${geminiResponse.status}:`, errorText.substring(0, 200));
            }
            
        } catch (fetchError) {
            clearTimeout(timeoutId);
            console.error("❌ Erro na chamada fetch:", fetchError.message);
        }

        // ========== FALLBACK LOCAL INTELIGENTE ==========
        console.log("🔄 Usando fallback local");
        
        // Mapeamento de palavras-chave para respostas
        if (lowerPrompt.includes('zumbi') || lowerPrompt.includes('palmares')) {
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ 
                    status: "success", 
                    resposta: `Zumbi dos Palmares foi líder do Quilombo dos Palmares (século XVII), símbolo da resistência negra.

Para aulas:
• Fundamental I: Contação de história sobre quilombos
• Fundamental II: Análise de documentos históricos  
• Ensino Médio: Debate sobre memória histórica

Recurso: Documentário "Quilombo" (1984).` 
                })
            };
        }
        
        if (lowerPrompt.includes('líder') || lowerPrompt.includes('lider') || 
            lowerPrompt.includes('equivalente') || lowerPrompt.includes('similar') ||
            lowerPrompt.includes('outros') || lowerPrompt.includes('outras')) {
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ 
                    status: "success", 
                    resposta: `Além de Zumbi, outras lideranças importantes:

1. Dandara - Guerreira de Palmares
2. Aqualtune - Princesa africana
3. Luísa Mahin - Revolta dos Malês
4. Luiz Gama - Abolicionista
5. Carolina Maria de Jesus - Escritora

Atividade: Linha do tempo da resistência negra.` 
                })
            };
        }
        
        if (lowerPrompt.includes('lei') || lowerPrompt.includes('10.639')) {
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ 
                    status: "success", 
                    resposta: `Lei 10.639/2003 obriga ensino de História e Cultura Afro-Brasileira.

Implementação:
1. Formação docente
2. Materiais didáticos inclusivos
3. Projetos interdisciplinares

Recurso: Coleção "História Geral da África" da UNESCO.` 
                })
            };
        }
        
        if (lowerPrompt.includes('umbanda') || lowerPrompt.includes('candomblé') || 
            lowerPrompt.includes('candomble') || lowerPrompt.includes('religião')) {
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ 
                    status: "success", 
                    resposta: `Umbanda é religião afro-brasileira que sincretiza elementos africanos, indígenas e cristãos.

Abordagem pedagógica:
• Respeito à diversidade religiosa
• História da perseguição
• Contribuições culturais

Cuidado: Evitar estereótipos.` 
                })
            };
        }
        
        if (lowerPrompt.includes('capoeira')) {
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ 
                    status: "success", 
                    resposta: `Capoeira é arte marcial afro-brasileira.

Para aula:
• Contexto histórico
• Oficina prática básica
• Discussão sobre resistência cultural

Sugestão: Convidar um mestre de capoeira.` 
                })
            };
        }

        // Fallback genérico
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ 
                status: "success", 
                resposta: `Para uma resposta mais precisa sobre educação afro-brasileira, especifique:

1. Nível de ensino (Fundamental I, II ou Médio)
2. Tema específico (ex: história, literatura, música)
3. Tipo de ajuda (plano de aula, atividade, recurso)

Exemplo: "Atividade sobre capoeira para o 6º ano"

Ou explore nossos módulos:
• 👨‍🏫 Módulo Educador
• 📋 Plano de Aula IA  
• 🎓 Módulo Estudante
• 📚 Biblioteca Digital` 
            })
        };

    } catch (error) {
        console.error("💥 Erro geral:", error);
        
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ 
                status: "success", 
                resposta: "Olá! Sou João, assistente pedagógico da plataforma Somos Um. Como posso ajudá-lo com educação afro-brasileira?" 
            })
        };
    }
};