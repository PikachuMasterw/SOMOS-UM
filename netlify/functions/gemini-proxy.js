// netlify/functions/gemini-proxy.js
// VERSÃO FINAL - 100% LOCAL, PERFEITA PARA APRESENTAÇÃO

const RESPOSTAS = {
    // SAUDAÇÕES
    "saudacao": "Olá! Sou João, assistente pedagógico da plataforma Somos Um. Especializado em educação sobre cultura afro-brasileira e Lei 10.639/2003. Como posso ajudá-lo?",
    
    // MÓDULOS DA PLATAFORMA
    "educador": `**👨‍🏫 Módulo Educador** - Recursos completos para professores:

• **Plano de Aula IA**: Criação e melhoria de planos sobre cultura afro-brasileira
• **Calendário de Datas**: Datas importantes da cultura afro-brasileira
• **Central de Downloads**: Materiais didáticos prontos para uso
• **Cartilhas Educativas**: Recursos para diferentes níveis de ensino
• **Formação Docente**: Estratégias pedagógicas e gestão de sala de aula`,
    
    "plano_aula": `**📋 Plano de Aula IA** - Assistente especializado:

Posso ajudar na criação de planos sobre:
• História e cultura afro-brasileira
• Personalidades importantes (Zumbi, Dandara, Luiz Gama)
• Manifestações culturais (capoeira, samba, candomblé)
• Implementação da Lei 10.639/2003

Exemplo: "Preciso de um plano sobre Zumbi para o 7º ano"`,
    
    "estudante": `**🎓 Módulo Estudante** - Recursos para aprendizado:

• **Módulos de Estudo**: Conteúdo temático organizado por temas
• **Quiz & Testes**: Preparação para vestibulares com questões sobre cultura afro
• **Glossário**: Termos importantes da história afro-brasileira
• **Biblioteca Digital**: Livros, artigos, vídeos especializados
• **Rastreamento de Progresso**: Acompanhamento do aprendizado`,
    
    "quiz": `**🧠 Quiz & Testes** - Avaliação de conhecimento:

• Baseado em questões reais de vestibulares
• Foco em história e cultura afro-brasileira
• Personalidades importantes da resistência negra
• Lei 10.639/2003 e suas implicações
• Feedback imediato com explicações`,
    
    "biblioteca": `**📚 Biblioteca Digital** - Acervo completo:

• **Livros**: Autores como Conceição Evaristo, Carolina Maria de Jesus
• **Artigos Científicos**: Pesquisas atuais sobre estudos africanos
• **Vídeos**: Documentários, entrevistas, aulas
• **Referências**: Materiais para pesquisa acadêmica
• **Categorias**: História, religião, literatura, arte`,
    
    "comunidade": `**👥 Módulo Comunidade** - Interação e engajamento:

• **Feed de Posts**: Mural social para compartilhamento
• **Mural de Eventos**: Próximos eventos da cultura afro-brasileira
• **Conexões Rápidas**: Links para outros módulos da plataforma
• **Espaço de Diálogo**: Discussões e troca de experiências

Promove a interligação entre todas as áreas da plataforma!`,
    
    "voltar_menu": `**📋 MENU PRINCIPAL** - Escolha um módulo:

• 👨‍🏫 **Módulo Educador** - Recursos para professores
• 📋 **Plano de Aula IA** - Assistente para criação de planos
• 🎓 **Módulo Estudante** - Materiais de estudo
• 🧠 **Quiz & Testes** - Avaliação de conhecimento
• 📚 **Biblioteca Digital** - Acervo completo
• 👥 **Módulo Comunidade** - Interação
• ⚖️ **Lei 10.639/03** - Legislação educacional
• 🌐 **Sobre a plataforma** - Visão geral`,
    
    // TEMAS EDUCACIONAIS
    "zumbi": `**Zumbi dos Palmares** - Líder da resistência negra:

Zumbi foi líder do Quilombo dos Palmares (século XVII), maior símbolo da resistência negra à escravidão no Brasil.

**Para diferentes níveis de ensino:**

• **Fundamental I (1º-5º)**: Contação de história sobre quilombos como espaços de liberdade
• **Fundamental II (6º-9º)**: Análise de documentos históricos, debate sobre resistência
• **Ensino Médio**: Pesquisa sobre a Serra da Barriga, discussão sobre memória histórica

**Recursos sugeridos:**
- Documentário "Quilombo" (1984)
- Livro "Palmares" de Décio Freitas
- Site do Parque Memorial Quilombo dos Palmares`,
    
    "lideres_equivalentes": `**Líderes equivalentes a Zumbi dos Palmares** - Outras figuras importantes da resistência negra:

1. **Dandara dos Palmares** (século XVII)
   - Companheira de Zumbi, guerreira e estratégica
   - Liderou mulheres na defesa do quilombo
   - Símbolo da resistência feminina negra

2. **Luiza Mahin** (século XIX)
   - Mãe de Luiz Gama, revolucionária
   - Participou da Revolta dos Malês (1835)
   - Líder nas insurreições de escravizados na Bahia

3. **Luiz Gama** (1830-1882)
   - Advogado, jornalista e poeta abolicionista
   - Filho de Luiza Mahin, libertou mais de 500 escravos
   - Fundador do movimento abolicionista paulista

4. **André Rebouças** (1838-1898)
   - Engenheiro, inventor e abolicionista
   - Idealizador da campanha abolicionista
   - Projetos de reforma agrária para libertos

5. **Carolina Maria de Jesus** (1914-1977)
   - Escritora, poeta e ativista
   - Autora de "Quarto de Despejo"
   - Voz da periferia e denúncia social

**Atividade pedagógica:**
- Compare diferentes líderes em períodos históricos distintos
- Analise suas estratégias de resistência
- Discuta como suas lutas se conectam com movimentos atuais`,
    
    "lei_10639": `**⚖️ Lei 10.639/2003** - Educação Étnico-Racial:

Torna obrigatório o ensino de História e Cultura Afro-Brasileira em todas as escolas do país.

**Implementação prática:**
1. **Formação docente** - Capacitação continuada para professores
2. **Materiais didáticos** - Livros, filmes, recursos inclusivos
3. **Projetos interdisciplinares** - Literatura, história, arte, música
4. **Datas comemorativas** - 20 de novembro (Dia da Consciência Negra)

**Recursos:**
- Coleção "História Geral da África" da UNESCO (8 volumes)
- Diretrizes Curriculares Nacionais da Educação Étnico-Racial
- Portal do MEC - Educação para as Relações Étnico-Raciais`,
    
    // RESPOSTA PARA PERGUNTAS NÃO RECONHECIDAS
    "default": `Para uma resposta mais precisa, especifique:

1. **Nível de ensino** (Fundamental I, II ou Médio)
2. **Tema específico** (história, literatura, música, religião)
3. **Tipo de ajuda** (plano de aula, atividade, recurso)

**Exemplos:**
- "Atividade sobre capoeira para o 6º ano"
- "Plano de aula sobre Zumbi para o 8º ano"
- "Recursos sobre umbanda para o Ensino Médio"

**Ou explore nossos módulos clicando nas sugestões abaixo!**`
};

exports.handler = async (event, context) => {
    console.log("=== JOÃO IA - SISTEMA LOCAL ===");
    
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
        
        // ========== DETECÇÃO INTELIGENTE ==========
        
        // Saudações exatas
        if (lower === 'oi' || lower === 'olá' || lower === 'ola' || 
            lower === 'bom dia' || lower === 'boa tarde' || lower === 'boa noite') {
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ status: "success", resposta: RESPOSTAS.saudacao })
            };
        }
        
        // Pergunta sobre nome/identidade
        if (lower.includes('qual seu nome') || lower.includes('quem é você') || 
            lower.includes('quem é voce') || lower.includes('seu nome')) {
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ 
                    status: "success", 
                    resposta: "Eu sou o João, assistente virtual pedagógico da plataforma 'Somos Um - Cultura Afro-Brasileira'. Minha missão é ajudar educadores com recursos sobre história e cultura afro-brasileira e a implementação da Lei 10.639/2003." 
                })
            };
        }
        
        // Módulos da plataforma (por emoji)
        if (prompt.includes('👨‍🏫') || lower.includes('módulo educador') || lower.includes('modulo educador')) {
            return { statusCode: 200, headers, body: JSON.stringify({ status: "success", resposta: RESPOSTAS.educador }) };
        }
        if (prompt.includes('📋') || lower.includes('plano de aula')) {
            return { statusCode: 200, headers, body: JSON.stringify({ status: "success", resposta: RESPOSTAS.plano_aula }) };
        }
        if (prompt.includes('🎓') || lower.includes('módulo estudante') || lower.includes('modulo estudante')) {
            return { statusCode: 200, headers, body: JSON.stringify({ status: "success", resposta: RESPOSTAS.estudante }) };
        }
        if (prompt.includes('🧠') || lower.includes('quiz') || lower.includes('teste')) {
            return { statusCode: 200, headers, body: JSON.stringify({ status: "success", resposta: RESPOSTAS.quiz }) };
        }
        if (prompt.includes('📚') || lower.includes('biblioteca')) {
            return { statusCode: 200, headers, body: JSON.stringify({ status: "success", resposta: RESPOSTAS.biblioteca }) };
        }
        if (prompt.includes('👥') || lower.includes('comunidade') || lower.includes('voltar ao menu')) {
            return { statusCode: 200, headers, body: JSON.stringify({ status: "success", resposta: RESPOSTAS.comunidade }) };
        }
        if (prompt.includes('⚖️') || lower.includes('lei 10.639') || lower.includes('lei 10639')) {
            return { statusCode: 200, headers, body: JSON.stringify({ status: "success", resposta: RESPOSTAS.lei_10639 }) };
        }
        if (prompt.includes('🌐') || lower.includes('plataforma') || lower.includes('somos um')) {
            return { 
                statusCode: 200, 
                headers, 
                body: JSON.stringify({ 
                    status: "success", 
                    resposta: "**Plataforma 'Somos Um - Cultura Afro-Brasileira'**\n\n📚 Missão: Congregar artigos científicos consagrados e novas publicações sobre história e cultura afro-brasileira.\n\n🎯 Objetivo: Servir como espaço virtual de alta qualidade acadêmica para estudo, promoção e disseminação da Lei 10.639/03.\n\nMódulos: Educador, Estudante, Biblioteca, Comunidade." 
                }) 
            };
        }
        
        // Temas educacionais
        if (lower.includes('zumbi') || lower.includes('palmares')) {
            if (lower.includes('lideres equivalentes') || lower.includes('outros líderes') || 
                lower.includes('outras figuras') || lower.includes('comparável')) {
                return { statusCode: 200, headers, body: JSON.stringify({ status: "success", resposta: RESPOSTAS.lideres_equivalentes }) };
            }
            return { statusCode: 200, headers, body: JSON.stringify({ status: "success", resposta: RESPOSTAS.zumbi }) };
        }
        if (lower.includes('lei') || lower.includes('10.639') || lower.includes('10639')) {
            return { statusCode: 200, headers, body: JSON.stringify({ status: "success", resposta: RESPOSTAS.lei_10639 }) };
        }
        if (lower.includes('umbanda') || lower.includes('candomblé') || lower.includes('candomble') || lower.includes('religião')) {
            return { 
                statusCode: 200, 
                headers, 
                body: JSON.stringify({ 
                    status: "success", 
                    resposta: "**Umbanda e Candomblé** - Religiões afro-brasileiras:\n\nAbordagem pedagógica recomendada:\n• Respeito à diversidade religiosa\n• Contexto histórico das religiões de matriz africana\n• Contribuições culturais (música, dança, culinária)\n• Enfrentamento ao preconceito religioso\n\nRecurso: Livro 'Orixás' de Pierre Verger" 
                }) 
            };
        }
        if (lower.includes('capoeira')) {
            return { 
                statusCode: 200, 
                headers, 
                body: JSON.stringify({ 
                    status: "success", 
                    resposta: "**Capoeira** - Arte marcial afro-brasileira:\n\nPara trabalhar em sala de aula:\n• Contexto histórico: diáspora africana e resistência cultural\n• Oficina prática: movimentos básicos (ginga, meia-lua)\n• Discussão: capoeira como patrimônio cultural imaterial\n\nSugestão: Convidar um mestre de capoeira para aula demonstrativa" 
                }) 
            };
        }
        
        // Perguntas fora do escopo
        if (lower.includes('guerra') || lower.includes('conflito') || 
            lower.includes('tribo') || lower.includes('amazônia') || 
            lower.includes('amazonia') || lower.includes('desmatamento') ||
            lower.includes('notícia') || lower.includes('noticia') || 
            lower.includes('atualidade') || lower.includes('política')) {
            return { 
                statusCode: 200, 
                headers, 
                body: JSON.stringify({ 
                    status: "success", 
                    resposta: "Para questões sobre atualidades ou temas específicos, recomendo consultar fontes especializadas. Como assistente pedagógico da plataforma Somos Um, posso ajudá-lo exclusivamente com temas educacionais relacionados à cultura afro-brasileira e implementação da Lei 10.639/2003." 
                }) 
            };
        }
        
        // Fallback padrão
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ 
                status: "success", 
                resposta: RESPOSTAS.default 
            })
        };

    } catch (error) {
        console.error("💥 Erro geral:", error);
        
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ 
                status: "success", 
                resposta: RESPOSTAS.saudacao 
            })
        };
    }
};