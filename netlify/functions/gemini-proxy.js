// netlify/functions/gemini-proxy.js
// VERSÃO COM IA REAL - Gemini API

const { GoogleGenerativeAI } = require("@google/generative-ai");

exports.handler = async (event, context) => {
    console.log("=== JOÃO IA - SISTEMA COM IA REAL ===");
    
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
        
        const lower = prompt.toLowerCase().trim();
        
        // ========== RESPOSTAS RÁPIDAS PARA COMANDOS ESPECÍFICOS ==========
        
        // Comandos de menu/módulos (respostas curtas)
        const modulosRapidos = {
            "👨‍🏫": "**Módulo Educador**: Recursos para professores (planos, materiais, formações).",
            "📋": "**Plano de Aula IA**: Crio planos personalizados. Me diga: nível, tema e objetivo.",
            "🎓": "**Módulo Estudante**: Conteúdos, quizzes, glossário e biblioteca.",
            "🧠": "**Quiz**: Questões sobre cultura afro-brasileira. Pronto para testar seus conhecimentos?",
            "📚": "**Biblioteca**: Livros, artigos e vídeos especializados.",
            "👥": "**Comunidade**: Espaço para troca entre educadores.",
            "⚖️": "**Lei 10.639/03**: Ensino obrigatório da cultura afro-brasileira.",
            "🌐": "**Somos Um**: Plataforma de estudos afro-brasileiros com foco na Lei 10.639."
        };
        
        // Verifica se é um comando de módulo (por emoji)
        for (const emoji in modulosRapidos) {
            if (prompt.includes(emoji)) {
                return { 
                    statusCode: 200, 
                    headers, 
                    body: JSON.stringify({ 
                        status: "success", 
                        resposta: modulosRapidos[emoji] 
                    }) 
                };
            }
        }
        
        // Comandos de texto curtos
        if (lower === "menu" || lower === "voltar" || lower === "ajuda") {
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    status: "success",
                    resposta: "**MENU**: 👨‍🏫 Educador | 📋 Plano Aula | 🎓 Estudante | 🧠 Quiz | 📚 Biblioteca | 👥 Comunidade | ⚖️ Lei 10.639"
                })
            };
        }
        
        // Saudações rápidas
        if (["oi", "olá", "ola", "bom dia", "boa tarde", "boa noite"].includes(lower)) {
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ 
                    status: "success", 
                    resposta: "Olá! Sou João, assistente da plataforma Somos Um. Como posso ajudar com cultura afro-brasileira?" 
                })
            };
        }
        
        // Identificação rápida
        if (lower.includes("qual seu nome") || lower.includes("quem é você")) {
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ 
                    status: "success", 
                    resposta: "Sou João, assistente pedagógico especializado em cultura afro-brasileira e Lei 10.639/2003." 
                })
            };
        }
        
        // ========== USAR IA REAL PARA O RESTO ==========
        
        // Configurar Gemini API
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        
        // Prompt de contexto para a IA
        const systemPrompt = `
        Você é JOÃO, assistente pedagógico da plataforma "Somos Um - Cultura Afro-Brasileira".
        
        CONTEXTO:
        - Somos uma plataforma educacional sobre história e cultura afro-brasileira
        - Foco na implementação da Lei 10.639/2003
        - Público: professores e estudantes
        
        DIRETRIZES:
        1. Seja CONCISO (máximo 4-5 linhas por resposta)
        2. Foque em ASPECTOS EDUCACIONAIS
        3. Sempre sugira RECURSOS PRÁTICOS
        4. Relacione com a LEI 10.639/2003 quando possível
        
        FORMATO PREFERIDO:
        • Tópicos curtos
        • Sugestões práticas
        • Links com educação
        
        Exemplo de resposta:
        "Para aulas sobre Zumbi no Fundamental II:
        • Analise documentos históricos
        • Debate sobre resistência
        • Recurso: documentário 'Quilombo'"
        `;
        
        // Gerar resposta com Gemini
        const chat = model.startChat({
            history: [
                {
                    role: "user",
                    parts: [{ text: systemPrompt }]
                },
                {
                    role: "model",
                    parts: [{ text: "Entendido. Sou João, assistente pedagógico especializado em cultura afro-brasileira. Vou fornecer respostas curtas e focadas na educação." }]
                }
            ],
            generationConfig: {
                maxOutputTokens: 300, // Limitar tamanho
                temperature: 0.7,
            },
        });
        
        const result = await chat.sendMessage(prompt);
        const response = await result.response;
        let respostaIA = response.text();
        
        // Garantir que a resposta seja curta
        if (respostaIA.length > 500) {
            respostaIA = respostaIA.substring(0, 497) + "...";
        }
        
        // Remover formatação excessiva se houver
        respostaIA = respostaIA.replace(/\*\*\*/g, "**");
        
        console.log("🤖 Resposta da IA gerada");
        
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ 
                status: "success", 
                resposta: respostaIA 
            })
        };

    } catch (error) {
        console.error("💥 Erro:", error);
        
        // Fallback para erros da API
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ 
                status: "success", 
                resposta: "Olá! Sou João, da plataforma Somos Um. Posso ajudar com:\n• Cultura afro-brasileira\n• Lei 10.639/2003\n• Planos de aula\n• Recursos educacionais\n\nMe pergunte algo específico!" 
            })
        };
    }
};