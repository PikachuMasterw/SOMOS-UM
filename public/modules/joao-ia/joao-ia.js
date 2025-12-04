// ========== MÓDULO JOÃO IA - VERSÃO COM BANCO DE DADOS EXPANDIDO ==========
(function(global, document) {
    'use strict';
    
    // ========== CONFIGURAÇÕES GLOBAIS ==========
    const NETLIFY_ENDPOINT = '/api/gemini';
    const REQUEST_TIMEOUT = 15000;
    
    // ========== FUNÇÕES AUXILIARES ==========
    function hideTypingIndicator() {
        const typingIndicator = document.querySelector('.joao-ia-typing');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }
    
    function showTypingIndicator() {
        hideTypingIndicator();
        
        const messagesContainer = document.querySelector('.joao-ia-messages');
        if (!messagesContainer) return null;
        
        const typingDiv = document.createElement('div');
        typingDiv.className = 'joao-ia-typing';
        typingDiv.innerHTML = `
            <div class="joao-ia-typing-dot"></div>
            <div class="joao-ia-typing-dot"></div>
            <div class="joao-ia-typing-dot"></div>
        `;
        
        messagesContainer.appendChild(typingDiv);
        return typingDiv;
    }
    
    // Função para converter markdown simples
    function convertMarkdown(text) {
        if (!text) return '';
        
        let html = text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/### (.*?)\n/g, '<h3>$1</h3>')
            .replace(/## (.*?)\n/g, '<h2>$1</h2>')
            .replace(/# (.*?)\n/g, '<h1>$1</h1>')
            .replace(/\n/g, '<br>')
            .replace(/```(.*?)```/gs, '<code>$1</code>')
            .replace(/`(.*?)`/g, '<code>$1</code>')
            .replace(/\- (.*?)(\n|$)/g, '<li>$1</li>')
            .replace(/(<li>.*?<\/li>(\n|$))+/g, '<ul>$&</ul>')
            .replace(/<ul>(\s*<li>.*?<\/li>\s*)+<\/ul>/gs, function(match) {
                return match.replace(/<\/li>\s*<li>/g, '</li><li>').replace(/<ul>\s*<li>/g, '<ul><li>').replace(/<\/li>\s*<\/ul>/g, '</li></ul>');
            });
        
        return html;
    }
    
    const currentScript = document.currentScript;
    const getDataAttr = (attr) => currentScript ? currentScript.getAttribute(`data-${attr}`) : null;
    
    // ========== CLASSE PRINCIPAL ==========
    const JoaoIA = {
        version: '3.2.0',
        config: {},
        isInitialized: false,
        isOpen: false,
        messages: [],
        
        // BANCO DE DADOS LOCAL EXPANDIDO - PLATAFORMA SOMOS UM
        botResponses: {
            // SAUDAÇÕES
            'oi': '### 👋 Olá! Eu sou o **João**, seu assistente virtual!\n\n**Sobre a plataforma "Somos Um - Cultura Afro-Brasileira":**\n\n📚 **Missão:** Congregar artigos científicos consagrados e novas publicações sobre história e cultura afro-brasileira.\n\n🎯 **Objetivo:** Servir como espaço virtual de alta qualidade acadêmica para estudo, promoção e disseminação da Lei 10.639/03.\n\n**Como posso ajudá-lo hoje?**\n- 📖 Informações sobre a plataforma\n- 👨‍🏫 Recursos para educadores\n- 🎓 Materiais para estudantes\n- ⚖️ Conteúdo sobre Lei 10.639/03\n- 📚 Acesso à biblioteca digital',
            
            // AJUDA GERAL
            'ajuda': '### 💡 **MENU DE AJUDA - PLATAFORMA SOMOS UM**\n\n**📋 MÓDULOS DISPONÍVEIS:**\n\n1. **👨‍🏫 MÓDULO EDUCADOR**\n   • Plano de Aula IA (Assistente João IA)\n   • Calendário de Datas Cívicas\n   • Central de Downloads\n   • Cartilha: "Heróis e Heroínas Negras"\n\n2. **🎓 MÓDULO ESTUDANTE**\n   • Módulos de Estudo temáticos\n   • Rastreamento de Progresso\n   • Quiz & Testes para vestibular\n   • Glossário & Referências\n\n3. **📚 BIBLIOTECA DIGITAL**\n   • Livros, Artigos, Vídeos\n   • Sistema de busca e filtro\n   • Categorias: história, religião, literatura, arte\n\n4. **👥 MÓDULO COMUNIDADE**\n   • Feed de Posts\n   • Mural de Eventos\n   • Conexões com outros módulos\n\n**Digite o número ou nome do módulo para saber mais!**',
            
            // MÓDULO EDUCADOR
            'educador': '### 👨‍🏫 **MÓDULO EDUCADOR - Funcionalidades**\n\n**🎯 Público-Alvo:** Professores e profissionais de ensino\n\n**🛠️ Recursos Principais:**\n\n1. **📋 Plano de Aula IA**\n   • Auxílio na criação e melhoria de planos\n   • Suporte pedagógico prático\n   • Integração com Lei 10.639/03\n\n2. **📅 Calendário de Datas Cívicas**\n   • Datas importantes da cultura afro-brasileira\n   • Personalização de eventos\n   • Recarregamento automático\n\n3. **💾 Central de Downloads**\n   • Materiais didáticos prontos\n   • Cartilhas educativas\n   • Recursos multimídia\n\n4. **🚀 Em Desenvolvimento:**\n   • Materiais da Comunidade\n   • Linha do Tempo Interativa',
            
            // MÓDULO ESTUDANTE
            'estudante': '### 🎓 **MÓDULO ESTUDANTE - Recursos**\n\n**🎯 Público-Alvo:** Estudantes de todos os níveis\n\n**📚 Funcionalidades:**\n\n1. **🗂️ Módulos de Estudo**\n   • Temas: "historia-africa", "resistencia", "literatura", "cultura", "diáspora"\n   • Sistema de rastreamento de progresso\n   • Percentuais de conclusão simulados\n\n2. **🧠 Quiz & Testes**\n   • Preparação para vestibular\n   • Perguntas de exames anteriores\n   • Teste sobre Lei 10.639/03\n\n3. **📖 Glossário & Referências**\n   • Termos históricos importantes\n   • Autores-chave: Abdias do Nascimento, Lélia Gonzalez\n   • Bibliografia especializada\n\n**Progresso salvo automaticamente!**',
            
            // LEI 10.639
            'lei 10.639': '### ⚖️ **LEI 10.639/2003 - Detalhamento**\n\n**📜 Sobre a Legislação:**\nAltera a Lei nº 9.394 para incluir no currículo oficial a obrigatoriedade da temática **"História e Cultura Afro-Brasileira"**.\n\n**🎯 Objetivos Principais:**\n\n1. **Promover igualdade racial** no ambiente educacional\n2. **Valorizar a cultura afro-brasileira** e suas contribuições\n3. **Combater discriminação** e preconceito\n4. **Formar cidadãos conscientes** da diversidade brasileira\n\n**📋 Implementação na Plataforma:**\n• Conteúdo especializado em todos os módulos\n• Materiais didáticos alinhados à lei\n• Formação continuada para educadores\n• Recursos para estudantes\n\n**ℹ️ A plataforma "Somos Um" é totalmente alinhada com esta legislação.**',
            
            // BIBLIOTECA DIGITAL
            'biblioteca': '### 📚 **BIBLIOTECA DIGITAL - Repositório Central**\n\n**🎯 Função:** Repositório principal e consultivo de toda produção acadêmica\n\n**👥 Público:** Estudantes, Educadores, Pesquisadores, Comunidade\n\n**📂 Conteúdo Indexado:**\n\n• **Livros** (ex: "Quarto de Despejo" - Literatura)\n• **Artigos científicos**\n• **Vídeos educativos**\n• **Materiais de Referência**\n\n**🔍 Sistema de Busca:**\nFiltros por:\n1. **Categoria:** história, religião, literatura, arte\n2. **Tipo:** Livro, Artigo, Vídeo, Referência\n3. **Tema:** África, Diáspora, Resistência, Cultura\n\n**📖 Exemplos no Acervo:**\n• "Quarto de Despejo" (Literatura)\n• "Religiões de Matriz Africana" (Referência)\n• Artigos sobre capoeira, culinária, música',
            
            // MÓDULO COMUNIDADE
            'comunidade': '### 👥 **MÓDULO COMUNIDADE - Interação e Engajamento**\n\n**🎯 Público:** Usuários em geral, pesquisadores, ativistas, entusiastas\n\n**💬 Funcionalidades:**\n\n1. **📱 Feed de Posts**\n   • Mural social dinâmico\n   • Postagens com texto e imagens\n   • Interações: curtidas e comentários\n   • Categorias: "Geral", "Eventos", "Arte"\n\n2. **📅 Mural de Eventos**\n   • Próximos eventos do tema\n   • Exemplos: "Mês da Consciência Negra", "Oficina de Turbantes"\n   • Informações detalhadas\n\n3. **🔗 Conexões Rápidas**\n   • Links diretos para Biblioteca\n   • Acesso ao Módulo Educador\n   • Conexão com Módulo Estudante\n\n**🌐 Promove interligação entre todas as áreas da plataforma!**',
            
            // PLATAFORMA GERAL
            'plataforma': '### 🌐 **PLATAFORMA "SOMOS UM" - Visão Geral**\n\n**🎨 Design & Estética:**\n• Paleta inspirada em **Terracota/Vermelho Queimado** (#a55734)\n• **Ouro/Amarelo** (#ffd700) como cor de destaque\n• Remete às culturas africanas\n\n**♿ Acessibilidade:**\n• Modo Escuro integrado\n• Ajustes de tamanho de fonte\n• Navegação otimizada\n\n**👤 Figuras-Chave:**\n• **Abdias do Nascimento**\n• **Lélia Gonzalez**\n• Outros autores e pesquisadores\n\n**💻 Tecnologia:**\n• JavaScript para navegação\n• Modais interativos\n• Sistema de autenticação simulado\n• Persistência de dados (localStorage)\n• Progresso salvo automaticamente',
            
            // MISSÃO
            'missão': '### 🎯 **MISSÃO DA PLATAFORMA SOMOS UM**\n\n**📚 Objetivo Central:**\nCongregar em um só local **artigos científicos já consagrados e novas publicações** sobre história e cultura afro-brasileira.\n\n**✨ Propósito:**\nAtuar como **espaço virtual de alta qualidade acadêmica** para:\n• Estudo aprofundado\n• Promoção da diversidade\n• Disseminação do conhecimento\n• Implementação da Lei 10.639/03\n\n**🤝 Valores:**\n• Excelência acadêmica\n• Inclusão e diversidade\n• Acessibilidade digital\n• Comunidade colaborativa\n\n**A plataforma é dividida em 4 módulos principais para atender diferentes necessidades.**',
            
            // AUTORES
            'autores': '### ✍️ **AUTORES E FIGURAS-CHAVE**\n\n**📖 Referências Importantes na Plataforma:**\n\n1. **Abdias do Nascimento**\n   • Ativista, político, escritor\n   • Fundador do Teatro Experimental do Negro\n   • Referência no movimento negro brasileiro\n\n2. **Lélia Gonzalez**\n   • Intelectual, professora, antropóloga\n   • Pioneira nos estudos de gênero e raça\n   • Co-fundadora do Movimento Negro Unificado\n\n3. **Outros Autores no Acervo:**\n   • Diversos pesquisadores especializados\n   • Acadêmicos da área de estudos africanos\n   • Escritores da literatura afro-brasileira\n\n**🔍 Todos estão presentes no Glossário e Referências do Módulo Estudante.**',
            
            // QUIZ
            'quiz': '### 🧠 **QUIZ & TESTES - Módulo Estudante**\n\n**🎯 Objetivo:** Preparação para vestibular e teste de conhecimento\n\n**📝 Características:**\n\n1. **Base em Exames Anteriores**\n   • Perguntas de vestibulares passados\n   • Foco em história e cultura afro-brasileira\n   • Conteúdo alinhado à Lei 10.639/03\n\n2. **Exemplo de Pergunta:**\n   *"Sobre a implementação da Lei 10.639/03, é CORRETO afirmar:"*\n   a) Apenas escolas públicas devem cumprir\n   b) Todas as escolas devem incluir no currículo\n   c) É uma sugestão, não obrigatória\n   d) Aplica-se apenas ao ensino médio\n\n   **Resposta Correta: b)**\n\n3. **Feedback Imediato**\n   • Explicações das respostas\n   • Referências bibliográficas\n   • Sugestões de estudo',
            
            // RESPOSTA PADRÃO
            'default': '### 🤔 **Vamos explorar juntos?**\n\nParece que sua pergunta ainda não está em meu banco de dados principal. Posso ajudá-lo com:\n\n**📋 TÓPICOS DISPONÍVEIS:**\n\n1. **👨‍🏫 Módulo Educador** - Recursos para professores\n2. **🎓 Módulo Estudante** - Materiais de estudo\n3. **📚 Biblioteca Digital** - Acervo completo\n4. **👥 Módulo Comunidade** - Interação\n5. **⚖️ Lei 10.639/03** - Legislação\n6. **🌐 Plataforma** - Visão geral\n7. **✍️ Autores** - Figuras-chave\n8. **🧠 Quiz** - Testes de conhecimento\n\n**Reformule sua pergunta ou escolha um desses tópicos!**'
        },
        
        // SUGESTÕES INICIAIS
        initialSuggestions: [
            '👨‍🏫 Módulo Educador',
            '🎓 Módulo Estudante', 
            '📚 Biblioteca Digital',
            '👥 Módulo Comunidade',
            '⚖️ Lei 10.639/03',
            '🌐 Sobre a plataforma',
            '🧠 Quiz & Testes'
        ],
        
        // ========== MÉTODOS PRINCIPAIS ==========
        init: function(userConfig = {}) {
            if (this.isInitialized) {
                console.warn('João IA já está inicializado');
                return;
            }
            
            this.config = {
                container: document.body,
                botName: getDataAttr('bot-name') || 'João IA',
                storageKey: 'joaoIA_conversation',
                enableLocalPersistence: true,
                maxHistory: 100,
                theme: getDataAttr('theme') || 'light',
                position: getDataAttr('position') || 'bottom-right',
                avatarUrl: getDataAttr('avatar-url') || this.getDefaultAvatarUrl(),
                useImgTag: getDataAttr('use-img-tag') === 'true' || false,
                ...userConfig
            };
            
            this.createWidget();
            this.setupEventListeners();
            this.applyTheme();
            this.loadHistory();
            
            this.isInitialized = true;
            console.log(`🚀 João IA v${this.version} inicializado - Banco de Dados Expandido`);
        },
        
        getDefaultAvatarUrl: function() {
            return './assets/images/joao-avatar.png';
        },
        
        createWidget: function() {
            const container = document.createElement('div');
            container.className = 'joao-ia-container';
            
            const avatarUrl = this.config.avatarUrl;
            const useImgTag = this.config.useImgTag;
            
            let avatarHTML = '';
            if (useImgTag) {
                avatarHTML = `<img src="${avatarUrl}" class="joao-ia-avatar-img" alt="${this.config.botName}" onerror="this.style.display='none'">`;
            } else {
                avatarHTML = `<div class="joao-ia-avatar"></div>`;
            }
            
            container.innerHTML = `
                <button class="joao-ia-toggle" aria-label="Abrir chat com ${this.config.botName}">
                    <!-- Sem ícones, apenas background-image no CSS -->
                </button>
                
                <div class="joao-ia-window">
                    <div class="joao-ia-header">
                        <div class="joao-ia-header-left">
                            ${avatarHTML}
                            <div>
                                <h3>${this.config.botName}</h3>
                                <small style="opacity: 0.8; font-size: 0.8rem;">Plataforma Somos Um</small>
                            </div>
                        </div>
                        <div class="joao-ia-header-controls">
                            <button class="joao-ia-header-btn joao-ia-theme-toggle" title="Alternar tema">
                                <i class="fas fa-moon"></i>
                            </button>
                            <button class="joao-ia-header-btn joao-ia-clear-history" title="Limpar histórico">
                                <i class="fas fa-trash-alt"></i>
                            </button>
                            <button class="joao-ia-header-btn joao-ia-close" title="Fechar chat">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                    </div>
                    
                    <div class="joao-ia-messages"></div>
                    
                    <div class="joao-ia-suggestions"></div>
                    
                    <div class="joao-ia-input-area">
                        <input type="text" class="joao-ia-input" 
                               placeholder="Digite sua mensagem..." 
                               aria-label="Digite sua mensagem">
                        <button class="joao-ia-send" aria-label="Enviar mensagem">
                            <i class="fas fa-paper-plane"></i>
                        </button>
                    </div>
                </div>
            `;
            
            this.config.container.appendChild(container);
            
            this.elements = {
                container: container,
                toggle: container.querySelector('.joao-ia-toggle'),
                window: container.querySelector('.joao-ia-window'),
                close: container.querySelector('.joao-ia-close'),
                messages: container.querySelector('.joao-ia-messages'),
                input: container.querySelector('.joao-ia-input'),
                send: container.querySelector('.joao-ia-send'),
                avatar: container.querySelector('.joao-ia-avatar'),
                avatarImg: container.querySelector('.joao-ia-avatar-img'),
                suggestions: container.querySelector('.joao-ia-suggestions'),
                themeToggle: container.querySelector('.joao-ia-theme-toggle'),
                clearHistoryBtn: container.querySelector('.joao-ia-clear-history')
            };
            
            this.applyPosition();
            this.renderSuggestions(this.initialSuggestions);
        },
        
        applyPosition: function() {
            if (this.config.position === 'bottom-left') {
                this.elements.container.style.right = 'auto';
                this.elements.container.style.left = '40px';
                this.elements.window.style.right = 'auto';
                this.elements.window.style.left = '0';
            }
        },
        
        setupEventListeners: function() {
            this.elements.toggle?.addEventListener('click', () => this.toggle());
            this.elements.close?.addEventListener('click', () => this.close());
            this.elements.send?.addEventListener('click', () => this.sendUserMessage());
            
            this.elements.input?.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.sendUserMessage();
                }
            });
            
            this.elements.themeToggle?.addEventListener('click', () => this.toggleTheme());
            this.elements.clearHistoryBtn?.addEventListener('click', () => this.clearHistory());
            
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && this.isOpen) {
                    this.close();
                }
            });
            
            // Mostrar sugestões ao focar no input
            this.elements.input?.addEventListener('focus', () => {
                if (this.elements.suggestions) {
                    this.elements.suggestions.style.display = 'flex';
                }
            });
        },
        
        toggle: function() {
            if (this.isOpen) {
                this.close();
            } else {
                this.open();
            }
        },
        
        open: function() {
            if (!this.elements.window) return;
            
            this.elements.window.style.display = 'flex';
            this.elements.toggle.classList.add('active');
            this.isOpen = true;
            
            setTimeout(() => {
                if (this.elements.input) {
                    this.elements.input.focus();
                }
            }, 300);
            
            this.scrollToBottom();
        },
        
        close: function() {
            if (!this.elements.window) return;
            
            this.elements.window.style.display = 'none';
            this.elements.toggle.classList.remove('active');
            this.isOpen = false;
        },
        
        sendUserMessage: function() {
            const message = this.elements.input?.value.trim();
            if (!message) return;
            
            this.addMessage(message, true);
            
            if (this.elements.input) {
                this.elements.input.value = '';
                this.elements.input.focus();
            }
            
            const typingIndicator = showTypingIndicator();
            
            setTimeout(() => {
                this.processUserMessage(message, typingIndicator);
            }, 500);
        },
        
        addMessage: function(text, isUser = false) {
            if (!this.elements.messages) return;
            
            const messageDiv = document.createElement('div');
            messageDiv.className = `joao-ia-message ${isUser ? 'joao-ia-user-message' : 'joao-ia-bot-message'}`;
            
            if (!isUser) {
                messageDiv.innerHTML = convertMarkdown(text);
            } else {
                messageDiv.textContent = text;
            }
            
            const timestamp = document.createElement('div');
            timestamp.className = 'joao-ia-timestamp';
            timestamp.textContent = new Date().toLocaleTimeString('pt-BR', { 
                hour: '2-digit', 
                minute: '2-digit' 
            });
            messageDiv.appendChild(timestamp);
            
            this.elements.messages.appendChild(messageDiv);
            
            if (this.config.enableLocalPersistence) {
                this.messages.push({
                    text: text,
                    isUser: isUser,
                    timestamp: new Date().toISOString()
                });
                
                if (this.messages.length > this.config.maxHistory) {
                    this.messages = this.messages.slice(-this.config.maxHistory);
                }
                
                this.saveHistory();
            }
            
            this.scrollToBottom();
        },
        
        processUserMessage: async function(message, typingIndicator) {
            hideTypingIndicator();
            
            let response;
            
            try {
                response = await this.sendToBackend(message);
            } catch (error) {
                console.error('Erro no backend:', error);
                response = this.getLocalResponse(message);
            }
            
            this.addMessage(response);
            
            // Mostrar sugestões relacionadas após resposta
            this.showRelatedSuggestions(message);
        },
        
        sendToBackend: async function(userMessage) {
            console.log('Enviando para IA...');
            
            const payload = JSON.stringify({ prompt: userMessage });
            
            try {
                const response = await fetch(NETLIFY_ENDPOINT, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: payload
                });
                
                if (!response.ok) {
                    throw new Error(`Erro ${response.status}`);
                }
                
                const data = await response.json();
                
                if (data.status === 'success' && data.resposta) {
                    return data.resposta;
                } else {
                    throw new Error('Resposta inválida');
                }
                
            } catch (error) {
                console.error('Erro na comunicação:', error);
                throw error;
            }
        },
        
        getLocalResponse: function(message) {
            const lower = message.toLowerCase();
            
            // Mapeamento de palavras-chave para respostas
            const keywordMap = {
                'lei': 'lei 10.639',
                '10.639': 'lei 10.639',
                'educador': 'educador',
                'professor': 'educador',
                'professora': 'educador',
                'docente': 'educador',
                'estudante': 'estudante',
                'aluno': 'estudante',
                'aluna': 'estudante',
                'biblioteca': 'biblioteca',
                'livro': 'biblioteca',
                'artigo': 'biblioteca',
                'acervo': 'biblioteca',
                'comunidade': 'comunidade',
                'feed': 'comunidade',
                'post': 'comunidade',
                'evento': 'comunidade',
                'plataforma': 'plataforma',
                'somos um': 'plataforma',
                'missão': 'missão',
                'objetivo': 'missão',
                'propósito': 'missão',
                'autor': 'autores',
                'escritor': 'autores',
                'abdias': 'autores',
                'lelia': 'autores',
                'gonzalez': 'autores',
                'quiz': 'quiz',
                'teste': 'quiz',
                'pergunta': 'quiz',
                'prova': 'quiz',
                'ajuda': 'ajuda',
                'help': 'ajuda',
                'socorro': 'ajuda',
                'oi': 'oi',
                'olá': 'oi',
                'ola': 'oi',
                'bom dia': 'oi',
                'boa tarde': 'oi',
                'boa noite': 'oi'
            };
            
            // Verificar cada palavra-chave
            for (const [keyword, responseKey] of Object.entries(keywordMap)) {
                if (lower.includes(keyword)) {
                    return this.botResponses[responseKey] || this.botResponses.default;
                }
            }
            
            // Resposta padrão
            return this.botResponses.default;
        },
        
        showRelatedSuggestions: function(userMessage) {
            const lower = userMessage.toLowerCase();
            let relatedSuggestions = [];
            
            if (lower.includes('educador') || lower.includes('professor')) {
                relatedSuggestions = [
                    '📋 Plano de Aula IA',
                    '📅 Calendário de Datas',
                    '💾 Central de Downloads',
                    '👨‍🏫 Voltar ao menu'
                ];
            } else if (lower.includes('estudante') || lower.includes('aluno')) {
                relatedSuggestions = [
                    '🗂️ Módulos de Estudo',
                    '🧠 Quiz & Testes',
                    '📖 Glossário',
                    '🎓 Voltar ao menu'
                ];
            } else if (lower.includes('biblioteca') || lower.includes('livro')) {
                relatedSuggestions = [
                    '🔍 Buscar Livros',
                    '📰 Artigos Científicos',
                    '🎬 Vídeos Educativos',
                    '📚 Voltar ao menu'
                ];
            } else if (lower.includes('comunidade')) {
                relatedSuggestions = [
                    '📱 Feed de Posts',
                    '📅 Mural de Eventos',
                    '🔗 Conexões Rápidas',
                    '👥 Voltar ao menu'
                ];
            } else {
                relatedSuggestions = this.initialSuggestions;
            }
            
            setTimeout(() => {
                this.renderSuggestions(relatedSuggestions);
            }, 300);
        },
        
        renderSuggestions: function(suggestions) {
            if (!this.elements.suggestions || !suggestions) return;
            
            this.elements.suggestions.innerHTML = '';
            suggestions.forEach(suggestion => {
                const chip = document.createElement('button');
                chip.className = 'joao-ia-suggestion-chip';
                chip.textContent = suggestion;
                chip.addEventListener('click', () => {
                    this.sendUserSuggestion(suggestion);
                });
                this.elements.suggestions.appendChild(chip);
            });
            
            this.elements.suggestions.style.display = 'flex';
        },
        
        hideSuggestions: function() {
            if (this.elements.suggestions) {
                this.elements.suggestions.style.display = 'none';
            }
        },
        
        sendUserSuggestion: function(suggestion) {
            if (this.elements.input) {
                this.elements.input.value = suggestion;
                this.sendUserMessage();
            }
        },
        
        scrollToBottom: function() {
            if (!this.elements.messages) return;
            
            requestAnimationFrame(() => {
                this.elements.messages.scrollTop = this.elements.messages.scrollHeight;
            });
        },
        
        applyTheme: function() {
            if (!this.elements.container) return;
            
            this.elements.container.classList.remove('joao-ia-theme-dark', 'joao-ia-theme-light');
            this.elements.container.classList.add(`joao-ia-theme-${this.config.theme}`);
            
            // Atualizar ícone do botão de tema
            if (this.elements.themeToggle) {
                const icon = this.elements.themeToggle.querySelector('i');
                if (icon) {
                    icon.className = this.config.theme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
                }
            }
        },
        
        toggleTheme: function() {
            this.config.theme = this.config.theme === 'light' ? 'dark' : 'light';
            this.applyTheme();
        },
        
        saveHistory: function() {
            if (!this.config.enableLocalPersistence) return;
            
            try {
                const data = {
                    messages: this.messages,
                    version: this.version,
                    lastUpdated: new Date().toISOString()
                };
                
                localStorage.setItem(this.config.storageKey, JSON.stringify(data));
            } catch (error) {
                console.warn('Não foi possível salvar histórico:', error);
            }
        },
        
        loadHistory: function() {
            if (!this.config.enableLocalPersistence) return;
            
            try {
                const saved = localStorage.getItem(this.config.storageKey);
                if (saved) {
                    const data = JSON.parse(saved);
                    this.messages = data.messages || [];
                    
                    this.messages.forEach(msg => {
                        this.addMessage(msg.text, msg.isUser);
                    });
                    
                    this.scrollToBottom();
                } else {
                    this.addMessage(this.botResponses.oi);
                }
            } catch (error) {
                console.warn('Erro ao carregar histórico:', error);
                this.addMessage(this.botResponses.oi);
            }
        },
        
        clearHistory: function() {
            if (!confirm('Tem certeza que deseja limpar todo o histórico de conversas?')) {
                return;
            }
            
            this.messages = [];
            this.elements.messages.innerHTML = '';
            
            try {
                localStorage.removeItem(this.config.storageKey);
            } catch (error) {
                console.warn('Erro ao limpar histórico:', error);
            }
            
            this.addMessage(this.botResponses.oi);
            
            if (this.elements.suggestions) {
                this.elements.suggestions.style.display = 'flex';
                this.renderSuggestions(this.initialSuggestions);
            }
            
            alert('Histórico limpo com sucesso!');
        },
        
        // ========== API PÚBLICA ==========
        destroy: function() {
            if (this.elements.container?.parentNode) {
                this.elements.container.parentNode.removeChild(this.elements.container);
            }
            
            this.isInitialized = false;
            this.isOpen = false;
            this.messages = [];
            
            console.log('João IA destruído');
        },
        
        updateConfig: function(newConfig) {
            Object.assign(this.config, newConfig);
            
            if (newConfig.theme) {
                this.applyTheme();
            }
        }
    };
    
    // ========== INICIALIZAÇÃO AUTOMÁTICA ==========
    if (getDataAttr('auto-init') !== 'false') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(() => {
                JoaoIA.init();
            }, 1000);
        });
    }
    
    // ========== EXPOSIÇÃO GLOBAL ==========
    global.JoaoIA = JoaoIA;
    
})(window, document);