// netlify/functions/gemini-proxy.js
// VERSÃO 4.2: Final. Corrige ordem dos IFs e o erro "systemInstruction" da API Gemini.

exports.handler = async (event, context) => {
    console.log("=== JOÃO IA - SISTEMA ATIVO (v4.2 - FINAL) ===");
    
    // Configurações da API Gemini
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    const API_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;
    
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
        
        // ===================================
        // ========== 2. RESPOSTAS RÁPIDAS (Lógica Prioritária) ==========
        // ===================================
        
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
        
        // CORREÇÃO DE ORDEM (1): Regra mais específica deve vir antes da mais genérica.
        // Se perguntar sobre outros líderes (Inclui Zumbi na pergunta)
        if (lower.includes("outros líderes") || lower.includes("outras figuras") || 
            lower.includes("além de zumbi") || lower.includes("também")) {
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    status: "success",
                    resposta: "Além de Zumbi, destacam-se: Dandara (guerreira de Palmares), Luiza Mahin (Revolta dos Malês), Luiz Gama (abolicionista), e Carolina Maria de Jesus (escritora). Todos são essenciais para atender à Lei 10.639/2003. Sugestão: Crie um projeto 'Biografias da Resistência' para Ensino Fundamental II/Médio."
                })
            };
        }
        
        // CORREÇÃO DE ORDEM (2): Regra genérica sobre Zumbi
        if (lower.includes("zumbi")) {
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    status: "success",
                    resposta: "Zumbi: líder do Quilombo dos Palmares (século XVII). Para aulas: contação de histórias (Fundamental I), análise de documentos (Fundamental II), debate sobre memória histórica (Médio). Recurso: documentário 'Quilombo' (1984)."
                })
            };
        }

        // Outros temas
        if (lower.includes("lei 10.639") || lower.includes("lei 10639")) {
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    status: "success",
                    resposta: "Lei 10.639/2003: ensino obrigatório da cultura afro-brasileira. Implementação: formação docente, materiais inclusivos, projetos interdisciplinares. Recurso: Coleção História Geral da África (UNESCO)."
                })
            };
        }
        
        if (lower.includes("capoeira")) {
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    status: "success",
                    resposta: "Capoeira: arte marcial afro-brasileira. Para aula: contextualização histórica (diáspora africana), oficina prática (movimentos básicos), discussão sobre patrimônio cultural imaterial."
                })
            };
        }
        
        if (lower.includes("umbanda") || lower.includes("candomblé") || lower.includes("candomble")) {
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    status: "success",
                    resposta: "Religiões afro-brasileiras: abordagem com respeito à diversidade religiosa. Atividade: estudo da influência na cultura brasileira (música, culinária, festas). Recurso: livro 'Orixás' de Pierre Verger."
                })
            };
        }
        
        // ===================================
        // ========== 3. FALLBACK PARA GOOGLE GEMINI (VIA fetch) ==========
        // ===================================

        // 1. Definição da Persona (System Instruction)
        const systemInstruction = `Você é o João, um assistente pedagógico especializado no ensino de cultura afro-brasileira e na Lei 10.639/2003. Seja didático, objetivo e forneça exemplos de aplicação em sala de aula (ex: Fundamental I, Fundamental II, Ensino Médio).`;

        // 2. Montagem do Corpo da Requisição (CORRIGIDO: 'systemInstruction' movido e renomeado para 'system_instruction')
        const requestBody = {
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            system_instruction: systemInstruction, // <--- CORREÇÃO APLICADA AQUI
            generationConfig: { 
                temperature: 0.7 
            }
        };

        // 3. Chamada à API
        const fetchResponse = await fetch(API_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody)
        });

        const apiData = await fetchResponse.json();

        // 4. Tratamento de Erro da API
        if (!fetchResponse.ok || apiData.error) {
            console.error("💥 Erro da API Gemini:", apiData.error ? (apiData.error.message || fetchResponse.statusText) : fetchResponse.statusText);
            
            // Retorna a sugestão de formatação como fallback em caso de falha da API
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    status: "success",
                    resposta: "Desculpe, a IA está indisponível. Tente novamente em instantes ou utilize as palavras-chave (Zumbi, Capoeira, Lei 10.639) para uma resposta rápida."
                })
            };
        }

        // 5. Extração da Resposta
        const iaResposta = apiData.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "Não foi possível extrair a resposta da IA.";

        console.log("✅ Resposta Gemini:", iaResposta.substring(0, 100) + "...");

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                status: "success",
                resposta: iaResposta 
            })
        };

    } catch (error) {
        // Erro genérico na execução da função (ex: JSON mal formatado)
        console.error("💥 Erro capturado na função:", error.message);
        
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
                status: "error", 
                resposta: "Desculpe, houve um erro interno na função. Tente novamente." 
            })
        };
    }
};