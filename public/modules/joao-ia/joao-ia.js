// ========== MÓDULO JOÃO IA - JAVASCRIPT COMPLETO ==========
(function(global, document) {
    'use strict';
    
    // ========== FUNÇÕES AUXILIARES JOÃO IA ==========
    // Função para REMOVER o indicador de digitação
    function hideTypingIndicator() {
        const typingIndicator = document.querySelector('.joao-ia-typing');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }

    // Função para MOSTRAR o indicador de digitação
    function showTypingIndicator() {
        // Remove qualquer typing indicator existente primeiro
        hideTypingIndicator();
        
        const typingDiv = document.createElement('div');
        typingDiv.className = 'joao-ia-typing';
        typingDiv.innerHTML = `
            <div class="joao-ia-typing-dot"></div>
            <div class="joao-ia-typing-dot"></div>
            <div class="joao-ia-typing-dot"></div>
        `;
        
        const messagesContainer = document.querySelector('.joao-ia-messages');
        messagesContainer.appendChild(typingDiv);
        scrollToBottom();
    }

    // ⬇️⬇️⬇️ FUNÇÃO CORRIGIDA: scrollToBottom melhorada
    function scrollToBottom() {
        const messagesContainer = document.querySelector('.joao-ia-messages');
        if (messagesContainer) {
            // Usar setTimeout para garantir que o DOM foi atualizado
            setTimeout(() => {
                messagesContainer.scrollTop = messagesContainer.scrollHeight;
            }, 50);
            
            // Backup: tentar novamente após um breve delay
            setTimeout(() => {
                messagesContainer.scrollTop = messagesContainer.scrollHeight;
            }, 100);
        }
    }

    // Função para adicionar mensagem do bot
    function addBotMessage(message) {
        // ⬇️⬇️⬇️ IMPORTANTE: Sempre remover o typing indicator antes de adicionar a mensagem
        hideTypingIndicator();
        
        const messagesContainer = document.querySelector('.joao-ia-messages');
        const messageDiv = document.createElement('div');
        messageDiv.className = 'joao-ia-message joao-ia-bot-message';
        messageDiv.textContent = message;
        
        messagesContainer.appendChild(messageDiv);
        
        // ⬇️⬇️⬇️ GARANTIR scroll para baixo após adicionar mensagem
        scrollToBottom();
        
        // ⬇️⬇️⬇️ BACKUP: scroll adicional após animação
        setTimeout(scrollToBottom, 200);
    }

    // Função para adicionar mensagem do usuário
    function addUserMessage(message) {
        const messagesContainer = document.querySelector('.joao-ia-messages');
        const messageDiv = document.createElement('div');
        messageDiv.className = 'joao-ia-message joao-ia-user-message';
        messageDiv.textContent = message;
        
        messagesContainer.appendChild(messageDiv);
        
        // ⬇️⬇️⬇️ GARANTIR scroll para baixo após adicionar mensagem do usuário
        scrollToBottom();
        
        // ⬇️⬇️⬇️ BACKUP: scroll adicional após animação
        setTimeout(scrollToBottom, 200);
    }

    const currentScript = document.currentScript;
    const getDataAttr = (attr) => currentScript ? currentScript.getAttribute(`data-${attr}`) : null;
    
    const JoaoIA = {
        version: '1.2.0',
        config: {},
        isInitialized: false,
        isOpen: false,
        messages: [],
        avatarLoaded: false,
        
        // Respostas padrão do bot
        botResponses: {
            'oi': 'Olá! Eu sou o João, seu assistente virtual. Como posso ajudá-lo hoje?',
            'olá': 'Olá! Eu sou o João, seu assistente virtual. Como posso ajudá-lo hoje?',
            'ola': 'Olá! Eu sou o João, seu assistente virtual. Como posso ajudá-lo hoje?',
            'ajuda': 'Posso ajudar com informações sobre educadores, estudantes, comunidade, biblioteca ou sobre nossa organização. Sobre o que você gostaria de saber?',
            'educador': 'Os educadores têm acesso a materiais didáticos, formação continuada e oportunidades de desenvolvimento. Posso abrir a página de educadores para você?',
            'estudante': 'Os estudantes têm acesso a cursos, materiais de estudo, calendário acadêmico e acompanhamento de notas. Posso abrir a página de estudantes para você?',
            'comunidade': 'A comunidade pode participar de projetos sociais, parcerias locais e eventos comunitários. Posso abrir a página da comunidade para você?',
            'biblioteca': 'A biblioteca oferece acervo digital e físico, sistema de busca, empréstimo de livros e espaço de estudo. Posso abrir a página da biblioteca para você?',
            'quem somos': 'Somos uma organização dedicada à educação e ao desenvolvimento comunitário, conectando educadores, estudantes e a comunidade. Posso abrir a página "Quem Somos" para você?',
            'contato': 'Você pode nos contatar por email: contato@somosum.org, telefone: (11) 1234-5678, ou pessoalmente na Rua da Educação, 123.',
            'horário': 'Nosso horário de atendimento é de segunda a sexta, das 8h às 18h.',
            'lei 10.639': 'A Lei 10.639/2003 torna obrigatório o ensino da História e Cultura Afro-Brasileira. Posso ajudar com materiais específicos!',
            'consciência negra': 'O Dia da Consciência Negra é 20 de novembro. Tenho materiais especiais para essa data!',
            'história da áfrica': 'Tenho diversos materiais sobre civilizações africanas. Quer explorar algum período específico?',
            'calendário': 'Posso ajudar você a encontrar eventos importantes no calendário afro-brasileiro. Que período você gostaria de ver?',
            'foto': 'Gostou da minha foto? Foi escolhida especialmente para representar nossa identidade cultural! 😊',
            'avatar': 'Este avatar me representa como assistente virtual da plataforma Somos Um!',
            'default': 'Desculpe, não entendi sua pergunta. Posso ajudar com informações sobre educadores, estudantes, comunidade, biblioteca, Lei 10.639/2003 ou sobre nossa organização.'
        },

        // Configuração Gemini AI
        geminiConfig: {
            apiKey: getDataAttr('gemini-key'),
            model: 'gemini-2.5-flash',
            apiUrl: 'https://generativelanguage.googleapis.com/v1beta/models/',
            maxTokens: 1000,
            temperature: 0.7
        },

        geminiContext: `VOCÊ DEVE RESPONDER SOMENTE COM TEXTO SIMPLES E CORRIDO. É ABSOLUTAMENTE PROIBIDO o uso de qualquer formatação Markdown, como negrito, itálico, listas, cabeçalhos (#) ou traços.

Você é o "João", o assistente virtual da plataforma Somos Um.

Sua especialidade é fornecer informações exclusivas sobre Educação, Cultura Afro-Brasileira, Desenvolvimento Comunitário e conteúdo específico da plataforma Somos Um.

REGRAS DE CONTEÚDO:
1. Responda sempre de forma curta e direta, usando as informações da Somos Um.
2. Se a pergunta for muito geral ou não relacionada à plataforma (ex: "Qual a capital da França?"), você deve responder de forma cortês, dizendo: "Essa pergunta vai um pouco além dos temas da plataforma Somos Um, mas posso ajudar com informações sobre Educadores, Lei 10.639, biblioteca ou eventos da nossa comunidade."`,

        // ========== MÉTODOS GEMINI ==========
        initGemini: function(apiKey) {
            const finalApiKey = apiKey || this.geminiConfig.apiKey || this.config.geminiApiKey;
            
            if (!finalApiKey) {
                console.warn('❌ Chave da API Gemini não fornecida');
                return false;
            }
            
            this.geminiConfig.apiKey = finalApiKey;
            console.log('✅ Gemini AI configurado');
            return true;
        },

        sendToGemini: async function(message, conversationHistory = []) {
            if (!this.geminiConfig.apiKey) {
                throw new Error('Gemini API não configurada. Use JoaoIA.setGeminiApiKey()');
            }
        
            // LINHA CORRIGIDA (mudando 'v1' para 'v1beta'):
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.geminiConfig.model}:generateContent?key=${this.geminiConfig.apiKey}`;
            
            const historyContext = conversationHistory.slice(-6).map(msg => ({
                role: msg.isUser ? 'user' : 'model',
                parts: [{ text: msg.text }]
            }));
        
            const requestBody = {
                contents: [
                    { 
                        role: 'user', 
                        parts: [{ text: this.geminiContext }] 
                    },
                    ...historyContext,
                    { 
                        role: 'user', 
                        parts: [{ text: message }] 
                    }
                ],
                generationConfig: {
                    temperature: this.geminiConfig.temperature,
                    maxOutputTokens: this.geminiConfig.maxTokens,
                    topP: 0.8,
                    topK: 40
                },
                safetySettings: [
                    { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
                    { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
                    { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
                    { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" }
                ]
            };
        
            try {
                console.log('🔄 Enviando para Gemini...', { url: url.split('?key=')[0] + '?key=***' });
                
                const response = await fetch(url, {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(requestBody)
                });
        
                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    console.error('❌ Resposta da API:', response.status, errorData);
                    
                    if (response.status === 404) {
                        throw new Error('URL da API Gemini incorreta. Verifique a documentação.');
                    } else if (response.status === 400) {
                        throw new Error('Requisição inválida. Verifique o formato dos dados.');
                    } else if (response.status === 403) {
                        throw new Error('Chave API inválida ou sem permissões.');
                    } else {
                        throw new Error(`Erro ${response.status}: ${errorData.error?.message || 'Erro desconhecido'}`);
                    }
                }
        
                const data = await response.json();
                
                if (data.candidates && data.candidates[0] && data.candidates[0].content) {
                    return data.candidates[0].content.parts[0].text;
                } else {
                    console.warn('⚠️ Resposta inesperada da API:', data);
                    throw new Error('Resposta inesperada da API Gemini');
                }
                
            } catch (error) {
                console.error('❌ Erro na API Gemini:', error);
                
                // 🆕 DETALHES DO ERRO PARA DEBUG
                if (error.message.includes('Failed to fetch')) {
                    throw new Error('Erro de rede. Verifique sua conexão ou CORS.');
                } else if (error.message.includes('404')) {
                    throw new Error('Endpoint da API não encontrado. URL pode estar desatualizada.');
                } else {
                    throw error;
                }
            }
        },

        processWithGemini: async function(message, typingIndicator) {
            try {
                console.log('🤖 Processando com Gemini:', message.substring(0, 50) + '...');
                const response = await this.sendToGemini(message, this.messages);
                typingIndicator.remove();
                
                if (response && response.trim()) {
                    this.addMessage(response);
                } else {
                    throw new Error('Resposta vazia do Gemini');
                }
                
            } catch (error) {
                typingIndicator.remove();
                console.error('🚨 Erro no Gemini:', error);
                
                // 🆕 MENSAGEM DE ERRO MAIS INFORMATIVA
                let errorMessage = '🔧 Estou com instabilidade técnica. ';
                
                if (error.message.includes('404') || error.message.includes('URL da API')) {
                    errorMessage += 'Problema de conexão com a API. ';
                } else if (error.message.includes('403') || error.message.includes('Chave API')) {
                    errorMessage += 'Problema com a chave de API. ';
                } else if (error.message.includes('rede') || error.message.includes('CORS')) {
                    errorMessage += 'Problema de rede. ';
                }
                
                errorMessage += 'Usando meu modo local...';
                this.addMessage(errorMessage);
                
                // ⬇️⬇️⬇️ CORREÇÃO: Chamar processUserMessageLocal SEM criar novo typing
                this.processUserMessageLocal(message);
            }
        },

        // 🆕 ADICIONE ESTE MÉTODO PARA VERIFICAR A CHAVE
        verifyApiKey: async function() {
            if (!this.geminiConfig.apiKey) {
                return { valid: false, error: 'Chave não configurada' };
            }
            
            // Teste simples da API
            const testUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${this.geminiConfig.apiKey}`;
            const testBody = {
                contents: [{ parts: [{ text: "Teste de conexão" }] }]
            };
            
            try {
                const response = await fetch(testUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(testBody)
                });
                
                if (response.status === 200) {
                    return { valid: true, message: '✅ Chave API válida' };
                } else if (response.status === 403) {
                    return { valid: false, error: '❌ Chave API inválida ou sem permissões' };
                } else if (response.status === 404) {
                    return { valid: false, error: '❌ URL da API incorreta' };
                } else {
                    return { valid: false, error: `❌ Erro ${response.status}` };
                }
            } catch (error) {
                return { valid: false, error: `❌ Erro de rede: ${error.message}` };
            }
        },

        getGeminiStatus: function() {
            return {
                configured: !!this.geminiConfig.apiKey,
                model: this.geminiConfig.model,
                hasApiKey: !!this.geminiConfig.apiKey
            };
        },

        // ========== MÉTODOS PRINCIPAIS ==========
        init: function(userConfig = {}) {
            if (this.isInitialized) {
                console.warn('João IA já está inicializado');
                return;
            }
            
            this.config = {
                container: document.body,
                locale: 'pt-BR',
                botName: getDataAttr('bot-name') || 'João IA',
                storageKey: 'joaoIA_conversation',
                enableLocalPersistence: true,
                maxHistory: 100,
                theme: getDataAttr('theme') || 'auto',
                position: getDataAttr('position') || 'bottom-right',
                avatarUrl: getDataAttr('avatar-url') || null,
                useImgTag: getDataAttr('use-img-tag') === 'true' || false,
                geminiApiKey: getDataAttr('gemini-key') || null,
                ...userConfig,
                backend: { ...userConfig.backend },
                callbacks: {
                    onMessage: () => {}, onOpen: () => {}, onClose: () => {},
                    onError: () => {}, onEventsFound: () => {},
                    onAvatarLoad: () => {}, onAvatarError: () => {},
                    ...userConfig.callbacks
                }
            };

            if (this.config.geminiApiKey) {
                this.initGemini();
            }
            
            this.createWidget();
            this.loadHistory();
            this.setupEventListeners();
            this.applyTheme();
            this.preloadAvatar();

            this.isInitialized = true;
            console.log(`🚀 João IA v${this.version} inicializado`);
        },

        getAvatarUrl: function() {
            if (this.config.avatarUrl) {
                return this.config.avatarUrl;
            }
            
            const moduleBasePath = this.getModuleBasePath();
            return `${moduleBasePath}/assets/images/joao-avatar.png`;
        },

        getModuleBasePath: function() {
            if (currentScript) {
                const scriptPath = currentScript.src;
                const basePath = scriptPath.substring(0, scriptPath.lastIndexOf('/'));
                return basePath;
            }
            return './modules/joao-ia';
        },

        preloadAvatar: function() {
            const avatarUrl = this.getAvatarUrl();
            if (!avatarUrl) return;
            
            const img = new Image();
            img.onload = () => {
                this.avatarLoaded = true;
                this.config.callbacks.onAvatarLoad(avatarUrl);
                console.log('✅ Avatar carregado:', avatarUrl);
            };
            img.onerror = () => {
                console.warn('❌ Avatar não carregado:', avatarUrl);
                this.config.callbacks.onAvatarError(avatarUrl);
            };
            img.src = avatarUrl;
        },
        
        createWidget: function() {
            const container = document.createElement('div');
            container.className = 'joao-ia-container';
            
            const avatarUrl = this.getAvatarUrl();
            const useImgTag = this.config.useImgTag;
            
            let avatarHTML = '';
            if (useImgTag && avatarUrl) {
                avatarHTML += `<div class="joao-ia-avatar" style="${useImgTag && avatarUrl ? 'display: none;' : ''}${!useImgTag && avatarUrl ? `background-image: url('${avatarUrl}')` : ''}"></div>`;
            }
            
            avatarHTML += `<div class="joao-ia-avatar" style="${useImgTag && avatarUrl ? 'display: none;' : ''}${!useImgTag && avatarUrl ? `background-image: url('${avatarUrl}')` : ''}">J</div>`;
            
            container.innerHTML = `
                <button class="joao-ia-toggle" aria-label="Abrir chat com João">
                    <i class="fas fa-comments"></i>
                </button>
                <div class="joao-ia-window">
                    <div class="joao-ia-header">
                        <h3>
                            ${avatarHTML}
                            ${this.config.botName} - Assistente Virtual
                        </h3>
                        <button class="joao-ia-close" aria-label="Fechar chat">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="joao-ia-messages"></div>
                    <div class="joao-ia-input-area">
                        <input type="text" class="joao-ia-input" placeholder="Digite sua mensagem..." aria-label="Digite sua mensagem">
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
                avatarImg: container.querySelector('.joao-ia-avatar-img')
            };
            
            if (this.config.position === 'bottom-left') {
                this.elements.container.style.right = 'auto';
                this.elements.container.style.left = '30px';
                this.elements.window.style.right = 'auto';
                this.elements.window.style.left = '0';
            }
        },
        
        setupEventListeners: function() {
            this.elements.toggle.addEventListener('click', () => this.open());
            this.elements.close.addEventListener('click', () => this.close());
            this.elements.send.addEventListener('click', () => this.sendUserMessage());
            
            this.elements.input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.sendUserMessage();
                }
            });
            
            document.addEventListener('click', (e) => {
                if (this.isOpen && !this.elements.container.contains(e.target)) {
                    this.close();
                }
            });
            
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && this.isOpen) {
                    this.close();
                }
            });
        },
        
        open: function() {
            this.elements.window.style.display = 'flex';
            this.elements.input.focus();
            this.isOpen = true;
            this.config.callbacks.onOpen();
            
            // ⬇️⬇️⬇️ GARANTIR scroll para baixo ao abrir o chat
            setTimeout(() => {
                this.scrollToBottom();
            }, 300);
        },
        
        close: function() {
            this.elements.window.style.display = 'none';
            this.isOpen = false;
            this.config.callbacks.onClose();
        },
        
        sendUserMessage: function() {
            const message = this.elements.input.value.trim();
            if (message) {
                this.addMessage(message, true);
                this.elements.input.value = '';
                this.config.callbacks.onMessage(message);
                
                const typingIndicator = this.showTypingIndicator();
                
                // ⬇️⬇️⬇️ CORREÇÃO: Passar o typingIndicator para processUserMessage
                this.processUserMessage(message, typingIndicator);
            }
        },
        
        sendMessage: function(text) {
            if (text && typeof text === 'string') {
                this.addMessage(text, true);
                this.processUserMessage(text);
            }
        },
        
        addMessage: function(text, isUser = false) {
            const messageDiv = document.createElement('div');
            messageDiv.className = `joao-ia-message ${isUser ? 'joao-ia-user-message' : 'joao-ia-bot-message'}`;
            messageDiv.textContent = text;
            this.elements.messages.appendChild(messageDiv);
            
            if (this.config.enableLocalPersistence) {
                this.messages.push({
                    text: text,
                    isUser: isUser,
                    timestamp: new Date().toISOString()
                });
                this.saveHistory();
            }
            
            // ⬇️⬇️⬇️ CHAMADA CORRIGIDA: Usar o método scrollToBottom do módulo
            this.scrollToBottom();
        },
        
        showTypingIndicator: function() {
            const typingDiv = document.createElement('div');
            typingDiv.className = 'joao-ia-typing';
            typingDiv.innerHTML = `
                <div class="joao-ia-typing-dot"></div>
                <div class="joao-ia-typing-dot"></div>
                <div class="joao-ia-typing-dot"></div>
            `;
            this.elements.messages.appendChild(typingDiv);
            
            // ⬇️⬇️⬇️ CHAMADA CORRIGIDA: Usar o método scrollToBottom do módulo
            this.scrollToBottom();
            
            return typingDiv;
        },
        
        // ⬇️⬇️⬇️ MÉTODO ADICIONADO: scrollToBottom do módulo
        scrollToBottom: function() {
            if (this.elements && this.elements.messages) {
                // Usar múltiplos timeouts para garantir o scroll
                setTimeout(() => {
                    this.elements.messages.scrollTop = this.elements.messages.scrollHeight;
                }, 0);
                
                setTimeout(() => {
                    this.elements.messages.scrollTop = this.elements.messages.scrollHeight;
                }, 100);
                
                setTimeout(() => {
                    this.elements.messages.scrollTop = this.elements.messages.scrollHeight;
                }, 300);
            }
        },
        
        processUserMessageLocal: function(message) {
            const lowerMessage = message.toLowerCase();
            
            if (lowerMessage.includes('foto') || lowerMessage.includes('avatar') || lowerMessage.includes('imagem')) {
                const response = this.botResponses.foto || this.botResponses.avatar;
                this.addMessage(response);
                return;
            }
            
            let response = this.botResponses.default;
            for (const [key, value] of Object.entries(this.botResponses)) {
                if (key !== 'default' && lowerMessage.includes(key)) {
                    response = value;
                    break;
                }
            }
            
            this.addMessage(response);
        },
        
        processUserMessage: function(message, typingIndicator) {
            const lowerMessage = message.toLowerCase();
            
            if (this.geminiConfig.apiKey) {
                // ⬇️⬇️⬇️ CORREÇÃO: Usar o typingIndicator já criado
                this.processWithGemini(message, typingIndicator);
                return;
            }
            
            // ⬇️⬇️⬇️ CORREÇÃO: Remover typing indicator para respostas locais
            if (typingIndicator) {
                typingIndicator.remove();
            }
            
            // ⬇️⬇️⬇️ CHAMAR processUserMessageLocal
            this.processUserMessageLocal(message);
        },
        
        saveHistory: function() {
            if (!this.config.enableLocalPersistence) return;
            
            if (this.messages.length > this.config.maxHistory) {
                this.messages = this.messages.slice(-this.config.maxHistory);
            }
            
            try {
                localStorage.setItem(this.config.storageKey, JSON.stringify(this.messages));
            } catch (error) {
                console.warn('Não foi possível salvar o histórico:', error);
            }
        },
        
        loadHistory: function() {
            if (!this.config.enableLocalPersistence) return;
            
            try {
                const saved = localStorage.getItem(this.config.storageKey);
                if (saved) {
                    this.messages = JSON.parse(saved);
                    this.messages.forEach(msg => {
                        this.addMessage(msg.text, msg.isUser);
                    });
                    
                    // ⬇️⬇️⬇️ GARANTIR scroll para baixo após carregar histórico
                    setTimeout(() => {
                        this.scrollToBottom();
                    }, 500);
                }
            } catch (error) {
                console.warn('Não foi possível carregar o histórico:', error);
            }
        },
        
        clearHistory: function() {
            this.messages = [];
            this.elements.messages.innerHTML = '';
            
            if (this.config.enableLocalPersistence) {
                try {
                    localStorage.removeItem(this.config.storageKey);
                } catch (error) {
                    console.warn('Não foi possível limpar o histórico:', error);
                    return false;
                }
            }
            
            this.addMessage(this.botResponses.oi);
            return true;
        },
        
        updateAvatar: function(newAvatarUrl) {
            if (!newAvatarUrl) return false;
            
            this.config.avatarUrl = newAvatarUrl;
            
            if (this.elements.avatarImg) {
                this.elements.avatarImg.src = newAvatarUrl;
                this.elements.avatarImg.style.display = 'block';
                if (this.elements.avatar) {
                    this.elements.avatar.style.display = 'none';
                }
            } else if (this.elements.avatar) {
                this.elements.avatar.style.backgroundImage = `url('${newAvatarUrl}')`;
            }
            
            this.preloadAvatar();
            return true;
        },
        
        applyTheme: function() {
            const themes = ['joao-ia-theme-light', 'joao-ia-theme-dark', 'joao-ia-theme-high-contrast'];
            
            themes.forEach(theme => {
                this.elements.container.classList.remove(theme);
            });
            
            if (this.config.theme === 'auto') {
                if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
                    this.elements.container.classList.add('joao-ia-theme-dark');
                }
            } else if (this.config.theme !== 'light') {
                this.elements.container.classList.add(`joao-ia-theme-${this.config.theme}`);
            }
        },
        
        updateConfig: function(newConfig) {
            const oldConfig = { ...this.config };
            this.config = { ...this.config, ...newConfig };
            
            if (newConfig.theme !== oldConfig.theme) {
                this.applyTheme();
            }
            
            if (newConfig.avatarUrl && newConfig.avatarUrl !== oldConfig.avatarUrl) {
                this.updateAvatar(newConfig.avatarUrl);
            }

            if (newConfig.geminiApiKey && newConfig.geminiApiKey !== this.geminiConfig.apiKey) {
                this.setGeminiApiKey(newConfig.geminiApiKey);
            }
        },
        
        getAvatarStatus: function() {
            return {
                loaded: this.avatarLoaded,
                url: this.getAvatarUrl(),
                usingFallback: !this.avatarLoaded
            };
        },
        
        destroy: function() {
            if (this.elements.container && this.elements.container.parentNode) {
                this.elements.container.parentNode.removeChild(this.elements.container);
            }
            this.isInitialized = false;
            this.isOpen = false;
            this.avatarLoaded = false;
        }
    };
    
    if (getDataAttr('auto-init') !== 'false') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(() => JoaoIA.init(), 100);
        });
    }
    
    global.JoaoIA = JoaoIA;
    
})(window, document);