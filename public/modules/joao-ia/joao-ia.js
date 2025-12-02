// ========== MÓDULO JOÃO IA - JAVASCRIPT COMPLETO (VERSÃO NETLIFY FUNCTIONS) ==========
(function(global, document) {
    'use strict';
    
    // ========== CONFIGURAÇÕES GLOBAIS ==========
    const NETLIFY_ENDPOINT = '/api/gemini';
    const REQUEST_TIMEOUT = 10000; // 10 segundos

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

    // Função para scroll automático
    function scrollToBottom() {
        const messagesContainer = document.querySelector('.joao-ia-messages');
        if (messagesContainer) {
            setTimeout(() => {
                messagesContainer.scrollTop = messagesContainer.scrollHeight;
            }, 50);
            
            setTimeout(() => {
                messagesContainer.scrollTop = messagesContainer.scrollHeight;
            }, 100);
        }
    }

    // Função para adicionar mensagem do bot
    function addBotMessage(message) {
        hideTypingIndicator();
        
        const messagesContainer = document.querySelector('.joao-ia-messages');
        const messageDiv = document.createElement('div');
        messageDiv.className = 'joao-ia-message joao-ia-bot-message';
        messageDiv.textContent = message;
        
        messagesContainer.appendChild(messageDiv);
        scrollToBottom();
        setTimeout(scrollToBottom, 200);
    }

    // Função para adicionar mensagem do usuário
    function addUserMessage(message) {
        const messagesContainer = document.querySelector('.joao-ia-messages');
        const messageDiv = document.createElement('div');
        messageDiv.className = 'joao-ia-message joao-ia-user-message';
        messageDiv.textContent = message;
        
        messagesContainer.appendChild(messageDiv);
        scrollToBottom();
        setTimeout(scrollToBottom, 200);
    }

    const currentScript = document.currentScript;
    const getDataAttr = (attr) => currentScript ? currentScript.getAttribute(`data-${attr}`) : null;
    
    const JoaoIA = {
        version: '2.2.0',
        config: {},
        isInitialized: false,
        isOpen: false,
        messages: [],
        avatarLoaded: false,
        
        // Respostas padrão do bot (fallback)
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

        // ========== MÉTODOS BACKEND SEGURO (MIGRADO PARA NETLIFY FUNCTIONS) ==========
        sendToBackend: async function(userMessage) {
            console.log('🔄 Enviando para Netlify Function (Proxy Seguro)...');
            
            // O corpo da requisição é enviado como JSON
            const payload = JSON.stringify({ prompt: userMessage });
            
            try {
                const response = await fetch(NETLIFY_ENDPOINT, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json' 
                    },
                    body: payload
                });
                
                // Se a resposta HTTP falhar (CORS resolvido, agora é um erro real 4xx/5xx)
                if (!response.ok) {
                    // Tenta ler o erro do corpo da resposta, se disponível
                    const errorData = await response.json().catch(() => ({ resposta: `Erro de rede: Status ${response.status}` }));
                    throw new Error(errorData.resposta || `Erro na comunicação (Status: ${response.status})`);
                }

                const data = await response.json();
                
                // A resposta é lida diretamente (a função retorna a string da IA)
                if (data.status === 'success' && data.resposta) {
                    console.log('✅ Resposta REAL da IA recebida');
                    return data.resposta;
                } else {
                    // Trata erros de formato da IA
                    throw new Error(`Erro na resposta do Proxy: ${data.resposta || 'Resposta inesperada'}`);
                }
                
            } catch (error) {
                console.error('🚨 Erro no backend:', error.message);
                // Fallback para a resposta local
                return this.getLocalResponse(userMessage);
            }
        },

        // Função de Fallback Local (Unificada e limpa)
        getLocalResponse: function(message) {
            const lowerMessage = message.toLowerCase();
            
            // Mantenha suas respostas locais específicas para fallback rápido:
            if (lowerMessage.includes('lei') && lowerMessage.includes('10.639')) {
                return "A Lei 10.639/2003 torna obrigatório o ensino da história e cultura afro-brasileira. Posso ajudar com materiais específicos!";
            }
            if (lowerMessage.includes('capoeira')) {
                return "A capoeira é uma expressão cultural afro-brasileira que mistura arte marcial, esporte, cultura popular, dança e música.";
            }
            
            // Resposta genérica em caso de falha do backend
            return "Recebi sua mensagem! O sistema de IA está temporariamente indisponível. Posso ajudar com informações sobre Lei 10.639/2003, capoeira ou recursos da plataforma.";
        },

        processWithBackend: async function(message, typingIndicator) {
            try {
                console.log('🤖 Processando com backend seguro...');
                const response = await this.sendToBackend(message);
                
                if (typingIndicator && typingIndicator.remove) {
                    typingIndicator.remove();
                } else {
                    hideTypingIndicator();
                }
                
                if (response && response.trim()) {
                    this.addMessage(response);
                } else {
                    throw new Error('Resposta vazia do backend');
                }
                
            } catch (error) {
                if (typingIndicator && typingIndicator.remove) {
                    typingIndicator.remove();
                } else {
                    hideTypingIndicator();
                }
                
                console.error('🚨 Erro no backend:', error);
                
                let errorMessage = '🔧 Estou com instabilidade técnica. ';
                
                if (error.message.includes('Tempo limite')) {
                    errorMessage += 'O servidor demorou para responder. ';
                } else if (error.message.includes('conexão') || error.message.includes('internet')) {
                    errorMessage += 'Problema de conexão detectado. ';
                }
                
                errorMessage += 'Usando meu modo local...';
                this.addMessage(errorMessage);
                
                // Fallback para respostas locais
                this.processUserMessageLocal(message);
            }
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
                botName: getDataAttr('bot-name') || 'João',
                storageKey: 'joaoIA_conversation',
                enableLocalPersistence: true,
                maxHistory: 100,
                theme: getDataAttr('theme') || 'auto',
                position: getDataAttr('position') || 'bottom-right',
                avatarUrl: getDataAttr('avatar-url') || null,
                useImgTag: getDataAttr('use-img-tag') === 'true' || false,
                ...userConfig,
                callbacks: {
                    onMessage: () => {}, onOpen: () => {}, onClose: () => {},
                    onError: () => {}, onEventsFound: () => {},
                    onAvatarLoad: () => {}, onAvatarError: () => {},
                    ...userConfig.callbacks
                }
            };
            
            this.createWidget();
            this.loadHistory();
            this.setupEventListeners();
            this.applyTheme();
            this.preloadAvatar();

            this.isInitialized = true;
            console.log(`🚀 João IA v${this.version} inicializado (Netlify Functions)`);
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
                avatarHTML = `<img src="${avatarUrl}" class="joao-ia-avatar-img" alt="Avatar João IA" style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover;">`;
            } else {
                avatarHTML = `<div class="joao-ia-avatar" style="${avatarUrl ? `background-image: url('${avatarUrl}')` : ''}">J</div>`;
            }
            
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
            if (this.elements.toggle) {
                this.elements.toggle.addEventListener('click', () => this.open());
            }
            if (this.elements.close) {
                this.elements.close.addEventListener('click', () => this.close());
            }
            if (this.elements.send) {
                this.elements.send.addEventListener('click', () => this.sendUserMessage());
            }
            
            if (this.elements.input) {
                this.elements.input.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        this.sendUserMessage();
                    }
                });
            }
            
            document.addEventListener('click', (e) => {
                if (this.isOpen && this.elements.container && !this.elements.container.contains(e.target)) {
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
            if (this.elements.window) {
                this.elements.window.style.display = 'flex';
                if (this.elements.input) {
                    this.elements.input.focus();
                }
                this.isOpen = true;
                this.config.callbacks.onOpen();
                
                setTimeout(() => {
                    this.scrollToBottom();
                }, 300);
            }
        },
        
        close: function() {
            if (this.elements.window) {
                this.elements.window.style.display = 'none';
                this.isOpen = false;
                this.config.callbacks.onClose();
            }
        },
        
        sendUserMessage: function() {
            const message = this.elements.input ? this.elements.input.value.trim() : '';
            if (message) {
                this.addMessage(message, true);
                if (this.elements.input) {
                    this.elements.input.value = '';
                }
                this.config.callbacks.onMessage(message);
                
                const typingIndicator = this.showTypingIndicator();
                this.processUserMessage(message, typingIndicator);
            }
        },
        
        sendMessage: function(text) {
            if (text && typeof text === 'string') {
                this.addMessage(text, true);
                const typingIndicator = this.showTypingIndicator();
                this.processUserMessage(text, typingIndicator);
            }
        },
        
        addMessage: function(text, isUser = false) {
            if (!this.elements.messages) return;
            
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
            
            this.scrollToBottom();
        },
        
        showTypingIndicator: function() {
            if (!this.elements.messages) return null;
            
            const typingDiv = document.createElement('div');
            typingDiv.className = 'joao-ia-typing';
            typingDiv.innerHTML = `
                <div class="joao-ia-typing-dot"></div>
                <div class="joao-ia-typing-dot"></div>
                <div class="joao-ia-typing-dot"></div>
            `;
            this.elements.messages.appendChild(typingDiv);
            
            this.scrollToBottom();
            
            return typingDiv;
        },
        
        scrollToBottom: function() {
            if (this.elements && this.elements.messages) {
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
            if (!this.elements.messages) return;
            
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
            // Usa o backend (Netlify Functions)
            this.processWithBackend(message, typingIndicator);
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
            if (this.elements.messages) {
                this.elements.messages.innerHTML = '';
            }
            
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
            if (!this.elements.container) return;
            
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
    
    // Inicialização automática
    if (getDataAttr('auto-init') !== 'false') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(() => {
                if (typeof JoaoIA.init === 'function') {
                    JoaoIA.init();
                }
            }, 100);
        });
    }
    
    // Expor para o global scope
    global.JoaoIA = JoaoIA;
    
})(window, document);